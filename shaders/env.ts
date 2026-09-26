import * as THREE from "three";

/**
 * THE PLACES' SHADERS (components/stage/Places.tsx).
 *
 *   terrain  THE PLAIN — pale dunes of ash rising to far hills, lit low from
 *            the side, dissolving into the page's paper with distance (fog as
 *            alpha, premultiplied — the canvas is transparent over the DOM).
 *   card     a drifting bank of fog (THE VOID): paper-coloured, soft-edged,
 *            breathing noise.
 *   flood    the full-screen fog flood that carries the film from one place
 *            to the next; `uLight` turns it into a flood of light (the heart).
 *
 * All colours are the page's: paper #F6F5F2 (sRGB), shadows a warm grey.
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

/* ------------------------------------------------------------------------ */
/* THE PLAIN                                                                 */
/* ------------------------------------------------------------------------ */

const TERRAIN_VERT = /* glsl */ `
${NOISE}
uniform float uFloorY;
varying vec3 vWorld;
varying vec3 vN;
varying float vDist;

float height(vec2 p) {
  float r = length(p);
  // Gentle dunes near, a clear floor under the monument, hills rising far off.
  float dunes = (envFbm(p * 0.06 + 3.1) - 0.5) * 2.6 + (envFbm(p * 0.22 + 7.7) - 0.5) * 0.35;
  float ridge = 1.0 - abs(envFbm(p * 0.02 + 11.7) * 2.0 - 1.0);
  float hills = pow(ridge, 2.0) * 30.0 * smoothstep(24.0, 80.0, r);
  float clear = smoothstep(5.0, 16.0, r);
  return (dunes * clear + hills) - 0.4 * (1.0 - clear);
}

void main() {
  vec2 p = position.xz;
  float h = height(p);
  float e = 0.6;
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
varying vec3 vWorld;
varying vec3 vN;
varying float vDist;
void main() {
  // Fine grain: ash and wind ripples, only up close.
  float grain = envNoise(vWorld.xz * 3.1) * 0.6 + envNoise(vWorld.xz * 9.0) * 0.4;
  float ripple = sin(vWorld.x * 1.6 + vWorld.z * 0.7 + envNoise(vWorld.xz * 0.4) * 5.0);
  float nearK = 1.0 - smoothstep(6.0, 22.0, vDist);
  vec3 n = normalize(vN + vec3(0.06 * ripple * nearK, 0.0, 0.03 * (grain - 0.5) * nearK));
  float lit = clamp(dot(n, normalize(uSun)), 0.0, 1.0);
  // Paper in the light, a warm grey in the lee.
  vec3 paper = vec3(0.975, 0.971, 0.96);
  vec3 lee = vec3(0.66, 0.645, 0.625);
  vec3 col = mix(lee, paper, 0.18 + 0.82 * lit);
  col *= 0.985 + 0.03 * (grain - 0.5) * nearK;
  // Distance: the plain melts into the page.
  float t = clamp((vDist - uFogNear) / max(uFogFar - uFogNear, 1e-3), 0.0, 1.0);
  float fog = t * t * (3.0 - 2.0 * t);
  float a = uFade * (1.0 - fog);
  if (a < 0.003) discard;
  gl_FragColor = vec4(col * a, a);
}
`;

export function createTerrainMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFloorY: { value: -1.975 },
      uFade: { value: 0 },
      uFogNear: { value: 26 },
      uFogFar: { value: 80 },
      uSun: { value: new THREE.Vector3(-0.7, 0.34, 0.25) },
    },
    vertexShader: TERRAIN_VERT,
    fragmentShader: TERRAIN_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: true,
    toneMapped: false,
  });
}

/* ------------------------------------------------------------------------ */
/* A bank of fog (THE VOID)                                                  */
/* ------------------------------------------------------------------------ */

const CARD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const CARD_FRAG = /* glsl */ `
${NOISE}
uniform float uAlpha;
uniform float uTime;
uniform float uSeed;
varying vec2 vUv;
void main() {
  vec2 c = vUv - 0.5;
  float edge = 1.0 - smoothstep(0.18, 0.5, length(c * vec2(1.0, 1.6)));
  float n = envFbm(vUv * 2.6 + vec2(uSeed, uSeed * 0.7) + vec2(uTime * 0.018, -uTime * 0.011));
  float a = uAlpha * edge * smoothstep(0.3, 0.75, n);
  if (a < 0.003) discard;
  // A cloud bank: lit on top, a cool grey underneath — paper on paper would vanish.
  vec3 top = vec3(0.975, 0.972, 0.965);
  vec3 under = vec3(0.80, 0.80, 0.805);
  vec3 col = mix(under, top, smoothstep(0.2, 0.85, vUv.y + (n - 0.5) * 0.5));
  gl_FragColor = vec4(col * a, a);
}
`;

export function createFogCardMaterial(seed: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uAlpha: { value: 0 }, uTime: { value: 0 }, uSeed: { value: seed } },
    vertexShader: CARD_VERT,
    fragmentShader: CARD_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    toneMapped: false,
  });
}

/* ------------------------------------------------------------------------ */
/* THE FLOOD                                                                 */
/* ------------------------------------------------------------------------ */

const FLOOD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FLOOD_FRAG = /* glsl */ `
${NOISE}
uniform float uAmount;
uniform float uLight;
uniform float uTime;
uniform float uAspect;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  // Billows rolling in from the edges toward the centre as the flood rises.
  float r = length(p);
  float n = envFbm(p * 2.2 + vec2(uTime * 0.07, -uTime * 0.05)) * 0.65 + envFbm(p * 5.0 - uTime * 0.03) * 0.35;
  float front = uAmount * 1.55 - (0.9 - r * 0.55);
  float a = smoothstep(-0.25, 0.25, front + (n - 0.5) * 0.7);
  a = max(a, smoothstep(0.82, 1.0, uAmount));
  // Paper-white (into the heart: a touch brighter — pure light, never tinted).
  vec3 col = mix(vec3(0.965, 0.961, 0.949), vec3(0.985, 0.983, 0.978), uLight);
  float alpha = clamp(a * step(0.001, uAmount), 0.0, 1.0);
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(col * alpha, alpha);
}
`;

/* The void's backdrop: a vast soft gradient far behind the specimens. */
const BACK_FRAG = /* glsl */ `
${NOISE}
uniform float uAlpha;
uniform float uTime;
varying vec2 vUv;
void main() {
  float n = envFbm(vUv * vec2(3.0, 1.6) + vec2(uTime * 0.01, 0.0));
  vec3 low = vec3(0.83, 0.83, 0.835);
  vec3 high = vec3(0.965, 0.961, 0.949);
  vec3 col = mix(low, high, smoothstep(0.1, 0.8, vUv.y + (n - 0.5) * 0.25));
  float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
  float a = uAlpha * edge;
  if (a < 0.003) discard;
  gl_FragColor = vec4(col * a, a);
}
`;

export function createBackdropMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uAlpha: { value: 0 }, uTime: { value: 0 } },
    vertexShader: CARD_VERT,
    fragmentShader: BACK_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    toneMapped: false,
  });
}

export function createFloodMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uAmount: { value: 0 }, uLight: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 1 } },
    vertexShader: FLOOD_VERT,
    fragmentShader: FLOOD_FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
}
