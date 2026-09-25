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
  /** Ease INTO this key from the previous one. */
  ease?: (t: number) => number;
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
  crownLift: 0,
  bandLift: 0,
  split: 0,
  /** Stone rotation for stone-relative forms (radians). */
  yaw: 20 * DEG,
  pitch: 0,
  /** Glow mode for per-fragment cut glow: 0 uniform · 1 tier focus · 2 seating heal · 3 mark */
  glowMode: 0,
  /** F5 window start (seating) and per-group length, in S. */
  seatS0: 10.6,
  seatLen: 0.225,
  /** ch05 seating progress per group (0..1) for flashes/heal. */
  seat: [0, 0, 0, 0],
};

const HOME_B_Z = -52;
const CORRIDOR = { z0: 4.0, z1: -41, y0: 1.3, y1: 0.4, S0: 8.2, S1: 10.1 };
const STATIONS_Z = [-14, -22, -30, -38];

function heightOf(k: { dist: number; fov: number }) {
  return 2 * k.dist * Math.tan((k.fov * DEG) / 2);
}

function keys(L: Layout): Key[] {
  const mob = L.mode === "mobile";
  const heroD = L.hero.dist;
  const heroPP = L.hero.pp;
  // Mobile: the 3D lives in a top band (pp y 0.30), framed 0.55× as tall.
  const pp = (x: number, y: number): [number, number] => (mob ? [0.5, 0.3] : [x, y]);
  const D = (d: number) => (mob ? d / 0.55 : d);
  return [
    { S: 0, pivot: [0, STONE.centerY, 0], az: 0, el: 4, dist: heroD, fov: 30, pp: heroPP },
    { S: 1.0, pivot: [0, STONE.centerY, 0], az: 0, el: 4, dist: heroD * 0.97, fov: 30, pp: heroPP },
    { S: 1.7, pivot: [mob ? 0 : 1.8, STONE.centerY, 0], az: -12, el: 8, dist: D(8.0), fov: 30, pp: pp(0.62, 0.5), ease: easeInOutSine },
    { S: 3.4, pivot: [0, -0.1, 0], az: 24, el: 13, dist: D(11), fov: 28, pp: pp(0.66, 0.52), ease: easeInOutSine },
    { S: 4.6, pivot: [0, -0.1, 0], az: 40, el: 22, dist: D(11), fov: 28, pp: pp(0.66, 0.5), ease: easeInOutSine },
    { S: 5.9, pivot: [0, 0, 0], az: -70, el: 7, dist: D(10.7), fov: 30, pp: pp(0.31, 0.5), ease: easeInOutCubic },
    { S: 7.2, pivot: [0, 0, 0], az: 0, el: 7, dist: D(10.7), fov: 30, pp: pp(0.31, 0.5), ease: easeInOutSine },
    // 7.2 → 10.6 is the corridor (position-driven), handled below.
    { S: 10.6, pivot: [0, STONE.centerY, HOME_B_Z], az: 10, el: 9, dist: D(7.7), fov: 30, pp: pp(0.66, 0.52), ease: easeInOutSine },
    { S: 11.6, pivot: [0, STONE.centerY, HOME_B_Z], az: 90, el: 15, dist: D(7.3), fov: 30, pp: pp(0.66, 0.52), ease: easeInOutSine },
    { S: 12.6, pivot: [0, STONE.centerY, HOME_B_Z], az: 90, el: 20, dist: D(L.fit(0.62, 30)), fov: 30, pp: pp(0.66, 0.5), ease: easeInOutSine },
    { S: 12.8, pivot: [0, STONE.centerY, HOME_B_Z], az: 90, el: 26, dist: D(L.fit(0.62, 24)), fov: 24, pp: pp(0.66, 0.5), ease: easeInOutSine },
    { S: 12.96, pivot: [0, STONE.centerY, HOME_B_Z], az: 90, el: 26, dist: D(L.fit(0.62, 24)), fov: 24, pp: pp(0.66, 0.5) },
    { S: 13.15, pivot: [0, -0.741, HOME_B_Z], az: 90, el: 32.91, dist: D(12.79), fov: 16, pp: pp(0.66, 0.46), ease: easeInOutSine },
    { S: 13.5, pivot: [0, -0.741, HOME_B_Z], az: 90, el: 32.91, dist: D(12.79), fov: 16, pp: pp(0.66, 0.46) },
    { S: 13.8, pivot: [0, -0.741, HOME_B_Z], az: 90, el: 32.91, dist: D(17.9), fov: 16, pp: mob ? [0.5, 0.36] : [0.71, 0.395], ease: easeInOutCubic },
  ];
}

let cachedFor = "";
let cachedKeys: Key[] = [];

function keysFor(L: Layout): Key[] {
  const id = `${L.vw}x${L.vh}:${L.mode}:${L.hero.dist.toFixed(3)}`;
  if (id !== cachedFor) {
    cachedFor = id;
    cachedKeys = keys(L);
  }
  return cachedKeys;
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

function orbitPos(pivot: THREE.Vector3, az: number, el: number, dist: number, out: THREE.Vector3) {
  return out.set(
    pivot.x + dist * Math.sin(az) * Math.cos(el),
    pivot.y + dist * Math.sin(el),
    pivot.z + dist * Math.cos(az) * Math.cos(el)
  );
}

/** Camera z along the ch04 corridor, keyed so each station stands beside its row. */
function corridorZ(S: number): number {
  const rs = measured.rowS;
  const pts: [number, number][] = [[CORRIDOR.S0, CORRIDOR.z0]];
  if (rs.length === 4 && rs.every((v, i) => i === 0 || v > rs[i - 1])) {
    rs.forEach((r, i) => pts.push([THREE.MathUtils.clamp(r, CORRIDOR.S0 + 0.05, CORRIDOR.S1 - 0.05), STATIONS_Z[i] + 7]));
  } else {
    STATIONS_Z.forEach((z, i) => pts.push([lerp(CORRIDOR.S0, CORRIDOR.S1, (i + 1) / 5), z + 7]));
  }
  pts.push([CORRIDOR.S1, CORRIDOR.z1]);
  if (S <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    if (S <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], easeInOutSine((S - pts[i][0]) / Math.max(1e-4, pts[i + 1][0] - pts[i][0])));
  }
  return pts[pts.length - 1][1];
}

function corridor(S: number, pos: THREE.Vector3, target: THREE.Vector3) {
  const z = corridorZ(S);
  const k = clamp01((z - CORRIDOR.z0) / (CORRIDOR.z1 - CORRIDOR.z0));
  pos.set(0.25 * Math.sin(0.18 * z), lerp(CORRIDOR.y0, CORRIDOR.y1, k), z);
  target.set(pos.x + 0.8, pos.y - 0.3, pos.z - 10);
}

function writeOrbit(out: SceneState, k: { pivot: number[]; az: number; el: number; dist: number; fov: number; pp: number[] }) {
  const c = out.cam;
  c.path = false;
  c.pivot.set(k.pivot[0], k.pivot[1], k.pivot[2]);
  c.az = k.az * DEG;
  c.el = k.el * DEG;
  c.dist = k.dist;
  c.fov = k.fov;
  c.ppx = k.pp[0];
  c.ppy = k.pp[1];
  orbitPos(c.pivot, c.az, c.el, c.dist, c.pos);
  c.target.copy(c.pivot);
}

const tmpKey = { pivot: [0, 0, 0], az: 0, el: 0, dist: 0, fov: 30, pp: [0.5, 0.5] };

function evalCamera(S: number, L: Layout, out: SceneState) {
  const K = keysFor(L);
  const c = out.cam;
  const k72 = K.find((k) => k.S === 7.2)!;
  const k106 = K.find((k) => k.S === 10.6)!;

  // The corridor: orbit → path (7.2–8.2), path (8.2–10.1), path → orbit (10.1–10.6).
  if (S > 7.2 && S < 10.6) {
    const fovPath = 34;
    const ppPath: [number, number] = L.mode === "mobile" ? [0.5, 0.34] : [0.7, 0.48];
    c.path = true;
    c.roll = 0;
    if (S < 8.2) {
      const t = easeInOutSine(range(S, 7.2, 8.2));
      writeOrbit(out, k72);
      _a.copy(c.pos);
      _b.copy(c.target);
      corridor(8.2, c.pos, c.target);
      c.pos.lerpVectors(_a, c.pos, t);
      c.target.lerpVectors(_b, c.target, t);
      c.fov = lerp(k72.fov, fovPath, t);
      c.ppx = lerp(k72.pp[0], ppPath[0], t);
      c.ppy = lerp(k72.pp[1], ppPath[1], t);
    } else if (S <= 10.1) {
      corridor(S, c.pos, c.target);
      c.fov = fovPath;
      c.ppx = ppPath[0];
      c.ppy = ppPath[1];
    } else {
      const t = easeInOutSine(range(S, 10.1, 10.6));
      corridor(10.1, _a, _b);
      writeOrbit(out, k106);
      c.pos.lerpVectors(_a, c.pos, t);
      c.target.lerpVectors(_b, c.target, t);
      c.fov = lerp(fovPath, k106.fov, t);
      c.ppx = lerp(ppPath[0], k106.pp[0], t);
      c.ppy = lerp(ppPath[1], k106.pp[1], t);
    }
    c.path = true;
    c.pivot.copy(c.target);
    c.dist = c.pos.distanceTo(c.target);
    return;
  }

  let i = 0;
  while (i < K.length - 1 && S >= K[i + 1].S) i++;
  const a = K[i];
  const b = K[Math.min(i + 1, K.length - 1)];
  if (a === b || S <= a.S) {
    writeOrbit(out, a);
    c.roll = 0;
    return;
  }
  const raw = clamp01((S - a.S) / (b.S - a.S));
  const t = (b.ease ?? easeInOutSine)(raw);
  const fov = lerp(a.fov, b.fov, t);
  const h = Math.exp(lerp(Math.log(heightOf(a)), Math.log(heightOf(b)), t));
  tmpKey.pivot[0] = lerp(a.pivot[0], b.pivot[0], t);
  tmpKey.pivot[1] = lerp(a.pivot[1], b.pivot[1], t);
  tmpKey.pivot[2] = lerp(a.pivot[2], b.pivot[2], t);
  tmpKey.az = lerp(a.az, b.az, t);
  tmpKey.el = lerp(a.el, b.el, t);
  tmpKey.fov = fov;
  tmpKey.dist = h / (2 * Math.tan((fov * DEG) / 2));
  tmpKey.pp[0] = lerp(a.pp[0], b.pp[0], t);
  tmpKey.pp[1] = lerp(a.pp[1], b.pp[1], t);
  writeOrbit(out, tmpKey);
  c.roll = 0;
}

/**
 * Fill every scroll-driven field of sceneState (+ the fragment blend plan).
 * Pure in (S, L) except for reading ui.focusTier / measured.rowS.
 */
export function evaluate(S: number, _time: number, L: Layout, out: SceneState): void {
  evalCamera(S, L, out);
  const u = out.u;

  /* ---- stone placement ---------------------------------------------- */
  out.stone.home.set(0, 0, S < 7.7 ? 0 : HOME_B_Z);
  out.stone.visible = true;
  let yaw = 20;
  if (S >= 1.0) yaw = lerp(20, 200, easeInOutSine(range(S, 1.0, 1.7)));
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
    plan.arc = 0.25;
  } else if (S < 4.6) {
    set("F2", "F2", 0, 0);
    plan.glowMode = 1;
  } else if (S < 5.6) {
    set("F2", "F3", range(S, 4.6, 5.6), 3);
    plan.arc = 0.3;
  } else if (S < 7.2) {
    set("F3", "F3", 0, 0);
  } else if (S < 8.2) {
    set("F3", "F4", range(S, 7.2, 8.2), 4);
    plan.arc = 0.15;
  } else if (S < 10.6) {
    set("F4", "F4", 0, 0);
  } else if (S < 11.5) {
    set("F4", "F5", range(S, 10.6, 11.5), 5);
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
