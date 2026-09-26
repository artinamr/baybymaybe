import * as THREE from "three";
import type { Layout } from "./layout";
import type { Formation, SceneState } from "./sceneState";
import { ui } from "./stores";
import { DEG, easeInOutCubic, easeInOutSine, lerp, range } from "./ease";
import { STONE } from "./geo/types";
import { chapter } from "./chapters";
import { FLOW_C, FLOW_DIR, LAKE_HOME, MONUMENT_C } from "./formations";

/**
 * THE FILM — every scroll-driven value of the home page's 3D, as a pure
 * function of S. Time-based life (the flow, the core, the cursor, flashes,
 * springs) lives in the Director.
 *
 * FOUR SECTIONS, THREE PLACES, ONE CONTINUOUS SHOT (the camera orbits ~270°
 * from the hero to the mark and never cuts):
 *
 *   HERO           THE STUDIO — the stone on its mirror.
 *   WHAT WE BUILD  it SHATTERS; the camera dives through the burst and comes
 *                  out in THE SKY, over a sea of cloud, where the shards
 *                  re-form the stone (DESIGN), rebuild it at monument scale
 *                  course by course (INFRASTRUCTURE), then become a working
 *                  system — leads streaming past the glowing core, the
 *                  qualified filed into a stack, the noise falling away (AI).
 *   WHY NERODYN    the shards fall like rain; the camera sinks through the
 *                  cloud to THE LAKE below, where they build the stone again,
 *                  one step per number (14 days · owned · no retainers · audit).
 *   FREE AUDIT     from one angle the stone IS the logo.
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
  /** 0 none · 1 from the crack origin · 2 by course · 3 random · 6 toward the crack origin (re-forming) */
  stagger: 0,
  /** Bézier arc strength. */
  arc: 0.35,
  gap: 0,
  lift: 0,
  crownLift: 0,
  bandLift: 0,
  split: 0,
  /** Stone rotation (radians): the hero/sky stone, and the stone over the lake. */
  yaw: 20 * DEG,
  buildYaw: -200 * DEG,
  /** Glow recipe: 0 plain · 1 monument · 2 flow · 4 build · 5 mark */
  glowMode: 0,
  /** Transitions SPIRAL: swept round the vertical axis through `swirlC` by swirl·sin(π·progress). */
  swirl: 0,
  swirlC: new THREE.Vector3(),
  /** F2 assembly: per-course progress 0..1. */
  course: [0, 0, 0, 0],
  /** 0..1 all courses laid (the monument lights up). */
  complete: 0,
  /** F5 seat progress per build group. */
  seat: [0, 0, 0, 0],
  /** The monument's scroll-driven turn (rad). */
  monumentYaw: 0,
  /** Which of the three disciplines is in view (0 design · 1 infrastructure · 2 AI; −1 none). */
  discipline: -1,
  /** Which WHY number has landed (−1 none … 3). */
  step: -1,
};

/** The build over the lake: one seat per WHY number. */
export const METHOD = { t0: 4.45, step: 0.2, seatLen: 0.18 };
/** Top of the last section (the finale keys hang off it). */
export const M0 = chapter("audit").S0;
/** The monument's courses. */
const COURSE_S0 = 2.05;
const COURSE_STEP = 0.17;
const COURSE_LEN = 0.32;
/** The three disciplines' windows in S (the text beats follow them). */
export const DISCIPLINE_S = [1.45, 1.98, 2.98, 3.62];

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
  const LY = LAKE_HOME.y;
  const MC: [number, number, number] = [MONUMENT_C.x, MONUMENT_C.y, MONUMENT_C.z];
  // The flow's frame: beside the type on a desktop; on a phone, centred between
  // the ring (left of the core) and the column (right of it).
  const FC: [number, number, number] = mob
    ? [FLOW_C.x + FLOW_DIR.x * 0.5, FLOW_C.y, FLOW_C.z + FLOW_DIR.z * 0.5]
    : [FLOW_C.x + 0.4, FLOW_C.y, FLOW_C.z];
  return [
    { S: 0, pivot: [0, STONE.centerY, 0], az: 0, el: 4, dist: heroD, fov: 30, pp: heroPP },
    // The camera sinks a little and looks up at the monument…
    { S: 0.3, pivot: [0, -0.3, 0], az: -22, el: -6, dist: heroD * 0.86, fov: 34, pp: mob ? [0.5, 0.36] : [0.6, 0.5] },
    // …closes in as its seams light…
    { S: 0.64, pivot: [0, -0.1, 0], az: -62, el: 1, dist: heroD * 0.56, fov: 40, pp: [0.52, 0.5] },
    // …and dives INTO the burst: the shards fly past the lens.
    { S: 1.0, pivot: [0, -0.3, 0], az: -98, el: 4, dist: 2.5, fov: 48, pp: [0.5, 0.5] },
    // THE SKY — out over the cloud sea; the shards re-form the stone (DESIGN).
    { S: 1.36, pivot: [0, -0.15, 0], az: -128, el: 16, dist: D(9.8), fov: 32, pp: pp(0.64, 0.52) },
    { S: 1.9, pivot: [0, -0.35, 0], az: -150, el: 9, dist: D(8.0), fov: 30, pp: pp(0.64, 0.5) },
    // INFRASTRUCTURE — the monument, laid course by course.
    { S: 2.45, pivot: [0, 0.9, 0], az: -174, el: 8, dist: D(19), fov: 30, pp: pp(0.66, 0.5) },
    { S: 2.95, pivot: MC, az: -192, el: 10, dist: D(20), fov: 30, pp: pp(0.66, 0.5) },
    // AI AUTOMATION — the flow, seen side-on so it runs left to right.
    { S: 3.35, pivot: FC, az: -208, el: 6, dist: D(12.5), fov: 30, pp: pp(0.62, 0.5) },
    { S: 3.62, pivot: FC, az: -214, el: 5, dist: D(12), fov: 30, pp: pp(0.62, 0.5) },
    // THROUGH THE CLOUD — the camera sinks with the falling shards.
    { S: 3.98, pivot: [0, -11, 0], az: -226, el: -3, dist: 7, fov: 42, pp: [0.5, 0.5] },
    // THE LAKE — the column hangs over the water; it builds as the numbers land.
    // Low over the water: the range and its reflection behind the stone.
    { S: 4.4, pivot: [0, LY + 0.5, 0], az: -238, el: 5, dist: D(12.5), fov: 30, pp: pp(0.66, 0.5) },
    { S: 5.05, pivot: [0, LY + 0.1, 0], az: -254, el: 4, dist: D(10.5), fov: 30, pp: pp(0.66, 0.5) },
    { S: M0 - 1.0, pivot: [0, LY + STONE.centerY, 0], az: -270, el: 6, dist: D(8.2), fov: 30, pp: pp(0.66, 0.52) },
    // THE MARK.
    { S: M0, pivot: [0, LY + STONE.centerY, 0], az: -270, el: 20, dist: D(L.fit(0.62, 30)), fov: 30, pp: pp(0.66, 0.5) },
    { S: M0 + 0.2, pivot: [0, LY + STONE.centerY, 0], az: -270, el: 26, dist: D(L.fit(0.62, 24)), fov: 24, pp: pp(0.66, 0.5) },
    { S: M0 + 0.36, pivot: [0, LY + STONE.centerY, 0], az: -270, el: 26, dist: D(L.fit(0.62, 24)), fov: 24, pp: pp(0.66, 0.5) },
    { S: M0 + 0.55, pivot: [0, LY - 0.741, 0], az: -270, el: 32.91, dist: D(12.79), fov: 16, pp: pp(0.66, 0.46) },
    { S: M0 + 0.9, pivot: [0, LY - 0.741, 0], az: -270, el: 32.91, dist: D(12.79), fov: 16, pp: pp(0.66, 0.46) },
    { S: M0 + 1.2, pivot: [0, LY - 0.741, 0], az: -270, el: 32.91, dist: D(17.9), fov: 16, pp: mob ? [0.5, 0.36] : [0.71, 0.395] },
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
 * MONOTONE tangents (Fritsch–Butland, weighted harmonic mean of the two
 * secants over non-uniform spacing): the path is C1 through every key and no
 * channel ever overshoots one — a fast dive (through the cloud) lands on the
 * next frame instead of sinking past it. A key that turns a channel round, or
 * equals a neighbour (a HOLD), gets a zero tangent there.
 */
export function buildSpline(K: Key[]): Spline {
  const S = K.map((k) => k.S);
  const v = K.map(toChannels);
  const m = v.map((row, j) =>
    row.map((x, c) => {
      if (j === 0 || j === v.length - 1) return 0;
      const h0 = Math.max(1e-4, S[j] - S[j - 1]);
      const h1 = Math.max(1e-4, S[j + 1] - S[j]);
      const d0 = (x - v[j - 1][c]) / h0;
      const d1 = (v[j + 1][c] - x) / h1;
      if (Math.abs(d0) < 1e-6 || Math.abs(d1) < 1e-6 || d0 * d1 < 0) return 0;
      const w0 = 2 * h1 + h0;
      const w1 = h1 + 2 * h0;
      return (w0 + w1) / (w0 / d0 + w1 / d1);
    })
  );
  return { S, v, m };
}

const _row = new Array<number>(NCH).fill(0);

export function sampleSpline(sp: Spline, S: number, out: number[] = _row): number[] {
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

export type { Key, Spline };

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

/** Write a sampled spline row into the camera state. */
export function writeCamera(r: number[], out: SceneState): void {
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

/**
 * Fill every scroll-driven field of sceneState (+ the fragment blend plan).
 * Pure in (S, L) except for reading ui.focusTier.
 */
export function evaluate(S: number, _time: number, L: Layout, out: SceneState): void {
  writeCamera(sampleSpline(splineFor(L), S), out);
  const u = out.u;
  const env = out.env;

  /* ---- the stone ------------------------------------------------------ */
  plan.lift = 0.22 * Math.sin(Math.PI * easeInOutSine(range(S, 0.05, 0.7)));
  out.stone.home.set(0, S < 1.2 ? plan.lift : 0, 0);
  if (S >= 4.2) out.stone.home.copy(LAKE_HOME);
  out.stone.visible = true;
  // The hero's slow turn, the re-formed stone turning in the sky, the stone over the lake meeting the mark.
  plan.yaw = (20 - 80 * smoother(range(S, 0.05, 0.7)) - 70 * smoother(range(S, 1.2, 2.0))) * DEG;
  plan.buildYaw = lerp(-200, -270, easeInOutSine(range(S, 4.4, M0 - 1.0))) * DEG;
  plan.monumentYaw = 0.5 * (S - 2.0);

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
  plan.complete = 0;
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
  plan.discipline = S < DISCIPLINE_S[0] || S >= DISCIPLINE_S[3] + 0.4 ? -1 : S < DISCIPLINE_S[1] ? 0 : S < DISCIPLINE_S[2] ? 1 : 2;
  plan.step = -1;
  for (let k = 0; k < 4; k++) if (S >= METHOD.t0 + METHOD.step * k + METHOD.seatLen * 0.5) plan.step = k;

  if (S < 0.7) {
    set("F0", "F0", 0, 0);
    plan.gap = 0.004 * easeInOutSine(range(S, 0.58, 0.7));
  } else if (S < 1.3) {
    // THE SHATTER.
    plan.gap = 0.004;
    set("F0", "F1", range(S, 0.7, 1.3), 1);
    plan.arc = 0.5;
  } else if (S < 1.78) {
    // Out in the sky, the shards find each other again: DESIGN.
    set("F1", "F0", range(S, 1.3, 1.78), 6);
    plan.swirl = 0.9;
    plan.swirlC.set(0, 0, 0);
    plan.arc = 0.35;
  } else if (S < COURSE_S0) {
    set("F0", "F0", 0, 0);
  } else if (S < COURSE_S0 + 3 * COURSE_STEP + COURSE_LEN) {
    // INFRASTRUCTURE: the stone rebuilt at scale, course by course.
    set("F0", "F2", 0, 2);
    plan.swirl = 1.2;
    plan.swirlC.copy(MONUMENT_C);
    plan.arc = 0.25;
    plan.glowMode = 1;
  } else if (S < 3.0) {
    set("F2", "F2", 0, 0);
    plan.glowMode = 1;
    plan.complete = smoother(range(S, 2.86, 2.96));
  } else if (S < 3.32) {
    // AI AUTOMATION: the monument comes apart into a working system.
    set("F2", "F3", range(S, 3.0, 3.32), 3);
    plan.swirl = -1.2;
    plan.swirlC.copy(MONUMENT_C);
    plan.arc = 0.3;
    plan.glowMode = 2;
  } else if (S < 3.64) {
    set("F3", "F3", 0, 0);
    plan.glowMode = 2;
  } else if (S < 4.4) {
    // The shards fall like rain through the cloud, down to the lake.
    set("F3", "F5", range(S, 3.64, 4.4), 3);
    plan.arc = 0.08;
    plan.swirl = 0.7;
    plan.swirlC.set(0, 0, 0);
    plan.glowMode = 4;
  } else if (S < M0) {
    set("F5", "F5", 0, 0);
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
  env.mirror = 1 - smoother(range(S, 0.74, 0.92)) + smoother(range(S, 4.12, 4.36));
  env.sky = smoother(range(S, 0.8, 1.18)) * (1 - smoother(range(S, 3.9, 4.12)));
  env.inCloud = bump(S, 3.72, 3.96, 4.2);
  env.lake = smoother(range(S, 3.98, 4.28));
  env.flood = 0;
  env.floodLight = 0;
  env.plain = 0;
  env.void = 0;

  /* ---- material uniforms --------------------------------------------- */
  let seam = range(S, 0.5, 0.62);
  seam = lerp(seam, 0.3, range(S, 0.7, 1.3));
  seam *= 1 - range(S, 1.3, 1.6);
  if (S >= M0) seam = 0.6 * range(S - M0, 0.5, 0.62);
  u.seam = seam;
  u.levelSeam = 0;

  let glow = 0;
  if (S < 0.7) glow = 0.4 * range(S, 0.6, 0.7);
  else if (S < M0) glow = S < 4.4 ? lerp(0.4, 1, range(S, 0.7, 1.1)) : lerp(1, 0.4, range(S, 5.2, M0 - 0.9));
  else glow = 0.35 * range(S - M0, 0.5, 0.62);
  u.cutGlow = glow;
  u.spill = S < 1 ? Math.sin(Math.PI * range(S, 0.6, 1.0)) * range(S, 0.6, 0.66) : S >= M0 ? 0.4 * range(S - M0, 0.5, 0.62) : 0;

  // Fog as alpha: the sky and the lake have depth; the studio is clear.
  const deep = Math.max(env.sky, env.lake);
  u.fogNear = lerp(60, 34, deep);
  u.fogFar = lerp(90, 120, deep);

  u.vein = 1 + 0.9 * Math.sin(Math.PI * range(S, 0.3, 0.9));
  u.dusk = 0;
  u.inner = 0.32 + 0.3 * Math.sin(Math.PI * range(S, 0.3, 0.9));
  u.floors = 0;
  u.wake = 0;
  u.reflect = Math.min(1, env.mirror);
  u.floorY = S < 2.5 ? STONE.floorY : LAKE_HOME.y + STONE.floorY;
  u.mistAlpha = 1 - range(S, 0.3, 0.8);
  u.mistClipY = L.hero.mistClipY;
  u.cursorLight = S > 1.2 && S < 4.4 ? 4 : 8;

  /* ---- chapter hooks ------------------------------------------------- */
  out.tiers.visible = false;
  out.tiers.focus = ui.focusTier;

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
