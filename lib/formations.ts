import * as THREE from "three";
import { CORE_SCALE } from "./geo/crystal";
import { CORE, HOME_A, MARK, SHARD_COUNT, STONE, type FragInfo } from "./geo/types";
import type { Formation } from "./sceneState";
import { mulberry32 } from "./ease";

/**
 * THE FORMS OF THE STONE — shatter, reshape, stack.
 *
 *   F0  intact      the stone (the core hidden inside it); `gap` opens the cracks
 *   F1  burst       it SHATTERS — forty shards thrown out, the core laid bare
 *   F2  monument    the shards RESHAPE into the stone again, 2.25× — laid course
 *                   by course from the culet up (the stack) with open joints,
 *                   the core glowing inside through them
 *   F3  halo        the monument bursts open: two tilted orbits of shards
 *                   (product, workspace) round the core, cut faces to its light
 *   F4  specimens   four crystal clusters of ten shards each, rising one by one
 *                   on a vertical conveyor through the void (the work)
 *   F5  build       the stone rebuilt, group by group from the culet up
 *   F6  mark        crown lifted away, band raised, blades split — the logo
 *
 * Every pose is world space; blends happen between world poses (Director).
 * Matrices are T·S·R (uniform scale here).
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
  /** F3: accumulated spin of each orbit (P, W) and of the core, radians (integrated by the Director). */
  orbitPhase: number[];
  /** F2/F3: the sculpture leans toward the cursor, about its centre. */
  tilt: THREE.Quaternion;
  /** F4: conveyor progress (0 = specimen 0 centred, 1 = specimen 1 …). */
  conveyor: number;
  /** F4: the specimens' own slow turn (rad). */
  specSpin: number;
  /** F5: 0..1 per build group — 0 hanging in the column, 1 seated. */
  seat: number[];
  /** F5: the stone's rotation at the build. */
  buildQuat: THREE.Quaternion;
  /** F6 progress terms 0..1. */
  crownLift: number;
  bandLift: number;
  split: number;
};

/* The monument (F2) and the halo (F3) stand over the plain at C. */
export const MONUMENT_C = new THREE.Vector3(0, 2.3, 0);
export const MONUMENT_K = 2.25;
/** Open joints: every shard sits this much further out than in the stone. */
const JOINT = 0.11;
/* The halo. */
export const HALO_R = 2.65;
const HALO_SCALE = 1.25;
export const ORBIT_P = new THREE.Quaternion().setFromEuler(new THREE.Euler((28 * Math.PI) / 180, 0, (16 * Math.PI) / 180));
export const ORBIT_W = new THREE.Quaternion().setFromEuler(new THREE.Euler((-28 * Math.PI) / 180, 0, (-16 * Math.PI) / 180));
/** Orbit rates (rad/s): P, W, the core's turn. */
export const ORBIT_SPEED = [0.13, -0.1, 0.22];
/* The specimens: vertical conveyor through the void. */
export const SPEC_GAP = 4.4;
const SPEC_SCALE = 1.2;
/* The core's size in each form. */
const CORE_IN_MONUMENT = 0.95;
const CORE_IN_HALO = 1.12;
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
  /** F2: place in the monument (monument-local, before its turn), course 0..3 from the culet up. */
  tilePos: THREE.Vector3;
  course: number;
  /** F3: orbit + slot. */
  orbit: 0 | 1;
  orbitK: number;
  orbitN: number;
  orbitQ: THREE.Quaternion;
  /** F4: specimen + its place in the cluster. */
  spec: number;
  specPos: THREE.Vector3;
  specQ: THREE.Quaternion;
  /** 0..1 distance from the crack origin (burst stagger). */
  crackK: number;
  rand: number;
};

let prep: Prep[] = [];

/** Orientation taking a fragment's largest cut face to `normal` and its long axis toward `along` (in that face's plane). */
// (F3 orients the halo's shards with it.)
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
  const shardOrder = shards.map((f) => f.index).sort((a, b) => frags[b].volume - frags[a].volume);
  const byHeight = shards.map((f) => f.index).sort((a, b) => frags[a].centroid.y - frags[b].centroid.y);
  const courseOf = new Map<number, number>();
  byHeight.forEach((fi, k) => courseOf.set(fi, Math.min(3, Math.floor((k * 4) / byHeight.length))));

  // F3: orbits by cluster; slots ordered by height inside each orbit.
  const orbitIdx = new Map<number, [number, number]>();
  for (const cl of ["P", "W"] as const) {
    const members = shards.filter((f) => f.cluster === cl).sort((a, b) => a.centroid.y - b.centroid.y);
    members.forEach((f, k) => orbitIdx.set(f.index, [k, members.length]));
  }

  prep = frags.map((f) => {
    const axis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const spin = new THREE.Quaternion().setFromAxisAngle(axis, (rand() * 40 * Math.PI) / 180);
    const burst = f.out.clone().multiplyScalar(1.1 + 1.6 * rand());
    if (f.piece === "crown") burst.y += 0.7;
    if (f.piece === "bladeL") burst.x -= 0.5;
    if (f.piece === "bladeR") burst.x += 0.5;
    const r = rand();
    const k = shardOrder.indexOf(f.index);
    if (f.index === CORE || k < 0) {
      return {
        burst: new THREE.Vector3(),
        spin: new THREE.Quaternion(),
        tilePos: new THREE.Vector3(),
        course: 0,
        orbit: 0,
        orbitK: 0,
        orbitN: 1,
        orbitQ: new THREE.Quaternion(),
        spec: 0,
        specPos: new THREE.Vector3(),
        specQ: new THREE.Quaternion(),
        crackK: 0,
        rand: r,
      };
    }
    // The stone at monument scale, every joint opened.
    const tilePos = f.centroid.clone().sub(stoneMid).multiplyScalar(MONUMENT_K * (1 + JOINT));
    const [orbitK, orbitN] = orbitIdx.get(f.index) ?? [0, 1];
    // F3: cut face toward the core (−radial), long axis along the orbit (tangent).
    const orbitQ = faceTo(f, new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1));
    // F4: four druses of ten, each a mix of large and small shards: shards
    // radiate from the cluster's heart, points out, on a Fibonacci hemisphere
    // tilted up.
    const spec = k % 4;
    const sk = Math.floor(k / 4);
    const gold = Math.PI * (3 - Math.sqrt(5));
    const zz = 1 - (sk + 0.5) / 10;
    const rr = Math.sqrt(1 - zz * zz);
    const dir = new THREE.Vector3(Math.cos(sk * gold) * rr, 0.35 + 0.65 * zz, Math.sin(sk * gold) * rr).normalize();
    const specQ = new THREE.Quaternion().setFromUnitVectors(f.longAxis, dir);
    const specPos = dir.clone().multiplyScalar(0.22 + 0.5 * f.length * SPEC_SCALE);
    return {
      burst,
      spin,
      tilePos,
      course: courseOf.get(f.index) ?? 0,
      orbit: f.cluster === "P" ? 0 : 1,
      orbitK,
      orbitN,
      orbitQ,
      spec,
      specPos,
      specQ,
      crackK: f.centroid.distanceTo(crackOrigin) / maxCrack,
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

/** The core's pose in each form. */
function coreTarget(F: Formation, ctx: FormationCtx, out: Pose) {
  switch (F) {
    case "F2":
    case "F3": {
      out.pos.copy(MONUMENT_C);
      out.quat.setFromAxisAngle(Y, ctx.orbitPhase[2]);
      out.scale.setScalar(F === "F2" ? CORE_IN_MONUMENT : CORE_IN_HALO);
      tiltAbout(out, MONUMENT_C, ctx.tilt);
      return;
    }
    case "F4": {
      // The camera flew into it: gone (it returns inside the rebuilt stone).
      out.pos.copy(MONUMENT_C);
      out.quat.identity();
      out.scale.setScalar(0.001);
      return;
    }
    default: {
      // Inside the stone, turning with it.
      const q = F === "F5" ? ctx.buildQuat : ctx.stoneQuat;
      _v.copy(stoneMid).applyQuaternion(q);
      out.pos.copy(homeA).add(_v);
      if (F === "F0" || F === "F1") out.pos.y += ctx.lift;
      out.quat.copy(q);
      out.scale.setScalar(F === "F1" ? 0.62 : CORE_SCALE);
    }
  }
}

/** Fill `out` with fragment `f`'s world pose in formation `F`. Allocation-free. */
export function fragTarget(F: Formation, f: FragInfo, ctx: FormationCtx, out: Pose): void {
  out.scale.set(1, 1, 1);
  if (f.index === CORE) {
    coreTarget(F, ctx, out);
    return;
  }
  const p = prep[f.index];
  switch (F) {
    case "F0":
    case "F5": {
      _v.copy(f.centroid);
      let turn = 0;
      if (F === "F0") _v.addScaledVector(f.out, ctx.gap);
      else if (f.group >= 0) {
        // Hanging in the column until its group seats: raised, pushed out, turned a little.
        const up = 1 - ctx.seat[f.group];
        if (up > 0) {
          _v.y += COLUMN_Y[f.group] * up;
          _v2.set(f.centroid.x, 0, f.centroid.z);
          if (_v2.lengthSq() > 1e-6) _v.addScaledVector(_v2.normalize(), 0.16 * up);
          turn = 0.55 * up * (f.group % 2 ? -1 : 1);
        }
      }
      _q.setFromAxisAngle(Y, turn);
      _v.applyQuaternion(_q);
      const q = F === "F5" ? ctx.buildQuat : ctx.stoneQuat;
      _v.applyQuaternion(q);
      out.pos.copy(homeA).add(_v);
      if (F === "F0") out.pos.y += ctx.lift;
      out.quat.copy(q).multiply(_q);
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
    case "F3": {
      const ring = p.orbit === 0 ? ORBIT_P : ORBIT_W;
      const th = (p.orbitK / p.orbitN) * Math.PI * 2 + ctx.orbitPhase[p.orbit] + p.orbit * 0.4;
      _v.set(HALO_R * Math.cos(th), 0, HALO_R * Math.sin(th)).applyQuaternion(ring);
      out.pos.copy(MONUMENT_C).add(_v);
      _q.setFromAxisAngle(Y, -th);
      out.quat.copy(ring).multiply(_q).multiply(p.orbitQ);
      out.scale.setScalar(HALO_SCALE);
      tiltAbout(out, MONUMENT_C, ctx.tilt);
      return;
    }
    case "F4": {
      // Specimen k's heart rides the conveyor up; the cluster turns slowly.
      const y = (ctx.conveyor - p.spec) * SPEC_GAP;
      _q.setFromAxisAngle(Y, ctx.specSpin * (p.spec % 2 ? -1 : 1) + p.spec * 1.3);
      _v.copy(p.specPos).applyQuaternion(_q);
      out.pos.set(0, y, 0).add(_v);
      out.quat.copy(_q).multiply(p.specQ);
      out.scale.setScalar(SPEC_SCALE);
      return;
    }
    case "F6": {
      // Stone-local offsets, then the stone's rotation.
      _v.copy(f.centroid);
      if (f.piece === "crown") _v.y += 0.1 * ctx.crownLift;
      if (f.piece === "band") _v.y += MARK.lift * ctx.bandLift;
      if (f.piece === "bladeL") _v.x -= MARK.split * ctx.split;
      if (f.piece === "bladeR") _v.x += MARK.split * ctx.split;
      _v.applyQuaternion(ctx.stoneQuat);
      out.pos.copy(homeA).add(_v);
      out.quat.copy(ctx.stoneQuat);
      return;
    }
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
