import * as THREE from "three";
import { CORNER, corner, DISH, EDGE, FUNNEL, GATE_X, GATE_Y, PIT_Y, TRAYS, TRAY_Y, UTURN, type Layout } from "./layout";

import { FALL_END, FALL_T, heroAt, heroInit, type HeroState } from "./hero";
import { lerp, range, smoother } from "./ease";

/**
 * THE CAMERA: one flight through the whole film, keyed on the film's clock.
 * A key is an eye, a point to look at, a lens and a frame; some keys ride
 * with our customer (their points are offsets from it), some are set. All
 * keys are evaluated at the current moment, then joined by a shape-preserving
 * Hermite curve. Shared tangents keep the flight C1 in P without throwing
 * the eye beyond a shot when a moving chase meets a fixed composition.
 */

type Ctx = { h: HeroState; L: Layout };
type Pt = (c: Ctx) => THREE.Vector3;
export type Key = {
  P: number;
  eye: Pt;
  at: Pt;
  fov: number;
  /** Where the point looked at sits on screen (0..1 across, 0..1 down). */
  ppx?: number;
  ppy?: number;
  roll?: number;
};

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const fix = (x: number, y: number, z: number): Pt => () => V(x, y, z);
/** A fixed point in the owner's corner (layout.ts: x right, y above the floor, z toward the tower). */
const cfix = (x: number, y: number, z: number): Pt => () => corner(x, y, z);
/** Round the tower's axis (x 0, z -1): angle a, radius r, height y. */
const orbit = (a: number, r: number, y: number): Pt => () => V(Math.cos(a) * r, y, Math.sin(a) * r - 1);
/** On the tower's axis at the customer's height, drawn toward the customer by k. */
const axisToward = (k: number, dy = 0): Pt => (c) => V(0, c.h.pos.y + dy, -1).lerp(c.h.pos, k);
const rel = (x: number, y: number, z: number): Pt => (c) => c.h.pos.clone().add(V(x, y, z));
const T = (L: Layout) => L.TURB;
/**
 * The chase: behind our customer along the way it is heading (level), up,
 * and to one side (+ is its right); looking ahead of it, a little down.
 */
const chase =
  (back: number, up: number, side: number): Pt =>
  (c) => {
    const d = c.h.dir;
    const n = Math.hypot(d.x, d.z) || 1;
    const fx = d.x / n;
    const fz = d.z / n;
    return c.h.pos.clone().add(V(-fx * back - fz * side, up, -fz * back + fx * side));
  };
const ahead =
  (dist: number, down: number): Pt =>
  (c) =>
    c.h.pos.clone().addScaledVector(c.h.dir, dist).add(V(0, -down, 0));
/** Where our customer lands, at the bottom of the pit (hero.ts: the fall). */
const landing = (Ld: Layout) => {
  const d = Ld.final.tangent(Ld.final.length, new THREE.Vector3());
  return V(EDGE.x + d.x * 1.15 * FALL_T, PIT_Y + 0.12, EDGE.z + d.z * 1.15 * FALL_T);
};
/** The dive: how far behind and beside the customer the eye falls, and where it brakes. */
const DIVE_BACK = 3;
const DIVE_SIDE = 0.4;
const DIVE_REST = PIT_Y + 26;
const diveAt = (p: THREE.Vector3, d: THREE.Vector3, out: THREE.Vector3) => {
  const n = Math.hypot(d.x, d.z) || 1;
  return out.set(p.x + (d.x / n) * 1.2, p.y, p.z + (d.z / n) * 1.2);
};
/** Where the dive comes to rest, above the lake, looking down at it. */
/** Level heading from the landing toward the owner's corner. The dive turns to it while it brakes over the round lake (where a turn reads as a slow settle, not a spin), so the rise out of the pit only has to tilt up into the corner. */
const toCorner = (Ld: Layout, out = new THREE.Vector3()) => { const l = landing(Ld); return out.set(CORNER.x - l.x, 0, CORNER.z - l.z).normalize(); };
const REST_BACK = 0.4;
const restEye = (c: Ctx) => { const l = landing(c.L); const d = toCorner(c.L); return V(l.x - d.x * REST_BACK, DIVE_REST, l.z - d.z * REST_BACK); };
const restAt = (c: Ctx) => diveAt(landing(c.L), toCorner(c.L), new THREE.Vector3());
/** A point at the end of the last track, in the frame of the way it heads. */
const edge = (back: number, up: number, side: number, Ld: Layout) => {
  const d = Ld.final.tangent(Ld.final.length, new THREE.Vector3());
  const n = Math.hypot(d.x, d.z) || 1;
  const fx = d.x / n;
  const fz = d.z / n;
  return EDGE.clone().add(V(-fx * back - fz * side, up, -fz * back + fx * side));
};

/** The shot list (docs/STORY.md). Desktop framing; phones adjust ppx/ppy and pull back. */
export const KEYS: Key[] = [
  // OPEN: rise from the nave, cross its silhouette, then find one
  // small customer. The scale change is the first reveal, before any loss.
  { P: 0, eye: fix(16, 16, 106), at: fix(0, 34, -8), fov: 39, ppx: 0.57, ppy: 0.48 },
  { P: 0.7, eye: fix(-14, 29, 76), at: fix(-1, 36, -4), fov: 34, ppx: 0.61, ppy: 0.46 },
  { P: 1.35, eye: fix(-9.2, 52.8, 11.5), at: fix(-11.6, 50.7, 0), fov: 33, ppx: 0.57 },
  { P: 1.9, eye: rel(-1.7, 0.55, 2.7), at: rel(1.1, -0.2, -0.3), fov: 46, ppx: 0.68, ppy: 0.7 },
  // WEBSITE: down the ramp, the queue, the gate from the side, through.
  { P: 2.5, eye: rel(-1.1, 0.6, 2.1), at: rel(0.8, 0.15, -0.4), fov: 40, ppx: 0.68 },
  // Pull away while tightening the lens: the queue stays close, but the
  // gate looms behind it. Waiting makes the business feel less reachable.
  { P: 2.95, eye: fix(GATE_X - 3.2, GATE_Y + 0.8, 4.1), at: fix(GATE_X - 0.4, GATE_Y + 1.0, -0.4), fov: 45, ppx: 0.63 },
  { P: 3.45, eye: fix(GATE_X - 5.4, GATE_Y + 1.2, 7.9), at: fix(GATE_X - 0.6, GATE_Y + 1.1, -0.5), fov: 28, ppx: 0.63, roll: -0.025 },
  { P: 3.92, eye: rel(-1.4, 0.45, 1.75), at: rel(0.55, 0.15, -0.2), fov: 38, ppx: 0.67 },
  { P: 4.35, eye: rel(-1.5, 1.0, 3.2), at: rel(1.2, -0.25, -0.2), fov: 42, ppx: 0.64 },
  // INBOX: the turn, into the funnel, the dish under the wheel of hours, a whole night.
  // Travel along the front of the tower. Riding the U-turn cut directly
  // through the front-right column and its work lamp.
  { P: 4.82, eye: fix(11.8, 44.6, 10.0), at: fix(UTURN.cx - 0.4, UTURN.y0 - 0.6, UTURN.cz + 0.6), fov: 36, ppx: 0.6 },
  { P: 5.22, eye: fix(FUNNEL.x - 3.9, FUNNEL.yTop + 5.2, FUNNEL.z + 11.0), at: fix(FUNNEL.x, FUNNEL.yBot - 0.2, FUNNEL.z), fov: 34, ppx: 0.6 },
  // First look down at all the enquiries. Then fall to their height, with
  // the whole clock towering behind them, before isolating our dim light.
  { P: 5.5, eye: fix(DISH.x + 1.1, DISH.y + 11.8, DISH.z + 7.4), at: fix(DISH.x, DISH.y + 0.25, DISH.z), fov: 36, ppx: 0.62, roll: -0.04 },
  { P: 6.05, eye: fix(DISH.x + 2.1, DISH.y + 3.5, DISH.z + 15.4), at: fix(DISH.x - 0.6, DISH.y + 3.2, DISH.z - 5.3), fov: 46, ppx: 0.63 },
  { P: 6.6, eye: fix(DISH.x + 0.8, DISH.y + 1.6, DISH.z + 5.2), at: (c) => c.h.pos.clone().add(V(0, 0.1, 0)), fov: 29, ppx: 0.63 },
  { P: 7.08, eye: fix(DISH.x + 2.8, 31.6, 4.4), at: fix(DISH.x + 0.2, 30.2, -1.6), fov: 40, ppx: 0.6 },
  // ADMIN: the first tray, carried across, the floor of claws, the stamp.
  // The admin slowly loses its horizon. Only the stamp briefly restores it.
  { P: 7.45, eye: fix(TRAYS[0].x + 1.6, TRAY_Y + 2.0, 4.2), at: fix(TRAYS[0].x + 0.5, TRAY_Y + 1.0, -1.0), fov: 46, ppx: 0.62, roll: -0.03 },
  { P: 8.0, eye: rel(0.1, 1.6, 4.2), at: rel(0.5, -0.3, 0), fov: 43, ppx: 0.63, roll: 0.05 },
  { P: 8.55, eye: fix(TRAYS[1].x + 1.8, TRAY_Y + 2.6, 8.0), at: fix(TRAYS[1].x + 1.6, TRAY_Y + 1.0, -1.2), fov: 34, ppx: 0.63, roll: -0.065 },
  { P: 9.05, eye: rel(-0.6, 0.7, 2.5), at: rel(0.6, -0.1, 0), fov: 42, ppx: 0.63, roll: 0.04 },
  { P: 9.45, eye: fix(TRAYS[2].x - 0.3, TRAY_Y + 0.65, 2.4), at: fix(TRAYS[2].x + 0.05, TRAY_Y + 0.4, -0.55), fov: 31, ppx: 0.63 },
  // FOLLOW-UP: we chase it down the last track, faster and faster, and see
  // the track just end in mid-air ahead of it; we stop at the edge, it doesn't.
  // Keep the eye above the descending track. A low chase placed the camera
  // inside the invoice rim and the rail when the customer rounded the bend.
  { P: 9.66, eye: fix(TRAYS[2].x - 1.5, TRAY_Y + 2.7, 1.3), at: fix(TRAYS[2].x + 0.7, TRAY_Y + 0.1, -0.7), fov: 40, ppx: 0.62 },
  { P: 9.9, eye: chase(1.9, 2.4, -1.2), at: ahead(1.6, 0.3), fov: 44, ppx: 0.6 },
  { P: 10.2, eye: chase(2.3, 2.6, -1.6), at: ahead(3.2, 0.7), fov: 50, ppx: 0.58 },
  { P: 10.45, eye: chase(2.4, 2.8, -1.4), at: ahead(4.6, 1.2), fov: 54, ppx: 0.56 },
  { P: 10.68, eye: (c) => edge(1.7, 1.7, -0.55, c.L), at: (c) => edge(-3.4, -2.6, 0, c.L), fov: 48, ppx: 0.55 },
  // Then over the edge after it (the dive, in cameraAt), braking above the
  // lake while it falls the last of the way into the red.
  { P: 10.9, eye: (c) => edge(-0.5, 2.3, 0.45, c.L), at: (c) => c.h.pos.clone(), fov: 46, ppx: 0.5 },
  { P: FALL_END + 0.05, eye: restEye, at: restAt, fov: 46, ppx: 0.5 },
  // YOU: up out of the pit, across to the owner's lamp, then all of it.
  // (Rising out of the well toward the corner: the owner's back, the chain
  // running past us up to the tower; then beside them at the crank.)
  { P: 11.68, eye: fix(5, 1.5, 8.8), at: fix(-5, -8.5, 7.9), fov: 46, ppx: 0.55 },
  { P: 11.9, eye: fix(-8, 8, 7.5), at: cfix(-0.3, 1.6, 0.4), fov: 46, ppx: 0.6 },
  { P: 12.12, eye: cfix(2.2, 3.0, 6.5), at: cfix(-0.25, 1.1, 0.3), fov: 42, ppx: 0.64 },
  { P: 12.3, eye: cfix(2.7, 2.2, 4.4), at: cfix(-0.25, 1.0, 0.35), fov: 38, ppx: 0.67 },
  { P: 12.62, eye: cfix(3.05, 1.38, 0.55), at: cfix(0.1, 1.05, 0.35), fov: 27, ppx: 0.64 },
  { P: 12.95, eye: cfix(2.95, 1.5, -0.2), at: cfix(0.05, 1.08, 0.4), fov: 28, ppx: 0.63 },
  // Then up and back over the corner, until the whole tower is in.
  // (In front of the owner, low: their silhouette at the crank under the
  // whole tower it turns, the chain running up into it. Then in close to the
  // hands as they let go, in the lamp's light; the dark takes the rest.)
  { P: 13.6, eye: cfix(0.95, 0.85, -2.5), at: fix(0, 24, -1), fov: 62, ppx: 0.56, ppy: 0.3 },
  // (The title is said above them; the hands and the crank in the lower third.)
  { P: 14.0, eye: cfix(1.3, 1.25, -2.3), at: cfix(0.45, 1.0, 0.2), fov: 40, ppx: 0.5, ppy: 0.68 },
  { P: 14.4, eye: cfix(1.45, 1.3, -2.7), at: cfix(0.45, 1.05, 0.25), fov: 38, ppx: 0.5, ppy: 0.68 },
  { P: 14.64, eye: cfix(1.5, 1.32, -2.85), at: cfix(0.45, 1.05, 0.25), fov: 37, ppx: 0.5, ppy: 0.68 },
  // THE TURN: in to the middle of the tower as it comes apart; the new one round us.
  // (Moved in the dark: the teardown is seen whole.)
  { P: 14.9, eye: fix(9, 31, 96), at: fix(0, 24, 0), fov: 36, ppx: 0.5 },
  // Cross the falling structure. At assembly, a wide, level frame lets the
  // pieces build around us instead of keeping the viewer outside the work.
  { P: 15.3, eye: fix(-18, 34, 24), at: fix(0, 35, 0), fov: 58, ppx: 0.5, roll: -0.11 },
  { P: 15.9, eye: fix(10, 40, 12), at: fix(-0.5, 37, -2), fov: 62, ppx: 0.5, roll: 0.14 },
  { P: 16.45, eye: fix(0.8, 38.5, 3.2), at: fix(-1.2, 38.8, -3), fov: 65, ppx: 0.5 },
  { P: 16.9, eye: fix(-1, 45, 27), at: fix(-6, 44, 0), fov: 40, ppx: 0.5 },
  // NEW: the door, the ring of light.
  { P: 17.28, eye: fix(-9.0, 52.4, 10.8), at: fix(-11.4, 50.6, 0), fov: 38, ppx: 0.6 },
  { P: 17.6, eye: rel(-1.7, 0.8, 3.5), at: rel(1.2, -0.2, -0.3), fov: 42, ppx: 0.67 },
  // (Held in front of the column line while it runs on to the turn.)
  { P: 17.86, eye: fix(6.6, 47.8, 5.5), at: (c) => c.h.pos.clone().add(V(0.4, 0.1, 0)), fov: 42, ppx: 0.58 },
  { P: 18.2, eye: fix(GATE_X + 3.2, GATE_Y + 2.1, 6.4), at: fix(GATE_X - 0.2, GATE_Y + 0.8, -0.2), fov: 40, ppx: 0.6 },
  // AI: the turbine, at 3am, under the moon.
  { P: 18.8, eye: (c) => V(T(c.L).x + 4.4, T(c.L).y + 3.4, T(c.L).z + 11), at: (c) => V(T(c.L).x - 0.6, T(c.L).y + 1.4, T(c.L).z - 2), fov: 40, ppx: 0.62 },
  { P: 19.2, eye: (c) => V(T(c.L).x + 1.4, T(c.L).y + 0.7, T(c.L).z + 5.4), at: (c) => c.h.pos.clone(), fov: 40, ppx: 0.6 },
  { P: 19.85, eye: (c) => V(T(c.L).x - 0.6, T(c.L).y + 1.2, T(c.L).z + 13), at: (c) => V(T(c.L).x - 1.2, T(c.L).y - 2.4, T(c.L).z), fov: 40, ppx: 0.62 },
  // PLATFORM: along the channel through the three nodes.
  { P: 20.45, eye: rel(0.2, 1.0, 4.6), at: rel(0.5, -0.3, 0), fov: 42, ppx: 0.68 },
  // One level horizon and one uninterrupted view through all three nodes:
  // the visual answer to the fragmented, tilted tray-to-tray sequence.
  { P: 21.05, eye: fix(TRAYS[0].x - 5.8, TRAY_Y + 2.5, 7.1), at: fix(TRAYS[2].x + 0.5, TRAY_Y + 0.5, -0.8), fov: 38, ppx: 0.62 },
  // FOLLOW-UP: the same chase down the same last track as before (a rhyme);
  // where it ended, the track now turns up into the gold spiral.
  // (From above this time, then out to the spiral's outside as it climbs.)
  // (In front of the new frame's columns, then down behind our customer.)
  { P: 21.5, eye: fix(EDGE.x - 6.2, EDGE.y + 4.4, EDGE.z + 7.2), at: (c) => c.h.pos.clone().addScaledVector(c.h.dir, 1.2), fov: 44, ppx: 0.58 },
  // (A slow climbing circle outside the spiral: the customer goes round the
  // tower and up through the frame, instead of the world spinning round them.)
  { P: 22.3, eye: orbit(0.55, 21, 30.5), at: axisToward(0.5, 0.4), fov: 48, ppx: 0.58 },
  { P: 22.55, eye: orbit(0.86, 28.5, 33.5), at: axisToward(0.35, 0.8), fov: 50, ppx: 0.58 },
  { P: 23.1, eye: orbit(1.6, 30, 43), at: axisToward(0.3, 0.6), fov: 50, ppx: 0.58 },
  { P: 23.45, eye: orbit(2.2, 28.5, 51), at: axisToward(0.45, 0), fov: 46, ppx: 0.6 },
  // YOU: down to the desk; the lid, the lamp, up; then past them to the machine.
  { P: 24.0, eye: cfix(2.2, 8.5, -7.6), at: cfix(-1.3, 1.0, 1.4), fov: 42, ppx: 0.6 },
  { P: 24.3, eye: cfix(2.2, 1.45, -2.2), at: cfix(-1.2, 1.0, 1.3), fov: 42, ppx: 0.66 },
  // (In front of the flywheel, not through its rim.)
  { P: 24.47, eye: cfix(0.1, 1.4, -2.0), at: cfix(-1.4, 0.98, 1.45), fov: 36, ppx: 0.63 },
  { P: 24.62, eye: cfix(-0.95, 1.32, -0.62), at: cfix(-1.55, 0.95, 1.55), fov: 31, ppx: 0.62 },
  { P: 24.98, eye: cfix(-1.02, 1.24, -0.42), at: cfix(-1.6, 0.97, 1.6), fov: 30, ppx: 0.61 },
  { P: 25.3, eye: cfix(-2.3, 1.6, -1.5), at: cfix(-1.2, 1.7, 3.0), fov: 40, ppx: 0.6 },
  // (Behind the owner, who has turned to look: their silhouette, and the machine running on.)
  { P: 25.62, eye: cfix(-2.7, 0.95, -1.4), at: fix(0, 21, -1), fov: 54, ppx: 0.6, ppy: 0.44 },
  { P: 27.4, eye: cfix(-3.2, 1.1, -3.6), at: fix(0, 23, -1), fov: 50, ppx: 0.58, ppy: 0.44 },
];

export type CamOut = { eye: THREE.Vector3; at: THREE.Vector3; fov: number; ppx: number; ppy: number; roll: number };

const cache: { eye: THREE.Vector3; at: THREE.Vector3 }[] = KEYS.map(() => ({ eye: new THREE.Vector3(), at: new THREE.Vector3() }));

function hermite(p0: number, p1: number, m0: number, m1: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * m1;
}

/** A shared, weighted harmonic tangent. At a change of direction it settles
 * into the corner instead of swinging past it and returning to the shot. */
function tangent(h0: number, h1: number, d0: number, d1: number) {
  if (d0 * d1 <= 0) return 0;
  const w0 = 2 * h1 + h0;
  const w1 = h1 + 2 * h0;
  return (w0 + w1) / (w0 / d0 + w1 / d1);
}

function shotCurve(p0: number, p1: number, p2: number, p3: number, h0: number, h1: number, h2: number, t: number) {
  const d = (p2 - p1) / h1;
  const m0 = h0 > 0 ? tangent(h0, h1, (p1 - p0) / h0, d) : d;
  const m1 = h2 > 0 ? tangent(h1, h2, d, (p3 - p2) / h2) : d;
  return hermite(p1, p2, m0 * h1, m1 * h1, t);
}

/** The camera at film time P (before the breath and the lean). */
export function cameraAt(P: number, c: Ctx, out: CamOut) {
  let i = 0;
  while (i < KEYS.length - 2 && P >= KEYS[i + 1].P) i++;
  const i0 = Math.max(0, i - 1);
  const i1 = i;
  const i2 = Math.min(KEYS.length - 1, i + 1);
  const i3 = Math.min(KEYS.length - 1, i + 2);
  for (const k of [i0, i1, i2, i3]) {
    cache[k].eye.copy(KEYS[k].eye(c));
    cache[k].at.copy(KEYS[k].at(c));
  }
  const A = KEYS[i1];
  const B = KEYS[i2];
  const span = Math.max(1e-4, B.P - A.P);
  const t = Math.min(1, Math.max(0, (P - A.P) / span));
  const h0 = KEYS[i1].P - KEYS[i0].P;
  const h2 = KEYS[i3].P - KEYS[i2].P;
  for (const f of ["eye", "at"] as const) {
    const p0 = cache[i0][f];
    const p1 = cache[i1][f];
    const p2 = cache[i2][f];
    const p3 = cache[i3][f];
    for (const ax of ["x", "y", "z"] as const) {
      out[f][ax] = shotCurve(p0[ax], p1[ax], p2[ax], p3[ax], h0, span, h2, t);
    }
  }
  // Lens, banking and composition use the same continuous shot curve as the
  // flight. Their velocity no longer resets every time the camera passes a key.
  for (const field of ["fov", "ppx", "ppy", "roll"] as const) {
    const fallback = field === "roll" ? 0 : field === "fov" ? 40 : 0.5;
    out[field] = shotCurve(KEYS[i0][field] ?? fallback, A[field] ?? fallback, B[field] ?? fallback, KEYS[i3][field] ?? fallback, h0, span, h2, t);
  }

  // THE DIVE: over the edge after it. The eye falls with it, a few metres
  // behind and above, looking down at it; then it brakes (a curve of its
  // own, easing out) and the customer falls away from us into the red. It
  // settles above the lake as it lands.
  const w = Math.min(smoother(range(P, 10.86, 11.1)), 1 - smoother(range(P, FALL_END - 0.04, FALL_END + 0.07)));
  if (w > 0) {
    const k = range(P, 10.9, FALL_END);
    const brake = lerp(EDGE.y + 2.3, DIVE_REST, 1 - (1 - k) * (1 - k));
    const y = smax(c.h.pos.y + 4, brake, 1.5);
    const s = smoother(range(P, 11.0, FALL_END));
    const n = Math.hypot(c.h.dir.x, c.h.dir.z) || 1;
    _hd.set(c.h.dir.x / n, 0, c.h.dir.z / n).lerp(toCorner(c.L, _tc), s).normalize();
    const back = lerp(lerp(1.2, DIVE_BACK, smoother(range(P, 10.9, 11.3))), REST_BACK, s);
    _de.set(c.h.pos.x - _hd.x * back - _hd.z * DIVE_SIDE * (1 - s), y, c.h.pos.z - _hd.z * back + _hd.x * DIVE_SIDE * (1 - s));
    diveAt(c.h.pos, _hd, _da);
    out.eye.lerp(_de, w);
    out.at.lerp(_da, w);
  }
}
const _de = new THREE.Vector3();
const _hd = new THREE.Vector3();
const _tc = new THREE.Vector3();
const _da = new THREE.Vector3();
/** A smooth max (log-sum-exp): the larger of a and b, rounded over about s. */
const smax = (a: number, b: number, s: number) => Math.max(a, b) + s * Math.log(1 + Math.exp(-Math.abs(a - b) / s));


/**
 * THE CAMERA, SMOOTHED. Keys that ride with the customer inherit every
 * change in its pace (a stop at the merge, the drop into the chute), and a
 * chase meeting a fixed composition bends the flight. Averaging the flight
 * over a short window of film time (a Gaussian, ±0.07 screens) rounds those
 * corners off: the same shots, without a kink anywhere between them. The
 * customer is re-placed at each sample, so a shot that follows it still
 * follows it. Composed frames move by millimetres; a held shot not at all.
 */
const SM_N = 4;
const SM_STEP = 0.0175;
const SM_W = Array.from({ length: SM_N * 2 + 1 }, (_, i) => Math.exp(-0.5 * Math.pow(((i - SM_N) * SM_STEP) / 0.034, 2)));
const SM_SUM = SM_W.reduce((a, b) => a + b, 0);
const _hs = heroInit();
const _o: CamOut = { eye: new THREE.Vector3(), at: new THREE.Vector3(), fov: 40, ppx: 0.5, ppy: 0.5, roll: 0 };
export function cameraSmooth(P: number, c: Ctx, time: number, out: CamOut, end = 27.4) {
  out.eye.set(0, 0, 0);
  out.at.set(0, 0, 0);
  out.fov = out.ppx = out.ppy = out.roll = 0;
  for (let i = 0; i < SM_W.length; i++) {
    const Pk = Math.min(end, Math.max(0, P + (i - SM_N) * SM_STEP));
    const w = SM_W[i] / SM_SUM;
    heroAt(Pk, c.L, _hs, time);
    cameraAt(Pk, { h: _hs, L: c.L }, _o);
    out.eye.addScaledVector(_o.eye, w);
    out.at.addScaledVector(_o.at, w);
    out.fov += _o.fov * w;
    out.ppx += _o.ppx * w;
    out.ppy += _o.ppy * w;
    out.roll += _o.roll * w;
  }
}
