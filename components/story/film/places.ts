import * as THREE from "three";
import { at, Batch, block, ball, footAO, gableEnd, gableRoof, hull, interiorAO, rod, tablet, turned, ROOF, LEAF } from "./model";
import { glowMat, modelMat, satinMat } from "./mats";
import { leafMat, wideTree } from "./trees";
import { HOME, SHOP } from "./town";

/**
 * THE STORY'S TWO PLACES, built in more detail than the town round them.
 *
 * HOME, the customer's house: a weatherboard bungalow whose back opens onto
 * the garden through wide sliding doors (open: the camera looks in). The
 * living room: a sofa facing the garden (so we see the person on it, lit by
 * the phone), a floor lamp, a rug, a coffee table, a plant, a kitchen bench
 * behind. Outside, the old deck (grey, a board missing) that the story is
 * about, and the new one (built board by board), a lawn, a tree, a rotary
 * washing line.
 *
 * SHOP, the business: a workshop with a roller door and an office behind a
 * glass front. The desk faces the street: from outside we see the owner lit
 * by the screen and the lamp; from behind their shoulder, what is on it.
 * Shelves of folders, a wall clock, a pinboard; the van out front.
 *
 * Each place has its own frame: +Z its front. HOME is turned to face north
 * (its back, the garden, is to the south); SHOP faces south.
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export type Frame = { x: number; z: number; yaw: number };
/** A point in a place's frame, in the world. */
export function inFrame(f: Frame, x: number, y: number, z: number, out = new THREE.Vector3()) {
  const c = Math.cos(f.yaw);
  const s = Math.sin(f.yaw);
  return out.set(f.x + x * c + z * s, y, f.z - x * s + z * c);
}
/** A direction in a place's frame, in the world. */
export function dirFrame(f: Frame, x: number, y: number, z: number, out = new THREE.Vector3()) {
  const c = Math.cos(f.yaw);
  const s = Math.sin(f.yaw);
  return out.set(x * c + z * s, y, -x * s + z * c);
}
const placeM = (f: Frame) => new THREE.Matrix4().compose(V(f.x, 0, f.z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), f.yaw), V(1, 1, 1));

/* ------------------------------------------------------------------ */
/* Furniture                                                           */
/* ------------------------------------------------------------------ */

const WOOD: [number, number, number] = [0.78, 0.7, 0.6];
const FABRIC: [number, number, number] = [0.3, 0.4, 0.37];
const DARKER: [number, number, number] = [0.55, 0.54, 0.52];

function sofa(b: Batch, x: number, y: number, z: number, yaw: number, len = 2.2) {
  const m = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), V(1, 1, 1));
  const p = (g: THREE.BufferGeometry, mm: THREE.Matrix4, ao: number | ((p: THREE.Vector3, n: THREE.Vector3) => number) = 1) => b.add(g, new THREE.Matrix4().multiplyMatrices(m, mm), ao, FABRIC);
  p(block(len, 0.24, 0.92, 0.04), at(0, 0.2, 0), footAO(y, 0.3, 0.6));
  for (const s of [-1, 1]) p(block(0.2, 0.62, 0.92, 0.06), at(s * (len / 2 - 0.1), 0.31, 0), 0.92);
  const n = 2;
  const w = (len - 0.4) / n;
  for (let i = 0; i < n; i++) {
    const cx = -len / 2 + 0.2 + w * (i + 0.5);
    p(block(w - 0.015, 0.16, 0.66, 0.06), at(cx, 0.39, 0.1), 1);
    p(block(w - 0.03, 0.5, 0.22, 0.08), at(cx, 0.62, -0.32, -0.16, 0, 0), 0.95);
  }
  for (const s of [-1, 1]) for (const zz of [-0.38, 0.38]) b.add(block(0.05, 0.08, 0.05), new THREE.Matrix4().multiplyMatrices(m, at(s * (len / 2 - 0.08), 0.04, zz)), 0.6, DARKER);
}

function floorLamp(b: Batch, glow: Batch, x: number, y: number, z: number) {
  b.add(turned([[0.0, 0], [0.16, 0], [0.16, 0.025], [0.02, 0.035], [0.0, 0.04]], 24), at(x, y, z), 0.7, DARKER);
  b.add(rod(0.012, 1.42, 10), at(x, y, z), 1, DARKER);
  // The shade: an open drum of card, lit from inside.
  glow.add(turned([[0.2, 0], [0.205, 0.004], [0.16, 0.34], [0.155, 0.336]], 32), at(x, y + 1.3, z), 1);
}

function plant(b: Batch, x: number, y: number, z: number, s = 1) {
  b.add(turned([[0.0, 0], [0.16, 0], [0.2, 0.36], [0.19, 0.38], [0.0, 0.38]], 24), at(x, y, z, 0, 0, 0, s, s, s), 0.75, [0.7, 0.66, 0.62]);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.39;
    const t = 0.35 + (i % 3) * 0.12;
    b.add(ball(1, 12, 8), at(x + Math.cos(a) * 0.14 * s, y + (0.55 + t * 0.6) * s, z + Math.sin(a) * 0.14 * s, 0.6 * Math.sin(a), a, 0.4 * Math.cos(a), 0.05 * s, 0.32 * s, 0.11 * s), 0.85, [0.7, 0.74, 0.66]);
  }
}

/** A laptop: the base (keys a shade darker) and the lid on its own hinge (returned separately). */
export function laptop(): { base: THREE.BufferGeometry; lid: THREE.BufferGeometry; screen: THREE.PlaneGeometry; W: number; D: number } {
  const W = 0.31;
  const D = 0.215;
  const base = new Batch();
  base.add(tablet(W, D, 0.014, 0.012, 0.003), at(0, 0.007, 0, -Math.PI / 2, 0, 0), 1, [0.82, 0.82, 0.83]);
  base.add(block(W * 0.86, 0.002, D * 0.42, 0.001), at(0, 0.0145, -0.025), 1, [0.36, 0.36, 0.38]);
  base.add(block(W * 0.32, 0.0015, D * 0.24, 0.001), at(0, 0.0145, 0.06), 1, [0.72, 0.72, 0.74]);
  const lid = new Batch();
  // The lid stands on its hinge at the back edge (local origin), its face toward +Z.
  lid.add(tablet(W, D, 0.007, 0.012, 0.002), at(0, D / 2, 0.0035), 1, [0.82, 0.82, 0.83]);
  lid.add(block(W - 0.012, D - 0.012, 0.001, 0.0005), at(0, D / 2, 0.0072), 1, [0.03, 0.03, 0.035]);
  const screen = new THREE.PlaneGeometry(W - 0.024, D - 0.03);
  screen.translate(0, D / 2 + 0.002, 0.0075);
  return { base: base.build(), lid: lid.build(), screen, W, D };
}

/** A phone: a slab with rounded corners, the screen a plane on its face (+Z). */
export function phone(): { body: THREE.BufferGeometry; screen: THREE.PlaneGeometry; W: number; H: number } {
  const W = 0.072;
  const H = 0.152;
  const body = new Batch().add(tablet(W, H, 0.008, 0.011, 0.002), null, 1, [0.12, 0.12, 0.13]).build();
  const screen = new THREE.PlaneGeometry(W - 0.005, H - 0.005);
  screen.translate(0, 0, 0.0042);
  return { body, screen, W, H };
}

/* ------------------------------------------------------------------ */
/* HOME                                                                 */
/* ------------------------------------------------------------------ */

export const HOME_FLOOR = 0.45;
const HW = 10;
const HD = 9;
const WALL = 2.6;

export type Home = {
  group: THREE.Group;
  /** Where the person on the sofa sits (hip point, world), the way they face (yaw), and the floor. */
  seat: THREE.Vector3;
  seatYaw: number;
  floor: number;
  lampLight: THREE.PointLight;
  lampGlow: THREE.Mesh;
  roomLight: THREE.PointLight;
  /** The old deck (whole) and the new one, board by board. */
  oldDeck: THREE.Mesh;
  oldBits: { mesh: THREE.InstancedMesh; rest: THREE.Matrix4[] };
  newDeck: { mesh: THREE.InstancedMesh; rest: THREE.Matrix4[]; order: number[]; kind: number[] };
  windows: THREE.Mesh;
  /** The deck's middle (world), and the garden's. */
  deck: THREE.Vector3;
  garden: THREE.Vector3;
  mats: THREE.Material[];
};

export function buildHome(scene: THREE.Scene): Home {
  const f = HOME as Frame;
  const g = new THREE.Group();
  g.applyMatrix4(placeM(f));
  scene.add(g);
  const white = modelMat(0.82);
  const fabric = modelMat(0.95, 0.45);
  const glow = glowMat();
  const b = new Batch();
  const soft = new Batch();
  const glass = new Batch();
  const lampB = new Batch();
  const F = HOME_FLOOR;
  const top = F + WALL;
  const ao = footAO(0, 1.0, 0.5);

  // The house: a raised floor, walls with the back of the living room open.
  b.add(block(HW - 0.2, F, HD - 0.2), at(0, F / 2, 0), 0.6);
  b.add(block(HW, 0.06, HD), at(0, F - 0.03, 0), 1, WOOD);
  // Front wall (+Z), with the door and two windows.
  b.add(block(HW, WALL, 0.18), at(0, F + WALL / 2, HD / 2 - 0.09), ao);
  // Side walls.
  b.add(block(0.18, WALL, HD), at(-HW / 2 + 0.09, F + WALL / 2, 0), ao);
  b.add(block(0.18, WALL, HD), at(HW / 2 - 0.09, F + WALL / 2, 0), ao);
  // The back wall (-Z): solid over the kitchen (x > 1.2), the sliders' frame across the living room.
  b.add(block(HW / 2 - 1.2, WALL, 0.18), at((HW / 2 + 1.2) / 2, F + WALL / 2, -HD / 2 + 0.09), ao);
  b.add(block(HW / 2 + 1.2, 0.42, 0.18), at((-HW / 2 + 1.2) / 2, top - 0.21, -HD / 2 + 0.09), 1);
  // The sliders: four panels, three slid aside behind the fourth (frames only: the glass is open).
  for (let i = 0; i < 2; i++) {
    const x0 = -0.62 + i * 0.09;
    b.add(block(0.06, WALL - 0.44, 0.05), at(x0, F + (WALL - 0.44) / 2, -HD / 2 + 0.05 + i * 0.07), 1, [0.86, 0.86, 0.87]);
    b.add(block(1.5, 0.06, 0.05), at(x0 + 0.75, F + 0.03, -HD / 2 + 0.05 + i * 0.07), 1, [0.86, 0.86, 0.87]);
    b.add(block(1.5, 0.06, 0.05), at(x0 + 0.75, top - 0.45, -HD / 2 + 0.05 + i * 0.07), 1, [0.86, 0.86, 0.87]);
    b.add(block(0.06, WALL - 0.44, 0.05), at(x0 + 1.5, F + (WALL - 0.44) / 2, -HD / 2 + 0.05 + i * 0.07), 1, [0.86, 0.86, 0.87]);
  }
  b.add(block(0.08, WALL - 0.42, 0.18), at(1.2, F + (WALL - 0.42) / 2, -HD / 2 + 0.09), 1);
  // Gables and roof (the ridge runs along X).
  b.add(gableEnd(HD, 0.46, 0.18), at(-HW / 2 + 0.09, top, 0, 0, Math.PI / 2, 0), 1);
  b.add(gableEnd(HD, 0.46, 0.18), at(HW / 2 - 0.09, top, 0, 0, Math.PI / 2, 0), 1);
  b.add(gableRoof(HD, HW, 0.46, 0.55, 0.14), at(0, top, 0, 0, Math.PI / 2, 0), (p) => (p.y < top + 0.08 ? 0.7 : 1), ROOF);
  // The ceiling, and a cornice line where it meets the walls.
  b.add(block(HW - 0.36, 0.06, HD - 0.36), at(0, top - 0.03, 0), 0.92);
  b.add(block(HW - 0.4, 0.06, 0.06), at(0, top - 0.09, 0.42), 0.9);
  // An inner wall behind the sofa (with a doorway on the right), the hall beyond.
  b.add(block(4.4, WALL, 0.12), at(-2.6, F + WALL / 2, 0.66), footAO(F, 0.6, 0.65));
  b.add(block(1.0, 0.5, 0.12), at(0.3, top - 0.25, 0.66), 1);
  // Weatherboards along the outside of the back wall and the sides.
  for (let y = F + 0.2; y < top - 0.1; y += 0.2) {
    b.add(block(HW / 2 - 1.2, 0.018, 0.012, 0.004), at((HW / 2 + 1.2) / 2, y, -HD / 2 - 0.006), 0.97);
    b.add(block(0.012, 0.018, HD, 0.004), at(-HW / 2 - 0.006, y, 0), 0.97);
    b.add(block(0.012, 0.018, HD, 0.004), at(HW / 2 + 0.006, y, 0), 0.97);
  }
  // Windows (glass lit from inside at night): the kitchen, the front, the sides.
  const win = (x: number, z: number, face: number, w: number, h: number, y = F + 1.45) => {
    const yaw = [0, Math.PI / 2, Math.PI, -Math.PI / 2][face];
    const m = new THREE.Matrix4().compose(V(x, 0, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), V(1, 1, 1));
    const P = (mm: THREE.Matrix4) => new THREE.Matrix4().multiplyMatrices(m, mm);
    b.add(block(w + 0.14, 0.07, 0.09), P(at(0, y + h / 2 + 0.035, 0.05)), 1);
    b.add(block(0.07, h, 0.09), P(at(-w / 2 - 0.035, y, 0.05)), 1);
    b.add(block(0.07, h, 0.09), P(at(w / 2 + 0.035, y, 0.05)), 1);
    b.add(block(w + 0.26, 0.06, 0.16), P(at(0, y - h / 2 - 0.03, 0.07)), 0.9);
    glass.add(block(w, h, 0.02), P(at(0, y, 0.02)), 1);
  };
  win(3.1, -HD / 2, 2, 1.6, 1.1, F + 1.55);
  win(-2.8, HD / 2, 0, 1.6, 1.4);
  win(2.8, HD / 2, 0, 1.6, 1.4);
  win(-HW / 2, -1.5, 3, 1.2, 1.3);
  win(HW / 2, 2, 1, 1.2, 1.3);
  b.add(block(1.0, 2.1, 0.06), at(0, F + 1.05, HD / 2 + 0.02), 0.9, [0.7, 0.68, 0.66]);
  b.add(block(1.4, 0.18, 0.9), at(0, 0.09, HD / 2 + 0.6), 0.7);

  // THE LIVING ROOM.
  // The rug, the sofa (facing the garden), the coffee table, a side table with a mug.
  b.add(block(3.0, 0.012, 2.1, 0.004), at(-2.1, F + 0.006, -0.9), 0.9, [0.66, 0.42, 0.31]);
  // (The rug's border, a band of cream.)
  b.add(block(2.8, 0.013, 1.9, 0.004), at(-2.1, F + 0.0065, -0.9), 0.9, [0.86, 0.8, 0.7]);
  b.add(block(2.6, 0.014, 1.7, 0.004), at(-2.1, F + 0.007, -0.9), 0.9, [0.62, 0.38, 0.28]);
  sofa(soft, -2.1, F, 0.06, Math.PI, 2.3);
  b.add(block(1.1, 0.04, 0.55, 0.01), at(-2.1, F + 0.4, -1.25), 1, WOOD);
  for (const sx of [-0.48, 0.48]) for (const sz of [-0.22, 0.22]) b.add(rod(0.016, 0.38, 8), at(-2.1 + sx, F, -1.25 + sz), 0.8, WOOD);
  b.add(block(0.4, 0.035, 0.4, 0.008), at(-3.65, F + 0.52, -0.1), 1, WOOD);
  b.add(rod(0.02, 0.5, 8), at(-3.65, F, -0.1), 0.8, WOOD);
  b.add(turned([[0.0, 0], [0.04, 0], [0.042, 0.09], [0.038, 0.095], [0.0, 0.095]], 18), at(-3.6, F + 0.538, -0.05), 0.9);
  b.add(block(0.18, 0.03, 0.24, 0.006), at(-1.9, F + 0.435, -1.2, 0, 0.3, 0), 0.95, [0.9, 0.9, 0.9]);
  b.add(block(0.15, 0.025, 0.22, 0.006), at(-1.95, F + 0.465, -1.18, 0, 0.42, 0), 0.95, [0.62, 0.62, 0.66]);
  floorLamp(b, lampB, -3.75, F, 0.32);
  plant(b, -4.45, F, -3.9, 1.2);
  plant(b, 0.7, F, -3.95, 0.9);
  // Pictures above the sofa, a shelf on the side wall.
  for (const [x, w, h, c, c2] of [
    [-2.9, 0.6, 0.8, [0.3, 0.44, 0.54], [0.82, 0.78, 0.68]],
    [-1.95, 0.9, 0.62, [0.8, 0.62, 0.36], [0.46, 0.34, 0.24]],
    [-1.15, 0.42, 0.56, [0.46, 0.56, 0.46], [0.9, 0.88, 0.82]],
  ] as const) {
    b.add(block(w, h, 0.03, 0.006), at(x, F + 1.68, 0.585), 1, [0.16, 0.15, 0.14]);
    b.add(block(w - 0.1, h - 0.1, 0.005), at(x, F + 1.68, 0.57), 1, [0.94, 0.93, 0.9]);
    // The print itself: a field of colour and a horizon (a NZ landscape, abstracted).
    b.add(block(w - 0.2, (h - 0.2) * 0.58, 0.004), at(x, F + 1.68 + (h - 0.2) * 0.21, 0.566), 1, [...c] as [number, number, number]);
    b.add(block(w - 0.2, (h - 0.2) * 0.42, 0.004), at(x, F + 1.68 - (h - 0.2) * 0.29, 0.566), 1, [...c2] as [number, number, number]);
  }
  for (const y of [F + 0.6, F + 1.2, F + 1.8]) {
    b.add(block(0.3, 0.03, 1.5), at(-HW / 2 + 0.33, y, -2.4), 0.9, WOOD);
    const spines: [number, number, number][] = [
      [0.55, 0.26, 0.2],
      [0.22, 0.3, 0.42],
      [0.84, 0.8, 0.7],
      [0.62, 0.56, 0.36],
      [0.32, 0.42, 0.36],
      [0.86, 0.84, 0.8],
      [0.18, 0.2, 0.24],
    ];
    for (let i = 0; i < 9; i++) b.add(block(0.2, 0.24 + ((i * 37) % 7) * 0.012, 0.035), at(-HW / 2 + 0.3, y + 0.135, -3.05 + i * 0.075 + (i > 4 ? 0.2 : 0)), 0.8, spines[(i * 5 + Math.round(y * 10)) % spines.length]);
  }
  // The kitchen beyond: a bench with stools, a pendant over it.
  b.add(block(2.4, 0.9, 0.8, 0.02), at(3.0, F + 0.45, -1.9), footAO(F, 0.4, 0.6));
  b.add(block(2.5, 0.04, 0.9, 0.01), at(3.0, F + 0.92, -1.9), 1, [0.92, 0.92, 0.92]);
  for (const x of [2.3, 3.7]) {
    b.add(rod(0.016, 0.62, 8), at(x, F, -2.65), 0.8, DARKER);
    b.add(turned([[0, 0], [0.17, 0], [0.17, 0.04], [0, 0.05]], 18), at(x, F + 0.62, -2.65), 1, WOOD);
  }
  b.add(block(3.6, 0.9, 0.62, 0.02), at(3.1, F + 0.45, 4.1), footAO(F, 0.4, 0.6));
  b.add(block(3.6, 0.7, 0.36, 0.02), at(3.1, F + 1.75, 4.25), 0.9);

  // THE GARDEN: lawn edging, a tree, the washing line, a bed along the fence.
  const garden = new Batch();
  // The garden's tree: a pohutukawa of leaves (trees.ts), in the town's leaf material (the wind, the seasons).
  const gardenTree = wideTree(77);
  const foliage = leafMat();
  // A rotary washing line.
  garden.add(rod(0.03, 2.0, 10), at(3.4, 0, -14.5), (p) => 0.6 + 0.4 * Math.min(1, p.y), DARKER);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    garden.add(rod(0.012, 1.6, 6), at(3.4, 2.0, -14.5, Math.PI / 2 - 0.18, a, 0), 1, DARKER);
  }
  for (const r of [0.6, 1.0, 1.4])
    for (let i = 0; i < 4; i++) {
      const a0 = (i / 4) * Math.PI * 2 + 0.4;
      const a1 = a0 + Math.PI / 2;
      const p0 = V(3.4 + Math.sin(a0) * r, 2.0 - r * 0.18, -14.5 + Math.cos(a0) * r);
      const p1 = V(3.4 + Math.sin(a1) * r, 2.0 - r * 0.18, -14.5 + Math.cos(a1) * r);
      const mid = p0.clone().add(p1).multiplyScalar(0.5);
      const len = p0.distanceTo(p1);
      garden.add(block(0.004, 0.004, len, 0.001), new THREE.Matrix4().lookAt(p0, p1, V(0, 1, 0)).setPosition(mid), 1, DARKER);
    }
  // A garden bed and low edging along the side fence, the back fence.
  garden.add(block(0.25, 0.22, 16, 0.03), at(5.6, 0.11, -14), 0.75);
  for (let i = 0; i < 12; i++) garden.add(ball(0.32 + (i % 3) * 0.1, 14, 10), at(5.2 - (i % 2) * 0.3, 0.25, -7 - i * 1.3, 0, 0, 0, 1, 0.75, 1), 0.7, LEAF);
  garden.add(block(16, 1.8, 0.08), at(0.5, 0.9, -24.9), footAO(0, 0.9, 0.55));
  garden.add(block(0.08, 1.8, 20), at(-5.5, 0.9, -14.8), footAO(0, 0.9, 0.55));

  // THE OLD DECK: grey timber, one board missing, one lifted, a sagging step.
  const deckOld = new Batch();
  const OZ0 = -HD / 2 - 0.05;
  const OZ1 = -HD / 2 - 3.9;
  const ox0 = -4.8;
  const ox1 = 1.0;
  const grey: [number, number, number] = [0.6, 0.6, 0.59];
  for (const x of [ox0 + 0.15, (ox0 + ox1) / 2, ox1 - 0.15]) for (const z of [OZ0 - 0.3, (OZ0 + OZ1) / 2, OZ1 + 0.3]) deckOld.add(block(0.12, 0.34, 0.12), at(x, 0.17, z), footAO(0, 0.3, 0.6), grey);
  const oldBits: THREE.Matrix4[] = [];
  const oldN = Math.floor((OZ0 - OZ1) / 0.15);
  for (let i = 0; i < oldN; i++) {
    if (i === 9) continue; // the missing board
    const z = OZ0 - 0.075 - i * 0.15;
    const lift = i === 15 ? 0.08 : 0;
    const tilt = i === 15 ? 0.06 : (((i * 7) % 5) - 2) * 0.004;
    oldBits.push(at((ox0 + ox1) / 2 + (((i * 13) % 7) - 3) * 0.01, 0.4 + lift * 0.5, z, tilt, 0, (((i * 11) % 5) - 2) * 0.003));
  }
  // The step, sagging at one end.
  oldBits.push(at((ox0 + ox1) / 2, 0.18, OZ1 - 0.35, 0, 0, 0.035));
  const oldBoards = new THREE.InstancedMesh(new Batch().add(block(ox1 - ox0, 0.035, 0.13, 0.01), null, 1, grey).build(), white, oldBits.length);
  oldBits.forEach((m, i) => oldBoards.setMatrixAt(i, m));
  // (The step is wider than a board: scaled in its matrix.)
  oldBits[oldBits.length - 1].multiply(new THREE.Matrix4().makeScale(0.6, 1.4, 4.2));
  oldBoards.setMatrixAt(oldBits.length - 1, oldBits[oldBits.length - 1]);
  oldBoards.castShadow = oldBoards.receiveShadow = true;
  g.add(oldBoards);

  // THE NEW DECK: piles, bearers, joists, then the boards, a wide step and a planter.
  const NZ0 = -HD / 2 - 0.05;
  const NZ1 = -HD / 2 - 5.0;
  const nx0 = -4.9;
  const nx1 = 2.3;
  const newRest: THREE.Matrix4[] = [];
  const kind: number[] = [];
  const unit = (sx: number, sy: number, sz: number, x: number, y: number, z: number, k: number) => {
    newRest.push(new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(sx, sy, sz)));
    kind.push(k);
  };
  // Piles.
  for (const x of [nx0 + 0.2, (nx0 + nx1) / 2 - 1.2, (nx0 + nx1) / 2 + 1.2, nx1 - 0.2]) for (const z of [NZ0 - 0.4, (NZ0 + NZ1) / 2, NZ1 + 0.3]) unit(0.12, 0.3, 0.12, x, 0.15, z, 0);
  // Bearers along X, joists along Z.
  for (const z of [NZ0 - 0.4, (NZ0 + NZ1) / 2, NZ1 + 0.3]) unit(nx1 - nx0, 0.14, 0.09, (nx0 + nx1) / 2, 0.37, z, 1);
  for (let x = nx0 + 0.05; x <= nx1 - 0.04; x += 0.45) unit(0.05, 0.14, NZ0 - NZ1, x, 0.51, (NZ0 + NZ1) / 2, 2);
  // Boards along X, from the house out.
  const boards0 = newRest.length;
  for (let z = NZ0 - 0.07; z > NZ1 + 0.06; z -= 0.145) unit(nx1 - nx0 + 0.04, 0.032, 0.138, (nx0 + nx1) / 2, 0.6, z, 3);
  // A wide step along the front, a planter box at one end.
  unit(nx1 - nx0 - 1.2, 0.16, 0.42, (nx0 + nx1) / 2 + 0.3, 0.23, NZ1 - 0.2, 4);
  unit(1.1, 0.42, 1.1, nx1 - 0.6, 0.83, NZ1 + 0.6, 4);
  const order = newRest.map((_, i) => i);
  void boards0;
  const timber: [number, number, number] = [0.86, 0.74, 0.6];
  const newMesh = new THREE.InstancedMesh(new Batch().add(block(1, 1, 1, 0.012), null, 1, timber).build(), white, newRest.length);
  newRest.forEach((m, i) => newMesh.setMatrixAt(i, m));
  newMesh.castShadow = newMesh.receiveShadow = true;
  g.add(newMesh);

  const meshOf = (bt: Batch, m: THREE.Material, shadow = true) => {
    const mesh = new THREE.Mesh(bt.build(), m);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  const inside = new THREE.Box3(V(-HW / 2 + 0.17, F - 0.02, -HD / 2 + 0.17), V(HW / 2 - 0.17, top + 0.02, HD / 2 - 0.17));
  interiorAO(meshOf(b, white).geometry, inside, 0.55);
  interiorAO(meshOf(soft, fabric).geometry, inside, 0.55);
  meshOf(garden, white);
  {
    const place = at(-3.2, 0, -16, 0, 0.4, 0, 1.05, 1.05, 1.05);
    const wood = new THREE.Mesh(gardenTree.wood.clone().applyMatrix4(place), white);
    const leaves = new THREE.Mesh(gardenTree.leaves.clone().applyMatrix4(place), foliage);
    for (const m of [wood, leaves]) {
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    }
  }
  const oldDeck = meshOf(deckOld, white);
  const windows = new THREE.Mesh(glass.build(), glow);
  g.add(windows);
  const lampGlow = new THREE.Mesh(lampB.build(), glow);
  g.add(lampGlow);

  const lampLight = new THREE.PointLight(0xffcf9e, 3.2, 9, 1.6);
  lampLight.position.set(-3.75, F + 1.42, 0.32);
  g.add(lampLight);
  const roomLight = new THREE.PointLight(0xffdcb8, 0, 12, 1.4);
  roomLight.position.set(-1.0, top - 0.4, -1.5);
  g.add(roomLight);
  g.updateMatrixWorld(true);

  const seat = inFrame(f, -2.1, F + 0.48, -0.02);
  return {
    group: g,
    seat,
    seatYaw: f.yaw + Math.PI,
    floor: F,
    lampLight,
    lampGlow,
    roomLight,
    oldDeck,
    oldBits: { mesh: oldBoards, rest: oldBits },
    newDeck: { mesh: newMesh, rest: newRest, order, kind },
    windows,
    deck: inFrame(f, (nx0 + nx1) / 2, 0.6, (NZ0 + NZ1) / 2),
    garden: inFrame(f, 0, 0, -14),
    mats: [white, fabric, glow, foliage],
  };
}

/* ------------------------------------------------------------------ */
/* SHOP                                                                 */
/* ------------------------------------------------------------------ */

const SW = 14;
const SD = 12;
const SWALL = 4.4;
export const SHOP_FLOOR = 0.15;

export type Shop = {
  group: THREE.Group;
  /** The owner's chair (seat point, world) and the way it faces. */
  seat: THREE.Vector3;
  seatYaw: number;
  /** The desk's top (world height), the keyboard's middle, the laptop's parts. */
  deskY: number;
  keys: THREE.Vector3;
  laptop: { base: THREE.Mesh; lid: THREE.Object3D; screen: THREE.Mesh; hinge: THREE.Vector3 };
  lamp: { spot: THREE.SpotLight; bulb: THREE.Mesh; switch: THREE.Vector3 };
  ceiling: THREE.PointLight;
  screenLight: THREE.PointLight;
  /** The wall light over the roller door (a lamp, its glow, where it is). */
  wall: THREE.SpotLight;
  wallGlow: THREE.Mesh;
  wallAt: THREE.Vector3;
  /** The clutter of the old way (paper piles, sticky notes): hidden in the new. */
  clutter: THREE.Object3D;
  clock: { hands: [THREE.Object3D, THREE.Object3D] };
  door: { pivot: THREE.Object3D; open: number };
  roller: THREE.Mesh;
  van: { group: THREE.Group; lights: THREE.Mesh; door: THREE.Group };
  front: THREE.Mesh;
  /** The office's door (world) and the point out front by the van. */
  doorAt: THREE.Vector3;
  outside: THREE.Vector3;
  mats: THREE.Material[];
};

export function buildShop(scene: THREE.Scene): Shop {
  const f = SHOP as Frame;
  const g = new THREE.Group();
  g.applyMatrix4(placeM(f));
  scene.add(g);
  const white = modelMat(0.82);
  const satin = satinMat(0xffffff, 0.35);
  const glow = glowMat();
  const b = new Batch();
  const clutter = new Batch();
  const glass = new Batch();
  const F = SHOP_FLOOR;
  const ao = footAO(0, 1.1, 0.5);
  const top = SWALL;
  const pitch = 0.27;

  // The slab, the shed's walls (the office front is glass), the roof.
  b.add(block(SW + 1.2, F, SD + 1.2), at(0, F / 2, 0), 0.62, [0.8, 0.79, 0.77]);
  b.add(block(SW, SWALL, 0.2), at(0, SWALL / 2, -SD / 2 + 0.1), ao);
  b.add(block(0.2, SWALL, SD), at(-SW / 2 + 0.1, SWALL / 2, 0), ao);
  b.add(block(0.2, SWALL, SD), at(SW / 2 - 0.1, SWALL / 2, 0), ao);
  // Front: the office glazing (x -6.8..-1.2), a pier, the roller door's opening (1.6..5.8), a pier.
  b.add(block(SW, SWALL - 2.9, 0.2), at(0, 2.9 + (SWALL - 2.9) / 2, SD / 2 - 0.1), 1);
  b.add(block(0.4, 2.9, 0.2), at(-0.95, 1.45, SD / 2 - 0.1), ao);
  b.add(block(0.8, 3.7, 0.2), at(1.2, 1.85, SD / 2 - 0.1), ao);
  b.add(block(1.2, 3.7, 0.2), at(6.4, 1.85, SD / 2 - 0.1), ao);
  b.add(block(SW - 1, 0.62, 0.2), at(0, 3.7 + 0.31, SD / 2 - 0.1), 1);
  b.add(block(0.2, 2.9, 0.2), at(-6.9, 1.45, SD / 2 - 0.1), ao);
  // The shopfront: a low sill, mullions, a transom, a glazed door at its right end.
  b.add(block(5.6, 0.45, 0.22), at(-4.05, F + 0.22, SD / 2 - 0.1), ao);
  for (const x of [-6.75, -4.9, -3.05, -2.15, -1.2]) b.add(block(0.07, 2.75, 0.12), at(x, F + 1.38, SD / 2 - 0.06), 1, [0.25, 0.25, 0.27]);
  b.add(block(5.6, 0.07, 0.12), at(-4.05, F + 2.42, SD / 2 - 0.06), 1, [0.25, 0.25, 0.27]);
  b.add(block(5.6, 0.07, 0.12), at(-4.05, F + 0.5, SD / 2 - 0.06), 1, [0.25, 0.25, 0.27]);
  // Ribs on the shed's cladding (the front above, the sides).
  for (let x = -SW / 2 + 0.3; x < SW / 2; x += 0.3) b.add(block(0.04, SWALL - 3.7, 0.03, 0.008), at(x, 3.7 + (SWALL - 3.7) / 2 + 0.31, SD / 2 + 0.005), 0.95);
  for (let z = -SD / 2 + 0.3; z < SD / 2; z += 0.3) {
    b.add(block(0.03, SWALL, 0.04, 0.008), at(-SW / 2 - 0.005, SWALL / 2, z), footAO(0, 1.1, 0.5));
    b.add(block(0.03, SWALL, 0.04, 0.008), at(SW / 2 + 0.005, SWALL / 2, z), footAO(0, 1.1, 0.5));
  }
  b.add(gableEnd(SW, pitch, 0.2), at(0, top, SD / 2 - 0.1), 1);
  b.add(gableEnd(SW, pitch, 0.2), at(0, top, -SD / 2 + 0.1), 1);
  b.add(gableRoof(SW, SD, pitch, 0.5, 0.14), at(0, top, 0), (p) => (p.y < top + 0.08 ? 0.7 : 1), ROOF);
  // A sign panel over the office: blank card, an indigo rule.
  b.add(block(5.2, 0.62, 0.08, 0.02), at(-4.05, 3.32, SD / 2 + 0.06), 1, [0.92, 0.92, 0.92]);
  const signRule = new Batch().add(block(4.6, 0.05, 0.01), at(-4.05, 3.15, SD / 2 + 0.105), 1, [0.35, 0.24, 0.94]).build();
  // The glass (lit from inside at night).
  for (const [x0, x1] of [
    [-6.75, -4.9],
    [-4.9, -3.05],
    [-3.05, -2.15],
  ] as const)
    glass.add(block(x1 - x0 - 0.07, 1.85, 0.01), at((x0 + x1) / 2, F + 1.46, SD / 2 - 0.08), 1, [1, 1, 1]);
  glass.add(block(5.5, 0.32, 0.01), at(-4.05, F + 2.62, SD / 2 - 0.08), 1, [1, 1, 1]);

  // THE OFFICE: x -6.8..-1.0, z 1.6..5.9; a ceiling, a back wall, a floor.
  const OB = 1.6;
  b.add(block(5.9, 2.8, 0.12), at(-3.95, F + 1.4, OB), footAO(F, 0.6, 0.6));
  b.add(block(0.12, 2.8, SD / 2 - OB), at(-0.95, F + 1.4, (SD / 2 + OB) / 2), footAO(F, 0.6, 0.6));
  b.add(block(5.9, 0.08, SD / 2 - OB), at(-3.95, F + 2.84, (SD / 2 + OB) / 2), 0.95);
  b.add(block(5.8, 0.012, SD / 2 - OB - 0.1, 0.003), at(-3.95, F + 0.006, (SD / 2 + OB) / 2), 0.9, [0.74, 0.73, 0.71]);
  // The desk faces the window. Its top, a modesty panel, legs.
  const DX = -3.9;
  const DZ = 3.9;
  const DY = F + 0.74;
  b.add(block(1.6, 0.035, 0.78, 0.008), at(DX, DY - 0.0175, DZ), 1, WOOD);
  b.add(block(1.5, 0.5, 0.02), at(DX, DY - 0.32, DZ + 0.36), 0.85, [0.7, 0.69, 0.67]);
  for (const sx of [-0.76, 0.76]) b.add(block(0.04, 0.72, 0.7), at(DX + sx, F + 0.36, DZ), footAO(F, 0.4, 0.6), [0.7, 0.69, 0.67]);
  // The chair: a seat on a column and a star base, a back.
  const CX = DX;
  const CZ = DZ - 0.56;
  b.add(turned([[0, 0], [0.32, 0.0], [0.32, 0.03], [0.04, 0.06], [0, 0.07]], 5), at(CX, F + 0.04, CZ), 0.6, DARKER);
  b.add(rod(0.025, 0.36, 10), at(CX, F + 0.08, CZ), 0.7, DARKER);
  b.add(block(0.5, 0.08, 0.48, 0.03), at(CX, F + 0.47, CZ), 0.9, [0.3, 0.3, 0.32]);
  b.add(block(0.46, 0.52, 0.06, 0.03), at(CX, F + 0.85, CZ - 0.27, -0.12, 0, 0), 0.9, [0.3, 0.3, 0.32]);
  b.add(block(0.03, 0.3, 0.03), at(CX, F + 0.6, CZ - 0.25), 0.8, DARKER);
  // Shelves of folders on the back wall, a filing cabinet, a wall clock, a pinboard, a calendar.
  for (const y of [F + 1.2, F + 1.62, F + 2.04]) {
    b.add(block(2.2, 0.03, 0.3), at(-5.3, y, OB + 0.21), 0.9, WOOD);
    for (let i = 0; i < 14; i++) b.add(block(0.07, 0.32, 0.26, 0.006), at(-6.3 + i * 0.075 + (i > 8 ? 0.4 : 0), y + 0.175, OB + 0.21, 0, 0, i === 12 ? 0.25 : 0), 0.85, i % 4 === 0 ? [0.36, 0.26, 0.86] : i % 3 === 0 ? [0.6, 0.6, 0.62] : [0.86, 0.85, 0.83]);
  }
  b.add(block(0.5, 1.3, 0.6, 0.02), at(-6.4, F + 0.65, OB + 0.4), footAO(F, 0.5, 0.6), [0.74, 0.74, 0.75]);
  for (const y of [F + 0.35, F + 0.75, F + 1.15]) b.add(block(0.2, 0.03, 0.02), at(-6.4, y, OB + 0.71), 1, DARKER);
  b.add(block(1.2, 0.9, 0.03, 0.01), at(-2.4, F + 1.7, OB + 0.075), 1, [0.72, 0.66, 0.56]);
  // Sticky notes and pinned papers on the board (the old way's clutter).
  for (let i = 0; i < 16; i++) {
    const x = -2.9 + (i % 6) * 0.17 + ((i * 7) % 5) * 0.01;
    const y = F + 1.98 - Math.floor(i / 6) * 0.25 - ((i * 3) % 4) * 0.02;
    clutter.add(block(0.12, 0.12, 0.004), at(x, y, OB + 0.095, 0, 0, (((i * 13) % 7) - 3) * 0.05), 1, i % 3 === 0 ? [0.98, 0.86, 0.45] : [0.95, 0.95, 0.93]);
  }
  const clockAt = V(-0.97 - 0.07, F + 2.15, 3.2);
  b.add(turned([[0, 0], [0.18, 0], [0.18, 0.04], [0.16, 0.05], [0, 0.05]], 40), at(clockAt.x, clockAt.y, clockAt.z, 0, 0, Math.PI / 2), 1, [0.95, 0.95, 0.95]);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    b.add(block(0.004, 0.025, 0.006), at(clockAt.x - 0.052, clockAt.y + Math.cos(a) * 0.14, clockAt.z + Math.sin(a) * 0.14, a, 0, 0), 1, INKISH);
  }
  // A plant by the window, a second chair for a visitor.
  plant(b, -6.35, F, 2.3, 1.1);
  b.add(block(0.46, 0.06, 0.46, 0.02), at(-1.6, F + 0.46, 4.8), 0.9, [0.3, 0.3, 0.32]);
  b.add(block(0.46, 0.46, 0.05, 0.02), at(-1.6, F + 0.72, 5.03), 0.9, [0.3, 0.3, 0.32]);
  for (const sx of [-0.2, 0.2]) for (const sz of [-0.2, 0.2]) b.add(rod(0.012, 0.44, 6), at(-1.6 + sx, F, 4.8 + sz), 0.7, DARKER);

  // On the desk: the old way's paper (piles of quotes and invoices, a mug, a calculator, a pad).
  for (const [x, z, n, r] of [
    [0.55, 0.15, 14, 0.08],
    [0.62, -0.18, 9, -0.12],
    [-0.62, -0.22, 6, 0.2],
  ] as const)
    for (let i = 0; i < n; i++) clutter.add(block(0.21, 0.004, 0.297, 0.001), at(DX + x + ((i * 7) % 5) * 0.004, DY + 0.003 + i * 0.0045, DZ + z, 0, r + (((i * 11) % 9) - 4) * 0.02, 0), 1, [0.96, 0.96, 0.95]);
  clutter.add(block(0.08, 0.012, 0.15, 0.004), at(DX + 0.35, DY + 0.006, DZ - 0.22, 0, 0.2, 0), 1, [0.2, 0.2, 0.22]);
  b.add(turned([[0, 0], [0.042, 0], [0.044, 0.1], [0.04, 0.104], [0, 0.104]], 18), at(DX - 0.45, DY, DZ + 0.12), 0.9, [0.9, 0.9, 0.9]);
  b.add(block(0.12, 0.035, 0.07, 0.01), at(DX + 0.1, DY + 0.017, DZ - 0.18), 1, [0.18, 0.18, 0.2]);

  // The laptop: its base on the desk, its lid on a hinge we can close.
  const lp = laptop();
  const lx = DX - 0.05;
  const lz = DZ - 0.02;
  const base = new THREE.Mesh(lp.base, satin);
  base.position.set(lx, DY, lz);
  base.castShadow = base.receiveShadow = true;
  g.add(base);
  const lid = new THREE.Object3D();
  lid.position.set(lx, DY + 0.014, lz + lp.D / 2);
  // Open: the lid leans back 110 degrees from closed (its face toward the owner, -Z).
  lid.rotation.set(0, Math.PI, 0);
  g.add(lid);
  const lidMesh = new THREE.Mesh(lp.lid, satin);
  lidMesh.castShadow = true;
  lid.add(lidMesh);
  const screen = new THREE.Mesh(lp.screen, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
  lid.add(screen);

  // The desk lamp: a base, two arms, a shade over the desk (a spot light, its switch on the base).
  const lampB = new Batch();
  const LX = DX - 0.58;
  const LZ = DZ + 0.02;
  lampB.add(turned([[0, 0], [0.08, 0], [0.08, 0.02], [0.03, 0.035], [0, 0.04]], 24), at(LX, DY, LZ), 0.8, [0.2, 0.2, 0.22]);
  lampB.add(rod(0.008, 0.38, 8), at(LX, DY + 0.03, LZ, -0.3, 0, 0), 1, [0.2, 0.2, 0.22]);
  const elbow = V(LX, DY + 0.03 + 0.38 * Math.cos(0.3), LZ - 0.38 * Math.sin(0.3) * -1);
  lampB.add(rod(0.008, 0.34, 8), at(elbow.x, elbow.y, elbow.z, 1.15, 0.5, 0), 1, [0.2, 0.2, 0.22]);
  const head = V(LX + 0.14, DY + 0.5, LZ - 0.22);
  lampB.add(turned([[0.0, 0.09], [0.03, 0.085], [0.07, 0.02], [0.075, 0.0], [0.07, 0.0]], 28), at(head.x, head.y, head.z, 0.5, 0, -0.35), 0.9, [0.2, 0.2, 0.22]);
  const lampMesh = new THREE.Mesh(lampB.build(), white);
  lampMesh.castShadow = true;
  g.add(lampMesh);
  const bulb = new THREE.Mesh(new Batch().add(ball(0.03, 14, 10), at(head.x, head.y - 0.01, head.z), 1).build(), glow);
  g.add(bulb);

  const meshOf = (bt: Batch, m: THREE.Material, parent: THREE.Object3D = g, shadow = true) => {
    const mesh = new THREE.Mesh(bt.build(), m);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const office = new THREE.Box3(V(-6.85, F - 0.02, 1.66), V(-1.0, F + 2.86, 5.86));
  const shed = new THREE.Box3(V(-6.9, 0, -5.9), V(6.9, top + 2, 1.55));
  const main = meshOf(b, white).geometry;
  interiorAO(main, office, 0.4);
  interiorAO(main, shed, 0.45);
  const clutterMesh = meshOf(clutter, white);
  interiorAO(clutterMesh.geometry, office, 0.4);
  // (The shopfront is open glass: nothing drawn, so we see in.)
  const front = new THREE.Mesh(glass.build(), glow);
  front.visible = false;
  g.add(front);
  g.add(new THREE.Mesh(signRule, glow));

  // The clock's hands (turned by the film's hour).
  const hands: [THREE.Object3D, THREE.Object3D] = [new THREE.Object3D(), new THREE.Object3D()];
  hands.forEach((h, i) => {
    h.position.set(clockAt.x - 0.056, clockAt.y, clockAt.z);
    const len = i === 0 ? 0.085 : 0.125;
    const m = new THREE.Mesh(new Batch().add(block(0.004, len, i === 0 ? 0.012 : 0.007, 0.001), at(0, len / 2 - 0.015, 0), 1, [0.08, 0.08, 0.09]).build(), white);
    h.add(m);
    g.add(h);
  });

  // The office door (glazed, beside the shopfront) on its hinge.
  const doorPivot = new THREE.Object3D();
  doorPivot.position.set(-2.12, F, SD / 2 - 0.06);
  g.add(doorPivot);
  meshOf(new Batch().add(block(0.9, 2.3, 0.05, 0.01), at(0.47, 1.17, 0), 1, [0.3, 0.3, 0.32]), white, doorPivot);

  // The roller door (rolls up into its head by scaling from the top).
  const roller = new THREE.Mesh(new Batch().add(block(4.2, 3.5, 0.08, 0.01), at(0, -1.75, 0), 1, [0.88, 0.88, 0.88]).build(), white);
  roller.position.set(3.7, 3.65, SD / 2 - 0.12);
  roller.castShadow = true;
  g.add(roller);
  // Inside the workshop: timber racks, a bench, a saw: seen when the door is up.
  const shedB = new Batch();
  for (let i = 0; i < 4; i++) shedB.add(block(5.0, 0.05, 0.6), at(3.4, 0.6 + i * 0.6, -5.4), 0.85, WOOD);
  for (let i = 0; i < 3; i++) for (let k = 0; k < 6; k++) shedB.add(block(4.8, 0.045, 0.09, 0.004), at(3.4, 0.66 + i * 0.6 + (k % 2) * 0.05, -5.6 + Math.floor(k / 2) * 0.12 + (k % 2) * 0.05), 0.85, [0.86, 0.75, 0.6]);
  shedB.add(block(2.4, 0.9, 0.8), at(3.6, 0.45, -1.8), footAO(0, 0.45, 0.6));
  shedB.add(block(0.5, 0.25, 0.4), at(3.2, 1.02, -1.8), 0.9, [0.3, 0.3, 0.32]);
  interiorAO(meshOf(shedB, white).geometry, shed, 0.45);

  // THE VAN, out front: a boxy van, an indigo line along it, its lights.
  const vanG = new THREE.Group();
  vanG.position.set(3.6, 0, 9.0);
  g.add(vanG);
  const vb = new Batch();
  vb.add(block(1.95, 1.75, 4.2, 0.1), at(0, 1.25, -0.4), (p) => (p.y < 0.6 ? 0.7 : 1));
  vb.add(hull([V(-0.97, 0.45, 1.7), V(0.97, 0.45, 1.7), V(-0.97, 0.45, 2.55), V(0.97, 0.45, 2.55), V(-0.95, 1.6, 1.7), V(0.95, 1.6, 1.7), V(-0.93, 1.45, 2.25), V(0.93, 1.45, 2.25), V(-0.97, 1.0, 2.6), V(0.97, 1.0, 2.6)]), null, 1);
  const vanDark = new Batch();
  vanDark.add(hull([V(-0.94, 1.08, 2.28), V(0.94, 1.08, 2.28), V(-0.92, 1.55, 1.78), V(0.92, 1.55, 1.78), V(-0.94, 1.08, 2.32), V(0.94, 1.08, 2.32), V(-0.92, 1.56, 1.74), V(0.92, 1.56, 1.74)]), null, 1, [0.06, 0.07, 0.09]);
  vb.add(block(0.012, 0.1, 4.0), at(0.985, 1.05, -0.4), 1, [0.36, 0.24, 0.94]);
  vb.add(block(0.012, 0.1, 4.0), at(-0.985, 1.05, -0.4), 1, [0.36, 0.24, 0.94]);
  const vanBody = new THREE.Mesh(vb.build(), white);
  vanBody.castShadow = vanBody.receiveShadow = true;
  vanG.add(vanBody);
  const vanWheels = new THREE.Mesh(vanDark.build(), new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.4, metalness: 0.2 }));
  vanG.add(vanWheels);
  // The wheels, each its own (they turn with the road; a hub and a tyre's tread line).
  const wheelGeo = new Batch()
    .add(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 20), null, 1, [0.08, 0.08, 0.09])
    .add(new THREE.CylinderGeometry(0.2, 0.2, 0.27, 16), null, 1, [0.5, 0.5, 0.52])
    .add(block(0.3, 0.28, 0.03), at(0, 0, 0), 1, [0.3, 0.3, 0.32])
    .build();
  for (const [x, z] of [
    [-0.86, -1.6],
    [0.86, -1.6],
    [-0.86, 1.75],
    [0.86, 1.75],
  ]) {
    const w = new THREE.Mesh(wheelGeo, vanWheels.material);
    w.name = "wheel";
    w.position.set(x, 0.36, z);
    w.rotation.set(0, 0, Math.PI / 2);
    w.castShadow = true;
    vanG.add(w);
  }
  vanBody.name = "vanBody";
  const vanLights = new THREE.Mesh(
    new Batch()
      .add(block(0.32, 0.12, 0.03), at(-0.62, 0.92, 2.6), 1, [1, 1, 1])
      .add(block(0.32, 0.12, 0.03), at(0.62, 0.92, 2.6), 1, [1, 1, 1])
      .add(block(0.1, 0.32, 0.03), at(-0.88, 1.1, -2.5), 1, [1, 0.1, 0.06])
      .add(block(0.1, 0.32, 0.03), at(0.88, 1.1, -2.5), 1, [1, 0.1, 0.06])
      .build(),
    glow
  );
  vanG.add(vanLights);
  // The driver's door (right-hand drive: the van's -X side) at the front of the box, hinged at its front edge; behind it, the dark of the cab.
  const vanDoor = new THREE.Group();
  vanDoor.position.set(-0.99, 0, 1.65);
  vanG.add(vanDoor);
  const doorB = new Batch();
  doorB.add(block(0.03, 1.3, 0.7, 0.01), at(0, 1.2, -0.35), (p) => (p.y < 0.75 ? 0.75 : 1));
  const doorMesh = new THREE.Mesh(doorB.build(), white);
  doorMesh.castShadow = true;
  vanDoor.add(doorMesh);
  const doorWin = new THREE.Mesh(new Batch().add(block(0.004, 0.32, 0.5), at(-0.018, 1.62, -0.32), 1, [0.06, 0.07, 0.09]).build(), vanWheels.material);
  vanDoor.add(doorWin);
  const cabDark = new THREE.Mesh(new Batch().add(block(0.004, 1.24, 0.66), at(-0.974, 1.2, 1.3), 1, [0.035, 0.035, 0.04]).build(), vanWheels.material);
  vanG.add(cabDark);

  // Lights: the desk lamp (a spot with a soft shadow), the screen's glow, the ceiling.
  const spot = new THREE.SpotLight(0xffc489, 0, 6, 0.95, 0.75, 1.5);
  spot.position.copy(head);
  spot.target.position.set(DX - 0.05, DY, DZ - 0.05);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.0006;
  spot.shadow.radius = 3;
  spot.shadow.camera.near = 0.05;
  spot.shadow.camera.far = 6;
  g.add(spot, spot.target);
  const screenLight = new THREE.PointLight(0xbfd2ff, 0, 2.6, 1.6);
  screenLight.position.set(lx, DY + 0.16, lz - 0.05);
  g.add(screenLight);
  const ceiling = new THREE.PointLight(0xffe9cf, 0, 10, 1.3);
  ceiling.position.set(-3.9, F + 2.15, 3.6);
  g.add(ceiling);
  // The wall light over the roller door: a hood, its glow, a spot down onto the drive.
  const wb = new Batch();
  wb.add(block(0.5, 0.12, 0.34, 0.03), at(3.7, 3.95, SD / 2 + 0.17), 1, [0.25, 0.25, 0.27]);
  meshOf(wb, white);
  const wallGlow = new THREE.Mesh(new Batch().add(block(0.4, 0.03, 0.26, 0.01), at(3.7, 3.88, SD / 2 + 0.18), 1).build(), glow);
  g.add(wallGlow);
  const wall = new THREE.SpotLight(0xffd29a, 0, 16, 1.0, 0.8, 1.6);
  wall.position.set(3.7, 3.85, SD / 2 + 0.25);
  wall.target.position.set(3.7, 0, SD / 2 + 3.4);
  g.add(wall, wall.target);
  g.updateMatrixWorld(true);

  return {
    group: g,
    seat: inFrame(f, CX, F + 0.53, CZ + 0.02),
    seatYaw: f.yaw,
    deskY: DY,
    keys: inFrame(f, lx, DY + 0.016, lz - 0.025),
    laptop: { base, lid, screen, hinge: inFrame(f, lx, DY + 0.014, lz + lp.D / 2) },
    lamp: { spot, bulb, switch: inFrame(f, LX + 0.05, DY + 0.035, LZ - 0.02) },
    ceiling,
    screenLight,
    wall,
    wallGlow,
    wallAt: inFrame(f, 3.7, 0, SD / 2),
    clutter: clutterMesh,
    clock: { hands },
    door: { pivot: doorPivot, open: 0 },
    roller,
    van: { group: vanG, lights: vanLights, door: vanDoor },
    front,
    doorAt: inFrame(f, -1.65, 0, SD / 2 + 0.6),
    outside: inFrame(f, -1.0, 0, SD / 2 + 3.0),
    mats: [white, satin, glow],
  };
}

const INKISH: [number, number, number] = [0.1, 0.1, 0.11];
export { V as vec };
