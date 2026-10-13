import * as THREE from "three";
import { Batch, at, ball, capsule, turned } from "./model";
import { satinMat } from "./mats";

/**
 * A FIGURE: the white, blank, gender-neutral person of an architect's model
 * at full size. No face, no hair: an egg of a head, smooth limbs, mitten
 * hands. Two people carry the story (people.ts), the customer and the owner,
 * and they are the same figure.
 *
 * A skeleton of Object3Ds (forward kinematics for the body, the head and the
 * hands) and two-bone inverse kinematics for the arms and legs, so a hand
 * lands on a key, a phone, a lamp's switch, and a foot stays where it was put.
 * Bones hang along their own -Y in the rest pose (arms down, legs straight).
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const DOWN = V(0, -1, 0);

export const BODY = {
  hip: 0.94,
  spine: 0.085,
  chest: 0.22,
  neck: 0.225,
  head: 0.075,
  shoulder: V(0.178, 0.165, -0.005),
  upper: 0.285,
  fore: 0.258,
  hand: 0.17,
  hipJ: V(0.092, -0.045, 0),
  thigh: 0.43,
  shin: 0.425,
  ankle: 0.065,
  foot: 0.235,
};

export type Side = 0 | 1;

type Limb = { a: THREE.Object3D; b: THREE.Object3D; c: THREE.Object3D; la: number; lb: number };

const _v = new THREE.Vector3();
const _w = new THREE.Vector3();
const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _e = new THREE.Euler();

/** A world rotation whose local axes are x, y, z (orthonormal). */
function basis(x: THREE.Vector3, y: THREE.Vector3, z: THREE.Vector3, out: THREE.Quaternion) {
  _m.makeBasis(x, y, z);
  return out.setFromRotationMatrix(_m);
}

/** Set an Object3D's local rotation from a wanted world rotation. */
function setWorldQ(o: THREE.Object3D, q: THREE.Quaternion) {
  o.parent!.getWorldQuaternion(_q2);
  o.quaternion.copy(_q2.invert().multiply(q));
}

export class Figure {
  readonly root = new THREE.Group();
  readonly hips = new THREE.Object3D();
  readonly spine = new THREE.Object3D();
  readonly chest = new THREE.Object3D();
  readonly neck = new THREE.Object3D();
  readonly head = new THREE.Object3D();
  readonly arms: [Limb, Limb];
  readonly legs: [Limb, Limb];
  readonly hands: [THREE.Object3D, THREE.Object3D];
  readonly feet: [THREE.Object3D, THREE.Object3D];
  readonly meshes: THREE.Mesh[] = [];

  constructor(mat: THREE.Material = satinMat(new THREE.Color(0.93, 0.915, 0.89), 0.46)) {
    const r = this.root;
    r.add(this.hips);
    this.hips.position.y = BODY.hip;
    this.hips.add(this.spine);
    this.spine.position.y = BODY.spine;
    this.spine.add(this.chest);
    this.chest.position.y = BODY.chest;
    this.chest.add(this.neck);
    this.neck.position.set(0, BODY.neck, -0.012);
    this.neck.add(this.head);
    this.head.position.y = BODY.head;

    const part = (o: THREE.Object3D, g: THREE.BufferGeometry) => {
      const m = new THREE.Mesh(g, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      o.add(m);
      this.meshes.push(m);
      return m;
    };
    const shade = (y0: number, y1: number, lo = 0.8) => (p: THREE.Vector3) => lo + (1 - lo) * Math.min(1, Math.max(0, (p.y - y0) / (y1 - y0)));

    // The pelvis and the abdomen: smooth, neither broad-hipped nor broad-shouldered.
    part(this.hips, new Batch().add(ball(1, 28, 18), at(0, 0.005, 0, 0, 0, 0, 0.158, 0.118, 0.11), shade(-0.1, 0.05, 0.82)).build());
    part(this.spine, new Batch().add(ball(1, 28, 18), at(0, 0.09, 0.004, 0, 0, 0, 0.135, 0.15, 0.1), 1).build());
    // The chest: a soft barrel tapering to the shoulders.
    part(
      this.chest,
      new Batch()
        .add(turned([[0.0, -0.02], [0.118, 0.0], [0.142, 0.07], [0.15, 0.15], [0.14, 0.205], [0.11, 0.235], [0.05, 0.252], [0.0, 0.255]], 32), at(0, 0, -0.004, 0, 0, 0, 1, 1, 0.7), 1)
        .add(ball(0.052, 18, 12), at(BODY.shoulder.x - 0.006, BODY.shoulder.y + 0.005, -0.005), 1)
        .add(ball(0.052, 18, 12), at(-BODY.shoulder.x + 0.006, BODY.shoulder.y + 0.005, -0.005), 1)
        .build()
    );
    part(this.neck, new Batch().add(capsule(0.08, 0.044, 0.04, 16), at(0, -0.01, 0), 0.85).build());
    // The head: an egg, a little longer at the back, the chin's taper toward the front.
    part(
      this.head,
      new Batch()
        .add(
          turned(
            [
              [0.0, -0.035],
              [0.045, -0.03],
              [0.07, 0.0],
              [0.085, 0.05],
              [0.091, 0.1],
              [0.088, 0.14],
              [0.074, 0.18],
              [0.046, 0.207],
              [0.0, 0.216],
            ],
            40
          ),
          at(0, 0, 0.008, 0.16, 0, 0, 1, 1, 1.08),
          1
        )
        .build()
    );

    const mkArm = (s: Side): Limb => {
      const sg = s === 0 ? 1 : -1;
      const a = new THREE.Object3D();
      a.position.set(sg * BODY.shoulder.x, BODY.shoulder.y, BODY.shoulder.z);
      this.chest.add(a);
      const b = new THREE.Object3D();
      b.position.y = -BODY.upper;
      a.add(b);
      const c = new THREE.Object3D();
      c.position.y = -BODY.fore;
      b.add(c);
      part(a, new Batch().add(capsule(BODY.upper, 0.046, 0.036, 18), at(0, 0, 0, Math.PI, 0, 0), 1).build());
      part(b, new Batch().add(capsule(BODY.fore, 0.036, 0.027, 18), at(0, 0, 0, Math.PI, 0, 0), 1).build());
      // A mitten hand: the palm, the fingers together, the thumb apart (toward the body's front).
      part(
        c,
        new Batch()
          .add(ball(1, 18, 12), at(0, -0.045, 0, 0, 0, 0, 0.042, 0.052, 0.018), 1)
          .add(capsule(0.075, 0.019, 0.016, 14), at(0, -0.075, 0, Math.PI, 0, 0, 1.85, 1, 0.9), 1)
          .add(capsule(0.05, 0.012, 0.01, 12), at(sg * -0.03, -0.035, -0.008, Math.PI + 0.35, 0, sg * 0.55), 1)
          .build()
      );
      return { a, b, c, la: BODY.upper, lb: BODY.fore };
    };
    const mkLeg = (s: Side): Limb => {
      const sg = s === 0 ? 1 : -1;
      const a = new THREE.Object3D();
      a.position.set(sg * BODY.hipJ.x, BODY.hipJ.y, BODY.hipJ.z);
      this.hips.add(a);
      const b = new THREE.Object3D();
      b.position.y = -BODY.thigh;
      a.add(b);
      const c = new THREE.Object3D();
      c.position.y = -BODY.shin;
      b.add(c);
      part(a, new Batch().add(capsule(BODY.thigh, 0.072, 0.05, 20), at(0, 0.02, 0, Math.PI, 0, 0), 1).build());
      part(b, new Batch().add(capsule(BODY.shin, 0.05, 0.034, 18), at(0, 0, 0, Math.PI, 0, 0), 1).build());
      // The foot: a soft wedge running forward (+Z) from the ankle.
      part(
        c,
        new Batch()
          .add(ball(1, 20, 12), at(0, -0.035, 0.055, 0, 0, 0, 0.045, 0.034, 0.118), shade(-0.07, -0.02, 0.75))
          .add(ball(1, 16, 10), at(0, -0.022, -0.01, 0, 0, 0, 0.04, 0.042, 0.05), 1)
          .build()
      );
      return { a, b, c, la: BODY.thigh, lb: BODY.shin };
    };
    this.arms = [mkArm(0), mkArm(1)];
    this.legs = [mkLeg(0), mkLeg(1)];
    this.hands = [this.arms[0].c, this.arms[1].c];
    this.feet = [this.legs[0].c, this.legs[1].c];
  }

  /** Back to standing straight at the origin. */
  rest() {
    for (const o of [this.hips, this.spine, this.chest, this.neck, this.head]) o.quaternion.identity();
    for (const l of [...this.arms, ...this.legs]) {
      l.a.quaternion.identity();
      l.b.quaternion.identity();
      l.c.quaternion.identity();
    }
    this.hips.position.set(0, BODY.hip, 0);
  }

  /** Place the whole figure: feet's ground point and the way it faces (yaw: +Z forward at 0). */
  place(x: number, y: number, z: number, yaw: number) {
    this.root.position.set(x, y, z);
    this.root.rotation.set(0, yaw, 0);
  }

  /** Body angles (radians): pitch forward is +x. */
  body(hipX: number, hipY: number, hipZ: number, spine: [number, number, number], chest: [number, number, number], neck: [number, number, number], head: [number, number, number], hipPos?: THREE.Vector3) {
    if (hipPos) this.hips.position.copy(hipPos);
    this.hips.quaternion.setFromEuler(_e.set(hipX, hipY, hipZ, "YXZ"));
    this.spine.quaternion.setFromEuler(_e.set(spine[0], spine[1], spine[2], "YXZ"));
    this.chest.quaternion.setFromEuler(_e.set(chest[0], chest[1], chest[2], "YXZ"));
    this.neck.quaternion.setFromEuler(_e.set(neck[0], neck[1], neck[2], "YXZ"));
    this.head.quaternion.setFromEuler(_e.set(head[0], head[1], head[2], "YXZ"));
  }

  /** Turn the head (and a share of the neck) to look at a point in the world, by weight k. */
  look(p: THREE.Vector3, k = 1) {
    if (k <= 0) return;
    this.root.updateMatrixWorld(true);
    for (const [o, share] of [
      [this.neck, 0.35],
      [this.head, 1],
    ] as const) {
      o.getWorldPosition(_v);
      _z.subVectors(p, _v);
      _z.y += 0.05;
      _z.normalize();
      // The head's forward is +Z, up +Y.
      _x.crossVectors(V(0, 1, 0), _z).normalize();
      _y.crossVectors(_z, _x).normalize();
      basis(_x, _y, _z, _q);
      o.parent!.getWorldQuaternion(_q2);
      const local = _q2.invert().multiply(_q);
      o.quaternion.slerp(local, k * share);
      o.updateMatrixWorld(true);
    }
  }

  /**
   * Two-bone IK: the limb's end (a wrist, an ankle) to `target` (world), its
   * middle joint (elbow, knee) bending toward `pole` (a world direction).
   * `endQ`, if given, is the hand's or the foot's world rotation.
   */
  reach(limb: Limb, target: THREE.Vector3, pole: THREE.Vector3, endQ?: THREE.Quaternion | null) {
    this.root.updateMatrixWorld(true);
    const A = limb.a.getWorldPosition(new THREE.Vector3());
    const a = limb.la;
    const b = limb.lb;
    _v.subVectors(target, A);
    let c = _v.length();
    c = Math.min(a + b - 1e-4, Math.max(Math.abs(a - b) + 1e-4, c));
    const d = _v.normalize().clone();
    const cosA = (a * a + c * c - b * b) / (2 * a * c);
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    // The pole, made square to the reach.
    const p = _w.copy(pole).addScaledVector(d, -pole.dot(d));
    if (p.lengthSq() < 1e-8) p.set(0, 0, 1).addScaledVector(d, -d.z);
    p.normalize();
    const E = A.clone().addScaledVector(d, a * cosA).addScaledVector(p, a * sinA);
    const T = A.clone().addScaledVector(d, c);
    const u = E.clone().sub(A).normalize();
    const l = T.clone().sub(E).normalize();
    // The hinge: square to both bones (falls back to the pole's side when straight).
    const hinge = new THREE.Vector3().crossVectors(l, u);
    if (hinge.lengthSq() < 1e-8) hinge.crossVectors(p, u);
    hinge.normalize();
    // Bone frames: local -Y along the bone, local X the hinge.
    _y.copy(u).negate();
    _x.copy(hinge);
    _z.crossVectors(_x, _y).normalize();
    _x.crossVectors(_y, _z).normalize();
    basis(_x, _y, _z, _q);
    setWorldQ(limb.a, _q);
    limb.a.updateMatrixWorld(true);
    _y.copy(l).negate();
    _x.copy(hinge);
    _z.crossVectors(_x, _y).normalize();
    _x.crossVectors(_y, _z).normalize();
    basis(_x, _y, _z, _q);
    setWorldQ(limb.b, _q);
    limb.b.updateMatrixWorld(true);
    if (endQ) setWorldQ(limb.c, endQ);
    else limb.c.quaternion.identity();
    limb.c.updateMatrixWorld(true);
  }

  /** A hand's world rotation from where its fingers point and where its palm faces. */
  static handQ(fingers: THREE.Vector3, palm: THREE.Vector3, out = new THREE.Quaternion()) {
    // The hand's local -Y runs along the fingers; its local -Z… we use +Z as the back of the hand.
    _y.copy(fingers).normalize().negate();
    _z.copy(palm).normalize().negate();
    _z.addScaledVector(_y, -_z.dot(_y)).normalize();
    _x.crossVectors(_y, _z).normalize();
    return basis(_x, _y, _z, out);
  }

  /** A foot's world rotation from where its toes point (and the ground's up). */
  static footQ(toes: THREE.Vector3, out = new THREE.Quaternion()) {
    _z.copy(toes).setY(0).normalize();
    _y.set(0, 1, 0);
    _x.crossVectors(_y, _z).normalize();
    return basis(_x, _y, _z, out);
  }

  /** A point in the figure's own frame (+Z its front), in the world. */
  toWorld(x: number, y: number, z: number, out = new THREE.Vector3()) {
    this.root.updateMatrixWorld(true);
    return out.set(x, y, z).applyMatrix4(this.root.matrixWorld);
  }
  /** A direction in the figure's frame, in the world. */
  dirWorld(x: number, y: number, z: number, out = new THREE.Vector3()) {
    return out.set(x, y, z).applyQuaternion(this.root.quaternion).normalize();
  }
}

export { DOWN };
