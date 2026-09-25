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
  /** F2: focused tier (−1 none) and its drawer slide 0..1. */
  focusTier: number;
  focusSlide: number;
  /** Seconds (F3 tumble). */
  time: number;
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
  /** F2 */
  tierPos: THREE.Vector3;
  tierQuat: THREE.Quaternion;
  /** F3 */
  nodePos: THREE.Vector3;
  nodeQuat: THREE.Quaternion;
  tumbleAxis: THREE.Vector3;
  role: 0 | 1 | 2; // P, W, bridge
  /** 0..1 distance from the crack origin (explode stagger). */
  crackK: number;
  rand: number;
};

let prep: Prep[] = [];

export const TIER_Y = (t: number) => -1.45 + 0.95 * t;
export const TIER_X = [-0.72, 0, 0.72];
export const TIER_Z = [-0.31, 0.31];
export const TIER_SCALE = new THREE.Vector3(1.1, 0.55, 1.1);
export const CLUSTER_P = new THREE.Vector3(-1.3, 0, 0);
export const CLUSTER_W = new THREE.Vector3(1.3, 0, 0);

/** Build the per-fragment constants. Deterministic; call once with getStone().frags. */
export function prepareFormations(frags: FragInfo[], crackOrigin: THREE.Vector3): void {
  const rand = mulberry32(0x5b3df0);
  const maxCrack = Math.max(...frags.map((f) => f.centroid.distanceTo(crackOrigin)));

  // F2: six slots per tier, filled by centroid x so neighbours stay neighbours.
  const tierSlots = new Map<number, THREE.Vector3>();
  for (let t = 0; t < 4; t++) {
    const inTier = frags.filter((f) => f.tier === t).sort((a, b) => a.centroid.x - b.centroid.x || a.centroid.z - b.centroid.z);
    inTier.forEach((f, k) => {
      const col = Math.min(2, Math.floor(k / 2));
      const row = k % 2;
      tierSlots.set(f.index, new THREE.Vector3(TIER_X[col], TIER_Y(t), TIER_Z[row]));
    });
  }

  // F3: roles. Bridges = the three W fragments nearest the stone's axis.
  const wIdx = frags.filter((f) => f.cluster === "W").sort((a, b) => Math.abs(a.centroid.x) - Math.abs(b.centroid.x));
  const bridges = new Set(wIdx.slice(0, 3).map((f) => f.index));
  // Poisson-disk nodes in each cluster's ellipsoid (1.0, 0.8, 0.8).
  const placed: THREE.Vector3[] = [];
  const place = (center: THREE.Vector3, r: [number, number, number]) => {
    let best = new THREE.Vector3();
    let bestD = -1;
    for (let k = 0; k < 60; k++) {
      let x = 0,
        y = 0,
        z = 0;
      do {
        x = rand() * 2 - 1;
        y = rand() * 2 - 1;
        z = rand() * 2 - 1;
      } while (x * x + y * y + z * z > 1);
      const p = new THREE.Vector3(center.x + x * r[0], center.y + y * r[1], center.z + z * r[2]);
      const d = placed.length ? Math.min(...placed.map((q) => q.distanceTo(p))) : 9;
      if (d > bestD) {
        bestD = d;
        best = p;
      }
    }
    placed.push(best);
    return best;
  };

  prep = frags.map((f) => {
    const axis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const spin = new THREE.Quaternion().setFromAxisAngle(axis, (rand() * 12 * Math.PI) / 180);
    const burst = f.out.clone().multiplyScalar(1.0 + 1.5 * rand());
    if (f.piece === "crown") burst.y += 0.6;
    if (f.piece === "bladeL") burst.x -= 0.5;
    if (f.piece === "bladeR") burst.x += 0.5;

    // Floor plate: cut face → +Y, then the long axis along X.
    const up = new THREE.Quaternion().setFromUnitVectors(f.cutNormal, Y);
    const la = f.longAxis.clone().applyQuaternion(up);
    const yaw = new THREE.Quaternion().setFromAxisAngle(Y, -Math.atan2(-la.z, la.x));
    const tierQuat = yaw.multiply(up);

    const role: 0 | 1 | 2 = bridges.has(f.index) ? 2 : f.cluster === "P" ? 0 : 1;
    const nodePos =
      role === 2
        ? place(new THREE.Vector3(0, (rand() - 0.5) * 0.6, (rand() - 0.5) * 0.4), [0.25, 0.35, 0.3])
        : place(role === 0 ? CLUSTER_P : CLUSTER_W, [1.0, 0.8, 0.8]);
    // Cut faces point outward from the cluster centre, so the lit faces read.
    const centre = role === 0 ? CLUSTER_P : role === 1 ? CLUSTER_W : new THREE.Vector3();
    const outDir = nodePos.clone().sub(centre);
    if (outDir.lengthSq() < 1e-4) outDir.set(0, 1, 0);
    const nodeQuat = new THREE.Quaternion().setFromUnitVectors(f.cutNormal, outDir.normalize());

    return {
      burst,
      spin,
      tierPos: tierSlots.get(f.index) ?? new THREE.Vector3(),
      tierQuat,
      nodePos,
      nodeQuat,
      tumbleAxis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
      role,
      crackK: f.centroid.distanceTo(crackOrigin) / maxCrack,
      rand: rand(),
    };
  });
}

export function prepared(i: number): Prep {
  return prep[i];
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
      out.quat.copy(ctx.stoneQuat);
      return;
    }
    case "F1": {
      _v.copy(f.centroid).add(p.burst).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(homeA).add(_v);
      out.quat.copy(ctx.stoneQuat).multiply(p.spin);
      return;
    }
    case "F2": {
      out.pos.copy(homeA).add(p.tierPos);
      if (f.tier === ctx.focusTier) out.pos.x += 0.15 * ctx.focusSlide;
      out.quat.copy(p.tierQuat);
      out.scale.copy(TIER_SCALE);
      return;
    }
    case "F3": {
      out.pos.copy(homeA).add(p.nodePos);
      _q.setFromAxisAngle(p.tumbleAxis, ((4 * Math.PI) / 180) * ctx.time + p.rand * 6.283);
      out.quat.copy(_q).multiply(p.nodeQuat);
      out.scale.setScalar(1.25);
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
