import * as THREE from "three";
import { obsidianUniforms } from "./obsidian";

/**
 * GROUND MIST — two paper-coloured fbm billboards hugging the floor
 * (docs/SPEC.md §4.6). Paper on paper is invisible, so the mist only shows
 * where it lies over the stone's point, its reflection and its contact shadow:
 * it softens the join between the monument and the page.
 *
 * THE HARD RULE: no semi-transparent canvas pixel may ever sit over indigo type.
 * The mist is cut in SCREEN space at uClipY (POTENTIAL's baseline + 0.01H,
 * fraction from the top): nothing is drawn above it. Just below the line the
 * alpha ramps in over a few percent of the screen, so the cut never shows as a
 * straight edge across the black stone.
 *
 * Written premultiplied in output (sRGB) space — the paper is exactly #F6F5F2.
 */

export type HazeUniforms = {
  uTime: THREE.IUniform<number>;
  /** Peak alpha of this billboard (0.10 front, 0.14 back) × sceneState.u.mistAlpha. */
  uAlpha: THREE.IUniform<number>;
  /** Per-billboard noise offset so the two layers never line up. */
  uSeed: THREE.IUniform<number>;
  /** Billboard size in world units — the noise is sampled in world units. */
  uSize: THREE.IUniform<THREE.Vector2>;
  /** Screen-space cutoff, fraction from the TOP: mist is drawn only below it. */
  uClipY: THREE.IUniform<number>;
  /** Drawing-buffer height in device px (gl_FragCoord → screen fraction). */
  uBufH: THREE.IUniform<number>;
  uFogNear: THREE.IUniform<number>;
  uFogFar: THREE.IUniform<number>;
  uPaper: THREE.IUniform<THREE.Vector3>;
};

/** Shared by both billboards: one write per frame covers them. */
export const hazeShared = {
  uClipY: { value: 1 } as THREE.IUniform<number>,
  uBufH: { value: 1 } as THREE.IUniform<number>,
  /** Frozen under reduced motion (no idle loops). */
  uTime: { value: 0 } as THREE.IUniform<number>,
};

const VERT = /* glsl */ `
uniform vec2 uSize;
varying vec2 vUv;
varying vec2 vP;      // world-unit position on the billboard
varying float vDepth;
void main() {
  vUv = uv;
  vP = (uv - 0.5) * uSize;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uAlpha;
uniform float uSeed;
uniform float uClipY;
uniform float uBufH;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uPaper;
varying vec2 vUv;
varying vec2 vP;
varying float vDepth;

float hHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float hNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hHash(i), hHash(i + vec3(1, 0, 0)), f.x),
        mix(hHash(i + vec3(0, 1, 0)), hHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hHash(i + vec3(0, 0, 1)), hHash(i + vec3(1, 0, 1)), f.x),
        mix(hHash(i + vec3(0, 1, 1)), hHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}

void main() {
  // Screen-space cutoff first: above the line the mist does not exist.
  float sy = 1.0 - gl_FragCoord.y / uBufH;
  if (sy < uClipY) discard;

  // 3-octave fbm at 0.9 / unit, drifting +x at 0.015 u/s, slowly evolving.
  vec3 q = vec3(vP.x - uTime * 0.015 + uSeed * 13.7, vP.y * 1.6 + uSeed * 5.3, uTime * 0.02 + uSeed);
  float n = 0.5 * hNoise(q * 0.9) + 0.25 * hNoise(q * 1.8 + 3.1) + 0.125 * hNoise(q * 3.6 + 7.7);
  n /= 0.875;
  float body = smoothstep(0.28, 0.78, n);

  // Vertical profile: densest at the floor line (v = 0.2), thinning upward,
  // with a short skirt below over the reflection. Soft ends left and right.
  float v = vUv.y;
  float prof = smoothstep(0.0, 0.2, v) * (1.0 - smoothstep(0.2, 1.0, v));
  float ends = smoothstep(0.0, 0.22, vUv.x) * (1.0 - smoothstep(0.78, 1.0, vUv.x));

  float t = clamp((vDepth - uFogNear) / max(uFogFar - uFogNear, 1e-3), 0.0, 1.0);
  float keep = 1.0 - t * t * (3.0 - 2.0 * t);

  float a = uAlpha * body * prof * ends * keep * smoothstep(uClipY, uClipY + 0.03, sy);
  if (a < 0.002) discard;
  gl_FragColor = vec4(uPaper * a, a);
}
`;

export function createHazeMaterial(o: { maxAlpha: number; seed: number }): THREE.ShaderMaterial & {
  uniforms: HazeUniforms;
} {
  const uniforms: HazeUniforms = {
    uTime: hazeShared.uTime,
    uAlpha: { value: o.maxAlpha },
    uSeed: { value: o.seed },
    uSize: { value: new THREE.Vector2(3.2, 0.6) },
    uClipY: hazeShared.uClipY,
    uBufH: hazeShared.uBufH,
    uFogNear: obsidianUniforms.uFogNear,
    uFogFar: obsidianUniforms.uFogFar,
    uPaper: { value: new THREE.Vector3(0xf6 / 255, 0xf5 / 255, 0xf2 / 255) },
  };
  const m = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  return m as THREE.ShaderMaterial & { uniforms: HazeUniforms };
}

/**
 * Billboard geometry: 3.2 × 0.6 world units, facing +Z, its floor line at the
 * origin. The band spans 0.12 below the floor (over the reflection) to 0.48
 * above, so v = 0.2 is the floor — where the profile peaks.
 */
export const HAZE_SIZE = { w: 3.2, h: 0.6, below: 0.12 } as const;

export function createHazeGeometry(): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(HAZE_SIZE.w, HAZE_SIZE.h, 1, 1);
  g.translate(0, HAZE_SIZE.h / 2 - HAZE_SIZE.below, 0);
  return g;
}
