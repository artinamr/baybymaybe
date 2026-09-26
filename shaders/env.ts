import * as THREE from "three";

/**
 * THE PLACES' SHADERS (components/stage/Places.tsx).
 *
 *   sea      THE SKY — an endless sea of cloud below, billowing, lit low from
 *            the side, melting into the page with distance
 *   puff     a billow of cloud (billboard) — volume round the sculptures
 *   haze     inside a cloud bank: the whole frame a soft, moving white
 *   flat     THE SALT FLAT — a pale crust that goes glassy toward a far,
 *            hazy horizon; a ring can run out across it
 *   flood    light pouring out of a point over the whole frame
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
  return premul(SEA_FRAG, { uFade: { value: 0 }, uTime: { value: 0 }, uSun: { value: new THREE.Vector3(0.75, 0.42, -0.35) } });
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
  return premul(PUFF_FRAG, { uAlpha: { value: 0 }, uTime: { value: 0 }, uSeed: { value: seed }, uNear: { value: 1 } }, CARD_VERT);
}

/* Inside a cloud bank: the whole frame a soft, moving white. */
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
  const m = premul(HAZE_FRAG, { uAmount: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 1 } }, FLOOD_VERT);
  m.depthTest = false;
  return m;
}

/* ------------------------------------------------------------------------ */
/* THE SALT FLAT                                                             */
/* ------------------------------------------------------------------------ */

const FLAT_FRAG = /* glsl */ `
${NOISE}
uniform float uFade;
uniform float uRipple;
uniform vec2 uRippleC;
varying vec3 vWorld;
varying float vDist;
void main() {
  // The crust: large soft patches and a finer grain, barely there.
  float n = envFbm(vWorld.xz * 0.018) * 0.65 + envFbm(vWorld.xz * 0.11 + 7.3) * 0.35;
  vec3 crust = mix(vec3(0.905, 0.903, 0.897), vec3(0.972, 0.97, 0.964), n);
  // Toward the horizon the flat goes glassy and cool, then melts into the sky.
  float far = smoothstep(30.0, 520.0, vDist);
  vec3 col = mix(crust, vec3(0.872, 0.88, 0.895), far);
  float a = uFade * (0.07 + 0.12 * (1.0 - n) * (1.0 - far) + 0.34 * far) * (1.0 - smoothstep(0.84, 1.0, far));
  // A ring running out across the flat from the colossus.
  if (uRipple > 0.0 && uRipple < 1.0) {
    float r = length(vWorld.xz - uRippleC);
    float R = 14.0 + uRipple * 240.0;
    float w = 3.0 + 14.0 * uRipple;
    float ring = exp(-pow((r - R) / w, 2.0)) * (1.0 - uRipple) * (1.0 - uRipple);
    col = mix(col, vec3(0.8, 0.81, 0.83), ring * 0.8);
    a = max(a, uFade * ring * 0.35);
  }
  if (a < 0.003) discard;
  gl_FragColor = vec4(col * a, a);
}
`;

export function createFlatMaterial(): THREE.ShaderMaterial {
  return premul(FLAT_FRAG, { uFade: { value: 0 }, uRipple: { value: 0 }, uRippleC: { value: new THREE.Vector2() } });
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
