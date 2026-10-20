import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";

/**
 * THE MODEL'S PARTS: the town, the rooms and everything in them are built
 * like an architect's model, from crisp blocks with a hair of chamfer on
 * every edge (it is what catches a line of light), gable and hip roofs, and
 * turned forms. Every part carries an occlusion value per vertex (`aAO`),
 * darkest where a wall meets the ground, so the white reads as solid.
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _n = new THREE.Vector3();

/** A matrix from a position, Euler angles (XYZ) and a scale. */
export function at(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, out = new THREE.Matrix4()) {
  _q.setFromEuler(_e.set(rx, ry, rz));
  return out.compose(_p.set(x, y, z), _q, V(sx, sy, sz));
}

/**
 * A box w x h x d, its edges chamfered by r (flat 45-degree facets). Built at
 * its real size so the chamfer is the same everywhere; cached by size.
 */
const boxes = new Map<string, THREE.BufferGeometry>();
export function block(w: number, h: number, d: number, r = 0.012): THREE.BufferGeometry {
  r = Math.min(r, w * 0.3, h * 0.3, d * 0.3);
  const key = `${w.toFixed(4)}|${h.toFixed(4)}|${d.toFixed(4)}|${r.toFixed(4)}`;
  const hit = boxes.get(key);
  if (hit) return hit;
  if (r <= 0) {
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
    g.deleteAttribute("uv");
    boxes.set(key, g);
    return g;
  }
  const H = [w / 2, h / 2, d / 2];
  const I = H.map((v) => Math.max(0, v - r));
  const pos: number[] = [];
  const nrm: number[] = [];
  const tri = (a: number[], b: number[], c: number[], n: number[]) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    const flip = cx * n[0] + cy * n[1] + cz * n[2] < 0;
    for (const p of flip ? [a, c, b] : [a, b, c]) {
      pos.push(p[0], p[1], p[2]);
      nrm.push(n[0], n[1], n[2]);
    }
  };
  const quad = (a: number[], b: number[], c: number[], e: number[], n: number[]) => {
    tri(a, b, c, n);
    tri(a, c, e, n);
  };
  const pt = (axis: number[], vals: number[]) => {
    const o = [0, 0, 0];
    axis.forEach((ax, i) => (o[ax] = vals[i]));
    return o;
  };
  for (let a = 0; a < 3; a++)
    for (const s of [-1, 1]) {
      const b = (a + 1) % 3;
      const c = (a + 2) % 3;
      const n = [0, 0, 0];
      n[a] = s;
      const P = (sb: number, sc: number) => pt([a, b, c], [s * H[a], sb * I[b], sc * I[c]]);
      quad(P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), n);
    }
  const k = Math.SQRT1_2;
  for (let a = 0; a < 3; a++)
    for (let b = a + 1; b < 3; b++) {
      const t = 3 - a - b;
      for (const sa of [-1, 1])
        for (const sb of [-1, 1]) {
          const n = [0, 0, 0];
          n[a] = sa * k;
          n[b] = sb * k;
          const P = (fa: number, fb: number, st: number) => {
            const o = [0, 0, 0];
            o[a] = sa * fa;
            o[b] = sb * fb;
            o[t] = st * I[t];
            return o;
          };
          quad(P(H[a], I[b], -1), P(I[a], H[b], -1), P(I[a], H[b], 1), P(H[a], I[b], 1), n);
        }
    }
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      for (const sz of [-1, 1]) {
        const n = [sx, sy, sz].map((s) => s / Math.sqrt(3));
        tri([sx * H[0], sy * I[1], sz * I[2]], [sx * I[0], sy * H[1], sz * I[2]], [sx * I[0], sy * I[1], sz * H[2]], n);
      }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  boxes.set(key, g);
  return g;
}

/** A turned form: a profile of [radius, height] points about +Y, smooth normals. */
export function turned(profile: [number, number][], seg = 32): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(Math.max(1e-4, r), y)),
    seg
  );
  g.deleteAttribute("uv");
  return g.toNonIndexed();
}

/** A capsule from (0,0,0) up +Y to (0,len,0): radius r0 at the start, r1 at the end. */
export function capsule(len: number, r0: number, r1: number, seg = 20): THREE.BufferGeometry {
  const pts: [number, number][] = [];
  const N = 6;
  for (let k = 0; k <= N; k++) {
    const a = -Math.PI / 2 + (k / N) * (Math.PI / 2);
    pts.push([r0 * Math.cos(a), r0 * Math.sin(a)]);
  }
  for (let k = 0; k <= N; k++) {
    const a = (k / N) * (Math.PI / 2);
    pts.push([r1 * Math.cos(a), len + r1 * Math.sin(a)]);
  }
  return turned(pts, seg);
}

/** A cylinder along +Y from 0 to h, radius r (closed). */
export function rod(r: number, h: number, seg = 16): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(r, r, h, seg, 1, false);
  g.translate(0, h / 2, 0);
  g.deleteAttribute("uv");
  return g.toNonIndexed();
}

/** A sphere (or an ellipsoid with sx/sy/sz). */
export function ball(r: number, ws = 24, hs = 16): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(r, ws, hs);
  g.deleteAttribute("uv");
  return g.toNonIndexed();
}

/** A convex solid through these points (flat faces). */
export function hull(points: THREE.Vector3[]): THREE.BufferGeometry {
  const g = new ConvexGeometry(points);
  g.deleteAttribute("uv");
  return g;
}

/** An extruded outline (x right, y up), `depth` deep along +Z from 0, flat faces. */
export function slab(outline: [number, number][], depth: number, bevel = 0): THREE.BufferGeometry {
  const s = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, {
    depth: depth - bevel * 2,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 12,
  });
  if (bevel > 0) g.translate(0, 0, bevel);
  g.deleteAttribute("uv");
  return g.index ? g.toNonIndexed() : g;
}

/** A rounded rectangle outline (x right, y up), centred, `n` points per corner. */
export function roundRect(w: number, h: number, r: number, n = 8): [number, number][] {
  r = Math.min(r, w / 2, h / 2);
  const out: [number, number][] = [];
  const corners: [number, number, number][] = [
    [w / 2 - r, h / 2 - r, 0],
    [-w / 2 + r, h / 2 - r, Math.PI / 2],
    [-w / 2 + r, -h / 2 + r, Math.PI],
    [w / 2 - r, -h / 2 + r, (3 * Math.PI) / 2],
  ];
  for (const [cx, cy, a0] of corners)
    for (let k = 0; k <= n; k++) {
      const a = a0 + (k / n) * (Math.PI / 2);
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  return out;
}

/** A rounded slab w x h, `t` thick, centred, its face toward +Z (a phone, a card). */
export function tablet(w: number, h: number, t: number, r: number, bevel = 0.004): THREE.BufferGeometry {
  const g = slab(roundRect(w, h, r, 10), t, Math.min(bevel, t * 0.3));
  g.translate(0, 0, -t / 2);
  return g;
}

/**
 * A gable roof: two planks meeting at the ridge, running along Z (length
 * `len`), over a body `span` wide; `pitch` radians; overhang `over` at the
 * eaves and the gables; `t` thick. Its eaves sit at y = 0.
 */
export function gableRoof(span: number, len: number, pitch: number, over = 0.35, t = 0.12): THREE.BufferGeometry {
  const half = span / 2 + over;
  const run = half / Math.cos(pitch);
  const ridge = (span / 2) * Math.tan(pitch);
  const sp = Math.sin(pitch);
  const cp = Math.cos(pitch);
  const parts: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    // A plank whose top face runs from the ridge, over the wall's top edge, out to the eave.
    const g = block(run + t * sp, t, len + over * 2, 0.015).clone();
    _m.compose(
      V(s * (half / 2 - (t / 2) * sp), ridge - (half / 2) * Math.tan(pitch) - (t / 2) * cp, 0),
      _q.setFromEuler(_e.set(0, 0, -s * pitch)),
      V(1, 1, 1)
    );
    g.applyMatrix4(_m);
    parts.push(g);
  }
  // The ridge capping.
  parts.push(block(t * 1.4, t * 0.7, len + over * 2 + 0.02, 0.012).clone().translate(0, ridge + t * 0.12, 0));
  return mergeGeometries(parts)!;
}

/** The height of a gable roof's ridge above its eaves. */
export const ridgeOf = (span: number, pitch: number) => (span / 2) * Math.tan(pitch);

/** The triangle of wall under a gable (its base `span` wide at y = 0), `d` thick along Z. */
export function gableEnd(span: number, pitch: number, d: number): THREE.BufferGeometry {
  const h = (span / 2) * Math.tan(pitch);
  const g = slab(
    [
      [-span / 2, 0],
      [span / 2, 0],
      [0, h],
    ],
    d
  );
  g.translate(0, 0, -d / 2);
  return g;
}

/**
 * A hip roof over a body w (x) by d (z): four planes rising to a ridge along
 * the longer side, `pitch` radians, overhang `over`, a fascia `t` deep. Eaves at y = 0.
 */
export function hipRoof(w: number, d: number, pitch: number, over = 0.35, t = 0.16): THREE.BufferGeometry {
  const W = w / 2 + over;
  const D = d / 2 + over;
  const short = Math.min(W, D);
  const h = short * Math.tan(pitch);
  const along = W >= D;
  const rl = Math.max(0, (along ? W : D) - short);
  const pts = [
    V(-W, 0, -D),
    V(W, 0, -D),
    V(W, 0, D),
    V(-W, 0, D),
    V(-W, -t, -D),
    V(W, -t, -D),
    V(W, -t, D),
    V(-W, -t, D),
    along ? V(-rl, h, 0) : V(0, h, -rl),
    along ? V(rl, h, 0) : V(0, h, rl),
  ];
  const g = hull(pts);
  g.translate(0, t, 0);
  return g;
}

/**
 * Bake an occlusion value into every vertex: the given function of the
 * vertex's position and normal (in the geometry's own frame), 0 dark … 1 open.
 */
export function bakeAO(g: THREE.BufferGeometry, fn: (p: THREE.Vector3, n: THREE.Vector3) => number) {
  const pos = g.getAttribute("position");
  const nor = g.getAttribute("normal");
  const ao = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    _p.fromBufferAttribute(pos, i);
    if (nor) _n.fromBufferAttribute(nor, i);
    else _n.set(0, 1, 0);
    ao[i] = fn(_p, _n);
  }
  g.setAttribute("aAO", new THREE.BufferAttribute(ao, 1));
  return g;
}

/** Height-above-the-floor occlusion: dark at the foot of a wall, open from `reach` up. */
export const footAO =
  (floor = 0, reach = 0.9, low = 0.55) =>
  (p: THREE.Vector3, n: THREE.Vector3) => {
    const k = Math.min(1, Math.max(0, (p.y - floor) / reach));
    const up = n.y < -0.5 ? 0.82 : 1;
    return (low + (1 - low) * Math.sqrt(k)) * up;
  };

/**
 * A batch: parts added with their place and occlusion, merged into one
 * geometry per material (one draw call for a whole house, a whole room).
 */
export class Batch {
  private parts: THREE.BufferGeometry[] = [];
  /** Add a part. `ao` is a number, a function of its (placed) vertex, or undefined (open). */
  add(geo: THREE.BufferGeometry, m?: THREE.Matrix4 | null, ao?: number | ((p: THREE.Vector3, n: THREE.Vector3) => number), color?: [number, number, number]) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal") g.deleteAttribute(name);
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    if (m) g.applyMatrix4(m);
    if (typeof ao === "function") bakeAO(g, ao);
    else {
      const a = new Float32Array(g.getAttribute("position").count).fill(ao ?? 1);
      g.setAttribute("aAO", new THREE.BufferAttribute(a, 1));
    }
    const n = g.getAttribute("position").count;
    const c = new Float32Array(n * 3);
    const [r, gg, b] = color ?? [1, 1, 1];
    for (let i = 0; i < n; i++) {
      c[i * 3] = r;
      c[i * 3 + 1] = gg;
      c[i * 3 + 2] = b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    this.parts.push(g);
    g = null as unknown as THREE.BufferGeometry;
    return this;
  }
  get empty() {
    return this.parts.length === 0;
  }
  build(): THREE.BufferGeometry {
    const g = this.parts.length ? mergeGeometries(this.parts)! : new THREE.BufferGeometry();
    this.parts = [];
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

/** Darken the sky's share inside a room: aAO times k for every vertex inside the box (the room's air). */
export function interiorAO(g: THREE.BufferGeometry, box: THREE.Box3, k: number) {
  const pos = g.getAttribute("position");
  const ao = g.getAttribute("aAO") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    _p.fromBufferAttribute(pos, i);
    if (box.containsPoint(_p)) ao.setX(i, ao.getX(i) * k);
  }
  ao.needsUpdate = true;
  return g;
}

/** Roof iron, foliage: the model's two colours besides white. */
export const ROOF: [number, number, number] = [0.17, 0.18, 0.2];
export const LEAF: [number, number, number] = [0.33, 0.46, 0.3];

export { mergeGeometries };

/**
 * The trim along a gable roof's two eaves (the roof as gableRoof makes it:
 * span along X, length along Z, eaves at y = 0): a white fascia board under
 * each eave's edge and a gutter along its foot.
 */
export function gableTrim(span: number, len: number, pitch: number, over = 0.35): THREE.BufferGeometry {
  const half = span / 2 + over;
  const drop = over * Math.tan(pitch);
  const L = len + over * 2;
  const parts: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    parts.push(block(0.035, 0.2, L, 0.006).clone().translate(s * (half + 0.01), -drop - 0.06, 0));
    parts.push(block(0.12, 0.1, L, 0.02).clone().translate(s * (half + 0.08), -drop - 0.13, 0));
  }
  return mergeGeometries(parts)!;
}

/** The trim round a hip roof's eaves (w by d, overhang `over`, fascia `t`): fascia boards and gutters all round. */
export function hipTrim(w: number, d: number, over = 0.35, t = 0.16): THREE.BufferGeometry {
  const W = w / 2 + over;
  const D = d / 2 + over;
  const parts: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    parts.push(block(W * 2 + 0.06, t + 0.04, 0.035, 0.006).clone().translate(0, t / 2 - 0.02, s * (D + 0.012)));
    parts.push(block(W * 2 + 0.2, 0.1, 0.12, 0.02).clone().translate(0, -0.06, s * (D + 0.08)));
    parts.push(block(0.035, t + 0.04, D * 2 + 0.06, 0.006).clone().translate(s * (W + 0.012), t / 2 - 0.02, 0));
    parts.push(block(0.12, 0.1, D * 2 + 0.2, 0.02).clone().translate(s * (W + 0.08), -0.06, 0));
  }
  return mergeGeometries(parts)!;
}
