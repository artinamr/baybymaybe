import * as THREE from "three";
import type { Layout } from "./layout";
import type { Formation, SceneState } from "./sceneState";
import { ui } from "./stores";
import { DEG, easeInOutSine, lerp, range } from "./ease";
import { STONE } from "./geo/types";
import { chapter } from "./chapters";
import { devNum } from "./dev";
import { aiCore, COL_C, COL_HOME, COL_K, FLAT_Y, LIFT_Y, STEPS, TOWER_C, TOWER_K, TOWER_TOP_Y, stairStepY } from "./formations";

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
 *                 stone lifts off its heart and CLIMBS, laying its splinters
 *                 one by one as the steps of a spiral stair round it, the
 *                 crown settling last as the roof. AI automation: the heart
 *                 climbs the stair it was built round; every step it passes
 *                 turns into a blade — the stair becomes a turbine, running.
 *   THE GATHER    the core drops back down the well and the stair winds itself
 *                 round it — from the foot up — into ONE colossal stone.
 *   WHY NERODYN   the colossus, open, with the camera inside, round the burning
 *                 heart — closing as the camera pulls out, the crown last.
 *   LET'S TALK    down to the floor's own level: the colossus and its
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
  /** F1: how far into the burst's slow-motion drift (0..1). */
  burstT: 0,
  /** F4: how far apart the exploded view is held, and how exact (0 loose → 1). */
  explode: 1,
  exact: 1,
  /** F2: how far the AI has worked up the stair (0..1). */
  ai: 0,
  /** F2 build: the step being laid right now (continuous; −1.5 before the first, past STEPS for the roof). */
  front: -2,
  /** F7: how open the colossus is (0..1). */
  open: 0,
  /** Retired (no cuts any more); kept for the story film. */
  cut: false,
  /** Stone rotation (radians). */
  yaw: 20 * DEG,
  /** The tower's own slow turn (radians). */
  towerYaw: 0,
  /** Glow recipe: 0 plain · 1 the stair · 3 exploded · 6 colossus */
  glowMode: 0,
  /** Transitions SPIRAL: swept round the vertical axis through `swirlC` by swirl·sin(π·progress). */
  swirl: 0,
  swirlC: new THREE.Vector3(),
  /** 0..1 the stair's roof laid. */
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
/** The stair: the stone climbs, laying a step as it passes each one's height; the roof last. */
const BUILD = [3.9, 4.84];
/** The AI works up the stair. */
const AI = [4.97, 5.92];
/** The gather: the stair winds itself round the core into the open colossus. */
const GATHER = [5.98, 7.34];
/** Where the colossus's shot begins (the WHY section). */
export const LAND_S = 7.05;
const CLOSE = [8.55, 9.2];
/** Where the climbing stone's origin is (world y) while it lays the stair (front = the step being laid). */
function climbHomeY(front: number): number {
  // Hovering a little over the step it is laying; never lower than it stood
  // (a smooth max, so it lifts off without a kink).
  const y = stairStepY(front) + 1.4 - STONE.centerY;
  const w = 1.2;
  const h = Math.max(w - Math.abs(y - LIFT_Y), 0) / w;
  return Math.max(y, LIFT_Y) + h * h * w * 0.25;
}
/** The step being laid at S (continuous). */
function frontAt(S: number): number {
  return lerp(-1.6, STEPS + 3.3, easeInOutSine(range(S, BUILD[0], BUILD[1])));
}

/** The three disciplines' windows in S (the text beats follow them). */
export const DISCIPLINE_S = [2.95, 3.95, 4.97, 6.0];
/** The three WHY claims' windows in S. */
export const WHY_S = [7.05, 7.85, 8.45, 9.3];

export const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Look-dev: `?rim=` overrides the white-room rim. */
const DEV_RIM = devNum("rim");
const DEV_CRISP = devNum("crisp");

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
  const lY = cY + LIFT_Y;
  const TC: [number, number, number] = [TOWER_C.x, TOWER_C.y, TOWER_C.z];
  const CC: [number, number, number] = [COL_C.x, COL_C.y, COL_C.z];
  // The build: the camera rises with the climbing stone, looking a little
  // below it at the steps it lays. The AI: it rides over the core, looking
  // down the stair. (On a phone the text owns the lower half: the whole stair
  // in the top band, not a chase.)
  const riser = (S: number, dy: number): [number, number, number] => {
    if (mob) return [TOWER_C.x, TOWER_C.y, TOWER_C.z];
    return [0, climbHomeY(frontAt(S)) + STONE.centerY + dy, 0];
  };
  const climb = (S: number, dy: number): [number, number, number] => {
    if (mob) return [TOWER_C.x, TOWER_C.y + 1, TOWER_C.z];
    aiCore(range(S, AI[0], AI[1]), _fc);
    return [0, _fc.y + dy, 0];
  };
  const upD = (d: number) => (mob ? 92 : d);
  const aiD = (d: number) => (mob ? 64 : d);
  const floorD = (d: number) => (mob ? d / 0.42 : d);
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
    // THE SHATTER — the camera DIVES INTO the burst: pieces slide past the
    // lens (the lens softens them), the core sharp at the centre, the camera
    // turning round it — then draws back as the burst finds its order.
    { S: 2.45, pivot: [0, lY, 0], az: -150, el: 5, dist: D(5.4), fov: 38, pp: [0.5, 0.5], roll: -2 },
    { S: 2.7, pivot: [0, lY, 0], az: -178, el: 3, dist: D(4.3), fov: 42, pp: [0.5, 0.5], roll: -3 },
    { S: 2.95, pivot: [0, lY, 0], az: -196, el: 5, dist: D(6.2), fov: 36, pp: pp(0.56, 0.5), roll: -1 },
    // WEBSITES — the exploded view, a turntable: loose, then exact.
    { S: 3.2, pivot: [0, lY, 0], az: -206, el: 6, dist: D(8.8), fov: 30, pp: pp(0.64, 0.5) },
    { S: 3.45, pivot: [0, lY, 0], az: -214, el: 6, dist: D(8.9), fov: 30, pp: pp(0.64, 0.5) },
    { S: 3.8, pivot: [0, lY - 0.1, 0], az: -224, el: 5, dist: D(9.6), fov: 30, pp: pp(0.64, 0.5) },
    // PLATFORMS — the stone lifts off its heart and climbs, laying a step as
    // it passes each one's height; the camera rises with it, then
    // cranes up over the top as the last is laid, and looks down the spiral.
    { S: 4.02, pivot: [0, lY - 0.2, 0], az: -232, el: 8, dist: D(12), fov: 34, pp: pp(0.64, 0.5) },
    { S: 4.15, pivot: riser(4.15, -1.2), az: -244, el: 10, dist: upD(14), fov: 36, pp: pp(0.64, 0.5) },
    { S: 4.35, pivot: riser(4.35, -1.4), az: -262, el: 10, dist: upD(15), fov: 36, pp: pp(0.64, 0.5), roll: -1 },
    { S: 4.55, pivot: riser(4.55, -1.5), az: -280, el: 11, dist: upD(15), fov: 36, pp: pp(0.64, 0.5), roll: -1 },
    { S: 4.72, pivot: riser(4.72, -1.5), az: -292, el: 12, dist: upD(16), fov: 36, pp: pp(0.64, 0.5) },
    // …the whole stair from above: a spiral of glass down to the light at its foot.
    { S: 4.9, pivot: [TC[0], TC[1] - 3, TC[2]], az: -306, el: 56, dist: upD(36), fov: 40, pp: pp(0.64, 0.5) },
    // AI AUTOMATION — the camera climbs over the stair and looks DOWN it at
    // the light at its foot; the light rises toward the lens through the
    // spiral, every step turning into a blade as it passes, the camera turning
    // with it — a vortex.
    { S: 5.08, pivot: climb(5.08, 0), az: -318, el: 44, dist: aiD(24), fov: 40, pp: pp(0.63, 0.5) },
    { S: 5.35, pivot: climb(5.35, 0), az: -342, el: 60, dist: aiD(21), fov: 42, pp: pp(0.63, 0.5) },
    { S: 5.6, pivot: climb(5.6, 0), az: -372, el: 66, dist: aiD(20), fov: 42, pp: pp(0.63, 0.5) },
    { S: 5.84, pivot: climb(5.84, 0), az: -396, el: 58, dist: aiD(22), fov: 40, pp: pp(0.62, 0.5) },
    { S: 5.97, pivot: mob ? [TC[0], TC[1] + 1, TC[2]] : [0, TOWER_TOP_Y, 0], az: -406, el: 36, dist: mob ? 70 : 27, fov: 38, pp: pp(0.56, 0.5) },
    // THE GATHER — the core drops back down the well and the stair winds
    // itself round it into the colossus, from the foot up; the camera draws
    // back and down, circling…
    { S: 6.18, pivot: [0, mob ? 11 : 11.5, 0], az: -420, el: 13, dist: mob ? 96 : 46, fov: 36, pp: pp(0.56, 0.5), roll: -2 },
    { S: 6.6, pivot: [0, 10, 0], az: -448, el: 8, dist: mob ? 100 : 52, fov: 35, pp: pp(0.56, 0.5), roll: -1 },
    { S: LAND_S, pivot: CC, az: -486, el: 5, dist: floorD(58), fov: 34, pp: pp(0.56, 0.5) },
    { S: 7.32, pivot: CC, az: -494, el: 3, dist: D(46), fov: 33, pp: pp(0.57, 0.5) },
    // …flies into it…
    { S: 7.62, pivot: CC, az: -502, el: 2, dist: 28, fov: 36, pp: [0.54, 0.5] },
    { S: 7.88, pivot: CC, az: -516, el: 4, dist: 15, fov: 46, pp: [0.5, 0.5], roll: 2.5 },
    // …round the burning core…
    { S: 8.15, pivot: CC, az: -554, el: 6, dist: 8.6, fov: 50, pp: [0.5, 0.5], roll: 3 },
    { S: 8.4, pivot: CC, az: -614, el: 5, dist: 8.3, fov: 50, pp: [0.5, 0.5], roll: 1.5 },
    { S: 8.62, pivot: CC, az: -656, el: 4, dist: 10, fov: 46, pp: [0.5, 0.5] },
    // …and out, the glass closing in front of it, the crown seating last.
    { S: 8.9, pivot: CC, az: -668, el: 2, dist: 24, fov: 38, pp: [0.52, 0.5] },
    { S: 9.08, pivot: [CC[0], CC[1] + 1.2, CC[2]], az: -671, el: 2, dist: D(35), fov: 34, pp: pp(0.57, 0.5) },
    { S: 9.3, pivot: CC, az: -674, el: 2, dist: D(46), fov: 32, pp: pp(0.6, 0.5) },
    // LET'S TALK — down to the floor's own level: the colossus and its reflection.
    { S: 9.9, pivot: [COL_C.x, FLAT_Y + 1.2, COL_C.z], az: -680, el: 0.6, dist: floorD(108), fov: 30, pp: mob ? [0.5, 0.3] : [0.66, 0.47] },
    { S: M0 + 0.5, pivot: [COL_C.x, FLAT_Y + 1.6, COL_C.z], az: -674, el: 0.6, dist: mob ? floorD(92) : 118, fov: 30, pp: mob ? [0.5, 0.3] : [0.66, 0.47] },
    { S: M0 + 1.25, pivot: [COL_C.x, FLAT_Y + 3.2, COL_C.z], az: -664, el: 1.2, dist: mob ? floorD(100) : 126, fov: 30, pp: mob ? [0.5, 0.28] : [0.68, 0.45] },
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
  // From the gather on, the stone's frame is the colossus's.
  const landed = S >= GATHER[0];
  plan.front = frontAt(S);
  if (!landed) {
    // It rises off its reflection as it breaks, and holds there, opened; then
    // it climbs, laying the stair.
    plan.home.set(0, LIFT_Y * smoother(range(S, 2.2, 2.9)), 0);
    if (S > BUILD[0]) plan.home.y = climbHomeY(plan.front);
    plan.K = 1;
  } else {
    plan.home.copy(COL_HOME);
    plan.K = COL_K;
  }
  // At rest on the floor it lifts off its reflection, a little, for the last word.
  const float = smoother(range(S, 9.9, M0 + 1.0));
  if (landed) plan.home.y += 0.3 * COL_K * float;
  out.stone.home.copy(plan.home);
  if (S < 1.2) out.stone.home.y = plan.lift;
  // The size the floor sees (its shadow, its reflection's reach).
  out.stone.scale = landed ? COL_K : S > BUILD[0] ? TOWER_K : 1;
  out.stone.visible = true;
  // One continuous turn: the hero's, the statement's, the exploded view's —
  // and as it climbs it turns like a drill, one full turn, laying the stair;
  // the colossus stands showing a corner (like the hero), and turns slowly at
  // the end.
  plan.yaw = landed
    ? (232 + 30 * smoother(range(S, 9.3, M0 + 1.2))) * DEG
    : (20 - 80 * smoother(range(S, 0.05, 0.7)) - 40 * smoother(range(S, 1.0, 2.2)) - 50 * smoother(range(S, 3.0, 3.9)) - 360 * smoother(range(S, BUILD[0], BUILD[1] + 0.04))) * DEG;
  // The stair turns a little as it works.
  plan.towerYaw = 8 * smoother(range(S, AI[0], AI[1])) * DEG;
  plan.explode = 1;
  plan.exact = smoother(range(S, EXACT[0], EXACT[1]));
  plan.burstT = range(S, SHATTER[0] + 0.12, EXPLODE[1]);
  plan.ai = range(S, AI[0], AI[1]);
  plan.impact = 0;

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
  } else if (S < BUILD[0]) {
    // …then exact (plan.exact), and held, breathing.
    set("F4", "F4", 0, 0);
    plan.glowMode = 3;
    plan.explode = 1 - 0.06 * smoother(range(S, EXACT[1], BUILD[0]));
  } else if (plan.front < STEPS + 3.2) {
    // PLATFORMS: the stone climbs, laying a step as it passes each one's
    // height (plan.front); the roof last; its heart left at the foot.
    set("F4", "F2", 0, 2);
    plan.explode = 0.94 - 0.14 * smoother(range(S, BUILD[0], BUILD[0] + 0.2));
    plan.swirl = 0.7;
    plan.swirlC.set(TOWER_C.x, 0, TOWER_C.z);
    plan.arc = 0.12;
    plan.glowMode = 1;
  } else if (S < GATHER[0]) {
    // The stair stands; the AI works up it (plan.ai).
    set("F2", "F2", 0, 0);
    plan.glowMode = 1;
    plan.complete = 1;
  } else {
    // THE GATHER: the stair winds itself round the core into the colossus,
    // open, from the point up; WHY: flown into, round, and closed.
    const seat = range(S, GATHER[0], GATHER[1]);
    plan.ai = 1;
    plan.complete = 1;
    plan.open = 1 - smoother(range(S, CLOSE[0], CLOSE[1]));
    if (seat < 1) {
      set("F2", "F7", seat, 9);
      plan.swirl = 1.5;
      plan.swirlC.set(COL_C.x, 0, COL_C.z);
      plan.arc = 0.15;
    } else set("F7", "F7", 0, 0);
    plan.glowMode = 6;
  }
  out.formation.a = plan.a;
  out.formation.b = plan.b;
  out.formation.mix = plan.mix;

  /* ---- the place: the studio, all the way ---------------------------- */
  // Paper and a mirror floor. After the hero the page shows a faint cove (the
  // floor meeting the backdrop) and a soft pool of light behind the subject.
  env.mirror = 1;
  env.sky = 0;
  env.inCloud = 0;
  env.flat = 0;
  env.flood = 0;
  env.floodX = 0.5;
  env.floodY = 0.5;
  env.ripple = 0;
  env.hole = 0;
  env.cove = smoother(range(S, 2.3, 2.9));
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

  // The cut faces: dark polished windows, only a whisper of the light inside
  // (a lit cut face reads as flat purple — "a 90s game").
  let glow = 0.4 * range(S, 2.0, 2.25);
  if (S >= SHATTER[0] && S < GATHER[0]) glow = 0.32;
  if (landed) glow = 0.22 + 0.2 * plan.open;
  u.cutGlow = glow;
  u.spill = landed ? 0.35 * smoother(range(S, 9.3, 9.9)) : 0.5 * bump(S, 2.0, 2.25, 2.5);

  // Fog as alpha: never on the subject — only far behind it.
  u.fogNear = Math.max(60, out.cam.dist * 1.8);
  u.fogFar = Math.max(90, out.cam.dist * 3.6);

  u.vein = 1 + 0.9 * Math.sin(Math.PI * range(S, 0.3, 0.9)) + 0.6 * bump(S, 1.7, 2.2, 2.5);
  u.dusk = 0;
  u.inner = 0.32 + 0.3 * Math.sin(Math.PI * range(S, 0.3, 0.9)) + (landed ? 0.12 * plan.open + 0.25 * smoother(range(S, 9.6, M0 + 0.6)) : 0);
  u.floors = 0;
  // (The glow that fills the stone before it breaks is gone by the time the
  // pieces part — carried out on them it read as flat purple.)
  u.wake = landed ? 0.18 * smoother(range(S, 9.9, M0 + 0.8)) : 0.35 * bump(S, 1.9, 2.2, 2.31);
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
  // The mirror: the studio's floor, deepest at the end.
  u.reflect = 1 + (landed ? 1.6 * smoother(range(S, 9.4, 10.0)) : 0);
  u.reflLen = landed ? lerp(1.1, 3.0, smoother(range(S, 9.4, 10.0))) : 1.1;
  u.floorY = FLAT_Y;
  // The white room on the glass's grazing faces — from the break on.
  u.rim = (DEV_RIM ?? 0.1) * smoother(range(S, 2.15, 2.45));
  u.crisp = (DEV_CRISP ?? 1) * smoother(range(S, 2.2, 2.45));
  u.mistAlpha = 1 - range(S, 0.3, 0.8);
  u.mistClipY = L.hero.mistClipY;
  u.cursorLight = S > 2.3 && S < 6.3 ? 4 : 8;

  /* ---- the lens ------------------------------------------------------ */
  // No depth of field in the hero and the statement (they are liked exactly
  // as they are); from the break on, a lens — stronger in the close passes.
  let ap = 0;
  if (S > 2.15) {
    ap = 8.5 * smoother(range(S, 2.15, 2.4));
    ap = lerp(ap, 4.5, smoother(range(S, 3.0, 3.4)));
    ap = lerp(ap, 3, smoother(range(S, 3.9, 4.2)));
    ap = lerp(ap, 7, smoother(range(S, 4.95, 5.15)));
    ap = lerp(ap, 8, smoother(range(S, 5.9, 6.2)));
    ap = lerp(ap, 5, smoother(range(S, 6.9, 7.2)));
    ap = lerp(ap, 9, smoother(range(S, 7.7, 7.95)));
    ap = lerp(ap, 4, smoother(range(S, 8.7, 9.1)));
    ap = lerp(ap, 2, smoother(range(S, 9.4, 9.9)));
  }
  out.cam.aperture = ap;

  /* ---- chapter hooks ------------------------------------------------- */
  out.tiers.visible = false;
  out.tiers.focus = ui.focusTier;

  /* ---- no bookend clip; the mark lock is retired ---------------------- */
  out.clip.active = false;
  out.mark.lock = 0;
}
