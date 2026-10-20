import * as THREE from "three";
import { range, smooth, smoother } from "./ease";

/**
 * THE DROP'S JOURNEY: where the drop is at every moment of the new way, and
 * what it is (docs/STORY.md). A pure function of P, so the camera can ride
 * with it (camera.ts) and any moment is the same each time it is visited.
 *
 * Positions are keys joined by a shape-preserving Hermite curve (as the
 * camera's are); a repeated key is a hold. Everything else (its size, its
 * shape, which screen it shows, how bright it is, how many of the customer's
 * amber points it carries) is a plain function of P.
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** The customer's house (its own frame: +z its front, north). */
export const H = (x: number, y: number, z: number) => V(-44 - x, y, 15.5 - z);
/** The workshop (+z its front, south). */
export const S = (x: number, y: number, z: number) => V(44 + x, y, -17 + z);

/** Where the drop stops. */
export const SPOT = {
  /** Over the keyboard, where the hands were. */
  birth: S(-3.9, 1.22, 4.05),
  /** Resting on the desk beside the laptop (a small light). */
  desk: S(-4.62, 0.99, 4.2),
  /** Over the desk, facing the owner (the quote, the day). */
  overDesk: S(-4.55, 1.98, 5.2),
  /** Over the desk at night, facing the street (the calendar). */
  night: S(-3.9, 1.92, 5.25),
  /** Over the desk, the question left for the morning. */
  hand: S(-3.9, 1.62, 4.55),
  /** In the garden, just outside the open sliders. */
  garden: H(-4.1, 1.62, -7.3),
  /** Beside Sam on the sofa (the phone's screen, read). */
  phone: H(-3.25, 1.5, -2.5),
  /** Beside Sam on the deck. */
  deck: H(-0.2, 1.62, -6.0),
  /** A drop of dew on the deck's front edge, at its far end. */
  dew: H(-4.7, 0.676, -9.33),
  /** Over our van at Sam's kerb. */
  van: V(-43.2, 3.1, 3.4),
};

/** The houses it answers on its own (set from the town once: the nearest to these points). */
export const HOUSES = {
  night: { door: V(-6, 0, 33), fwd: V(0, 0, -1) },
  late: { door: V(88, 0, -55), fwd: V(0, 0, 1) },
};
/** In front of a house's door, at a window's height. */
const atHouse = (h: { door: THREE.Vector3; fwd: THREE.Vector3 }, out: number, up: number) => h.door.clone().addScaledVector(h.fwd, out).setY(up);

type Key = { P: number; p: () => THREE.Vector3 };
const k = (P: number, p: THREE.Vector3 | (() => THREE.Vector3)): Key => ({ P, p: typeof p === "function" ? p : () => p });

/** The keys. */
export const KEYS: Key[] = [
  // THE TURN: born over the keyboard; out through the glass and up over the town while the night runs back.
  k(15.9, SPOT.birth),
  k(16.08, SPOT.birth.clone().add(V(0, 0.04, 0))),
  k(16.22, S(-3.9, 1.5, 4.5)),
  k(16.34, S(-3.9, 2.05, 6.9)),
  k(16.46, V(39, 9, 2)),
  k(16.6, V(21, 29, 22)),
  k(16.76, V(-1, 45, 40)),
  k(16.94, V(-5, 46.5, 40.5)),
  // The dive: down over the roofs to the main street, west along it at roof height, over Sam's roof, into the garden.
  k(17.06, V(-15, 30, 26)),
  k(17.16, V(-26, 13, 8)),
  k(17.24, V(-36.5, 9.6, 3.2)),
  k(17.32, V(-44, 9.2, 14)),
  k(17.4, V(-43.2, 3.8, 25)),
  k(17.48, SPOT.garden),
  k(17.96, SPOT.garden),
  // NEW WEBSITE: in through the sliders to Sam's phone; the page.
  k(18.06, H(-3.05, 1.56, -4.6)),
  k(18.16, SPOT.phone),
  k(19.62, SPOT.phone),
  // NEW AI: the reply where Sam sits; across the town to the workshop with the booking; 3am; the handover.
  k(20.58, SPOT.phone),
  k(20.62, H(-3.0, 2.0, -6.2)),
  k(20.68, V(-36, 11, 15)),
  k(20.74, V(0, 14, -2)),
  k(20.79, V(37, 5.5, -5.5)),
  k(20.83, SPOT.night),
  k(20.94, SPOT.night),
  k(20.99, SPOT.desk),
  k(21.02, SPOT.desk),
  k(21.05, S(-3.9, 2.1, 7.2)),
  k(21.08, () => HOUSES.night.door.clone().lerp(S(-3.9, 0, 6), 0.5).setY(12)),
  k(21.11, () => atHouse(HOUSES.night, 3.4, 2.1)),
  k(21.23, () => atHouse(HOUSES.night, 3.4, 2.1)),
  k(21.275, () => HOUSES.night.door.clone().lerp(S(-3.9, 0, 6), 0.5).setY(12)),
  k(21.32, S(-3.9, 2.0, 7.0)),
  k(21.36, SPOT.hand),
  k(21.86, SPOT.hand),
  // NEW PLATFORM: the quote over the desk; to Sam, accepted; over the build; the invoice on the deck.
  k(21.93, SPOT.overDesk),
  k(22.36, SPOT.overDesk),
  k(22.4, S(-3.9, 2.15, 7.8)),
  k(22.43, V(22, 12, 1)),
  k(22.47, V(-26, 12, 9)),
  k(22.5, H(-3.0, 2.2, -6.2)),
  k(22.53, SPOT.phone),
  k(22.6, SPOT.phone),
  k(22.66, H(-1.2, 2.7, -8.6)),
  k(23.08, H(-0.4, 2.5, -7.6)),
  k(23.17, SPOT.deck),
  k(23.62, SPOT.deck),
  // NEW FOLLOW-UP: the review; a year as a drop of dew; the reminder; over our van.
  k(23.88, SPOT.deck),
  k(24.36, SPOT.deck),
  k(24.45, SPOT.dew),
  k(24.97, SPOT.dew),
  k(25.05, SPOT.deck),
  k(25.36, SPOT.deck),
  k(25.43, H(-0.5, 7.4, 3.5)),
  k(25.52, SPOT.van),
  k(25.64, SPOT.van),
  // NEW YOU: up off the van, home along the main street in the late sun; the day over the desk; down beside the laptop; out once more.
  k(25.69, V(-42.4, 9.4, 2.4)),
  k(25.76, V(-24, 11.5, -1)),
  k(25.86, V(10, 11, -3)),
  k(25.96, V(38.2, 3.6, -6.2)),
  k(26.06, S(-3.9, 1.7, 6.2)),
  k(26.13, SPOT.overDesk),
  k(26.46, SPOT.overDesk),
  k(26.6, SPOT.desk),
  k(27.36, SPOT.desk),
  k(27.42, S(-3.9, 2.2, 7.2)),
  k(27.52, () => atHouse(HOUSES.late, 3.2, 2.0).lerp(S(-3.9, 0, 7), 0.45).setY(5.5)),
  k(27.6, () => atHouse(HOUSES.late, 3.2, 2.0)),
  k(27.72, () => atHouse(HOUSES.late, 3.2, 2.0)),
  // THE END: up toward the rising camera, until its light is the whole picture.
  k(28.0, () => atHouse(HOUSES.late, 3.2, 2.0).add(V(0, 9, 0))),
  k(28.3, V(36, 31, 42)),
  k(28.66, V(28.4, 45.1, 74.6)),
  k(29.6, V(27.5, 48.9, 79.1)),
];

function hermite(p0: number, p1: number, m0: number, m1: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * m1;
}
function tangent(h0: number, h1: number, d0: number, d1: number) {
  if (d0 * d1 <= 0) return 0;
  const w0 = 2 * h1 + h0;
  const w1 = h1 + 2 * h0;
  return (w0 + w1) / (w0 / d0 + w1 / d1);
}
const _a = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
/** Where the drop is at P (its keys, joined). Before the first key, at the first. */
export function dropPos(P: number, out = new THREE.Vector3()) {
  const K = KEYS;
  if (P <= K[0].P) return out.copy(K[0].p());
  if (P >= K[K.length - 1].P) return out.copy(K[K.length - 1].p());
  let i = 0;
  while (i < K.length - 2 && P >= K[i + 1].P) i++;
  const i0 = Math.max(0, i - 1);
  const i2 = Math.min(K.length - 1, i + 1);
  const i3 = Math.min(K.length - 1, i + 2);
  _a[0].copy(K[i0].p());
  _a[1].copy(K[i].p());
  _a[2].copy(K[i2].p());
  _a[3].copy(K[i3].p());
  const h0 = K[i].P - K[i0].P;
  const h1 = Math.max(1e-4, K[i2].P - K[i].P);
  const h2 = K[i3].P - K[i2].P;
  const t = Math.min(1, Math.max(0, (P - K[i].P) / h1));
  for (const ax of ["x", "y", "z"] as const) {
    const p0 = _a[0][ax];
    const p1 = _a[1][ax];
    const p2 = _a[2][ax];
    const p3 = _a[3][ax];
    const d = (p2 - p1) / h1;
    const m0 = h0 > 0 ? tangent(h0, h1, (p1 - p0) / h0, d) : d;
    const m1 = h2 > 0 ? tangent(h1, h2, d, (p3 - p2) / h2) : d;
    out[ax] = hermite(p1, p2, m0 * h1, m1 * h1, t);
  }
  return out;
}
const _p = new THREE.Vector3();
/** Its velocity at P (m per screen of P). */
export function dropVel(P: number, out = new THREE.Vector3()) {
  const e = 0.004;
  dropPos(P + e, out);
  dropPos(P - e, _p);
  return out.sub(_p).multiplyScalar(1 / (2 * e));
}

/** The screens it can show (world.ts maps these to the screens it draws). */
export type Face = "phone" | "cal" | "hand" | "quote" | "today" | "night" | "late" | null;

export type Being = {
  /** 0 not there … 1 there. */
  vis: number;
  /** Its radius as a drop (m). */
  r: number;
  /** 0 a drop … 1 a panel; the panel's size, which screen, and how far the screen is in. */
  shape: number;
  w: number;
  h: number;
  face: Face;
  faceK: number;
  /** Which way the panel faces: toward the camera, the owner (at the desk), or the street. */
  facing: "camera" | "owner" | "street";
  /** The light inside; the customer's amber points carried; the tremble. */
  glow: number;
  motes: number;
  wobble: number;
};

/** A panel's time: [opens, starts closing, closed], its size and screen. */
type Span = { a: number; b: number; w: number; h: number; face: Face; facing: Being["facing"] };
const PHONE_W = 0.66;
const PHONE_H = 1.38;
export const PANELS: Span[] = [
  { a: 18.12, b: 19.6, w: PHONE_W, h: PHONE_H, face: "phone", facing: "camera" },
  { a: 19.98, b: 20.58, w: PHONE_W, h: PHONE_H, face: "phone", facing: "camera" },
  { a: 20.82, b: 20.95, w: 1.7, h: 1.06, face: "cal", facing: "street" },
  { a: 21.11, b: 21.22, w: PHONE_W, h: PHONE_H, face: "night", facing: "camera" },
  { a: 21.36, b: 21.86, w: 1.12, h: 0.7, face: "hand", facing: "camera" },
  { a: 21.92, b: 22.36, w: 1.6, h: 1.0, face: "quote", facing: "owner" },
  { a: 22.53, b: 22.62, w: PHONE_W, h: PHONE_H, face: "phone", facing: "camera" },
  { a: 23.16, b: 23.62, w: PHONE_W, h: PHONE_H, face: "phone", facing: "camera" },
  { a: 23.88, b: 24.36, w: PHONE_W, h: PHONE_H, face: "phone", facing: "camera" },
  { a: 25.04, b: 25.36, w: PHONE_W, h: PHONE_H, face: "phone", facing: "camera" },
  { a: 26.12, b: 26.46, w: 1.5, h: 0.94, face: "today", facing: "owner" },
  { a: 27.6, b: 27.72, w: 0.5, h: 1.04, face: "late", facing: "camera" },
];
/** How long it takes to open out and to draw back in (P). */
const OPEN = 0.06;
const CLOSE = 0.05;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function being(P: number, out: Being): Being {
  out.vis = smooth(range(P, 15.94, 16.08));
  out.r = 0.3;
  out.shape = 0;
  out.w = 1;
  out.h = 1;
  out.face = null;
  out.faceK = 0;
  out.facing = "camera";
  out.glow = 1;
  out.wobble = 0;
  // A panel, opening out and drawing back in.
  for (const s of PANELS) {
    if (P < s.a - 0.001 || P > s.b + CLOSE) continue;
    const open = smoother(range(P, s.a, s.a + OPEN));
    const close = smoother(range(P, s.b, s.b + CLOSE));
    out.shape = open * (1 - close);
    out.w = s.w;
    out.h = s.h;
    out.face = s.face;
    out.faceK = smooth(range(P, s.a + OPEN * 0.5, s.a + OPEN)) * (1 - smooth(range(P, s.b - 0.005, s.b + CLOSE * 0.5)));
    out.facing = s.facing;
  }
  // Resting on the desk: small, its light low; the dew: smaller still.
  const desk = Math.max(bumpW(P, 20.95, 21.04, 0.03), bumpW(P, 26.5, 27.38, 0.06));
  const dew = bumpW(P, 24.38, 25.02, 0.06);
  out.r = 0.3 - 0.19 * desk - 0.24 * dew;
  out.glow = 1 - 0.55 * desk - 0.9 * dew;
  // Born: it gathers from nothing, trembling, bright.
  const born = range(P, 15.94, 16.2);
  out.glow += 1.2 * bumpW(P, 15.94, 16.36, 0.08);
  out.wobble = Math.max(0, (1 - born) * born * 4) * 0.75;
  // A tremble after each arrival.
  for (const at of [17.48, 18.16, 20.83, 21.11, 21.35, 21.93, 22.53, 23.17, 24.45, 25.52, 26.13, 27.6]) {
    if (P >= at && P < at + 0.12) out.wobble = Math.max(out.wobble, (1 - (P - at) / 0.12) * 0.9);
  }
  // Sam's three answers: amber points inside it, from the form until they flow into the quote's lines.
  out.motes = P < 19.2 ? 0 : P < 19.6 ? clamp01((P - 19.2) / 0.36) * 3 : P < 22.0 ? 3 : P < 22.24 ? 3 * (1 - clamp01((P - 22.0) / 0.24)) : 0;
  // The end: it grows as it comes to the lens, and its light takes the picture.
  if (P > 28.4) {
    out.r = 0.3 + 0.75 * smooth(range(P, 28.4, 28.75));
    out.glow = 1 + 2.5 * smooth(range(P, 28.55, 28.9));
  }
  return out;
}

function bumpW(P: number, a: number, b: number, f: number) {
  return range(P, a, a + f) * (1 - range(P, b - f, b));
}
