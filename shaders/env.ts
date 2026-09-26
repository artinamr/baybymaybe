import * as THREE from "three";

/**
 * THE PLACES' SHADERS (components/stage/Places.tsx).
 *
 *   sea      THE SKY — a sea of cumulus below: a relief-marched height field
 *            lit by a low sun, the pieces' shadows across it, a hole torn in
 *            it where the falling spiral goes through
 *   puff     a bank of cumulus (billboard) — the horizon's, and the deck's
 *   haze     inside the deck: a veil of soft, moving white (never a white-out)
 *   flat     THE SALT FLAT — a mirror of water over a hexagon-cracked salt
 *            crust; rings from the landing; the finale's word reflected
 *   flood    light pouring out of a point over the whole frame (unused)
 *
 * Every cloud reads one tileable noise texture (lib/sky.ts) — far cheaper
 * than math noise. Everything is premultiplied alpha over the paper DOM (the
 * canvas is transparent): fog is alpha, so a place melts into the page.
 */

const SEA_VERT_SRC = /* glsl */ `
varying vec3 vWorld;
varying float vDist;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vec4 mv = viewMatrix * w;
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

/* ------------------------------------------------------------------------ */
/* Billboards and full-screen quads                                          */
/* ------------------------------------------------------------------------ */

const CARD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FLOOD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const premul = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>, vertexShader = SEA_VERT_SRC) =>
  new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    toneMapped: false,
  });

/* ------------------------------------------------------------------------ */
/* THE SKY — a sea of cloud below                                            */
/* ------------------------------------------------------------------------ */

/*
 * The cloud sea is a HEIGHT FIELD under the plane: the top of the cloud sits
 * at the plane where the field is 1 and `uThick` below it where it is 0. Each
 * pixel marches its view ray down into that relief (so near billows hide the
 * ones behind them — real form, not a painted plane), shades the hit with a
 * low sun (wrapped Lambert, a few steps of self-shadow toward the sun, deeper
 * valleys bluer) and darkens it where anything standing over the clouds — the
 * shards, the tower — throws its shadow (a soft disc per fragment along the
 * sun's direction). It writes the hit's depth, so the tower's foot genuinely
 * sinks into the billows. Premultiplied alpha, fading to the page far off.
 */
const SEA_FRAG = /* glsl */ `
uniform float uFade;
uniform float uTime;
uniform vec3 uSun;
uniform float uThick;
uniform sampler2D uNoise;
uniform vec4 uFrag[${41}];
uniform float uShadow;
uniform vec3 uFar;
uniform mat4 uProj;
uniform vec4 uHole; // x, z, radius, amount
uniform vec4 uMound; // x, z, radius, amount — billows banked round the tower's foot
varying vec3 vWorld;
varying float vDist;

vec2 seaWarp;
float seaTop;
float seaH(vec2 p, bool fine) {
  vec2 q = p * 0.0105 + vec2(uTime * 0.0011, uTime * 0.0004) + seaWarp;
  vec4 a = texture2D(uNoise, q);
  vec4 b = texture2D(uNoise, q * 2.63 + vec2(0.37, 0.11));
  // Cumulus from above: masses of round domes on domes, open valleys between.
  float h = a.a * 0.62 + b.a * 0.34 + (a.r - 0.5) * 0.3 + (b.r - 0.5) * 0.12;
  if (fine) {
    vec4 c = texture2D(uNoise, q * 6.9 + vec2(0.71, 0.53));
    h += (c.a - 0.45) * 0.1;
  }
  h = smoothstep(0.16, 1.0, h);
  // Rounder shoulders; the tops never quite reach the plane (no flat plateaus).
  h = h * h * (3.0 - 2.0 * h) * 0.97;
  if (uMound.w > 0.001) {
    vec2 dm = p - uMound.xy;
    h = max(h, uMound.w * 0.9 * exp(-dot(dm, dm) / (uMound.z * uMound.z)));
  }
  return h;
}
/* The relief's depth: full near the lens, flatter far off (a far billow's
   silhouette would only alias — its shading carries it). */
float seaThick;
/* Height of the ray above the cloud surface (negative: inside the cloud). */
float seaF(vec3 p) {
  return p.y - (seaTop - seaThick * (1.0 - seaH(p.xz, false)));
}

void main() {
  vec3 ro = vWorld;
  vec3 rd = normalize(vWorld - cameraPosition);
  if (rd.y > -0.002) discard;
  seaWarp = (texture2D(uNoise, ro.xz * 0.0031 + vec2(0.13, 0.71)).gb - 0.5) * 0.08;
  seaTop = ro.y;
  float top = seaTop;
  seaThick = uThick * mix(1.0, 0.32, smoothstep(40.0, 170.0, length(ro - cameraPosition)));
  float tMax = min(seaThick / -rd.y, 60.0);
  // March down into the relief — long strides high above the billows, short
  // ones as the ray nears them, so silhouettes land exactly…
  float dtMax = tMax / 10.0;
  float slope = max(-rd.y, 0.12);
  float t0 = 0.0;
  float f0 = seaF(ro);
  float tHit = -1.0;
  float t = 0.0;
  // No crossing found (a grazing ray): the closest approach, not the floor.
  float tBest = 0.0;
  float fBest = f0;
  // The nearest miss over a nearer billow (its soft, lit edge).
  float fRim = 1e3;
  float tRim = 0.0;
  if (f0 <= 0.0) tHit = 0.0;
  else {
    for (int i = 0; i < 22; i++) {
      t = min(t + clamp(0.55 * f0 / slope, 0.12, dtMax), tMax);
      vec3 pt = ro + rd * t;
      float f = seaF(pt);
      if (f < 0.0) {
        // …and home in on the surface (secant steps).
        float ta = t0;
        float fa = f0;
        float tb = t;
        float fb = f;
        for (int k = 0; k < 3; k++) {
          float tm = ta + (tb - ta) * fa / (fa - fb);
          float fm = seaF(ro + rd * tm);
          if (fm < 0.0) {
            tb = tm;
            fb = fm;
          } else {
            ta = tm;
            fa = fm;
          }
        }
        tHit = ta + (tb - ta) * fa / (fa - fb);
        break;
      }
      if (f < fBest) {
        fBest = f;
        tBest = t;
      }
      // A local minimum of height over the surface is a billow's crest the ray skims.
      if (f > f0 && f0 < fRim) {
        fRim = f0;
        tRim = t0;
      }
      t0 = t;
      f0 = f;
      if (t >= tMax) break;
    }
    if (tHit < 0.0) tHit = tBest;
  }
  vec3 p = ro + rd * tHit;
  float dist = length(p - cameraPosition);

  // The surface's normal (a wider step far off, so the far sea never sparkles).
  float e = 0.45 + dist * 0.012;
  float h0 = seaH(p.xz, true);
  float hx = seaH(p.xz + vec2(e, 0.0), true);
  float hz = seaH(p.xz + vec2(0.0, e), true);
  vec3 n = normalize(vec3(-(hx - h0) * seaThick / e, 1.0, -(hz - h0) * seaThick / e));
  vec3 S = normalize(uSun);

  // Wrapped Lambert, and the billows' own shadow toward the sun.
  float ndl = dot(n, S);
  float light = clamp((ndl + 0.3) / 1.3, 0.0, 1.0);
  float self = 1.0;
  for (int k = 1; k <= 3; k++) {
    vec3 s = p + S * (float(k) * 1.6) + n * 0.1;
    float ys = top - seaThick * (1.0 - seaH(s.xz, false));
    self *= clamp(1.0 - (ys - s.y) * 0.55, 0.45, 1.0);
  }
  light *= self;

  // Shadows of whatever stands over the clouds.
  float fs = 1.0;
  if (uShadow > 0.001) {
    for (int i = 0; i < ${41}; i++) {
      vec4 f = uFrag[i];
      if (f.w <= 0.0) continue;
      vec3 dp = f.xyz - p;
      float along = dot(dp, S);
      if (along <= 0.0) continue;
      float d = length(dp - S * along);
      float soft = f.w * 0.35 + along * 0.02;
      fs *= 1.0 - 0.5 * uShadow * (1.0 - smoothstep(f.w - soft, f.w + soft, d));
    }
  }

  // Colour: sunlit tops warm white, shaded flanks and valleys a cool blue.
  float depthK = clamp((p.y - (top - seaThick)) / seaThick, 0.0, 1.0);
  vec3 lit = vec3(1.0, 0.993, 0.978);
  // Cumulus shadows are light and hazy, not a saturated blue.
  vec3 shade = mix(vec3(0.7, 0.745, 0.82), vec3(0.83, 0.85, 0.885), smoothstep(10.0, 60.0, dist));
  vec3 col = mix(shade, lit, light * fs);
  col *= mix(0.86, 1.0, depthK);
  // A silver lining: flanks turned from the eye toward the sun glow.
  float rim = pow(clamp(1.0 - dot(n, -rd), 0.0, 1.0), 4.0) * clamp(dot(rd, S) * 0.5 + 0.5, 0.0, 1.0);
  col += vec3(0.1, 0.1, 0.095) * rim * fs;
  // A billow's crest the ray skimmed on its way to something further: its
  // edge is soft and lit, never a hard step.
  if (tRim > 0.0 && tRim < tHit - 0.5) {
    float edge = 1.0 - smoothstep(0.0, 0.14 * seaThick, fRim);
    col = mix(col, lit * mix(0.95, 1.0, light), edge * 0.45);
  }
  // Aerial perspective: far billows sink into the horizon's haze…
  float far = smoothstep(70.0, 300.0, dist);
  col = mix(col, uFar, far * 0.9);
  // …and the far sea melts into the page's sky.
  float a = uFade * (1.0 - smoothstep(230.0, 340.0, dist));
  // Where the falling spiral has torn through the deck, the clouds part.
  if (uHole.w > 0.001) {
    float hr = length(p.xz - uHole.xy);
    float rim = (texture2D(uNoise, p.xz * 0.03).a - 0.5) * uHole.z * 0.35;
    a *= mix(1.0, smoothstep(uHole.z * 0.72, uHole.z * 1.2, hr + rim), uHole.w);
    // The torn edge is lit on its inner flank.
    col = mix(col, vec3(1.0, 0.995, 0.985), (1.0 - smoothstep(uHole.z * 0.9, uHole.z * 1.5, hr)) * 0.25 * uHole.w);
  }
  if (a < 0.003) discard;
  gl_FragColor = vec4(col * a, a);
  vec4 clip = uProj * viewMatrix * vec4(p, 1.0);
  gl_FragDepth = clamp(clip.z / clip.w * 0.5 + 0.5, 0.0, 1.0);
}
`;

export function createCloudSeaMaterial(noise: THREE.Texture, sun: THREE.Vector3): THREE.ShaderMaterial {
  const m = premul(SEA_FRAG, {
    uFade: { value: 0 },
    uTime: { value: 0 },
    uSun: { value: sun.clone() },
    uThick: { value: 5.5 },
    uNoise: { value: noise },
    uFrag: { value: Array.from({ length: 41 }, () => new THREE.Vector4(0, -1e4, 0, 0)) },
    uShadow: { value: 1 },
    uFar: { value: new THREE.Color(0.93, 0.945, 0.96) },
    uProj: { value: new THREE.Matrix4() },
    uHole: { value: new THREE.Vector4(0, 0, 1, 0) },
    uMound: { value: new THREE.Vector4(0, 0, 7, 0) },
  });
  // Drawn after the glass, depth-tested at the relief's own depth: whatever
  // stands in the clouds sinks into them.
  m.depthTest = true;
  return m;
}

/* A bank of cumulus (billboard): a cauliflower dome on a flat base, lit by the
   same low sun as the sea (its direction in VIEW space), soft all round. */
const PUFF_FRAG = /* glsl */ `
uniform float uAlpha;
uniform float uTime;
uniform float uSeed;
uniform float uNear;
uniform vec3 uSunV;
uniform sampler2D uNoise;
varying vec2 vUv;
void main() {
  vec2 c = (vUv - 0.5) * 2.0;
  vec2 q = vUv * vec2(1.3, 0.85) + vec2(uSeed * 0.37, uSeed * 0.61) + vec2(uTime * 0.0015, 0.0);
  vec4 n1 = texture2D(uNoise, q * 0.55);
  vec4 n2 = texture2D(uNoise, q * 1.6 + 0.3);
  float n = n1.a * 0.55 + n2.a * 0.25 + n1.r * 0.2;
  // A dome: wide, flat-bottomed, its crown broken into billows.
  float r = length(vec2(c.x, (c.y + 0.35) * 1.45));
  float body = 1.0 - smoothstep(0.62, 0.98, r + (0.55 - n) * 0.62);
  body *= smoothstep(-0.72, -0.42, c.y + (n - 0.5) * 0.25);
  // Fade to nothing well inside the card: a card edge in the sky reads as a line.
  vec2 e = smoothstep(0.0, 0.2, vUv) * smoothstep(1.0, 0.8, vUv);
  float a = uAlpha * body * e.x * e.y * uNear;
  if (a < 0.003) discard;
  vec3 nrm = normalize(vec3(c.x * 0.85, (c.y + 0.35) * 1.1 + 0.25 + (n - 0.5) * 0.9, 0.75));
  float lit = clamp(dot(nrm, normalize(uSunV)) * 0.75 + 0.42 + (n - 0.5) * 0.35, 0.0, 1.0);
  vec3 col = mix(vec3(0.69, 0.74, 0.82), vec3(1.0, 0.993, 0.978), lit);
  gl_FragColor = vec4(col * a, a);
}
`;

export function createPuffMaterial(seed: number, noise: THREE.Texture): THREE.ShaderMaterial {
  return premul(
    PUFF_FRAG,
    {
      uAlpha: { value: 0 },
      uTime: { value: 0 },
      uSeed: { value: seed },
      uNear: { value: 1 },
      uSunV: { value: new THREE.Vector3(0.5, 0.4, 0.3) },
      uNoise: { value: noise },
    },
    CARD_VERT
  );
}

/* Inside a cloud bank: a veil of soft, moving white. */
const HAZE_FRAG = /* glsl */ `
uniform float uAmount;
uniform float uTime;
uniform float uAspect;
uniform sampler2D uNoise;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float n = texture2D(uNoise, p * 0.45 + vec2(0.0, uTime * 0.06)).r * 0.6 + texture2D(uNoise, p * 1.1 - vec2(uTime * 0.02, uTime * 0.09)).a * 0.4;
  float a = clamp(uAmount * (0.78 + 0.5 * (n - 0.5)), 0.0, 1.0);
  if (a < 0.003) discard;
  vec3 col = mix(vec3(0.86, 0.87, 0.89), vec3(0.985, 0.983, 0.978), n);
  gl_FragColor = vec4(col * a, a);
}
`;

export function createHazeMaterial(noise: THREE.Texture): THREE.ShaderMaterial {
  const m = premul(HAZE_FRAG, { uAmount: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 1 }, uNoise: { value: noise } }, FLOOD_VERT);
  m.depthTest = false;
  return m;
}

/* ------------------------------------------------------------------------ */
/* THE SALT FLAT                                                             */
/* ------------------------------------------------------------------------ */

/*
 * THE SALT FLAT — a mirror to the horizon (Salar de Uyuni after rain): a thin
 * film of water over a crust of salt. Where the water lies, the flat mirrors
 * the sky (the reflected ray's elevation picks the sky's colour: a bright band
 * at the horizon, cooler overhead) and the stone's own reflection is drawn on
 * top of it by Stone.tsx; where it thins, the crust shows through — pale salt,
 * cracked into the flat's famous hexagons, their ridges a hair proud of the
 * water. The landing sends rings out across the film. The stone's shadow lies
 * under it. Premultiplied alpha, melting into the page's horizon far off.
 *
 * It never reaches ABOVE the horizon, so type set behind the canvas that sits
 * on or above the horizon line is never veiled.
 */
const FLAT_FRAG = /* glsl */ `
uniform float uFade;
uniform float uRipple;
uniform vec2 uRippleC;
uniform vec3 uShadow; // x, z, radius
uniform float uShadowA;
uniform float uTime;
uniform sampler2D uNoise;
uniform float uWater;
/* The finale's word, mirrored in the flat (lib/typeMirror.ts). */
uniform sampler2D uType;
uniform vec3 uTypeDim;   // mask width, height, baseline row (CSS px)
uniform vec4 uScreen;    // drawing-buffer w, h; CSS w, h
uniform float uHorizon;  // the horizon's row on the page (CSS px)
uniform float uTypeK;
varying vec3 vWorld;
varying float vDist;

/* The crust's cells: irregular polygons (5–7 sides, like the real salt pans).
   Returns the distance to the nearest cell edge (F2 − F1), 0 on the edge. */
vec2 flatHash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float cellEdge(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = 0.2 + 0.6 * flatHash(i + g);
      float d = length(g + o - f);
      if (d < d1) {
        d2 = d1;
        d1 = d;
      } else if (d < d2) d2 = d;
    }
  }
  return (d2 - d1) * 0.5;
}

vec3 skyAt(float e) {
  // e = sin(elevation) of the reflected ray.
  vec3 hor = vec3(0.992, 0.989, 0.98);
  vec3 low = vec3(0.925, 0.936, 0.952);
  vec3 zen = vec3(0.83, 0.857, 0.895);
  vec3 c = mix(hor, low, smoothstep(0.0, 0.07, e));
  return mix(c, zen, smoothstep(0.07, 0.75, e));
}

void main() {
  vec3 rd = normalize(vWorld - cameraPosition);
  vec2 xz = vWorld.xz;

  // Rings running out across the film from the landing.
  vec2 slope = vec2(0.0);
  if (uRipple > 0.0 && uRipple < 1.0) {
    vec2 dc = xz - uRippleC;
    float r = length(dc);
    float amp = (1.0 - uRipple) * (1.0 - uRipple);
    float wave = 0.0;
    for (int k = 0; k < 3; k++) {
      float R = 10.0 + (uRipple - float(k) * 0.07) * 320.0;
      float w = 2.0 + 10.0 * uRipple;
      float x = (r - R) / w;
      wave += -2.0 * x * exp(-x * x) * (1.0 - float(k) * 0.3);
    }
    slope += dc / max(r, 1e-3) * wave * amp * 0.06;
  }
  // The water's faint swell (only up close).
  vec4 sw = texture2D(uNoise, xz * 0.012 + vec2(uTime * 0.004, 0.0));
  slope += (sw.gb - 0.5) * 0.012 * (1.0 - smoothstep(20.0, 120.0, vDist));

  // The sky, mirrored.
  float e = clamp(-rd.y + dot(slope, rd.xz) * 2.0, 0.0, 1.0);
  vec3 sky = skyAt(e) * 0.95;

  // Where the water thins, the crust shows: pale salt in hexagons.
  vec4 pat = texture2D(uNoise, xz * 0.0045 + vec2(0.31, 0.17));
  float thin = smoothstep(0.42, 0.62, pat.r * 0.8 + pat.a * 0.35) * (1.0 - uWater);
  vec2 hp = xz / 4.2 + (texture2D(uNoise, xz * 0.016).gb - 0.5) * 0.5;
  float edge = cellEdge(hp);
  float aa = fwidth(edge);
  // A ridge a hair proud of the water, softer where the film covers it.
  float ridge = 1.0 - smoothstep(0.01, 0.035 + aa * 1.5, edge);
  // Fine ridges only where the eye can resolve them; faint in open water.
  ridge *= (1.0 - smoothstep(0.06, 0.16, aa)) * mix(0.35, 1.0, thin);
  vec3 salt = vec3(0.965, 0.962, 0.955);
  vec3 col = mix(sky, salt, thin * 0.8);
  col = mix(col, vec3(0.995, 0.994, 0.99), ridge * 0.55);

  // The word standing on the horizon, mirrored in the film: full-strength
  // indigo broken into ripple bands that thin with depth — never a pale wash.
  if (uTypeK > 0.001) {
    vec2 px = gl_FragCoord.xy / uScreen.xy * uScreen.zw;
    float y = uScreen.w - px.y;
    float d = y - uHorizon;
    // A short reflection: a few bands under the word, thinning fast.
    float span = uTypeDim.z * 0.42;
    if (d > 0.0 && d < span) {
      float q = d / span;
      float wav = sin(d * 0.23 - uTime * 1.7) * 0.6 + sin(d * 0.061 + px.x * 0.013 + uTime * 0.8) * 0.4;
      float xs = px.x + wav * (0.5 + d * 0.05);
      float ty = uTypeDim.z - d + wav * 0.6;
      float ink = texture2D(uType, vec2(xs / uTypeDim.x, 1.0 - ty / uTypeDim.y)).r;
      float band = step(fract(d * mix(0.085, 0.05, q) + wav * 0.1), mix(0.88, 0.18, q));
      float k = smoothstep(0.35, 0.65, ink) * band * step(q, mix(0.98, 0.4, 1.0 - uTypeK));
      col = mix(col, vec3(0.294, 0.184, 0.859), k);
    }
  }

  // The stone's shadow: soft and wide while it is high, dark and tight as it lands.
  float sh = 0.0;
  if (uShadowA > 0.001) {
    float rr = length(xz - uShadow.xy) / max(uShadow.z, 1e-3);
    sh = uShadowA * (1.0 - smoothstep(0.15, 1.0, rr));
  }

  // Toward the horizon it melts into the page's own horizon band.
  float far = smoothstep(260.0, 690.0, vDist);
  float a = uFade * (1.0 - far);
  vec3 pm = col * a;
  pm = pm * (1.0 - sh) + vec3(0.04, 0.045, 0.06) * sh;
  a = a + sh * (1.0 - a);
  if (a < 0.003) discard;
  gl_FragColor = vec4(pm, a);
}
`;

export function createFlatMaterial(noise: THREE.Texture): THREE.ShaderMaterial {
  return premul(FLAT_FRAG, {
    uFade: { value: 0 },
    uRipple: { value: 0 },
    uRippleC: { value: new THREE.Vector2() },
    uShadow: { value: new THREE.Vector3() },
    uShadowA: { value: 0 },
    uTime: { value: 0 },
    uNoise: { value: noise },
    uWater: { value: 0.3 },
    uType: { value: null },
    uTypeDim: { value: new THREE.Vector3(1, 1, 1) },
    uScreen: { value: new THREE.Vector4(1, 1, 1, 1) },
    uHorizon: { value: 0 },
    uTypeK: { value: 0 },
  });
}

/* ------------------------------------------------------------------------ */
/* THE FLOOD — light pouring out of a point                                  */
/* ------------------------------------------------------------------------ */

const FLOOD_FRAG = /* glsl */ `
uniform float uFlood;
uniform vec2 uC;
uniform float uAspect;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - uC) * vec2(uAspect, 1.0);
  float r = length(p);
  float R = 2.1 * uFlood;
  float a = 1.0 - smoothstep(R * 0.45, R, r);
  a = max(a * smoothstep(0.0, 0.25, uFlood), smoothstep(0.82, 1.0, uFlood));
  if (a < 0.003) discard;
  vec3 col = vec3(0.994, 0.992, 0.988);
  gl_FragColor = vec4(col * a, a);
}
`;

export function createFloodMaterial(): THREE.ShaderMaterial {
  const m = premul(FLOOD_FRAG, { uFlood: { value: 0 }, uC: { value: new THREE.Vector2(0.5, 0.5) }, uAspect: { value: 1 } }, FLOOD_VERT);
  m.depthTest = false;
  return m;
}
