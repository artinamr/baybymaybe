import * as THREE from "three";
import { obsidianUniforms } from "./obsidian";

/**
 * SCREEN-SPACE RIBBONS — the constellation's edges and the light that walks
 * them, in ONE instanced draw (docs/SPEC.md §5 ch03).
 *
 * Each instance is a segment [aRange.x, aRange.y] of the line aA → aB, drawn as
 * a quad whose width is set in PIXELS (so a 1px hairline stays 1px at any
 * depth), soft-edged across its width for free anti-aliasing. `aGrad` fades a
 * segment from its start to its end — a walker's tail into its head.
 *
 * Normal (premultiplied) blending, never additive: on a white page additive
 * light just disappears. Fog-as-alpha shares the obsidian's uniforms.
 * Colours are written in output (sRGB) space.
 */
export type RibbonMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uRes: THREE.IUniform<THREE.Vector2>;
    uDpr: THREE.IUniform<number>;
    uFade: THREE.IUniform<number>;
    uFogNear: THREE.IUniform<number>;
    uFogFar: THREE.IUniform<number>;
  };
};

const VERT = /* glsl */ `
attribute vec3 aA;
attribute vec3 aB;
attribute vec2 aRange;
attribute vec4 aColor;
attribute float aWidth;
attribute float aGrad;
uniform vec2 uRes;
uniform float uDpr;
varying vec4 vColor;
varying float vU;
varying float vAcross;
varying float vGrad;
varying float vDepth;
void main() {
  vec3 A = mix(aA, aB, aRange.x);
  vec3 B = mix(aA, aB, aRange.y);
  vec4 ca = projectionMatrix * viewMatrix * vec4(A, 1.0);
  vec4 cb = projectionMatrix * viewMatrix * vec4(B, 1.0);
  vec2 sa = ca.xy / ca.w;
  vec2 sb = cb.xy / cb.w;
  vec2 d = (sb - sa) * uRes;
  vec2 dir = length(d) > 1e-4 ? normalize(d) : vec2(1.0, 0.0);
  vec2 n = vec2(-dir.y, dir.x);
  vec4 c = mix(ca, cb, position.x);
  // +1px of feather on each side so the soft edge doesn't thin the line.
  float w = (aWidth + 1.0) * uDpr;
  c.xy += n * position.y * (w / uRes) * c.w;
  gl_Position = c;
  vColor = aColor;
  vU = position.x;
  vAcross = position.y * (aWidth + 1.0) / max(aWidth, 0.5);
  vGrad = aGrad;
  vDepth = -(viewMatrix * vec4(mix(A, B, position.x), 1.0)).z;
}
`;

const FRAG = /* glsl */ `
uniform float uFade;
uniform float uFogNear;
uniform float uFogFar;
varying vec4 vColor;
varying float vU;
varying float vAcross;
varying float vGrad;
varying float vDepth;
void main() {
  float a = vColor.a * uFade;
  a *= 1.0 - smoothstep(0.55, 1.0, abs(vAcross));
  if (vGrad > 0.5) a *= vU * vU;
  float t = clamp((vDepth - uFogNear) / max(uFogFar - uFogNear, 1e-3), 0.0, 1.0);
  a *= 1.0 - t * t * (3.0 - 2.0 * t);
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor.rgb * a, a);
}
`;

export function createRibbonMaterial(): RibbonMaterial {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uDpr: { value: 1 },
      uFade: { value: 1 },
      uFogNear: obsidianUniforms.uFogNear,
      uFogFar: obsidianUniforms.uFogFar,
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  return m as RibbonMaterial;
}

/** A unit quad: x along the segment 0..1, y across −1..1. */
export function createRibbonGeometry(max: number) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const mk = (n: number) => {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(max * n), n);
    a.setUsage(THREE.DynamicDrawUsage);
    return a;
  };
  const attrs = { aA: mk(3), aB: mk(3), aRange: mk(2), aColor: mk(4), aWidth: mk(1), aGrad: mk(1) };
  for (const [k, v] of Object.entries(attrs)) g.setAttribute(k, v);
  g.instanceCount = 0;
  return { geometry: g, attrs };
}
