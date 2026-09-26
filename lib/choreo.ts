import * as THREE from "three";
import type { Layout } from "./layout";
import type { Formation, SceneState } from "./sceneState";
import { ui } from "./stores";
import { DEG, easeInOutSine, lerp, range } from "./ease";
import { STONE } from "./geo/types";
import { chapter } from "./chapters";
import { aiCore, CLOUD_Y, COL_C, COL_HOME, COL_K, COURSES, FLAT_Y, TOWER_C, TOWER_TOP_Y, fallCore } from "./formations";

/**
 * THE FILM — every scroll-driven value of the home page's 3D, as a pure
 * function of S. Time-based life (the core, the cursor, flashes, waves,
 * springs) lives in the Director.
 *
 * ONE STONE, WHOLE ONLY AT EACH END; ONE UNBROKEN SHOT; THREE PLACES:
 *
 *   HERO          THE STUDIO — the stone on its mirror.
 *   THE STUDIO    look up; the pass; the stone behind the statement; a
 *                 hairline of light, and it SHATTERS — the camera pulling back
 *                 with the burst as a sea of cloud rolls in beneath: THE SKY.
 *   WHAT WE BUILD websites: the burst finds its order — an exploded view, loose,
 *                 then exact, the core burning at its heart. platforms: the
 *                 pieces stack into a TOWER rising out of the cloud sea,
 *                 course by course, roofed with the crown. AI automation: the
 *                 core climbs the shaft; every floor it passes opens, turns a
 *                 step and lights — the tower twists into a new form.
 *   THE FALL      the core drops out of the top and the tower unravels after
 *                 it — a spiral of glass pouring down through the cloud deck,
 *                 growing as it falls, to THE SALT FLAT.
 *   WHY NERODYN   it lands, and the pieces build ONE colossal stone round the
 *                 core — open, with the camera inside, round the burning
 *                 heart — closing as the camera pulls out, the crown last.
 *   LET'S TALK    down to the flat's own level: the colossus and its
 *                 reflection, one figure; it lifts off its reflection and turns.
 */

type Key = {
  S: number;
  pivot: [number, number, number];
  az: number; // deg
  el: number; // deg
  dist: number;
  fov: number;
  pp: [number, number];
  /** Bank (deg): the camera leans into its turns. */
  roll?: number;
};

/** Per-fragment blend plan the Director executes. */
export const plan = {
  a: "F0" as Formation,
  b: "F0" as Formation,
  /** Window-local progress 0..1 (the Director staggers it per fragment). */
  mix: 0,
  /**
   * 0 none · 1 from the crack origin · 2 by course (the tower) · 3 random ·
   * 6 toward the crack origin (re-forming) · 7 from the heart out ·
   * 8 the tower unravelling (roof first) · 9 the colossus (point first)
   */
  stagger: 0,
  /** Bézier arc strength. */
  arc: 0.35,
  gap: 0,
  lift: 0,
  /** Where the stone stands and how big it is. */
  home: new THREE.Vector3(),
  K: 1,
  /** F4: how far apart the exploded view is held, and how exact (0 loose → 1). */
  explode: 1,
  exact: 1,
  /** F2: how far the AI has worked up the tower (0..1). */
  ai: 0,
  /** F3: how far the fall has got (0..1). */
  fall: 0,
  /** F7: how open the colossus is (0..1). */
  open: 0,
  /** Retired (no cuts any more); kept for the story film. */
  cut: false,
  /** Stone rotation (radians). */
  yaw: 20 * DEG,
  /** The tower's own slow turn (radians). */
  towerYaw: 0,
  /** Glow recipe: 0 plain · 1 tower · 3 exploded · 4 the fall · 6 colossus */
  glowMode: 0,
  /** Transitions SPIRAL: swept round the vertical axis through `swirlC` by swirl·sin(π·progress). */
  swirl: 0,
  swirlC: new THREE.Vector3(),
  /** F2 build: per-course progress 0..1 (the last entry is the roof). */
  course: new Array<number>(COURSES + 1).fill(0),
  /** 0..1 the tower's last course laid (it lights up). */
  complete: 0,
  /** Which of the three disciplines is in view (0 websites · 1 platforms · 2 AI; −1 none). */
  discipline: -1,
  /** The landing's impact (0..1, decays after touch-down). */
  impact: 0,
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
/** The burst finds its order; then the snap from loose to exact. */
const EXPLODE = [2.85, 3.3];
const EXACT = [3.28, 3.62];
/** The tower: course by course, then the roof. */
const BUILD_S0 = 3.9;
const COURSE_STEP = 0.085;
const COURSE_LEN = 0.26;
const ROOF_S = BUILD_S0 + COURSES * COURSE_STEP + 0.02;
const BUILD_END = ROOF_S + COURSE_LEN;
/** The AI works up the tower. */
const AI = [4.97, 5.92];
/** The fall: the tower unravels after the core and pours down to the flat. */
const FALL = [6.0, 7.05];
const UNRAVEL = [6.0, 6.42];
export const LAND_S = FALL[1];
/** The colossus: built open round the core, flown into and round, closed. */
const SEAT = [LAND_S - 0.02, 7.62];
const CLOSE = [8.55, 9.2];

/** The three disciplines' windows in S (the text beats follow them). */
export const DISCIPLINE_S = [2.95, 3.95, 4.97, 6.0];
/** The three WHY claims' windows in S. */
export const WHY_S = [7.05, 7.85, 8.45, 9.3];

export const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** A soft bump: 0 → 1 over [a, b], 1 → 0 over [b, c]. */
function bump(S: number, a: number, b: number, c: number): number {
  return smoother(range(S, a, b)) * (1 - smoother(range(S, b, c)));
}

function heightOf(k: { dist: number; fov: number }) {
  return 2 * k.dist * Math.tan((k.fov * DEG) / 2);
}

const _fc = new THREE.Vector3();

function keys(L: Layout): Key[] {
  const mob = L.mode === "mobile";
  const heroD = L.hero.dist;
  const heroPP = L.hero.pp;
  // Mobile: the 3D lives in a top band (pp y 0.30), framed 0.55× as tall.
  const pp = (x: number, y: number): [number, number] => (mob ? [0.5, 0.3] : [x, y]);
  const D = (d: number) => (mob ? d / 0.55 : d);
  const cY = STONE.centerY;
  const TC: [number, number, number] = [TOWER_C.x, TOWER_C.y, TOWER_C.z];
  const CC: [number, number, number] = [COL_C.x, COL_C.y, COL_C.z];
  // The AI's climb: the camera rides up beside the core, the tower beside it.
  // (On a phone the text owns the lower half: the whole tower, not a chase.)
  const climb = (S: number): [number, number, number] => {
    if (mob) return [TOWER_C.x, TOWER_C.y + 1, TOWER_C.z];
    aiCore(range(S, AI[0], AI[1]), _fc);
    return [_fc.x * 0.55, _fc.y, _fc.z * 0.55];
  };
  const aiD = (d: number) => (mob ? 60 : d);
  // The fall: the camera rides above the core, looking down the spiral as the
  // cloud deck and then the flat come up to meet it.
  // Straight down the funnel: the camera cranes up and over the top of the
  // tower as the core drops, and rides down after it looking down the spiral,
  // turning with it — through the cloud deck — then swings level as it lands.
  const fall: Key[] = [
    [0.12, -380, 30, 21, 40, -4],
    [0.3, -400, 38, 25, 42, -7],
    [0.5, -420, 40, 31, 42, -9],
    [0.7, -440, 34, 40, 40, -7],
    [0.87, -454, 22, 50, 38, -3],
  ].map(([f, az, el, dist, fov, roll]) => {
    fallCore(f, _fc);
    return {
      S: FALL[0] + f * (FALL[1] - FALL[0]),
      pivot: [_fc.x, _fc.y, _fc.z] as [number, number, number],
      az,
      el,
      dist: D(dist),
      fov,
      pp: [0.5, 0.5] as [number, number],
      roll,
    };
  });
  const flatD = (d: number) => (mob ? d / 0.42 : d);
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
    { S: 2.6, pivot: [0, cY + 0.45, 0], az: -142, el: 9, dist: D(13.5), fov: 33, pp: [0.5, 0.5], roll: -2 },
    { S: 2.85, pivot: [0, cY + 0.35, 0], az: -154, el: 8, dist: D(13.5), fov: 32, pp: pp(0.6, 0.5) },
    // WEBSITES — the exploded view over the cloud sea: loose, then exact.
    { S: 3.15, pivot: [0, cY + 0.2, 0], az: -168, el: 7, dist: D(9.6), fov: 30, pp: pp(0.64, 0.5) },
    { S: 3.45, pivot: [0, cY + 0.12, 0], az: -182, el: 6, dist: D(8.8), fov: 30, pp: pp(0.64, 0.5) },
    { S: 3.8, pivot: [0, cY, 0], az: -196, el: 5, dist: D(9.6), fov: 30, pp: pp(0.64, 0.5) },
    // PLATFORMS — pulled back to hold both: the exploded view above, the
    // first courses landing on the cloud sea below; then craning up the tower
    // as it rises, until it stands whole over the clouds.
    { S: 4.1, pivot: [0, -4.2, 0], az: -210, el: 4, dist: D(30), fov: 34, pp: pp(0.64, 0.5) },
    { S: 4.45, pivot: [0, TC[1] - 1.2, 0], az: -224, el: 1, dist: D(33), fov: 32, pp: pp(0.64, 0.5), roll: 1.5 },
    { S: 4.86, pivot: [TC[0], TC[1] + 1.2, TC[2]], az: -236, el: -8, dist: D(31), fov: 36, pp: pp(0.66, 0.53) },
    // AI AUTOMATION — in close beside the core as it climbs, spiralling up.
    { S: 5.08, pivot: climb(5.08), az: -258, el: 13, dist: aiD(17), fov: 36, pp: pp(0.63, 0.5), roll: -2 },
    { S: 5.45, pivot: climb(5.45), az: -300, el: 8, dist: aiD(16), fov: 36, pp: pp(0.63, 0.5), roll: -3 },
    { S: 5.8, pivot: climb(5.8), az: -342, el: 8, dist: aiD(17.5), fov: 35, pp: pp(0.63, 0.5), roll: -1 },
    { S: 5.97, pivot: [0, TOWER_TOP_Y + 1.2, 0], az: -356, el: 14, dist: D(21), fov: 36, pp: [0.56, 0.5] },
    // …and THE FALL.
    ...fall,
    // TOUCH-DOWN — the camera swings level over the flat as the pieces land…
    { S: LAND_S, pivot: CC, az: -462, el: 12, dist: flatD(64), fov: 36, pp: [0.5, 0.5] },
    // WHY — the colossus built open round the core; the camera flies into it…
    { S: 7.32, pivot: CC, az: -468, el: 3, dist: D(52), fov: 32, pp: pp(0.58, 0.5) },
    { S: 7.62, pivot: CC, az: -474, el: 2, dist: 30, fov: 36, pp: [0.54, 0.5] },
    { S: 7.88, pivot: CC, az: -488, el: 4, dist: 15, fov: 46, pp: [0.5, 0.5], roll: 3 },
    // …round the burning core…
    { S: 8.15, pivot: CC, az: -526, el: 6, dist: 8.6, fov: 50, pp: [0.5, 0.5], roll: 4 },
    { S: 8.4, pivot: CC, az: -586, el: 5, dist: 8.3, fov: 50, pp: [0.5, 0.5], roll: 2 },
    { S: 8.62, pivot: CC, az: -628, el: 4, dist: 10, fov: 46, pp: [0.5, 0.5] },
    // …and out, the glass closing in front of it, the crown seating last.
    { S: 8.9, pivot: CC, az: -640, el: 2, dist: 24, fov: 38, pp: [0.52, 0.5] },
    { S: 9.3, pivot: CC, az: -646, el: 2, dist: D(46), fov: 32, pp: pp(0.6, 0.5) },
    // LET'S TALK — down to the flat's own level: the colossus and its reflection.
    { S: 9.9, pivot: [COL_C.x, FLAT_Y + 1.2, COL_C.z], az: -652, el: 0.6, dist: flatD(108), fov: 30, pp: mob ? [0.5, 0.3] : [0.66, 0.45] },
    { S: M0 + 0.5, pivot: [COL_C.x, FLAT_Y + 1.6, COL_C.z], az: -646, el: 0.6, dist: mob ? flatD(92) : 122, fov: 30, pp: mob ? [0.5, 0.3] : [0.66, 0.42] },
    { S: M0 + 1.25, pivot: [COL_C.x, FLAT_Y + 3.2, COL_C.z], az: -636, el: 1.2, dist: mob ? flatD(100) : 130, fov: 30, pp: mob ? [0.5, 0.28] : [0.68, 0.41] },
  ];
}

/* ------------------------------------------------------------------------ */
/* Hermite spline over the key channels                                      */
/* ------------------------------------------------------------------------ */

/** Channels: pivot xyz, az, el, log visible height, fov, pp x/y, roll. */
const NCH = 10;
type Spline = { S: number[]; v: number[][]; m: number[][] };

function toChannels(k: Key): number[] {
  return [k.pivot[0], k.pivot[1], k.pivot[2], k.az, k.el, Math.log(heightOf(k)), k.fov, k.pp[0], k.pp[1], k.roll ?? 0];
}

/**
 * MONOTONE tangents (Fritsch–Butland, weighted harmonic mean of the two
 * secants over non-uniform spacing): the path is C1 through every key and no
 * channel ever overshoots one — a fast move lands on the next frame instead of
 * sinking past it. A key that turns a channel round, or equals a neighbour (a
 * HOLD), gets a zero tangent there.
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
/** Where the camera passes down through the top of the cloud deck (S). */
let crossS = 6.6;
const _cp = new THREE.Vector3();
const _pv = new THREE.Vector3();

function splineFor(L: Layout): Spline {
  const id = `${L.vw}x${L.vh}:${L.mode}:${L.hero.dist.toFixed(3)}`;
  if (id !== cachedFor || !spline) {
    cachedFor = id;
    spline = buildSpline(keys(L));
    // The places change exactly where the lens goes through the cloud top.
    crossS = FALL[1] - 0.2;
    for (let S = FALL[0]; S <= FALL[1]; S += 0.004) {
      const r = sampleSpline(spline, S, _crossRow);
      const c = Math.exp(r[5]) / (2 * Math.tan((r[6] * DEG) / 2));
      orbitPos(_pv.set(r[0], r[1], r[2]), r[3] * DEG, r[4] * DEG, c, _cp);
      if (_cp.y < CLOUD_Y) {
        crossS = S;
        break;
      }
    }
  }
  return spline;
}
const _crossRow = new Array<number>(NCH).fill(0);

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
  c.roll = (r[9] ?? 0) * DEG;
  orbitPos(c.pivot, c.az, c.el, c.dist, c.pos);
  c.target.copy(c.pivot);
}

/**
 * Fill every scroll-driven field of sceneState (+ the fragment blend plan).
 * Pure in (S, L) except for reading ui.focusTier.
 */
export function evaluate(S: number, _time: number, L: Layout, out: SceneState): void {
  writeCamera(sampleSpline(splineFor(L), S), out);
  out.cam.cut = false;
  const u = out.u;
  const env = out.env;

  /* ---- the stone: where it stands, how big, how turned ----------------- */
  plan.lift = 0.22 * Math.sin(Math.PI * easeInOutSine(range(S, 0.05, 0.7)));
  plan.cut = false;
  const landed = S >= LAND_S - 0.02;
  if (!landed) {
    plan.home.set(0, 0, 0);
    plan.K = 1;
  } else {
    plan.home.copy(COL_HOME);
    plan.K = COL_K;
  }
  // At rest on the flat it lifts off its reflection, a little, for the last word.
  const float = smoother(range(S, 9.9, M0 + 1.0));
  if (landed) plan.home.y += 0.3 * COL_K * float;
  out.stone.home.copy(plan.home);
  if (S < 1.2) out.stone.home.y = plan.lift;
  out.stone.scale = plan.K;
  out.stone.visible = true;
  // One continuous turn: the hero's, the statement's, the exploded view's; the
  // colossus lands showing a corner (like the hero), and turns slowly at the end.
  plan.yaw = landed
    ? (260 + 30 * smoother(range(S, 9.3, M0 + 1.2))) * DEG
    : (20 - 80 * smoother(range(S, 0.05, 0.7)) - 40 * smoother(range(S, 1.0, 2.2)) - 50 * smoother(range(S, 3.0, 3.9))) * DEG;
  // The tower turns slowly as it is built, and a little more as it works.
  plan.towerYaw = (-24 + 34 * smoother(range(S, BUILD_S0, AI[1]))) * DEG;
  plan.explode = 1;
  plan.exact = smoother(range(S, EXACT[0], EXACT[1]));
  plan.ai = range(S, AI[0], AI[1]);
  plan.fall = range(S, FALL[0], FALL[1]);
  plan.impact = S >= LAND_S ? Math.exp(-(S - LAND_S) / 0.12) : 0;

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
  for (let k = 0; k <= COURSES; k++) {
    const a = k < COURSES ? BUILD_S0 + COURSE_STEP * k : ROOF_S;
    plan.course[k] = range(S, a, a + COURSE_LEN);
  }
  plan.discipline = S < DISCIPLINE_S[0] || S >= DISCIPLINE_S[3] ? -1 : S < DISCIPLINE_S[1] ? 0 : S < DISCIPLINE_S[2] ? 1 : 2;

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
    plan.swirl = 0.5;
    plan.swirlC.set(0, STONE.centerY, 0);
    plan.arc = 0.25;
    plan.glowMode = 3;
  } else if (S < BUILD_S0) {
    // …then exact (plan.exact), and held, breathing.
    set("F4", "F4", 0, 0);
    plan.glowMode = 3;
    plan.explode = 1 - 0.06 * smoother(range(S, EXACT[1], BUILD_S0));
  } else if (S < BUILD_END) {
    // PLATFORMS: the tower, course by course from the foot up; the roof last.
    set("F4", "F2", 0, 2);
    plan.explode = 0.94;
    plan.swirl = 0.9;
    plan.swirlC.set(TOWER_C.x, 0, TOWER_C.z);
    plan.arc = 0.22;
    plan.glowMode = 1;
  } else if (S < FALL[0]) {
    // The tower stands; the AI works up it (plan.ai).
    set("F2", "F2", 0, 0);
    plan.glowMode = 1;
    plan.complete = smoother(range(S, BUILD_END - 0.05, BUILD_END + 0.08));
  } else if (S < SEAT[0]) {
    // THE FALL: the tower unravels after the core, roof first.
    set("F2", "F3", range(S, UNRAVEL[0], UNRAVEL[1]), 8);
    plan.ai = 1;
    plan.swirl = 1.4;
    plan.swirlC.set(TOWER_C.x, 0, TOWER_C.z);
    plan.arc = 0.2;
    plan.glowMode = 4;
    plan.complete = 1;
  } else {
    // THE COLOSSUS: built open round the core, from the point up; then closed.
    plan.fall = 1;
    const seat = range(S, SEAT[0], SEAT[1]);
    plan.open = 1 - smoother(range(S, CLOSE[0], CLOSE[1]));
    if (seat < 1) {
      set("F3", "F7", seat, 9);
      plan.swirl = 1.1;
      plan.swirlC.set(COL_C.x, 0, COL_C.z);
      plan.arc = 0.18;
    } else set("F7", "F7", 0, 0);
    plan.glowMode = 6;
  }
  out.formation.a = plan.a;
  out.formation.b = plan.b;
  out.formation.mix = plan.mix;

  /* ---- places --------------------------------------------------------- */
  // The sky rolls in with the shatter and is left behind in the cloud deck;
  // the flat comes up out of it.
  env.mirror = 1 - smoother(range(S, 2.35, 2.62));
  // The sea hands over to the veil and the deck just before the lens reaches it.
  env.sky = smoother(range(S, 2.4, 2.85)) * (1 - smoother(range(S, crossS - 0.09, crossS - 0.015)));
  // Through the deck: a veil, never a white-out — the spiral stays in view.
  env.inCloud = 0.42 * bump(S, crossS - 0.1, crossS + 0.02, crossS + 0.13);
  env.flat = smoother(range(S, crossS + 0.02, crossS + 0.14));
  env.flood = 0;
  env.floodX = 0.5;
  env.floodY = 0.5;
  env.ripple = range(S, LAND_S, LAND_S + 0.9);
  env.hole = smoother(range(S, 6.28, 6.5)) * (1 - smoother(range(S, crossS + 0.1, crossS + 0.2)));
  env.lake = 0;
  env.plain = 0;
  env.void = 0;
  env.floodLight = 0;

  /* ---- material uniforms --------------------------------------------- */
  // Mark seams: they wake in the pass, burn before the shatter, flare on
  // touch-down, and draw the colossus at rest.
  let seam = 0.35 * range(S, 0.5, 0.62) * (1 - range(S, 1.0, 1.3)) + 0.9 * bump(S, 1.95, 2.2, 2.4);
  if (landed) seam = 0.9 * plan.impact + 0.55 * smoother(range(S, 9.2, 9.9));
  u.seam = seam;
  u.levelSeam = 0;

  // The cut faces: windows onto the light inside once the stone is open.
  let glow = 0.4 * range(S, 2.0, 2.25);
  if (S >= SHATTER[0] && S < FALL[0]) glow = 1;
  if (S >= FALL[0]) glow = landed ? 0.3 + 0.35 * plan.open : 0.8;
  u.cutGlow = glow;
  u.spill = landed ? 0.35 * smoother(range(S, 9.3, 9.9)) : 0.5 * bump(S, 2.0, 2.25, 2.5);

  // Fog as alpha: the sky is clear air (the tower must read whole at 40 units);
  // the flat stretches to a far horizon.
  u.fogNear = lerp(lerp(60, 70, env.sky), 160, env.flat);
  u.fogFar = lerp(lerp(90, 150, env.sky), 560, env.flat);

  u.vein = 1 + 0.9 * Math.sin(Math.PI * range(S, 0.3, 0.9)) + 0.6 * bump(S, 1.7, 2.2, 2.5);
  u.dusk = 0;
  u.inner = 0.32 + 0.3 * Math.sin(Math.PI * range(S, 0.3, 0.9)) + (landed ? 0.12 * plan.open + 0.25 * smoother(range(S, 9.6, M0 + 0.6)) : 0);
  u.floors = 0;
  u.wake = landed ? 0.18 * smoother(range(S, 9.9, M0 + 0.8)) : 0.35 * bump(S, 1.9, 2.2, 2.45);
  // A band of light rising through the glass: a scan through the exploded view
  // as it snaps exact, through the tower when its roof is laid, and through the
  // colossus as its crown seats.
  if (S > EXACT[0] - 0.05 && S < EXACT[1] + 0.2) {
    u.riseY = lerp(-2.2, 1.3, range(S, EXACT[0], EXACT[1] + 0.1));
    u.riseAmp = 0.9 * bump(S, EXACT[0] - 0.04, EXACT[0] + 0.08, EXACT[1] + 0.15);
  } else if (landed && S > CLOSE[1] - 0.3) {
    u.riseY = lerp(-2.0, 1.1, range(S, CLOSE[1] - 0.2, CLOSE[1] + 0.2));
    u.riseAmp = bump(S, CLOSE[1] - 0.22, CLOSE[1] - 0.05, CLOSE[1] + 0.25) * 1.2;
  } else {
    u.riseY = -2;
    u.riseAmp = 0;
  }
  // The mirror: the studio's floor; the flat is a mirror too, deepest at the end.
  u.reflect = Math.max(env.mirror, env.flat * (1 + 1.8 * smoother(range(S, 9.4, 10.0))));
  u.reflLen = landed ? lerp(1.1, 3.4, smoother(range(S, 9.4, 10.0))) : 1.1;
  u.floorY = S > FALL[0] ? FLAT_Y : STONE.floorY;
  u.mistAlpha = 1 - range(S, 0.3, 0.8);
  u.mistClipY = L.hero.mistClipY;
  u.cursorLight = S > 2.3 && S < 6.3 ? 4 : 8;

  /* ---- chapter hooks ------------------------------------------------- */
  out.tiers.visible = false;
  out.tiers.focus = ui.focusTier;

  /* ---- no bookend clip; the mark lock is retired ---------------------- */
  out.clip.active = false;
  out.mark.lock = 0;
}
