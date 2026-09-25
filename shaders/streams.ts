import * as THREE from "three";
import { obsidianUniforms } from "./obsidian";

/**
 * LIGHT STREAMS — the data running through the sculptures (ch02–03).
 *
 * ~1,600 points of indigo light, positioned entirely on the GPU from the same
 * phases and tilt the shards use (sceneState.sculpt), so light and stone always
 * turn together:
 *   · inside each ring of the tower, a stream circulating a little faster than
 *     the blades — the light within;
 *   · morphing with the fragments into the armillary's two orbits (product,
 *     workspace) and a small swirling core where they cross;
 *   · parting around the cursor in screen space and brightening as it does —
 *     the chapter answers the hand.
 *
 * Normal premultiplied blending (additive light disappears on white), depth
 * tested so the black blades pass in front of the light. Colours are sRGB.
 */

export const STREAM_COUNT = 2600;

const VERT = /* glsl */ `
attribute vec4 aSeed;   // tier 0..3, orbit role 0 P · 1 W · 2 core, phase, speed
attribute vec4 aJit;    // radial jitter, vertical jitter, size px, morph delay
uniform float uTime;
uniform float uRingPhase[4];
uniform float uRingR[4];
uniform float uRingY[4];
uniform float uOrbitPhase[3];
uniform float uOrbitR;
uniform mat3 uOrbitP;
uniform mat3 uOrbitW;
uniform mat3 uTilt;
uniform vec3 uCenter;
uniform float uMorph;
uniform vec2 uPointer;
uniform float uPointerOn;
uniform float uAspect;
uniform float uDpr;
uniform vec2 uBeat;     // light weight of the P and W orbits
varying float vAlpha;
varying float vHot;
varying float vDepth;

void main() {
  int tier = int(aSeed.x + 0.5);
  float role = aSeed.y;
  float ph = aSeed.z;
  float sp = aSeed.w;

  // Tower: a stream inside ring \`tier\`, running ahead of the blades.
  float tr = uRingR[tier] * 0.62 + aJit.x * 0.07;
  float tdir = mod(float(tier), 2.0) < 0.5 ? 1.0 : -1.0; // rings alternate direction
  float ta = ph + uRingPhase[tier] * 1.7 + uTime * sp * 0.35 * tdir;
  vec3 tower = vec3(tr * cos(ta), uRingY[tier] + aJit.y * 0.035, tr * sin(ta));

  // Armillary: the two orbits, or the core where they cross.
  vec3 orbit;
  if (role < 1.5) {
    float dir = role < 0.5 ? 1.0 : -1.0;
    float oa = ph + uOrbitPhase[int(role + 0.5)] * 1.4 + uTime * sp * 0.42 * dir;
    float orr = uOrbitR + aJit.x * 0.07;
    vec3 local = vec3(orr * cos(oa), aJit.y * 0.035, orr * sin(oa));
    orbit = (role < 0.5 ? uOrbitP : uOrbitW) * local;
  } else {
    float ca = ph + uTime * sp * 0.9 + uOrbitPhase[2];
    float cy = aJit.y;                       // −1..1
    float cr = 0.5 * (0.45 + 0.55 * abs(aJit.x)) * sqrt(max(0.0, 1.0 - cy * cy));
    orbit = vec3(cr * cos(ca), cy * 0.42, cr * sin(ca));
  }

  // Morph with the fragments: each point leaves on its own delay and swings
  // out and round on the way (the same spiral the shards take).
  float m = smoothstep(0.0, 1.0, clamp((uMorph - aJit.w * 0.4) / 0.6, 0.0, 1.0));
  vec3 p = mix(tower, orbit, m);
  float bow = sin(3.14159265 * m);
  p += normalize(p + vec3(1e-4)) * bow * 0.55;
  float sw = -1.8 * bow;
  p = vec3(p.x * cos(sw) + p.z * sin(sw), p.y, -p.x * sin(sw) + p.z * cos(sw));

  p = uTilt * p + uCenter;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;

  // Part around the cursor, in screen space.
  vec2 ndc = clip.xy / clip.w;
  vec2 d = ndc - uPointer;
  d.x *= uAspect;
  float r = length(d);
  float hot = uPointerOn * (1.0 - smoothstep(0.0, 0.3, r));
  ndc += (d / max(r, 1e-4)) * hot * hot * 0.13 * vec2(1.0 / uAspect, 1.0);
  clip.xy = ndc * clip.w;
  gl_Position = clip;

  float depth = -mv.z;
  gl_PointSize = aJit.z * 1.9 * uDpr * (10.0 / max(depth, 0.5)) * (1.0 + hot * 1.3);

  // Beat: the orbit of the active beat carries the light.
  float beatW = role < 0.5 ? uBeat.x : role < 1.5 ? uBeat.y : 1.0;
  vAlpha = (0.68 + 0.32 * fract(ph * 7.31)) * mix(1.0, beatW, m);
  vHot = hot;
  vDepth = depth;
}
`;

const FRAG = /* glsl */ `
uniform float uFade;
uniform float uFogNear;
uniform float uFogFar;
varying float vAlpha;
varying float vHot;
varying float vDepth;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = (1.0 - smoothstep(0.18, 0.5, d)) * vAlpha * uFade;
  float t = clamp((vDepth - uFogNear) / max(uFogFar - uFogNear, 1e-3), 0.0, 1.0);
  a *= 1.0 - t * t * (3.0 - 2.0 * t);
  a = min(1.0, a * (1.0 + 0.8 * vHot));
  if (a < 0.004) discard;
  // Indigo, a touch brighter where the cursor is (never lighter than #6B4BFF).
  vec3 col = mix(vec3(0.357, 0.239, 0.941), vec3(0.42, 0.294, 1.0), vHot);
  gl_FragColor = vec4(col * a, a);
}
`;

export type StreamsMaterial = THREE.ShaderMaterial & { uniforms: Record<string, THREE.IUniform> };

export function createStreamsMaterial(orbitP: THREE.Quaternion, orbitW: THREE.Quaternion, orbitR: number, ringR: number[], ringY: number[]): StreamsMaterial {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRingPhase: { value: [0, 0, 0, 0] },
      uRingR: { value: ringR.slice() },
      uRingY: { value: ringY.slice() },
      uOrbitPhase: { value: [0, 0, 0] },
      uOrbitR: { value: orbitR },
      uOrbitP: { value: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(orbitP)) },
      uOrbitW: { value: new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(orbitW)) },
      uTilt: { value: new THREE.Matrix3() },
      uCenter: { value: new THREE.Vector3() },
      uMorph: { value: 0 },
      uPointer: { value: new THREE.Vector2(9, 9) },
      uPointerOn: { value: 0 },
      uAspect: { value: 1 },
      uDpr: { value: 1 },
      uBeat: { value: new THREE.Vector2(1, 1) },
      uFade: { value: 0 },
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
  return m as StreamsMaterial;
}

/** Deterministic per-point seeds: tier, orbit role, phase, speed + jitter. */
export function createStreamsGeometry(count = STREAM_COUNT): THREE.BufferGeometry {
  let s = 0x5b3df0 >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const seed = new Float32Array(count * 4);
  const jit = new Float32Array(count * 4);
  const pos = new Float32Array(count * 3); // unused (positions come from the shader)
  for (let i = 0; i < count; i++) {
    const role = i % 13 === 0 ? 2 : i % 2;
    seed[i * 4] = i % 4;
    seed[i * 4 + 1] = role;
    seed[i * 4 + 2] = rand() * Math.PI * 2;
    seed[i * 4 + 3] = 0.6 + rand() * 0.9;
    jit[i * 4] = (rand() - 0.5) * 2;
    jit[i * 4 + 1] = (rand() - 0.5) * 2;
    jit[i * 4 + 2] = 1.3 + rand() * rand() * 3.2;
    jit[i * 4 + 3] = rand();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  g.setAttribute("aJit", new THREE.BufferAttribute(jit, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);
  return g;
}
