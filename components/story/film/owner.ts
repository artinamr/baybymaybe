import * as THREE from "three";
import type { Kit, Piece } from "./kit";
import { between, gearGeometry, lathe, unitBox, unitCyl, torus } from "./geo";
import { CORNER_YAW, CRANK, CX, CZ, FLOOR_Y, corner } from "./layout";
import { clamp01, range, smooth, smoother, spring } from "./ease";
import { KIND } from "./materials";

/**
 * THE OWNER'S CORNER (docs/STORY.md): a windlass, a desk, a lamp and the
 * person who keeps the old machine turning.
 *
 * The windlass is the business's effort made physical: a chain drum between
 * two cast-iron trestles, a heavy flywheel at one end, a two-handed crank at
 * the other, a ratchet that clicks a tooth at a time, and a chain that runs
 * from the drum straight across the pit to the tower. The owner stands at the
 * crank facing us, the tower behind them, and turns it with their whole body:
 * a lean into the push, knees on the low stroke, slower over the hard top,
 * and now and then a stop to straighten up and look at it all.
 *
 * At "Take your hand off the crank" the hands let go. In the rebuilt
 * machine the owner sits at the desk; at six they close the laptop, switch
 * the lamp off, stand and look back at the machine running without them.
 *
 * The figure is a skeleton of pieces (pelvis, chest, head, arms, legs, feet)
 * posed each frame: rigid parts from angles, arms and legs by two-bone IK.
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const AY = V(0, 1, 0);


type RGB = [number, number, number];
const IRON: RGB = [0.1, 0.105, 0.12];
const IRON_L: RGB = [0.19, 0.18, 0.175];
const BRASS: RGB = [0.5, 0.34, 0.13];
const WOOD: RGB = [0.11, 0.062, 0.034];
const WOOD_D: RGB = [0.06, 0.034, 0.02];
const OAK: RGB = [0.2, 0.12, 0.06];
const SHIRT: RGB = [0.1, 0.108, 0.122];
const TROUSER: RGB = [0.028, 0.028, 0.032];
const SHOE: RGB = [0.012, 0.011, 0.01];
const SKIN: RGB = [0.25, 0.165, 0.125];
const HAIR: RGB = [0.016, 0.012, 0.01];

/** The crank: the handle's radius, and where each hand holds the grip (local x). */
export const HANDLE_R = 0.26;
const GRIP = { left: 0.4, right: 0.55, x0: 0.33, x1: 0.62 };
const DRUM_R = 0.2;
/** One link and the next make the chain's repeat. */
const LINK = 0.085;

/** The corner's rotation, and its inverse (pieces move relative to how they were built). */
const qCorner = new THREE.Quaternion().setFromAxisAngle(AY, CORNER_YAW);
const qCornerInv = qCorner.clone().invert();

/** A matrix in the corner's frame: position, then Euler angles, then scale. */
function lm(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)).premultiply(qCorner);
  return new THREE.Matrix4().compose(corner(x, y, z), q, V(sx, sy, sz));
}
/** A matrix placing geometry built along +Y from 0 so that it runs from a to b (no scaling). */
function along(a: THREE.Vector3, b: THREE.Vector3) {
  const q = new THREE.Quaternion().setFromUnitVectors(AY, b.clone().sub(a).normalize());
  return new THREE.Matrix4().compose(a, q, V(1, 1, 1));
}
/** A limb: a tapered capsule along +Y from 0 to len (r0 at the joint, r1 at the end). */
function limb(len: number, r0: number, r1: number, seg = 18) {
  const pts: [number, number][] = [];
  for (let k = 0; k <= 4; k++) {
    const a = -Math.PI / 2 + (k / 4) * (Math.PI / 2);
    pts.push([Math.max(0.0001, r0 * Math.cos(a)), r0 * Math.sin(a)]);
  }
  for (let k = 0; k <= 4; k++) {
    const a = (k / 4) * (Math.PI / 2);
    pts.push([Math.max(0.0001, r1 * Math.cos(a)), len + r1 * Math.sin(a)]);
  }
  return lathe(pts, seg);
}

type Bone = { p: Piece; j0: THREE.Vector3; qRestInv: THREE.Quaternion; len: number };

export type Corner = {
  crank: Piece;
  stand: Piece;
  chain: Piece;
  chainDir: THREE.Vector3;
  sprocket: Piece;
  pawl: Piece;
  desk: Piece;
  chair: Piece;
  laptop: Piece;
  lid: Piece;
  lidHinge: THREE.Vector3;
  lidTop: THREE.Vector3;
  shade: Piece;
  bulb: Piece;
  /** Where the lamp's light is (the bulb), and its switch. */
  lamp: THREE.Vector3;
  lampSwitch: THREE.Vector3;
  owner: Piece[];
  rig: {
    pelvis: Piece;
    chest: Piece;
    head: Piece;
    feet: [Piece, Piece];
    arms: [Bone, Bone, Bone, Bone];
    legs: [Bone, Bone, Bone, Bone];
    H0: THREE.Vector3;
    W0: THREE.Vector3;
    N0: THREE.Vector3;
    S0: [THREE.Vector3, THREE.Vector3];
    J0: [THREE.Vector3, THREE.Vector3];
    A0: [THREE.Vector3, THREE.Vector3];
  };
  /** Hover: the corner's box. */
  box: THREE.Box3;
};

/* ---- the desk's own frame: centred on the floor under it, turned a little ---- */
const DESK_C = V(-1.6, 0, 1.25);
export const DESK_YAW = 0.12;
/** A point in the desk's frame (+z toward the chair, which faces -z) in the corner's frame. */
function dl(x: number, y: number, z: number) {
  const c = Math.cos(DESK_YAW);
  const s = Math.sin(DESK_YAW);
  return V(DESK_C.x + x * c + z * s, y, DESK_C.z - x * s + z * c);
}
/** A point in the desk's frame, in the world. */
export const dw = (x: number, y: number, z: number) => {
  const p = dl(x, y, z);
  return corner(p.x, p.y, p.z);
};
function dm(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const p = dl(x, y, z);
  return lm(p.x, p.y, p.z, rx, ry + DESK_YAW, rz, sx, sy, sz);
}

/** Where the owner stands at the crank (feet midpoint, corner frame). */
const STAND = V(0.475, 0, 0.57);

export function buildCorner(kit: Kit, tower: { sprocket: THREE.Vector3; column: THREE.Vector3 }): Corner {
  /* ---- the windlass ---- */
  const stand = kit.piece(CRANK.clone(), "crankstand", 1.4);
  for (const x of [-0.7, 0.21]) {
    // A trestle: two raked legs to the bearing, a brace, a cap.
    for (const z of [-0.44, 0.44]) kit.add("iron", unitBox, stand, between(corner(x, 0.04, z), corner(x, 1.0, z * 0.08), [0.075, 0.06]), IRON, 0.55);
    kit.add("iron", unitBox, stand, lm(x, 0.42, 0, 0, 0, 0, 0.05, 0.06, 0.64), IRON, 0.6);
    kit.add("iron", unitBox, stand, lm(x, 0.98, 0, 0, 0, 0, 0.11, 0.13, 0.17), IRON_L, 0.4);
    kit.add("iron", unitBox, stand, lm(x, 1.07, 0, 0, 0, 0, 0.12, 0.035, 0.19), IRON_L, 0.3);
    for (const z of [-0.06, 0.06]) kit.add("iron", unitCyl(8), stand, lm(x, 1.1, z, 0, 0, 0, 0.026, 0.03, 0.026), BRASS, 0.2);
  }
  // Sills on the floor, bolted down.
  for (const z of [-0.44, 0.44]) {
    kit.add("iron", unitBox, stand, lm(-0.25, 0.045, z, 0, 0, 0, 1.25, 0.09, 0.13), IRON, 0.7);
    for (const x of [-0.82, 0.32]) kit.add("iron", unitCyl(8), stand, lm(x, 0.1, z, 0, 0, 0, 0.04, 0.03, 0.04), IRON_L, 0.4);
  }
  // The rotating part: axle, drum (planks, iron bands, the chain wound on it),
  // flywheel, ratchet wheel, crank arm and the wooden grip.
  const crank = kit.piece(CRANK.clone(), "crank", 1.4);
  const rx = (x: number, y = 1.0, z = 0) => lm(x, y, z, 0, 0, Math.PI / 2);
  kit.add("iron", new THREE.CylinderGeometry(0.034, 0.034, 1.45, 14), crank, rx(-0.27), IRON_L, 0.3);
  kit.add("cloth", new THREE.CylinderGeometry(DRUM_R, DRUM_R, 0.74, 28, 1), crank, rx(-0.25), WOOD, KIND.wood);
  for (const x of [-0.6, -0.25, 0.1]) kit.add("iron", torus(DRUM_R + 0.004, 0.016, 6, 40), crank, lm(x, 1.0, 0, 0, Math.PI / 2, 0), IRON, 0.5);
  for (let k = 0; k < 12; k++) {
    // Staves: a groove every so often, so the drum's turn reads.
    const a = (k / 12) * Math.PI * 2;
    kit.add("cloth", unitBox, crank, lm(-0.25, 1.0 + Math.sin(a) * (DRUM_R + 0.002), Math.cos(a) * (DRUM_R + 0.002), a, 0, 0, 0.72, 0.006, 0.012), WOOD_D, KIND.wood);
  }
  for (let k = 0; k < 4; k++) kit.add("iron", torus(DRUM_R + 0.018, 0.013, 6, 40), crank, lm(-0.5 + k * 0.035, 1.0, 0, 0, Math.PI / 2, 0), IRON_L, 0.35);
  // Flywheel: rim, six spokes, hub.
  const rim = lathe([[0.37, -0.055], [0.43, -0.06], [0.445, -0.04], [0.445, 0.04], [0.43, 0.06], [0.37, 0.055], [0.365, 0.0], [0.37, -0.055]], 72);
  kit.add("iron", rim, crank, rx(-0.84), IRON, 0.35);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    kit.add("iron", unitBox, crank, between(corner(-0.84, 1.0 + Math.sin(a) * 0.07, Math.cos(a) * 0.07), corner(-0.84, 1.0 + Math.sin(a) * 0.38, Math.cos(a) * 0.38), [0.03, 0.055], 0), IRON, 0.4);
  }
  kit.add("iron", new THREE.CylinderGeometry(0.085, 0.085, 0.17, 20), crank, rx(-0.84), IRON_L, 0.3);
  kit.add("iron", new THREE.CylinderGeometry(0.05, 0.05, 0.2, 14), crank, rx(-0.84), BRASS, 0.15);
  // Ratchet wheel (the pawl rides on it).
  kit.add("iron", gearGeometry(0.17, 18, 0.045, 4), crank, lm(0.15, 1.0, 0, 0, Math.PI / 2, 0), IRON_L, 0.35);
  // Crank arm and grip (built pointing at the owner: local +z).
  kit.add("iron", unitBox, crank, between(corner(0.3, 1.0, 0), corner(0.3, 1.0, HANDLE_R), [0.06, 0.035]), IRON, 0.35);
  kit.add("iron", new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16), crank, rx(0.3), IRON_L, 0.3);
  kit.add("iron", new THREE.CylinderGeometry(0.02, 0.02, GRIP.x1 - 0.28, 10), crank, rx((0.28 + GRIP.x1) / 2, 1.0, HANDLE_R), IRON_L, 0.2);
  kit.add("cloth", new THREE.CylinderGeometry(0.031, 0.031, GRIP.x1 - GRIP.x0, 16), crank, rx((GRIP.x0 + GRIP.x1) / 2, 1.0, HANDLE_R), OAK, KIND.wood);
  kit.add("iron", new THREE.CylinderGeometry(0.036, 0.036, 0.02, 14), crank, rx(GRIP.x1 + 0.01, 1.0, HANDLE_R), BRASS, 0.1);
  // The pawl: a short lever on the near trestle, dropping into each tooth.
  const pawlPivot = corner(0.2, 1.24, -0.06);
  const pawl = kit.piece(pawlPivot, "pawl", 0.3);
  kit.add("iron", unitBox, pawl, between(pawlPivot, corner(0.16, 1.15, 0.05), [0.03, 0.025]), BRASS, 0.2);
  kit.add("iron", new THREE.CylinderGeometry(0.018, 0.018, 0.08, 10), pawl, lm(0.2, 1.24, -0.06, 0, 0, Math.PI / 2), IRON_L, 0.2);

  // The chain: off the top of the drum, straight across the pit to the tower.
  const c0 = corner(-0.25, 1.0 + DRUM_R + 0.02, -0.03);
  const c1 = tower.sprocket.clone().add(V(0, 0.28, 0));
  const chainDir = c1.clone().sub(c0).normalize();
  const chain = kit.piece(c0.clone().lerp(c1, 0.5), "chain", c0.distanceTo(c1));
  {
    const n = Math.ceil(c0.distanceTo(c1) / LINK) + 2;
    for (let k = -1; k < n; k++) {
      const a = c0.clone().addScaledVector(chainDir, k * LINK);
      const b = c0.clone().addScaledVector(chainDir, k * LINK + LINK * 0.92);
      kit.add("iron", unitBox, chain, between(a, b, k % 2 ? [0.009, 0.03] : [0.03, 0.009]), IRON_L, 0.7);
    }
  }
  // The sprocket it drives on the column, on a bracket.
  const sprocket = kit.piece(tower.sprocket.clone(), "gear", 0.6);
  {
    const s = tower.sprocket;
    const m = new THREE.Matrix4().compose(s, new THREE.Quaternion().setFromAxisAngle(AY, CORNER_YAW + Math.PI / 2), V(1, 1, 1));
    kit.add("iron", gearGeometry(0.28, 14, 0.07, 5), sprocket, m, IRON_L, 0.5);
  }
  const bracket = kit.piece(tower.column.clone(), "frame", 1.4);
  kit.add("iron", unitBox, bracket, between(tower.sprocket.clone().addScaledVector(CX, -0.12), tower.column.clone().setY(tower.sprocket.y), [0.12, 0.16]), IRON, 0.6);
  kit.add("iron", unitBox, bracket, between(tower.sprocket.clone().addScaledVector(CX, 0.12), tower.column.clone().setY(tower.sprocket.y - 0.9), [0.08, 0.1]), IRON, 0.6);

  /* ---- the desk, lamp, laptop, papers, mug; the chair ---- */
  const desk = kit.piece(dw(0, 0.4, 0), "desk", 1.6);
  kit.add("cloth", unitBox, desk, dm(0, 0.745, 0, 0, 0, 0, 1.4, 0.035, 0.72), OAK, KIND.wood);
  kit.add("cloth", unitBox, desk, dm(0, 0.705, 0, 0, 0, 0, 1.32, 0.05, 0.64), WOOD, KIND.wood);
  for (const [x, z] of [
    [-0.64, -0.3],
    [0.64, -0.3],
    [-0.64, 0.3],
    [0.64, 0.3],
  ])
    kit.add("cloth", unitBox, desk, dm(x, 0.36, z, 0, 0, 0, 0.045, 0.72, 0.045), WOOD, KIND.wood);
  kit.add("cloth", unitBox, desk, dm(0.42, 0.5, 0, 0, 0, 0, 0.4, 0.38, 0.6), WOOD, KIND.wood);
  for (const y of [0.4, 0.58]) kit.add("iron", unitBox, desk, dm(0.42, y, 0.305, 0, 0, 0, 0.1, 0.012, 0.012), BRASS, 0.1);
  // Paper: an untidy stack and a few loose sheets; a notebook; a mug.
  for (let k = 0; k < 6; k++) kit.add("cloth", unitBox, desk, dm(0.26 + (k % 3) * 0.01, 0.768 + k * 0.006, -0.1 - (k % 2) * 0.012, 0, 0.1 * Math.sin(k * 2.3), 0, 0.21, 0.004, 0.297), [0.55, 0.53, 0.49], 0);
  kit.add("cloth", unitBox, desk, dm(0.05, 0.765, 0.2, 0, 0.5, 0, 0.21, 0.003, 0.297), [0.6, 0.58, 0.54], 0);
  kit.add("cloth", unitBox, desk, dm(-0.32, 0.772, 0.14, 0, -0.3, 0, 0.15, 0.016, 0.21), [0.09, 0.1, 0.13], 0);
  kit.add("cloth", new THREE.CylinderGeometry(0.042, 0.038, 0.1, 18), desk, dm(0.47, 0.814, 0.17), [0.42, 0.4, 0.37], 0);
  kit.add("cloth", torus(0.026, 0.008, 6, 14), desk, dm(0.51, 0.82, 0.17, 0, 0, 0), [0.42, 0.4, 0.37], 0);
  // The lamp: a weighted base, two arms with springs, a shade over the papers.
  const base = dl(-0.5, 0.765, -0.2);
  const elbow = dl(-0.44, 1.12, -0.28);
  const head = dl(-0.24, 1.18, -0.06);
  const toW = (p: THREE.Vector3) => corner(p.x, p.y, p.z);
  kit.add("iron", new THREE.CylinderGeometry(0.085, 0.095, 0.022, 28), desk, dm(-0.5, 0.776, -0.2), IRON, 0.1);
  kit.add("iron", unitBox, desk, between(toW(base), toW(elbow), 0.016), IRON, 0.1);
  kit.add("iron", unitBox, desk, between(toW(base).add(V(0, 0, 0.0)).addScaledVector(CX, 0.03), toW(elbow).addScaledVector(CX, 0.03), 0.008), IRON_L, 0.1);
  kit.add("iron", unitBox, desk, between(toW(elbow), toW(head), 0.016), IRON, 0.1);
  kit.add("iron", new THREE.SphereGeometry(0.02, 10, 8), desk, new THREE.Matrix4().makeTranslation(toW(elbow)), IRON_L, 0.1);
  const lampSwitch = dw(-0.45, 0.795, -0.14);
  kit.add("iron", new THREE.CylinderGeometry(0.011, 0.011, 0.02, 10), desk, new THREE.Matrix4().makeTranslation(lampSwitch), BRASS, 0.1);
  const shadeAt = toW(head);
  const aim = dw(-0.12, 0.78, 0.08);
  const shade = kit.piece(shadeAt.clone(), "shade", 0.3);
  {
    // A cone opening toward the papers.
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, -1, 0), aim.clone().sub(shadeAt).normalize());
    const g = new THREE.ConeGeometry(0.09, 0.15, 28, 1, true);
    g.rotateX(Math.PI);
    kit.add("iron", g, shade, new THREE.Matrix4().compose(shadeAt.clone().add(aim.clone().sub(shadeAt).normalize().multiplyScalar(0.05)), q, V(1, 1, 1)), IRON, 0.05);
    kit.add("iron", new THREE.SphereGeometry(0.03, 12, 8), shade, new THREE.Matrix4().makeTranslation(shadeAt), IRON, 0.05);
  }
  const lamp = shadeAt.clone().add(aim.clone().sub(shadeAt).normalize().multiplyScalar(0.085));
  const bulb = kit.piece(lamp.clone(), "bulb", 0.1);
  kit.add("light", new THREE.SphereGeometry(0.034, 12, 10), bulb, new THREE.Matrix4().makeTranslation(lamp), [16, 9.6, 4.2]);

  // The laptop (its lid hinged at the back edge, open toward the chair).
  const laptop = kit.piece(dw(-0.04, 0.77, 0.04), "laptop", 0.4);
  kit.add("iron", unitBox, laptop, dm(-0.04, 0.771, 0.04, 0, 0, 0, 0.32, 0.013, 0.22), [0.32, 0.33, 0.35], 0);
  kit.add("cloth", unitBox, laptop, dm(-0.04, 0.778, 0.07, 0, 0, 0, 0.27, 0.002, 0.09), [0.03, 0.03, 0.035], 0);
  const lidHinge = dw(-0.04, 0.778, -0.07);
  const lid = kit.piece(lidHinge.clone(), "lid", 0.4);
  const OPEN = -0.27;
  {
    const ld = (y: number, z: number, t = 0) => dl(-0.04, 0.778 + y * Math.cos(OPEN) - t * Math.sin(OPEN), -0.07 + y * Math.sin(OPEN) + t * Math.cos(OPEN));
    const c = ld(0.105, -0.004);
    kit.add("iron", unitBox, lid, lm(c.x, c.y, c.z, OPEN, DESK_YAW, 0, 0.32, 0.21, 0.008), [0.32, 0.33, 0.35], 0);
    const g = ld(0.105, 0.0005);
    kit.add("light", new THREE.PlaneGeometry(0.29, 0.185), lid, lm(g.x, g.y, g.z, OPEN, DESK_YAW, 0), [0.7, 0.82, 1.05]);
  }
  const lidTop = (() => {
    const p = dl(-0.04, 0.778 + 0.21 * Math.cos(OPEN), -0.07 + 0.21 * Math.sin(OPEN));
    return corner(p.x, p.y, p.z);
  })();

  // The chair (built where it is sat on; the old machine has it pushed back).
  const chair = kit.piece(dw(0, 0.46, 0.62), "chair", 1);
  kit.add("cloth", unitBox, chair, dm(0, 0.46, 0.62, 0, 0, 0, 0.44, 0.035, 0.42), WOOD, KIND.wood);
  kit.add("cloth", unitBox, chair, dm(0, 0.76, 0.83, -0.12, 0, 0, 0.42, 0.26, 0.028), WOOD, KIND.wood);
  for (const x of [-0.18, 0.18]) kit.add("cloth", unitBox, chair, between(dw(x, 0.47, 0.81), dw(x, 0.92, 0.86), 0.028), WOOD_D, KIND.wood);
  for (const [x, z] of [
    [-0.19, 0.44],
    [0.19, 0.44],
    [-0.19, 0.8],
    [0.19, 0.8],
  ])
    kit.add("cloth", unitBox, chair, between(dw(x, 0.0, z + (z > 0.6 ? 0.03 : -0.02)), dw(x, 0.45, z), 0.03), WOOD_D, KIND.wood);

  /* ---- the owner ---- */
  const F = STAND;
  const P0 = (x: number, y: number, z = 0) => corner(F.x + x, y, F.z + z);
  const H0 = P0(0, 0.95);
  const W0 = P0(0, 1.03);
  const N0 = P0(0, 1.47);
  const S0: [THREE.Vector3, THREE.Vector3] = [P0(-0.185, 1.415), P0(0.185, 1.415)];
  const J0: [THREE.Vector3, THREE.Vector3] = [P0(-0.095, 0.93), P0(0.095, 0.93)];
  const A0: [THREE.Vector3, THREE.Vector3] = [P0(-0.105, 0.085), P0(0.105, 0.085)];
  const owner: Piece[] = [];
  const restBasis = (dir: THREE.Vector3) => basis(dir, CX, new THREE.Quaternion()).invert();
  const bone = (j0: THREE.Vector3, len: number, tag: string) => {
    const p = kit.piece(j0.clone(), tag, len);
    owner.push(p);
    return { p, j0: j0.clone(), qRestInv: restBasis(V(0, -1, 0)), len } as Bone;
  };

  const pelvis = kit.piece(H0.clone(), "owner", 0.4);
  owner.push(pelvis);
  {
    const g = lathe([[0.0001, -0.125], [0.1, -0.115], [0.152, -0.05], [0.16, 0.02], [0.155, 0.075], [0.152, 0.1], [0.0001, 0.105]], 24);
    kit.add("cloth", g, pelvis, new THREE.Matrix4().compose(H0, qCorner, V(1, 1, 0.66)), TROUSER, 0);
    // A belt.
    kit.add("cloth", new THREE.CylinderGeometry(0.152, 0.152, 0.035, 22, 1, true), pelvis, new THREE.Matrix4().compose(H0.clone().add(V(0, 0.07, 0)), qCorner, V(1, 1, 0.68)), [0.02, 0.016, 0.014], 0);
  }
  const chest = kit.piece(W0.clone(), "owner", 0.6);
  owner.push(chest);
  {
    // Waist to shoulders: narrow at the waist, broad across the chest, sloping shoulders.
    const g = lathe([[0.0001, -0.09], [0.15, -0.08], [0.146, 0.0], [0.15, 0.08], [0.166, 0.19], [0.176, 0.28], [0.176, 0.34], [0.158, 0.392], [0.11, 0.425], [0.05, 0.44], [0.0001, 0.443]], 28);
    kit.add("cloth", g, chest, new THREE.Matrix4().compose(W0, qCorner, V(1, 1, 0.6)), SHIRT, 0);
    // Shoulders: round caps where the sleeves begin.
    for (const s of S0) kit.add("cloth", new THREE.SphereGeometry(0.044, 16, 12), chest, new THREE.Matrix4().makeTranslation(s.clone().add(V(0, -0.012, 0)).addScaledVector(CX, -Math.sign(s.clone().sub(W0).dot(CX)) * 0.02)), SHIRT, 0);
    // A collar.
    kit.add("cloth", new THREE.CylinderGeometry(0.058, 0.07, 0.04, 18, 1, true), chest, new THREE.Matrix4().compose(W0.clone().add(V(0, 0.43, 0)), qCorner, V(1, 1, 0.9)), SHIRT, 0);
  }
  const headP = kit.piece(N0.clone(), "owner", 0.3);
  owner.push(headP);
  {
    kit.add("cloth", limb(0.1, 0.045, 0.043, 14), headP, along(N0, N0.clone().add(V(0, 1, 0))), SKIN, KIND.skin);
    const hc = N0.clone().add(V(0, 0.17, 0)).addScaledVector(CZ, 0.008);
    // One smooth head, a little narrower toward the chin; no features (the
    // figure is anyone). The hair is the head's own colour over the crown and
    // down the back, its edge tilted so the hairline sits high on the forehead.
    const prof: [number, number][] = [];
    for (let i = 0; i <= 18; i++) {
      const t = -Math.PI / 2 + (i / 18) * Math.PI;
      const chin = Math.max(0, -Math.sin(t));
      prof.push([Math.max(0.0001, 0.088 * Math.cos(t) * (1 - 0.2 * chin * chin)), 0.115 * Math.sin(t)]);
    }
    const head = lathe(prof, 36);
    const hairEdge = (v: THREE.Vector3): [number, number, number] => {
      // (Local: y up, z toward the back of the head.)
      const d = v.y * Math.cos(0.5) + v.z * Math.sin(0.5);
      const k = Math.min(1, Math.max(0, (d - 0.012) / 0.014));
      return [SKIN[0] + (HAIR[0] - SKIN[0]) * k, SKIN[1] + (HAIR[1] - SKIN[1]) * k, SKIN[2] + (HAIR[2] - SKIN[2]) * k];
    };
    kit.add("cloth", head, headP, new THREE.Matrix4().compose(hc, qCorner, V(1, 1, 1.1)), hairEdge, KIND.skin);
    // Ears.
    for (const s of [-1, 1]) kit.add("cloth", new THREE.SphereGeometry(1, 10, 8), headP, new THREE.Matrix4().compose(hc.clone().addScaledVector(CX, s * 0.086).add(V(0, -0.012, 0)), qCorner, V(0.011, 0.024, 0.017)), SKIN, KIND.skin);
  }
  // Arms (left, right): sleeve to just below the elbow, then forearm, wrist, a closed hand.
  const arms: Bone[] = [];
  for (const s of S0) {
    const up = bone(s, 0.3, "owner");
    kit.add("cloth", limb(0.3, 0.048, 0.04), up.p, along(s, s.clone().add(V(0, -1, 0))), SHIRT, 0);
    const e = s.clone().add(V(0, -0.3, 0));
    const fo = bone(e, 0.315, "owner");
    kit.add("cloth", limb(0.07, 0.042, 0.041, 16), fo.p, along(e, e.clone().add(V(0, -1, 0))), SHIRT, 0);
    kit.add("cloth", limb(0.25, 0.036, 0.027, 16), fo.p, along(e, e.clone().add(V(0, -1, 0))), SKIN, KIND.skin);
    const h = e.clone().add(V(0, -0.31, 0));
    kit.add("cloth", new THREE.SphereGeometry(1, 14, 10), fo.p, new THREE.Matrix4().compose(h, qCorner, V(0.036, 0.05, 0.03)), SKIN, KIND.skin);
    arms.push(up, fo);
  }
  // Legs: trousers over thigh and shin; shoes on the floor.
  const legs: Bone[] = [];
  const feet: Piece[] = [];
  for (let i = 0; i < 2; i++) {
    const j = J0[i];
    const th = bone(j, 0.43, "owner");
    kit.add("cloth", limb(0.43, 0.078, 0.056), th.p, along(j, j.clone().add(V(0, -1, 0))), TROUSER, 0);
    const k = j.clone().add(V(0, -0.43, 0));
    const sh = bone(k, k.y - A0[i].y, "owner");
    kit.add("cloth", limb(k.y - A0[i].y, 0.054, 0.042), sh.p, along(k, k.clone().add(V(0, -1, 0))), TROUSER, 0);
    legs.push(th, sh);
    const foot = kit.piece(A0[i].clone(), "owner", 0.3);
    owner.push(foot);
    const fc = A0[i].clone().add(V(0, -0.045, 0)).addScaledVector(CZ, -0.06);
    kit.add("cloth", new THREE.SphereGeometry(1, 16, 10), foot, new THREE.Matrix4().compose(fc, qCorner, V(0.048, 0.042, 0.13)), SHOE, 0);
    kit.add("cloth", unitBox, foot, new THREE.Matrix4().compose(fc.clone().add(V(0, -0.028, 0)), qCorner, V(0.095, 0.016, 0.26)), [0.006, 0.005, 0.005], 0);
    feet.push(foot);
  }

  const box = new THREE.Box3().setFromPoints([corner(-1.4, 0, -0.9), corner(1.0, 2.2, 1.0), dw(-0.8, 0, -0.5), dw(0.8, 1.3, 1.0)]);
  return {
    crank,
    stand,
    chain,
    chainDir,
    sprocket,
    pawl,
    desk,
    chair,
    laptop,
    lid,
    lidHinge,
    lidTop,
    shade,
    bulb,
    lamp,
    lampSwitch,
    owner,
    rig: {
      pelvis,
      chest,
      head: headP,
      feet: [feet[0], feet[1]],
      arms: [arms[0], arms[1], arms[2], arms[3]],
      legs: [legs[0], legs[1], legs[2], legs[3]],
      H0,
      W0,
      N0,
      S0,
      J0,
      A0,
    },
    box,
  };
}

/* ---- posing ------------------------------------------------------------------- */

const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _z = new THREE.Vector3();
const _m = new THREE.Matrix4();
/** The rotation whose +Y is `dir` and whose +X leans toward `side`. */
function basis(dir: THREE.Vector3, side: THREE.Vector3, out: THREE.Quaternion) {
  _y.copy(dir).normalize();
  _x.copy(side).addScaledVector(_y, -side.dot(_y));
  if (_x.lengthSq() < 1e-8) _x.set(1, 0, 0).addScaledVector(_y, -_y.x);
  _x.normalize();
  _z.crossVectors(_x, _y);
  _m.makeBasis(_x, _y, _z);
  return out.setFromRotationMatrix(_m);
}

/** Lean forward, turn right, bend right (radians), in the figure's frame. */
type Ang = [number, number, number];
const qE = (a: Ang, out: THREE.Quaternion) =>
  out.setFromEuler(new THREE.Euler(-a[0], -a[1], -a[2], "YXZ"));

export type OwnerPose = {
  /** The figure's turn about y in the corner's frame (0 faces away from the tower; positive turns it to its left). */
  yaw: number;
  /** Where the hips are. Posing may move them (the body coming to a hand): it writes back where they went. */
  hip: THREE.Vector3;
  pelvis: Ang;
  chest: Ang;
  head: Ang;
  hands: [THREE.Vector3, THREE.Vector3];
  /**
   * How far each hand has let go and hangs at the side (0..1). The hang is
   * taken from the shoulder, so a hanging arm goes where the body goes.
   */
  hang: [number, number];
  /**
   * How the body comes to a hand near the end of its reach: 0 the hips carry
   * it (a shift of weight over the feet, standing), 1 a bend at the waist
   * (seated).
   */
  bend: number;
  /** Elbows: how far out to the side they point (0..1). */
  elbowsOut: number;
  /** How far the elbows drop (default 1: hanging under the arm; less when the hands work on a desk, so the elbow stays above it). */
  elbowsDown?: number;
  /**
   * A height the elbows keep above (world y), and how much it holds for each
   * arm (0..1): a hand working on a desk keeps its forearm on top of it, the
   * elbow swinging up round the shoulder-hand line rather than through it.
   */
  elbowFloor?: { y: number; w: [number, number] };
  ankles: [THREE.Vector3, THREE.Vector3];
  feetYaw: number;
  /** Each foot's own turn, when they differ (a step round); else `feetYaw`. */
  footYaw?: [number, number];
};

const _q = new THREE.Quaternion();
const _qr = new THREE.Quaternion();
const _qp = new THREE.Quaternion();
const _qc = new THREE.Quaternion();
const _qh = new THREE.Quaternion();
const _qt = new THREE.Quaternion();
const _qw = new THREE.Quaternion();
const _rP = new THREE.Quaternion();
const _rC = new THREE.Quaternion();
const _d = new THREE.Vector3();
const _pole = new THREE.Vector3();
const _knee = new THREE.Vector3();
const _W = new THREE.Vector3();
const _N = new THREE.Vector3();
const _S = [new THREE.Vector3(), new THREE.Vector3()];
const _T = [new THREE.Vector3(), new THREE.Vector3()];
const _u = [new THREE.Vector3(), new THREE.Vector3()];
const _E = new THREE.Vector3();
const _J = new THREE.Vector3();
const _v = new THREE.Vector3();
const _c = new THREE.Vector3();
const _r = new THREE.Vector3();
const _fh = new THREE.Vector3();
const _rh = new THREE.Vector3();
const _hip = new THREE.Vector3();
const _right = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _rightP = new THREE.Vector3();
const _ff = new THREE.Vector3();
const _ep = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const need = [0, 0];
const goal = [0, 0];

function setBone(b: Bone, J: THREE.Vector3, dir: THREE.Vector3, side: THREE.Vector3) {
  basis(dir, side, _qt);
  b.p.q.copy(_qt).multiply(b.qRestInv);
  b.p.t.copy(J).sub(b.j0);
}

/** Two bones from root to target, bending toward `pole`; the middle joint into `mid`. */
function ik(root: THREE.Vector3, target: THREE.Vector3, a: number, b: number, pole: THREE.Vector3, mid: THREE.Vector3) {
  _d.subVectors(target, root);
  const dist = _d.length();
  const L = Math.min(Math.max(dist, 0.02), a + b - 0.0015);
  _d.normalize();
  const x = (a * a - b * b + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  _pole.copy(pole).addScaledVector(_d, -pole.dot(_d)).normalize();
  mid.copy(root).addScaledVector(_d, x).addScaledVector(_pole, h);
}

/** An arm: the upper arm and the forearm. */
const ARM = 0.3 + 0.315;
/** The most an arm stretches before the body comes with it: the elbow keeps a bend and never locks. */
const REACH = ARM - 0.022;
/** The body starts to come to the hand this much before REACH (a soft start: no jolt). */
const KNEE = 0.06;
const overReach = (x: number) => (x <= -KNEE ? 0 : x >= KNEE ? x : ((x + KNEE) * (x + KNEE)) / (4 * KNEE));
/** max(0, x) with a soft knee of half-width k (no step in speed where it starts). */
const softPos = (x: number, k: number) => (x <= -k ? 0 : x >= k ? x : ((x + k) * (x + k)) / (4 * k));

const _ec = new THREE.Vector3();
const _eu = new THREE.Vector3();
const _ew = new THREE.Vector3();
const _ed = new THREE.Vector3();
/** Swing the elbow `E` round the line from shoulder `S` to hand `T` (the arm's lengths kept) until it is up at `y`, by the shortest way. */
function swivelUp(S: THREE.Vector3, T: THREE.Vector3, E: THREE.Vector3, y: number) {
  _ed.subVectors(T, S);
  if (_ed.lengthSq() < 1e-8) return;
  _ed.normalize();
  _ec.copy(S).addScaledVector(_ed, _eu.subVectors(E, S).dot(_ed));
  _eu.subVectors(E, _ec);
  const h = _eu.length();
  if (h < 1e-5) return;
  _eu.multiplyScalar(1 / h);
  _ew.crossVectors(_ed, _eu);
  const a = h * _eu.y;
  const b = h * _ew.y;
  const R = Math.hypot(a, b);
  if (R < 1e-6) return;
  const k = y - _ec.y;
  const p = Math.atan2(b, a);
  let phi = p;
  if (k < R) {
    const g = Math.acos(Math.max(-1, k / R));
    const wrap = (x: number) => Math.atan2(Math.sin(x), Math.cos(x));
    const p1 = wrap(p - g);
    const p2 = wrap(p + g);
    phi = Math.abs(p1) < Math.abs(p2) ? p1 : p2;
  }
  E.copy(_ec).addScaledVector(_eu, h * Math.cos(phi)).addScaledVector(_ew, h * Math.sin(phi));
}
/** A hand that has let go hangs this far below its shoulder (the elbow soft), a little forward and out. */
const HANG = { down: 0.595, fwd: 0.04, out: 0.045 };

/** The trunk above the hips for the rotations as they stand; the hands' targets (a hanging hand follows its shoulder). */
function chain(R: Corner["rig"], hip: THREE.Vector3, pose: OwnerPose) {
  _rP.copy(_qp).multiply(qCornerInv);
  _rC.copy(_qc).multiply(qCornerInv);
  _W.copy(R.W0).sub(R.H0).applyQuaternion(_rP).add(hip);
  _N.copy(R.N0).sub(R.W0).applyQuaternion(_rC).add(_W);
  _fh.set(0, 0, -1).applyQuaternion(_qc).setY(0).normalize();
  _rh.set(1, 0, 0).applyQuaternion(_qc).setY(0).normalize();
  for (let i = 0; i < 2; i++) {
    const S = _S[i].copy(R.S0[i]).sub(R.W0).applyQuaternion(_rC).add(_W);
    _a.copy(S).addScaledVector(AY, -HANG.down).addScaledVector(_fh, HANG.fwd).addScaledVector(_rh, (i === 0 ? -1 : 1) * HANG.out);
    _T[i].copy(pose.hands[i]).lerp(_a, pose.hang[i]);
  }
}

export function poseOwner(c: Corner, pose: OwnerPose) {
  const R = c.rig;
  _qr.setFromAxisAngle(AY, pose.yaw).premultiply(qCorner);
  _qp.copy(_qr).multiply(qE(pose.pelvis, _q));
  _qc.copy(_qp).multiply(qE(pose.chest, _q));
  _qh.copy(_qc).multiply(qE(pose.head, _q));
  const hip = _hip.copy(pose.hip);
  chain(R, hip, pose);

  // A hand near the end of its reach brings the body with it, as a person's
  // does: from REACH - KNEE on, the trunk comes toward the hand (a bend at
  // the waist, or the weight going over the feet), so the arm never locks
  // straight and a hand never leaves what it is holding. The distance each
  // arm is allowed is fixed from the pose as asked (a soft knee, so it starts
  // without a jolt); the passes after the first take up what a bend could
  // not reach (a bend only swings the shoulder round the waist). A hand that
  // has let go asks nothing of the body: it hangs from where the body is.
  for (let i = 0; i < 2; i++) {
    const d0 = _T[i].distanceTo(_S[i]);
    goal[i] = d0 - (1 - pose.hang[i]) * overReach(d0 - REACH);
  }
  for (let pass = 0; pass < 3; pass++) {
    let s = 0;
    for (let i = 0; i < 2; i++) {
      need[i] = 0;
      const D = _u[i].subVectors(_T[i], _S[i]);
      const d = D.length();
      // (Softly: a residual that changes sign must not start or stop the trunk
      // with a jolt. The knee sits just past the goal, so a hand already
      // within it, or hanging, asks exactly nothing: centred on the goal it
      // asked a few millimetres every pass, and two hanging hands sank the
      // standing hips 2 cm into a crouch.)
      const e = softPos(d - goal[i] - 0.005, 0.005);
      if (e <= 1e-7 || d < 1e-6) continue;
      D.multiplyScalar(1 / d);
      // (A hand partly let go moves with its shoulder: only the rest of a move closes the gap.)
      need[i] = e / Math.hypot(1 - pose.hang[i], 0.2);
      s += need[i];
    }
    if (s < 1e-6) break;
    // One move for the trunk: toward whichever hand needs it most, both if both do.
    _v.set(0, 0, 0);
    _c.set(0, 0, 0);
    for (let i = 0; i < 2; i++) {
      if (!need[i]) continue;
      _v.addScaledVector(_u[i], (need[i] * need[i]) / s);
      _c.addScaledVector(_S[i], need[i] / s);
    }
    if (pose.bend > 0) {
      _r.subVectors(_c, _W);
      _b.copy(_r).addScaledVector(_v, pose.bend).normalize();
      _qw.setFromUnitVectors(_r.normalize(), _b);
      _qc.premultiply(_qw);
      _qh.premultiply(_qw);
    }
    if (pose.bend < 1) hip.addScaledVector(_v, 1 - pose.bend);
    chain(R, hip, pose);
  }
  pose.hip.copy(hip);

  // The rigid chain: pelvis, chest, head.
  R.pelvis.q.copy(_rP);
  R.pelvis.t.copy(hip).sub(R.H0);
  R.chest.q.copy(_rC);
  R.chest.t.copy(_W).sub(R.W0);
  R.head.q.copy(_qh).multiply(qCornerInv);
  R.head.t.copy(_N).sub(R.N0);

  _right.set(1, 0, 0).applyQuaternion(_qc);
  _fwd.set(0, 0, -1).applyQuaternion(_qr);
  // Arms.
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? -1 : 1;
    const S = _S[i];
    const T = _T[i];
    const [up, fo] = [R.arms[i * 2], R.arms[i * 2 + 1]];
    _ep.copy(_right).multiplyScalar(side * (0.25 + 0.6 * pose.elbowsOut)).add(_a.set(0, -0.75 * (pose.elbowsDown ?? 1), 0)).addScaledVector(_fwd, -0.35 - 0.3 * (1 - (pose.elbowsDown ?? 1)));
    ik(S, T, up.len, fo.len, _ep, _E);
    const fl = pose.elbowFloor;
    if (fl && fl.w[i] > 0) {
      const raise = fl.w[i] * softPos(fl.y - _E.y, 0.03);
      if (raise > 1e-5) swivelUp(S, T, _E, _E.y + raise);
    }
    setBone(up, S, _a.copy(_E).sub(S), _ep);
    setBone(fo, _E, _a.copy(T).sub(_E), _ep);
  }
  // Legs. The knee points between where the body faces and where its foot does.
  _rightP.set(1, 0, 0).applyQuaternion(_qp);
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? -1 : 1;
    const fy = pose.footYaw ? pose.footYaw[i] : pose.feetYaw;
    _J.copy(R.J0[i]).sub(R.H0).applyQuaternion(_rP).add(hip);
    const A = pose.ankles[i];
    const [th, sh] = [R.legs[i * 2], R.legs[i * 2 + 1]];
    _ff.set(0, 0, -1).applyAxisAngle(AY, fy).applyQuaternion(qCorner);
    _ep.copy(_fwd).add(_ff).normalize().addScaledVector(_rightP, side * 0.12);
    ik(_J, A, th.len, sh.len, _ep, _knee);
    setBone(th, _J, _a.copy(_knee).sub(_J), _rightP);
    setBone(sh, _knee, _a.copy(A).sub(_knee), _rightP);
    const foot = R.feet[i];
    foot.q.setFromAxisAngle(AY, fy);
    foot.t.copy(A).sub(R.A0[i]);
  }
}

/* ---- what the owner does ----------------------------------------------------- */

/** The handle at angle θ (0 nearest the owner, π/2 at the top), at a point x along the grip. */
export function handleAt(theta: number, x: number, out = new THREE.Vector3()) {
  return corner(x, 1.0 + HANDLE_R * Math.sin(theta), HANDLE_R * Math.cos(theta), out);
}

const TAU = Math.PI * 2;
/**
 * The rests at the crank. Every so often (seconds of turning) the owner
 * brings the handle round to `at` (high and near: easy to hold with one
 * hand), lets the crank come to a stop there, straightens, looks up at it
 * all, then goes on.
 */
const REST = { first: 5.5, every: 13.5, hold: 2.6, at: 1.2 };

/** A point on a hand's way from where it is to `to`: eased, and lifted clear of what it passes over. */
function arcTo(p: THREE.Vector3, to: THREE.Vector3, u: number, lift: number) {
  const k = smooth(u);
  if (k <= 0) return p;
  p.lerp(to, k);
  p.y += lift * Math.sin(Math.PI * k);
  return p;
}

/** A foot planted at `from` stepping to `to`: lifted clear, carried, set down gently (no slide on the floor). */
function stepTo(from: THREE.Vector3, to: THREE.Vector3, u: number, lift: number) {
  const k = smoother(u);
  const p = from.clone().lerp(to, k);
  p.y += lift * Math.sin(Math.PI * smooth(u));
  return p;
}

const DESK_FACE = DESK_YAW;
/** Six o'clock in the new machine (docs/STORY.md): the beats, in film time. */
export const SIX = { reach: 24.66, close0: 24.72, close1: 24.9, lamp: 25.0, rise0: 25.03, rise1: 25.35, look0: 25.26, look1: 25.6 };

/**
 * Six o'clock, beat by beat (each 0..1, linear; eased where it is used).
 * The right hand, done with the lid, goes to the desk's edge while the left
 * switches the lamp off. Then both push: the owner slides back, chair and
 * all, draws the feet in under the knees one at a time, leans forward and
 * comes up off the seat over the feet, the chair shoved back by the legs;
 * then turns round, a step at a time, to look at the machine behind them.
 */
function sixBeats(P: number) {
  const push = smoother(range(P, SIX.rise0, SIX.rise0 + 0.14));
  const stand = range(P, SIX.rise0 + 0.12, SIX.rise1);
  return {
    reach: range(P, SIX.reach, SIX.close0),
    toLamp: range(P, SIX.close1 - 0.02, SIX.lamp - 0.014),
    press: Math.sin(Math.PI * range(P, SIX.lamp - 0.012, SIX.lamp + 0.012)) ** 2,
    toEdgeR: range(P, SIX.close1, SIX.close1 + 0.06),
    toEdgeL: range(P, SIX.lamp + 0.008, SIX.rise0 + 0.06),
    push,
    stepL: range(P, SIX.rise0 + 0.07, SIX.rise0 + 0.125),
    stepR: range(P, SIX.rise0 + 0.09, SIX.rise0 + 0.145),
    stand,
    /** Round to the machine: the body, the right foot, then the left. */
    turn: smoother(range(P, SIX.rise1 + 0.02, SIX.look1 - 0.02)),
    turnR: range(P, SIX.rise1 + 0.02, SIX.rise1 + 0.11),
    turnL: range(P, SIX.rise1 + 0.11, SIX.rise1 + 0.21),
    /** The chair: pushed back with the owner, then shoved back by the legs as they come up. */
    chair: 0.26 * push + 0.19 * smooth(range(stand, 0.3, 0.75)),
    chairTurn: smooth(range(stand, 0.3, 0.75)),
  };
}

/** The stance the owner stands in at the desk (desk frame): left, right. */
const DESK_FEET: [[number, number], [number, number]] = [
  [-0.12, 0.5],
  [0.13, 0.47],
];
/** Turning round to the machine: the body's turn, and where the turn's centre ends (desk frame z). */
const TURN = { yaw: 1.6, back: 0.13 };
/** How far a point is toward the chair in the desk frame (its z). */
const DESK_O = dw(0, 0, 0);
const DESK_Z = dw(0, 0, 1).sub(DESK_O);
const _dz = new THREE.Vector3();
const deskZ = (p: THREE.Vector3) => _dz.subVectors(p, DESK_O).dot(DESK_Z);
/** The desk top, and an elbow's thickness above it. */
const ELBOW_FLOOR = FLOOR_Y + 0.7625 + 0.045;

export class Owner {
  /** The handle's angle; the gears on the tower follow it. */
  theta = 2.2;
  /** Seconds spent turning (the rests are timed by it). */
  private t = 0;
  private restDue = REST.first;
  /** The angle the crank is being brought round to for a rest (null when it is not). */
  private stopAt: number | null = null;
  private held = 0;
  /** How rested the body is (a spring toward 0 or 1). */
  private rest = { x: 0, v: 0 };
  private omega = 0;
  lampOff = false;
  /** The pose the owner took this frame (the contact shadows follow it). */
  pose: OwnerPose | null = null;
  /** How far the chain has run onto the drum (metres). */
  wound = 0;

  constructor(private c: Corner) {}

  /** The crank's angular speed at θ: slow over the hard top, quick down the far side. */
  private effort(theta: number) {
    return 0.98 * (1 - 0.34 * Math.cos(theta - 0.85));
  }

  update(P: number, dt: number, time: number, reduced: boolean) {
    const c = this.c;
    // The hands come off at "Take your hand off the crank"; the crank coasts down.
    const release = smoother(range(P, 14.06, 14.32));
    const turning = P < 14.02;
    let want = 0;
    if (turning) {
      const e = this.effort(this.theta) * (reduced ? 0.6 : 1);
      if (!reduced && this.stopAt === null && this.t >= this.restDue) {
        // Time for a rest: carry on round to the resting angle (far enough
        // ahead to slow into it), then let it stop there.
        let d = REST.at - this.theta;
        d -= Math.floor(d / TAU) * TAU;
        if (d < 1.3) d += TAU;
        this.stopAt = this.theta + d;
      }
      if (this.stopAt !== null) {
        const d = this.stopAt - this.theta;
        // With the crank's own weight this comes in critically damped: no overshoot, no jolt.
        want = Math.min(e, Math.max(0, d) * 1.25);
        if (d < 0.02 && this.omega < 0.03) this.held += dt;
        // Rested: both hands back on the grip before it goes on.
        if (this.held > REST.hold && this.rest.x < 0.2) {
          this.stopAt = null;
          this.held = 0;
          this.restDue = this.t + REST.every;
        }
      } else {
        want = e;
        this.t += dt;
      }
    }
    // The crank has weight: it gathers and loses speed, it does not jump.
    this.omega += (want - this.omega) * (1 - Math.exp(-dt * 5));
    this.theta += this.omega * dt;
    this.wound += this.omega * dt * DRUM_R;
    // The body rests as the crank comes to its stop, and goes back to work before it goes on.
    const resting = this.stopAt !== null && this.held <= REST.hold && this.stopAt - this.theta < 0.7;
    spring(this.rest, resting ? 1 : 0, 2.2, dt);
    const rest = clamp01(this.rest.x);

    // The windlass.
    c.crank.q.setFromAxisAngle(CX, -this.theta);
    const tooth = (this.theta * 18) / (Math.PI * 2);
    const saw = tooth - Math.floor(tooth);
    c.pawl.q.setFromAxisAngle(CX, -0.16 * saw * saw);
    c.chain.t.copy(c.chainDir).multiplyScalar(-((this.wound % (LINK * 2)) + LINK * 2) % (LINK * 2));
    c.sprocket.q.setFromAxisAngle(CX, -this.wound / 0.28);

    // The chair: pushed back while the owner is at the crank; sat on in the new machine.
    const nw = P >= 16.12;
    const six = sixBeats(P);
    if (!nw) {
      c.chair.q.setFromAxisAngle(AY, 0.55);
      c.chair.t.copy(dw(0.3, 0, 0.5)).sub(dw(0, 0, 0));
    } else {
      c.chair.q.setFromAxisAngle(AY, 0.07 * six.chairTurn);
      c.chair.t.copy(dw(0.02 * six.chairTurn, 0, six.chair)).sub(dw(0, 0, 0));
    }

    // The laptop's lid: open, then shut at six (new machine).
    const shut = nw ? smoother(range(P, SIX.close0, SIX.close1)) : 0;
    const lidAxis = new THREE.Vector3(Math.cos(DESK_YAW), 0, -Math.sin(DESK_YAW));
    lidAxis.set(CX.x * lidAxis.x + CZ.x * lidAxis.z, 0, CX.z * lidAxis.x + CZ.z * lidAxis.z).normalize();
    c.lid.q.setFromAxisAngle(lidAxis, 1.83 * shut);
    this.lampOff = nw && P >= SIX.lamp;
    c.bulb.power = this.lampOff ? 0 : 1 - (reduced ? 0 : 0.03 * Math.sin(time * 9));

    this.pose = !nw ? this.atCrank(time, rest, release) : this.atDesk(P, time, lidAxis, shut, six);
    poseOwner(c, this.pose);
  }

  /**
   * Standing at the windlass, turning it with the whole body: the body leads
   * and the handle follows. Forward and down into the push over the far
   * side (the weight going onto the front foot), knees on the low stroke,
   * back and up as it comes home; the hands stay on the grip (poseOwner
   * brings the body to them at the end of the reach).
   */
  private atCrank(time: number, rest: number, release: number): OwnerPose {
    const th = this.theta;
    const breath = Math.sin(time * 1.7) * 0.012;
    const work = 1 - Math.max(rest * 0.85, release);
    // Peaks a little before the handle is furthest away and lowest: the body gets there first.
    const far = (1 + Math.cos(th - 3.8)) / 2;
    const low = (1 + Math.cos(th - 4.3)) / 2;
    const sway = Math.sin(th - 1.3);
    const lean = (0.12 + 0.5 * far) * work + (0.03 + breath) * (1 - work);
    const hip = corner(STAND.x + 0.018 * sway * work, 0.935 - (0.012 + 0.085 * low) * work, STAND.z - 0.13 * far * work + 0.012 * (1 - work));
    const pelvis: Ang = [lean * 0.34, 0.05 * Math.cos(th - 0.5) * work, 0.025 * sway * work];
    // Resting: the chest opens, the head comes up to look at the tower's height.
    const look = Math.max(rest, release * 0.8);
    const chest: Ang = [lean * 0.66 + breath, 0.07 * Math.sin(th + 0.2) * work - 0.12 * rest, -0.035 * Math.cos(th - 0.3) * work + 0.05 * rest];
    const head: Ang = [(0.3 - lean * 0.35) * (1 - look) - 0.32 * look + 0.03 * Math.sin(time * 0.7), 0.08 * Math.sin(th + 0.4) * work + 0.35 * rest, 0.08 * rest];
    // Hands: on the grip; at a rest the left comes off to the small of the back; at the turn both let go.
    const gripL = handleAt(th, GRIP.left);
    const gripR = handleAt(th, GRIP.right);
    const back = corner(STAND.x - 0.14, 1.04, STAND.z + 0.16);
    const offL = smooth(range(rest, 0.2, 1));
    return {
      yaw: 0,
      hip,
      pelvis,
      chest,
      head,
      // (Round the side, not through the body.)
      hands: [gripL.lerp(back, offL).addScaledVector(CX, -0.2 * Math.sin(Math.PI * offL)), gripR],
      hang: [release, release],
      bend: 0.45,
      elbowsOut: 0.55,
      // A pushing stance: the right foot forward, the left back.
      ankles: [corner(STAND.x - 0.115, 0.085, STAND.z + 0.13), corner(STAND.x + 0.125, 0.085, STAND.z - 0.1)],
      feetYaw: 0,
    };
  }

  /** At the desk in the new machine: typing; at six, the lid, the lamp, up, and round to look at the machine. */
  private atDesk(P: number, time: number, lidAxis: THREE.Vector3, shut: number, b: ReturnType<typeof sixBeats>): OwnerPose {
    const c = this.c;
    // Typing: the hands lift and fall a little, out of step.
    const tap = (k: number) => Math.max(0, Math.sin(time * 8.7 + k * 2.1)) * 0.012 * (1 - smooth(b.reach));
    // The right hand takes the lid by its top edge and brings it down, then
    // goes to the desk's edge to push from.
    const lidGrip = c.lidTop.clone().addScaledVector(lidAxis, 0.07).sub(c.lidHinge).applyAxisAngle(lidAxis, 1.83 * shut).add(c.lidHinge).add(V(0, 0.034, 0));
    const right = dw(0.03, 0.81 + tap(1), 0.08);
    arcTo(right, lidGrip, b.reach, 0.05);
    arcTo(right, dw(0.26, 0.812, 0.2), b.toEdgeR, 0.04);
    // The left, nearer the lamp, steps aside for the lid, then goes over to
    // the switch (a press: the light goes at the bottom of it), then back to
    // push from the desk too.
    const left = dw(-0.11, 0.81 + tap(0), 0.08);
    arcTo(left, dw(-0.24, 0.81, 0.22), b.reach, 0.02);
    arcTo(left, c.lampSwitch.clone().add(V(0, 0.026 - 0.012 * b.press, 0)), b.toLamp, 0.07);
    arcTo(left, dw(-0.23, 0.812, 0.22), b.toEdgeL, 0.05);

    // Pushed back, chair and all; then up: the trunk leans in to bring the
    // weight over the feet, the hips leave the seat going forward and up,
    // and the trunk straightens as the legs do.
    const s = b.stand;
    const fwd = smoother(range(s, 0.08, 0.85));
    const up = smoother(range(s, 0.15, 1));
    const flex = smooth(range(s, 0, 0.36)) * (1 - smoother(range(s, 0.36, 0.95)));
    // (Coming off the desk the hands lift clear of it before they fall to the sides.)
    const lift = 0.07 * smooth(range(s, 0.6, 0.78));
    left.y += lift;
    right.y += lift;
    const [fl, fr] = DESK_FEET;
    const sx = (fl[0] + fr[0]) / 2;
    const sz = (fl[1] + fr[1]) / 2;
    const hip = dw(sx * up, 0.6 + 0.345 * up, 0.56 + 0.26 * b.push + (sz - 0.82) * fwd);

    // Feet: under the desk while sitting; drawn in under the knees, one then
    // the other, before standing; then round to the right, a step at a time,
    // about the stance's centre (which goes back a little: the desk is in front).
    const ankL = stepTo(dw(-0.12, 0.085, 0.22), dw(fl[0], 0.085, fl[1]), b.stepL, 0.05);
    const ankR = stepTo(dw(0.12, 0.085, 0.24), dw(fr[0], 0.085, fr[1]), b.stepR, 0.05);
    const round = (f: [number, number], k: number, out: THREE.Vector3) => {
      const a = TURN.yaw * k;
      const ox = f[0] - sx;
      const oz = f[1] - sz;
      return out.copy(dw(sx + ox * Math.cos(a) - oz * Math.sin(a), out.y - FLOOR_Y, sz + TURN.back * k + ox * Math.sin(a) + oz * Math.cos(a)));
    };
    const uR = b.turnR;
    const uL = b.turnL;
    if (uR > 0) {
      ankR.y += 0.06 * Math.sin(Math.PI * smooth(uR));
      round(fr, smoother(uR), ankR);
    }
    if (uL > 0) {
      ankL.y += 0.06 * Math.sin(Math.PI * smooth(uL));
      round(fl, smoother(uL), ankL);
    }
    // (A turn to the right is a negative yaw.) The standing foot pivots a
    // little under the turning body before it steps.
    const footYaw: [number, number] = [DESK_FACE - 0.45 * smooth(uR) - (TURN.yaw - 0.45) * smoother(uL), DESK_FACE - TURN.yaw * smoother(uR)];
    // The hips go where the feet hold them: over the standing foot while the other steps.
    if (uR > 0) {
      const mid = ankL.clone().add(ankR).multiplyScalar(0.5).setY(0);
      const stance = dw(sx, 0, sz).setY(0);
      const stepping = Math.sin(Math.PI * smooth(uR)) - Math.sin(Math.PI * smooth(uL));
      const over = (stepping > 0 ? ankL : ankR).clone().setY(0).sub(mid).multiplyScalar(0.3 * Math.abs(stepping));
      hip.add(mid.sub(stance)).add(over);
    }

    const seated = 1 - up;
    // Typing they sit a little forward; reaching over the desk they lean
    // further (and poseOwner bends them the rest of the way to the hand).
    const reachLean = smooth(b.reach) * (1 - smooth(b.toEdgeL));
    // Over to the lamp: the trunk leans and turns toward it ahead of the hand,
    // and comes back with it (the body is not yanked back by the arm).
    const toLamp = smooth(b.toLamp) * (1 - smooth(b.toEdgeL));
    const lean = (0.26 + 0.06 * reachLean + 0.16 * toLamp) * seated + 0.03 * up + 0.3 * flex;
    // Turning round: the head first, then the chest, then the hips and feet.
    const chestTurn = 0.2 * smooth(range(P, SIX.look0 + 0.02, SIX.look0 + 0.12)) + 0.25 * smooth(range(P, SIX.rise1 + 0.1, SIX.look1 - 0.02));
    const headTurn = 0.55 * smooth(range(P, SIX.look0, SIX.look0 + 0.1)) + 0.3 * smooth(range(P, SIX.rise1 + 0.12, SIX.look1));
    const lookUp = smoother(range(P, SIX.rise1 + 0.06, SIX.look1));
    // Hands: on the desk, pushing, until the shoulders are back over the
    // feet; then they come away and hang.
    const hang = smoother(range(s, 0.7, 1));
    return {
      yaw: DESK_FACE - TURN.yaw * b.turn,
      hip,
      pelvis: [-0.1 * seated + lean * 0.3 + 0.12 * flex, 0, 0],
      chest: [lean * 0.7 - 0.04 * lookUp, chestTurn - 0.22 * toLamp, -0.08 * toLamp],
      head: [0.3 * (1 - lookUp) - 0.36 * lookUp - 0.22 * flex + 0.02 * Math.sin(time * 0.6), headTurn, 0],
      hands: [left, right],
      hang: [hang, hang],
      bend: seated,
      elbowsOut: 0.3,
      elbowsDown: 0.35 + 0.65 * hang,
      // (Over the desk the forearms stay on top of it.)
      elbowFloor: { y: ELBOW_FLOOR, w: [(1 - hang) * smooth(range(deskZ(left), 0.52, 0.38)), (1 - hang) * smooth(range(deskZ(right), 0.52, 0.38))] },
      ankles: [ankL, ankR],
      feetYaw: (footYaw[0] + footYaw[1]) / 2,
      footYaw,
    };
  }
}
