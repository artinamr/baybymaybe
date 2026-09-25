import * as THREE from "three";
import { HOME_A, HOME_B, MARK, type FragInfo } from "./geo/types";
import type { Formation } from "./sceneState";
import { mulberry32 } from "./ease";

/**
 * THE SEVEN FORMS OF THE STONE (docs/SPEC.md §5).
 *
 *   F0  intact        stone-relative; `gap` pushes each piece out along d (the crack)
 *   F1  explode       stone-relative burst; the mark's pieces part first
 *   F2  tiers         four lit floors of black glass (infrastructure)
 *   F3  constellation two clusters, P (product) and W (workspace), + 3 bridges (AI)
 *   F4  stream        a compact exploded cluster at HOME_B (leads the camera to the field)
 *   F5  reforming     the intact stone at HOME_B, seated group by group
 *   F6  mark          crown lifted away, band raised, blades split — the logo
 *
 * Stone-relative forms compose T(home)·R(stone)·f; layout forms are T(home)·f.
 * Every pose is world space; blends happen between world poses (Director).
 * Matrices are built as T·S·R so the floor plates' scale is world-axis flat.
 */

export type Pose = { pos: THREE.Vector3; quat: THREE.Quaternion; scale: THREE.Vector3 };

export function pose(): Pose {
  return { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: new THREE.Vector3(1, 1, 1) };
}

export type FormationCtx = {
  /** The stone's current rotation (stone-relative forms). */
  stoneQuat: THREE.Quaternion;
  /** F0: push along d. */
  gap: number;
  /** F0/F1: how far the stone has risen off its reflection (world y). */
  lift: number;
  /** F2: focused tier (−1 none) and its drawer slide 0..1. */
  focusTier: number;
  focusSlide: number;
  /** Seconds. */
  time: number;
  /**
   * Accumulated spin of each tower ring (F2) and each orbit (F3: P, W, bridges),
   * radians. Integrated by the Director so speed can change (the active beat,
   * a stir of the cursor) without a single piece jumping.
   */
  ringPhase: number[];
  orbitPhase: number[];
  /** The whole sculpture tilts toward the cursor (F2, F3), about its centre. */
  tilt: THREE.Quaternion;
  /** F6 progress terms 0..1. */
  crownLift: number;
  bandLift: number;
  split: number;
};

const Y = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const homeA = new THREE.Vector3(...HOME_A);
const homeB = new THREE.Vector3(...HOME_B);
const ASSEMBLY_YAW = new THREE.Quaternion().setFromAxisAngle(Y, (45 * Math.PI) / 180);

/** Per-fragment constants, precomputed once from FragInfo. */
type Prep = {
  /** F1 */
  burst: THREE.Vector3;
  spin: THREE.Quaternion;
  /** F2 — slot in its tier's ring, and the blade's base orientation (cut face → +X, long axis up). */
  ringSlot: number;
  bladeQ: THREE.Quaternion;
  /** F3 — orbit index/count in its ring, base orientation (cut face → +X, long axis along the orbit). */
  role: 0 | 1 | 2; // P, W, bridge
  orbitK: number;
  orbitN: number;
  orbitQ: THREE.Quaternion;
  /** 0..1 distance from the crack origin (explode stagger). */
  crackK: number;
  rand: number;
};

let prep: Prep[] = [];

/* F2 — THE CORE: four rings of six blades, stacked and counter-rotating, lit from within. */
export const TIER_Y = (t: number) => -1.6 + 1.05 * t;
export const RING_R = [1.5, 1.34, 1.18, 1.02];
const BLADE_SCALE = 0.82;
/** Ring spin rates (rad/s), alternating, for the Director to integrate. */
export const RING_W = [0.16, -0.12, 0.1, -0.075];
/* F3 — THE ARMILLARY: two tilted orbits (product, workspace) and three bridges at the heart. */
export const ORBIT_R = 2.0;
const ORBIT_SCALE = 0.8;
export const ORBIT_P = new THREE.Quaternion().setFromEuler(new THREE.Euler((30 * Math.PI) / 180, 0, (18 * Math.PI) / 180));
export const ORBIT_W = new THREE.Quaternion().setFromEuler(new THREE.Euler((-30 * Math.PI) / 180, 0, (-18 * Math.PI) / 180));
/** Orbit rates (rad/s): P, W, bridges. */
export const ORBIT_SPEED = [0.14, -0.11, 0.3];
const X = new THREE.Vector3(1, 0, 0);
const NEG_X = new THREE.Vector3(-1, 0, 0);
const Z = new THREE.Vector3(0, 0, 1);

/**
 * Base orientation: cut face → −X (it will face the ring's axis — the light is
 * INSIDE, the polished black faces outside), then roll about X so the long
 * axis lies along `along`.
 */
function bladeBase(f: FragInfo, along: THREE.Vector3): THREE.Quaternion {
  const q = new THREE.Quaternion().setFromUnitVectors(f.cutNormal, NEG_X);
  const la = f.longAxis.clone().applyQuaternion(q);
  // Project onto the YZ plane and roll it onto `along` (also in YZ).
  const cur = Math.atan2(la.z, la.y);
  const want = Math.atan2(along.z, along.y);
  return new THREE.Quaternion().setFromAxisAngle(X, cur - want).multiply(q);
}

/** Build the per-fragment constants. Deterministic; call once with getStone().frags. */
export function prepareFormations(frags: FragInfo[], crackOrigin: THREE.Vector3): void {
  const rand = mulberry32(0x5b3df0);
  const maxCrack = Math.max(...frags.map((f) => f.centroid.distanceTo(crackOrigin)));

  // F2: each tier's six fragments take ring slots in the order they sat around
  // the stone, so neighbours in the stone stay neighbours in the ring.
  const slotOf = new Map<number, number>();
  for (let t = 0; t < 4; t++) {
    const inTier = frags.filter((f) => f.tier === t).sort((a, b) => Math.atan2(a.centroid.z, a.centroid.x) - Math.atan2(b.centroid.z, b.centroid.x));
    inTier.forEach((f, k) => slotOf.set(f.index, k));
  }

  // F3: roles. Bridges = the three W fragments nearest the stone's axis.
  const wIdx = frags.filter((f) => f.cluster === "W").sort((a, b) => Math.abs(a.centroid.x) - Math.abs(b.centroid.x));
  const bridges = new Set(wIdx.slice(0, 3).map((f) => f.index));
  const roleOf = (f: FragInfo): 0 | 1 | 2 => (bridges.has(f.index) ? 2 : f.cluster === "P" ? 0 : 1);
  const orbitIdx = new Map<number, [number, number]>();
  for (const role of [0, 1, 2] as const) {
    const members = frags.filter((f) => roleOf(f) === role).sort((a, b) => a.centroid.y - b.centroid.y);
    members.forEach((f, k) => orbitIdx.set(f.index, [k, members.length]));
  }

  prep = frags.map((f) => {
    const axis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const spin = new THREE.Quaternion().setFromAxisAngle(axis, (rand() * 12 * Math.PI) / 180);
    const burst = f.out.clone().multiplyScalar(1.0 + 1.5 * rand());
    if (f.piece === "crown") burst.y += 0.6;
    if (f.piece === "bladeL") burst.x -= 0.5;
    if (f.piece === "bladeR") burst.x += 0.5;
    const [orbitK, orbitN] = orbitIdx.get(f.index) ?? [0, 1];
    return {
      burst,
      spin,
      ringSlot: slotOf.get(f.index) ?? 0,
      bladeQ: bladeBase(f, Y),
      role: roleOf(f),
      orbitK,
      orbitN,
      orbitQ: bladeBase(f, Z),
      crackK: f.centroid.distanceTo(crackOrigin) / maxCrack,
      rand: rand(),
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

/** Fill `out` with fragment `f`'s world pose in formation `F`. Allocation-free. */
export function fragTarget(F: Formation, f: FragInfo, ctx: FormationCtx, out: Pose): void {
  const p = prep[f.index];
  out.scale.set(1, 1, 1);
  switch (F) {
    case "F0":
    case "F5": {
      const home = F === "F0" ? homeA : homeB;
      _v.copy(f.centroid).addScaledVector(f.out, ctx.gap).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(home).add(_v);
      if (F === "F0") out.pos.y += ctx.lift;
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
      // A ring of blades, cut faces out, turning; the focused ring opens out.
      const t = f.tier;
      const focus = t === ctx.focusTier ? ctx.focusSlide : 0;
      const th = (p.ringSlot / 6) * Math.PI * 2 + t * 0.52 + ctx.ringPhase[t];
      const R = RING_R[t] + 0.22 * focus;
      out.pos.set(homeA.x + R * Math.cos(th), homeA.y + TIER_Y(t) + 0.06 * focus, homeA.z + R * Math.sin(th));
      _q.setFromAxisAngle(Y, -th);
      out.quat.copy(_q).multiply(p.bladeQ);
      out.scale.setScalar(BLADE_SCALE);
      tiltAbout(out, homeA, ctx.tilt);
      return;
    }
    case "F3": {
      if (p.role === 2) {
        // The bridges: a small slow triangle at the heart where the orbits cross.
        const th = (p.orbitK / p.orbitN) * Math.PI * 2 + ctx.orbitPhase[2];
        out.pos.set(homeA.x + 0.42 * Math.cos(th), homeA.y + (p.orbitK - 1) * 0.2, homeA.z + 0.42 * Math.sin(th));
        _q.setFromAxisAngle(Y, -th);
        out.quat.copy(_q).multiply(p.bladeQ);
        out.scale.setScalar(ORBIT_SCALE);
        tiltAbout(out, homeA, ctx.tilt);
        return;
      }
      const ring = p.role === 0 ? ORBIT_P : ORBIT_W;
      const th = (p.orbitK / p.orbitN) * Math.PI * 2 + ctx.orbitPhase[p.role];
      _v.set(ORBIT_R * Math.cos(th), 0, ORBIT_R * Math.sin(th)).applyQuaternion(ring);
      out.pos.copy(homeA).add(_v);
      _q.setFromAxisAngle(Y, -th);
      out.quat.copy(ring).multiply(_q).multiply(p.orbitQ);
      out.scale.setScalar(ORBIT_SCALE);
      tiltAbout(out, homeA, ctx.tilt);
      return;
    }
    case "F4": {
      _v.copy(f.centroid).addScaledVector(f.out, 0.45).applyQuaternion(ASSEMBLY_YAW);
      out.pos.copy(homeB).add(_v);
      out.quat.copy(ASSEMBLY_YAW);
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
      out.pos.copy(homeB).add(_v);
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
  // control = midpoint + dir · arc · |b − a|
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

/** Compose T·S·R (world-axis scale) into `m`. */
export function poseMatrix(p: Pose, m: THREE.Matrix4): THREE.Matrix4 {
  _R.makeRotationFromQuaternion(p.quat);
  _S.makeScale(p.scale.x, p.scale.y, p.scale.z);
  m.multiplyMatrices(_S, _R);
  m.elements[12] = p.pos.x;
  m.elements[13] = p.pos.y;
  m.elements[14] = p.pos.z;
  return m;
}
