import * as THREE from "three";
import { CORE_SCALE } from "./geo/crystal";
import { CORE, SHARD_COUNT, STONE, type FragInfo } from "./geo/types";
import type { Formation } from "./sceneState";
import { mulberry32 } from "./ease";

/**
 * THE FORMS OF THE STONE (home film, lib/choreo.ts).
 *
 *   F0  intact      the stone (the core hidden inside it), at any home and
 *                   scale — the studio stone, the stone re-made in the sky
 *   F1  burst       it SHATTERS — forty shards thrown out, the core laid bare
 *   F4  exploded    WEBSITES: the burst resolves into an exploded view — every
 *                   shard turned back to its place in the stone and held apart
 *                   along its own line from the heart; the mark's cuts open
 *                   (crown up, blades apart); the core glowing in the middle
 *   F2  monument    PLATFORMS: the stone rebuilt at 2.25× over the cloud sea,
 *                   course by course from the culet up, open joints
 *   F3  flow        AI AUTOMATION as a working system, alive in time: leads
 *                   sweep in out of the distance, circle the glowing core on a
 *                   tilted ring and are decided at its front — LIT (qualified,
 *                   filed into the rising column) or dark (dropped into the clouds)
 *   F8  gathered    every lead drawn into the core, which swells with light (the
 *                   flood out of the sky starts here)
 *   F7  colossus    WHY: the stone at colossal scale on the salt flat. It
 *                   BURSTS in slow motion — every piece carried out from the
 *                   heart to twice its distance, a hollow round the burning
 *                   core, and the glass between the heart and the camera
 *                   always standing aside — so the camera flies into the burst,
 *                   turns round the core, and pulls out as it closes again
 *
 * Every pose is world space; blends happen between world poses (Director).
 */

export type Pose = { pos: THREE.Vector3; quat: THREE.Quaternion; scale: THREE.Vector3 };

export function pose(): Pose {
  return { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: new THREE.Vector3(1, 1, 1) };
}

export type FormationCtx = {
  /** The stone's current rotation (stone-relative forms). */
  stoneQuat: THREE.Quaternion;
  /** Where the stone's origin stands (F0 / F1 / F4 / F7). */
  home: THREE.Vector3;
  /** The stone's scale (1 in the studio and the sky; colossal on the flat). */
  K: number;
  /** F0: push along `out` (the cracks opening). */
  gap: number;
  /** F0/F1: how far the stone has risen off its reflection (world y). */
  lift: number;
  /** F2: the monument's slow turn (rad). */
  monumentYaw: number;
  /** The core's turn (rad, integrated by the Director). */
  coreSpin: number;
  /** F2/F3: the sculpture leans toward the cursor, about its centre. */
  tilt: THREE.Quaternion;
  /** F3: the flow's clock (seconds, integrated by the Director — the cursor can hurry it). */
  flowT: number;
  /** F4: 0..1 how far apart the exploded view is held (breathes a little). */
  explode: number;
  /** F7: where the camera is (the stone opens toward it), and how open it may be (0..1). */
  camPos: THREE.Vector3;
  open: number;
};

/* The monument (F2) stands in the sky over the cloud sea. */
export const MONUMENT_C = new THREE.Vector3(0, 1.3, 0);
export const MONUMENT_K = 2.25;
/** Open joints: every shard sits this much further out than in the stone. */
const JOINT = 0.11;
/* The flow (F3): the core, screen-right and toward-the-camera at that point of
   the film (the camera's azimuth there is FLOW_AZ), the ring, the column.
   Everything stays right of the chapter's type: in from the far upper right,
   round the core by its left, out to the column on the right. */
export const FLOW_C = new THREE.Vector3(0.2, 1.1, 0);
export const FLOW_AZ_DEG = -270;
const FLOW_AZ = (FLOW_AZ_DEG * Math.PI) / 180;
export const FLOW_DIR = new THREE.Vector3(Math.cos(FLOW_AZ), 0, -Math.sin(FLOW_AZ));
const FLOW_DEPTH = new THREE.Vector3(Math.sin(FLOW_AZ), 0, Math.cos(FLOW_AZ));
const FLOW_PERIOD = 10.5;
const FLOW_SCALE = 0.9;
const RING_R = 1.3;
/** A lead's longest extent, whatever shard carries it. */
const LEAD_LEN = 0.62;
const RING_TILT = (24 * Math.PI) / 180;
/** Phase marks of one lead's cycle: arrive · round the ring · (qualified) into the column · rise. */
const U_RING = 0.42;
const U_DECIDE = 0.62;
const U_COLUMN = 0.7;
const COLUMN_C = FLOW_C.clone().addScaledVector(FLOW_DIR, 1.95).addScaledVector(FLOW_DEPTH, 0.45);
const COLUMN_BASE = -1.3;
const COLUMN_RISE = 3.8;
/* The core's size in each form. */
const CORE_IN_MONUMENT = 0.95;
const CORE_IN_FLOW = 0.72;
const CORE_GATHERED = 1.25;
/* F4: how far apart the exploded view holds (× distance from the heart), and the mark's cuts. */
const EXPLODE_K = 1.3;
const CUT_OPEN = { crown: 0.46, band: 0.2, blade: 0.32 };

/* THE SALT FLAT and the colossus on it (F7). The flat lies far below the sky's
   cloud sea; the film cuts to it under a flood of light. */
export const FLAT_Y = -60;
export const COL_K = 7;
/** The colossus's origin: its culet just touches the flat. */
export const COL_HOME = new THREE.Vector3(0, FLAT_Y - STONE.floorY * COL_K, 0);
/** The colossus's centre (world). */
export const COL_C = new THREE.Vector3(0, COL_HOME.y + STONE.centerY * COL_K, 0);
/* How it opens (stone units × K): the tunnel's radius toward the camera, the
   hollow round the heart, and how far every joint opens. */
const TUNNEL_R = 0.5;
const HOLLOW_R = 1.25;
const EXPAND = 1.05;

const Y = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();
const _cd = new THREE.Vector3();
const _perp = new THREE.Vector3();
const _off = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const stoneMid = new THREE.Vector3(0, STONE.centerY, 0);

/** Per-fragment constants, precomputed once from FragInfo. */
type Prep = {
  /** F1 */
  burst: THREE.Vector3;
  spin: THREE.Quaternion;
  /** F2: place in the monument (before its turn), course 0..3 from the culet up. */
  tilePos: THREE.Vector3;
  course: number;
  /** F3: the lead's lane, phase, fate, tumble axis, and the filed orientation. */
  flowPhase: number;
  laneY: number;
  laneZ: number;
  qualified: boolean;
  /** F3: scale that brings this shard to a lead's common size. */
  unit: number;
  tumble: THREE.Vector3;
  filedQ: THREE.Quaternion;
  /** F4: offset from the heart in the exploded view (stone object space). */
  explodeOff: THREE.Vector3;
  /** 0..1 distance from the crack origin (burst stagger). */
  crackK: number;
  /** 0..1 distance from the heart (assembly stagger: the inside first). */
  radK: number;
  rand: number;
};

let prep: Prep[] = [];

/** Orientation taking a fragment's largest cut face to `normal` and its long axis toward `along` (in that face's plane). */
function faceTo(f: FragInfo, normal: THREE.Vector3, along: THREE.Vector3): THREE.Quaternion {
  const q = new THREE.Quaternion().setFromUnitVectors(f.cutNormal, normal);
  const la = f.longAxis.clone().applyQuaternion(q);
  la.addScaledVector(normal, -la.dot(normal));
  const al = along.clone().addScaledVector(normal, -along.dot(normal));
  if (la.lengthSq() < 1e-6 || al.lengthSq() < 1e-6) return q;
  la.normalize();
  al.normalize();
  const ang = Math.atan2(la.clone().cross(al).dot(normal), la.dot(al));
  return new THREE.Quaternion().setFromAxisAngle(normal, ang).multiply(q);
}

/** Build the per-fragment constants. Deterministic; call once with getStone().frags. */
export function prepareFormations(frags: FragInfo[], crackOrigin: THREE.Vector3): void {
  const rand = mulberry32(0x5b3df0);
  const shards = frags.filter((f) => f.index < SHARD_COUNT);
  const maxCrack = Math.max(...shards.map((f) => f.centroid.distanceTo(crackOrigin)));
  const maxRad = Math.max(...shards.map((f) => f.centroid.distanceTo(stoneMid)));

  // F2: courses are quartiles of height, from the culet up.
  const byHeight = shards.map((f) => f.index).sort((a, b) => frags[a].centroid.y - frags[b].centroid.y);
  const courseOf = new Map<number, number>();
  byHeight.forEach((fi, k) => courseOf.set(fi, Math.min(3, Math.floor((k * 4) / byHeight.length))));
  // F3: leads evenly spread round the cycle; a third of them qualify.
  const flowOrder = shards.map((f) => f.index).sort((a, b) => frags[a].centroid.x - frags[b].centroid.x);
  const flowK = new Map<number, number>();
  flowOrder.forEach((fi, k) => flowK.set(fi, k));

  prep = frags.map((f) => {
    const axis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const spin = new THREE.Quaternion().setFromAxisAngle(axis, (rand() * 40 * Math.PI) / 180);
    const burst = f.out.clone().multiplyScalar(1.1 + 1.6 * rand());
    if (f.piece === "crown") burst.y += 0.42;
    if (f.piece === "bladeL") burst.x -= 0.5;
    if (f.piece === "bladeR") burst.x += 0.5;
    const r = rand();
    const k = flowK.get(f.index) ?? 0;
    const tumble = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const laneY = (rand() - 0.5) * 3.2;
    const laneZ = (rand() - 0.5) * 4.0;
    // The exploded view: along the shard's own line from the heart, further for
    // the far ones, and the mark's cuts opened — crown up, blades apart.
    const explodeOff = f.centroid.clone().sub(stoneMid).multiplyScalar(EXPLODE_K);
    if (f.piece === "crown") explodeOff.y += CUT_OPEN.crown;
    if (f.piece === "band") explodeOff.y += CUT_OPEN.band;
    if (f.piece === "bladeL") explodeOff.x -= CUT_OPEN.blade;
    if (f.piece === "bladeR") explodeOff.x += CUT_OPEN.blade;
    return {
      burst,
      spin,
      tilePos: f.index === CORE ? new THREE.Vector3() : f.centroid.clone().sub(stoneMid).multiplyScalar(MONUMENT_K * (1 + JOINT)),
      course: courseOf.get(f.index) ?? 0,
      // The qualified keep exact spacing (the column reads as filed); the rest drift.
      flowPhase: (k + (k % 3 === 1 ? 0 : 0.35 * rand())) / SHARD_COUNT,
      laneY,
      laneZ,
      qualified: k % 3 === 1,
      unit: f.index === CORE ? 1 : Math.min(1.5, Math.max(0.45, LEAD_LEN / Math.max(0.05, f.length))),
      tumble,
      // Filed: the polished cut face turned to the camera, long axis level.
      filedQ: faceTo(f, FLOW_DEPTH, FLOW_DIR),
      explodeOff,
      crackK: f.index === CORE ? 0 : f.centroid.distanceTo(crackOrigin) / maxCrack,
      radK: f.index === CORE ? 0 : f.centroid.distanceTo(stoneMid) / maxRad,
      rand: r,
    };
  });
}

export function prepared(i: number): Prep {
  return prep[i];
}

/** Rotate a pose about a centre (the sculpture leaning toward the cursor). */
function tiltAbout(out: Pose, centre: THREE.Vector3, tilt: THREE.Quaternion) {
  out.pos.sub(centre).applyQuaternion(tilt).add(centre);
  out.quat.premultiply(tilt);
}

/**
 * What a formation says about a fragment's light, beyond its pose (F3's leads
 * grow in and dwindle away, flash as they pass the core, stay lit if
 * qualified; F7's walls light as the corridor opens). Read by the Director
 * right after fragTarget. Leads come and go by SCALE, never by alpha: a
 * half-faded shard reads as white ghost glass.
 */
export const fx = { fade: 0, glow: 1, flash: 0, lit: 0, open: 0 };

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** A point of the ring round the core: φ 0 at its back (tilted up), −π/2 on the left, −π at its front. */
function ringPoint(phi: number, out: THREE.Vector3) {
  const c = Math.cos(phi);
  return out
    .copy(FLOW_C)
    .addScaledVector(FLOW_DIR, RING_R * Math.sin(phi))
    .addScaledVector(FLOW_DEPTH, -RING_R * c * Math.cos(RING_TILT))
    .addScaledVector(Y, RING_R * c * Math.sin(RING_TILT));
}

const _b0 = new THREE.Vector3();
const _b1 = new THREE.Vector3();
const _b2 = new THREE.Vector3();
const _b3 = new THREE.Vector3();
function bezier(t: number, out: THREE.Vector3) {
  const s = 1 - t;
  return out
    .copy(_b0)
    .multiplyScalar(s * s * s)
    .addScaledVector(_b1, 3 * s * s * t)
    .addScaledVector(_b2, 3 * s * t * t)
    .addScaledVector(_b3, t * t * t);
}

/** Ring speed (world units per unit of u) — the arrival and the exits match it. */
const RING_V = (RING_R * Math.PI) / (U_DECIDE - U_RING);

/** F3 — one lead's place in the flow at the flow clock `t`. */
function flowTarget(p: Prep, ctx: FormationCtx, out: Pose) {
  const u = (((ctx.flowT / FLOW_PERIOD + p.flowPhase) % 1) + 1) % 1;
  fx.glow = 0.22;
  // Every lead the same size, whatever its shard: the leads read as units, the column as filed.
  const size = FLOW_SCALE * p.unit;
  out.scale.setScalar(size);
  _q.setFromAxisAngle(p.tumble, ctx.flowT * 0.5 + p.rand * 6.28);
  if (u < U_RING) {
    // Arriving: one long curve in out of the distance (far behind the core, up
    // and to the right), slowing into the back of the ring at the ring's pace.
    const t = u / U_RING;
    _b0.copy(FLOW_C)
      .addScaledVector(FLOW_DEPTH, -18)
      .addScaledVector(FLOW_DIR, 3 + p.laneZ * 0.5)
      .addScaledVector(Y, 2 + p.laneY * 0.5);
    ringPoint(0, _b3).addScaledVector(Y, p.laneY * 0.06);
    // End tangent along the ring (−DIR at its back), speed RING_V.
    _b2.copy(_b3).addScaledVector(FLOW_DIR, (RING_V * U_RING) / 3);
    _b1.copy(_b2).sub(_b0).normalize().multiplyScalar(7).add(_b0);
    bezier(t, out.pos);
    out.quat.copy(_q);
    out.scale.setScalar(size * Math.max(0.002, smooth(t / 0.18)));
    return;
  }
  if (u < U_DECIDE) {
    // Round the core by its left — the AI greets, asks, screens — decided at the front.
    const k = (u - U_RING) / (U_DECIDE - U_RING);
    ringPoint(-Math.PI * k, out.pos).addScaledVector(Y, p.laneY * 0.06 * (1 - k));
    out.quat.copy(_q);
    if (p.qualified) out.quat.slerp(p.filedQ, smooth((k - 0.45) / 0.55));
    fx.flash = smooth((k - 0.55) / 0.45);
    fx.glow = p.qualified ? 0.22 + 0.78 * smooth((k - 0.6) / 0.4) : 0.22;
    if (p.qualified) fx.lit = smooth((k - 0.7) / 0.3);
    return;
  }
  ringPoint(-Math.PI, _b0);
  if (p.qualified) {
    // Qualified: carried on to the right, filed into the column, which rises for you.
    out.quat.copy(p.filedQ);
    fx.glow = 1;
    fx.lit = 1;
    fx.flash = 1 - smooth((u - U_DECIDE) / 0.1);
    const riseV = COLUMN_RISE / (1 - U_COLUMN);
    if (u < U_COLUMN) {
      const t = (u - U_DECIDE) / (U_COLUMN - U_DECIDE);
      _b1.copy(_b0).addScaledVector(FLOW_DIR, (RING_V * (U_COLUMN - U_DECIDE)) / 3);
      _b3.copy(COLUMN_C).addScaledVector(Y, COLUMN_BASE);
      _b2.copy(_b3).addScaledVector(Y, (-riseV * (U_COLUMN - U_DECIDE)) / 3);
      bezier(t, out.pos);
      return;
    }
    const k = (u - U_COLUMN) / (1 - U_COLUMN);
    out.pos.copy(COLUMN_C).addScaledVector(Y, COLUMN_BASE + COLUMN_RISE * k);
    out.scale.setScalar(size * Math.max(0.002, 1 - smooth((k - 0.8) / 0.2)));
    return;
  }
  // The noise: goes dark at the front and drops away into the cloud sea.
  const d = u - U_DECIDE;
  out.pos
    .copy(_b0)
    .addScaledVector(FLOW_DIR, (RING_V / 9) * (1 - Math.exp(-9 * d)))
    .addScaledVector(FLOW_DEPTH, 1.6 * d)
    .addScaledVector(Y, -80 * d * d);
  _q.setFromAxisAngle(p.tumble, ctx.flowT * 1.1 + p.rand * 6.28);
  out.quat.copy(_q);
  fx.glow = 0.06;
  fx.flash = 1 - smooth(d / 0.06);
  out.scale.setScalar(size * Math.max(0.002, 1 - smooth(d / 0.3)));
}

/**
 * F7 — one shard of the colossus. Open, every joint parts a little from the
 * heart; the glass between the heart and the camera stands aside (radially
 * from that line, only up to just behind the camera), and a hollow opens
 * round the heart — wherever the camera goes, it has room, and the heart is
 * always in view.
 */
function colossusTarget(f: FragInfo, p: Prep, ctx: FormationCtx, out: Pose) {
  const K = ctx.K;
  _v.copy(f.centroid).multiplyScalar(K).applyQuaternion(ctx.stoneQuat).add(ctx.home);
  out.quat.copy(ctx.stoneQuat);
  out.scale.setScalar(K);
  if (ctx.open > 1e-4) {
    _c.copy(stoneMid).multiplyScalar(K).applyQuaternion(ctx.stoneQuat).add(ctx.home);
    _d.copy(_v).sub(_c);
    _cd.copy(ctx.camPos).sub(_c);
    const camDist = Math.max(1e-3, _cd.length());
    _cd.divideScalar(camDist);
    const along = _d.dot(_cd);
    _perp.copy(_d).addScaledVector(_cd, -along);
    let pr = _perp.length();
    if (pr < 1e-3) {
      _perp.set(0, 1, 0).addScaledVector(_cd, -_cd.y);
      pr = Math.max(1e-3, _perp.length());
    }
    // The tunnel: between the heart and a little behind the camera.
    const wT = smooth((along + 0.1 * K) / (0.25 * K)) * (1 - smooth((along - camDist - 0.25 * K) / (0.4 * K)));
    const pushT = (Math.max(0, TUNNEL_R * K - pr) + 0.06 * K) * wT;
    _off.copy(_perp).multiplyScalar(pushT / pr);
    // The hollow round the heart, and every joint opened a little.
    const dl = Math.max(1e-3, _d.length());
    const pushH = Math.max(0, HOLLOW_R * K - dl) + EXPAND * dl;
    _off.addScaledVector(_d, pushH / dl);
    _v.addScaledVector(_off, ctx.open);
    // Each piece turns on itself as it flies out — the burst has spin.
    const g = ctx.open * Math.min(1, (pushT + pushH) / (0.35 * K));
    _q2.setFromAxisAngle(p.tumble, 0.55 * ctx.open * (0.5 + p.rand));
    out.quat.multiply(_q2);
    fx.open = g;
  }
  out.pos.copy(_v);
}

/** The core's pose in each form. */
function coreTarget(F: Formation, ctx: FormationCtx, out: Pose) {
  switch (F) {
    case "F2":
      out.pos.copy(MONUMENT_C);
      out.quat.setFromAxisAngle(Y, ctx.coreSpin);
      out.scale.setScalar(CORE_IN_MONUMENT);
      tiltAbout(out, MONUMENT_C, ctx.tilt);
      return;
    case "F3":
      out.pos.copy(FLOW_C);
      out.quat.setFromAxisAngle(Y, ctx.coreSpin * 1.6);
      out.scale.setScalar(CORE_IN_FLOW);
      tiltAbout(out, FLOW_C, ctx.tilt);
      return;
    case "F8":
      out.pos.copy(FLOW_C);
      out.quat.setFromAxisAngle(Y, ctx.coreSpin * 2.4);
      out.scale.setScalar(CORE_GATHERED);
      return;
    case "F4":
      _v.copy(stoneMid).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.quat.setFromAxisAngle(Y, ctx.coreSpin).premultiply(ctx.stoneQuat);
      out.scale.setScalar(CORE_SCALE * 1.3);
      return;
    case "F7": {
      // The heart of the colossus: it draws in a little as the stone opens, so
      // the camera can turn round it, and burns.
      _v.copy(stoneMid).multiplyScalar(ctx.K).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.quat.setFromAxisAngle(Y, ctx.coreSpin).premultiply(ctx.stoneQuat);
      out.scale.setScalar(CORE_SCALE * ctx.K * (1 - 0.25 * ctx.open));
      fx.open = ctx.open;
      return;
    }
    default: {
      // Inside the stone, turning with it; laid bare by the burst.
      _v.copy(stoneMid).multiplyScalar(ctx.K).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.pos.y += ctx.lift;
      out.quat.copy(ctx.stoneQuat);
      out.scale.setScalar((F === "F1" ? 0.62 : CORE_SCALE) * ctx.K);
    }
  }
}

/** Fill `out` with fragment `f`'s world pose in formation `F`. Allocation-free. Also sets `fx`. */
export function fragTarget(F: Formation, f: FragInfo, ctx: FormationCtx, out: Pose): void {
  out.scale.set(1, 1, 1);
  fx.fade = 0;
  fx.glow = 1;
  fx.lit = 0;
  fx.flash = 0;
  fx.open = 0;
  if (f.index === CORE) {
    coreTarget(F, ctx, out);
    return;
  }
  const p = prep[f.index];
  switch (F) {
    case "F0": {
      _v.copy(f.centroid).addScaledVector(f.out, ctx.gap).multiplyScalar(ctx.K).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.pos.y += ctx.lift;
      out.quat.copy(ctx.stoneQuat);
      out.scale.setScalar(ctx.K);
      return;
    }
    case "F1": {
      _v.copy(f.centroid).add(p.burst).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.pos.y += ctx.lift;
      out.quat.copy(ctx.stoneQuat).multiply(p.spin);
      return;
    }
    case "F4": {
      _v.copy(f.centroid).addScaledVector(p.explodeOff, ctx.explode).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.quat.copy(ctx.stoneQuat);
      // The girdle band is a thin plate: held apart it would read as a line. It
      // steps out of the exploded view and back in as the stone assembles.
      if (f.piece === "band") out.scale.setScalar(0.002);
      return;
    }
    case "F2": {
      _q.setFromAxisAngle(Y, ctx.monumentYaw);
      _v.copy(p.tilePos).applyQuaternion(_q);
      out.pos.copy(MONUMENT_C).add(_v);
      out.quat.copy(_q);
      out.scale.setScalar(MONUMENT_K);
      tiltAbout(out, MONUMENT_C, ctx.tilt);
      return;
    }
    case "F3":
      flowTarget(p, ctx, out);
      return;
    case "F8": {
      // Drawn into the heart: a last tight turn round it, then gone into the light.
      _v.copy(p.tumble).multiplyScalar(0.12);
      out.pos.copy(FLOW_C).add(_v);
      _q.setFromAxisAngle(p.tumble, ctx.flowT * 2 + p.rand * 6.28);
      out.quat.copy(_q);
      out.scale.setScalar(0.002);
      fx.lit = 1;
      return;
    }
    case "F7":
      colossusTarget(f, p, ctx, out);
      return;
    default:
      out.pos.copy(ctx.home);
      out.quat.identity();
  }
}

/**
 * Blend two world poses along a quadratic Bézier arc whose control point is
 * pushed along the fragment's burst direction — pieces swing out and around
 * rather than sliding in straight lines.
 */
export function blendPose(a: Pose, b: Pose, t: number, dir: THREE.Vector3, arc: number, out: Pose): void {
  const u = 1 - t;
  const dist = _v2.subVectors(b.pos, a.pos).length();
  const cx = (a.pos.x + b.pos.x) * 0.5 + dir.x * arc * dist;
  const cy = (a.pos.y + b.pos.y) * 0.5 + dir.y * arc * dist;
  const cz = (a.pos.z + b.pos.z) * 0.5 + dir.z * arc * dist;
  out.pos.set(
    u * u * a.pos.x + 2 * u * t * cx + t * t * b.pos.x,
    u * u * a.pos.y + 2 * u * t * cy + t * t * b.pos.y,
    u * u * a.pos.z + 2 * u * t * cz + t * t * b.pos.z
  );
  _q2.copy(a.quat);
  out.quat.copy(_q2).slerp(b.quat, t);
  out.scale.copy(a.scale).lerp(b.scale, t);
}

const _S = new THREE.Matrix4();
const _R = new THREE.Matrix4();

/** Compose T·S·R into `m`. */
export function poseMatrix(p: Pose, m: THREE.Matrix4): THREE.Matrix4 {
  _R.makeRotationFromQuaternion(p.quat);
  _S.makeScale(p.scale.x, p.scale.y, p.scale.z);
  m.multiplyMatrices(_S, _R);
  m.elements[12] = p.pos.x;
  m.elements[13] = p.pos.y;
  m.elements[14] = p.pos.z;
  return m;
}
