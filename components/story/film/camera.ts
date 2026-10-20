import * as THREE from "three";
import { B, k } from "./script";
import { flightAt, type Flight } from "./mail";

/**
 * THE CAMERA: one unbroken flight through the film, keyed on the film's
 * clock. A key is an eye, a point to look at, a lens and where on screen
 * the subject sits; some keys ride with a moving thing (the envelope, the
 * van), most are set. The keys are joined by a shape-preserving Hermite
 * curve (no overshoot past a key), then averaged over a short window of
 * film time so no corner is left anywhere between them (cameraSmooth).
 *
 * Desktop framing: the words sit on the left, so the subject sits right of
 * centre (ppx ~0.6). On a phone (portrait) the lens widens and the subject
 * comes to the middle (see `phoneAdjust`).
 */

export type Ctx = {
  /** The flights, as pure functions of P (for keys that ride with them). */
  flight: (P: number) => { f: Flight; t: number } | null;
  van: (P: number) => THREE.Vector3;
};
type Pt = (c: Ctx, P: number) => THREE.Vector3;
/**
 * `dof`: the aperture, 0 (everything sharp) … 1 (the subject alone sharp);
 * left out, a third. `sub` (a pane's keys only): 1 shows the pane's share of
 * the one picture (the main camera's frame cut to the pane), 0 its own shot.
 */
export type Key = { P: number; eye: Pt; at: Pt; fov: number; ppx?: number; ppy?: number; roll?: number; dof?: number; sub?: number };

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const fix = (x: number, y: number, z: number): Pt => () => V(x, y, z);
/** Home-local (the customer's house: x along it, +z out the front, which faces north). */
const H = (x: number, y: number, z: number): Pt => () => V(-44 - x, y, 15.5 - z);
/** Shop-local (the workshop: +z out the front, which faces south). */
const S = (x: number, y: number, z: number): Pt => () => V(44 + x, y, -17 + z);
/** Ride with the envelope in flight: an offset from it. */
const env =
  (dx: number, dy: number, dz: number): Pt =>
  (c, P) => {
    const fl = c.flight(P);
    if (!fl) return V(0, 0, 0);
    return flightAt(fl.f, fl.t).add(V(dx, dy, dz));
  };

/** Reading Sam's lifted phone (in the garden, looking into the living room). */
const READ_EYE = H(-3.0, 1.62, -6.3);
const READ_AT = H(-3.1, 1.45, -2.2);
/** Reading it on the deck (Sam standing, the card beside them). */
const DECK_EYE = H(0.9, 1.85, -11.2);
const DECK_AT = H(-1.0, 1.45, -6.2);

/**
 * The houses that ask on their own in the new way (3am; six o'clock): the
 * world sets them from the nearest real houses to these points.
 */
export const CALLERS = {
  night: { door: V(-33, 0, 16.7), fwd: V(0, 0, -1) },
  late: { door: V(88, 0, -55), fwd: V(0, 0, 1) },
};

/** A composed frame held for a moment either side of P (a rest sits still). */
function hold(P: number, eye: Pt, at: Pt, fov: number, ppx = 0.6, half = 0.05, ppy?: number, dof?: number): Key[] {
  return [
    { P: P - half, eye, at, fov, ppx, ppy, dof },
    { P: P + half, eye, at, fov, ppx, ppy, dof },
  ];
}
/** A pane's composed frame, held (its subject where the pane wants it). */
function still(P: number, half: number, eye: Pt, at: Pt, fov: number, o: { ppx?: number; ppy?: number; dof?: number; sub?: number } = {}): Key[] {
  const k = { eye, at, fov, ppx: o.ppx ?? 0.5, ppy: o.ppy, dof: o.dof, sub: o.sub ?? 0 };
  return [
    { P: P - half, ...k },
    { P: P + half, ...k },
  ];
}

/**
 * THE ONE PICTURE OVER THE TOWN (the rewind; the end): high in the south,
 * looking north over the roofs to the bay. Sam's house is on the left (its
 * garden toward us), the workshop on the right (its shopfront toward us).
 */
const WIDE_EYE = fix(0, 30, 96);
const WIDE_AT = fix(0, 4, -10);
const WIDE_FAR = fix(0, 38, 116);

export const KEYS: Key[] = [
  // OPEN: the town at dusk, then down to one lit room.
  { P: 0, eye: fix(-112, 56, 94), at: fix(-38, 0, 8), fov: 36, ppx: 0.6, dof: 0.6 },
  ...hold(0.62, fix(-94, 40, 77), fix(-41, 1, 13), 34, 0.6, 0.05, undefined, 0.6),
  { P: 1.22, eye: fix(-66, 19, 52), at: fix(-42.5, 2.0, 17), fov: 34, ppx: 0.6 },
  ...hold(1.66, fix(-48, 8, 38), fix(-43.5, 2.0, 18), 34, 0.55, 0.06),
  { P: 1.88, eye: fix(-42.1, 6.9, 27.6), at: fix(-42.2, 1.5, 16.9), fov: 34, ppx: 0.6 },
  { P: 2.06, eye: H(-2.6, 1.85, -7.6), at: H(-2.9, 1.4, -1.8), fov: 33, ppx: 0.6 },
  ...hold(2.3, READ_EYE, READ_AT, 33, 0.6, 0.06, undefined, 0.14),
  // WEBSITE: the page loading; up over the town's phones; back to the form.
  ...hold(2.9, H(-3.05, 1.6, -6.0), READ_AT, 32, 0.6, 0.05),
  { P: 3.2, eye: fix(-50, 17, 34), at: fix(-36, 7, 9), fov: 44, ppx: 0.6 },
  ...hold(3.5, fix(-52, 19, 37), fix(-35, 7, 8), 44, 0.6, 0.08, undefined, 0.5),
  { P: 3.92, eye: H(-2.4, 3.0, -10.5), at: H(-2.9, 1.4, -1.8), fov: 34, ppx: 0.6 },
  ...hold(4.3, READ_EYE, READ_AT, 32, 0.6, 0.06, undefined, 0.14),
  ...hold(4.74, H(-2.2, 2.0, -8.4), H(-2.7, 1.6, -1.8), 35, 0.6, 0.04),
  // INBOX: up after the envelope, across the town, to the workshop; the pile grows all night.
  { P: 4.98, eye: H(-2.4, 2.6, -8.0), at: H(-2.9, 3.0, -2.6), fov: 38, ppx: 0.58 },
  { P: 5.16, eye: env(-9, 4, 13), at: env(4, -1, -3), fov: 44, ppx: 0.56 },
  { P: 5.42, eye: env(-12, 7, 16), at: env(10, -3, -6), fov: 46, ppx: 0.56 },
  { P: 5.68, eye: fix(50.5, 2.6, 5.5), at: fix(47.6, 3.8, -8.6), fov: 40, ppx: 0.6 },
  ...hold(5.98, fix(50.2, 2.6, 4.2), fix(47.4, 4.8, -8.6), 42, 0.6, 0.06),
  ...hold(6.5, fix(39, 3.6, 9.5), fix(47.3, 8.6, -8.6), 46, 0.6, 0.06),
  { P: 6.86, eye: fix(39.5, 2.6, 3), at: fix(42.5, 4.0, -11), fov: 46, ppx: 0.6 },
  ...hold(7.1, S(-3.2, 1.9, 9.6), S(-3.8, 1.2, 4.0), 36, 0.6, 0.05),
  { P: 7.3, eye: S(-5.82, 1.85, 5.55), at: S(-4.6, 1.4, 2.5), fov: 46, ppx: 0.56 },
  { P: 7.44, eye: S(-6.0, 1.85, 4.2), at: S(-3.9, 1.35, 4.2), fov: 48, ppx: 0.56 },
  { P: 7.5, eye: S(-5.0, 1.85, 2.7), at: S(-3.9, 1.4, 4.7), fov: 49, ppx: 0.56 },
  ...hold(7.58, S(-3.5, 1.82, 2.12), S(-3.9, 1.3, 4.8), 50, 0.56, 0.03),
  // ADMIN: behind the owner; the card being typed framed each time.
  ...hold(8.3, fix(40.25, 1.86, -14.88), fix(38.9, 1.82, -12.0), 46, 0.6, 0.08),
  ...hold(8.9, fix(40.7, 1.86, -14.88), fix(40.05, 1.9, -11.8), 46, 0.6, 0.06),
  ...hold(9.5, fix(39.7, 1.95, -14.5), fix(38.6, 1.86, -12.0), 40, 0.6, 0.08),
  { P: 9.86, eye: fix(40.3, 1.84, -14.88), at: fix(41.2, 1.86, -11.95), fov: 46, ppx: 0.6 },
  ...hold(10.3, fix(40.1, 1.95, -14.9), fix(40.1, 1.9, -11.9), 64, 0.5, 0.06),
  // FOLLOW-UP: out through the office window and across the town to Sam's new deck; a year; the other van.
  { P: 10.4, eye: S(-2.8, 1.42, 3.0), at: S(-3.4, 1.2, 8.0), fov: 54, ppx: 0.5 },
  { P: 10.46, eye: S(-3.45, 1.08, 5.4), at: S(-3.6, 1.3, 12.0), fov: 54, ppx: 0.5 },
  { P: 10.52, eye: S(-3.55, 1.25, 7.6), at: S(-3.0, 3.0, 16.0), fov: 52, ppx: 0.5 },
  { P: 10.58, eye: fix(40.0, 3.4, -6.0), at: fix(34.0, 5.0, 6.0), fov: 50, ppx: 0.5 },
  { P: 10.7, eye: fix(14, 22, 10), at: fix(-20, 6, 16), fov: 46, ppx: 0.56 },
  { P: 10.84, eye: fix(-24, 16, 36), at: fix(-42, 2, 22), fov: 40, ppx: 0.58 },
  ...hold(11.0, H(1.6, 4.2, -15.0), H(-1.6, 0.9, -6.0), 36, 0.6, 0.06),
  ...hold(11.6, H(4.0, 7.0, -19.5), H(-1.4, 1.2, -5.0), 38, 0.6, 0.08),
  ...hold(12.1, DECK_EYE, DECK_AT, 34, 0.6, 0.05, undefined, 0.14),
  { P: 12.32, eye: fix(-40.5, 10.5, 16.0), at: fix(-43.5, 1.0, 6.0), fov: 42, ppx: 0.6 },
  ...hold(12.56, fix(-30.5, 8.5, -5.5), fix(-43.6, 1.4, 5.0), 40, 0.6, 0.06, undefined, 0.45),
  // YOU: night; across to the office window; the owner in the clutter; out over the town; back.
  { P: 12.75, eye: fix(-12, 18, 0), at: fix(-6, 4, 20), fov: 42, ppx: 0.6 },
  { P: 12.9, eye: fix(30, 26, 26), at: fix(40, 2, -13), fov: 40, ppx: 0.6 },
  ...hold(13.3, S(-3.9, 1.8, 11.0), S(-3.9, 1.6, 3.6), 36, 0.6, 0.06, 0.46),
  { P: 13.8, eye: S(-3.4, 2.1, 14.5), at: S(-3.9, 1.7, 3.6), fov: 38, ppx: 0.58 },
  ...hold(14.4, fix(16, 34, 48), fix(40, 2, -13), 28, 0.56, 0.06, undefined, 0.45),
  { P: 14.78, eye: S(-2.6, 1.15, 9.2), at: S(-3.9, 1.0, 3.8), fov: 40, ppx: 0.5 },
  { P: 15.04, eye: S(-2.85, 1.1, 5.3), at: S(-3.9, 1.0, 3.7), fov: 40, ppx: 0.5, ppy: 0.53 },
  // THE TURN: the hands come off the keys; the jobs round the desk burn away.
  ...hold(15.4, S(-2.62, 1.22, 4.1), S(-3.9, 1.0, 3.68), 40, 0.5, 0.06, 0.52),
  { P: 15.66, eye: S(-2.3, 1.75, 2.25), at: S(-4.1, 1.55, 4.4), fov: 54, ppx: 0.5 },
  ...hold(16.04, S(-2.25, 1.8, 2.35), S(-4.0, 1.45, 4.3), 52, 0.5, 0.1),
  // In the black the camera leaves the room: the picture comes back high over the sleeping town.
  ...hold(16.32, WIDE_FAR, WIDE_AT, 36, 0.5, 0.06, undefined, 0),
  // THE REWIND, then the same evening: one still frame over the town, coming in slowly.
  { P: 16.9, eye: fix(0, 33, 104), at: WIDE_AT, fov: 35, ppx: 0.5, dof: 0 },
  ...hold(17.7, fix(0, 31.5, 100), WIDE_AT, 35.5, 0.5, 0.08, undefined, 0),
  ...hold(18.5, WIDE_EYE, WIDE_AT, 36, 0.5, 0.12, undefined, 0),
  { P: 19.3, eye: fix(0, 29, 93), at: WIDE_AT, fov: 36, ppx: 0.5, dof: 0 },
  // (While the picture is in two, each pane has its own camera: PANE_KEYS.)
  { P: 27.3, eye: fix(0, 29, 93), at: WIDE_AT, fov: 36, ppx: 0.5, dof: 0 },
  // ONE PICTURE AGAIN: the town at dusk with both places in it; then up, and the paper.
  ...hold(27.9, WIDE_EYE, WIDE_AT, 36, 0.5, 0.1, undefined, 0),
  { P: 28.6, eye: fix(0, 36, 110), at: fix(0, 7, -14), fov: 37, ppx: 0.5, dof: 0 },
  { P: 29.6, eye: fix(0, 46, 132), at: fix(0, 12, -20), fov: 39, ppx: 0.5, dof: 0 },
];

/*
 * THE PANES' CAMERAS (round 27). Each pane is locked off: one composed frame
 * per beat, a slow push at most (the world's living camera), and a new frame
 * only when both panes reframe together. Pane A is the customer, pane B the
 * business (split.ts). Before the picture divides and after it is one again,
 * a pane shows its share of the main camera's frame (`sub` 1).
 */

/** Sam on the sofa, through the open sliders (the phone's page lifted beside them). */
const A_SOFA_EYE = H(-2.75, 1.42, -6.0);
const A_SOFA_AT = H(-2.75, 1.12, -1.4);
/** Sam's garden by day: the deck (old, then new), Sam on it with the phone. */
const A_DECK_EYE = H(3.0, 3.4, -13.6);
const A_DECK_AT = H(-1.4, 1.0, -6.6);
/** 3am: from Sam's dark garden, over the side fence to the neighbour's window that lights up (Aroha's). */
const A_NIGHT_EYE = fix(-46.0, 2.4, 27.6);
const A_NIGHT_AT = fix(-33.5, 2.2, 19.5);

/** The shopfront: the office through the glass, its desk, its chair, the laptop's light. */
const B_WIN_EYE = S(-3.9, 1.62, 9.4);
const B_WIN_AT = S(-3.9, 1.72, 4.8);
const B_WIN = { dof: 0.14, ppy: 0.42 };

const A = (P: number, eye: Pt, at: Pt, fov: number, o: { ppx?: number; ppy?: number; dof?: number; sub?: number } = {}): Key => ({ P, eye, at, fov, ppx: o.ppx ?? 0.5, ppy: o.ppy, dof: o.dof, sub: o.sub ?? 0 });

export const KEYS_A: Key[] = [
  // The one picture (its left share) until it divides.
  A(18.3, WIDE_EYE, WIDE_AT, 38, { sub: 1, dof: 0 }),
  A(18.98, WIDE_EYE, WIDE_AT, 38, { sub: 1, dof: 0 }),
  // Down into Sam's garden, as the film first came down to it.
  A(19.14, fix(-20, 30, 82), fix(-26, 3, 8), 40, { sub: 0.2, dof: 0 }),
  A(19.3, fix(-50, 9, 40), fix(-42, 1.8, 17), 40, { dof: 0 }),
  A(19.42, fix(-43.5, 2.8, 26.0), fix(-41.4, 1.5, 17.4), 40, { dof: 0.1 }),
  ...still(19.62, 0.08, A_SOFA_EYE, A_SOFA_AT, 40, { dof: 0.14 }),
  ...still(20.6, 0.24, A_SOFA_EYE, A_SOFA_AT, 40, { dof: 0.14 }),
  // 3am: across the dark town to the window that lights up.
  ...still(21.16, 0.18, A_NIGHT_EYE, A_NIGHT_AT, 36, { dof: 0.2 }),
  // The garden by day: the old deck; the quote accepted; the build; a year; the reminder.
  ...still(22.4, 0.7, A_DECK_EYE, A_DECK_AT, 40, { dof: 0.14 }),
  ...still(24.4, 0.9, A_DECK_EYE, A_DECK_AT, 40, { dof: 0.14 }),
  // The Saturday (you come and oil the deck) and six o'clock: the garden still.
  ...still(26.6, 0.62, A_DECK_EYE, A_DECK_AT, 40, { dof: 0.14 }),
  // Up and back into the one picture.
  A(27.48, fix(-30, 24, 74), fix(-22, 2, 6), 39, { sub: 0.35, dof: 0 }),
  A(27.66, WIDE_EYE, WIDE_AT, 38, { sub: 1, dof: 0 }),
  A(28.2, WIDE_EYE, WIDE_AT, 38, { sub: 1, dof: 0 }),
];

export const KEYS_B: Key[] = [
  A(18.3, WIDE_EYE, WIDE_AT, 38, { sub: 1, dof: 0 }),
  A(18.98, WIDE_EYE, WIDE_AT, 38, { sub: 1, dof: 0 }),
  // Down to the workshop, to the lit office window.
  A(19.14, fix(20, 30, 80), fix(26, 3, -6), 40, { sub: 0.2, dof: 0 }),
  A(19.3, fix(36.5, 10, 22), fix(39.8, 2.0, -11), 40, { dof: 0 }),
  A(19.42, fix(40.1, 2.6, 0.5), fix(40.1, 1.7, -12.4), 40, { dof: 0.1 }),
  ...still(19.62, 0.08, B_WIN_EYE, B_WIN_AT, 40, B_WIN),
  // The empty office through the night, the morning, the job, a year: the business stays where it is.
  ...still(27.12, 0.06, B_WIN_EYE, B_WIN_AT, 40, B_WIN),
  A(27.48, fix(30, 24, 70), fix(24, 2, -6), 39, { sub: 0.35, dof: 0 }),
  A(27.66, WIDE_EYE, WIDE_AT, 38, { sub: 1, dof: 0 }),
  A(28.2, WIDE_EYE, WIDE_AT, 38, { sub: 1, dof: 0 }),
];

export const PANE_KEYS: [Key[], Key[]] = [KEYS_A, KEYS_B];

export type CamOut = { eye: THREE.Vector3; at: THREE.Vector3; fov: number; ppx: number; ppy: number; roll: number; dof: number; sub: number };

function hermite(p0: number, p1: number, m0: number, m1: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * m1;
}
/** A shared, weighted harmonic tangent: at a change of direction it settles instead of swinging past. */
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

const DOF_DEFAULT = 0.34;
/** Each list of keys keeps its own scratch points. */
const caches = new WeakMap<Key[], { eye: THREE.Vector3; at: THREE.Vector3 }[]>();

/** The camera at film time P (the main camera's keys, or a pane's). */
export function cameraAt(P: number, c: Ctx, out: CamOut, keys: Key[] = KEYS) {
  let cache = caches.get(keys);
  if (!cache) caches.set(keys, (cache = keys.map(() => ({ eye: new THREE.Vector3(), at: new THREE.Vector3() }))));
  let i = 0;
  while (i < keys.length - 2 && P >= keys[i + 1].P) i++;
  const i0 = Math.max(0, i - 1);
  const i1 = i;
  const i2 = Math.min(keys.length - 1, i + 1);
  const i3 = Math.min(keys.length - 1, i + 2);
  for (const j of [i0, i1, i2, i3]) {
    cache[j].eye.copy(keys[j].eye(c, P));
    cache[j].at.copy(keys[j].at(c, P));
  }
  const A = keys[i1];
  const Bk = keys[i2];
  const span = Math.max(1e-4, Bk.P - A.P);
  const t = Math.min(1, Math.max(0, (P - A.P) / span));
  const h0 = keys[i1].P - keys[i0].P;
  const h2 = keys[i3].P - keys[i2].P;
  for (const f of ["eye", "at"] as const)
    for (const ax of ["x", "y", "z"] as const) out[f][ax] = shotCurve(cache[i0][f][ax], cache[i1][f][ax], cache[i2][f][ax], cache[i3][f][ax], h0, span, h2, t);
  for (const field of ["fov", "ppx", "ppy", "roll", "dof", "sub"] as const) {
    const fb = field === "roll" || field === "sub" ? 0 : field === "fov" ? 40 : field === "dof" ? DOF_DEFAULT : 0.5;
    out[field] = shotCurve(keys[i0][field] ?? fb, A[field] ?? fb, Bk[field] ?? fb, keys[i3][field] ?? fb, h0, span, h2, t);
  }
}

/**
 * THE CAMERA, SMOOTHED: the flight averaged over a short window of film
 * time (a Gaussian, about ±0.07 screens), re-evaluating every key at each
 * sample so a shot that rides with the envelope still rides with it.
 */
const SM_N = 4;
const SM_STEP = 0.0175;
const SM_SIGMA = 0.034;
const SM_W = (() => {
  const w: number[] = [];
  let sum = 0;
  for (let i = 0; i <= SM_N * 2; i++) sum += Math.exp(-0.5 * Math.pow(((i - SM_N) * SM_STEP) / SM_SIGMA, 2));
  for (let i = 0; i <= SM_N * 2; i++) w.push(Math.exp(-0.5 * Math.pow(((i - SM_N) * SM_STEP) / SM_SIGMA, 2)) / sum);
  return w;
})();
const _o: CamOut = { eye: new THREE.Vector3(), at: new THREE.Vector3(), fov: 40, ppx: 0.5, ppy: 0.5, roll: 0, dof: 0, sub: 0 };
export function cameraSmooth(P: number, c: Ctx, out: CamOut, end: number, keys: Key[] = KEYS) {
  out.eye.set(0, 0, 0);
  out.at.set(0, 0, 0);
  out.fov = out.ppx = out.ppy = out.roll = out.dof = out.sub = 0;
  for (let i = 0; i <= SM_N * 2; i++) {
    const Pk = Math.min(end, Math.max(0, P + (i - SM_N) * SM_STEP));
    const w = SM_W[i];
    cameraAt(Pk, c, _o, keys);
    out.eye.addScaledVector(_o.eye, w);
    out.at.addScaledVector(_o.at, w);
    out.fov += _o.fov * w;
    out.ppx += _o.ppx * w;
    out.ppy += _o.ppy * w;
    out.roll += _o.roll * w;
    out.dof += _o.dof * w;
    out.sub += _o.sub * w;
  }
}

/**
 * A pane's share of the one picture: the main camera's frame cut to the
 * pane (the same eye and aim; the lens and its shift for the pane's part of
 * the frame). `r` is the pane [x0, y0, x1, y1] as shares of the frame, y down.
 * Blended into the pane's own shot by its `sub`.
 */
export function paneShare(main: CamOut, pane: CamOut, r: [number, number, number, number]) {
  const s = pane.sub;
  if (s <= 0) return pane;
  const rad = THREE.MathUtils.degToRad;
  const w = Math.max(1e-3, r[2] - r[0]);
  const h = Math.max(1e-3, r[3] - r[1]);
  // Vertically: the pane's height is h of the frame's.
  const fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(rad(main.fov) / 2) * h));
  const ppx = (main.ppx - r[0]) / w;
  const ppy = (main.ppy - r[1]) / h;
  pane.eye.lerp(main.eye, s);
  pane.at.lerp(main.at, s);
  pane.fov += (fov - pane.fov) * s;
  pane.ppx += (ppx - pane.ppx) * s;
  pane.ppy += (ppy - pane.ppy) * s;
  pane.roll += (main.roll - pane.roll) * s;
  pane.dof += (main.dof - pane.dof) * s;
  return pane;
}

/** Inside one of the two rooms (where the camera must not back away through a wall). */
function indoors(e: THREE.Vector3) {
  const home = e.x > -49.2 && e.x < -38.8 && e.z > 10.8 && e.z < 20.2 && e.y < 3.3;
  const shop = e.x > 36.8 && e.x < 51.2 && e.z > -23.2 && e.z < -10.8 && e.y < 4.6;
  return home || shop;
}
const _dir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/** The way back: along the line of sight, or level when looking up (backing down that line would sink into the ground). */
function backDir(c: CamOut, out: THREE.Vector3) {
  out.subVectors(c.eye, c.at);
  if (out.y < 0) out.y = 0;
  const l = out.length();
  return l < 1e-4 ? out.set(0, 0, 0) : out.divideScalar(l);
}

/**
 * THE PHONE'S PULL-BACK, worked out ahead for the whole film. Once: at each
 * moment the free distance behind the camera (the town's height field, the
 * rooms, the cards in the air; none from inside a room), short of the point
 * where something near would fill the bottom of the taller frame (a roof
 * under the lens), with the shot's distance and lens. Then,
 * per screen shape: how far the camera would like to back away (half of what
 * keeps the desktop shot's width in view), cut to the free distance, and the
 * lower envelope of that smoothed (an erosion wider than the blur, so it never
 * passes the free distance): a tree crossing the line behind never makes the
 * camera jump.
 */
export const BACK_STEP = 0.02;
const BACK_MAX = 18;
export type BackBase = { free: Float32Array; d: Float32Array; fov: Float32Array };
/** Something in the air the camera keeps clear of (a card), from film time `from` on. */
export type Air = { c: THREE.Vector3; r: number; from: number };
export function phoneBackBase(c: Ctx, end: number, field: { get: (x: number, z: number) => number; bld: (x: number, z: number) => number }, air: Air[] = []): BackBase {
  const n = Math.ceil(end / BACK_STEP) + 1;
  const base = { free: new Float32Array(n), d: new Float32Array(n), fov: new Float32Array(n) };
  const o: CamOut = { eye: new THREE.Vector3(), at: new THREE.Vector3(), fov: 40, ppx: 0.5, ppy: 0.5, roll: 0, dof: 0, sub: 0 };
  const dir = new THREE.Vector3();
  const p = new THREE.Vector3();
  const q = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const low = new THREE.Vector3();
  const rad = THREE.MathUtils.degToRad;
  for (let i = 0; i < n; i++) {
    const P = Math.min(end, i * BACK_STEP);
    cameraSmooth(P, c, o, end);
    base.d[i] = o.eye.distanceTo(o.at);
    base.fov[i] = o.fov;
    if (indoors(o.eye)) continue;
    backDir(o, dir);
    // The ray to the bottom of the phone's frame (its lens widened, the subject lifted to 0.36).
    fwd.subVectors(o.at, o.eye).normalize();
    right.crossVectors(fwd, _up);
    const level = right.lengthSq() > 1e-6;
    if (level) {
      right.normalize();
      up.crossVectors(right, fwd);
      low.copy(fwd).addScaledVector(up, -1.28 * Math.tan(rad(Math.min(64, o.fov * 1.35)) / 2)).normalize();
    }
    let go = 0;
    let hit = false;
    for (let s = 0.5; s <= BACK_MAX + 1e-6 && !hit; s += 0.5) {
      p.copy(o.eye).addScaledVector(dir, s);
      if (indoors(p) || field.get(p.x, p.z) + 0.7 > p.y) hit = true;
      for (const a of air) if (P >= a.from && p.distanceTo(a.c) < a.r) hit = true;
      if (level && !hit) {
        // Nothing standing in the near part of the frame's bottom edge.
        const reach = Math.min(10, p.distanceTo(o.at) * 0.5);
        for (let t = 0.5; t <= reach; t += 0.5) {
          q.copy(p).addScaledVector(low, t);
          if (q.y > 0 && q.y < field.bld(q.x, q.z) - 0.6) {
            hit = true;
            break;
          }
        }
      }
      if (!hit) go = s;
    }
    base.free[i] = hit ? Math.max(0, go - 0.5) : BACK_MAX;
  }
  return base;
}
export function phoneBackTable(base: BackBase, aspect: number) {
  const n = base.free.length;
  const w = Math.min(1, (1 - aspect) / 0.45);
  const rad = THREE.MathUtils.degToRad;
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const d = base.d[i];
    const hDesk = 2 * Math.atan(Math.tan(rad(base.fov[i]) / 2) * 1.6);
    const vPhone = Math.min(64, base.fov[i] * 1.35);
    const hPhone = 2 * Math.atan(Math.tan(rad(vPhone) / 2) * aspect);
    const need = (d * Math.tan(hDesk / 2)) / Math.tan(hPhone / 2);
    raw[i] = Math.min(base.free[i], Math.min(BACK_MAX, Math.max(0, need - d) * 0.5) * w);
  }
  const rE = Math.round(0.2 / BACK_STEP);
  const rG = Math.round(0.18 / BACK_STEP);
  const sg = 0.06 / BACK_STEP;
  const ero = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let m = Infinity;
    for (let j = Math.max(0, i - rE); j <= Math.min(n - 1, i + rE); j++) m = Math.min(m, raw[j]);
    ero[i] = m;
  }
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    let ws = 0;
    for (let j = -rG; j <= rG; j++) {
      const w = Math.exp(-0.5 * (j / sg) * (j / sg));
      sum += ero[Math.min(n - 1, Math.max(0, i + j))] * w;
      ws += w;
    }
    out[i] = sum / ws;
  }
  return out;
}

/**
 * On a portrait screen the words take the lower part: the subject moves to
 * the middle of the upper part, the lens widens, and the camera backs away by
 * `back` (phoneBackTable).
 */
export function phoneAdjust(c: CamOut, aspect: number, back = 0) {
  if (aspect >= 1) return c;
  const w = Math.min(1, (1 - aspect) / 0.45);
  const vPhone = Math.min(64, c.fov * 1.35);
  if (back > 0) c.eye.addScaledVector(backDir(c, _dir), back);
  c.fov = THREE.MathUtils.lerp(c.fov, vPhone, w);
  c.ppx = THREE.MathUtils.lerp(c.ppx, 0.5, w * 0.85);
  c.ppy = THREE.MathUtils.lerp(c.ppy, 0.36, w);
  return c;
}

export { k as _k, B as _B };
