import * as THREE from "three";
import { at, Batch, capsule, rod } from "./model";
import { WIND } from "./mats";

/**
 * TREES OF LEAVES. A canopy is clumps of leaf cards (small quads, each a
 * cluster of leaves cut out of one drawn texture), set round the clump's
 * centre and lit as the volume they make (each card's normal points out
 * from the canopy's middle, so a tree is lit like a crown, not like a pile
 * of paper), darker inside, lighter where the sun reaches through from
 * behind. Edges are cut by coverage (multisampled), so the outline of a
 * tree breaks into leaves against the sky as a real one does.
 *
 * Kinds: a round tree (a street tree, a yard tree), a column (a poplar, a
 * cypress), a wide low crown (a pohutukawa), a cabbage tree (a slim trunk
 * forking into tufts of long blades), and the hedge (cards packed in a
 * long box). Every leaf moves in the wind (`WIND`).
 */

const BARK: [number, number, number] = [0.42, 0.37, 0.33];

/** The leaves' texture: four cells (2x2): three broadleaf clusters and one of long blades. */
let atlas: THREE.CanvasTexture | null = null;
function leafAtlas(): THREE.CanvasTexture {
  if (atlas) return atlas;
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, S, S);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const cell = S / 2;
  for (let k = 0; k < 4; k++) {
    const ox = (k % 2) * cell;
    const oy = Math.floor(k / 2) * cell;
    const cx = ox + cell / 2;
    const cy = oy + cell / 2;
    g.save();
    g.beginPath();
    g.rect(ox + 2, oy + 2, cell - 4, cell - 4);
    g.clip();
    if (k < 3) {
      // A cluster: leaves on short twigs round the middle, the ones behind darker.
      const n = 140 + k * 30;
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2;
        const r = Math.pow(rnd(), 0.62) * cell * 0.42;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.92;
        const len = cell * (0.055 + rnd() * 0.035) * (k === 1 ? 0.8 : 1);
        const wid = len * (k === 2 ? 0.5 : 0.42);
        const rot = a + (rnd() - 0.5) * 1.6;
        const v = 120 + Math.floor(rnd() * 135 * (0.55 + 0.45 * (1 - r / (cell * 0.42))));
        g.save();
        g.translate(x, y);
        g.rotate(rot);
        g.beginPath();
        g.moveTo(-len / 2, 0);
        g.quadraticCurveTo(0, -wid, len / 2, 0);
        g.quadraticCurveTo(0, wid, -len / 2, 0);
        g.closePath();
        const gr = g.createLinearGradient(-len / 2, 0, len / 2, 0);
        gr.addColorStop(0, `rgb(${v * 0.82},${v * 0.82},${v * 0.82})`);
        gr.addColorStop(1, `rgb(${v},${v},${v})`);
        g.fillStyle = gr;
        g.fill();
        // The midrib.
        g.strokeStyle = `rgba(${v * 1.15},${v * 1.15},${v * 1.15},0.5)`;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(-len / 2, 0);
        g.lineTo(len / 2, 0);
        g.stroke();
        g.restore();
      }
    } else {
      // Long blades from one point, drooping at the ends (the cabbage tree's tuft).
      const n = 70;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (rnd() - 0.5) * Math.PI * 1.9;
        const len = cell * (0.3 + rnd() * 0.16);
        const v = 140 + Math.floor(rnd() * 110);
        g.strokeStyle = `rgb(${v},${v},${v})`;
        g.lineWidth = 3 + rnd() * 3;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(cx, cy + cell * 0.08);
        const ex = cx + Math.cos(a) * len;
        const ey = cy + cell * 0.08 + Math.sin(a) * len;
        g.quadraticCurveTo(cx + Math.cos(a) * len * 0.6, cy + Math.sin(a) * len * 0.6 - len * 0.12, ex, ey + len * 0.18);
        g.stroke();
      }
    }
    g.restore();
  }
  atlas = new THREE.CanvasTexture(c);
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.anisotropy = 4;
  atlas.generateMipmaps = true;
  atlas.minFilter = THREE.LinearMipmapLinearFilter;
  return atlas;
}

/** The leaves' material: one for the town and the garden (the seasons tint it, world.ts). */
let leafM: THREE.MeshStandardMaterial | null = null;
export function leafMat(): THREE.MeshStandardMaterial {
  if (leafM) return leafM;
  const m = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: leafAtlas(),
    vertexColors: true,
    roughness: 0.78,
    metalness: 0,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
    alphaToCoverage: true,
  });
  m.onBeforeCompile = (s) => {
    s.uniforms.uWind = WIND;
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uWind;\nattribute float aAO;\nvarying float vAO;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vAO = aAO;
{
  vec3 seat = vec3(0.0);
  #ifdef USE_INSTANCING
  seat = vec3(instanceMatrix[3]);
  #endif
  float hgt = max(0.0, transformed.y - 1.4);
  float ph = seat.x * 0.21 + seat.z * 0.17;
  float sway = hgt * 0.016;
  transformed.x += (sin(uWind * 0.9 + ph) + 0.5 * sin(uWind * 2.3 + ph * 1.7 + transformed.y)) * sway;
  transformed.z += (cos(uWind * 0.7 + ph * 1.3) + 0.5 * sin(uWind * 1.9 + ph + transformed.x)) * sway;
  // Each card flutters on its own.
  float fl = sin(uWind * 3.1 + dot(transformed, vec3(3.1, 1.7, 2.3))) * 0.025 * min(1.0, hgt);
  transformed += normal * fl;
}`
      );
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vAO;")
      .replace(
        "#include <alphatest_fragment>",
        `{
  // Far off, the texture's smaller copies thin the leaves out: keep the crown full.
  vec2 dx = dFdx(vMapUv * 1024.0);
  vec2 dy = dFdy(vMapUv * 1024.0);
  float lod = max(0.0, 0.5 * log2(max(dot(dx, dx), dot(dy, dy))));
  diffuseColor.a = min(1.0, diffuseColor.a * (1.0 + lod * 0.32));
}
#include <alphatest_fragment>`
      )
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
reflectedLight.indirectDiffuse *= vAO;
reflectedLight.indirectSpecular *= vAO;
reflectedLight.directDiffuse *= mix(1.0, vAO, 0.55);
#if NUM_DIR_LIGHTS > 0
{
  // Light through the leaves: the sun behind the crown, seen from in front.
  float tr = pow(max(dot(-geometryViewDir, directionalLights[0].direction), 0.0), 3.0);
  reflectedLight.directDiffuse += diffuseColor.rgb * directionalLights[0].color * tr * 0.42 * vAO;
}
#endif`
      );
  };
  m.customProgramCacheKey = () => "leaves-v1";
  leafM = m;
  return m;
}

type Clump = { c: THREE.Vector3; r: THREE.Vector3; n: number };

/**
 * Leaf cards for a crown of clumps. `centre` is the crown's middle (the
 * normals point out from it); `size` a card's edge; `cell` the atlas cell
 * (0-2 broadleaf, 3 blades); `color` the leaves'.
 */
function cards(b: { leaves: THREE.BufferGeometry[] }, clumps: Clump[], centre: THREE.Vector3, size: [number, number], cell: number | number[], color: [number, number, number], rnd: () => number, spread = 0.62) {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const ao: number[] = [];
  const col: number[] = [];
  const crownR = Math.max(...clumps.map((k) => k.c.distanceTo(centre) + Math.max(k.r.x, k.r.y, k.r.z)));
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (const k of clumps)
    for (let i = 0; i < k.n; i++) {
      // A point in the clump, more of them toward its surface.
      const d = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1);
      if (d.lengthSq() > 1 || d.lengthSq() < 1e-4) {
        i--;
        continue;
      }
      d.normalize().multiplyScalar(0.45 + 0.55 * Math.pow(rnd(), 0.45));
      const p = new THREE.Vector3(d.x * k.r.x, d.y * k.r.y, d.z * k.r.z).add(k.c);
      const out = p.clone().sub(centre);
      const depth = Math.min(1, out.length() / crownR);
      out.normalize();
      // The card: turned at random, a little toward facing out.
      e.set((rnd() - 0.5) * Math.PI, rnd() * Math.PI * 2, (rnd() - 0.5) * Math.PI);
      q.setFromEuler(e);
      const s = size[0] + (size[1] - size[0]) * rnd();
      const ux = new THREE.Vector3(1, 0, 0).applyQuaternion(q).multiplyScalar(s / 2);
      const uy = new THREE.Vector3(0, 1, 0).applyQuaternion(q).multiplyScalar(s / 2);
      const cl = Array.isArray(cell) ? cell[Math.floor(rnd() * cell.length)] : cell;
      const u0 = (cl % 2) * 0.5;
      const v0 = cl < 2 ? 0.5 : 0;
      // Lit as a volume: the normal leans out from the crown's middle (and a little up).
      const n = out.clone().multiplyScalar(spread).add(new THREE.Vector3(0, 1 - spread, 0)).normalize();
      // Inside and underneath is darker.
      const a = (0.35 + 0.65 * depth) * (0.75 + 0.25 * THREE.MathUtils.clamp((p.y - centre.y) / (crownR * 0.8) + 0.5, 0, 1));
      const tint = 0.86 + rnd() * 0.28;
      const warm = rnd() * 0.06;
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        pos.push(p.x + ux.x * sx + uy.x * sy, p.y + ux.y * sx + uy.y * sy, p.z + ux.z * sx + uy.z * sy);
        nor.push(n.x, n.y, n.z);
        uv.push(u0 + (sx * 0.5 + 0.5) * 0.5, v0 + (sy * 0.5 + 0.5) * 0.5);
        ao.push(a);
        col.push(color[0] * tint + warm, color[1] * tint + warm * 0.6, color[2] * tint);
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("aAO", new THREE.Float32BufferAttribute(ao, 1));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  b.leaves.push(g);
}

/** A tree's two parts: wood (the model's material) and leaves (leafMat). */
export type TreeGeo = { wood: THREE.BufferGeometry; leaves: THREE.BufferGeometry };
class TreeBatch {
  wood = new Batch();
  leaves: THREE.BufferGeometry[] = [];
  build(): TreeGeo {
    const merged = this.leaves.length ? mergeLeaves(this.leaves) : new THREE.BufferGeometry();
    merged.computeBoundingSphere();
    merged.computeBoundingBox();
    return { wood: this.wood.build(), leaves: merged };
  }
}
function mergeLeaves(list: THREE.BufferGeometry[]) {
  const names = ["position", "normal", "uv", "aAO", "color"];
  const sizes = [3, 3, 2, 1, 3];
  const g = new THREE.BufferGeometry();
  names.forEach((nm, i) => {
    const total = list.reduce((s, x) => s + x.getAttribute(nm).array.length, 0);
    const arr = new Float32Array(total);
    let o = 0;
    for (const x of list) {
      arr.set(x.getAttribute(nm).array as Float32Array, o);
      o += x.getAttribute(nm).array.length;
    }
    g.setAttribute(nm, new THREE.BufferAttribute(arr, sizes[i]));
  });
  return g;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const barkAO = (p: THREE.Vector3) => 0.55 + 0.45 * Math.min(1, p.y / 2);

/** A round tree (a street tree, a yard tree). */
export function roundTree(seed = 1): TreeGeo {
  const r = rng(seed);
  const t = new TreeBatch();
  t.wood.add(rod(0.17, 3.4, 10), at(0, 0, 0), barkAO, BARK);
  t.wood.add(rod(0.09, 1.9, 7), at(0.2, 2.6, 0, 0, 0, -0.55), 0.8, BARK);
  t.wood.add(rod(0.09, 1.8, 7), at(-0.2, 2.7, 0.15, 0.35, 0, 0.6), 0.8, BARK);
  const clumps: Clump[] = [
    { c: V(0, 4.7, 0), r: V(2.1, 1.7, 2.1), n: 34 },
    { c: V(1.35, 4.0, 0.6), r: V(1.5, 1.3, 1.5), n: 20 },
    { c: V(-1.2, 4.2, -0.7), r: V(1.45, 1.3, 1.45), n: 20 },
    { c: V(0.2, 5.6, -0.3), r: V(1.3, 1.0, 1.3), n: 14 },
  ];
  cards(t, clumps, V(0, 4.6, 0), [1.0, 1.55], [0, 1], [0.34, 0.47, 0.27], r);
  return t.build();
}
/** A column (a poplar, a cypress): tall and narrow, darker. */
export function columnTree(seed = 2): TreeGeo {
  const r = rng(seed);
  const t = new TreeBatch();
  t.wood.add(rod(0.14, 1.8, 10), at(0, 0, 0), barkAO, BARK);
  const clumps: Clump[] = [];
  for (let i = 0; i < 6; i++) {
    const y = 1.8 + i * 1.15;
    const rr = 1.25 * (1 - i / 7.5);
    clumps.push({ c: V((r() - 0.5) * 0.2, y, (r() - 0.5) * 0.2), r: V(rr, 0.95, rr), n: 14 });
  }
  cards(t, clumps, V(0, 4.6, 0), [0.75, 1.15], [1, 2], [0.24, 0.37, 0.24], r, 0.5);
  return t.build();
}
/** A wide, low crown (a pohutukawa by the street): dark, glossy, spreading. */
export function wideTree(seed = 3): TreeGeo {
  const r = rng(seed);
  const t = new TreeBatch();
  t.wood.add(rod(0.24, 2.3, 10), at(0, 0, 0), barkAO, BARK);
  for (const [x, z, rz, rx] of [
    [0.3, 0, -0.75, 0],
    [-0.3, 0.2, 0.7, 0.3],
    [0, -0.3, 0.2, -0.75],
    [0.1, 0.3, 0.1, 0.7],
  ])
    t.wood.add(rod(0.12, 2.6, 8), at(x, 1.6, z, rx, 0, rz), 0.78, BARK);
  const clumps: Clump[] = [
    { c: V(0, 3.7, 0), r: V(2.4, 1.3, 2.4), n: 34 },
    { c: V(2.3, 3.3, 0.6), r: V(1.8, 1.1, 1.8), n: 22 },
    { c: V(-2.1, 3.4, -0.5), r: V(1.9, 1.15, 1.9), n: 22 },
    { c: V(0.4, 3.2, 2.1), r: V(1.6, 1.0, 1.6), n: 18 },
    { c: V(-0.6, 3.3, -2.1), r: V(1.7, 1.05, 1.7), n: 18 },
  ];
  cards(t, clumps, V(0, 3.4, 0), [1.0, 1.6], [0, 2], [0.2, 0.32, 0.19], r, 0.55);
  return t.build();
}
/** A cabbage tree (tī kōuka): a slim trunk forking, each branch ending in a tuft of long blades. */
export function cabbageTree(seed = 4): TreeGeo {
  const r = rng(seed);
  const t = new TreeBatch();
  t.wood.add(capsule(2.6, 0.16, 0.12, 10), at(0, 0, 0), barkAO, BARK);
  const tips: THREE.Vector3[] = [];
  const n = 3 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r();
    const lean = 0.35 + r() * 0.25;
    const len = 1.6 + r() * 0.9;
    const dir = V(Math.sin(a) * Math.sin(lean), Math.cos(lean), Math.cos(a) * Math.sin(lean));
    const m = new THREE.Matrix4().lookAt(V(0, 0, 0), dir, V(0, 0, 1));
    const rot = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
    const place = new THREE.Matrix4().makeTranslation(0, 2.5, 0).multiply(m).multiply(rot);
    t.wood.add(capsule(len, 0.09, 0.07, 8), place, 0.85, BARK);
    tips.push(V(0, 2.5, 0).addScaledVector(dir, len + 0.1));
  }
  const clumps: Clump[] = tips.map((c) => ({ c, r: V(0.55, 0.45, 0.55), n: 9 }));
  const centre = tips.reduce((s, x) => s.add(x), V(0, 0, 0)).multiplyScalar(1 / tips.length);
  cards(t, clumps, centre.setY(centre.y - 0.4), [1.4, 1.9], 3, [0.46, 0.52, 0.3], r, 0.4);
  return t.build();
}

/** A hedge, `len` long (x), `h` high, `d` deep (z), its foot at y = 0: leaf cards packed in its box. */
export function hedgeLeaves(b: { leaves: THREE.BufferGeometry[] }, m: THREE.Matrix4, len: number, h: number, d: number, seed: number) {
  const r = rng(seed);
  const tb = new TreeBatch();
  const clumps: Clump[] = [];
  const n = Math.max(1, Math.round(len / 1.1));
  for (let i = 0; i < n; i++) clumps.push({ c: V(-len / 2 + (i + 0.5) * (len / n), h * 0.55, 0), r: V((len / n) * 0.75, h * 0.5, d * 0.55), n: 7 });
  cards(tb, clumps, V(0, h * 0.2, 0), [0.55, 0.85], [0, 2], [0.26, 0.38, 0.22], r, 0.4);
  for (const g of tb.leaves) {
    g.applyMatrix4(m);
    b.leaves.push(g);
  }
}

/** Merge hedge leaves collected by hedgeLeaves into one geometry. */
export function mergeHedges(list: THREE.BufferGeometry[]) {
  const g = list.length ? mergeLeaves(list) : new THREE.BufferGeometry();
  g.computeBoundingSphere();
  return g;
}
