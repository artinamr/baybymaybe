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
export type Key = { P: number; eye: Pt; at: Pt; fov: number; ppx?: number; ppy?: number; roll?: number };

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
const van =
  (dx: number, dy: number, dz: number): Pt =>
  (c, P) =>
    c.van(P).clone().add(V(dx, dy, dz));

/** Reading Sam's lifted phone (in the garden, looking into the living room). */
const READ_EYE = H(-3.0, 1.62, -6.3);
const READ_AT = H(-3.1, 1.45, -2.2);
/** Reading it on the deck (Sam standing, the card beside them). */
const DECK_EYE = H(0.9, 1.85, -11.2);
const DECK_AT = H(-1.0, 1.45, -6.2);
/** The new route's cards (under their parts). */
const node = (x: number, y: number, z: number): Pt => () => V(x, y, z);

/** A composed frame held for a moment either side of P (a rest sits still). */
function hold(P: number, eye: Pt, at: Pt, fov: number, ppx = 0.6, half = 0.05, ppy?: number): Key[] {
  return [
    { P: P - half, eye, at, fov, ppx, ppy },
    { P: P + half, eye, at, fov, ppx, ppy },
  ];
}

export const KEYS: Key[] = [
  // OPEN: the town at dusk, then down to one lit room.
  { P: 0, eye: fix(-112, 56, 94), at: fix(-38, 0, 8), fov: 36, ppx: 0.6 },
  ...hold(0.62, fix(-94, 40, 77), fix(-41, 1, 13), 34),
  { P: 1.22, eye: fix(-66, 19, 52), at: fix(-42.5, 2.0, 17), fov: 34, ppx: 0.6 },
  ...hold(1.66, fix(-42.6, 10.6, 42.5), fix(-42.4, 1.6, 17.0), 34, 0.6, 0.06),
  { P: 1.88, eye: fix(-42.1, 6.9, 27.6), at: fix(-42.2, 1.5, 16.9), fov: 34, ppx: 0.6 },
  { P: 2.06, eye: H(-2.6, 1.85, -7.6), at: H(-2.9, 1.4, -1.8), fov: 33, ppx: 0.6 },
  ...hold(2.3, READ_EYE, READ_AT, 33, 0.6, 0.06),
  // WEBSITE: the page loading; up over the town's phones; back to the form.
  ...hold(2.9, H(-3.05, 1.6, -6.0), READ_AT, 32, 0.6, 0.05),
  { P: 3.2, eye: fix(-50, 17, 34), at: fix(-36, 7, 9), fov: 44, ppx: 0.6 },
  ...hold(3.5, fix(-52, 19, 37), fix(-35, 7, 8), 44, 0.6, 0.08),
  { P: 3.92, eye: H(-2.4, 3.0, -10.5), at: H(-2.9, 1.4, -1.8), fov: 34, ppx: 0.6 },
  ...hold(4.3, READ_EYE, READ_AT, 32, 0.6, 0.06),
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
  ...hold(7.58, S(-3.5, 1.82, 2.12), S(-3.9, 1.3, 4.8), 50, 0.56, 0.05),
  // ADMIN: behind the owner; the card being typed framed each time.
  ...hold(8.3, fix(40.25, 1.86, -14.88), fix(38.9, 1.82, -12.0), 46, 0.6, 0.08),
  ...hold(8.9, fix(40.7, 1.86, -14.88), fix(40.05, 1.9, -11.8), 46, 0.6, 0.06),
  ...hold(9.5, fix(39.7, 1.95, -14.5), fix(38.6, 1.86, -12.0), 40, 0.6, 0.08),
  { P: 9.86, eye: fix(40.3, 1.84, -14.88), at: fix(41.2, 1.86, -11.95), fov: 46, ppx: 0.6 },
  ...hold(10.3, fix(40.1, 1.95, -14.9), fix(40.1, 1.9, -11.9), 64, 0.5, 0.06),
  // FOLLOW-UP: out through the office window and across the town to Sam's new deck; a year; the other van.
  { P: 10.43, eye: fix(40.0, 1.8, -12.2), at: fix(40.0, 1.9, -6.0), fov: 54, ppx: 0.5 },
  { P: 10.5, eye: fix(40.0, 2.4, -8.6), at: fix(36.0, 4.0, 4.0), fov: 50, ppx: 0.5 },
  { P: 10.64, eye: fix(-14, 30, 40), at: fix(-34, 2, 18), fov: 42, ppx: 0.58 },
  ...hold(11.0, H(1.6, 4.2, -15.0), H(-1.6, 0.9, -6.0), 36, 0.6, 0.06),
  ...hold(11.6, H(4.0, 7.0, -19.5), H(-1.4, 1.2, -5.0), 38, 0.6, 0.08),
  ...hold(12.1, DECK_EYE, DECK_AT, 34, 0.6, 0.05),
  { P: 12.32, eye: fix(-40.5, 10.5, 16.0), at: fix(-43.5, 1.0, 6.0), fov: 42, ppx: 0.6 },
  ...hold(12.56, fix(-30.5, 8.5, -5.5), fix(-43.6, 1.4, 5.0), 40, 0.6, 0.06),
  // YOU: night; across to the office window; the owner in the clutter; out over the town; back.
  { P: 12.9, eye: fix(30, 26, 26), at: fix(40, 2, -13), fov: 40, ppx: 0.6 },
  ...hold(13.3, S(-3.9, 1.8, 11.0), S(-3.9, 1.6, 3.6), 36, 0.6, 0.06),
  { P: 13.8, eye: S(-3.4, 2.1, 14.5), at: S(-3.9, 1.7, 3.6), fov: 38, ppx: 0.58 },
  ...hold(14.4, fix(16, 34, 48), fix(40, 2, -13), 28, 0.56, 0.06),
  { P: 14.78, eye: S(-4.0, 2.0, 8.5), at: S(-3.9, 1.2, 3.8), fov: 40, ppx: 0.5 },
  { P: 15.0, eye: S(-3.95, 1.75, 5.6), at: S(-3.92, 1.05, 3.75), fov: 40, ppx: 0.5, ppy: 0.56 },
  // THE TURN: the hands; the paper coming apart round them; black; the town at dusk; the new route.
  ...hold(15.4, S(-2.62, 1.22, 4.1), S(-3.9, 1.0, 3.68), 40, 0.5, 0.06, 0.52),
  { P: 15.66, eye: S(-2.3, 1.75, 2.25), at: S(-4.1, 1.55, 4.4), fov: 54, ppx: 0.5 },
  { P: 16.22, eye: S(-2.1, 1.95, 2.2), at: S(-4.2, 1.35, 4.5), fov: 58, ppx: 0.5 },
  { P: 16.34, eye: S(-3.95, 1.9, 8.2), at: S(-3.9, 3.0, 20.0), fov: 50, ppx: 0.5 },
  { P: 16.5, eye: fix(-30, 80, 110), at: fix(0, 6, 0), fov: 40, ppx: 0.5 },
  ...hold(16.9, fix(-24, 72, 100), fix(0, 8, 0), 40, 0.5, 0.08),
  ...hold(17.7, fix(-20, 34, 58), fix(0, 14, 2), 46, 0.56, 0.08),
  // NEW WEBSITE.
  { P: 18.06, eye: H(-2.4, 3.0, -10.5), at: H(-2.9, 1.4, -1.8), fov: 34, ppx: 0.6 },
  ...hold(18.4, READ_EYE, READ_AT, 32, 0.6, 0.06),
  { P: 18.7, eye: fix(-50, 17, 34), at: fix(-36, 7, 9), fov: 44, ppx: 0.6 },
  ...hold(19.0, fix(-52, 19, 37), fix(-35, 7, 8), 44, 0.6, 0.05),
  ...hold(19.4, READ_EYE, READ_AT, 32, 0.6, 0.06),
  // NEW AI: along the line to the reply and back; the reply read; the booking; 3am.
  { P: 19.72, eye: H(-2.2, 3.0, -9.0), at: H(-2.8, 3.0, -2.4), fov: 40, ppx: 0.58 },
  { P: 19.92, eye: env(-8, 6, 13), at: env(6, -1, -4), fov: 44, ppx: 0.56 },
  { P: 20.08, eye: env(8, 6, -5), at: env(-6, -2, 5), fov: 46, ppx: 0.56 },
  { P: 20.26, eye: fix(-38.0, 7.2, 26.5), at: fix(-41.0, 1.6, 18.0), fov: 38, ppx: 0.6 },
  ...hold(20.5, READ_EYE, READ_AT, 32, 0.6, 0.06),
  { P: 20.62, eye: fix(-37.5, 9.0, 25.0), at: fix(-20, 12, 6), fov: 42, ppx: 0.58 },
  ...hold(20.76, node(2.4, 15.9, 2.8), node(4, 15.5, -6), 38, 0.6, 0.04),
  { P: 20.98, eye: fix(-28, 24, 26), at: fix(-12, 15, -1), fov: 44, ppx: 0.6 },
  ...hold(21.3, node(-16.4, 15.0, 7.4), node(-14, 14.1, -1), 40, 0.6, 0.08),
  // NEW PLATFORM: the quote, filled in by itself; it flies to Sam; accepted; the deck; paid.
  ...hold(22.1, node(18.6, 15.0, -1.6), node(21, 14.1, -10), 40, 0.6, 0.12),
  { P: 22.38, eye: env(-8, 3, 12), at: env(-6, -1, 4), fov: 46, ppx: 0.56 },
  ...hold(22.52, READ_EYE, READ_AT, 32, 0.6, 0.04),
  ...hold(22.9, H(4.0, 5.5, -15.5), H(-1.2, 0.8, -6.5), 38, 0.6, 0.06),
  ...hold(23.4, DECK_EYE, DECK_AT, 34, 0.6, 0.08),
  // NEW FOLLOW-UP: the review; a year; the reminder; our van.
  ...hold(24.2, DECK_EYE, DECK_AT, 34, 0.6, 0.1),
  ...hold(24.7, H(4.0, 7.0, -19.5), H(-1.4, 1.2, -5.0), 38, 0.6, 0.12),
  ...hold(25.2, DECK_EYE, DECK_AT, 34, 0.6, 0.08),
  { P: 25.4, eye: fix(-40.5, 10.5, 16.0), at: fix(-43.5, 1.0, 6.0), fov: 42, ppx: 0.6 },
  ...hold(25.64, fix(-30.5, 8.5, -5.5), fix(-43.6, 1.4, 5.0), 40, 0.6, 0.06),
  // NEW YOU: across the town at roof height; the office at six; the lid, the lamp; out the door; the van away.
  { P: 25.8, eye: fix(0, 22, 14), at: fix(30, 4, -8), fov: 44, ppx: 0.56 },
  { P: 25.96, eye: S(-3.3, 2.0, 10.4), at: S(-3.9, 1.4, 3.8), fov: 36, ppx: 0.6 },
  ...hold(26.3, S(-3.5, 1.8, 2.12), S(-3.9, 1.75, 5.0), 50, 0.56, 0.06),
  ...hold(26.62, S(-2.75, 1.3, 3.3), S(-4.1, 1.0, 4.0), 40, 0.5, 0.05),
  { P: 26.8, eye: S(-3.95, 1.75, 5.2), at: S(-2.0, 1.2, 6.5), fov: 44, ppx: 0.56 },
  { P: 27.0, eye: S(-0.5, 2.0, 13.0), at: S(-1.6, 1.2, 6.5), fov: 40, ppx: 0.56 },
  { P: 27.3, eye: S(4.0, 2.6, 17.0), at: S(3.0, 1.2, 9.0), fov: 40, ppx: 0.56 },
  ...hold(27.7, van(-14, 9, 16), van(0, 1, 0), 40, 0.56, 0.06),
  // END: up over the town at dusk; the light fills it.
  { P: 28.4, eye: fix(30, 40, 70), at: fix(4, 8, -4), fov: 44, ppx: 0.5 },
  { P: 29.6, eye: fix(24, 64, 96), at: fix(0, 8, -4), fov: 46, ppx: 0.5 },
];

export type CamOut = { eye: THREE.Vector3; at: THREE.Vector3; fov: number; ppx: number; ppy: number; roll: number };

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

const cache = KEYS.map(() => ({ eye: new THREE.Vector3(), at: new THREE.Vector3() }));

/** The camera at film time P. */
export function cameraAt(P: number, c: Ctx, out: CamOut) {
  let i = 0;
  while (i < KEYS.length - 2 && P >= KEYS[i + 1].P) i++;
  const i0 = Math.max(0, i - 1);
  const i1 = i;
  const i2 = Math.min(KEYS.length - 1, i + 1);
  const i3 = Math.min(KEYS.length - 1, i + 2);
  for (const j of [i0, i1, i2, i3]) {
    cache[j].eye.copy(KEYS[j].eye(c, P));
    cache[j].at.copy(KEYS[j].at(c, P));
  }
  const A = KEYS[i1];
  const Bk = KEYS[i2];
  const span = Math.max(1e-4, Bk.P - A.P);
  const t = Math.min(1, Math.max(0, (P - A.P) / span));
  const h0 = KEYS[i1].P - KEYS[i0].P;
  const h2 = KEYS[i3].P - KEYS[i2].P;
  for (const f of ["eye", "at"] as const)
    for (const ax of ["x", "y", "z"] as const) out[f][ax] = shotCurve(cache[i0][f][ax], cache[i1][f][ax], cache[i2][f][ax], cache[i3][f][ax], h0, span, h2, t);
  for (const field of ["fov", "ppx", "ppy", "roll"] as const) {
    const fb = field === "roll" ? 0 : field === "fov" ? 40 : 0.5;
    out[field] = shotCurve(KEYS[i0][field] ?? fb, A[field] ?? fb, Bk[field] ?? fb, KEYS[i3][field] ?? fb, h0, span, h2, t);
  }
}

/**
 * THE CAMERA, SMOOTHED: the flight averaged over a short window of film
 * time (a Gaussian, about ±0.07 screens), re-evaluating every key at each
 * sample so a shot that rides with the envelope still rides with it.
 */
const SM_N = 4;
const SM_STEP = 0.0175;
const SM_W = Array.from({ length: SM_N * 2 + 1 }, (_, i) => Math.exp(-0.5 * Math.pow(((i - SM_N) * SM_STEP) / 0.034, 2)));
const SM_SUM = SM_W.reduce((a, b) => a + b, 0);
const _o: CamOut = { eye: new THREE.Vector3(), at: new THREE.Vector3(), fov: 40, ppx: 0.5, ppy: 0.5, roll: 0 };
export function cameraSmooth(P: number, c: Ctx, out: CamOut, end: number) {
  out.eye.set(0, 0, 0);
  out.at.set(0, 0, 0);
  out.fov = out.ppx = out.ppy = out.roll = 0;
  for (let i = 0; i < SM_W.length; i++) {
    const Pk = Math.min(end, Math.max(0, P + (i - SM_N) * SM_STEP));
    const w = SM_W[i] / SM_SUM;
    cameraAt(Pk, c, _o);
    out.eye.addScaledVector(_o.eye, w);
    out.at.addScaledVector(_o.at, w);
    out.fov += _o.fov * w;
    out.ppx += _o.ppx * w;
    out.ppy += _o.ppy * w;
    out.roll += _o.roll * w;
  }
}

/** On a portrait screen: a wider lens, the subject toward the middle and a little lower. */
export function phoneAdjust(c: CamOut, aspect: number) {
  if (aspect >= 1) return c;
  const w = Math.min(1, (1 - aspect) / 0.45);
  const vfov = THREE.MathUtils.degToRad(c.fov);
  // Keep the horizontal field near what the desktop shot had.
  const hWide = 2 * Math.atan(Math.tan(vfov / 2) * 1.6);
  const vNeed = 2 * Math.atan(Math.tan(hWide / 2) / aspect);
  c.fov = THREE.MathUtils.lerp(c.fov, Math.min(78, THREE.MathUtils.radToDeg(vNeed) * 0.62), w);
  c.ppx = THREE.MathUtils.lerp(c.ppx, 0.5 + (c.ppx - 0.5) * 0.25, w);
  c.ppy = THREE.MathUtils.lerp(c.ppy, c.ppy + 0.06, w);
  return c;
}

export { k as _k, B as _B };
