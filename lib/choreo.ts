import * as THREE from "three";
import type { Layout } from "./layout";
import type { Formation, SceneState } from "./sceneState";
import { ui } from "./stores";
import { DEG, easeInOutSine, lerp, range } from "./ease";
import { STONE } from "./geo/types";
import { chapter } from "./chapters";
import { COL_C, COL_HOME, COL_K, FLAT_Y, FLOW_AZ_DEG, FLOW_C, FLOW_DIR, MONUMENT_C } from "./formations";

/**
 * THE FILM — every scroll-driven value of the home page's 3D, as a pure
 * function of S. Time-based life (the flow, the core, the cursor, flashes,
 * springs) lives in the Director.
 *
 * FIVE SECTIONS, THREE PLACES, ONE SHOT (one cut, hidden in a flood of light):
 *
 *   HERO          THE STUDIO — the stone on its mirror.
 *   THE STUDIO    look up; the pass; the stone behind the statement, which
 *                 inverts where the glass crosses it; a hairline of light, and
 *                 it SHATTERS — the camera pulls back with the burst as the
 *                 studio floor gives way to THE SKY, a sea of cloud rolling in
 *                 beneath, far obsidian peaks in the haze.
 *   WHAT WE BUILD websites: the burst resolves into an exploded view and
 *                 assembles, inside out, every shard flashing as it locks.
 *                 platforms: the stone rebuilt at monument scale, course by
 *                 course, light rising through it when it is complete.
 *                 AI automation: the leads circle the core and are decided.
 *                 Then every lead is drawn into the core, the camera follows
 *                 it in, and its light floods the frame —
 *   WHY NERODYN   — and draws back over THE SALT FLAT, where the stone stands
 *                 colossal. It opens toward the camera; the camera flies in,
 *                 turns round the burning core inside, and pulls out the back
 *                 as the glass closes in front of it. A ring runs out across
 *                 the flat.
 *   LET'S TALK    the colossus at rest, seams drawn in light.
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
  /**
   * 0 none · 1 from the crack origin · 2 by course · 3 random ·
   * 6 toward the crack origin (re-forming) · 7 from the heart out (assembly)
   */
  stagger: 0,
  /** Bézier arc strength. */
  arc: 0.35,
  gap: 0,
  lift: 0,
  /** Where the stone stands and how big it is. */
  home: new THREE.Vector3(),
  K: 1,
  /** F4: how far apart the exploded view is held. */
  explode: 1,
  /** F7: how far the colossus may open toward the camera (0..1). */
  open: 0,
  /** A hard cut this frame (the rig and every shard jump to their goals). */
  cut: false,
  /** Stone rotation (radians). */
  yaw: 20 * DEG,
  /** Glow recipe: 0 plain · 1 monument · 2 flow · 3 exploded/assembly · 6 colossus · 7 gathered */
  glowMode: 0,
  /** Transitions SPIRAL: swept round the vertical axis through `swirlC` by swirl·sin(π·progress). */
  swirl: 0,
  swirlC: new THREE.Vector3(),
  /** F2 assembly: per-course progress 0..1. */
  course: [0, 0, 0, 0],
  /** 0..1 all courses laid (the monument lights up). */
  complete: 0,
  /** The monument's scroll-driven turn (rad). */
  monumentYaw: 0,
  /** Which of the three disciplines is in view (0 websites · 1 platforms · 2 AI; −1 none). */
  discipline: -1,
  /* Story-film fields (lib/storyFilm.ts writes them; the home film leaves them at rest). */
  buildYaw: 0,
  crownLift: 0,
  bandLift: 0,
  split: 0,
  step: -1,
};

/** Top of the last section. */
export const M0 = chapter("audit").S0;
/* The film's beats, in S. */
const SHATTER = [2.25, 2.85];
const EXPLODE = [2.85, 3.3];
const ASSEMBLE = [3.6, 3.95];
const COURSE_S0 = 4.1;
const COURSE_STEP = 0.13;
const COURSE_LEN = 0.28;
const COURSE_END = COURSE_S0 + 3 * COURSE_STEP + COURSE_LEN;
const FLOW = [4.92, 5.22];
const GATHER = [5.62, 5.98];
/** The flood: rises, holds white (the cut), draws back. */
const FLOOD = [5.8, 6.0, 6.1, 6.42];
export const CUT_S = 6.05;
/** The colossus: bursts, is flown into and round, closes. */
const OPEN = [6.92, 7.3, 8.02, 8.55];

/** The three disciplines' windows in S (the text beats follow them). */
export const DISCIPLINE_S = [2.95, 4.03, 4.9, 5.6];
/** The three WHY claims' windows in S. */
export const WHY_S = [6.25, 7.08, 7.8, 8.7];

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
  const cY = STONE.centerY;
  const MC: [number, number, number] = [MONUMENT_C.x, MONUMENT_C.y, MONUMENT_C.z];
  // The flow's frame: beside the type on a desktop; on a phone, centred between
  // the ring (left of the core) and the column (right of it).
  const FC: [number, number, number] = mob
    ? [FLOW_C.x + FLOW_DIR.x * 0.5, FLOW_C.y, FLOW_C.z + FLOW_DIR.z * 0.5]
    : [FLOW_C.x - FLOW_DIR.x * 0.35, FLOW_C.y, FLOW_C.z - FLOW_DIR.z * 0.35];
  const CC: [number, number, number] = [COL_C.x, COL_C.y, COL_C.z];
  const FA = FLOW_AZ_DEG;
  return [
    { S: 0, pivot: [0, cY, 0], az: 0, el: 4, dist: heroD, fov: 30, pp: heroPP },
    // LOOK UP: the camera sinks and looks up at the stone…
    { S: 0.3, pivot: [0, -0.3, 0], az: -22, el: -6, dist: heroD * 0.86, fov: 34, pp: mob ? [0.5, 0.36] : [0.6, 0.5] },
    // …THE PASS: close, the stone filling the frame, the veins waking…
    { S: 0.64, pivot: [0, -0.1, 0], az: -62, el: 1, dist: heroD * 0.56, fov: 40, pp: [0.52, 0.5] },
    // …and settles behind the statement (the letters invert where it passes).
    { S: 1.2, pivot: [0, cY, 0], az: -100, el: 5, dist: D(8.3), fov: 30, pp: pp(0.4, 0.5) },
    { S: 1.9, pivot: [0, cY, 0], az: -122, el: 8, dist: D(7.6), fov: 30, pp: pp(0.42, 0.5) },
    // The hairline of light: the stone comes to the centre for the shatter.
    { S: 2.25, pivot: [0, cY + 0.1, 0], az: -132, el: 7, dist: D(8.8), fov: 30, pp: [0.5, 0.5] },
    // THE SHATTER — the camera pulls back with the burst; the sky rolls in below.
    { S: 2.6, pivot: [0, cY + 0.55, 0], az: -142, el: 8, dist: D(14), fov: 32, pp: [0.5, 0.5] },
    { S: 2.85, pivot: [0, cY + 0.5, 0], az: -152, el: 7, dist: D(16), fov: 32, pp: pp(0.58, 0.5) },
    // WEBSITES — the exploded view, the cloud sea running to a horizon of far
    // obsidian peaks behind it; then assembled.
    { S: 3.25, pivot: [0, cY + 0.35, 0], az: -168, el: 6, dist: D(14.5), fov: 30, pp: pp(0.64, 0.5) },
    { S: 3.6, pivot: [0, cY + 0.2, 0], az: -186, el: 5, dist: D(14), fov: 30, pp: pp(0.64, 0.5) },
    { S: 3.95, pivot: [0, cY, 0], az: -200, el: 4, dist: D(8.8), fov: 30, pp: pp(0.64, 0.5) },
    { S: 4.1, pivot: [0, cY, 0], az: -206, el: 4, dist: D(9.4), fov: 30, pp: pp(0.64, 0.5) },
    // PLATFORMS — the monument, course by course, the camera low.
    { S: 4.5, pivot: [0, 0.5, 0], az: -226, el: 3, dist: D(17.5), fov: 30, pp: pp(0.64, 0.5) },
    { S: 4.9, pivot: MC, az: -244, el: 4, dist: D(18.5), fov: 30, pp: pp(0.64, 0.5) },
    // AI AUTOMATION — the flow, seen side-on so it runs left to right.
    { S: 5.22, pivot: FC, az: FA + 4, el: 4, dist: D(12.5), fov: 30, pp: pp(0.62, 0.5) },
    { S: 5.6, pivot: FC, az: FA - 2, el: 3, dist: D(12), fov: 30, pp: pp(0.62, 0.5) },
    // INTO THE LIGHT — every lead drawn into the core; the camera follows them in.
    { S: 5.98, pivot: [FLOW_C.x, FLOW_C.y, FLOW_C.z], az: FA - 10, el: 3, dist: 3.4, fov: 40, pp: [0.5, 0.5] },
    // ——— the cut, under the flood ———
    // THE SALT FLAT — the colossus far off, the camera low, looking up at it.
    { S: CUT_S, pivot: CC, az: -360, el: -5, dist: D(84), fov: 30, pp: pp(0.6, 0.52) },
    { S: 6.4, pivot: CC, az: -360, el: -4, dist: D(72), fov: 30, pp: pp(0.6, 0.52) },
    { S: 6.8, pivot: CC, az: -353, el: -1, dist: D(40), fov: 32, pp: pp(0.58, 0.5) },
    // It bursts, slow as a held breath, and the camera flies into it…
    { S: 7.05, pivot: CC, az: -348, el: 2, dist: 30, fov: 36, pp: [0.54, 0.5] },
    { S: 7.3, pivot: CC, az: -338, el: 4, dist: 15, fov: 46, pp: [0.5, 0.5] },
    // …round the burning core, the burst all round it…
    { S: 7.55, pivot: CC, az: -300, el: 6, dist: 8.5, fov: 50, pp: [0.5, 0.5] },
    { S: 7.8, pivot: CC, az: -240, el: 5, dist: 8.2, fov: 50, pp: [0.5, 0.5] },
    { S: 8.02, pivot: CC, az: -196, el: 4, dist: 10, fov: 46, pp: [0.5, 0.5] },
    // …and out, the glass closing in front of it.
    { S: 8.3, pivot: CC, az: -184, el: 2, dist: 22, fov: 38, pp: [0.52, 0.5] },
    { S: 8.7, pivot: CC, az: -176, el: 2, dist: D(40), fov: 32, pp: pp(0.6, 0.5) },
    // LET'S TALK — the colossus at rest (on a phone, small in the top band, clear of the words).
    { S: 9.3, pivot: CC, az: -170, el: 3, dist: mob ? 58 / 0.4 : 58, fov: 30, pp: mob ? [0.5, 0.27] : [0.66, 0.5] },
    { S: M0 + 0.4, pivot: CC, az: -165, el: 4, dist: mob ? 60 / 0.4 : 60, fov: 30, pp: mob ? [0.5, 0.27] : [0.66, 0.5] },
    { S: M0 + 1.25, pivot: CC, az: -160, el: 5, dist: mob ? 64 / 0.4 : 64, fov: 30, pp: mob ? [0.5, 0.25] : [0.68, 0.46] },
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
 * channel ever overshoots one — a fast move lands on the next frame instead of
 * sinking past it. A key that turns a channel round, or equals a neighbour (a
 * HOLD), gets a zero tangent there. A key at the cut starts a new spline
 * segment: nothing is interpolated across it.
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
let before: Spline | null = null;
let after: Spline | null = null;

/** Two splines — before and after the cut — so nothing is ever interpolated across it. */
function splinesFor(L: Layout): [Spline, Spline] {
  const id = `${L.vw}x${L.vh}:${L.mode}:${L.hero.dist.toFixed(3)}`;
  if (id !== cachedFor || !before || !after) {
    cachedFor = id;
    const all = keys(L);
    before = buildSpline(all.filter((k) => k.S < CUT_S));
    after = buildSpline(all.filter((k) => k.S >= CUT_S));
  }
  return [before, after];
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
  const [sp0, sp1] = splinesFor(L);
  const flat = S >= CUT_S;
  writeCamera(sampleSpline(flat ? sp1 : sp0, S), out);
  out.cam.cut = Math.abs(S - CUT_S) < 0.035;
  const u = out.u;
  const env = out.env;

  /* ---- the stone ------------------------------------------------------ */
  plan.lift = 0.22 * Math.sin(Math.PI * easeInOutSine(range(S, 0.05, 0.7)));
  plan.cut = out.cam.cut;
  if (flat) {
    plan.home.copy(COL_HOME);
    plan.K = COL_K;
  } else {
    plan.home.set(0, 0, 0);
    plan.K = 1;
  }
  out.stone.home.copy(plan.home);
  if (!flat && S < 1.2) out.stone.home.y = plan.lift;
  out.stone.scale = plan.K;
  out.stone.visible = true;
  // The hero's slow turn; the statement's; the turn of the re-made stone in
  // the sky; the colossus faces the camera with a corner, like the hero.
  if (!flat) {
    plan.yaw = (20 - 80 * smoother(range(S, 0.05, 0.7)) - 40 * smoother(range(S, 1.0, 2.2)) - 50 * smoother(range(S, 3.3, 4.1))) * DEG;
  } else {
    plan.yaw = (20 + 12 * smoother(range(S, CUT_S, 7.2)) + 18 * smoother(range(S, 8.3, M0 + 1.2))) * DEG;
  }
  plan.monumentYaw = 0.5 * (S - COURSE_S0);
  plan.explode = 1;

  /* ---- formations ---------------------------------------------------- */
  plan.gap = 0;
  plan.arc = 0.35;
  plan.glowMode = 0;
  plan.swirl = 0;
  plan.stagger = 0;
  plan.mix = 0;
  plan.complete = 0;
  plan.open = 0;
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
  plan.discipline = S < DISCIPLINE_S[0] || S >= DISCIPLINE_S[3] + 0.3 ? -1 : S < DISCIPLINE_S[1] ? 0 : S < DISCIPLINE_S[2] ? 1 : 2;

  if (S < SHATTER[0]) {
    set("F0", "F0", 0, 0);
    // A hairline of light: the cracks open by a breath before it breaks.
    plan.gap = 0.004 * easeInOutSine(range(S, 2.05, SHATTER[0]));
  } else if (S < SHATTER[1]) {
    // THE SHATTER.
    plan.gap = 0.004;
    set("F0", "F1", range(S, SHATTER[0], SHATTER[1]), 1);
    plan.arc = 0.5;
  } else if (S < EXPLODE[1]) {
    // The burst finds its order: every shard turns back to its place, held apart.
    set("F1", "F4", range(S, EXPLODE[0], EXPLODE[1]), 6);
    plan.swirl = 0.6;
    plan.swirlC.set(0, STONE.centerY, 0);
    plan.arc = 0.25;
    plan.glowMode = 3;
  } else if (S < ASSEMBLE[0]) {
    set("F4", "F4", 0, 0);
    plan.glowMode = 3;
    // The exploded view breathes in a little as it waits.
    plan.explode = 1 - 0.1 * smoother(range(S, EXPLODE[1], ASSEMBLE[0]));
  } else if (S < ASSEMBLE[1]) {
    // Assembly, from the heart out; each shard flashes as it seats.
    plan.explode = 0.9;
    set("F4", "F0", range(S, ASSEMBLE[0], ASSEMBLE[1]), 7);
    plan.arc = 0.12;
    plan.glowMode = 3;
  } else if (S < COURSE_S0) {
    set("F0", "F0", 0, 0);
  } else if (S < COURSE_END) {
    // PLATFORMS: the stone rebuilt at scale, course by course.
    set("F0", "F2", 0, 2);
    plan.swirl = 1.2;
    plan.swirlC.copy(MONUMENT_C);
    plan.arc = 0.25;
    plan.glowMode = 1;
  } else if (S < FLOW[0]) {
    set("F2", "F2", 0, 0);
    plan.glowMode = 1;
    plan.complete = smoother(range(S, COURSE_END, COURSE_END + 0.1));
  } else if (S < FLOW[1]) {
    // AI AUTOMATION: the monument comes apart into a working system.
    set("F2", "F3", range(S, FLOW[0], FLOW[1]), 3);
    plan.swirl = -0.55;
    plan.swirlC.copy(MONUMENT_C);
    plan.arc = 0.18;
    plan.glowMode = 2;
  } else if (S < GATHER[0]) {
    set("F3", "F3", 0, 0);
    plan.glowMode = 2;
  } else if (!flat) {
    // INTO THE LIGHT: every lead drawn into the core.
    set("F3", "F8", range(S, GATHER[0], GATHER[1]), 3);
    plan.swirl = 1.6;
    plan.swirlC.copy(FLOW_C);
    plan.arc = 0.4;
    plan.glowMode = 7;
  } else {
    // THE COLOSSUS: it opens toward the camera, and closes behind it.
    set("F7", "F7", 0, 0);
    plan.open = smoother(range(S, OPEN[0], OPEN[1])) * (1 - smoother(range(S, OPEN[2], OPEN[3])));
    plan.glowMode = 6;
  }
  out.formation.a = plan.a;
  out.formation.b = plan.b;
  out.formation.mix = plan.mix;

  /* ---- places --------------------------------------------------------- */
  env.mirror = flat ? 0 : 1 - smoother(range(S, 2.35, 2.62));
  env.sky = flat ? 0 : smoother(range(S, 2.4, 2.85));
  env.inCloud = 0;
  env.flat = flat ? 1 : 0;
  env.flood = smoother(range(S, FLOOD[0], FLOOD[1])) * (1 - smoother(range(S, FLOOD[2], FLOOD[3])));
  env.floodX = 0.5;
  env.floodY = 0.5;
  env.ripple = range(S, 8.45, 9.4);
  env.lake = 0;
  env.plain = 0;
  env.void = 0;
  env.floodLight = 0;

  /* ---- material uniforms --------------------------------------------- */
  // Mark seams: they wake in the pass, burn before the shatter, and draw the
  // colossus at rest.
  let seam = 0.35 * range(S, 0.5, 0.62) * (1 - range(S, 1.0, 1.3)) + 0.9 * bump(S, 1.95, 2.2, 2.4);
  if (flat) seam = 0.25 * bump(S, 6.4, 6.8, 7.1) + 0.55 * smoother(range(S, 8.6, 9.3));
  u.seam = seam;
  u.levelSeam = 0;

  let glow = 0.4 * range(S, 2.0, 2.25);
  if (S >= SHATTER[0] && !flat) glow = S < COURSE_S0 ? 1 : lerp(1, 0.7, range(S, 5.0, 5.6));
  if (flat) glow = 0.3 + 0.35 * plan.open;
  u.cutGlow = glow;
  u.spill = flat ? 0.35 * smoother(range(S, 8.8, 9.4)) : 0.5 * bump(S, 2.0, 2.25, 2.5);

  // Fog as alpha: the sky has depth; the flat stretches to a far horizon.
  const deep = env.sky;
  u.fogNear = flat ? 160 : lerp(60, 34, deep);
  u.fogFar = flat ? 520 : lerp(90, 120, deep);

  u.vein = 1 + 0.9 * Math.sin(Math.PI * range(S, 0.3, 0.9)) + 0.6 * bump(S, 1.7, 2.2, 2.5);
  u.dusk = 0;
  u.inner = 0.32 + 0.3 * Math.sin(Math.PI * range(S, 0.3, 0.9)) + (flat ? 0.12 * plan.open : 0);
  u.floors = 0;
  u.wake = flat ? 0 : 0.35 * bump(S, 1.9, 2.2, 2.45);
  // A band of light rises through the monument when its last course lands.
  u.riseY = lerp(-2.0, 1.1, range(S, COURSE_END, COURSE_END + 0.16));
  u.riseAmp = bump(S, COURSE_END - 0.02, COURSE_END + 0.04, COURSE_END + 0.18);
  u.reflect = Math.max(env.mirror, env.flat);
  u.floorY = flat ? FLAT_Y : STONE.floorY;
  u.mistAlpha = 1 - range(S, 0.3, 0.8);
  u.mistClipY = L.hero.mistClipY;
  u.cursorLight = S > 2.3 && S < 6 ? 4 : 8;

  /* ---- chapter hooks ------------------------------------------------- */
  out.tiers.visible = false;
  out.tiers.focus = ui.focusTier;

  /* ---- no bookend clip; the mark lock is retired ---------------------- */
  out.clip.active = false;
  out.mark.lock = 0;
}
