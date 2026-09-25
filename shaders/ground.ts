import * as THREE from "three";
import { obsidianUniforms } from "./obsidian";

/**
 * GROUND FX — the stone's contact with the page (docs/SPEC.md §4.6).
 *
 * One flat quad a hair above the floor, drawn premultiplied onto the
 * transparent canvas, so all it can ever do to the paper is darken it a little
 * (ink) or tint it faintly (indigo). Three layers, composited "over" in-shader:
 *   core    ink radial, r 0.16, α 0.18 — directly under the culet (the contact)
 *   broad   ink ellipse 1.2 × 0.45 (semi-axes), α 0.07 — the stone's soft occlusion
 *   spill   indigo ellipse, α ≤ 0.10 — only while the cut faces glow
 *
 * Local coordinates are world units on the quad, x along the camera's
 * horizontal (GroundFx turns the quad with the camera azimuth), so the broad
 * ellipse always reads as a wide, shallow shadow from any orbit angle.
 *
 * Colours are written in OUTPUT (sRGB) space: this is a raw ShaderMaterial with
 * no tone mapping or colour-space chunk, so the ink is exactly #0A0B10.
 */

/** Quad half-extents (world units) — room for the broad ellipse plus falloff. */
export const GROUND_HALF = { x: 1.3, z: 0.55 } as const;

export type GroundUniforms = {
  /** Culet contact point relative to the quad centre, quad-local (x, z). */
  uCoreOff: THREE.IUniform<THREE.Vector2>;
  /** 0..1 how grounded the stone is (culet near the floor, stone whole). */
  uShadow: THREE.IUniform<number>;
  /** 0..1 indigo spill (sceneState.u.spill). */
  uSpill: THREE.IUniform<number>;
  uFogNear: THREE.IUniform<number>;
  uFogFar: THREE.IUniform<number>;
  uInk: THREE.IUniform<THREE.Vector3>;
  uIndigo: THREE.IUniform<THREE.Vector3>;
};

const VERT = /* glsl */ `
varying vec2 vLocal;
varying float vDepth;
void main() {
  vLocal = position.xz;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
uniform vec2 uCoreOff;
uniform float uShadow;
uniform float uSpill;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uInk;
uniform vec3 uIndigo;
varying vec2 vLocal;
varying float vDepth;

void main() {
  // Contact core: a tight, soft cone of ink under the point.
  float rc = length(vLocal - uCoreOff);
  float core = 1.0 - smoothstep(0.0, 0.16, rc);
  core *= core;
  // Broad occlusion: the stone's mass above, as a wide shallow ellipse.
  float rb = length(vLocal / vec2(1.2, 0.45));
  float broad = 1.0 - smoothstep(0.0, 1.0, rb);
  broad *= broad;
  float aInk = (1.0 - (1.0 - 0.18 * core) * (1.0 - 0.07 * broad)) * uShadow;

  // Indigo spill: light from the lit cut faces landing on the page.
  float rs = length(vLocal / vec2(0.95, 0.42));
  float spill = 1.0 - smoothstep(0.0, 1.0, rs);
  float aSp = 0.10 * uSpill * spill * spill;

  // Spill over ink, premultiplied.
  vec3 col = uIndigo * aSp + uInk * aInk * (1.0 - aSp);
  float a = aSp + aInk * (1.0 - aSp);

  float t = clamp((vDepth - uFogNear) / max(uFogFar - uFogNear, 1e-3), 0.0, 1.0);
  float keep = 1.0 - t * t * (3.0 - 2.0 * t);
  a *= keep;
  col *= keep;
  if (a < 0.002) discard;
  gl_FragColor = vec4(col, a);
}
`;

/** sRGB hex → a vec3 in 0..1, NOT linearised (the shader writes output space). */
function srgb(hex: number): THREE.Vector3 {
  return new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);
}

export function createGroundMaterial(): THREE.ShaderMaterial & { uniforms: GroundUniforms } {
  const uniforms: GroundUniforms = {
    uCoreOff: { value: new THREE.Vector2() },
    uShadow: { value: 0 },
    uSpill: { value: 0 },
    // Shared with the obsidian so the ground fogs out with the stone.
    uFogNear: obsidianUniforms.uFogNear,
    uFogFar: obsidianUniforms.uFogFar,
    uInk: { value: srgb(0x0a0b10) },
    uIndigo: { value: srgb(0x5b3df0) },
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
  return m as THREE.ShaderMaterial & { uniforms: GroundUniforms };
}

/** The flat quad in the XZ plane, centred on its origin. */
export function createGroundGeometry(): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(GROUND_HALF.x * 2, GROUND_HALF.z * 2, 1, 1);
  g.rotateX(-Math.PI / 2);
  return g;
}
