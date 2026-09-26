import * as THREE from "three";
import { HOME_A, MARK, STONE, type FragInfo } from "./geo/types";

/**
 * THE RIG — every pose of the eight pieces, as ONE parametric function.
 *
 * No "formation A morphs into formation B". The stone has an anatomy (crown,
 * band, two blades of three levels each) and a handful of designed degrees of
 * freedom; the film (lib/choreo.ts) eases those as smooth functions of S, so
 * every transition is a single continuous gesture of the same object:
 *
 *   open        ch01  the mark's cut opens: crown rises, band floats, blades part
 *   layerY/Spin ch02  the stack: four layers separate vertically and turn like dials
 *   layerOut          the focused layer slides out toward the camera
 *   bookL/bookR ch03  the blades swing open on the back spine like a book —
 *                     two pages of light, the mark's V
 *   station     ch04  each layer glides to its specimen station out in the world
 *   crown/band/split  ch06  the finale's mark offsets
 *
 * Composition, in stone object space: anatomy offsets → stack → stone rotation
 * → world; then the station blend (per layer, rigid) and the cursor lean.
 */

export type Pose = { pos: THREE.Vector3; quat: THREE.Quaternion; scale: THREE.Vector3 };

export function pose(): Pose {
  return { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: new THREE.Vector3(1, 1, 1) };
}

/** The rig's degrees of freedom (written by choreo, lived-in by the Director). */
export type Rig = {
  /** World position of the stone's origin and its rotation. */
  home: THREE.Vector3;
  quat: THREE.Quaternion;
  /**
   * The build site (ch05) — where a layer that has left its station is posed
   * from (per layer `atB`), while the rest of the stone is still at `home`.
   */
  homeB: THREE.Vector3;
  quatB: THREE.Quaternion;
  atB: number[];
  open: number;
  /** Per layer (0 tips … 3 crown): vertical offset (stone units) and turn about the axis (rad). */
  layerY: number[];
  layerSpin: number[];
  /** Per layer 0..1: slide out toward the camera (the focused layer). */
  layerOut: number[];
  /** World direction "toward the camera" for layerOut (unit, horizontal). */
  outDir: THREE.Vector3;
  /** Book opening per side, radians (0 closed … π/2 flat). */
  bookL: number;
  bookR: number;
  /** Crown + band hover while the book is open (stone units). */
  bookLift: number;
  /** Per layer 0..1: at its specimen station. */
  station: number[];
  /** Station poses: world centre, rotation, scale. */
  stationPos: THREE.Vector3[];
  stationQuat: THREE.Quaternion[];
  /** Per layer: specimen scale at its station (small layers are shown larger). */
  stationScale: number[];
  /** Per layer: arc of the flight to / from its station (world offset at mid-flight). */
  stationArc: THREE.Vector3[];
  crownLift: number;
  bandLift: number;
  split: number;
  /** Cursor lean about the sculpture's centre. */
  tilt: THREE.Quaternion;
};

export function createRig(): Rig {
  return {
    home: new THREE.Vector3(...HOME_A),
    quat: new THREE.Quaternion(),
    homeB: new THREE.Vector3(),
    quatB: new THREE.Quaternion(),
    atB: [0, 0, 0, 0],
    open: 0,
    layerY: [0, 0, 0, 0],
    layerSpin: [0, 0, 0, 0],
    layerOut: [0, 0, 0, 0],
    outDir: new THREE.Vector3(0, 0, 1),
    bookL: 0,
    bookR: 0,
    bookLift: 0,
    station: [0, 0, 0, 0],
    stationPos: [0, 1, 2, 3].map(() => new THREE.Vector3()),
    stationQuat: [0, 1, 2, 3].map(() => new THREE.Quaternion()),
    stationScale: [1, 1, 1, 1],
    stationArc: [0, 1, 2, 3].map(() => new THREE.Vector3()),
    crownLift: 0,
    bandLift: 0,
    split: 0,
    tilt: new THREE.Quaternion(),
  };
}

/* Anatomy constants (stone units). */
export const OPEN = { crown: 0.42, band: 0.16, x: 0.2, tilt: 0.07 };
/** Book hinge: the back corner of the girdle, where both blades' cut faces meet. */
const HINGE_Z = -STONE.halfDiag;

const Y = new THREE.Vector3(0, 1, 0);
const Zax = new THREE.Vector3(0, 0, 1);
const _p = new THREE.Vector3();
const _c = new THREE.Vector3();
const _o = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _qs = new THREE.Quaternion();

/** Per-layer centre (object space, volume weighted) — stations hold layers rigid about it. */
let layerCentre: THREE.Vector3[] = [];
/** Per-piece centre of its BLADE (whole side) — the book and the cut move blades as one. */
let bladeCentre: THREE.Vector3[] = [];

function centreOf(members: FragInfo[]): THREE.Vector3 {
  const v = members.reduce((a, f) => a + f.volume, 0);
  return members.reduce((a, f) => a.addScaledVector(f.centroid, f.volume / v), new THREE.Vector3());
}

export function prepareRig(frags: FragInfo[]): void {
  layerCentre = [0, 1, 2, 3].map((L) => centreOf(frags.filter((f) => f.layer === L)));
  bladeCentre = frags.map((f) => (f.side === 0 ? f.centroid.clone() : centreOf(frags.filter((g) => g.side === f.side))));
}

export function layerCentreOf(L: number): THREE.Vector3 {
  return layerCentre[L];
}

export function bladeCentreOf(i: number): THREE.Vector3 {
  return bladeCentre[i];
}

/** Rotate point p about the vertical line through (cx, ·, cz) by angle a. */
function rotY(p: THREE.Vector3, cx: number, cz: number, a: number) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const dx = p.x - cx;
  const dz = p.z - cz;
  p.x = cx + dx * c + dz * s;
  p.z = cz - dx * s + dz * c;
}

/**
 * The piece's pose in stone object space (before the stone's rotation): its
 * centroid moved by the anatomy offsets and the stack. Writes pos/quat.
 */
function localPose(f: FragInfo, r: Rig, pos: THREE.Vector3, quat: THREE.Quaternion) {
  pos.copy(f.centroid);
  quat.identity();
  const s = f.side;
  const isBlade = s !== 0;

  /* ch01 — the cut opens along the mark. */
  if (r.open > 0) {
    if (f.piece === "crown") pos.y += OPEN.crown * r.open;
    else if (f.piece === "band") pos.y += OPEN.band * r.open;
    else {
      // Blades part and lean out a touch from the girdle, like a seed pod opening.
      const a = s * OPEN.tilt * r.open;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const x = pos.x;
      const y = pos.y;
      pos.x = x * c - y * sn + s * OPEN.x * r.open;
      pos.y = x * sn + y * c;
      _q.setFromAxisAngle(Zax, a);
      quat.premultiply(_q);
    }
  }

  /* ch03 — the book: each blade swings on the back spine so its cut face turns to the front. */
  if (isBlade) {
    const a = s < 0 ? r.bookL : r.bookR;
    if (a > 0) {
      rotY(pos, 0, HINGE_Z, s * a);
      _q.setFromAxisAngle(Y, s * a);
      quat.premultiply(_q);
    }
  } else if (r.bookLift > 0) {
    pos.y += r.bookLift * (f.piece === "crown" ? 1 : 0.55);
  }

  /* ch06 — the mark's offsets. */
  if (f.piece === "crown") pos.y += 0.1 * r.crownLift;
  if (f.piece === "band") pos.y += MARK.lift * r.bandLift;
  if (isBlade) pos.x += s * MARK.split * r.split;

  /* ch02 — the stack. */
  const L = f.layer;
  pos.y += r.layerY[L];
  const spin = r.layerSpin[L];
  if (spin !== 0) {
    rotY(pos, 0, 0, spin);
    _q.setFromAxisAngle(Y, spin);
    quat.premultiply(_q);
  }
}

/**
 * Fill `out` with piece `f`'s world pose under rig `r`. Allocation-free.
 * `centre` is the sculpture's pivot for the cursor lean (world).
 */
export function piecePose(f: FragInfo, r: Rig, out: Pose): void {
  localPose(f, r, _p, _q2);
  const b = r.atB[f.layer] > 0.5;
  const home = b ? r.homeB : r.home;
  const q = b ? r.quatB : r.quat;
  out.pos.copy(_p).applyQuaternion(q).add(home);
  out.quat.copy(q).multiply(_q2);
  out.scale.set(1, 1, 1);

  // The focused layer slides out toward the camera.
  const o = r.layerOut[f.layer];
  if (o > 0) out.pos.addScaledVector(r.outDir, 0.34 * o);

  // Cursor lean about the sculpture's centre (home + the stone's mid-height).
  _c.set(home.x, home.y + STONE.centerY, home.z);
  out.pos.sub(_c).applyQuaternion(r.tilt).add(_c);
  out.quat.premultiply(r.tilt);

  /* ch04 — the specimen stations. Each layer flies as one rigid body about its
     own centre, on an arc, scaling up to specimen size on the way. */
  const w = r.station[f.layer];
  if (w > 0) {
    const L = f.layer;
    const e = w;
    // Offset of this piece from its layer centre, in the piece's current frame.
    _o.copy(f.centroid).sub(layerCentre[L]);
    // Where the layer centre is now (from this piece's pose).
    _qs.copy(out.quat);
    _c.copy(_o).applyQuaternion(_qs);
    const fromX = out.pos.x - _c.x;
    const fromY = out.pos.y - _c.y;
    const fromZ = out.pos.z - _c.z;
    const to = r.stationPos[L];
    const arc = Math.sin(Math.PI * e);
    const A = r.stationArc[L];
    const cx = fromX + (to.x - fromX) * e + A.x * arc;
    const cy = fromY + (to.y - fromY) * e + A.y * arc;
    const cz = fromZ + (to.z - fromZ) * e + A.z * arc;
    out.quat.copy(_qs).slerp(r.stationQuat[L], e);
    const sc = 1 + (r.stationScale[L] - 1) * e;
    _c.copy(_o).multiplyScalar(sc).applyQuaternion(out.quat);
    out.pos.set(cx + _c.x, cy + _c.y, cz + _c.z);
    out.scale.setScalar(sc);
  }
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
