import * as THREE from "three";
import { CRANK, DISH, EDGE, FLOOR_Y, FUNNEL, GATE_X, GATE_Y, PIT_Y, TRAYS, TRAY_Y, type Layout } from "./layout";

import { FALL_END, FALL_T, type HeroState } from "./hero";
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
/** The dive's eye: behind and above it (level), at height y. */
const DIVE_BACK = 3;
const DIVE_SIDE = 0.4;
const DIVE_REST = PIT_Y + 26;
const diveEye = (p: THREE.Vector3, d: THREE.Vector3, y: number, out: THREE.Vector3) => {
  const n = Math.hypot(d.x, d.z) || 1;
  const fx = d.x / n;
  const fz = d.z / n;
  return out.set(p.x - fx * DIVE_BACK - fz * DIVE_SIDE, y, p.z - fz * DIVE_BACK + fx * DIVE_SIDE);
};
const diveAt = (p: THREE.Vector3, d: THREE.Vector3, out: THREE.Vector3) => {
  const n = Math.hypot(d.x, d.z) || 1;
  return out.set(p.x + (d.x / n) * 1.2, p.y, p.z + (d.z / n) * 1.2);
};
/** Where the dive comes to rest, above the lake, looking down at it. */
const restEye = (c: Ctx) => diveEye(landing(c.L), c.h.dir, DIVE_REST, new THREE.Vector3());
const restAt = (c: Ctx) => diveAt(landing(c.L), c.h.dir, new THREE.Vector3());
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
  { P: 1.35, eye: fix(-7, 53.0, 14), at: fix(-12.5, 50.6, 0), fov: 33, ppx: 0.57 },
  { P: 1.9, eye: rel(-1.7, 0.55, 2.7), at: rel(2.4, -0.3, -0.6), fov: 46, ppx: 0.6 },
  // WEBSITE: down the ramp, the queue, the gate from the side, through.
  { P: 2.5, eye: rel(-1.1, 0.6, 2.1), at: rel(1.8, 0.2, -0.7), fov: 40, ppx: 0.6 },
  // Pull away while tightening the lens: the queue stays close, but the
  // gate looms behind it. Waiting makes the business feel less reachable.
  { P: 2.95, eye: fix(GATE_X - 3.2, GATE_Y + 0.8, 4.1), at: fix(GATE_X - 0.4, GATE_Y + 1.0, -0.4), fov: 45, ppx: 0.63 },
  { P: 3.45, eye: fix(GATE_X - 5.4, GATE_Y + 1.2, 7.9), at: fix(GATE_X - 0.6, GATE_Y + 1.1, -0.5), fov: 28, ppx: 0.63, roll: -0.025 },
  { P: 3.92, eye: rel(-1.4, 0.45, 1.75), at: rel(1.3, 0.25, -0.3), fov: 38, ppx: 0.6 },
  { P: 4.35, eye: rel(-1.5, 1.0, 3.2), at: rel(2.1, -0.3, -0.2), fov: 42, ppx: 0.6 },
  // INBOX: the turn, into the funnel, the dish under the wheel of hours, a whole night.
  // Travel along the front of the tower. Riding the U-turn cut directly
  // through the front-right column and its work lamp.
  { P: 4.78, eye: fix(11.8, 44.6, 6.0), at: rel(0.3, -0.3, -1.0), fov: 44, ppx: 0.6 },
  { P: 5.12, eye: fix(FUNNEL.x - 3.9, FUNNEL.yTop + 2.7, FUNNEL.z + 8.0), at: fix(FUNNEL.x, FUNNEL.yBot - 0.2, FUNNEL.z), fov: 42, ppx: 0.6 },
  // First look down at all the enquiries. Then fall to their height, with
  // the whole clock towering behind them, before isolating our dim light.
  { P: 5.5, eye: fix(DISH.x + 1.1, DISH.y + 11.8, DISH.z + 7.4), at: fix(DISH.x, DISH.y + 0.25, DISH.z), fov: 36, ppx: 0.62, roll: -0.04 },
  { P: 6.05, eye: fix(DISH.x + 2.1, DISH.y + 2.5, DISH.z + 15.4), at: fix(DISH.x - 0.6, DISH.y + 3.2, DISH.z - 5.3), fov: 46, ppx: 0.63 },
  { P: 6.6, eye: fix(DISH.x + 0.8, DISH.y + 1.6, DISH.z + 5.2), at: (c) => c.h.pos.clone().add(V(0, 0.1, 0)), fov: 29, ppx: 0.63 },
  { P: 7.08, eye: fix(DISH.x + 2.8, 31.6, 4.4), at: fix(DISH.x + 0.2, 30.2, -1.6), fov: 40, ppx: 0.6 },
  // ADMIN: the first tray, carried across, the floor of claws, the stamp.
  // The admin slowly loses its horizon. Only the stamp briefly restores it.
  { P: 7.45, eye: fix(TRAYS[0].x + 1.6, TRAY_Y + 0.8, 4.2), at: fix(TRAYS[0].x + 0.5, TRAY_Y + 1.4, -1.0), fov: 46, ppx: 0.62, roll: -0.045 },
  { P: 8.0, eye: rel(0.1, 0.7, 4.2), at: rel(0.5, -0.2, 0), fov: 43, ppx: 0.63, roll: 0.09 },
  { P: 8.55, eye: fix(TRAYS[1].x + 1.8, TRAY_Y + 2.6, 8.0), at: fix(TRAYS[1].x + 1.6, TRAY_Y + 1.0, -1.2), fov: 34, ppx: 0.63, roll: -0.12 },
  { P: 9.05, eye: rel(-0.6, 0.7, 2.5), at: rel(0.6, -0.1, 0), fov: 42, ppx: 0.63, roll: 0.075 },
  { P: 9.45, eye: fix(TRAYS[2].x - 0.3, TRAY_Y + 0.65, 2.4), at: fix(TRAYS[2].x + 0.05, TRAY_Y + 0.4, -0.55), fov: 31, ppx: 0.63 },
  // FOLLOW-UP: we chase it down the last track, faster and faster, and see
  // the track just end in mid-air ahead of it; we stop at the edge, it doesn't.
  // Keep the eye above the descending track. A low chase placed the camera
  // inside the invoice rim and the rail when the customer rounded the bend.
  { P: 9.85, eye: chase(1.8, 2.2, 2.4), at: ahead(2.8, 0.35), fov: 44, ppx: 0.56 },
  { P: 10.2, eye: chase(2.1, 2.3, 2.4), at: ahead(4.6, 0.9), fov: 51, ppx: 0.54, roll: -0.025 },
  { P: 10.45, eye: chase(2.2, 2.3, 2.2), at: ahead(5.5, 1.3), fov: 58, ppx: 0.52, roll: -0.055 },
  { P: 10.68, eye: (c) => edge(1.7, 1.7, 0.55, c.L), at: (c) => edge(-3.4, -2.6, 0, c.L), fov: 48, ppx: 0.5 },
  // Then over the edge after it (the dive, in cameraAt), braking above the
  // lake while it falls the last of the way into the red.
  { P: 10.9, eye: (c) => edge(0.7, 2.3, 0.45, c.L), at: (c) => c.h.pos.clone(), fov: 46, ppx: 0.5 },
  { P: FALL_END + 0.05, eye: restEye, at: restAt, fov: 46, ppx: 0.5 },
  // YOU: up out of the pit, across to the owner's lamp, then all of it.
  { P: 11.95, eye: fix(4, 16, 19), at: fix(-12, 6, 4), fov: 46, ppx: 0.55 },
  { P: 12.3, eye: fix(-11, 13.2, 20), at: fix(-19, 11.3, 8), fov: 43, ppx: 0.63 },
  { P: 12.62, eye: fix(CRANK.x + 3.0, FLOOR_Y + 1.6, CRANK.z + 4.1), at: fix(CRANK.x - 0.8, FLOOR_Y + 1.15, CRANK.z + 1.1), fov: 32, ppx: 0.64 },
  { P: 12.82, eye: fix(CRANK.x + 3.3, FLOOR_Y + 2.0, CRANK.z + 3.8), at: fix(CRANK.x - 0.9, FLOOR_Y + 1.15, CRANK.z + 1.2), fov: 36, ppx: 0.62 },
  // Then back, and up, still on the lamp, until the whole of it is in.
  { P: 13.1, eye: fix(-2, 19, 23), at: fix(-17, 12, 8), fov: 40, ppx: 0.58 },
  { P: 13.5, eye: fix(18, 30, 106), at: fix(-2, 21, 0), fov: 42, ppx: 0.58 },
  { P: 13.95, eye: fix(10, 38, 86), at: fix(0, 22, 0), fov: 38, ppx: 0.5 },
  // THE TURN: in to the middle of the tower as it comes apart; the new one round us.
  { P: 14.6, eye: fix(9, 31, 96), at: fix(0, 24, 0), fov: 36, ppx: 0.5 },
  // Cross the falling structure. At assembly, a wide, level frame lets the
  // pieces build around us instead of keeping the viewer outside the work.
  { P: 15.3, eye: fix(-18, 34, 24), at: fix(0, 35, 0), fov: 58, ppx: 0.5, roll: -0.11 },
  { P: 15.9, eye: fix(10, 40, 12), at: fix(-0.5, 37, -2), fov: 62, ppx: 0.5, roll: 0.14 },
  { P: 16.45, eye: fix(0.8, 38.5, 3.2), at: fix(-1.2, 38.8, -3), fov: 65, ppx: 0.5 },
  { P: 16.95, eye: fix(-1, 45, 27), at: fix(-6, 44, 0), fov: 40, ppx: 0.5 },
  // NEW: the door, the ring of light.
  { P: 17.22, eye: fix(-6.5, 51.8, 10.5), at: fix(-12.4, 50.6, 0), fov: 38, ppx: 0.6 },
  { P: 17.6, eye: rel(-1.7, 0.8, 3.5), at: rel(2.5, -0.3, -0.5), fov: 42, ppx: 0.6 },
  // (Held in front of the column line while it runs on to the turn.)
  { P: 17.86, eye: fix(6.6, 47.8, 5.5), at: (c) => c.h.pos.clone().add(V(0.4, 0.1, 0)), fov: 42, ppx: 0.58 },
  { P: 18.2, eye: fix(GATE_X + 3.2, GATE_Y + 2.1, 6.4), at: fix(GATE_X - 0.2, GATE_Y + 0.8, -0.2), fov: 40, ppx: 0.6 },
  // AI: the turbine, at 3am, under the moon.
  { P: 18.8, eye: (c) => V(T(c.L).x + 4.4, T(c.L).y + 3.4, T(c.L).z + 11), at: (c) => V(T(c.L).x - 0.6, T(c.L).y + 1.4, T(c.L).z - 2), fov: 40, ppx: 0.62 },
  { P: 19.2, eye: (c) => V(T(c.L).x + 1.4, T(c.L).y + 0.7, T(c.L).z + 5.4), at: (c) => c.h.pos.clone(), fov: 40, ppx: 0.6 },
  { P: 19.85, eye: (c) => V(T(c.L).x - 0.6, T(c.L).y + 1.2, T(c.L).z + 13), at: (c) => V(T(c.L).x - 1.2, T(c.L).y - 2.4, T(c.L).z), fov: 40, ppx: 0.62 },
  // PLATFORM: along the channel through the three nodes.
  { P: 20.45, eye: rel(0.2, 1.0, 4.6), at: rel(1.3, -0.4, 0), fov: 42, ppx: 0.6 },
  // One level horizon and one uninterrupted view through all three nodes:
  // the visual answer to the fragmented, tilted tray-to-tray sequence.
  { P: 21.05, eye: fix(TRAYS[0].x - 5.8, TRAY_Y + 2.5, 7.1), at: fix(TRAYS[2].x + 0.5, TRAY_Y + 0.5, -0.8), fov: 38, ppx: 0.62 },
  { P: 21.24, eye: fix(TRAYS[2].x + 0.8, TRAY_Y + 3.6, 4.2), at: (c) => c.h.pos.clone().addScaledVector(c.h.dir, 1.5), fov: 42, ppx: 0.54 },
  // FOLLOW-UP: the same chase down the same last track as before (a rhyme);
  // where it ended, the track now turns up into the gold spiral.
  // (From above this time, then out to the spiral's outside as it climbs.)
  { P: 21.4, eye: chase(2.3, 2.0, 0), at: ahead(2.8, 0.35), fov: 44, ppx: 0.5 },
  { P: 21.64, eye: chase(2.6, 2.0, -0.4), at: ahead(4.6, 0.6), fov: 46, ppx: 0.5 },
  { P: 21.84, eye: chase(2.4, 1.8, -1.4), at: (c) => c.h.pos.clone().addScaledVector(c.h.dir, 3.5).add(V(0, 0.8, 0)), fov: 48, ppx: 0.5 },
  {
    // Outside it and a little behind, still looking along its way; the view
    // turns in toward the tower over the next beat.
    P: 22.05,
    eye: (c) => {
      const p = c.h.pos;
      const r = Math.hypot(p.x, p.z + 1);
      const d = c.h.dir;
      const n = Math.hypot(d.x, d.z) || 1;
      return V((p.x / r) * (r + 3.4) - (d.x / n) * 1.6, p.y + 1.3, ((p.z + 1) / r) * (r + 3.4) - 1 - (d.z / n) * 1.6);
    },
    at: (c) => c.h.pos.clone().addScaledVector(c.h.dir, 2.5).lerp(V(0, c.h.pos.y + 2, -1), 0.1),
    fov: 46,
    ppx: 0.54,
  },
  {
    P: 22.6,
    eye: (c) => {
      const p = c.h.pos;
      const r = Math.hypot(p.x, p.z + 1);
      return V((p.x / r) * (r + 8), p.y + 4, ((p.z + 1) / r) * (r + 8) - 1);
    },
    at: (c) => c.h.pos.clone().lerp(V(0, c.h.pos.y + 1, -1), 0.35),
    fov: 50,
    ppx: 0.56,
  },
  {
    P: 23.25,
    eye: (c) => {
      const p = c.h.pos;
      const r = Math.hypot(p.x, p.z + 1);
      return V((p.x / r) * (r + 16), p.y + 10, ((p.z + 1) / r) * (r + 16) - 1);
    },
    at: (c) => c.h.pos.clone().lerp(V(0, c.h.pos.y - 4, -1), 0.5),
    fov: 54,
    ppx: 0.56,
  },
  { P: 23.75, eye: fix(-22, 56.5, 15), at: fix(-13.5, 51, 0), fov: 40, ppx: 0.6 },
  // YOU: down to the corner by the pit; the lamp goes off; then all of it, running.
  { P: 24.12, eye: fix(-25, 27, 33), at: fix(-19, 13, 8), fov: 40, ppx: 0.6 },
  { P: 24.44, eye: fix(-12.5, 15, 18), at: fix(-20, 11.6, 8.2), fov: 38, ppx: 0.62 },
  { P: 24.7, eye: fix(CRANK.x + 3.4, FLOOR_Y + 2.0, CRANK.z + 3.9), at: fix(CRANK.x - 1.1, FLOOR_Y + 1.15, CRANK.z + 1.4), fov: 36, ppx: 0.62 },
  { P: 25.08, eye: fix(-9, 19, 31), at: fix(-12, 18, 4), fov: 38, ppx: 0.55 },
  { P: 25.62, eye: fix(-18, 36, 105), at: fix(0, 28, 0), fov: 38, ppx: 0.5 },
  { P: 27.4, eye: fix(10, 38, 84), at: fix(0, 30, 0), fov: 36, ppx: 0.5 },
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
  const w = Math.min(smoother(range(P, 10.9, 11.04)), 1 - smoother(range(P, FALL_END - 0.02, FALL_END + 0.05)));
  if (w > 0) {
    const k = range(P, 10.9, FALL_END);
    const brake = lerp(EDGE.y + 2.3, DIVE_REST, 1 - (1 - k) * (1 - k));
    const y = smax(c.h.pos.y + 4, brake, 1.5);
    diveEye(c.h.pos, c.h.dir, y, _de);
    diveAt(c.h.pos, c.h.dir, _da);
    out.eye.lerp(_de, w);
    out.at.lerp(_da, w);
  }
}
const _de = new THREE.Vector3();
const _da = new THREE.Vector3();
/** A smooth max (log-sum-exp): the larger of a and b, rounded over about s. */
const smax = (a: number, b: number, s: number) => Math.max(a, b) + s * Math.log(1 + Math.exp(-Math.abs(a - b) / s));

