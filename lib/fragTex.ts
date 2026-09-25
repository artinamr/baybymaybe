/**
 * PER-FRAGMENT TRANSFORM TEXTURE — contract (docs/SPEC.md §4.3).
 *
 * The whole stone is ONE draw call: 24 fragments merged into one geometry,
 * each vertex tagged with `aFrag`. Each fragment's transform lives in one row of
 * an RGBA32F DataTexture (8 texels × FRAG_COUNT rows) — a uniform array could
 * overflow the vertex-uniform limit on an iGPU.
 *
 * Row i (fragment i):
 *   texel 0..3  model matrix columns  (fragment-local → WORLD)
 *   texel 4..6  normal matrix columns (inverse-transpose of the model 3×3; w unused)
 *   texel 7     (glow, flash, fade, spare)
 *                 glow  0..1  cut-face indigo level for this fragment
 *                 flash 0..1  transient flash (walker arrival, seating)
 *                 fade  0..1  1 = fully dissolved into the paper (alpha fog)
 *
 * WRITER: components/stage/Director.tsx (via writeFrag), once per frame.
 * READERS: shaders/obsidian.ts vertex shader (texelFetch(uFragTex, ivec2(k, aFrag), 0)),
 *          and CPU code that needs fragment world positions (fragWorld / fragPos).
 *
 * The stone mesh itself keeps an IDENTITY matrixWorld (the reflection mesh
 * carries only the floor mirror) and must set frustumCulled = false.
 */
import * as THREE from "three";
import { FRAG_COUNT } from "./geo/types";

const W = 8;
const data = new Float32Array(W * FRAG_COUNT * 4);

const texture = new THREE.DataTexture(data, W, FRAG_COUNT, THREE.RGBAFormat, THREE.FloatType);
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.generateMipmaps = false;
texture.needsUpdate = true;

/** CPU mirror of each fragment's current world matrix (read by Graph, Flakes, the bridge). */
const fragWorld: THREE.Matrix4[] = Array.from({ length: FRAG_COUNT }, () => new THREE.Matrix4());
/** CPU mirror of each fragment's current world position (its centroid). */
const fragPos: THREE.Vector3[] = Array.from({ length: FRAG_COUNT }, () => new THREE.Vector3());
/** CPU mirror of (glow, flash, fade). */
const fragFx: Float32Array = new Float32Array(FRAG_COUNT * 3);

const _n = new THREE.Matrix3();

/** Write fragment i. Allocation-free. Call writeDone() once after the last write of the frame. */
function writeFrag(i: number, model: THREE.Matrix4, glow: number, flash: number, fade: number) {
  const o = i * W * 4;
  const e = model.elements; // column-major
  for (let k = 0; k < 16; k++) data[o + k] = e[k];
  _n.getNormalMatrix(model);
  const n = _n.elements; // column-major 3×3
  data[o + 16] = n[0];
  data[o + 17] = n[1];
  data[o + 18] = n[2];
  data[o + 19] = 0;
  data[o + 20] = n[3];
  data[o + 21] = n[4];
  data[o + 22] = n[5];
  data[o + 23] = 0;
  data[o + 24] = n[6];
  data[o + 25] = n[7];
  data[o + 26] = n[8];
  data[o + 27] = 0;
  data[o + 28] = glow;
  data[o + 29] = flash;
  data[o + 30] = fade;
  data[o + 31] = 0;
  fragWorld[i].copy(model);
  fragPos[i].setFromMatrixPosition(model);
  fragFx[i * 3] = glow;
  fragFx[i * 3 + 1] = flash;
  fragFx[i * 3 + 2] = fade;
}

function writeDone() {
  texture.needsUpdate = true;
}

export const fragTex = {
  texture,
  width: W,
  count: FRAG_COUNT,
  writeFrag,
  writeDone,
  fragWorld,
  fragPos,
  fragFx,
};
