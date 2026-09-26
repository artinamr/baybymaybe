import * as THREE from "three";
import type { Layout } from "./layout";
import type { Formation, SceneState } from "./sceneState";
import { measured, ui } from "./stores";
import { DEG, easeInOutCubic, easeInOutSine, lerp, range } from "./ease";
import { STONE } from "./geo/types";
import { chapter } from "./chapters";
import { MONUMENT_C } from "./formations";

/**
 * THE FILM — every scroll-driven value of the 3D, as a pure function of S.
 * Time-based life (orbits, the cursor, flashes, springs) lives in the
 * Director; this file only answers "where is everything at scroll position S".
 *
 * SHATTER · RESHAPE · STACK, through changing places (igloo.inc's lesson):
 *
 *   00  THE STUDIO   the stone on its mirror; the camera looks up at it, passes
 *   01               it — and it SHATTERS; the camera dives through the burst
 *        ~ a fog flood carries us out ~
 *   02  THE PLAIN    a pale plain in haze: the shards swirl in and RESHAPE into
 *                    the stone again at monument scale, laid course by course
 *                    from the culet up (the stack: foundation → interface), the
 *                    core glowing inside through the joints
 *   03               the monument BURSTS OPEN into two orbits round the core —
 *                    product, workspace; the camera flies into its light
 *        ~ a flood of light ~
 *   04  THE VOID     drifting fog; the shards regroup into four crystal
 *                    specimens that rise one by one on a vertical conveyor
 *        ~ a fog flood ~
 *   05  THE STUDIO   the shards fall back and BUILD the stone, group by group
 *   06               from one angle it is the logo
 *
 * Camera keys run on one C1 Hermite spline (never stopping at a key); the
 * places switch under the floods.
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
  /** 0 none · 1 from the crack origin · 2 by course (explicit windows) · 3 random · 4 by spec · 5 by build group */
  stagger: 0,
  /** Bézier arc strength. */
  arc: 0.35,
  gap: 0,
  lift: 0,
  crownLift: 0,
  bandLift: 0,
  split: 0,
  /** Stone rotation for stone-relative forms (radians). */
  yaw: 20 * DEG,
  /** Glow recipe: 0 plain · 1 monument · 2 halo beats · 3 specimens · 4 build · 5 mark */
  glowMode: 0,
  /** Transitions SPIRAL: swept round the vertical axis through `swirlC` by swirl·sin(π·progress). */
  swirl: 0,
  swirlC: new THREE.Vector3(),
  /** F2 assembly: per-course progress 0..1 (courses land one after another). */
  course: [0, 0, 0, 0],
  /** Course being laid (−1 none) — the ch02 row in focus. */
  laying: -1,
  /** 0..1 all courses laid (the monument lights up). */
  complete: 0,
  /** ch03 beat: 0 none · 1 product · 2 workspace. */
  beat: 0,
  /** ch04 conveyor progress. */
  conveyor: -1,
  /** ch05 seat progress per build group. */
  seat: [0, 0, 0, 0],
  /** The monument's scroll-driven turn (rad). */
  monumentYaw: 0,
};

/** ch05 — METHOD: one seat per step, long enough to watch. */
export const METHOD = { t0: 10.75, step: 0.45, seatLen: 0.3 };
/** Top of ch06 (the finale keys hang off it). */
export const M0 = chapter("mark").S0;
/** The monument's courses land in these windows (S): foundation, data, platform, interface. */
export const COURSE_S0 = 3.05;
export const COURSE_STEP = 0.33;
const COURSE_LEN = 0.42;

function heightOf(k: { dist: number; fov: number }) {
  return 2 * k.dist * Math.tan((k.fov * DEG) / 2);
}

export const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** A soft bump: 0 → 1 over [a, b], 1 → 0 over [b, c]. */
function bump(S: number, a: number, b: number, c: number): number {
  return smoother(range(S, a, b)) * (1 - smoother(range(S, b, c)));
}

function keys(L: Layout): Key[] {
  const mob = L.mode === "mobile";
  const heroD = L.hero.dist;
  const heroPP = L.hero.pp;
  // Mobile: the 3D lives in a top band (pp y 0.30), framed 0.55× as tall.
  const pp = (x: number, y: number): [number, number] => (mob ? [0.5, 0.3] : [x, y]);
  const D = (d: number) => (mob ? d / 0.55 : d);
  const MC: [number, number, number] = [MONUMENT_C.x, MONUMENT_C.y, MONUMENT_C.z];
  return [
    { S: 0, pivot: [0, STONE.centerY, 0], az: 0, el: 4, dist: heroD, fov: 30, pp: heroPP },
    // LOOK UP — the camera cranes below the girdle and looks up at the monument.
    { S: 0.5, pivot: [0, -0.3, 0], az: -40, el: -9, dist: heroD * 0.8, fov: 36, pp: mob ? [0.5, 0.36] : [0.6, 0.5] },
    // THE PASS — close, wide lens, the stone filling the frame.
    { S: 1.0, pivot: [0, 0.02, 0], az: -108, el: 3, dist: heroD * 0.5, fov: 44, pp: [0.5, 0.5] },
    { S: 1.7, pivot: [mob ? 0 : 1.8, STONE.centerY, 0], az: -12, el: 8, dist: D(8.0), fov: 30, pp: pp(0.62, 0.5) },
    // INTO THE BURST — the shards fly past the lens.
    { S: 2.45, pivot: [0, -0.3, 0], az: 12, el: 4, dist: D(2.7), fov: 46, pp: [0.5, 0.5] },
    // THE PLAIN — out of the fog: the shards gathering far off, over the plain…
    { S: 3.02, pivot: [0, 1.4, 0], az: 22, el: 6, dist: D(28), fov: 30, pp: pp(0.64, 0.5) },
    // …closer, low, as the foundation course lands…
    { S: 3.45, pivot: [0, 0.4, 0], az: 30, el: 5, dist: D(19.5), fov: 30, pp: pp(0.66, 0.5) },
    // …craning up with the courses…
    { S: 4.2, pivot: [0, 3.3, 0], az: 48, el: 10, dist: D(18.5), fov: 30, pp: pp(0.66, 0.5) },
    // …the whole monument, lit.
    { S: 4.62, pivot: MC, az: 60, el: 8, dist: D(21), fov: 30, pp: pp(0.66, 0.5) },
    // THE HALO — swing round to face it, framed on the left.
    { S: 5.6, pivot: MC, az: 18, el: 5, dist: D(16.5), fov: 30, pp: pp(0.33, 0.5) },
    { S: 6.4, pivot: MC, az: 6, el: 3, dist: D(15.5), fov: 30, pp: pp(0.33, 0.5) },
    { S: 7.1, pivot: MC, az: -4, el: 2, dist: D(15), fov: 30, pp: pp(0.34, 0.5) },
    // INTO THE CORE — the lens widens as we fly into its light.
    { S: 7.7, pivot: MC, az: -10, el: 1, dist: 1.5, fov: 52, pp: [0.5, 0.5] },
    // THE VOID — the specimens rise past on the right.
    { S: 8.05, pivot: [0, 0, 0], az: 22, el: 4, dist: D(9.6), fov: 30, pp: pp(0.66, 0.5) },
    { S: 10.0, pivot: [0, 0, 0], az: -8, el: 6, dist: D(9.6), fov: 30, pp: pp(0.66, 0.5) },
    // THE BUILD — the column hangs over the mirror; the camera circles as it builds.
    { S: 10.6, pivot: [0, 0.25, 0], az: 10, el: 9, dist: D(11.2), fov: 30, pp: pp(0.66, 0.5) },
    { S: 11.6, pivot: [0, 0.18, 0], az: 40, el: 11, dist: D(10.6), fov: 30, pp: pp(0.66, 0.5) },
    { S: 12.3, pivot: [0, 0.02, 0], az: 62, el: 12, dist: D(9.8), fov: 30, pp: pp(0.66, 0.51) },
    { S: M0 - 1.0, pivot: [0, STONE.centerY, 0], az: 90, el: 15, dist: D(7.3), fov: 30, pp: pp(0.66, 0.52) },
    { S: M0, pivot: [0, STONE.centerY, 0], az: 90, el: 20, dist: D(L.fit(0.62, 30)), fov: 30, pp: pp(0.66, 0.5) },
    { S: M0 + 0.2, pivot: [0, STONE.centerY, 0], az: 90, el: 26, dist: D(L.fit(0.62, 24)), fov: 24, pp: pp(0.66, 0.5) },
    { S: M0 + 0.36, pivot: [0, STONE.centerY, 0], az: 90, el: 26, dist: D(L.fit(0.62, 24)), fov: 24, pp: pp(0.66, 0.5) },
    { S: M0 + 0.55, pivot: [0, -0.741, 0], az: 90, el: 32.91, dist: D(12.79), fov: 16, pp: pp(0.66, 0.46) },
    { S: M0 + 0.9, pivot: [0, -0.741, 0], az: 90, el: 32.91, dist: D(12.79), fov: 16, pp: pp(0.66, 0.46) },
    { S: M0 + 1.2, pivot: [0, -0.741, 0], az: 90, el: 32.91, dist: D(17.9), fov: 16, pp: mob ? [0.5, 0.36] : [0.71, 0.395] },
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
let spline: Spline | null = null;

function splineFor(L: Layout): Spline {
  const id = `${L.vw}x${L.vh}:${L.mode}:${L.hero.dist.toFixed(3)}`;
  if (id !== cachedFor || !spline) {
    cachedFor = id;
    spline = buildSpline(keys(L));
  }
  return spline;
}

function orbitPos(pivot: THREE.Vector3, az: number, el: number, dist: number, out: THREE.Vector3) {
  return out.set(
    pivot.x + dist * Math.sin(az) * Math.cos(el),
    pivot.y + dist * Math.sin(el),
    pivot.z + dist * Math.cos(az) * Math.cos(el)
  );
}

function evalCamera(S: number, L: Layout, out: SceneState) {
  const r = sampleSpline(splineFor(L), S, _row);
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
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  };
  const d = xs[i + 1] - xs[i];
  const t = (x - xs[i]) / d;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * d * slope(i) + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * d * slope(i + 1);
}

/** A work row's S (ch04): measured once the list is laid out, else evenly spaced. */
export function rowS(i: number): number {
  const rs = measured.rowS;
  if (rs.length === 4 && rs.every((v, k) => k === 0 || v > rs[k - 1])) return rs[i];
  return 8.4 + 0.42 * i;
}

const convS: number[] = [];
const convY: number[] = [];

/** ch04 conveyor: specimen i is centred when row i is. Rises steadily before and after. */
function conveyorAt(S: number): number {
  convS.length = 0;
  convY.length = 0;
  const lead = 0.42;
  convS.push(rowS(0) - 1.2);
  convY.push(-1.2 / lead);
  for (let i = 0; i < 4; i++) {
    convS.push(rowS(i));
    convY.push(i);
  }
  convS.push(rowS(3) + 1.2);
  convY.push(3 + 1.2 / lead);
  return hermite1(convS, convY, S);
}

/**
 * Fill every scroll-driven field of sceneState (+ the fragment blend plan).
 * Pure in (S, L) except for reading ui.focusTier / measured.rowS.
 */
export function evaluate(S: number, _time: number, L: Layout, out: SceneState): void {
  evalCamera(S, L, out);
  const u = out.u;
  const env = out.env;

  /* ---- the stone ------------------------------------------------------ */
  plan.lift = 0.32 * Math.sin(Math.PI * easeInOutSine(range(S, 0.1, 1.8)));
  out.stone.home.set(0, S < 2.9 ? plan.lift : 0, 0);
  out.stone.visible = true;
  // The hero's half-turn; at the build the stone turns to meet the mark.
  let yaw = 20 + 180 * smoother(range(S, 0.05, 1.75));
  if (S >= 10.0) yaw = lerp(405, 450, easeInOutSine(range(S, 10.6, M0 - 1.0)));
  plan.yaw = yaw * DEG;
  plan.monumentYaw = 0.55 * (S - 3.0);

  /* ---- formations ---------------------------------------------------- */
  plan.gap = 0;
  plan.crownLift = 0;
  plan.bandLift = 0;
  plan.split = 0;
  plan.arc = 0.35;
  plan.glowMode = 0;
  plan.swirl = 0;
  plan.stagger = 0;
  plan.mix = 0;
  plan.laying = -1;
  plan.complete = 0;
  plan.beat = 0;
  const set = (a: Formation, b: Formation, mix: number, stagger: number) => {
    plan.a = a;
    plan.b = b;
    plan.mix = mix;
    plan.stagger = stagger;
  };
  for (let k = 0; k < 4; k++) {
    const a = COURSE_S0 + COURSE_STEP * k;
    plan.course[k] = range(S, a, a + COURSE_LEN);
  }
  for (let k = 0; k < 4; k++) {
    const a = METHOD.t0 + METHOD.step * k;
    plan.seat[k] = smoother(range(S, a, a + METHOD.seatLen));
  }
  plan.conveyor = conveyorAt(S);

  if (S < 2.0) {
    set("F0", "F0", 0, 0);
    plan.gap = 0.004 * easeInOutSine(range(S, 1.82, 2.0));
  } else if (S < 2.9) {
    // THE SHATTER.
    plan.gap = 0.004;
    set("F0", "F1", range(S, 2.0, 2.9), 1);
    plan.arc = 0.5;
  } else if (S < COURSE_S0 + 3 * COURSE_STEP + COURSE_LEN) {
    // THE STACK: course by course, spiralling in from the burst.
    set("F1", "F2", 0, 2);
    plan.swirl = 1.5;
    plan.swirlC.copy(MONUMENT_C);
    plan.arc = 0.3;
    plan.glowMode = 1;
    for (let k = 3; k >= 0; k--)
      if (S >= COURSE_S0 + COURSE_STEP * k) {
        plan.laying = k;
        break;
      }
  } else if (S < 4.75) {
    set("F2", "F2", 0, 0);
    plan.glowMode = 1;
    plan.complete = smoother(range(S, 4.46, 4.6));
  } else if (S < 5.75) {
    // The monument BURSTS OPEN round its core.
    set("F2", "F3", range(S, 4.75, 5.75), 3);
    plan.swirl = -1.7;
    plan.swirlC.copy(MONUMENT_C);
    plan.arc = 0.45;
    plan.glowMode = 2;
  } else if (S < 7.45) {
    set("F3", "F3", 0, 0);
    plan.glowMode = 2;
    plan.beat = S < 5.9 ? 0 : S < 6.55 ? 1 : 2;
  } else if (S < 8.15) {
    // Through the light, the shards regroup into specimens.
    set("F3", "F4", range(S, 7.45, 8.15), 4);
    plan.arc = 0.25;
    plan.glowMode = 3;
  } else if (S < 10.05) {
    set("F4", "F4", 0, 0);
    plan.glowMode = 3;
  } else if (S < 10.75) {
    // The specimens break; the shards fall into the column over the mirror.
    set("F4", "F5", range(S, 10.05, 10.75), 3);
    plan.swirl = 1.2;
    plan.swirlC.set(0, 0, 0);
    plan.arc = 0.35;
    plan.glowMode = 4;
  } else if (S < M0) {
    set("F5", "F5", 0, 5);
    plan.glowMode = 4;
  } else {
    const s = S - M0;
    set("F6", "F6", 0, 0);
    plan.crownLift = easeInOutSine(range(s, 0.22, 0.36));
    plan.bandLift = easeInOutSine(range(s, 0.5, 0.62));
    plan.split = plan.bandLift;
    plan.glowMode = 5;
  }
  out.formation.a = plan.a;
  out.formation.b = plan.b;
  out.formation.mix = plan.mix;

  /* ---- places --------------------------------------------------------- */
  env.flood = Math.max(bump(S, 2.5, 2.8, 3.12), bump(S, 7.36, 7.6, 8.1), bump(S, 10.05, 10.4, 10.78));
  env.mirror = 1 - smoother(range(S, 2.6, 2.78)) + smoother(range(S, 10.25, 10.45));
  env.plain = smoother(range(S, 2.7, 2.88)) * (1 - smoother(range(S, 7.6, 7.78)));
  env.void = smoother(range(S, 7.62, 7.82)) * (1 - smoother(range(S, 10.28, 10.46)));
  // The flood into the core is light, not fog.
  env.floodLight = bump(S, 7.36, 7.6, 8.1);

  /* ---- material uniforms --------------------------------------------- */
  let seam = range(S, 1.7, 1.82);
  seam = lerp(seam, 0.3, range(S, 2.0, 2.9));
  seam *= 1 - range(S, 2.9, 3.2);
  if (S >= M0) seam = 0.6 * range(S - M0, 0.5, 0.62);
  u.seam = seam;
  u.levelSeam = 0;

  let glow = 0;
  if (S < 2.0) glow = 0.4 * range(S, 1.82, 2.0);
  else if (S < M0) glow = S < 10.6 ? lerp(0.4, 1, range(S, 2.0, 2.6)) : lerp(1, 0.4, range(S, METHOD.t0 + 3 * METHOD.step, M0 - 0.9));
  else glow = 0.35 * range(S - M0, 0.5, 0.62);
  u.cutGlow = glow;

  u.spill = S < 3 ? Math.sin(Math.PI * range(S, 1.82, 2.7)) * range(S, 1.82, 1.9) : S >= M0 ? 0.4 * range(S - M0, 0.5, 0.62) : 0;

  // Alpha fog: the plain and the void have depth; the studio is clear.
  const deep = Math.max(env.plain, env.void);
  u.fogNear = lerp(60, env.void > env.plain ? 11 : 26, deep);
  u.fogFar = lerp(90, env.void > env.plain ? 30 : 70, deep);

  u.vein = 1 + 0.9 * Math.sin(Math.PI * range(S, 0.45, 1.6));
  u.dusk = 0;
  u.inner = 0.32 + 0.3 * Math.sin(Math.PI * range(S, 0.45, 1.6));
  u.floors = 0;
  u.reflect = env.mirror;
  u.floorY = STONE.floorY;
  u.mistAlpha = 1 - range(S, 0.5, 1.1);
  u.mistClipY = L.hero.mistClipY;
  u.cursorLight = S > 2.9 && S < 10.4 ? 4 : 8;

  /* ---- chapter hooks ------------------------------------------------- */
  out.tiers.visible = S > 2.95 && S < 4.75;
  let focus = plan.laying;
  if (plan.complete > 0.5) focus = -1;
  if (ui.focusTier >= 0 && out.tiers.visible) focus = ui.focusTier;
  out.tiers.focus = focus;

  /* ---- the bookend clip + mark lock ---------------------------------- */
  const s6 = S - M0;
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
