import * as THREE from "three";
import { CORE_SCALE } from "./geo/crystal";
import { CORE, HOME_A, MARK, SHARD_COUNT, STONE, type FragInfo } from "./geo/types";
import type { Formation } from "./sceneState";
import { mulberry32 } from "./ease";

/**
 * THE FORMS OF THE STONE (home film, lib/choreo.ts).
 *
 *   F0  intact      the stone (the core hidden inside it) — in the studio, and
 *                   again in the sky once it has re-formed (DESIGN)
 *   F1  burst       it SHATTERS — forty shards thrown out, the core laid bare
 *   F2  monument    the shards rebuild the stone at 2.25× in the sky, course by
 *                   course from the culet up (INFRASTRUCTURE), open joints,
 *                   the core glowing inside
 *   F3  flow        AI AUTOMATION as a working system, alive in time: shards
 *                   (the leads) sweep in out of the distance, circle the
 *                   glowing core once on a tilted ring (the AI greets, asks,
 *                   screens) and are decided at its front: LIT — qualified,
 *                   filed into the column on the right that rises for you —
 *                   or dark, dropping away into the clouds (the noise)
 *   F5  build       over the lake: the stone rebuilt, group by group
 *   F6  mark        crown lifted away, band raised, blades split — the logo
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
  /** F5: 0..1 per build group — 0 hanging in the column, 1 seated. */
  seat: number[];
  /** F5/F6: the stone's rotation over the lake. */
  buildQuat: THREE.Quaternion;
  /** F6 progress terms 0..1. */
  crownLift: number;
  bandLift: number;
  split: number;
};

/* The monument (F2) stands in the sky over the cloud sea. */
export const MONUMENT_C = new THREE.Vector3(0, 1.3, 0);
export const MONUMENT_K = 2.25;
/** Open joints: every shard sits this much further out than in the stone. */
const JOINT = 0.11;
/* The flow (F3): the core, screen-right and toward-the-camera at that point of
   the film (camera azimuth ≈ −210°), the ring, the column. Everything stays
   right of the chapter's type: in from the far upper right, round the core by
   its left, out to the column on the right. */
export const FLOW_C = new THREE.Vector3(0.2, 1.1, 0);
const FLOW_AZ = (-210 * Math.PI) / 180;
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
/* The lake: below the clouds; the stone is rebuilt standing on it. */
export const LAKE_HOME = new THREE.Vector3(0, -32, 0);
/* The core's size in each form. */
const CORE_IN_MONUMENT = 0.95;
const CORE_IN_FLOW = 0.72;
/* The build column: groups hang above their seats (stone units), pushed out a little. */
const COLUMN_Y = [0.34, 0.72, 1.12, 1.58];

const Y = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const homeA = new THREE.Vector3(...HOME_A);
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
  /** 0..1 distance from the crack origin (burst stagger). */
  crackK: number;
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
    if (f.piece === "crown") burst.y += 0.7;
    if (f.piece === "bladeL") burst.x -= 0.5;
    if (f.piece === "bladeR") burst.x += 0.5;
    const r = rand();
    const k = flowK.get(f.index) ?? 0;
    const tumble = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const laneY = (rand() - 0.5) * 3.2;
    const laneZ = (rand() - 0.5) * 4.0;
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
      crackK: f.index === CORE ? 0 : f.centroid.distanceTo(crackOrigin) / maxCrack,
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
 * qualified). Read by the Director right after fragTarget. Leads come and go by
 * SCALE, never by alpha: a half-faded shard reads as white ghost glass.
 */
export const fx = { fade: 0, glow: 1, flash: 0, lit: 0 };

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
  fx.fade = 0;
  fx.glow = 0.22;
  fx.flash = 0;
  fx.lit = 0;
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
    case "F5":
    case "F6": {
      _v.copy(stoneMid).applyQuaternion(ctx.buildQuat);
      out.pos.copy(LAKE_HOME).add(_v);
      out.quat.copy(ctx.buildQuat);
      out.scale.setScalar(CORE_SCALE);
      return;
    }
    default: {
      // Inside the stone, turning with it; laid bare by the burst.
      _v.copy(stoneMid).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(homeA).add(_v);
      out.pos.y += ctx.lift;
      out.quat.copy(ctx.stoneQuat);
      out.scale.setScalar(F === "F1" ? 0.62 : CORE_SCALE);
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
  if (f.index === CORE) {
    coreTarget(F, ctx, out);
    return;
  }
  const p = prep[f.index];
  switch (F) {
    case "F0": {
      _v.copy(f.centroid).addScaledVector(f.out, ctx.gap).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(homeA).add(_v);
      out.pos.y += ctx.lift;
      out.quat.copy(ctx.stoneQuat);
      return;
    }
    case "F1": {
      _v.copy(f.centroid).add(p.burst).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(homeA).add(_v);
      out.pos.y += ctx.lift;
      out.quat.copy(ctx.stoneQuat).multiply(p.spin);
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
    case "F5": {
      // Hanging in the column until its group seats: raised, pushed out, turned a little.
      _v.copy(f.centroid);
      let turn = 0;
      if (f.group >= 0) {
        const up = 1 - ctx.seat[f.group];
        if (up > 0) {
          _v.y += COLUMN_Y[f.group] * up;
          _v2.set(f.centroid.x, 0, f.centroid.z);
          if (_v2.lengthSq() > 1e-6) _v.addScaledVector(_v2.normalize(), 0.16 * up);
          turn = 0.55 * up * (f.group % 2 ? -1 : 1);
        }
      }
      _q.setFromAxisAngle(Y, turn);
      _v.applyQuaternion(_q).applyQuaternion(ctx.buildQuat);
      out.pos.copy(LAKE_HOME).add(_v);
      out.quat.copy(ctx.buildQuat).multiply(_q);
      return;
    }
    case "F6": {
      _v.copy(f.centroid);
      if (f.piece === "crown") _v.y += 0.1 * ctx.crownLift;
      if (f.piece === "band") _v.y += MARK.lift * ctx.bandLift;
      if (f.piece === "bladeL") _v.x -= MARK.split * ctx.split;
      if (f.piece === "bladeR") _v.x += MARK.split * ctx.split;
      _v.applyQuaternion(ctx.buildQuat);
      out.pos.copy(LAKE_HOME).add(_v);
      out.quat.copy(ctx.buildQuat);
      return;
    }
    default:
      out.pos.copy(homeA);
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
