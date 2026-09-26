import * as THREE from "three";
import type { Layout } from "./layout";
import type { SceneState } from "./sceneState";
import { measured, ui } from "./stores";
import { DEG, clamp01, easeInOutCubic, easeInOutSine, lerp, range } from "./ease";
import { HOME_B, STONE } from "./geo/types";
import { chapter } from "./chapters";
import { createRig } from "./formations";

/**
 * THE FILM — every scroll-driven value of the 3D, as a pure function of S.
 * Time-based life (dials drifting, the cursor, flashes, springs) lives in the
 * Director; this file only answers "where is everything at scroll position S".
 *
 * ONE STONE, SEVEN PLACES. The same eight pieces, never a new prop; what
 * changes is the place and the camera:
 *   00  the stone on its mirror                          (studio, paper)
 *   01  it looks down on you, then the mark's cut opens   (the light inside)
 *   02  the stack — four layers, the camera cranes down   (architecture)
 *   03  the book — the blades open on their spine          (dusk: the stone is the light)
 *   04  the specimens — each layer out in the world        (the long mirror)
 *   05  they gather and build the stone, layer on layer    (slow, four beats)
 *   06  from one angle it is the mark                      (the logo)
 *
 * Camera keys are interpolated in a framing-preserving space: visible height
 * at the pivot (log), fov (linear), azimuth/elevation (linear, direction as
 * written), principal point (linear). Distance is derived — so every
 * dolly-zoom (the finale's flattening onto the mark) holds its framing.
 */

type Key = {
  S: number;
  pivot: [number, number, number];
  az: number; // deg
  el: number; // deg
  dist: number;
  fov: number;
  pp: [number, number];
};

/** The rig's degrees of freedom, eased by the film (the Director adds life). */
export const rig = createRig();

/** Per-S facts the Director turns into light and life. */
export const film = {
  /** Stone yaw (radians) before the Director's idle / pointer terms. */
  yaw: 20 * DEG,
  /** The build site's yaw (radians) — layers that have gathered are posed with it. */
  yawB: 45 * DEG,
  /** Hero rise off the reflection (world y). */
  lift: 0,
  /** 0..1 how far the stack is formed (dials drift only while it is). */
  stack: 0,
  /** 0..1 the mark's cut is open (ch01). */
  open: 0,
  /** ch02 focused layer from the scroll (−1 none) and "all layers lit". */
  focus: -1,
  allLit: 0,
  /** 0..1 the book is open; beat 0 → product (left page), 1 → workspace (right). */
  book: 0,
  beat: 0,
  /** 0..1 per layer: at its specimen station (ch04). */
  station: [0, 0, 0, 0],
  /** ch05: 0..1 per layer, seated into the stone (build order: tips first). */
  seat: [0, 0, 0, 0],
  /** ch05: 0..1 the four layers hang as an exploded column at HOME_B. */
  column: 0,
  /** ch06: crown fade. */
  crownFade: 0,
  /** 1 while every piece is exactly in the intact stone (the rig must stay rigid). */
  whole: 1,
  /** Which glow recipe the Director applies: 0 cut · 1 stack · 2 book · 3 specimens · 4 build · 5 mark. */
  glow: 0,
};

/** Rows (ch04) → which layer stands at that row's station. */
export const ROW_LAYER = [3, 0, 2, 1];

/** Vertical offsets of the four layers in the stack (stone units, tips → crown). */
export const STACK_Y = [-0.66, -0.22, 0.2, 0.62];
/** The same four layers hanging above their seats at HOME_B before they build. */
const COLUMN_Y = [0.3, 0.64, 1.0, 1.42];

/** ch05 — METHOD. The gather, then one seat per step, long enough to watch. */
export const METHOD = { t0: 10.75, step: 0.45, seatLen: 0.3 };
/** Top of ch06 (the finale keys hang off it). */
export const M0 = chapter("mark").S0;

const HOME_B_Z = HOME_B[2];
const CORRIDOR = { S0: 7.2, S1: 10.6, walkIn: 8.2, walkOut: 10.1, z0: 4.0, z1: -41, y0: 1.3, y1: 0.4 };
const STATIONS_Z = [-14, -22, -30, -38];
/** Specimens float at eye level just right of the walk, where the camera's aim puts them at the right third. */
const STATIONS_X = [1.1, 1.35, 1.1, 1.35];
/** How far ahead of the camera a specimen floats while its row is read. */
const SPECIMEN_AHEAD = 7.4;
/** Where the layers wait, travelling with the walk above the frame. */
const WAIT_AHEAD = 18;
const WAIT_Y = 8.5;
const WAIT_X = [-2.2, 3.4, -1.0, 4.2];
const STATION_Y = 0.15;
/** Stack rises clear of the floor (world y) while it is formed. */
const STACK_LIFT = 0.62;

function heightOf(k: { dist: number; fov: number }) {
  return 2 * k.dist * Math.tan((k.fov * DEG) / 2);
}

export const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/**
 * Camera keys. They are NOT eased one by one: the camera runs on one
 * continuous Hermite spline through them, so it never stops at a key while
 * you scroll — velocity carries through every beat (the "single shot" feel).
 * 7.2 → 10.6 is the corridor, a position-driven path between two spline runs.
 */
function keys(L: Layout): Key[] {
  const mob = L.mode === "mobile";
  const heroD = L.hero.dist;
  const heroPP = L.hero.pp;
  // Mobile: the 3D lives in a top band (pp y 0.30), framed 0.55× as tall.
  const pp = (x: number, y: number): [number, number] => (mob ? [0.5, 0.3] : [x, y]);
  const D = (d: number) => (mob ? d / 0.55 : d);
  const B = HOME_B_Z;
  return [
    { S: 0, pivot: [0, STONE.centerY, 0], az: 0, el: 4, dist: heroD, fov: 30, pp: heroPP },
    // LOOK UP — the camera cranes below the girdle and looks up at the monument.
    { S: 0.5, pivot: [0, -0.3, 0], az: -40, el: -9, dist: heroD * 0.8, fov: 36, pp: mob ? [0.5, 0.36] : [0.6, 0.5] },
    // THE PASS — close, wide lens, the stone filling the frame.
    { S: 1.0, pivot: [0, 0.02, 0], az: -108, el: 3, dist: heroD * 0.5, fov: 44, pp: [0.5, 0.5] },
    { S: 1.7, pivot: [mob ? 0 : 1.8, STONE.centerY, 0], az: -12, el: 8, dist: D(8.0), fov: 30, pp: pp(0.62, 0.5) },
    // THE CUT — it opens along the mark; the camera leans in and round.
    { S: 2.45, pivot: [mob ? 0 : 1.25, -0.15, 0], az: 24, el: 10, dist: D(7.4), fov: 30, pp: pp(0.64, 0.5) },
    // THE STACK — rise to the top layer, then crane down the four as they are read.
    { S: 3.35, pivot: [0, 0.7, 0], az: 40, el: 26, dist: D(10.4), fov: 30, pp: pp(0.66, 0.47) },
    { S: 4.35, pivot: [0, -0.42, 0], az: 68, el: 17, dist: D(10.4), fov: 30, pp: pp(0.66, 0.53) },
    { S: 4.72, pivot: [0, 0.1, 0], az: 80, el: 15, dist: D(11.8), fov: 30, pp: pp(0.66, 0.5) },
    // THE BOOK — swing round to face the opening pages, framed on the left.
    // Eye level: the thin plates (band, the sections' tops) read edge-on, as lines of light.
    { S: 5.65, pivot: [0, -0.15, 0], az: 16, el: 3, dist: D(10.6), fov: 30, pp: pp(0.34, 0.5) },
    { S: 6.4, pivot: [0, -0.12, 0], az: 4, el: 1.5, dist: D(9.9), fov: 30, pp: pp(0.34, 0.5) },
    { S: 7.2, pivot: [0, 0, 0], az: 0, el: 5, dist: D(10.7), fov: 30, pp: pp(0.31, 0.5) },
    // THE BUILD — the column hangs at HOME_B; the camera circles as it builds.
    { S: 10.6, pivot: [0, 0.22, B], az: 10, el: 9, dist: D(11.2), fov: 30, pp: pp(0.66, 0.5) },
    { S: 11.6, pivot: [0, 0.18, B], az: 40, el: 11, dist: D(10.6), fov: 30, pp: pp(0.66, 0.5) },
    { S: 12.3, pivot: [0, 0.02, B], az: 62, el: 12, dist: D(9.8), fov: 30, pp: pp(0.66, 0.51) },
    { S: M0 - 1.0, pivot: [0, STONE.centerY, B], az: 90, el: 15, dist: D(7.3), fov: 30, pp: pp(0.66, 0.52) },
    { S: M0, pivot: [0, STONE.centerY, B], az: 90, el: 20, dist: D(L.fit(0.62, 30)), fov: 30, pp: pp(0.66, 0.5) },
    { S: M0 + 0.2, pivot: [0, STONE.centerY, B], az: 90, el: 26, dist: D(L.fit(0.62, 24)), fov: 24, pp: pp(0.66, 0.5) },
    { S: M0 + 0.36, pivot: [0, STONE.centerY, B], az: 90, el: 26, dist: D(L.fit(0.62, 24)), fov: 24, pp: pp(0.66, 0.5) },
    { S: M0 + 0.55, pivot: [0, -0.741, B], az: 90, el: 32.91, dist: D(12.79), fov: 16, pp: pp(0.66, 0.46) },
    { S: M0 + 0.9, pivot: [0, -0.741, B], az: 90, el: 32.91, dist: D(12.79), fov: 16, pp: pp(0.66, 0.46) },
    { S: M0 + 1.2, pivot: [0, -0.741, B], az: 90, el: 32.91, dist: D(17.9), fov: 16, pp: mob ? [0.5, 0.36] : [0.71, 0.395] },
  ];
}

/* ------------------------------------------------------------------------ */
/* Hermite spline over the key channels                                      */
/* ------------------------------------------------------------------------ */

/** Channels: pivot xyz, az, el, log visible height, fov, pp x/y. */
const NCH = 9;
type Spline = { S: number[]; v: number[][]; m: number[][] };

function toChannels(k: Key): number[] {
  return [k.pivot[0], k.pivot[1], k.pivot[2], k.az, k.el, Math.log(heightOf(k)), k.fov, k.pp[0], k.pp[1]];
}

/**
 * Tangents by finite differences over NON-uniform key spacing, so the path is
 * C1 through every key. A key equal to a neighbour on a channel is a HOLD —
 * zero tangent there, so the finale's pauses never overshoot.
 */
function buildSpline(K: Key[]): Spline {
  const S = K.map((k) => k.S);
  const v = K.map(toChannels);
  const m = v.map((row, j) =>
    row.map((x, c) => {
      const prev = j > 0 ? v[j - 1][c] : x;
      const next = j < v.length - 1 ? v[j + 1][c] : x;
      if (Math.abs(x - prev) < 1e-6 || Math.abs(x - next) < 1e-6) return 0;
      const s0 = j > 0 ? S[j - 1] : S[j];
      const s1 = j < S.length - 1 ? S[j + 1] : S[j];
      return (next - prev) / Math.max(1e-4, s1 - s0);
    })
  );
  return { S, v, m };
}

const _row = new Array<number>(NCH).fill(0);

function sampleSpline(sp: Spline, S: number, out: number[]): number[] {
  const n = sp.S.length;
  if (S <= sp.S[0]) {
    for (let c = 0; c < NCH; c++) out[c] = sp.v[0][c];
    return out;
  }
  if (S >= sp.S[n - 1]) {
    for (let c = 0; c < NCH; c++) out[c] = sp.v[n - 1][c];
    return out;
  }
  let i = 0;
  while (i < n - 2 && S >= sp.S[i + 1]) i++;
  const d = sp.S[i + 1] - sp.S[i];
  const t = (S - sp.S[i]) / d;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  for (let c = 0; c < NCH; c++) {
    out[c] = h00 * sp.v[i][c] + h10 * d * sp.m[i][c] + h01 * sp.v[i + 1][c] + h11 * d * sp.m[i + 1][c];
  }
  return out;
}

let cachedFor = "";
let splineA: Spline | null = null; // 0 → 7.2
let splineB: Spline | null = null; // 10.6 → end
let keyAt72: Key | null = null;
let keyAt106: Key | null = null;

function splinesFor(L: Layout) {
  const id = `${L.vw}x${L.vh}:${L.mode}:${L.hero.dist.toFixed(3)}`;
  if (id !== cachedFor || !splineA || !splineB || !keyAt72 || !keyAt106) {
    cachedFor = id;
    const K = keys(L);
    splineA = buildSpline(K.filter((k) => k.S <= CORRIDOR.S0));
    splineB = buildSpline(K.filter((k) => k.S >= CORRIDOR.S1));
    keyAt72 = K.find((k) => k.S === CORRIDOR.S0)!;
    keyAt106 = K.find((k) => k.S === CORRIDOR.S1)!;
  }
  return { A: splineA, B: splineB, k72: keyAt72, k106: keyAt106 };
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _in = new THREE.Vector3();
const _out = new THREE.Vector3();

function orbitPos(pivot: THREE.Vector3, az: number, el: number, dist: number, out: THREE.Vector3) {
  return out.set(
    pivot.x + dist * Math.sin(az) * Math.cos(el),
    pivot.y + dist * Math.sin(el),
    pivot.z + dist * Math.cos(az) * Math.cos(el)
  );
}

function writeOrbitRow(out: SceneState, r: number[]) {
  const c = out.cam;
  c.path = false;
  c.pivot.set(r[0], r[1], r[2]);
  c.az = r[3] * DEG;
  c.el = r[4] * DEG;
  c.fov = r[6];
  c.dist = Math.exp(r[5]) / (2 * Math.tan((c.fov * DEG) / 2));
  c.ppx = r[7];
  c.ppy = r[8];
  c.roll = 0;
  orbitPos(c.pivot, c.az, c.el, c.dist, c.pos);
  c.target.copy(c.pivot);
}

/** Monotone C1 interpolation through (x, y) points — no overshoot, no stops. */
function hermite1(xs: number[], ys: number[], x: number): number {
  const n = xs.length;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  let i = 0;
  while (i < n - 2 && x >= xs[i + 1]) i++;
  const slope = (j: number) => {
    if (j <= 0 || j >= n - 1) return (ys[Math.min(n - 1, j + 1)] - ys[Math.max(0, j - 1)]) / (xs[Math.min(n - 1, j + 1)] - xs[Math.max(0, j - 1)]);
    const a = (ys[j] - ys[j - 1]) / (xs[j] - xs[j - 1]);
    const b = (ys[j + 1] - ys[j]) / (xs[j + 1] - xs[j]);
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b); // harmonic mean keeps it monotone
  };
  const d = xs[i + 1] - xs[i];
  const t = (x - xs[i]) / d;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * d * slope(i) + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * d * slope(i + 1);
}

const corrS: number[] = [];
const corrZ: number[] = [];

/** Camera z along the corridor, keyed so each station stands beside its row. */
function corridorZ(S: number, zIn: number, zOut: number): number {
  corrS.length = 0;
  corrZ.length = 0;
  corrS.push(CORRIDOR.S0, CORRIDOR.walkIn);
  corrZ.push(zIn, CORRIDOR.z0);
  const rs = measured.rowS;
  if (rs.length === 4 && rs.every((v, i) => i === 0 || v > rs[i - 1])) {
    rs.forEach((r, i) => {
      corrS.push(THREE.MathUtils.clamp(r, CORRIDOR.walkIn + 0.05 * (i + 1), CORRIDOR.walkOut - 0.05 * (4 - i)));
      corrZ.push(STATIONS_Z[i] + 7);
    });
  } else {
    STATIONS_Z.forEach((z, i) => {
      corrS.push(lerp(CORRIDOR.walkIn, CORRIDOR.walkOut, (i + 1) / 5));
      corrZ.push(z + 7);
    });
  }
  corrS.push(CORRIDOR.walkOut, CORRIDOR.S1);
  corrZ.push(CORRIDOR.z1, zOut);
  return hermite1(corrS, corrZ, S);
}

/**
 * The corridor as ONE continuous move: from the armillary framing, walk into
 * the field, pass the four station stones, arrive at the reforming stone —
 * position and aim blend smoothly into the orbit framings at both ends.
 */
function evalCorridor(S: number, L: Layout, out: SceneState, k72: Key, k106: Key) {
  const c = out.cam;
  orbitPos(_a.set(...k72.pivot), k72.az * DEG, k72.el * DEG, k72.dist, _in);
  orbitPos(_b.set(...k106.pivot), k106.az * DEG, k106.el * DEG, k106.dist, _out);

  const z = corridorZ(S, _in.z, _out.z);
  const k = clamp01((z - CORRIDOR.z0) / (CORRIDOR.z1 - CORRIDOR.z0));
  const wIn = smoother(range(S, CORRIDOR.S0, CORRIDOR.walkIn));
  const wOut = smoother(range(S, CORRIDOR.walkOut, CORRIDOR.S1));

  const walkX = 0.25 * Math.sin(0.18 * z);
  const walkY = lerp(CORRIDOR.y0, CORRIDOR.y1, k);
  const x = lerp(lerp(_in.x, walkX, wIn), _out.x, wOut);
  const y = lerp(lerp(_in.y, walkY, wIn), _out.y, wOut);
  c.pos.set(x, y, z);

  // Aim: the armillary's pivot → down the aisle → the reforming stone.
  _a.set(...k72.pivot);
  _b.set(x + 0.8, y - 0.3, z - 10);
  c.target.lerpVectors(_a, _b, wIn);
  _b.set(...k106.pivot);
  c.target.lerp(_b, wOut);

  const walkPP: [number, number] = L.mode === "mobile" ? [0.5, 0.34] : [0.7, 0.48];
  c.fov = lerp(lerp(k72.fov, 34, wIn), k106.fov, wOut);
  c.ppx = lerp(lerp(k72.pp[0], walkPP[0], wIn), k106.pp[0], wOut);
  c.ppy = lerp(lerp(k72.pp[1], walkPP[1], wIn), k106.pp[1], wOut);
  c.path = true;
  c.roll = 0;
  c.pivot.copy(c.target);
  c.dist = c.pos.distanceTo(c.target);
}

function evalCamera(S: number, L: Layout, out: SceneState) {
  const sp = splinesFor(L);
  if (S > CORRIDOR.S0 && S < CORRIDOR.S1) {
    evalCorridor(S, L, out, sp.k72, sp.k106);
    return;
  }
  writeOrbitRow(out, sampleSpline(S <= CORRIDOR.S0 ? sp.A : sp.B, S, _row));
}


/** The corridor camera's z at scroll position s (for specimens that travel with it). */
function camZAt(s: number, L: Layout): number {
  const sp = splinesFor(L);
  orbitPos(_a.set(...sp.k72.pivot), sp.k72.az * DEG, sp.k72.el * DEG, sp.k72.dist, _in);
  orbitPos(_b.set(...sp.k106.pivot), sp.k106.az * DEG, sp.k106.el * DEG, sp.k106.dist, _out);
  return corridorZ(s, _in.z, _out.z);
}

/** A work row's S (ch04): measured once the list is laid out, else evenly spaced. */
function rowS(i: number): number {
  const rs = measured.rowS;
  if (rs.length === 4 && rs.every((v, k) => k === 0 || v > rs[k - 1])) return rs[i];
  return lerp(CORRIDOR.walkIn, CORRIDOR.walkOut, (i + 1) / 5);
}

/** When the pieces leave the stone for their stations, and when they leave the stations to gather. */
const DEPART = 7.58;
const DEPART_LEN = 0.62;
const GATHER_LEN = 0.55;
/** From here on the stone itself is at HOME_B: every layer has left its station for the column. */
function homeSwitch(): number {
  return rowS(3) + 0.1 + GATHER_LEN + 0.02;
}

/**
 * Fill every scroll-driven field of sceneState + the rig + the film facts.
 * Pure in (S, L) except for reading ui.focusTier / measured.rowS.
 */
export function evaluate(S: number, _time: number, L: Layout, out: SceneState): void {
  evalCamera(S, L, out);
  const u = out.u;
  const r = rig;
  const c = out.cam;
  const mob = L.mode === "mobile";

  /* ---- the anatomy's gestures ---------------------------------------- */
  film.lift = 0.32 * Math.sin(Math.PI * easeInOutSine(range(S, 0.1, 1.8)));
  const open = smoother(range(S, 1.9, 2.5)) * (1 - smoother(range(S, 2.62, 3.3)));
  film.stack = smoother(range(S, 2.62, 3.35)) * (1 - smoother(range(S, 4.72, 5.3)));
  film.book = smoother(range(S, 5.25, 5.95)) * (1 - smoother(range(S, 7.1, 7.62)));
  film.beat = smoother(range(S, 6.4, 6.72));
  r.open = open;
  film.open = open;

  // Seats (ch05), in build order: the tips first, the crown last.
  for (let k = 0; k < 4; k++) {
    const a = METHOD.t0 + METHOD.step * k;
    film.seat[k] = smoother(range(S, a, a + METHOD.seatLen));
  }
  const HOME_SWITCH = homeSwitch();

  /* ---- place + turn ---------------------------------------------------- */
  const yawB = lerp(45, 90, easeInOutSine(range(S, 10.6, M0 - 1.0)));
  film.yawB = yawB * DEG;
  r.homeB.set(HOME_B[0], HOME_B[1], HOME_B[2]);
  let yaw: number;
  if (S < HOME_SWITCH) {
    // One continuous story of turns: the half-turn of the pass, a little more
    // as the cut opens, a slow turn while the stack is read, then round to
    // face the camera as the book opens.
    yaw = 20 + 180 * smoother(range(S, 0.05, 1.75)) + 25 * smoother(range(S, 1.9, 2.6)) + 55 * smoother(range(S, 2.62, 4.7));
    const toBook = smoother(range(S, 4.72, 5.6));
    if (toBook > 0) yaw = lerp(yaw, 360 + c.az / DEG - 12, toBook);
    r.home.set(0, film.lift + STACK_LIFT * film.stack, 0);
  } else {
    yaw = yawB;
    r.home.copy(r.homeB);
  }
  film.yaw = yaw * DEG;

  // Which layers are posed from the build site: those that have left their station.
  film.column = 0;
  for (let row = 0; row < 4; row++) {
    const Lr = ROW_LAYER[row];
    r.atB[Lr] = S >= HOME_SWITCH || S >= rowS(row) + 0.1 ? 1 : 0;
    film.column = Math.max(film.column, r.atB[Lr] * (1 - film.seat[Lr]));
  }

  for (let k = 0; k < 4; k++) {
    r.layerY[k] = r.atB[k] ? COLUMN_Y[k] * (1 - film.seat[k]) : STACK_Y[k] * film.stack;
    r.layerOut[k] = 0; // the Director springs the focused layer out
  }

  // The book: product (left page) opens widest first, then workspace (right).
  const bookDeg = (a: number, b: number) => lerp(a, b, film.beat) * DEG * film.book;
  r.bookL = bookDeg(80, 52);
  r.bookR = bookDeg(52, 80);
  r.bookLift = 0.5 * film.book;

  // Stations (ch04). The four layers lift off the stone together and wait high
  // above and ahead of the walk, out of frame, travelling with it. As its row
  // comes up, a layer swoops down to eye level at the right third and floats
  // WITH the camera while the row is read — one specimen in frame at a time —
  // then it flies on ahead to the column where the stone will be built.
  for (let row = 0; row < 4; row++) {
    const Lr = ROW_LAYER[row];
    const rs = rowS(row);
    const dep = DEPART + 0.08 * row;
    const back = rs + 0.1;
    const w = smoother(range(S, dep, dep + DEPART_LEN)) * (1 - smoother(range(S, back, back + GATHER_LEN)));
    film.station[Lr] = w;
    r.station[Lr] = w;
    const a = smoother(range(S, rs - 0.62, rs - 0.2));
    const z = w > 0 ? camZAt(S, L) - lerp(WAIT_AHEAD, SPECIMEN_AHEAD, a) : STATIONS_Z[row];
    // Phones: the specimen floats centred in the top band, above the row's text.
    const sx = mob ? 0.2 + 0.1 * (row % 2) : STATIONS_X[row];
    const sy = mob ? 1.45 : STATION_Y;
    r.stationPos[Lr].set(lerp(WAIT_X[row], sx, a), lerp(WAIT_Y, sy, a), z);
    if (S < back) r.stationArc[Lr].set(0.9 * (row % 2 ? 1 : -1), 1.2, 0);
    else r.stationArc[Lr].set(0.4, 1.1, 0);
  }
  // Specimens read at one size: the slender tips are shown largest, the crown smallest.
  const ms = mob ? 0.5 : 1;
  r.stationScale[0] = 1.95 * ms;
  r.stationScale[1] = 1.5 * ms;
  r.stationScale[2] = 1.28 * ms;
  r.stationScale[3] = 1.22 * ms;

  // The finale's mark.
  const s6 = S - M0;
  r.crownLift = S >= M0 ? easeInOutSine(range(s6, 0.22, 0.36)) : 0;
  r.bandLift = S >= M0 ? easeInOutSine(range(s6, 0.5, 0.62)) : 0;
  r.split = r.bandLift;
  film.crownFade = S >= M0 ? easeInOutSine(range(s6, 0.22, 0.36)) : 0;

  const loose = Math.max(open, film.stack, film.book, film.column, film.station[0], film.station[1], film.station[2], film.station[3]);
  film.whole = loose < 1e-4 ? 1 : 0;

  // Toward the camera, flat — the direction a focused layer slides out.
  r.outDir.set(c.pos.x - r.home.x, 0, c.pos.z - r.home.z);
  if (r.outDir.lengthSq() < 1e-6) r.outDir.set(0, 0, 1);
  r.outDir.normalize();

  /* ---- which light recipe ---------------------------------------------- */
  film.glow = S < 2.62 ? 0 : S < 5.0 ? 1 : S < 7.4 ? 2 : S < HOME_SWITCH ? 3 : S < M0 ? 4 : 5;
  let focus = -1;
  if (S >= 3.4 && S < 4.35) focus = 3 - Math.min(3, Math.floor((S - 3.4) / 0.2375));
  if (ui.focusTier >= 0 && film.stack > 0.5) focus = ui.focusTier;
  film.focus = focus;
  film.allLit = range(S, 4.35, 4.45) * (1 - range(S, 4.75, 4.9));
  out.tiers.visible = film.stack > 0.5;
  out.tiers.focus = focus;

  /* ---- material uniforms --------------------------------------------- */
  // The mark's seams light just before the cut opens; the level seams before the stack parts.
  let seam = range(S, 1.7, 1.82) * (1 - range(S, 2.5, 2.9));
  if (S >= M0) seam = 0.6 * range(s6, 0.5, 0.62);
  u.seam = seam;
  u.levelSeam = range(S, 2.42, 2.6) * (1 - range(S, 3.0, 3.35));

  // How much light the cut faces show (per-piece levels come from the Director).
  let glow = smoother(range(S, 1.78, 2.3));
  if (S >= 10.6) glow = lerp(1, 0.5, range(S, METHOD.t0 + 3 * METHOD.step, M0 - 0.9));
  if (S >= M0) glow = 0.35 * range(s6, 0.5, 0.62);
  u.cutGlow = glow;

  // The light inside, seen through the black outer faces: a breath in the
  // hero, stronger at the pass, and at dusk the stone becomes the light.
  // Night spreads out of the stone (a widening circle, see #field) and draws back into it.
  u.dusk = smoother(range(S, 5.12, 5.66)) * (1 - smoother(range(S, 7.22, 7.72)));
  u.inner = 0.32 + 0.3 * Math.sin(Math.PI * range(S, 0.45, 1.6)) + 0.75 * u.dusk;

  u.spill = Math.max(0.8 * open, 0.55 * film.book, S >= M0 ? 0.4 * range(s6, 0.5, 0.62) : 0);
  // The level cuts light from within as the stack parts, and while the column builds.
  u.floors = 1.2 * smoother(range(S, 2.45, 2.9)) * (1 - smoother(range(S, 4.8, 5.3))) + 0.9 * film.column;

  // Alpha fog: none until the long mirror, then its haze, clear again for the build.
  if (S < 7.2) {
    u.fogNear = 60;
    u.fogFar = 90;
  } else if (S < 10.6) {
    // Distant specimens melt into the haze; near ones stay crisp black glass.
    const t = easeInOutSine(range(S, 7.2, 8.2));
    u.fogNear = lerp(60, 16, t);
    u.fogFar = lerp(90, 42, t);
  } else {
    const t = range(S, 10.6, 11.2);
    u.fogNear = lerp(16, 60, t);
    u.fogFar = lerp(42, 90, t);
  }

  u.vein = 1 + 0.9 * Math.sin(Math.PI * range(S, 0.45, 1.6));
  u.reflect = 1 - 0.6 * film.stack;
  u.floorY = STONE.floorY;
  u.mistAlpha = 1 - range(S, 0.5, 1.1);
  u.mistClipY = L.hero.mistClipY;
  // At night the light that follows the cursor is INSIDE the glass; the area light bows out.
  u.cursorLight = (8 - 4 * film.stack) * (1 - u.dusk);

  /* ---- the bookend clip + mark lock ---------------------------------- */
  const k = easeInOutCubic(range(s6, 0.9, 1.2));
  const cl = out.clip;
  cl.active = k > 0.001;
  cl.t = 9 * k;
  cl.r = 4 * k;
  cl.b = 30 * k;
  cl.l = 46 * k;
  cl.rad = 28 * k;
  cl.tint = k;
  cl.frame = k;
  out.mark.lock = range(s6, 0.5, 0.62);
}
