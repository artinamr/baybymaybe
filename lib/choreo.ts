import * as THREE from "three";
import type { Layout } from "./layout";
import type { Formation, SceneState } from "./sceneState";
import { measured, ui } from "./stores";
import { DEG, clamp01, easeInOutCubic, easeInOutSine, lerp, range } from "./ease";
import { STONE } from "./geo/types";

/**
 * THE FILM — every scroll-driven value of the 3D, as a pure function of S
 * (docs/SPEC.md §5–6). Time-based events (threads, pulses, flashes, idle
 * motion, the intro) live in the Director; this file only answers "where is
 * everything at scroll position S".
 *
 * Camera keys are interpolated in a framing-preserving space: visible height
 * at the pivot (log), fov (linear), azimuth/elevation (linear, direction as
 * written), principal point (linear). Distance is derived — so every dolly-zoom
 * (the finale's flattening onto the mark) holds its framing by construction.
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

/** Per-fragment blend plan the Director executes. */
export const plan = {
  a: "F0" as Formation,
  b: "F0" as Formation,
  /** Window-local progress 0..1 (the Director staggers it per fragment). */
  mix: 0,
  /** 0 none · 1 from the crack origin · 2 by tier · 3 top-down · 4 random · 5 by method group */
  stagger: 0,
  /** Bézier arc strength. */
  arc: 0.35,
  gap: 0,
  /** The stone rising off its reflection during the hero → ch01 pass (world y). */
  lift: 0,
  crownLift: 0,
  bandLift: 0,
  split: 0,
  /** Stone rotation for stone-relative forms (radians). */
  yaw: 20 * DEG,
  pitch: 0,
  /** Glow mode for per-fragment cut glow: 0 uniform · 1 tier focus · 2 seating heal · 3 mark · 4 armillary beat */
  glowMode: 0,
  /**
   * Transitions SPIRAL: while pieces travel between two formations they are
   * swept round the vertical axis through a centre by swirl·sin(π·progress) —
   * the change reads as a vortex, not a slide. 0 = straight.
   */
  swirl: 0,
  /** Swirl centre: 0 = HOME_A, 1 = HOME_B. */
  swirlAt: 0,
  /** F5 window start (seating) and per-group length, in S. */
  seatS0: 10.6,
  seatLen: 0.225,
  /** ch05 seating progress per group (0..1) for flashes/heal. */
  seat: [0, 0, 0, 0],
};

const HOME_B_Z = -52;
const CORRIDOR = { S0: 7.2, S1: 10.6, walkIn: 8.2, walkOut: 10.1, z0: 4.0, z1: -41, y0: 1.3, y1: 0.4 };
const STATIONS_Z = [-14, -22, -30, -38];

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
  return [
    { S: 0, pivot: [0, STONE.centerY, 0], az: 0, el: 4, dist: heroD, fov: 30, pp: heroPP },
    // LOOK UP — the camera cranes below the girdle and looks up at the monument.
    { S: 0.5, pivot: [0, -0.3, 0], az: -40, el: -9, dist: heroD * 0.8, fov: 36, pp: mob ? [0.5, 0.36] : [0.6, 0.5] },
    // THE PASS — close, wide lens, the stone filling the frame.
    { S: 1.0, pivot: [0, 0.02, 0], az: -108, el: 3, dist: heroD * 0.5, fov: 44, pp: [0.5, 0.5] },
    { S: 1.7, pivot: [mob ? 0 : 1.8, STONE.centerY, 0], az: -12, el: 8, dist: D(8.0), fov: 30, pp: pp(0.62, 0.5) },
    // INTO THE BURST — the fragments fly past the lens.
    { S: 2.45, pivot: [0, -0.3, 0], az: 12, el: 4, dist: D(2.7), fov: 46, pp: [0.5, 0.5] },
    // THE CORE — a slow orbit round the turning tower of rings.
    { S: 3.4, pivot: [0, -0.05, 0], az: 30, el: 12, dist: D(10.2), fov: 30, pp: pp(0.66, 0.5) },
    { S: 4.6, pivot: [0, -0.05, 0], az: 78, el: 20, dist: D(10.6), fov: 30, pp: pp(0.66, 0.5) },
    // THE ARMILLARY — frame it on the left early, before the copy arrives on the right…
    { S: 5.3, pivot: [0, 0, 0], az: 12, el: 13, dist: D(11.2), fov: 30, pp: pp(0.34, 0.5) },
    // …then swing round it.
    { S: 5.9, pivot: [0, 0, 0], az: -35, el: 9, dist: D(10.2), fov: 30, pp: pp(0.33, 0.5) },
    { S: 7.2, pivot: [0, 0, 0], az: 0, el: 7, dist: D(10.7), fov: 30, pp: pp(0.31, 0.5) },
    { S: 10.6, pivot: [0, STONE.centerY, HOME_B_Z], az: 10, el: 9, dist: D(7.7), fov: 30, pp: pp(0.66, 0.52) },
    { S: 11.6, pivot: [0, STONE.centerY, HOME_B_Z], az: 90, el: 15, dist: D(7.3), fov: 30, pp: pp(0.66, 0.52) },
    { S: 12.6, pivot: [0, STONE.centerY, HOME_B_Z], az: 90, el: 20, dist: D(L.fit(0.62, 30)), fov: 30, pp: pp(0.66, 0.5) },
    { S: 12.8, pivot: [0, STONE.centerY, HOME_B_Z], az: 90, el: 26, dist: D(L.fit(0.62, 24)), fov: 24, pp: pp(0.66, 0.5) },
    { S: 12.96, pivot: [0, STONE.centerY, HOME_B_Z], az: 90, el: 26, dist: D(L.fit(0.62, 24)), fov: 24, pp: pp(0.66, 0.5) },
    { S: 13.15, pivot: [0, -0.741, HOME_B_Z], az: 90, el: 32.91, dist: D(12.79), fov: 16, pp: pp(0.66, 0.46) },
    { S: 13.5, pivot: [0, -0.741, HOME_B_Z], az: 90, el: 32.91, dist: D(12.79), fov: 16, pp: pp(0.66, 0.46) },
    { S: 13.8, pivot: [0, -0.741, HOME_B_Z], az: 90, el: 32.91, dist: D(17.9), fov: 16, pp: mob ? [0.5, 0.36] : [0.71, 0.395] },
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

/**
 * Fill every scroll-driven field of sceneState (+ the fragment blend plan).
 * Pure in (S, L) except for reading ui.focusTier / measured.rowS.
 */
export function evaluate(S: number, _time: number, L: Layout, out: SceneState): void {
  evalCamera(S, L, out);
  const u = out.u;

  /* ---- stone placement ---------------------------------------------- */
  // Rises 0.32 off its reflection through the pass and settles back before it breaks.
  plan.lift = 0.32 * Math.sin(Math.PI * easeInOutSine(range(S, 0.1, 1.8)));
  out.stone.home.set(0, S < 7.7 ? plan.lift : 0, S < 7.7 ? 0 : HOME_B_Z);
  out.stone.visible = true;
  // One continuous half-turn across the whole hero → ch01 pass (never pausing).
  let yaw = 20 + 180 * smoother(range(S, 0.05, 1.75));
  if (S >= 7.7) yaw = lerp(45, 90, easeInOutSine(range(S, 10.6, 11.6)));
  plan.yaw = yaw * DEG;
  plan.pitch = 0;

  /* ---- formations ---------------------------------------------------- */
  plan.gap = 0;
  plan.crownLift = 0;
  plan.bandLift = 0;
  plan.split = 0;
  plan.arc = 0.35;
  plan.glowMode = 0;
  plan.swirl = 0;
  plan.swirlAt = 0;
  plan.stagger = 0;
  plan.mix = 0;
  const set = (a: Formation, b: Formation, mix: number, stagger: number) => {
    plan.a = a;
    plan.b = b;
    plan.mix = mix;
    plan.stagger = stagger;
  };
  if (S < 2.0) {
    set("F0", "F0", 0, 0);
    plan.gap = 0.004 * easeInOutSine(range(S, 1.82, 2.0));
  } else if (S < 3.0) {
    plan.gap = 0.004;
    set("F0", "F1", range(S, 2.0, 3.0), 1);
    plan.arc = 0.5;
  } else if (S < 3.4) {
    set("F1", "F2", range(S, 3.0, 3.4), 2);
    plan.swirl = 1.3;
    plan.arc = 0.25;
  } else if (S < 4.6) {
    set("F2", "F2", 0, 0);
    plan.glowMode = 1;
  } else if (S < 5.6) {
    set("F2", "F3", range(S, 4.6, 5.6), 3);
    plan.swirl = -1.8;
    plan.arc = 0.3;
  } else if (S < 7.2) {
    set("F3", "F3", 0, 0);
    plan.glowMode = 4;
  } else if (S < 8.2) {
    set("F3", "F4", range(S, 7.2, 8.2), 4);
    plan.arc = 0.15;
  } else if (S < 10.6) {
    set("F4", "F4", 0, 0);
  } else if (S < 11.5) {
    set("F4", "F5", range(S, 10.6, 11.5), 5);
    plan.swirl = 1.1;
    plan.swirlAt = 1;
    plan.arc = 0.4;
    plan.glowMode = 2;
  } else if (S < 12.6) {
    set("F5", "F5", 0, 0);
    plan.glowMode = 2;
  } else {
    const s = S - 12.6;
    set("F6", "F6", 0, 0);
    plan.crownLift = easeInOutSine(range(s, 0.22, 0.36));
    plan.bandLift = easeInOutSine(range(s, 0.5, 0.62));
    plan.split = plan.bandLift;
    plan.glowMode = 3;
  }
  for (let g = 0; g < 4; g++) plan.seat[g] = range(S, plan.seatS0 + g * plan.seatLen, plan.seatS0 + (g + 1) * plan.seatLen);
  out.formation.a = plan.a;
  out.formation.b = plan.b;
  out.formation.mix = plan.mix;

  /* ---- material uniforms --------------------------------------------- */
  // Seams: the mark's three cuts light just before the stone opens.
  let seam = range(S, 1.7, 1.82);
  seam = lerp(seam, 0.3, range(S, 2.0, 3.0));
  seam *= 1 - range(S, 3.0, 3.4);
  if (S >= 12.6) seam = 0.6 * range(S - 12.6, 0.5, 0.62);
  u.seam = seam;

  let glow = 0;
  if (S < 2.0) glow = 0.4 * range(S, 1.82, 2.0);
  else if (S < 3.0) glow = lerp(0.4, 0.6, range(S, 2.0, 3.0));
  else if (S < 4.6) glow = lerp(0.6, 1.0, range(S, 3.0, 3.4));
  else if (S < 7.2) glow = lerp(1.0, 0.6, range(S, 4.6, 5.6));
  else if (S < 10.6) glow = lerp(0.6, 0.35, range(S, 7.2, 8.2));
  else if (S < 12.6) glow = lerp(0.35, 0, range(S, 11.5, 12.4));
  else glow = 0.35 * range(S - 12.6, 0.5, 0.62);
  u.cutGlow = glow;

  u.spill = S < 3 ? Math.sin(Math.PI * range(S, 1.82, 2.7)) * range(S, 1.82, 1.9) : S >= 12.6 ? 0.4 * range(S - 12.6, 0.5, 0.62) : 0;

  // Alpha fog: none until the stream, then the field's mist, clear again for the mark.
  if (S < 7.2) {
    u.fogNear = 60;
    u.fogFar = 90;
  } else if (S < 10.6) {
    const t = easeInOutSine(range(S, 7.2, 8.2));
    u.fogNear = lerp(60, 6, t);
    u.fogFar = lerp(90, 26, t);
  } else if (S < 12.6) {
    const t = range(S, 10.6, 11.0);
    u.fogNear = lerp(6, 10, t);
    u.fogFar = lerp(26, 34, t);
    const c = range(S, 12.0, 12.6);
    u.fogNear = lerp(u.fogNear, 60, c);
    u.fogFar = lerp(u.fogFar, 90, c);
  } else {
    u.fogNear = 60;
    u.fogFar = 90;
  }

  // The veins wake as the camera passes close, then settle.
  u.vein = 1 + 0.9 * Math.sin(Math.PI * range(S, 0.45, 1.6));
  u.reflect = S > 3 && S < 7.2 ? 0.5 : 1;
  u.floorY = STONE.floorY;
  u.mistAlpha = 1 - range(S, 0.5, 1.1);
  u.mistClipY = L.hero.mistClipY;
  u.cursorLight = S > 3 && S < 7.2 ? 4 : 8;

  /* ---- chapter worlds ------------------------------------------------ */
  out.tiers.visible = S > 3.0 && S < 4.7;
  let focus = -1;
  if (S >= 3.4 && S < 4.35) focus = Math.min(3, Math.floor((S - 3.4) / 0.2375));
  if (ui.focusTier >= 0 && out.tiers.visible) focus = ui.focusTier;
  out.tiers.focus = focus;

  out.graph.visible = S > 5.45 && S < 7.45;
  out.graph.grow = range(S, 5.6, 5.9);
  out.graph.beat = S < 5.9 ? 0 : S < 6.55 ? 1 : S < 7.2 ? 2 : 0;
  out.graph.fade = range(S, 5.45, 5.6) * (1 - range(S, 7.2, 7.4));

  out.field.visible = S > 7.2 && S < 11.2;
  out.field.fade = range(S, 7.2, 7.8) * (1 - range(S, 10.8, 11.2));

  out.flakes.visible = S > 1.95 && S < 11.5;
  out.flakes.amount = range(S, 1.95, 2.4) * (1 - range(S, 10.9, 11.5));

  // Light streams: rise with the tower, morph from its rings into the two
  // orbits with the fragments (4.6–5.6), and stream away with them at 7.2.
  out.streams.fade = smoother(range(S, 3.05, 3.55)) * (1 - smoother(range(S, 7.15, 7.75)));
  out.streams.morph = smoother(range(S, 4.65, 5.65));

  /* ---- the bookend clip + mark lock ---------------------------------- */
  const s6 = S - 12.6;
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
