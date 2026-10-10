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
export const unitCyl = (seg = 8) => new THREE.CylinderGeometry(0.5, 0.5, 1, seg, 1, false);

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
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.12, bevelSize: Math.min(0.03, r * 0.01), bevelSegments: 1, curveSegments: 4 });
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

/** A pointed (gothic) arch outline as a flat frame in the XY plane: span w, rise h, bar thickness t, depth d. */
export function gothicArch(w: number, h: number, t: number, d: number, seg = 14): THREE.BufferGeometry {
  // Two arcs from the springing line (y 0) meeting at the apex (y h).
  const half = w / 2;
  const R = (half * half + h * h) / (2 * half);
  const outer = new THREE.Shape();
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.asin(h / R);
    pts.push(new THREE.Vector2(-half + R - Math.cos(a) * R, Math.sin(a) * R));
  }
  const right: THREE.Vector2[] = pts.map((p) => new THREE.Vector2(-p.x, p.y)).reverse();
  const outline = [...pts, ...right];
  outer.moveTo(outline[0].x, outline[0].y);
  for (const p of outline.slice(1)) outer.lineTo(p.x, p.y);
  outer.lineTo(half, -t);
  outer.lineTo(-half, -t);
  outer.closePath();
  const hole = new THREE.Path();
  const ih = h - t * 1.2;
  const iw = half - t;
  const IR = (iw * iw + ih * ih) / (2 * iw);
  const ip: THREE.Vector2[] = [];
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.asin(Math.min(1, ih / IR));
    ip.push(new THREE.Vector2(-iw + IR - Math.cos(a) * IR, Math.sin(a) * IR));
  }
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

/** Make a matrix from position, Euler angles and scale. */
export function place(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, out = new THREE.Matrix4()) {
  return out.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
}

/** A ring (torus) geometry, low-poly. */
export const torus = (r: number, tube: number, radial = 6, tubular = 48, arc = Math.PI * 2) => new THREE.TorusGeometry(r, tube, radial, tubular, arc);

export { _m as scratchMatrix, _b as scratchB };
