import * as THREE from "three";
import type { Track } from "./track";

/** Geometry helpers for the machine and the hall. Everything comes out indexed and normalised. */

const Y = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _d = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _s = new THREE.Vector3();

/** A matrix placing a unit box/cylinder (along +Y, centred) between two points, `w` thick (or [w, d]). */
export function between(a: THREE.Vector3, b: THREE.Vector3, w: number | [number, number], roll = 0, out = new THREE.Matrix4()) {
  _d.subVectors(b, a);
  const L = _d.length();
  _d.normalize();
  _q.setFromUnitVectors(Y, _d);
  if (roll) _q.multiply(new THREE.Quaternion().setFromAxisAngle(Y, roll));
  const [ww, dd] = Array.isArray(w) ? w : [w, w];
  _s.set(ww, L, dd);
  _a.addVectors(a, b).multiplyScalar(0.5);
  return out.compose(_a, _q, _s);
}

export const unitBox = new THREE.BoxGeometry(1, 1, 1);

/**
 * A box w x h x d with every edge chamfered by r (flat 45-degree facets, flat
 * normals). Machined and cast parts never have razor edges: the chamfer is
 * what catches a line of light along every beam, plate and sleeper. Built at
 * the real size (so the chamfer is the same everywhere), cached by size.
 */
const chamfers = new Map<string, THREE.BufferGeometry>();
export function chamferBox(w: number, h: number, d: number, r: number): THREE.BufferGeometry {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${r.toFixed(3)}`;
  const hit = chamfers.get(key);
  if (hit) return hit;
  const H = [w / 2, h / 2, d / 2];
  const I = H.map((v) => Math.max(0, v - r));
  const pos: number[] = [];
  const nrm: number[] = [];
  const tri = (a: number[], b: number[], c: number[], n: number[]) => {
    // Wind it to face n.
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
  // Faces.
  for (let a = 0; a < 3; a++)
    for (const s of [-1, 1]) {
      const b = (a + 1) % 3;
      const c = (a + 2) % 3;
      const n = [0, 0, 0];
      n[a] = s;
      const P = (sb: number, sc: number) => pt([a, b, c], [s * H[a], sb * I[b], sc * I[c]]);
      quad(P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), n);
    }
  // Edges (between faces a and b, along t).
  const k = Math.SQRT1_2;
  for (let a = 0; a < 3; a++)
    for (let b = a + 1; b < 3; b++) {
      const t = 3 - a - b;
      for (const sa of [-1, 1])
        for (const sb of [-1, 1]) {
          const n = [0, 0, 0];
          n[a] = sa * k;
          n[b] = sb * k;
          const P = (onA: boolean, st: number) => pt([a, b, t], [sa * (onA ? H[a] : I[a]), sb * (onA ? I[b] : H[b]), st * I[t]]);
          quad(P(true, -1), P(false, -1), P(false, 1), P(true, 1), n);
        }
    }
  // Corners.
  const q = 1 / Math.sqrt(3);
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      for (const sz of [-1, 1]) {
        const S = [sx, sy, sz];
        const corner = (full: number) => [0, 1, 2].map((i) => S[i] * (i === full ? H[i] : I[i]));
        tri(corner(0), corner(1), corner(2), [sx * q, sy * q, sz * q]);
      }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  chamfers.set(key, g);
  return g;
}

/**
 * When `geo` is the unit box scaled by `m`: the chamfered box of that size and
 * the matrix without its scale (thin parts keep the plain box).
 */
const _cp = new THREE.Vector3();
const _cq = new THREE.Quaternion();
const _cs = new THREE.Vector3();
const _one = new THREE.Vector3(1, 1, 1);
export function chamfered(geo: THREE.BufferGeometry, m: THREE.Matrix4 | null): [THREE.BufferGeometry, THREE.Matrix4 | null] {
  if (geo !== unitBox || !m) return [geo, m];
  m.decompose(_cp, _cq, _cs);
  const mn = Math.min(_cs.x, _cs.y, _cs.z);
  if (mn < 0.025) return [geo, m];
  const r = Math.min(0.035, mn * 0.16);
  return [chamferBox(_cs.x, _cs.y, _cs.z, r), new THREE.Matrix4().compose(_cp, _cq, _one)];
}
export const unitCyl = (seg = 8) => new THREE.CylinderGeometry(0.5, 0.5, 1, Math.max(20, seg), 1, false);

/**
 * A tube along part of a track (s0 → s1), offset in the track's frame by
 * (side, up). For rails: two of these either side under the marble.
 */
export function tubeAlong(track: Track, s0: number, s1: number, side: number, up: number, r: number, radial = 6, perUnit = 3): THREE.BufferGeometry {
  const T = new THREE.Vector3();
  const S = new THREE.Vector3();
  const U = new THREE.Vector3();
  const P = new THREE.Vector3();
  const segs = Math.max(2, Math.ceil(Math.abs(s1 - s0) * perUnit));
  const pos: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const s = s0 + ((s1 - s0) * i) / segs;
    track.at(s, P);
    track.frame(s, T, S, U);
    const cx = P.x + S.x * side + U.x * up;
    const cy = P.y + S.y * side + U.y * up;
    const cz = P.z + S.z * side + U.z * up;
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const nx = S.x * Math.cos(a) + U.x * Math.sin(a);
      const ny = S.y * Math.cos(a) + U.y * Math.sin(a);
      const nz = S.z * Math.cos(a) + U.z * Math.sin(a);
      pos.push(cx + nx * r, cy + ny * r, cz + nz * r);
      nrm.push(nx, ny, nz);
    }
  }
  for (let i = 0; i < segs; i++)
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c = (i + 1) * radial + j;
      const d = (i + 1) * radial + ((j + 1) % radial);
      idx.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  return g;
}

/** A spur gear in the XY plane (axis +Z), centred: teeth, a rim, spokes and a hub. */
export function gearGeometry(r: number, teeth: number, thick: number, spokes = 5): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const tooth = (r * 0.12) / Math.max(1, r * 0.4);
  const depth = Math.min(r * 0.12, 0.35);
  const n = teeth * 4;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = i % 4;
    const rr = k === 1 || k === 2 ? r : r - depth;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  void tooth;
  // The web between the spokes is cut away.
  const inner = r - depth - Math.max(0.12, r * 0.14);
  const hub = Math.max(0.12, r * 0.18);
  for (let s = 0; s < spokes; s++) {
    const a0 = (s / spokes) * Math.PI * 2 + 0.16;
    const a1 = ((s + 1) / spokes) * Math.PI * 2 - 0.16;
    const hole = new THREE.Path();
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const a = a0 + ((a1 - a0) * i) / steps;
      const x = Math.cos(a) * inner;
      const y = Math.sin(a) * inner;
      if (i === 0) hole.moveTo(x, y);
      else hole.lineTo(x, y);
    }
    const am = (a0 + a1) / 2;
    hole.lineTo(Math.cos(a1 - 0.05) * (hub + 0.08), Math.sin(a1 - 0.05) * (hub + 0.08));
    hole.lineTo(Math.cos(am) * (hub + 0.04), Math.sin(am) * (hub + 0.04));
    hole.lineTo(Math.cos(a0 + 0.05) * (hub + 0.08), Math.sin(a0 + 0.05) * (hub + 0.08));
    hole.closePath();
    shape.holes.push(hole);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.12, bevelSize: Math.min(0.03, r * 0.01), bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, -thick / 2);
  return g;
}

/** A lathe from a profile of [radius, y] pairs. */
export function lathe(profile: [number, number][], seg = 40): THREE.BufferGeometry {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    seg
  );
}

/**
 * A pointed (gothic) arch outline as a flat frame in the XY plane: span w,
 * rise h, bar thickness t, depth d. `tie`: closed by a bar along its base
 * (a frame); without it, just the arch's band, open to the floor.
 */
export function gothicArch(w: number, h: number, t: number, d: number, seg = 14, tie = true): THREE.BufferGeometry {
  // Two rising curves meet at one precise point. The former circular formula
  // stopped short of the apex on wide vaults, leaving a flat bridge at the top.
  const half = w / 2;
  const outer = new THREE.Shape();
  const rising = (hw: number, hh: number) => new THREE.CubicBezierCurve(
    new THREE.Vector2(-hw, 0), new THREE.Vector2(-hw, hh * 0.53),
    new THREE.Vector2(-hw * 0.42, hh * 0.84), new THREE.Vector2(0, hh)
  ).getPoints(seg);
  const pts = rising(half, h);
  const right: THREE.Vector2[] = pts.map((p) => new THREE.Vector2(-p.x, p.y)).reverse();
  const outline = [...pts, ...right];
  if (!tie) {
    // The band alone: up the outer curve, down the inner one.
    const iw = half - t;
    const ih = h - t * 1.2;
    const ip = rising(iw, ih);
    const inner = [...ip, ...ip.map((p) => new THREE.Vector2(-p.x, p.y)).reverse()].reverse();
    const band = new THREE.Shape();
    band.moveTo(outline[0].x, outline[0].y);
    for (const p of [...outline.slice(1), ...inner]) band.lineTo(p.x, p.y);
    band.closePath();
    const g = new THREE.ExtrudeGeometry(band, { depth: d, bevelEnabled: false, curveSegments: 2 });
    g.translate(0, 0, -d / 2);
    return g;
  }
  outer.moveTo(outline[0].x, outline[0].y);
  for (const p of outline.slice(1)) outer.lineTo(p.x, p.y);
  outer.lineTo(half, -t);
  outer.lineTo(-half, -t);
  outer.closePath();
  const hole = new THREE.Path();
  const ih = h - t * 1.2;
  const iw = half - t;
  const ip = rising(iw, ih);
  const ir = ip.map((p) => new THREE.Vector2(-p.x, p.y)).reverse();
  const io = [...ip, ...ir];
  hole.moveTo(io[0].x, io[0].y + 0.001);
  for (const p of io.slice(1)) hole.lineTo(p.x, p.y);
  hole.closePath();
  outer.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(outer, { depth: d, bevelEnabled: false, curveSegments: 2 });
  g.translate(0, 0, -d / 2);
  return g;
}

/** A bent service pipe. It is physical infrastructure, separate from customer rails. */
export function pipeGeometry(points: THREE.Vector3[], r: number, radial = 8) {
  const path = new THREE.CatmullRomCurve3(points, false, "centripetal");
  return new THREE.TubeGeometry(path, Math.max(12, points.length * 10), r, radial, false);
}

/**
 * The light in a doorway (a plane w x h, tessellated) and its colour per
 * vertex: brightest through the middle and low, falling off toward the frame
 * and the top, as daylight through a door does. Not a flat card of white.
 */
export function doorLight(w: number, h: number, rgb: [number, number, number]): [THREE.BufferGeometry, (v: THREE.Vector3) => [number, number, number]] {
  const g = new THREE.PlaneGeometry(w, h, 14, 18);
  const col = (v: THREE.Vector3): [number, number, number] => {
    const u = (2 * v.x) / w;
    const t = v.y / h + 0.5;
    const across = 0.3 + 0.7 * Math.pow(Math.max(0, 1 - u * u), 0.9);
    const up = 0.62 + 0.38 * (1 - t) * (1 - t);
    const k = across * up;
    return [rgb[0] * k, rgb[1] * k, rgb[2] * k];
  };
  return [g, col];
}

/**
 * A sun or a moon: a sphere (not a disc), and its colour per vertex. The
 * moon carries soft darker seas; the light shader's falloff gives both their
 * roundness against the dark.
 */
export function orb(r: number, rgb: [number, number, number], seas = false): [THREE.BufferGeometry, (v: THREE.Vector3) => [number, number, number]] {
  const g = new THREE.SphereGeometry(r, 48, 32);
  const col = (v: THREE.Vector3): [number, number, number] => {
    if (!seas) return rgb;
    const x = v.x / r, y = v.y / r, z = v.z / r;
    const n = 0.5 + 0.5 * Math.sin(3.1 * x + 1.7) * Math.sin(2.3 * y + 0.4) * Math.sin(2.9 * z + 2.2) + 0.25 * Math.sin(7.3 * x - 2.1 * y + 4.0 * z);
    const k = 1 - 0.32 * Math.min(1, Math.max(0, (n - 0.55) / 0.25));
    return [rgb[0] * k, rgb[1] * k, rgb[2] * k];
  };
  return [g, col];
}

/** Make a matrix from position, Euler angles and scale. */
export function place(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, out = new THREE.Matrix4()) {
  return out.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
}

/** A ring (torus) geometry, low-poly. */
export const torus = (r: number, tube: number, radial = 6, tubular = 48, arc = Math.PI * 2) => new THREE.TorusGeometry(r, tube, Math.max(10, radial), Math.max(64, tubular), arc);

export { _m as scratchMatrix, _b as scratchB };
