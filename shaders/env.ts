import * as THREE from "three";

/**
 * THE PLACES' SHADERS (components/stage/Places.tsx).
 *
 *   sea      THE SKY — an endless sea of cloud below, billowing, lit low from
 *            the side, melting into the page with distance
 *   puff     a billow of cloud (billboard) — volume near the camera, and what
 *            the camera sinks through on the way down
 *   haze     inside the cloud: the whole frame a soft, moving white
 *   terrain  THE LAKE's far hills (and their reflection in the still water)
 *
 * Everything is premultiplied alpha over the paper DOM (the canvas is
 * transparent): fog is alpha, so a place melts into the page, never into grey.
 */

const NOISE = /* glsl */ `
float envHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float envNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(envHash(i), envHash(i + vec2(1, 0)), u.x), mix(envHash(i + vec2(0, 1)), envHash(i + vec2(1, 1)), u.x), u.y);
}
float envFbm(vec2 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 5; i++) {
    s += a * envNoise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    a *= 0.5;
  }
  return s;
}
`;

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
/* The lake's hills                                                          */
/* ------------------------------------------------------------------------ */

const TERRAIN_VERT = /* glsl */ `
${NOISE}
uniform float uFloorY;
varying vec3 vWorld;
varying vec3 vN;
varying float vDist;

// A far range of low mountains beyond a wide ring of open water.
float height(vec2 p) {
  float r = length(p);
  float ridge = 1.0 - abs(envFbm(p * 0.018 + 11.7) * 2.0 - 1.0);
  float body = envFbm(p * 0.009 + 4.2);
  float range = (pow(ridge, 2.4) * 0.75 + body * 0.35) * 22.0;
  return range * smoothstep(70.0, 120.0, r) - 3.0 * (1.0 - smoothstep(60.0, 90.0, r));
}

void main() {
  vec2 p = position.xz;
  float h = height(p);
  float e = 1.2;
  vec3 n = normalize(vec3(height(p - vec2(e, 0.0)) - height(p + vec2(e, 0.0)), 2.0 * e, height(p - vec2(0.0, e)) - height(p + vec2(0.0, e))));
  vec4 w = modelMatrix * vec4(p.x, uFloorY + h, p.y, 1.0);
  vWorld = w.xyz;
  vN = n;
  vec4 mv = viewMatrix * w;
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const TERRAIN_FRAG = /* glsl */ `
${NOISE}
uniform float uFade;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uSun;
uniform float uMirror;
uniform float uFloorY;
varying vec3 vWorld;
varying vec3 vN;
varying float vDist;
void main() {
  // Above the water line, or (the reflection copy) below it.
  if (uMirror > 0.5 ? vWorld.y > uFloorY : vWorld.y < uFloorY - 0.02) discard;
  float lit = clamp(dot(normalize(vN), normalize(uSun)), 0.0, 1.0);
  // Cool greys under an overcast sky; the lit slopes pale, the lee blue-grey.
  vec3 lee = vec3(0.64, 0.67, 0.72);
  vec3 face = vec3(0.90, 0.905, 0.915);
  vec3 col = mix(lee, face, 0.2 + 0.8 * lit);
  // Aerial perspective: distance washes the range toward the sky, then away.
  float t = clamp((vDist - uFogNear) / max(uFogFar - uFogNear, 1e-3), 0.0, 1.0);
  float fog = t * t * (3.0 - 2.0 * t);
  col = mix(col, vec3(0.93, 0.935, 0.94), 0.55 * t);
  float a = uFade * (1.0 - fog) * (uMirror > 0.5 ? 0.3 * (1.0 - smoothstep(0.0, 14.0, uFloorY - vWorld.y)) : 1.0);
  if (a < 0.003) discard;
  gl_FragColor = vec4(col * a, a);
}
`;

export function createTerrainMaterial(mirror = false): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFloorY: { value: -1.975 },
      uFade: { value: 0 },
      uFogNear: { value: 60 },
      uFogFar: { value: 230 },
      uSun: { value: new THREE.Vector3(-0.6, 0.45, 0.3) },
      uMirror: { value: mirror ? 1 : 0 },
    },
    vertexShader: TERRAIN_VERT,
    fragmentShader: TERRAIN_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: !mirror,
    toneMapped: false,
  });
}

/* The water: still, faintly cooler than the sky, darker toward the horizon,
   with slow wind streaks — so the lake reads as water, not as more paper. */
const WATER_FRAG = /* glsl */ `
${NOISE}
uniform float uFade;
uniform float uTime;
varying vec3 vWorld;
varying float vDist;
void main() {
  float far = smoothstep(8.0, 120.0, vDist);
  float streak = envNoise(vec2(vWorld.x * 0.02 + uTime * 0.01, vWorld.z * 0.35));
  float band = 0.5 + 0.5 * streak;
  vec3 col = mix(vec3(0.925, 0.93, 0.935), vec3(0.86, 0.87, 0.885), far * 0.8);
  col -= 0.012 * band * (1.0 - far);
  float a = uFade * (0.25 + 0.55 * far) * (1.0 - smoothstep(170.0, 260.0, vDist));
  if (a < 0.003) discard;
  gl_FragColor = vec4(col * a, a);
}
`;

export function createWaterMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uFade: { value: 0 }, uTime: { value: 0 } },
    vertexShader: SEA_VERT_SRC,
    fragmentShader: WATER_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    toneMapped: false,
  });
}

/* ------------------------------------------------------------------------ */
/* Billboards                                                                */
/* ------------------------------------------------------------------------ */

const CARD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/* ------------------------------------------------------------------------ */
/* Full-screen quads                                                         */
/* ------------------------------------------------------------------------ */

const FLOOD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/* ------------------------------------------------------------------------ */
/* THE SKY — a sea of cloud below                                            */
/* ------------------------------------------------------------------------ */

const SEA_VERT = SEA_VERT_SRC;

const SEA_FRAG = /* glsl */ `
${NOISE}
uniform float uFade;
uniform float uTime;
uniform vec3 uSun;
varying vec3 vWorld;
varying float vDist;
float sea(vec2 p) {
  vec2 q = p * 0.042 + vec2(uTime * 0.0035, uTime * 0.0012);
  q += 0.6 * vec2(envFbm(q * 0.7 + 3.1), envFbm(q * 0.7 + 8.4)) - 0.3;
  return envFbm(q);
}
void main() {
  vec2 p = vWorld.xz;
  float d = sea(p);
  // Billows: bump the surface by the cloud density, light it low from the side.
  float e = 1.4;
  float dx = sea(p + vec2(e, 0.0)) - d;
  float dz = sea(p + vec2(0.0, e)) - d;
  vec3 n = normalize(vec3(-dx * 7.0, 1.0, -dz * 7.0));
  float lit = clamp(dot(n, normalize(uSun)), 0.0, 1.0);
  float body = smoothstep(0.34, 0.66, d);
  // Tops: sunlit white; valleys: a cool blue-grey depth.
  vec3 top = vec3(0.992, 0.99, 0.985);
  vec3 lee = vec3(0.80, 0.815, 0.84);
  vec3 deep = vec3(0.72, 0.75, 0.80);
  vec3 col = mix(deep, mix(lee, top, 0.25 + 0.75 * lit), body);
  // Far away the sea melts into the sky (the page).
  float t = clamp((vDist - 24.0) / 150.0, 0.0, 1.0);
  float fog = t * t * (3.0 - 2.0 * t);
  float a = uFade * (1.0 - fog);
  if (a < 0.003) discard;
  gl_FragColor = vec4(col * a, a);
}
`;

export function createCloudSeaMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uFade: { value: 0 }, uTime: { value: 0 }, uSun: { value: new THREE.Vector3(0.75, 0.42, -0.35) } },
    vertexShader: SEA_VERT,
    fragmentShader: SEA_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    toneMapped: false,
  });
}

/* A billow of cloud (billboard) — lit on top, cool grey beneath, soft all round. */
const PUFF_FRAG = /* glsl */ `
${NOISE}
uniform float uAlpha;
uniform float uTime;
uniform float uSeed;
uniform float uNear;
varying vec2 vUv;
void main() {
  vec2 c = (vUv - 0.5) * vec2(1.0, 1.7);
  float n = envFbm(vUv * 3.2 + vec2(uSeed, uSeed * 0.61) + vec2(uTime * 0.01, 0.0));
  float r = length(c) + (n - 0.5) * 0.42;
  float body = 1.0 - smoothstep(0.2, 0.5, r);
  // The noise can push a billow past its card: fade to nothing well inside the
  // edges, so a card never shows as a straight line in the sky.
  vec2 e = smoothstep(0.0, 0.2, vUv) * smoothstep(1.0, 0.8, vUv);
  body *= e.x * e.y;
  float a = uAlpha * body * uNear;
  if (a < 0.003) discard;
  float lit = smoothstep(0.15, 0.95, vUv.y + (n - 0.5) * 0.45);
  vec3 col = mix(vec3(0.78, 0.795, 0.83), vec3(0.995, 0.993, 0.99), lit);
  gl_FragColor = vec4(col * a, a);
}
`;

export function createPuffMaterial(seed: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uAlpha: { value: 0 }, uTime: { value: 0 }, uSeed: { value: seed }, uNear: { value: 1 } },
    vertexShader: CARD_VERT,
    fragmentShader: PUFF_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    toneMapped: false,
  });
}

/* Inside the cloud: the whole frame a soft, moving white. */
const HAZE_FRAG = /* glsl */ `
${NOISE}
uniform float uAmount;
uniform float uTime;
uniform float uAspect;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float n = envFbm(p * 1.8 + vec2(0.0, uTime * 0.35)) * 0.6 + envFbm(p * 4.0 - vec2(uTime * 0.1, uTime * 0.5)) * 0.4;
  float a = clamp(uAmount * (0.78 + 0.5 * (n - 0.5)), 0.0, 1.0);
  if (a < 0.003) discard;
  vec3 col = mix(vec3(0.86, 0.87, 0.89), vec3(0.985, 0.983, 0.978), n);
  gl_FragColor = vec4(col * a, a);
}
`;

export function createHazeMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uAmount: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 1 } },
    vertexShader: FLOOD_VERT,
    fragmentShader: HAZE_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
}
