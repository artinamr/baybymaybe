import * as THREE from "three";
import { at, Batch, block, footAO, gableEnd, gableRoof, hipRoof, ridgeOf, rod, ball, hull, turned, ROOF, LEAF } from "./model";
import { aoTexture, glowMat, groundMat, modelMat, POOLS, type GroundUniforms } from "./mats";

/**
 * THE TOWN: a suburb at the scale of an architect's model. Streets on a
 * grid (east-west at z = -92, -46, 0, 46, 92; north-south at x = -110, -66,
 * -22, 22, 66, 110), the main street at z = 0. Every block holds two rows of
 * lots, each row facing its own street. A hundred-odd houses in six kinds,
 * trees, hedges, parked cars, streetlights, and low hills all round.
 *
 * Two lots are kept for the story (places.ts): the customer's house (the
 * main street's south side, west) and the business's workshop (the north
 * side, east). Every other house is an instance whose windows can be lit
 * one by one (`setWindow`): the town's people, the film's customers.
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const STREETS_X = [-110, -66, -22, 22, 66, 110];
export const STREETS_Z = [-92, -46, 0, 46, 92];
export const ROAD = 7;
export const MAIN_ROAD = 10;
/** The town's plan, painted (x0, z0, width, depth in metres). */
export const PLAN = new THREE.Vector4(-150, -130, 300, 260);

/** The customer's lot (the house's middle on the ground; its front faces north, to the main street). */
export const HOME = { x: -44, z: 15.5, yaw: Math.PI };
/** The workshop's lot (front faces south, to the main street). */
export const SHOP = { x: 44, z: -17, yaw: 0 };

export type House = {
  id: number;
  kind: number;
  x: number;
  z: number;
  yaw: number;
  /** A point above the roof (where a phone card hovers), and the front door. */
  top: THREE.Vector3;
  door: THREE.Vector3;
  /** Its windows' instance (in its region's mesh). */
  slot: number;
  glass: THREE.InstancedMesh;
  /** Lit colour (warm, or a cooler white). */
  warm: THREE.Color;
};

/* ------------------------------------------------------------------ */
/* Houses: six kinds, each built in its own frame (front toward +Z).   */
/* ------------------------------------------------------------------ */

type Kind = { body: THREE.BufferGeometry; glass: THREE.BufferGeometry; w: number; d: number; h: number };

/** A window or a glazed door in a wall facing `face` (0 +Z, 1 +X, 2 -Z, 3 -X), its centre at (u along the wall, y), on a wall plane at `off`. */
function opening(b: Batch, g: Batch, face: number, off: number, u: number, y: number, w: number, h: number, sill = true, bars = true) {
  const yaw = [0, Math.PI / 2, Math.PI, -Math.PI / 2][face];
  const m = new THREE.Matrix4().makeRotationY(yaw);
  const place = (x: number, yy: number, z: number) => new THREE.Matrix4().multiplyMatrices(m, at(x, yy, z));
  const fr = 0.07;
  const out = 0.05;
  // The frame (proud of the wall), the sill, the glass inside it.
  b.add(block(w + fr * 2, fr, 0.09, 0), place(u, y + h / 2 + fr / 2, off + out), 1);
  b.add(block(fr, h, 0.09, 0), place(u - w / 2 - fr / 2, y, off + out), 1);
  b.add(block(fr, h, 0.09, 0), place(u + w / 2 + fr / 2, y, off + out), 1);
  if (sill) b.add(block(w + fr * 2 + 0.12, 0.06, 0.16, 0), place(u, y - h / 2 - 0.03, off + 0.07), 0.9);
  else b.add(block(w + fr * 2, fr, 0.09, 0), place(u, y - h / 2 - fr / 2, off + out), 1);
  if (bars) {
    // A transom: the top light, as old weatherboard houses have.
    b.add(block(w, 0.045, 0.06, 0), place(u, y + h * 0.22, off + out), 1);
    if (w > 1.3) b.add(block(0.045, h * 0.72, 0.06, 0), place(u, y - h * 0.14, off + out), 1);
  }
  g.add(block(w, h, 0.02, 0), place(u, y, off + 0.02), 1);
}

/** Weatherboards: fine horizontal lines on a wall (thin strips), only on the big kinds' fronts. */
function boards(b: Batch, face: number, off: number, w: number, y0: number, y1: number, skip: [number, number, number, number][] = []) {
  const yaw = [0, Math.PI / 2, Math.PI, -Math.PI / 2][face];
  const m = new THREE.Matrix4().makeRotationY(yaw);
  for (let y = y0 + 0.2; y < y1 - 0.1; y += 0.2) {
    // Split each board where an opening is.
    let segs: [number, number][] = [[-w / 2, w / 2]];
    for (const [u, yy, ww, hh] of skip) {
      if (y < yy - hh / 2 - 0.1 || y > yy + hh / 2 + 0.1) continue;
      const a = u - ww / 2 - 0.1;
      const c = u + ww / 2 + 0.1;
      segs = segs.flatMap(([s, e]) => {
        const r: [number, number][] = [];
        if (a > s) r.push([s, Math.min(a, e)]);
        if (c < e) r.push([Math.max(c, s), e]);
        return r;
      });
    }
    for (const [s, e] of segs) if (e - s > 0.15) b.add(block(e - s, 0.018, 0.012, 0), new THREE.Matrix4().multiplyMatrices(m, at((s + e) / 2, y, off + 0.006)), 0.97);
  }
}

const FLOOR = 0.45;

function bungalow(): Kind {
  const b = new Batch();
  const g = new Batch();
  const w = 11;
  const d = 8;
  const wall = 2.6;
  const top = FLOOR + wall;
  const ao = footAO(0, 1.2, 0.5);
  b.add(block(w - 0.2, FLOOR, d - 0.2), at(0, FLOOR / 2, 0), 0.62);
  b.add(block(w, wall, d), at(0, FLOOR + wall / 2, 0), ao);
  b.add(gableEnd(d, 0.47, 0.2), at(-w / 2 + 0.1, top, 0, 0, Math.PI / 2, 0), 1);
  b.add(gableEnd(d, 0.47, 0.2), at(w / 2 - 0.1, top, 0, 0, Math.PI / 2, 0), 1);
  b.add(block(w - 0.4, ridgeOf(d, 0.47) * 0.9, d - 0.4), at(0, top + ridgeOf(d, 0.47) * 0.42, 0), 0.9);
  b.add(gableRoof(d, w, 0.47, 0.45, 0.13), at(0, top, 0, 0, Math.PI / 2, 0), (p) => (p.y < top + 0.05 ? 0.75 : 1), ROOF);
  // Front: two windows, the door under a little porch roof.
  const fw: [number, number, number, number][] = [
    [-3.2, FLOOR + 1.45, 1.6, 1.4],
    [3.0, FLOOR + 1.45, 1.6, 1.4],
    [0.2, FLOOR + 1.05, 0.95, 2.1],
  ];
  opening(b, g, 0, d / 2, -3.2, FLOOR + 1.45, 1.6, 1.4);
  opening(b, g, 0, d / 2, 3.0, FLOOR + 1.45, 1.6, 1.4);
  opening(b, g, 0, d / 2, 0.2, FLOOR + 1.05, 0.95, 2.1, false, false);
  boards(b, 0, d / 2, w, FLOOR, top, fw);
  b.add(gableRoof(2.2, 1.6, 0.5, 0.15, 0.08), at(0.2, FLOOR + 2.45, d / 2 + 0.8, 0, 0, 0), 1, ROOF);
  b.add(rod(0.06, 2.45), at(-0.8, 0, d / 2 + 1.45), ao);
  b.add(rod(0.06, 2.45), at(1.2, 0, d / 2 + 1.45), ao);
  b.add(block(2.6, 0.15, 1.7), at(0.2, FLOOR - 0.07, d / 2 + 0.85), 0.8);
  b.add(block(1.2, 0.2, 0.45), at(0.2, 0.1, d / 2 + 1.85), 0.7);
  // Back and sides.
  opening(b, g, 2, d / 2, -2.5, FLOOR + 1.45, 1.8, 1.4);
  opening(b, g, 2, d / 2, 2.8, FLOOR + 1.45, 1.2, 1.2);
  opening(b, g, 1, w / 2, 0, FLOOR + 1.45, 1.4, 1.3);
  opening(b, g, 3, w / 2, 1, FLOOR + 1.45, 1.0, 1.2);
  // A chimney.
  b.add(block(0.6, 1.6, 0.6), at(-2.6, top + 1.4, -1.0), 0.95);
  return { body: b.build(), glass: g.build(), w, d, h: top + ridgeOf(d, 0.47) };
}

function villa(): Kind {
  const b = new Batch();
  const g = new Batch();
  const w = 10;
  const d = 12;
  const wall = 2.9;
  const top = FLOOR + wall;
  const ao = footAO(0, 1.2, 0.5);
  b.add(block(w - 0.2, FLOOR, d - 0.2), at(0, FLOOR / 2, 0), 0.62);
  b.add(block(w, wall, d), at(0, FLOOR + wall / 2, 0), ao);
  b.add(hipRoof(w, d, 0.52, 0.45, 0.16), at(0, top, 0), (p) => (p.y < top + 0.1 ? 0.75 : 1), ROOF);
  // The bay: a gabled front room standing forward, with a bay window.
  const bx = -2.6;
  b.add(block(4.2, wall + FLOOR, 1.8), at(bx, (wall + FLOOR) / 2, d / 2 + 0.9), ao);
  b.add(gableEnd(4.2, 0.62, 0.2), at(bx, top, d / 2 + 1.7), 1);
  b.add(gableRoof(4.2, 2.6, 0.62, 0.35, 0.13), at(bx, top, d / 2 + 0.6, 0, 0, 0), 1, ROOF);
  opening(b, g, 0, d / 2 + 1.8, bx, FLOOR + 1.5, 2.2, 1.6);
  // A verandah across the rest of the front.
  for (const x of [0.2, 2.4, 4.6]) b.add(rod(0.06, top - 0.1), at(x, 0, d / 2 + 1.7), ao);
  b.add(block(5.6, 0.12, 2.0), at(2.4, top - 0.15, d / 2 + 1.0, -0.12, 0, 0), 0.9);
  b.add(block(5.6, 0.15, 1.9), at(2.4, FLOOR - 0.07, d / 2 + 0.95), 0.8);
  opening(b, g, 0, d / 2, 1.2, FLOOR + 1.1, 0.95, 2.2, false, false);
  opening(b, g, 0, d / 2, 3.6, FLOOR + 1.55, 1.2, 1.6);
  opening(b, g, 2, d / 2, -2, FLOOR + 1.5, 2.2, 1.4);
  opening(b, g, 2, d / 2, 2.6, FLOOR + 1.5, 1.2, 1.4);
  opening(b, g, 1, w / 2, -2.5, FLOOR + 1.5, 1.2, 1.5);
  opening(b, g, 1, w / 2, 2.5, FLOOR + 1.5, 1.2, 1.5);
  opening(b, g, 3, w / 2, 0, FLOOR + 1.5, 1.2, 1.5);
  b.add(block(0.6, 1.8, 0.6), at(2.0, top + 1.6, -2.5), 0.95);
  return { body: b.build(), glass: g.build(), w, d: d + 1.8, h: top + 3.0 };
}

function modern(): Kind {
  const b = new Batch();
  const g = new Batch();
  const ao = footAO(0, 1.2, 0.5);
  // A long low box, an upper box set back, flat roofs with a thin edge.
  b.add(block(12, 3.0, 8), at(0, 1.5 + 0.15, 0), ao);
  b.add(block(12.3, 0.22, 8.3), at(0, 3.25, 0), 0.95);
  b.add(block(6.5, 2.8, 6.4), at(-2.2, 3.2 + 1.4, -0.6), 1);
  b.add(block(6.8, 0.22, 6.7), at(-2.2, 6.2, -0.6), 0.95);
  b.add(block(12.6, 0.15, 9.6), at(0, 0.075, 0.5), 0.7);
  opening(b, g, 0, 4, 2.6, 1.55, 4.4, 2.2, false, false);
  opening(b, g, 0, 4, -3.6, 1.7, 1.2, 1.2, true, false);
  opening(b, g, 0, 2.6, -2.2, 4.6, 4.2, 1.5, true, false);
  opening(b, g, 2, 4, 0, 1.6, 3.0, 1.6, true, false);
  opening(b, g, 1, 6, 0, 1.6, 2.0, 1.5, true, false);
  opening(b, g, 3, 6, 0, 1.6, 1.2, 1.5, true, false);
  // A slatted screen beside the door.
  for (let i = 0; i < 9; i++) b.add(block(0.05, 2.6, 0.12), at(-1.4 + i * 0.14, 1.45, 4.18), 0.9);
  return { body: b.build(), glass: g.build(), w: 12.6, d: 9.6, h: 6.4 };
}

function twoStorey(): Kind {
  const b = new Batch();
  const g = new Batch();
  const w = 8.4;
  const d = 9;
  const wall = 5.4;
  const top = FLOOR + wall;
  const ao = footAO(0, 1.2, 0.5);
  b.add(block(w - 0.2, FLOOR, d - 0.2), at(0, FLOOR / 2, 0), 0.62);
  b.add(block(w, wall, d), at(0, FLOOR + wall / 2, 0), ao);
  // The gable faces the street.
  b.add(gableEnd(w, 0.66, 0.2), at(0, top, d / 2 - 0.1), 1);
  b.add(gableEnd(w, 0.66, 0.2), at(0, top, -d / 2 + 0.1), 1);
  b.add(gableRoof(w, d, 0.66, 0.4, 0.13), at(0, top, 0), (p) => (p.y < top + 0.05 ? 0.75 : 1), ROOF);
  for (const y of [FLOOR + 1.45, FLOOR + 4.1]) {
    opening(b, g, 0, d / 2, -2.2, y, 1.3, 1.5);
    opening(b, g, 0, d / 2, 2.2, y, 1.3, 1.5);
    opening(b, g, 2, d / 2, -1.8, y, 1.6, 1.3);
    opening(b, g, 1, w / 2, 0, y, 1.1, 1.3);
    opening(b, g, 3, w / 2, -1, y, 1.1, 1.3);
  }
  opening(b, g, 0, d / 2, 0, FLOOR + 6.2, 0.7, 0.7, false, false);
  b.add(block(2.6, 0.12, 1.2), at(0, FLOOR + 2.6, d / 2 + 0.6), 0.95);
  b.add(block(1.0, 0.2, 0.5), at(0, 0.1, d / 2 + 0.7), 0.7);
  return { body: b.build(), glass: g.build(), w, d, h: top + ridgeOf(w, 0.66) };
}

function cottage(): Kind {
  const b = new Batch();
  const g = new Batch();
  const w = 8.4;
  const d = 7.4;
  const wall = 2.5;
  const top = FLOOR + wall;
  const ao = footAO(0, 1.2, 0.5);
  b.add(block(w - 0.2, FLOOR, d - 0.2), at(0, FLOOR / 2, 0), 0.62);
  b.add(block(w, wall, d), at(0, FLOOR + wall / 2, 0), ao);
  b.add(hipRoof(w, d, 0.6, 0.4, 0.15), at(0, top, 0), (p) => (p.y < top + 0.1 ? 0.75 : 1), ROOF);
  opening(b, g, 0, d / 2, -2.2, FLOOR + 1.4, 1.3, 1.3);
  opening(b, g, 0, d / 2, 2.2, FLOOR + 1.4, 1.3, 1.3);
  opening(b, g, 0, d / 2, 0, FLOOR + 1.05, 0.9, 2.05, false, false);
  opening(b, g, 2, d / 2, 0, FLOOR + 1.4, 1.6, 1.3);
  opening(b, g, 1, w / 2, 0, FLOOR + 1.4, 1.1, 1.2);
  opening(b, g, 3, w / 2, 0, FLOOR + 1.4, 1.1, 1.2);
  b.add(block(0.55, 1.6, 0.55), at(2.4, top + 1.3, 0.8), 0.95);
  b.add(block(1.2, 0.2, 0.5), at(0, 0.1, d / 2 + 0.35), 0.7);
  return { body: b.build(), glass: g.build(), w, d, h: top + 2.6 };
}

function skillion(): Kind {
  const b = new Batch();
  const g = new Batch();
  const ao = footAO(0, 1.2, 0.5);
  b.add(block(10, 0.3, 8), at(0, 0.15, 0), 0.62);
  // Walls rising toward the front; the roof a single plane over them.
  const front = 4.0;
  const back = 2.9;
  const pts = [V(-5, 0.3, -4), V(5, 0.3, -4), V(5, 0.3, 4), V(-5, 0.3, 4), V(-5, back, -4), V(5, back, -4), V(5, front, 4), V(-5, front, 4)];
  b.add(hull(pts), null, footAO(0, 1.2, 0.5));
  const tilt = Math.atan2(front - back, 8);
  b.add(block(10.8, 0.16, 9.0), at(0, (front + back) / 2 + 0.1, 0, -tilt, 0, 0), 0.95, ROOF);
  opening(b, g, 0, 4, 1.5, 1.7, 4.2, 2.4, false, false);
  opening(b, g, 0, 4, -3.4, 2.0, 1.4, 1.2, true, false);
  opening(b, g, 2, 4, 0, 1.5, 2.6, 1.0, true, false);
  opening(b, g, 1, 5, 0, 1.6, 1.6, 1.2, true, false);
  opening(b, g, 3, 5, 0, 1.6, 1.6, 1.2, true, false);
  b.add(block(10.6, 0.15, 2.0), at(0, 0.08, 5.0), 0.75);
  void ao;
  return { body: b.build(), glass: g.build(), w: 10.8, d: 9, h: 4.4 };
}

/* ------------------------------------------------------------------ */
/* Trees, cars, lamps                                                  */
/* ------------------------------------------------------------------ */

const BARK: [number, number, number] = [0.55, 0.5, 0.45];

/** A round tree: a trunk and a canopy of a few overlapping balls (model foam). */
function treeRound(): THREE.BufferGeometry {
  const b = new Batch();
  b.add(rod(0.16, 3.2, 10), at(0, 0, 0), (p) => 0.6 + 0.4 * Math.min(1, p.y / 2), BARK);
  b.add(ball(2.2, 20, 14), at(0, 4.6, 0, 0, 0, 0, 1, 0.9, 1), (p) => 0.55 + 0.45 * Math.min(1, Math.max(0, (p.y - 3) / 3)), LEAF);
  b.add(ball(1.6, 18, 12), at(1.3, 3.9, 0.6), (p) => 0.55 + 0.45 * Math.min(1, Math.max(0, (p.y - 2.6) / 2.6)), LEAF);
  b.add(ball(1.5, 18, 12), at(-1.1, 4.1, -0.7), (p) => 0.55 + 0.45 * Math.min(1, Math.max(0, (p.y - 2.8) / 2.6)), LEAF);
  return b.build();
}
/** A tall narrow tree (a cypress, a poplar). */
function treeTall(): THREE.BufferGeometry {
  const b = new Batch();
  b.add(rod(0.14, 1.6, 10), at(0, 0, 0), 0.7, BARK);
  b.add(turned([[0.0, 0], [1.1, 0.6], [1.35, 2.4], [1.1, 5.0], [0.6, 7.2], [0.0, 8.4]], 22), at(0, 1.0, 0), (p) => 0.55 + 0.45 * Math.min(1, Math.max(0, (p.y - 1) / 5)), LEAF);
  return b.build();
}
/** A wide, low canopy (a pohutukawa by the street). */
function treeWide(): THREE.BufferGeometry {
  const b = new Batch();
  b.add(rod(0.22, 2.4, 10), at(0, 0, 0), 0.65, BARK);
  b.add(rod(0.12, 2.2, 8), at(0.3, 1.6, 0, 0, 0, -0.6), 0.75, BARK);
  b.add(rod(0.12, 2.2, 8), at(-0.3, 1.6, 0.2, 0.3, 0, 0.6), 0.75, BARK);
  for (const [x, y, z, r] of [
    [0, 3.6, 0, 2.4],
    [2.2, 3.3, 0.6, 1.8],
    [-2.0, 3.4, -0.5, 1.9],
    [0.4, 3.2, 2.0, 1.6],
    [-0.6, 3.3, -2.0, 1.7],
  ] as const)
    b.add(ball(r, 18, 12), at(x, y, z, 0, 0, 0, 1, 0.62, 1), (p) => 0.55 + 0.45 * Math.min(1, Math.max(0, (p.y - 2.4) / 2.2)), LEAF);
  return b.build();
}

/** A car: a body, a cabin, four wheels (dark) in their arches. */
export function car(): { body: THREE.BufferGeometry; dark: THREE.BufferGeometry } {
  const b = new Batch();
  const k = new Batch();
  b.add(block(1.8, 0.62, 4.3, 0.08), at(0, 0.62, 0), (p) => (p.y < 0.45 ? 0.7 : 1));
  b.add(
    hull([V(-0.8, 0.93, -1.55), V(0.8, 0.93, -1.55), V(0.8, 0.93, 1.1), V(-0.8, 0.93, 1.1), V(-0.68, 1.45, -1.05), V(0.68, 1.45, -1.05), V(0.68, 1.45, 0.55), V(-0.68, 1.45, 0.55)]),
    null,
    1
  );
  for (const [x, z] of [
    [-0.82, -1.35],
    [0.82, -1.35],
    [-0.82, 1.35],
    [0.82, 1.35],
  ])
    k.add(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 18), at(x, 0.33, z, 0, 0, Math.PI / 2), 1);
  // The windows as dark glass bands.
  k.add(
    hull([V(-0.81, 0.97, -1.5), V(0.81, 0.97, -1.5), V(0.81, 0.97, 1.05), V(-0.81, 0.97, 1.05), V(-0.69, 1.4, -1.02), V(0.69, 1.4, -1.02), V(0.69, 1.4, 0.52), V(-0.69, 1.4, 0.52)]).scale(1.012, 0.985, 0.985).translate(0, 0.005, 0),
    null,
    1
  );
  return { body: b.build(), dark: k.build() };
}

function lamp(): { pole: THREE.BufferGeometry; head: THREE.BufferGeometry } {
  const b = new Batch();
  const h = new Batch();
  b.add(rod(0.07, 6.4, 10), at(0, 0, 0), (p) => 0.6 + 0.4 * Math.min(1, p.y / 1.5));
  b.add(rod(0.15, 0.5, 12), at(0, 0, 0), 0.7);
  b.add(block(0.08, 0.08, 1.4), at(0, 6.3, 0.62), 1);
  b.add(block(0.32, 0.12, 0.6), at(0, 6.26, 1.22), 1);
  h.add(block(0.26, 0.03, 0.52), at(0, 6.19, 1.22), 1);
  return { pole: b.build(), head: h.build() };
}

/* ------------------------------------------------------------------ */
/* The town                                                             */
/* ------------------------------------------------------------------ */

/** The town's regions for culling: 60 m by 55 m cells over a wide square. */
const regionOf = (x: number, z: number) => {
  const rx = Math.max(0, Math.min(7, Math.floor((x + 240) / 60)));
  const rz = Math.max(0, Math.min(7, Math.floor((z + 220) / 55)));
  return rz * 8 + rx;
};

/**
 * Instances of one geometry, split into a mesh per region so each region can
 * be culled (the shadow map and the camera only draw what they can see).
 * Returns, for each item, its mesh and slot.
 */
function chunked(group: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material, items: { m: THREE.Matrix4; x: number; z: number }[], opts: { shadow?: boolean; receive?: boolean; color?: THREE.Color } = {}) {
  const by = new Map<number, number[]>();
  items.forEach((it, i) => {
    const r = regionOf(it.x, it.z);
    let l = by.get(r);
    if (!l) by.set(r, (l = []));
    l.push(i);
  });
  const where: { mesh: THREE.InstancedMesh; slot: number }[] = new Array(items.length);
  for (const list of by.values()) {
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    im.castShadow = !!opts.shadow;
    im.receiveShadow = opts.receive ?? !!opts.shadow;
    list.forEach((i, slot) => {
      im.setMatrixAt(slot, items[i].m);
      if (opts.color) im.setColorAt(slot, opts.color);
      where[i] = { mesh: im, slot };
    });
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    im.frustumCulled = true;
    group.add(im);
  }
  return where;
}

/**
 * A height field of the town: the top of whatever stands in each 1 m cell
 * (houses, trees, cars, fences, lamps). The camera reads it to back away on a
 * phone without backing into anything (camera.ts phoneAdjust).
 */
export class HeightField {
  readonly x0 = -170;
  readonly z0 = -150;
  readonly n = 340;
  readonly m = 300;
  readonly h = new Float32Array(340 * 300);
  get(x: number, z: number) {
    const i = Math.floor(x - this.x0);
    const j = Math.floor(z - this.z0);
    if (i < 0 || j < 0 || i >= this.n || j >= this.m) return 0;
    return this.h[j * this.n + i];
  }
  /** A rotated box (centre, size, turn about y) up to height top. */
  box(cx: number, cz: number, w: number, d: number, yaw: number, top: number) {
    const c = Math.cos(yaw);
    const sn = Math.sin(yaw);
    const r = Math.hypot(w, d) / 2 + 1;
    for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        // The cell's centre, in the box's frame.
        const dx = x + 0.5 - cx;
        const dz = z + 0.5 - cz;
        const u = dx * c - dz * sn;
        const v = dx * sn + dz * c;
        if (Math.abs(u) <= w / 2 + 0.6 && Math.abs(v) <= d / 2 + 0.6) this.set(x, z, top);
      }
  }
  /** A disc (a tree's canopy) up to height top. */
  disc(cx: number, cz: number, r: number, top: number) {
    for (let z = Math.floor(cz - r - 1); z <= Math.ceil(cz + r + 1); z++)
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) if (Math.hypot(x + 0.5 - cx, z + 0.5 - cz) <= r + 0.6) this.set(x, z, top);
  }
  private set(x: number, z: number, top: number) {
    const i = x - this.x0;
    const j = z - this.z0;
    if (i < 0 || j < 0 || i >= this.n || j >= this.m) return;
    const k = j * this.n + i;
    if (top > this.h[k]) this.h[k] = top;
  }
}

export type Town = {
  group: THREE.Group;
  houses: House[];
  /** Set a house's windows: light 0 (dark glass) … 1 lit, and an optional colour override. */
  setWindow: (id: number, k: number, col?: THREE.Color) => void;
  /** The dark glass colour (the sky's reflection) and the lights' level, per frame. */
  setGlass: (dark: THREE.Color, lit: number) => void;
  ground: GroundUniforms;
  lamps: THREE.Vector3[];
  setLamps: (k: number) => void;
  /** Pools of light beyond the streetlights (rooms of the story), index from `lamps.length`. */
  pool: (i: number, x: number, z: number, r: number, power: number, col: THREE.Color) => void;
  mats: THREE.Material[];
  field: HeightField;
};

export function buildTown(scene: THREE.Scene, quality: number): Town {
  const R = rng(20261014);
  const group = new THREE.Group();
  scene.add(group);
  const white = modelMat(0.84);
  const foliage = modelMat(0.95, 0.5);
  const glass = glowMat();
  const dark = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.45, metalness: 0.1 });
  const mats: THREE.Material[] = [white, foliage, glass, dark];

  // The lots.
  type Lot = { x: number; z: number; yaw: number; w: number; d: number };
  const lots: Lot[] = [];
  const bx = STREETS_X;
  const bz = STREETS_Z;
  for (let i = 0; i < bx.length - 1; i++)
    for (let j = 0; j < bz.length - 1; j++) {
      const x0 = bx[i] + ROAD / 2 + 2;
      const x1 = bx[i + 1] - ROAD / 2 - 2;
      const zN = bz[j];
      const zS = bz[j + 1];
      const halfMain = (z: number) => (z === 0 ? MAIN_ROAD / 2 + 2 : ROAD / 2 + 2);
      const n = 3;
      const lw = (x1 - x0) / n;
      for (let k = 0; k < n; k++) {
        const x = x0 + lw * (k + 0.5);
        // North row faces the north street (front toward -Z).
        lots.push({ x, z: zN + halfMain(zN) + 9.5, yaw: Math.PI, w: lw, d: 19 });
        lots.push({ x, z: zS - halfMain(zS) - 9.5, yaw: 0, w: lw, d: 19 });
      }
    }
  // A reserve (one block of trees and a path), the story's two lots and their neighbours.
  const reserve = (l: Lot) => l.x > 66 && l.x < 110 && l.z > 0 && l.z < 46;
  const story = (l: Lot) => (Math.abs(l.x - HOME.x) < 7 && l.z > 0 && l.z < 46) || (Math.abs(l.x - SHOP.x) < 13 && l.z > -46 && l.z < 0);

  const kinds = [bungalow(), villa(), modern(), twoStorey(), cottage(), skillion()];
  const placed: { lot: Lot; kind: number; yaw: number; x: number; z: number }[] = [];
  for (const l of lots) {
    if (reserve(l) || story(l)) continue;
    const kind = Math.floor(R() * kinds.length);
    // The house stands toward its street (a front yard of 4-6 m), a little turned.
    const set = 4.2 + R() * 1.6;
    const fz = l.yaw === 0 ? 1 : -1;
    const kd = kinds[kind].d;
    const z = l.z + fz * (l.d / 2 - set - kd / 2);
    const x = l.x + (R() - 0.5) * Math.max(0, l.w - kinds[kind].w - 2);
    placed.push({ lot: l, kind, yaw: l.yaw + (R() - 0.5) * 0.05, x, z });
  }

  // Instanced houses: per kind, per region.
  const houses: House[] = [];
  const q = new THREE.Quaternion();
  const one = V(1, 1, 1);
  kinds.forEach((k, ki) => {
    const list = placed.filter((p) => p.kind === ki);
    if (!list.length) return;
    const items = list.map((p) => ({ m: new THREE.Matrix4().compose(V(p.x, 0, p.z), q.setFromAxisAngle(V(0, 1, 0), p.yaw).clone(), one), x: p.x, z: p.z }));
    chunked(group, k.body, white, items, { shadow: true });
    const gw = chunked(group, k.glass, glass, items, { color: new THREE.Color(0.02, 0.025, 0.035) });
    list.forEach((p, i) => {
      const fwd = V(Math.sin(p.yaw), 0, Math.cos(p.yaw));
      const warm = R() < 0.25 ? new THREE.Color(1.0, 0.86, 0.7) : new THREE.Color(1.0, 0.64 + R() * 0.08, 0.34 + R() * 0.08);
      houses.push({
        id: houses.length,
        kind: ki,
        x: p.x,
        z: p.z,
        yaw: p.yaw,
        top: V(p.x, k.h + 3.2, p.z),
        door: V(p.x + fwd.x * (k.d / 2 + 1.5), 0, p.z + fwd.z * (k.d / 2 + 1.5)),
        slot: gw[i].slot,
        glass: gw[i].mesh,
        warm,
      });
    });
  });
  const houseLight = new Float32Array(houses.length);
  const houseCol: (THREE.Color | null)[] = houses.map(() => null);
  const darkGlass = new THREE.Color(0.02, 0.025, 0.035);
  let litLevel = 2.6;
  const tmp = new THREE.Color();
  const writeHouse = (h: House) => {
    const k = houseLight[h.id];
    const col = houseCol[h.id] ?? h.warm;
    tmp.copy(darkGlass).lerp(col.clone().multiplyScalar(litLevel), k);
    h.glass.setColorAt(h.slot, tmp);
    if (h.glass.instanceColor) h.glass.instanceColor.needsUpdate = true;
  };
  const setWindow = (id: number, k: number, col?: THREE.Color) => {
    const h = houses[id];
    if (!h) return;
    const c = col ?? null;
    if (Math.abs(houseLight[id] - k) < 0.004 && houseCol[id] === c) return;
    houseLight[id] = k;
    houseCol[id] = c;
    writeHouse(h);
  };
  const setGlass = (d: THREE.Color, lit: number) => {
    if (d.equals(darkGlass) && Math.abs(lit - litLevel) < 0.01) return;
    darkGlass.copy(d);
    litLevel = lit;
    houses.forEach(writeHouse);
  };

  // Trees: along the main street, in yards, the reserve full of them.
  const trees: { x: number; z: number; kind: number; s: number; r: number }[] = [];
  for (let x = -140; x <= 140; x += 14) {
    if (bx.some((s) => Math.abs(s - x) < 6)) continue;
    for (const z of [-MAIN_ROAD / 2 - 1.2, MAIN_ROAD / 2 + 1.2]) {
      const tx = x + (R() - 0.5) * 2;
      const r = R();
      const sc = 0.8 + R() * 0.25;
      if (Math.abs(tx - SHOP.x) < 14 || Math.abs(tx - HOME.x) < 11) continue;
      trees.push({ x: tx, z, kind: 2, s: sc, r: r * 6 });
    }
  }
  for (const p of placed) {
    if (R() < 0.75) {
      const back = p.lot.yaw === 0 ? -1 : 1;
      trees.push({ x: p.lot.x + (R() - 0.5) * (p.lot.w - 4), z: p.lot.z + back * (p.lot.d / 2 - 2.5), kind: R() < 0.3 ? 1 : 0, s: 0.75 + R() * 0.45, r: R() * 6 });
    }
  }
  for (let i = 0; i < 26; i++) trees.push({ x: 72 + R() * 32, z: 6 + R() * 34, kind: R() < 0.2 ? 1 : R() < 0.6 ? 0 : 2, s: 0.8 + R() * 0.6, r: R() * 6 });
  // The ring of trees round the town's edge, thinning into the fields.
  for (let i = 0; i < 70; i++) {
    const a = R() * Math.PI * 2;
    const r = 150 + R() * 70;
    trees.push({ x: Math.cos(a) * r * 1.05, z: Math.sin(a) * r * 0.9, kind: R() < 0.4 ? 1 : 0, s: 0.9 + R() * 0.8, r: R() * 6 });
  }
  const treeGeos = [treeRound(), treeTall(), treeWide()];
  treeGeos.forEach((g, ki) => {
    const list = trees.filter((t) => t.kind === ki);
    const items = list.map((t) => ({ m: new THREE.Matrix4().compose(V(t.x, 0, t.z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), t.r), V(t.s, t.s * (0.9 + (t.r % 1) * 0.2), t.s)), x: t.x, z: t.z }));
    chunked(group, g, foliage, items, { shadow: true });
  });

  // Hedges and fences: a low hedge along each front (a gap for the drive), paling fences between yards.
  const fences = new Map<number, Batch>();
  for (const p of placed) {
    const reg = regionOf(p.lot.x, p.lot.z);
    let fence = fences.get(reg);
    if (!fence) fences.set(reg, (fence = new Batch()));
    const l = p.lot;
    const front = l.yaw === 0 ? 1 : -1;
    const fz = l.z + front * (l.d / 2 - 0.3);
    const gapX = l.x + (R() < 0.5 ? -1 : 1) * (l.w / 2 - 2.2);
    const segs: [number, number][] = [
      [l.x - l.w / 2 + 0.2, gapX - 1.6],
      [gapX + 1.6, l.x + l.w / 2 - 0.2],
    ];
    const hedge = R() < 0.5;
    for (const [a, b] of segs)
      if (b - a > 0.5) fence.add(block(b - a, hedge ? 0.95 : 0.8, hedge ? 0.7 : 0.12, hedge ? 0.2 : 0.02), at((a + b) / 2, hedge ? 0.475 : 0.4, fz), footAO(0, 0.6, 0.55));
    // A paling fence at the back.
    fence.add(block(l.w - 0.2, 1.7, 0.08), at(l.x, 0.85, l.z - front * (l.d / 2 - 0.1)), footAO(0, 0.9, 0.55));
  }
  for (const fence of fences.values()) {
    const fenceMesh = new THREE.Mesh(fence.build(), white);
    fenceMesh.castShadow = true;
    fenceMesh.receiveShadow = true;
    group.add(fenceMesh);
  }

  // Parked cars in some drives and along the kerb.
  const carGeo = car();
  const cars: { x: number; z: number; yaw: number }[] = [];
  for (const p of placed) {
    if (R() < 0.45) {
      const l = p.lot;
      const front = l.yaw === 0 ? 1 : -1;
      const sx = p.x > l.x ? -1 : 1;
      cars.push({ x: l.x + sx * (l.w / 2 - 2.4), z: l.z + front * (l.d / 2 - 3.6), yaw: l.yaw });
    }
  }
  for (let i = 0; i < 18; i++) {
    const x = -130 + R() * 260;
    if (bx.some((s) => Math.abs(s - x) < 8)) continue;
    const side = R() < 0.5 ? -1 : 1;
    cars.push({ x, z: side * (MAIN_ROAD / 2 - 1.2), yaw: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
  }
  const carItems = cars.map((c) => ({ m: new THREE.Matrix4().compose(V(c.x, 0, c.z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), c.yaw), one), x: c.x, z: c.z }));
  chunked(group, carGeo.body, white, carItems, { shadow: true });
  chunked(group, carGeo.dark, dark, carItems, {});

  // Streetlights, both sides of the main street, one side of the rest.
  const lamps: THREE.Vector3[] = [];
  const lampAt: { x: number; z: number; yaw: number }[] = [];
  for (let x = -128; x <= 128; x += 32) {
    if (bx.some((s) => Math.abs(s - x) < 6)) continue;
    lampAt.push({ x, z: -MAIN_ROAD / 2 - 0.6, yaw: 0 });
    lampAt.push({ x: x + 16, z: MAIN_ROAD / 2 + 0.6, yaw: Math.PI });
  }
  for (const z of [-46, 46])
    for (let x = -120; x <= 120; x += 44) {
      if (bx.some((s) => Math.abs(s - x) < 6)) continue;
      lampAt.push({ x, z: z - ROAD / 2 - 0.5, yaw: 0 });
    }
  const lg = lamp();
  const lampItems = lampAt.map((l) => ({ m: new THREE.Matrix4().compose(V(l.x, 0, l.z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), l.yaw), one), x: l.x, z: l.z }));
  chunked(group, lg.pole, white, lampItems, { shadow: true });
  const heads = chunked(group, lg.head, glass, lampItems, { color: new THREE.Color(0, 0, 0) });
  for (const l of lampAt) lamps.push(V(l.x + Math.sin(l.yaw) * 1.22, 6.2, l.z + Math.cos(l.yaw) * 1.22));

  // The hills: a low ring far out, its folds from a few sines.
  {
    const seg = 160;
    const rings = 8;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let j = 0; j <= rings; j++) {
      const t = j / rings;
      const r = 230 + t * 260;
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        const h =
          Math.max(0, Math.sin(t * Math.PI)) *
          (18 + 14 * Math.sin(a * 3 + 1.3) + 9 * Math.sin(a * 7 + 0.4) + 5 * Math.sin(a * 13 + 2.2) + (a > 3.6 && a < 5.4 ? 22 : 0) * Math.sin(((a - 3.6) / 1.8) * Math.PI));
        pos.push(Math.cos(a) * r, h * Math.min(1, t * 3), Math.sin(a) * r);
      }
    }
    for (let j = 0; j < rings; j++)
      for (let i = 0; i < seg; i++) {
        const a = j * (seg + 1) + i;
        const b = a + seg + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const n = g.getAttribute("position").count;
    g.setAttribute("aAO", new THREE.BufferAttribute(new Float32Array(n).fill(0.85), 1));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3).fill(0.8), 3));
    const hills = new THREE.Mesh(g, white);
    hills.receiveShadow = false;
    group.add(hills);
  }

  // The ground: its plan and its occlusion, painted.
  const W = quality === 0 ? 2048 : 4096;
  const H = Math.round((W * PLAN.w) / PLAN.z);
  const plan = document.createElement("canvas");
  plan.width = W;
  plan.height = H;
  const c = plan.getContext("2d")!;
  const sx = W / PLAN.z;
  const X = (x: number) => (x - PLAN.x) * sx;
  const Z = (z: number) => (z - PLAN.y) * sx;
  c.fillStyle = "#a7b98f";
  c.fillRect(0, 0, W, H);
  // Faint mowing and grain over the lawns.
  for (let i = 0; i < 9000; i++) {
    c.fillStyle = `rgba(${R() < 0.5 ? "255,255,255" : "120,110,95"},${0.02 + R() * 0.03})`;
    const r = 1 + R() * 5;
    c.fillRect(R() * W, R() * H, r, r);
  }
  const road = (x0: number, z0: number, x1: number, z1: number, w: number) => {
    // Footpath, kerb, road.
    c.fillStyle = "#d9d7d1";
    c.fillRect(X(Math.min(x0, x1) - (x0 === x1 ? w / 2 + 2 : 0)), Z(Math.min(z0, z1) - (z0 === z1 ? w / 2 + 2 : 0)), (Math.abs(x1 - x0) + (x0 === x1 ? w + 4 : 0)) * sx, (Math.abs(z1 - z0) + (z0 === z1 ? w + 4 : 0)) * sx);
  };
  const tar = (x0: number, z0: number, x1: number, z1: number, w: number) => {
    c.fillStyle = "#84878c";
    c.fillRect(X(Math.min(x0, x1) - (x0 === x1 ? w / 2 : 0)), Z(Math.min(z0, z1) - (z0 === z1 ? w / 2 : 0)), (Math.abs(x1 - x0) + (x0 === x1 ? w : 0)) * sx, (Math.abs(z1 - z0) + (z0 === z1 ? w : 0)) * sx);
  };
  // The streets run on past the town and stop short of the plan's edge (its edge pixels stretch out to the horizon).
  for (const z of bz) road(-136, z, 136, z, z === 0 ? MAIN_ROAD : ROAD);
  for (const x of bx) road(x, -118, x, 118, ROAD);
  for (const z of bz) tar(-136, z, 136, z, z === 0 ? MAIN_ROAD : ROAD);
  for (const x of bx) tar(x, -118, x, 118, ROAD);
  // The centre line of the main street.
  c.fillStyle = "#d8d6cf";
  for (let x = -136; x < 136; x += 6) c.fillRect(X(x), Z(-0.06), 3 * sx, 0.12 * sx);
  // Drives and paths to each front door.
  for (const p of placed) {
    const l = p.lot;
    const front = l.yaw === 0 ? 1 : -1;
    const kerbZ = l.z + front * (l.d / 2);
    const k = kinds[p.kind];
    const houseFront = p.z + front * (k.d / 2);
    c.fillStyle = "#cfccc5";
    const dx = p.x > l.x ? -1 : 1;
    const drX = l.x + dx * (l.w / 2 - 2.4);
    c.fillRect(X(drX - 1.5), Z(Math.min(kerbZ, houseFront)), 3 * sx, Math.abs(kerbZ - houseFront) * sx);
    c.fillRect(X(p.x - 0.6), Z(Math.min(kerbZ, houseFront)), 1.2 * sx, Math.abs(kerbZ - houseFront) * sx);
  }
  // The reserve's path.
  c.strokeStyle = "#d6d2c8";
  c.lineWidth = 2.2 * sx;
  c.beginPath();
  c.moveTo(X(70), Z(40));
  c.bezierCurveTo(X(85), Z(20), X(95), Z(30), X(106), Z(8));
  c.stroke();

  const planTex = new THREE.CanvasTexture(plan);
  planTex.colorSpace = THREE.SRGBColorSpace;
  planTex.anisotropy = 8;
  planTex.minFilter = THREE.LinearMipmapLinearFilter;

  // Occlusion: everything standing on the ground darkens it a little round its foot.
  const AW = 1024;
  const AH = Math.round((AW * PLAN.w) / PLAN.z);
  const aoC = document.createElement("canvas");
  aoC.width = AW;
  aoC.height = AH;
  const a = aoC.getContext("2d")!;
  const as = AW / PLAN.z;
  const AX = (x: number) => (x - PLAN.x) * as;
  const AZ = (z: number) => (z - PLAN.y) * as;
  a.fillStyle = "#fff";
  a.fillRect(0, 0, AW, AH);
  a.filter = "blur(5px)";
  a.fillStyle = "rgba(0,0,0,0.5)";
  const foot = (x: number, z: number, w: number, d: number, yaw: number, grow = 0.8) => {
    a.save();
    a.translate(AX(x), AZ(z));
    a.rotate(-yaw);
    a.fillRect((-w / 2 - grow) * as, (-d / 2 - grow) * as, (w + grow * 2) * as, (d + grow * 2) * as);
    a.restore();
  };
  for (const p of placed) foot(p.x, p.z, kinds[p.kind].w, kinds[p.kind].d, p.yaw);
  for (const cc of cars) foot(cc.x, cc.z, 1.8, 4.3, cc.yaw, 0.4);
  a.fillStyle = "rgba(0,0,0,0.32)";
  for (const t of trees) {
    a.beginPath();
    a.arc(AX(t.x), AZ(t.z), (t.kind === 2 ? 2.6 : 1.8) * t.s * as, 0, Math.PI * 2);
    a.fill();
  }
  a.filter = "none";
  const aoTex = aoTexture(aoC);

  // The streetlights' pools on the ground, baked (a soft core and a long faint tail).
  const LW = 1024;
  const LH = Math.round((LW * PLAN.w) / PLAN.z);
  const lc = document.createElement("canvas");
  lc.width = LW;
  lc.height = LH;
  const lx = lc.getContext("2d")!;
  lx.fillStyle = "#000";
  lx.fillRect(0, 0, LW, LH);
  lx.globalCompositeOperation = "lighter";
  const ls = LW / PLAN.z;
  for (const l of lampAt) {
    const px = (l.x + Math.sin(l.yaw) * 1.22 - PLAN.x) * ls;
    const pz = (l.z + Math.cos(l.yaw) * 1.22 - PLAN.y) * ls;
    const R0 = 7.5 * ls;
    const g = lx.createRadialGradient(px, pz, 0, px, pz, R0 * 2.2);
    // exp(-2.2 r^2) + 0.25 exp(-0.55 r^2), r in pool radii, sampled along the gradient.
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const r = t * 2.2;
      const v = Math.min(1, (Math.exp(-2.2 * r * r) + 0.25 * Math.exp(-0.55 * r * r)) / 1.25);
      g.addColorStop(t, `rgba(255,255,255,${v.toFixed(4)})`);
    }
    lx.fillStyle = g;
    lx.beginPath();
    lx.arc(px, pz, R0 * 2.2, 0, Math.PI * 2);
    lx.fill();
  }
  const lampTex = aoTexture(lc);

  const gm = groundMat(planTex, aoTex, lampTex, PLAN);
  mats.push(gm.mat);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(PLAN.z * 3, PLAN.w * 3), gm.mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(PLAN.x + PLAN.z / 2, 0, PLAN.y + PLAN.w / 2);
  ground.receiveShadow = true;
  group.add(ground);
  // The plan's texture covers the town; beyond it, the ground keeps the lawn colour (clamped edge).
  planTex.wrapS = planTex.wrapT = THREE.ClampToEdgeWrapping;
  {
    // The plane's UVs: so the plan sits on the town and stretches its edge beyond it.
    const uv = ground.geometry.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * 3 - 1, uv.getY(i) * 3 - 1);
    }
    uv.needsUpdate = true;
  }

  const pool = (i: number, x: number, z: number, r: number, power: number, col: THREE.Color) => {
    const k = i;
    if (k >= POOLS) return;
    gm.u.uPools.value[k].set(x, z, r, power);
    gm.u.uPoolCol.value[k].set(col.r, col.g, col.b);
  };
  let lampK = -1;
  const setLamps = (k: number) => {
    if (Math.abs(k - lampK) < 0.005) return;
    lampK = k;
    gm.u.uLampK.value = k;
    lamps.forEach((l, i) => {
      heads[i].mesh.setColorAt(heads[i].slot, new THREE.Color(1.0, 0.78, 0.5).multiplyScalar(6 * k + 0.02));
      if (heads[i].mesh.instanceColor) heads[i].mesh.instanceColor.needsUpdate = true;
    });
  };

  // What stands where, for the camera.
  const field = new HeightField();
  for (const p of placed) field.box(p.x, p.z, kinds[p.kind].w, kinds[p.kind].d, p.yaw, kinds[p.kind].h + 0.6);
  for (const t of trees) field.disc(t.x, t.z, (t.kind === 2 ? 4.0 : t.kind === 1 ? 1.4 : 2.9) * t.s, (t.kind === 1 ? 9.4 : t.kind === 2 ? 5.1 : 6.8) * t.s * 1.1);
  for (const c of cars) field.box(c.x, c.z, 1.9, 4.4, c.yaw, 1.6);
  for (const l of lampAt) field.disc(l.x + Math.sin(l.yaw) * 0.7, l.z + Math.cos(l.yaw) * 0.7, 0.9, 6.6);
  for (const p of placed) {
    const l = p.lot;
    const front = l.yaw === 0 ? 1 : -1;
    field.box(l.x, l.z + front * (l.d / 2 - 0.3), l.w, 0.8, 0, 1.0);
    field.box(l.x, l.z - front * (l.d / 2 - 0.1), l.w, 0.2, 0, 1.8);
  }
  return { group, houses, setWindow, setGlass, ground: gm.u, lamps, setLamps, pool, mats, field };
}
