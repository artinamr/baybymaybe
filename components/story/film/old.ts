import * as THREE from "three";
import { Kit, type Piece } from "./kit";
import { between, gearGeometry, gothicArch, pipeGeometry, place, torus, tubeAlong, unitBox, unitCyl, doorLight, orb } from "./geo";
import {
  CORNER,
  CX,
  corner as cornerAt,
  DISH,
  DOOR,
  EDGE,
  FUNNEL,
  GANTRY_Y,
  GANTRY_Z,
  GATE_X,
  GATE_Y,
  PIPE_Z,
  RAIL_DROP,
  RAIL_HALF,
  RAIL_R,
  TRAYS,
  TRAY_D,
  TRAY_W,
  TRAY_Y,
  WHEEL,
  type Layout,
} from "./layout";
import type { Track } from "./track";
import { buildCorner, type Corner } from "./owner";

/**
 * THE OLD MACHINE: years of parts. Iron rails on sleepers (some lengths
 * replaced in galvanised steel or copper, one or two taped), a toll gate with
 * a portcullis per lane and a load gauge creeping past three seconds, a
 * funnel and a dish for an inbox under a wheel of hours, gantries whose claws
 * carry customers from tray to stencilled tray, and a last track that runs
 * out over the pit. The tower's iron frame and gears hold it up; at its foot,
 * by the pit, one desk, one lamp, one crank, one person.
 */

const IRON: [number, number, number] = [0.10, 0.105, 0.12];
const IRON_L: [number, number, number] = [0.19, 0.18, 0.175];
const GALV: [number, number, number] = [0.3, 0.31, 0.33];
const COPPER: [number, number, number] = [0.42, 0.19, 0.1];
const TAPE: [number, number, number] = [0.42, 0.42, 0.4];
const ENAMEL: [number, number, number] = [0.07, 0.1, 0.085];
const BRASS: [number, number, number] = [0.5, 0.34, 0.13];

const rnd = (() => {
  let s = 1337;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
})();

/* ---- gears that really mesh ------------------------------------------------
 * Involute teeth (20° pressure angle) of one module per mesh: two gears of a
 * module mesh with their pitch circles touching (centres m·(n1 + n2)/2 apart),
 * turn at the inverse ratio of their tooth counts, in opposite directions.
 * Each gear's tooth phase is baked into its geometry so that at rest, along
 * every line of centres, a tooth of one sits in a gap of the other: the train
 * meshes for any common turn of its pinion. */

const PRESSURE = (20 * Math.PI) / 180;
const involute = (a: number) => Math.tan(a) - a;

/** A spur gear's outline: n teeth of module m, tooth 0 centred on angle `phase`. */
export function gearOutline(m: number, n: number, phase = 0): [number, number][] {
  const rp = (m * n) / 2;
  const ra = rp + m;
  const rf = rp - 1.25 * m;
  const rb = rp * Math.cos(PRESSURE);
  const r0 = Math.max(rf, rb);
  // Half a tooth's angular width at the pitch circle, less a little backlash;
  // the involute narrows it toward the tip.
  const half0 = Math.PI / (2 * n) - (0.05 * m) / (2 * rp) + involute(PRESSURE);
  const halfAt = (r: number) => half0 - involute(Math.acos(Math.min(1, rb / Math.max(r, rb))));
  const out: [number, number][] = [];
  const at = (r: number, a: number) => out.push([Math.cos(a) * r, Math.sin(a) * r]);
  const K = 3;
  for (let j = 0; j < n; j++) {
    const c = phase + (j * 2 * Math.PI) / n;
    // The middle of the gap before this tooth, at the root.
    at(rf, c - Math.PI / n);
    // Up the leading flank (radial below the base circle, involute above),
    // across the tip, down the trailing flank.
    if (r0 > rf + 1e-6) at(rf, c - halfAt(r0));
    for (let k = 0; k <= K; k++) at(r0 + ((ra - r0) * k) / K, c - halfAt(r0 + ((ra - r0) * k) / K));
    for (let k = K; k >= 0; k--) at(r0 + ((ra - r0) * k) / K, c + halfAt(r0 + ((ra - r0) * k) / K));
    if (r0 > rf + 1e-6) at(rf, c + halfAt(r0));
  }
  return out;
}

/** A cast gear: the toothed rim, spokes, the web cut away between them; face width `face`, axis z. */
function spurGear(m: number, n: number, face: number, phase: number, spokes: number): THREE.BufferGeometry {
  const shape = new THREE.Shape(gearOutline(m, n, phase).map(([x, y]) => new THREE.Vector2(x, y)));
  const rp = (m * n) / 2;
  const rIn = rp - 1.25 * m - Math.max(0.07, 0.08 + rp * 0.045);
  const hub = Math.max(0.1, 0.16 + rp * 0.08);
  const w = 0.07 + rp * 0.07;
  for (let k = 0; spokes && k < spokes; k++) {
    const s0 = phase + Math.PI / n + (k / spokes) * Math.PI * 2;
    const s1 = s0 + (Math.PI * 2) / spokes;
    const ao = w / 2 / rIn;
    const ai = w / 2 / hub;
    if (rIn < hub + 0.15 || s1 - ai <= s0 + ai) continue;
    const hole = new THREE.Path();
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const a = s0 + ao + ((s1 - ao - (s0 + ao)) * i) / steps;
      if (i === 0) hole.moveTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
      else hole.lineTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
    }
    for (let i = 0; i <= 4; i++) {
      const a = s1 - ai + ((s0 + ai - (s1 - ai)) * i) / 4;
      hole.lineTo(Math.cos(a) * hub, Math.sin(a) * hub);
    }
    hole.closePath();
    shape.holes.push(hole);
  }
  // The bevel is cut INTO the outline (bevelOffset), so the flanks stand
  // exactly on the involute and meshing gears do not overlap.
  const bt = Math.min(0.025, face * 0.12);
  const bs = Math.min(0.018, m * 0.12);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: face - 2 * bt,
    bevelEnabled: true,
    bevelThickness: bt,
    bevelSize: bs,
    bevelOffset: -bs,
    bevelSegments: 1,
    curveSegments: 4,
    steps: 1,
  });
  g.translate(0, 0, -(face - 2 * bt) / 2);
  return g;
}

/**
 * A rack for a pinion of module m: built along local x (u) with its pitch line
 * on v = 0 and the teeth toward +y, extruded along z (face). Tooth centres at
 * u = (k + ½)·πm, so a gap sits at u = 0.
 */
function rackGeometry(m: number, u0: number, u1: number, face: number, back: number): THREE.BufferGeometry {
  const p = Math.PI * m;
  const ha = m;
  const hf = 1.25 * m;
  const t = Math.tan(PRESSURE);
  const half = p / 4 - 0.025 * m;
  const s = new THREE.Shape();
  s.moveTo(u0, -hf - back);
  s.lineTo(u1, -hf - back);
  s.lineTo(u1, -hf);
  for (let k = Math.floor(u1 / p - 0.5); k >= Math.ceil(u0 / p - 0.5); k--) {
    const c = (k + 0.5) * p;
    if (c + half + hf * t > u1 || c - half - hf * t < u0) continue;
    s.lineTo(c + half + hf * t, -hf);
    s.lineTo(c + half - ha * t, ha);
    s.lineTo(c - half + ha * t, ha);
    s.lineTo(c - half - hf * t, -hf);
  }
  s.lineTo(u0, -hf);
  s.closePath();
  const bt = 0.012;
  const g = new THREE.ExtrudeGeometry(s, { depth: face - 2 * bt, bevelEnabled: true, bevelThickness: bt, bevelSize: 0.008, bevelOffset: -0.008, bevelSegments: 1, steps: 1 });
  g.translate(0, 0, -(face - 2 * bt) / 2);
  return g;
}

/** The tower's columns (x) and its front and back faces (z). */
const TOWER_X = [-11.6, -1.2, 9.4];
const TOWER_Z = [3.0, -6.4];
const Y_UP = new THREE.Vector3(0, 1, 0);
/** Where the windlass's chain turns the sprocket on the front-left column (owner.ts builds it). */
export const SPROCKET = cornerAt(-0.25, 4.6, Math.hypot(CORNER.x, CORNER.z) - Math.hypot(TOWER_X[0], TOWER_Z[0]) - 0.42);
/** The sprocket's radius in owner.ts: it turns by −wound / SPROCKET_R about CX. */
const SPROCKET_R = 0.28;
/** The windlass drum's radius in owner.ts: the chain winds DRUM_R per radian of the crank. */
const DRUM_R = 0.2;
/** The universal joint behind the sprocket: the line-shaft turns from the sprocket's axle (CX) to the train's (−z). */
export const JOINT = SPROCKET.clone().addScaledVector(CX, 0.36);
/** The gears' planes: the main train, and behind it the fine first reduction. */
const TRAIN_Z = -7.0;
const TRAIN_REAR = -7.33;

export type Wheel = {
  name: string;
  m: number;
  n: number;
  /** Pitch radius. */
  rp: number;
  x: number;
  y: number;
  z: number;
  face: number;
  /** Tooth 0's angle at rest (baked into the geometry). */
  phase: number;
  /** Its turn about +z per turn of the pinion about +z. */
  rel: number;
  /** The wheel it meshes with (or shares an axle with), −1 for the pinion. */
  from: number;
  axle: boolean;
};

/**
 * The tower's gear train, as a chain from the pinion on the line-shaft:
 * the pinion (fine teeth) drives the big rear wheel of the great gear, a
 * compound (its front wheel shares the axle), and the great gear drives the
 * rest one after another; the fourth gear also drives the lowest, largest one.
 * Every centre is placed from the gear it meshes with, at the sum of their
 * pitch radii; the angles keep the old layout's places on the tower's back,
 * and land the axles by the frame's columns, girders and cross-bracing.
 */
const TRAIN_SPEC: { name: string; from: number; ang: number; m: number; n: number; axle?: boolean; rear?: boolean }[] = [
  { name: "pinion", from: -1, ang: 0, m: 0.12, n: 16, rear: true },
  { name: "drive", from: 0, ang: -0.2531, m: 0.12, n: 60, rear: true },
  { name: "great", from: 1, ang: 0, m: 0.2, n: 22, axle: true },
  { name: "b", from: 2, ang: 1.9199, m: 0.2, n: 27 },
  { name: "c", from: 3, ang: 0.7679, m: 0.2, n: 19 },
  { name: "d", from: 4, ang: -0.3491, m: 0.2, n: 32 },
  { name: "e", from: 5, ang: 0.2705, m: 0.2, n: 24 },
  { name: "f", from: 6, ang: -0.384, m: 0.2, n: 32 },
  { name: "g", from: 5, ang: -0.9425, m: 0.2, n: 40 },
];

export function trainLayout(): Wheel[] {
  const out: Wheel[] = [];
  for (const s of TRAIN_SPEC) {
    const rp = (s.m * s.n) / 2;
    const z = s.rear ? TRAIN_REAR : TRAIN_Z;
    const face = s.rear ? 0.18 : 0.3;
    if (s.from < 0) {
      out.push({ name: s.name, m: s.m, n: s.n, rp, x: JOINT.x, y: JOINT.y, z, face, phase: 0, rel: 1, from: -1, axle: false });
      continue;
    }
    const p = out[s.from];
    if (s.axle) {
      out.push({ name: s.name, m: s.m, n: s.n, rp, x: p.x, y: p.y, z, face, phase: 0, rel: p.rel, from: s.from, axle: true });
      continue;
    }
    const d = p.rp + rp;
    // A tooth of the parent at the contact point meets a gap of this gear.
    const uP = (s.ang - p.phase) / ((2 * Math.PI) / p.n);
    const phase = s.ang + Math.PI - ((2 * Math.PI) / s.n) * (0.5 - uP);
    out.push({
      name: s.name,
      m: s.m,
      n: s.n,
      rp,
      x: p.x + d * Math.cos(s.ang),
      y: p.y + d * Math.sin(s.ang),
      z,
      face,
      phase: phase % (2 * Math.PI),
      rel: (-p.rel * p.n) / s.n,
      from: s.from,
      axle: false,
    });
  }
  return out;
}

/** The pinions that lift the gates: module, teeth (pitch radius 0.62), face width. */
const GATE_M = 0.062;
const GATE_N = 20;
export const GATE_RP = (GATE_M * GATE_N) / 2;

export type Train = {
  /** The line-shaft's output half: yoke, shaft, bearings' collars and the pinion; turns about −z. */
  shaft: Piece;
  /** The universal joint's cross. */
  spider: Piece;
  /** The gears behind the tower (the compound counts once), each with its turn per turn of the pinion. */
  wheels: { p: Piece; rel: number }[];
};

const AXIS_OUT = new THREE.Vector3(0, 0, -1);
const AXIS_Z = new THREE.Vector3(0, 0, 1);
/** The cross at rest: one arm along y (the input yoke's), one along −x (the output yoke's). */
const ARM_IN = new THREE.Vector3(0, 1, 0);
const ARM_OUT = new THREE.Vector3(-1, 0, 0);
const CROSS_REST_T = new THREE.Matrix4().makeBasis(ARM_IN, ARM_OUT, new THREE.Vector3().crossVectors(ARM_IN, ARM_OUT)).transpose();
const _u = new THREE.Vector3();
const _w = new THREE.Vector3();
const _n = new THREE.Vector3();
const _cm = new THREE.Matrix4();

/**
 * Turn the line-shaft and the gear train from the windlass (call after
 * Owner.update, with owner.wound). The sprocket turns ψ = −wound/SPROCKET_R
 * about CX; through the universal joint (14.5° between the axles) the shaft
 * follows at Hooke's angle: the cross's input arm turns with the sprocket, its
 * output arm stays square to it and to the shaft. The pinion turns with the
 * shaft and every gear by its tooth ratio, so the teeth stay in mesh.
 */
export function turnTrain(R: OldRig, wound: number) {
  const psi = -wound / SPROCKET_R;
  _u.copy(ARM_IN).applyAxisAngle(CX, psi);
  _w.crossVectors(_u, AXIS_OUT).normalize();
  const raw = Math.atan2(_n.crossVectors(ARM_OUT, _w).dot(AXIS_OUT), ARM_OUT.dot(_w));
  // Unwrapped about the input's own turn (the two differ by under a degree).
  let d = (raw - psi) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  const phi = psi + d;
  R.train.shaft.q.setFromAxisAngle(AXIS_OUT, phi);
  _cm.makeBasis(_u, _w, _n.crossVectors(_u, _w)).multiply(CROSS_REST_T);
  R.train.spider.q.setFromRotationMatrix(_cm);
  // The pinion's turn about +z (the shaft's about −z, reversed); the gears follow it.
  const a = -phi;
  for (const { p, rel } of R.train.wheels) p.q.setFromAxisAngle(AXIS_Z, rel * a);
}

export type Claw = { trolley: Piece; head: Piece; fingers: Piece[]; rail: "front" | "back"; from: number; to: number; restY: number; restX: number };

export type OldRig = {
  gates: Piece[];
  needle: Piece;
  wheel: Piece[];
  sun: Piece;
  moon: Piece;
  hatch: Piece;
  claws: Claw[];
  tubes: Piece[];
  /**
   * Everything the crank turns about +z: the line-shaft (with its pinion) and
   * the gears. `ratio` is the turn per unit of world.ts's `crankA * 0.22`
   * (matching the sprocket's turn, from tooth counts down the train); `phase`
   * is 0 because each gear's mesh phase is baked into its geometry.
   * turnTrain() drives the same parts exactly, joint included.
   */
  gears: { p: Piece; ratio: number; phase: number }[];
  train: Train;
  /** The owner's corner: windlass, desk, lamp and the owner (owner.ts). */
  corner: Corner;
  lid: Piece;
  bulb: Piece;
  shade: Piece;
  door: Piece;
  stamp: Piece[];
  counterweights: Piece[];
  faults: { p: Piece; stage: number }[];
  gateDrives: Piece[];
  gateRacks: Piece[];
  /** For each gate drive, which side of its pinion the rack runs (+1: +z, −1: −z): turn the pinion by −side·lift / GATE_RP about +x. */
  gateSides: number[];
  pumps: { piston: Piece; cam: Piece; rod: Piece; rodDir: THREE.Vector3; phase: number }[];
  /** Attached meshes (canvas labels) and the piece each follows, from where they were built. */
  labels: { mesh: THREE.Mesh; piece: Piece; rest: THREE.Matrix4 }[];
  /** Hover: what each region of the machine is (a box in world space). */
  parts: { id: string; box: THREE.Box3 }[];
};

/** Rails, sleepers and (optionally) posts along a track, in pieces of `seg` length. */
function railRun(
  kit: Kit,
  track: Track,
  opts: { seg?: number; guards?: boolean; posts?: number; postTo?: number | null; patches?: boolean; s0?: number; s1?: number; tag?: string } = {}
) {
  const seg = opts.seg ?? 2.6;
  const s0 = opts.s0 ?? 0;
  const s1 = opts.s1 ?? track.length;
  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  const S = new THREE.Vector3();
  const U = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const n = Math.max(1, Math.round((s1 - s0) / seg));
  const L = (s1 - s0) / n;
  const pieces: Piece[] = [];
  for (let i = 0; i < n; i++) {
    const a = s0 + i * L;
    const b = a + L;
    track.at((a + b) / 2, P);
    const p = kit.piece(P, opts.tag ?? "rail", L);
    pieces.push(p);
    // Some lengths were replaced over the years.
    const r = rnd();
    const col = opts.patches === false ? IRON : r < 0.14 ? GALV : r < 0.22 ? COPPER : IRON;
    const rust = col === IRON ? 0.5 : col === COPPER ? 0.08 : 0.2;
    kit.add("iron", tubeAlong(track, a, b + 0.01, RAIL_HALF, -RAIL_DROP, RAIL_R, 6, 3), p, null, col, rust);
    kit.add("iron", tubeAlong(track, a, b + 0.01, -RAIL_HALF, -RAIL_DROP, RAIL_R, 6, 3), p, null, col, rust);
    if (opts.guards) {
      kit.add("iron", tubeAlong(track, a, b + 0.01, RAIL_HALF + 0.07, 0.06, RAIL_R * 0.85, 5, 3), p, null, IRON, 0.7);
      kit.add("iron", tubeAlong(track, a, b + 0.01, -RAIL_HALF - 0.07, 0.06, RAIL_R * 0.85, 5, 3), p, null, IRON, 0.7);
    }
    // Clamps where a replaced length meets the old; now and then a wrap of tape.
    if (col !== IRON || rnd() < 0.12) {
      for (const sEnd of [a + 0.06, b - 0.06]) {
        track.at(sEnd, P);
        track.frame(sEnd, T, S, U);
        for (const sd of [1, -1]) {
          const c = P.clone().addScaledVector(S, sd * RAIL_HALF).addScaledVector(U, -RAIL_DROP);
          m.compose(c, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), T), new THREE.Vector3(RAIL_R * 3.4, 0.07, RAIL_R * 3.4));
          kit.add("iron", unitCyl(7), p, m, col === IRON ? TAPE : IRON_L, col === IRON ? 0 : 0.6);
        }
      }
    }
    // Sleepers under the rails.
    for (let s = a + 0.2; s < b; s += 0.55) {
      track.at(s, P);
      track.frame(s, T, S, U);
      const c = P.clone().addScaledVector(U, -RAIL_DROP - RAIL_R - 0.012);
      const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(S, U, T));
      m.compose(c, q, new THREE.Vector3(RAIL_HALF * 2 + (opts.guards ? 0.2 : 0.07), 0.022, 0.045));
      kit.add("iron", unitBox, p, m, IRON_L, 0.8);
      if (opts.guards) {
        for (const sd of [1, -1]) {
          const g = P.clone().addScaledVector(S, sd * (RAIL_HALF + 0.07)).addScaledVector(U, -0.02);
          m.compose(g, q, new THREE.Vector3(0.014, 0.16, 0.014));
          kit.add("iron", unitBox, p, m, IRON_L, 0.8);
        }
      }
    }
    // Posts down to the frame, every so often.
    if (opts.posts) {
      for (let s = a + 0.3; s < b; s += opts.posts) {
        track.at(s, P);
        const top = P.clone().add(new THREE.Vector3(0, -RAIL_DROP - 0.03, 0));
        const bottom = new THREE.Vector3(P.x, opts.postTo ?? P.y - 2.2, P.z);
        kit.add("iron", unitBox, p, between(bottom, top, 0.045, 0.3), IRON, 0.7);
      }
    }
  }
  return pieces;
}

/** A canvas label (stencil text) as a small plane. */
function labelMesh(text: string, w: number, h: number, opts: { color?: string; bg?: string; size?: number; font?: string } = {}) {
  const c = document.createElement("canvas");
  const px = 512;
  c.width = px;
  c.height = Math.round((px * h) / w);
  const g = c.getContext("2d")!;
  g.fillStyle = opts.bg ?? "rgba(0,0,0,0)";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = opts.color ?? "#d8cfbf";
  const fam = opts.font ?? (getComputedStyle(document.body).getPropertyValue("--font-inter").trim() || "Inter, sans-serif");
  g.font = `700 ${Math.round(c.height * (opts.size ?? 0.56))}px ${fam}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  // Stencil: spaced capitals, a little worn.
  const spaced = text.split("").join(String.fromCharCode(8202));
  g.fillText(spaced, c.width / 2, c.height / 2 + c.height * 0.03);
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 260; i++) {
    g.globalAlpha = rnd() * 0.5;
    g.fillRect(rnd() * c.width, rnd() * c.height, 1 + rnd() * 5, 1 + rnd() * 2);
  }
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, fog: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.matrixAutoUpdate = false;
  return mesh;
}

/** The load gauge's face: 0 to 5 seconds, the red past three. */
function gaugeMesh(r: number) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 300;
  const g = c.getContext("2d")!;
  const cx = 256;
  const cy = 270;
  const R = 230;
  g.fillStyle = "#151310";
  g.beginPath();
  g.arc(cx, cy, R + 14, Math.PI, 0);
  g.fill();
  // The red zone: past 3 s.
  g.strokeStyle = "#c8321e";
  g.lineWidth = 26;
  g.beginPath();
  g.arc(cx, cy, R - 30, Math.PI + (3 / 5) * Math.PI, 2 * Math.PI);
  g.stroke();
  g.strokeStyle = "#e9dcc4";
  g.fillStyle = "#e9dcc4";
  const fam = getComputedStyle(document.body).getPropertyValue("--font-inter").trim() || "Inter, sans-serif";
  g.font = `600 34px ${fam}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let i = 0; i <= 50; i++) {
    const a = Math.PI + (i / 50) * Math.PI;
    const major = i % 10 === 0;
    g.lineWidth = major ? 5 : 2;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * (R - (major ? 34 : 18)), cy + Math.sin(a) * (R - (major ? 34 : 18)));
    g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    g.stroke();
    if (major) g.fillText(String(i / 10), cx + Math.cos(a) * (R - 64), cy + Math.sin(a) * (R - 64));
  }
  g.font = `500 26px ${fam}`;
  g.fillText("seconds", cx, cy - 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, fog: true });
  mat.color.setScalar(1.6);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2 * (300 / 512)), mat);
  mesh.matrixAutoUpdate = false;
  return mesh;
}

const _pm = new THREE.Matrix4();
const _pq = new THREE.Matrix4();
/** The world matrix of something built at `rest`, carried by piece `p`. */
export function pieceMatrix(p: Piece, rest: THREE.Matrix4, out: THREE.Matrix4) {
  _pm.makeTranslation(-p.pivot.x, -p.pivot.y, -p.pivot.z);
  _pq.compose(new THREE.Vector3(p.pivot.x + p.t.x, p.pivot.y + p.t.y, p.pivot.z + p.t.z), p.q, new THREE.Vector3(p.s, p.s, p.s));
  return out.multiplyMatrices(_pq, _pm).multiply(rest);
}

export function buildOld(L: Layout) {
  const kit = new Kit();
  const labels: { mesh: THREE.Mesh; piece: Piece; rest: THREE.Matrix4 }[] = [];
  const parts: { id: string; box: THREE.Box3 }[] = [];
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const faults: { p: Piece; stage: number }[] = [];
  const counterweights: Piece[] = [];
  const gateDrives: Piece[] = [];
  const gateRacks: Piece[] = [];
  const pumps: OldRig["pumps"] = [];

  /* ---- the tower's frame ------------------------------------------------ */
  const colX = TOWER_X;
  const colZ = TOWER_Z;
  const levels = [-28, -14, 0, 9.4, 17.5, 24.4, 28.6, 33.8, 39.6, 44.6, 49.2];
  for (const x of colX)
    for (const z of colZ) {
      for (let i = 0; i < levels.length - 1; i++) {
        const y0 = levels[i];
        const y1 = levels[i + 1];
        const p = kit.piece(V(x, (y0 + y1) / 2, z), "frame", y1 - y0);
        kit.add("iron", unitBox, p, between(V(x, y0, z), V(x, y1, z), [0.34, 0.34]), IRON, 0.32);
        // Rivet plates where the beams meet.
        kit.add("iron", unitBox, p, place(x, y1 - 0.25, z, 0, 0, 0, 0.5, 0.42, 0.5), IRON_L, 0.6);
      }
    }
  // Girders round each level (front ones only at a few, so the machine shows).
  for (const y of levels.slice(2)) {
    for (let i = 0; i < colX.length - 1; i++) {
      for (const z of colZ) {
        if (z > 0 && ![9.4, 24.4, 44.6].includes(y)) continue;
        const a = V(colX[i] + 0.17, y, z);
        const b = V(colX[i + 1] - 0.17, y, z);
        const p = kit.piece(a.clone().add(b).multiplyScalar(0.5), "frame", a.distanceTo(b));
        kit.add("iron", unitBox, p, between(a, b, [0.32, 0.22], Math.PI / 2), IRON, 0.6);
        kit.add("iron", unitBox, p, between(a.clone().add(V(0, 0.17, 0)), b.clone().add(V(0, 0.17, 0)), [0.06, 0.4], Math.PI / 2), IRON_L, 0.6);
      }
    }
    for (const x of colX.slice(0, 3)) {
      const a = V(x, y, colZ[0] - 0.17);
      const b = V(x, y, colZ[1] + 0.17);
      const p = kit.piece(a.clone().add(b).multiplyScalar(0.5), "frame", a.distanceTo(b));
      kit.add("iron", unitBox, p, between(a, b, [0.22, 0.3]), IRON, 0.6);
    }
  }

  // Maintenance decks have accumulated around the separate systems. Their
  // gratings, ladders and load-bearing feet make a customer bead feel tiny.
  for (const [stage, y] of [44.6, 33.8, 28.6, 17.5].entries()) {
    for (let bay = 0; bay < 3; bay++) {
      const x = -8.1 + bay * 7.0;
      const p = kit.piece(V(x, y, -4.8), "deck", 7);
      for (let k = 0; k < 18; k++) kit.add("iron", unitBox, p, place(x - 3.35 + k * 0.4, y, -4.8, 0, 0, 0, 0.12, 0.11, 2.4), IRON_L, 0.55);
      for (const z of [-3.6, -6.0]) kit.add("iron", unitBox, p, place(x, y - 0.16, z, 0, 0, 0, 7.0, 0.34, 0.18), IRON, 0.7);
      kit.add("iron", unitBox, p, place(x, y + 1.05, -6.0, 0, 0, 0, 7.0, 0.05, 0.05), IRON_L, 0.4);
      for (const dx of [-3.35, 0, 3.35]) kit.add("iron", unitBox, p, place(x + dx, y + 0.5, -6.0, 0, 0, 0, 0.055, 1.0, 0.055), IRON_L, 0.5);
      if (bay === 2) {
        // A protective lamp carries the warning for this system's level.
        const lamp = kit.piece(V(x + 2.9, y + 1.35, -4.7), "fault", 0.5);
        kit.add("iron", unitCyl(12), lamp, place(x + 2.9, y + 1.15, -4.7, 0, 0, 0, 0.32, 0.18, 0.32), IRON_L, 0.3);
        kit.add("light", new THREE.CylinderGeometry(0.13, 0.13, 0.3, 12), lamp, place(x + 2.9, y + 1.4, -4.7), stage === 2 ? [1.0, 2.2, 0.75] : [3.2, 0.6, 0.12]);
        faults.push({ p: lamp, stage });
      }
    }
  }
  // Patches connect one system to the next on the tower's back. Different
  // diameters, flanges and emergency bypasses read as years of additions.
  const services: THREE.Vector3[][] = [
    [V(10.2, 48.6, -5.2), V(12.1, 47.9, -5.2), V(12.1, 39.0, -5.2), V(8.4, 37.3, -4.0)],
    [V(-8.7, 43.5, -5.8), V(-13.7, 43.5, -5.8), V(-13.7, 31.2, -5.8), V(-7.5, 29.0, -5.6)],
    [V(7.5, 30.3, -5.8), V(11.9, 28.2, -5.8), V(11.9, 18.8, -5.8), V(7.0, 16.5, -5.8)],
  ];
  services.forEach((points, i) => {
    const p = kit.piece(points[1].clone().lerp(points[2], 0.5), "bypass", 13);
    kit.add("iron", pipeGeometry(points, 0.26 + i * 0.045), p, null, i === 1 ? COPPER : IRON_L, i === 1 ? 0.18 : 0.65);
    const middle = points[1].clone().lerp(points[2], 0.5);
    const px = middle.x + (i === 1 ? -0.85 : 0.85);
    const body = kit.piece(V(px, middle.y, middle.z), "compressor", 2.5);
    kit.add("iron", new THREE.CylinderGeometry(0.35, 0.35, 1.5, 16), body, place(px, middle.y, middle.z), IRON_L, 0.55);
    for (const dy of [-0.7, 0.7]) kit.add("iron", torus(0.36, 0.08, 6, 24), body, place(px, middle.y + dy, middle.z, Math.PI / 2), BRASS, 0.3);
    const piston = kit.piece(V(px, middle.y + 1.05, middle.z), "piston", 1.5);
    kit.add("iron", unitCyl(12), piston, place(px, middle.y + 1.05, middle.z, 0, 0, 0, 0.18, 1.4, 0.18), GALV, 0.08);
    kit.add("iron", unitBox, piston, place(px, middle.y + 1.65, middle.z, 0, 0, 0, 0.52, 0.12, 0.3), BRASS, 0.3);
    const cam = kit.piece(V(px, middle.y + 2.18, middle.z), "pumpcam", 0.9);
    kit.add("iron", gearGeometry(0.52, 16, 0.18, 4), cam, place(px, middle.y + 2.18, middle.z), BRASS, 0.45);
    kit.add("iron", unitCyl(10), cam, place(px + 0.29, middle.y + 2.18, middle.z + 0.14, Math.PI / 2, 0, 0, 0.12, 0.3, 0.12), GALV, 0.05);
    const pin = V(px + 0.29, middle.y + 2.18, middle.z + 0.3);
    const head = V(px, pin.y - Math.sqrt(0.68 * 0.68 - 0.29 * 0.29), pin.z);
    const rod = kit.piece(head, "connectingrod", 0.68);
    kit.add("iron", unitBox, rod, between(head, pin, [0.05, 0.075]), GALV, 0.05);
    kit.add("iron", unitCyl(12), piston, place(px, middle.y + 1.65, middle.z + 0.22, Math.PI / 2, 0, 0, 0.13, 0.19, 0.13), BRASS, 0.15);
    pumps.push({ piston, cam, rod, rodDir: pin.clone().sub(head).normalize(), phase: i * Math.PI * 0.7 });
    for (const dy of [-2.5, 0, 2.5]) {
      kit.add("iron", torus(0.4 + i * 0.04, 0.075, 6, 20), p, place(middle.x, middle.y + dy, middle.z, Math.PI / 2), GALV, 0.5);
      for (let bolt = 0; bolt < 8; bolt++) {
        const a = bolt / 8 * Math.PI * 2;
        kit.add("iron", unitCyl(6), p, place(middle.x + Math.cos(a) * (0.4 + i * 0.04), middle.y + dy, middle.z + Math.sin(a) * (0.4 + i * 0.04), 0, 0, 0, 0.06, 0.19, 0.06), BRASS, 0.4);
      }
    }
  });
  // The owner turns a tiny handle against literal tonnes of machinery.
  // Suspended counterweights move with the same exhausted, irregular crank.
  for (const [x, y, z] of [[-14.4, 23, -4.2], [12.8, 34.5, -6.6], [-14.4, 39.8, -7.5]]) {
    const support = kit.piece(V(x, 44, z), "suspension", 16);
    kit.add("iron", unitBox, support, between(V(x, y + 2.1, z), V(x, 50.2, z), [0.055, 0.075]), IRON_L, 0.6);
    kit.add("iron", torus(0.64, 0.13, 8, 24), support, place(x, 50.2, z), BRASS, 0.7);
    const weight = kit.piece(V(x, y, z), "counterweight", 3.6);
    for (let k = 0; k < 7; k++) kit.add("iron", unitBox, weight, place(x, y - 1.5 + k * 0.48, z, 0, 0, 0, 1.75, 0.38, 1.1), IRON, 0.65);
    for (const dx of [-0.55, 0.55]) kit.add("iron", unitBox, weight, place(x + dx, y, z + 0.6, 0, 0, 0, 0.11, 3.7, 0.11), GALV, 0.55);
    counterweights.push(weight);
  }
  // Cross-bracing on the back and the sides: the lattice that gives it scale.
  for (let i = 0; i < levels.length - 1; i++) {
    const y0 = levels[i];
    const y1 = levels[i + 1];
    for (let j = 0; j < 2; j++) {
      const x0 = colX[j];
      const x1 = colX[j + 1];
      const z = colZ[1];
      for (const [a, b] of [
        [V(x0, y0, z), V(x1, y1, z)],
        [V(x1, y0, z), V(x0, y1, z)],
      ]) {
        const p = kit.piece(a.clone().add(b).multiplyScalar(0.5), "frame", a.distanceTo(b));
        kit.add("iron", unitBox, p, between(a, b, [0.09, 0.05]), IRON, 0.7);
      }
    }
    for (const x of [colX[0], colX[2]]) {
      // The last track leaves through this bay: it is left open.
      if (x === colX[2] && y0 === 28.6) continue;
      for (const [a, b] of [
        [V(x, y0, colZ[0]), V(x, y1, colZ[1])],
        [V(x, y0, colZ[1]), V(x, y1, colZ[0])],
      ]) {
        const p = kit.piece(a.clone().add(b).multiplyScalar(0.5), "frame", a.distanceTo(b));
        kit.add("iron", unitBox, p, between(a, b, [0.07, 0.05]), IRON, 0.7);
      }
    }
  }

  // Work lamps on the columns, a caged bulb at each level: the tower reads in the dark.
  for (const x of colX.slice(0, 3))
    for (const y of [12.6, 21.0, 26.6, 31.2, 37.0, 42.2, 47.0]) {
      const z = colZ[0] + 0.32;
      if ((x * 7 + y * 3) % 5 < 1.2) continue;
      const p = kit.piece(V(x, y, z), "worklamp", 0.4);
      kit.add("light", new THREE.SphereGeometry(0.075, 10, 8), p, place(x + 0.05, y, z + 0.05), [2.8, 1.6, 0.7]);
      kit.add("iron", torus(0.1, 0.012, 4, 12), p, place(x + 0.05, y, z + 0.05, Math.PI / 2, 0, 0), IRON_L, 0.3);
      kit.add("iron", torus(0.1, 0.012, 4, 12), p, place(x + 0.05, y, z + 0.05, 0, 0, 0), IRON_L, 0.3);
      kit.add("iron", unitBox, p, place(x, y + 0.14, z - 0.12, 0, 0, 0, 0.04, 0.04, 0.3), IRON, 0.4);
    }

  /* ---- the door ----------------------------------------------------------- */
  const door = kit.piece(V(DOOR.x, DOOR.y, DOOR.z), "door", 6);
  {
    const arch = gothicArch(DOOR.w + 0.9, DOOR.h * 0.42, 0.42, 0.6);
    kit.add("iron", arch, door, place(DOOR.x, DOOR.y + DOOR.h * 0.08, DOOR.z, 0, Math.PI / 2, 0), IRON, 0.5);
    kit.add("iron", unitBox, door, place(DOOR.x, DOOR.y - DOOR.h * 0.3, DOOR.z + DOOR.w / 2 + 0.25, 0, 0, 0, 0.6, DOOR.h * 0.78, 0.42), IRON, 0.5);
    kit.add("iron", unitBox, door, place(DOOR.x, DOOR.y - DOOR.h * 0.3, DOOR.z - DOOR.w / 2 - 0.25, 0, 0, 0, 0.6, DOOR.h * 0.78, 0.42), IRON, 0.5);
    // The light of the world outside, filling the doorway.
    const [glow, glowCol] = doorLight(DOOR.w, DOOR.h * 0.86, [2.6, 1.85, 1.15]);
    kit.add("light", glow, door, place(DOOR.x - 0.3, DOOR.y - DOOR.h * 0.17, DOOR.z, 0, Math.PI / 2, 0), glowCol);
    kit.add("iron", unitBox, door, place(DOOR.x + 0.4, 50.1, DOOR.z, 0, 0, 0, 1.4, 0.12, DOOR.w + 0.6), IRON_L, 0.5);
  }
  parts.push({ id: "door", box: new THREE.Box3(V(DOOR.x - 1, 47, -3.2), V(DOOR.x + 1.6, 57.5, 2.8)) });

  /* ---- the ramp and the gate ------------------------------------------------ */
  const gates: Piece[] = [];
  L.lanes.forEach((ln, i) => {
    railRun(kit, ln.track, { s1: ln.sGate - 0.35, posts: 3.2, postTo: 44.6, tag: "rail" });
    railRun(kit, ln.track, { s0: ln.sGate + 0.35, s1: ln.track.length, posts: 2.2, postTo: 44.6, tag: "rail" });
    // The booth: two posts, a lintel, and the portcullis that rises too slowly.
    const z = ln.z;
    const booth = kit.piece(V(GATE_X, GATE_Y + 0.6, z), "booth", 1.4);
    for (const dz of [-0.26, 0.26]) kit.add("iron", unitBox, booth, place(GATE_X, GATE_Y + 0.45, z + dz, 0, 0, 0, 0.07, 1.25, 0.07), IRON, 0.6);
    kit.add("iron", unitBox, booth, place(GATE_X, GATE_Y + 1.1, z, 0, 0, 0, 0.12, 0.09, 0.62), IRON_L, 0.6);
    // A track bed under the booth, so the gap reads as a gate, not a break.
    kit.add("iron", unitBox, booth, place(GATE_X, GATE_Y - RAIL_DROP - 0.03, z, 0, 0, 0, 0.75, 0.035, 0.26), IRON_L, 0.6);
    const g = kit.piece(V(GATE_X, GATE_Y + 0.2, z), "portcullis", 0.5);
    for (let b = 0; b < 5; b++) kit.add("iron", unitBox, g, place(GATE_X - 0.04, GATE_Y + 0.18, z - 0.19 + b * 0.095, 0, 0, 0, 0.025, 0.5, 0.025), IRON_L, 0.4);
    for (const y of [GATE_Y + 0.0, GATE_Y + 0.38]) kit.add("iron", unitBox, g, place(GATE_X - 0.04, y, z, 0, 0, 0, 0.03, 0.03, 0.44), IRON_L, 0.4);
    // Spikes at the foot.
    for (let b = 0; b < 5; b++) kit.add("iron", new THREE.ConeGeometry(0.018, 0.07, 4), g, place(GATE_X - 0.04, GATE_Y - 0.1, z - 0.19 + b * 0.095, Math.PI, 0, 0), IRON_L, 0.4);
    gates[i] = g;
  });
  // The toll gate's arch over all the lanes, and the gauge on top.
  const zMin = Math.min(...L.lanesZ) - 0.55;
  const zMax = Math.max(...L.lanesZ) + 0.55;
  const span = zMax - zMin;
  const zMid = (zMin + zMax) / 2;
  const gateArch = kit.piece(V(GATE_X, GATE_Y + 2, zMid), "gatearch", span);
  kit.add("iron", gothicArch(span + 0.6, 2.4, 0.3, 0.42), gateArch, place(GATE_X + 0.1, GATE_Y + 1.25, zMid, 0, Math.PI / 2, 0), IRON, 0.55);
  for (const z of [zMin - 0.15, zMax + 0.15]) kit.add("iron", unitBox, gateArch, place(GATE_X + 0.1, GATE_Y + 0.15, z, 0, 0, 0, 0.42, 2.4, 0.36), IRON, 0.55);
  kit.add("iron", unitBox, gateArch, place(GATE_X + 0.1, GATE_Y + 1.32, zMid, 0, 0, 0, 0.5, 0.16, span + 0.9), IRON_L, 0.5);
  // An oversized drive has to lift a row of tiny gates: all this machinery
  // for a simple visit. Each pinion turns in a bearing on a bracket bolted to
  // the back of the arch; its rack runs on the side toward the lanes, tangent
  // to the pinion's pitch circle, held into the teeth by two rollers on the
  // same bracket. (The teeth are cut to the same module, so a turn of
  // lift / GATE_RP moves the rack by exactly the lift.)
  const gateSides: number[] = [];
  const DX = GATE_X + 0.52;
  const DY = GATE_Y + 2.15;
  for (const s of [-1, 1]) {
    // s: which end of the arch (−1 the zMin end, +1 the zMax end); d: distance from the arch's middle.
    const Z = (d: number) => zMid + s * d;
    const dc = span / 2 + 0.55;
    const zc = Z(dc);
    const side = -s;
    const drive = kit.piece(V(DX, DY, zc), "gatedrive", 1.6);
    kit.add("iron", spurGear(GATE_M, GATE_N, 0.22, 0, 5), drive, place(DX, DY, zc, 0, Math.PI / 2), BRASS, 0.4);
    kit.add("iron", unitCyl(18), drive, place(GATE_X + 0.53, DY, zc, 0, 0, Math.PI / 2, 0.2, 0.26, 0.2), BRASS, 0.3);
    kit.add("iron", unitCyl(12), drive, place(GATE_X + 0.52, DY, zc, 0, 0, Math.PI / 2, 0.08, 0.44, 0.08), IRON_L, 0.4);
    kit.add("iron", new THREE.CylinderGeometry(0.068, 0.068, 0.05, 6), drive, place(GATE_X + 0.685, DY, zc, 0, 0, Math.PI / 2), IRON_L, 0.3);
    // The rack: its pitch line touches the pinion's pitch circle; at rest a gap faces the pinion's tooth.
    const rackZ = zc + side * GATE_RP;
    const rack = kit.piece(V(DX, DY - 0.3, rackZ), "gaterack", 1.9);
    const frame = new THREE.Matrix4().makeBasis(V(0, 1, 0), V(0, 0, -side), V(-side, 0, 0)).setPosition(DX, DY, rackZ);
    kit.add("iron", rackGeometry(GATE_M, -1.25, 0.65, 0.2, 0.1), rack, frame, IRON, 0.7);
    // Stops at both ends of the rack, on its back: at full lift (0.46) the
    // lower one comes up against the lower roller.
    const backD = dc - GATE_RP - 1.25 * GATE_M - 0.1;
    for (const y of [DY - 1.215, DY + 0.615]) kit.add("iron", unitBox, rack, place(DX, y, Z(backD - 0.03), 0, 0, 0, 0.24, 0.07, 0.07), GALV, 0.5);
    // The bracket on the back of the arch: an arm out to the pinion's bearing,
    // a hanger down to the arch's crossbar, a roller on each behind the rack.
    const rollD = backD - 0.06;
    kit.add("iron", unitBox, gateArch, place(GATE_X + 0.34, DY, Z((rollD - 0.1 + dc) / 2), 0, 0, 0, 0.06, 0.13, dc - rollD + 0.1), IRON_L, 0.55);
    kit.add("iron", unitBox, gateArch, place(GATE_X + 0.34, DY - 0.4, Z(rollD), 0, 0, 0, 0.06, 0.86, 0.12), IRON_L, 0.55);
    kit.add("iron", unitCyl(18), gateArch, place(GATE_X + 0.365, DY, zc, 0, 0, Math.PI / 2, 0.27, 0.07, 0.27), IRON_L, 0.4);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      kit.add("iron", unitCyl(6), gateArch, place(GATE_X + 0.32, DY + Math.sin(a) * 0.1, zc + Math.cos(a) * 0.1, 0, 0, Math.PI / 2, 0.035, 0.03, 0.035), BRASS, 0.3);
    }
    for (const y of [DY, DY - 0.66]) {
      kit.add("iron", unitCyl(16), gateArch, place(DX, y, Z(rollD), 0, 0, Math.PI / 2, 0.12, 0.2, 0.12), GALV, 0.3);
      kit.add("iron", unitCyl(8), gateArch, place(GATE_X + 0.4, y, Z(rollD), 0, 0, Math.PI / 2, 0.05, 0.08, 0.05), IRON_L, 0.4);
      kit.add("iron", unitCyl(8), gateArch, place(GATE_X + 0.635, y, Z(rollD), 0, 0, Math.PI / 2, 0.06, 0.03, 0.06), IRON_L, 0.4);
    }
    gateDrives.push(drive);
    gateRacks.push(rack);
    gateSides.push(side);
  }
  // The gauge: a lit dial facing the queue, its needle creeping past three.
  const gaugeP = kit.piece(V(GATE_X - 0.25, GATE_Y + 3.15, zMid), "gauge", 1.8);
  const gR = 0.95;
  kit.add("iron", torus(gR + 0.04, 0.05, 6, 32, Math.PI), gaugeP, place(GATE_X - 0.22, GATE_Y + 2.6, zMid, 0, -Math.PI / 2, 0), BRASS, 0.3);
  kit.add("iron", unitBox, gaugeP, place(GATE_X - 0.18, GATE_Y + 2.55, zMid, 0, 0, 0, 0.1, 0.12, gR * 2 + 0.2), BRASS, 0.3);
  const gaugeFace = gaugeMesh(gR);
  labels.push({ mesh: gaugeFace, piece: gaugeP, rest: place(GATE_X - 0.26, GATE_Y + 2.6 + gR * 0.29, zMid, 0, -Math.PI / 2, 0) });
  const needle = kit.piece(V(GATE_X - 0.3, GATE_Y + 2.6, zMid), "needle", 0.8);
  kit.add("light", unitBox, needle, place(GATE_X - 0.3, GATE_Y + 2.6 + gR * 0.42, zMid, 0, 0, 0, 0.012, gR * 0.84, 0.024), [3.0, 0.5, 0.25]);
  kit.add("iron", unitCyl(10), needle, place(GATE_X - 0.31, GATE_Y + 2.6, zMid, 0, 0, Math.PI / 2, 0.09, 0.05, 0.09), BRASS, 0.2);
  // Two bulbs on the arch.
  for (const z of [zMin + 0.1, zMax - 0.1]) {
    const b = kit.piece(V(GATE_X - 0.3, GATE_Y + 2.3, z), "bulb", 0.2);
    kit.add("light", new THREE.SphereGeometry(0.07, 10, 8), b, place(GATE_X - 0.32, GATE_Y + 2.15, z), [5.5, 3.0, 1.2]);
    kit.add("iron", unitCyl(8), b, place(GATE_X - 0.32, GATE_Y + 2.26, z, 0, 0, 0, 0.07, 0.08, 0.07), IRON_L, 0.3);
  }
  parts.push({ id: "gate", box: new THREE.Box3(V(GATE_X - 1.5, GATE_Y - 0.6, zMin - 0.4), V(GATE_X + 0.7, GATE_Y + 4.2, zMax + 0.4)) });

  /* ---- the chute and the funnel ------------------------------------------- */
  railRun(kit, L.chute, { s1: L.sFunnel - 0.3, guards: true, posts: 2.6, postTo: null, tag: "rail" });
  const fun: Piece[] = [];
  for (let k = 0; k < 6; k++) {
    const p = kit.piece(V(FUNNEL.x, (FUNNEL.yTop + FUNNEL.yBot) / 2, FUNNEL.z), "funnel", 3);
    const prof: [number, number][] = [
      [FUNNEL.rBot, FUNNEL.yBot - 0.5],
      [FUNNEL.rBot, FUNNEL.yBot],
      [FUNNEL.rTop, FUNNEL.yTop],
      [FUNNEL.rTop + 0.12, FUNNEL.yTop + 0.06],
    ];
    const g = new THREE.LatheGeometry(
      prof.map(([r, y]) => new THREE.Vector2(r, y)),
      8,
      (k / 6) * Math.PI * 2,
      Math.PI / 3
    );
    // LatheGeometry is round the y axis at the origin: move it to the funnel.
    kit.add("sheet", g, p, place(FUNNEL.x, 0, FUNNEL.z), IRON, 0.3);
    fun.push(p);
  }
  {
    const p = kit.piece(V(FUNNEL.x, FUNNEL.yTop, FUNNEL.z), "funnelrim", 3);
    kit.add("iron", torus(FUNNEL.rTop + 0.12, 0.05, 6, 48), p, place(FUNNEL.x, FUNNEL.yTop + 0.06, FUNNEL.z, Math.PI / 2, 0, 0), IRON_L, 0.6);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.4;
      const top = V(FUNNEL.x + Math.cos(a) * FUNNEL.rTop, FUNNEL.yTop, FUNNEL.z + Math.sin(a) * FUNNEL.rTop);
      kit.add("iron", unitBox, p, between(top, V(top.x, 33.8, top.z), 0.08), IRON, 0.7);
    }
  }
  parts.push({ id: "dish", box: new THREE.Box3(V(FUNNEL.x - 4.4, 34.6, FUNNEL.z - 4.4), V(FUNNEL.x + 4.4, 41.4, FUNNEL.z + 4.4)) });

  /* ---- the dish (your inbox), its hatch, the pipe down -------------------- */
  for (let k = 0; k < 6; k++) {
    const p = kit.piece(V(DISH.x, DISH.y, DISH.z), "dish", 4);
    const prof: [number, number][] = [];
    for (let i = 0; i <= 8; i++) {
      const r = 0.32 + ((DISH.r - 0.32) * i) / 8;
      prof.push([r, DISH.y - 0.02 + DISH.k * r * r]);
    }
    prof.push([DISH.r + 0.08, DISH.y + DISH.k * DISH.r * DISH.r + 0.2]);
    prof.push([DISH.r + 0.16, DISH.y + DISH.k * DISH.r * DISH.r + 0.18]);
    prof.push([DISH.r + 0.12, DISH.y - 0.3]);
    prof.push([0.4, DISH.y - 0.32]);
    const g = new THREE.LatheGeometry(
      prof.map(([r, y]) => new THREE.Vector2(r, y)),
      10,
      (k / 6) * Math.PI * 2,
      Math.PI / 3
    );
    kit.add("sheet", g, p, place(DISH.x, 0, DISH.z), [0.035, 0.04, 0.05], 0.06);
  }
  const hatch = kit.piece(V(DISH.x + 0.3, DISH.y - 0.02, PIPE_Z), "hatch", 0.6);
  kit.add("iron", new THREE.CylinderGeometry(0.3, 0.3, 0.04, 20), hatch, place(DISH.x, DISH.y - 0.03, PIPE_Z), BRASS, 0.3);
  {
    const p = kit.piece(V(DISH.x, (DISH.y + TRAY_Y) / 2, DISH.z), "pipe", 6);
    kit.add("iron", new THREE.CylinderGeometry(0.2, 0.2, DISH.y - TRAY_Y - 1.0, 14, 1, true), p, place(DISH.x, (DISH.y - 0.3 + TRAY_Y + 0.7) / 2, PIPE_Z), IRON, 0.7);
    for (let k = 0; k < 4; k++) kit.add("iron", torus(0.22, 0.035, 5, 18), p, place(DISH.x, TRAY_Y + 1.4 + k * 1.1, PIPE_Z, Math.PI / 2, 0, 0), IRON_L, 0.6);
    // Dish legs down to the gantry level.
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const top = V(DISH.x + Math.cos(a) * 2.8, DISH.y - 0.25, DISH.z + Math.sin(a) * 2.8);
      kit.add("iron", unitBox, p, between(top, V(top.x, 33.8, top.z), 0.1), IRON, 0.7);
    }
  }

  /* ---- the wheel of hours ---------------------------------------------------- */
  const wheel: Piece[] = [];
  const wc = V(WHEEL.x, WHEEL.y, WHEEL.z);
  for (let k = 0; k < 8; k++) {
    const p = kit.piece(wc, "wheel", 6);
    kit.add("iron", torus(WHEEL.r, 0.14, 6, 18, Math.PI / 4), p, place(wc.x, wc.y, wc.z, 0, 0, (k / 8) * Math.PI * 2), BRASS, 0.55);
    kit.add("iron", torus(WHEEL.r - 0.75, 0.05, 5, 18, Math.PI / 4), p, place(wc.x, wc.y, wc.z, 0, 0, (k / 8) * Math.PI * 2), IRON, 0.6);
    // The hours: 24 small lamps, three per eighth (the big four brighter).
    for (let h = 0; h < 3; h++) {
      const a = ((k * 3 + h) / 24) * Math.PI * 2;
      const major = (k * 3 + h) % 6 === 0;
      kit.add(
        "iron",
        unitBox,
        p,
        place(wc.x + Math.cos(a) * (WHEEL.r - 0.4), wc.y + Math.sin(a) * (WHEEL.r - 0.4), wc.z, 0, 0, a, major ? 0.7 : 0.38, 0.07, 0.07),
        BRASS,
        0.4
      );
      kit.add(
        "light",
        new THREE.SphereGeometry(major ? 0.13 : 0.08, 10, 8),
        p,
        place(wc.x + Math.cos(a) * (WHEEL.r - 1.05), wc.y + Math.sin(a) * (WHEEL.r - 1.05), wc.z + 0.12),
        major ? [2.6, 1.7, 0.85] : [1.3, 0.85, 0.42]
      );
    }
    // Spokes.
    const a = (k / 8) * Math.PI * 2;
    kit.add("iron", unitBox, p, between(wc.clone().add(V(Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0)), wc.clone().add(V(Math.cos(a) * (WHEEL.r - 0.75), Math.sin(a) * (WHEEL.r - 0.75), 0)), 0.06), IRON, 0.7);
    wheel.push(p);
  }
  const sun = kit.piece(wc, "sun", 2);
  {
    const [g, c] = orb(1.05, [4.2, 2.4, 0.9]);
    kit.add("light", g, sun, place(wc.x, wc.y + WHEEL.r, wc.z + 0.2), c);
  }
  const moon = kit.piece(wc, "moon", 2);
  {
    const [g, c] = orb(0.88, [1.1, 1.45, 2.3], true);
    kit.add("light", g, moon, place(wc.x, wc.y - WHEEL.r, wc.z + 0.2), c);
  }
  {
    const p = kit.piece(wc, "hub", 1);
    kit.add("iron", new THREE.CylinderGeometry(0.9, 0.9, 0.5, 24), p, place(wc.x, wc.y, wc.z, Math.PI / 2, 0, 0), BRASS, 0.4);
    // The "now" mark, fixed at the top of the wheel.
    const now = kit.piece(V(wc.x, wc.y + WHEEL.r + 1.2, wc.z), "now", 0.6);
    kit.add("light", new THREE.ConeGeometry(0.28, 0.5, 3), now, place(wc.x, wc.y + WHEEL.r + 1.25, wc.z + 0.3, Math.PI, 0, 0), [3.4, 2.6, 1.6]);
  }
  parts.push({ id: "wheel", box: new THREE.Box3(V(WHEEL.x - WHEEL.r - 1, WHEEL.y - WHEEL.r - 1, WHEEL.z - 1), V(WHEEL.x + WHEEL.r + 1, WHEEL.y + WHEEL.r + 1.6, WHEEL.z + 1)) });

  /* ---- the trays, the gantries, the claws ------------------------------------- */
  const stamp: Piece[] = [];
  TRAYS.forEach((t, i) => {
    const p = kit.piece(V(t.x, TRAY_Y, t.z), "tray", TRAY_W);
    const hw = TRAY_W / 2;
    const hd = TRAY_D / 2;
    kit.add("iron", unitBox, p, place(t.x, TRAY_Y - 0.03, t.z, 0, 0, 0, TRAY_W, 0.06, TRAY_D), ENAMEL, 0.35);
    kit.add("iron", unitBox, p, place(t.x, TRAY_Y + 0.12, t.z + hd, 0, 0, 0, TRAY_W, 0.36, 0.05), ENAMEL, 0.35);
    kit.add("iron", unitBox, p, place(t.x, TRAY_Y + 0.12, t.z - hd, 0, 0, 0, TRAY_W, 0.36, 0.05), ENAMEL, 0.35);
    kit.add("iron", unitBox, p, place(t.x - hw, TRAY_Y + 0.12, t.z, 0, 0, 0, 0.05, 0.36, TRAY_D), ENAMEL, 0.35);
    kit.add("iron", unitBox, p, place(t.x + hw, TRAY_Y + 0.12, t.z, 0, 0, 0, 0.05, 0.36, TRAY_D), ENAMEL, 0.35);
    for (const dx of [-hw + 0.2, hw - 0.2]) for (const dz of [-hd + 0.2, hd - 0.2]) kit.add("iron", unitBox, p, between(V(t.x + dx, TRAY_Y - 0.06, t.z + dz), V(t.x + dx, 28.6, t.z + dz), 0.08), IRON, 0.7);
    const lab = labelMesh(t.name, TRAY_W * 0.8, 0.3, { color: "#d9cfb8", size: 0.7 });
    labels.push({ mesh: lab, piece: p, rest: place(t.x, TRAY_Y + 0.12, t.z + hd + 0.03) });
    // The invoice's stamp: a brass arm that comes down on the customer we follow.
    if (i === 2) {
      const s = kit.piece(V(t.x + 0.4, TRAY_Y + 1.6, t.z + 0.85), "stamp", 0.5);
      kit.add("iron", unitBox, s, place(t.x, TRAY_Y + 1.25, t.z + 0.85, 0, 0, 0, 0.26, 0.12, 0.26), BRASS, 0.2);
      kit.add("iron", unitBox, s, place(t.x, TRAY_Y + 1.55, t.z + 0.85, 0, 0, 0, 0.05, 0.5, 0.05), IRON, 0.5);
      stamp.push(s);
      const sp = kit.piece(V(t.x, TRAY_Y + 2.2, t.z + 0.85), "stampframe", 1);
      kit.add("iron", unitBox, sp, place(t.x, TRAY_Y + 1.83, t.z + 0.85, 0, 0, 0, 0.6, 0.1, 0.1), IRON_L, 0.5);
      kit.add("iron", unitBox, sp, between(V(t.x + 0.3, TRAY_Y + 1.83, t.z + 0.85), V(t.x + 1.5, TRAY_Y + 0.3, t.z + 1.3), 0.06), IRON, 0.5);
    }
  });
  parts.push({ id: "admin", box: new THREE.Box3(V(TRAYS[0].x - 2.2, TRAY_Y - 0.6, -3.8), V(TRAYS[2].x + 2.2, GANTRY_Y + 0.8, 1.2)) });

  for (const rail of ["front", "back"] as const) {
    const z = GANTRY_Z[rail];
    for (let k = 0; k < 3; k++) {
      const x0 = -7.4 + k * 5.4;
      const p = kit.piece(V(x0 + 2.7, GANTRY_Y, z), "gantry", 5.4);
      kit.add("iron", unitBox, p, place(x0 + 2.7, GANTRY_Y, z, 0, 0, 0, 5.4, 0.08, 0.26), IRON, 0.65);
      kit.add("iron", unitBox, p, place(x0 + 2.7, GANTRY_Y - 0.16, z, 0, 0, 0, 5.4, 0.3, 0.05), IRON, 0.65);
      kit.add("iron", unitBox, p, place(x0 + 2.7, GANTRY_Y - 0.32, z, 0, 0, 0, 5.4, 0.06, 0.2), IRON, 0.65);
    }
  }
  for (const x of [-7.5, 8.8])
    for (const z of [GANTRY_Z.front, GANTRY_Z.back]) {
      const p = kit.piece(V(x, (GANTRY_Y + 28.6) / 2, z), "gantrypost", 4);
      kit.add("iron", unitBox, p, between(V(x, 28.6, z), V(x, GANTRY_Y + 0.1, z), 0.16), IRON, 0.65);
    }
  const claws: Claw[] = [];
  const clawSpec: [Claw["rail"], number, number][] = [
    ["front", 0, 1],
    ["front", 1, 2],
    ["back", 0, 1],
    ["back", 1, 2],
  ];
  for (const [rail, from, to] of clawSpec) {
    const z = GANTRY_Z[rail];
    const x = TRAYS[from].x;
    const trolley = kit.piece(V(x, GANTRY_Y + 0.12, z), "trolley", 0.5);
    kit.add("iron", unitBox, trolley, place(x, GANTRY_Y + 0.16, z, 0, 0, 0, 0.5, 0.18, 0.36), IRON_L, 0.5);
    for (const dx of [-0.17, 0.17]) kit.add("iron", unitCyl(10), trolley, place(x + dx, GANTRY_Y + 0.05, z, Math.PI / 2, 0, 0, 0.12, 0.42, 0.12), IRON, 0.5);
    // (The cable is drawn on its own: it stretches, and pieces only scale evenly.)
    const restY = GANTRY_Y - 1.0;
    const head = kit.piece(V(x, restY, z), "claw", 0.4);
    kit.add("iron", unitCyl(10), head, place(x, restY, z, 0, 0, 0, 0.22, 0.12, 0.22), IRON_L, 0.5);
    kit.add("iron", new THREE.SphereGeometry(0.05, 8, 6), head, place(x, restY + 0.09, z), BRASS, 0.2);
    const fingers: Piece[] = [];
    for (let f = 0; f < 3; f++) {
      const a = (f / 3) * Math.PI * 2;
      const hx = x + Math.cos(a) * 0.09;
      const hz = z + Math.sin(a) * 0.09;
      const fp = kit.piece(V(hx, restY - 0.05, hz), "finger", 0.25);
      kit.add("iron", unitBox, fp, between(V(hx, restY - 0.05, hz), V(x + Math.cos(a) * 0.17, restY - 0.24, z + Math.sin(a) * 0.17), 0.028), IRON_L, 0.5);
      kit.add("iron", unitBox, fp, between(V(x + Math.cos(a) * 0.17, restY - 0.24, z + Math.sin(a) * 0.17), V(x + Math.cos(a) * 0.09, restY - 0.33, z + Math.sin(a) * 0.09), 0.026), IRON_L, 0.5);
      fingers.push(fp);
    }
    claws.push({ trolley, head, fingers, rail, from, to, restY, restX: x });
  }

  /* ---- fluorescent tubes over the admin floor ------------------------------- */
  const tubes: Piece[] = [];
  for (let k = 0; k < 6; k++) {
    const x = -6.2 + k * 2.6;
    for (const [z, y] of [
      [0.9, 34.3],
      [-4.3, 32.4],
    ]) {
      if (z < 0 && k % 2) continue;
      const p = kit.piece(V(x, y, z), "tube", 1.4);
      kit.add("light", unitCyl(8), p, place(x, y - 0.08, z, 0, 0, Math.PI / 2, 0.05, 1.5, 0.05), [0.9, 1.9, 0.95]);
      kit.add("iron", unitBox, p, place(x, y + 0.05, z, 0, 0, 0, 1.62, 0.08, 0.2), IRON_L, 0.3);
      for (const dx of [-0.6, 0.6]) kit.add("iron", unitBox, p, place(x + dx, y + 0.6, z, 0, 0, 0, 0.012, 1.1, 0.012), IRON, 0.2);
      tubes.push(p);
    }
  }

  /* ---- the last track, out over the pit ------------------------------------- */
  railRun(kit, L.final, { s1: L.final.length - 0.6, posts: 2.0, postTo: null, tag: "rail" });
  {
    // The end: the rails just stop, bent where they were cut.
    const s0 = L.final.length - 0.6;
    const P = new THREE.Vector3();
    L.final.at(s0, P);
    const p = kit.piece(P, "edge", 0.6);
    for (const [side, droop] of [
      [RAIL_HALF, -0.06],
      [-RAIL_HALF, 0.03],
    ] as const) {
      kit.add("iron", tubeAlong(L.final, s0, L.final.length, side, -RAIL_DROP + droop * 0.4, RAIL_R, 6, 6), p, null, IRON, 0.9);
    }
    // A last post with a lamp on it, lighting the place where the track stops
    // (on the track's left, clear of the camera that chases down its right).
    const dEnd = L.final.tangent(L.final.length, new THREE.Vector3());
    const hn = Math.hypot(dEnd.x, dEnd.z) || 1;
    const fx = dEnd.x / hn;
    const fz = dEnd.z / hn;
    const lpx = EDGE.x - fx * 0.5 + fz * 0.55;
    const lpz = EDGE.z - fz * 0.5 - fx * 0.55;
    const ax = lpx - fz * 0.36 + fx * 0.1;
    const az = lpz + fx * 0.36 + fz * 0.1;
    kit.add("iron", unitBox, p, between(V(lpx, EDGE.y - 4, lpz), V(lpx, EDGE.y + 0.75, lpz), 0.05), IRON, 0.8);
    kit.add("iron", unitBox, p, between(V(lpx, EDGE.y + 0.75, lpz), V(ax, EDGE.y + 0.75, az), 0.03), IRON, 0.6);
    kit.add("light", new THREE.SphereGeometry(0.07, 10, 8), p, place(ax, EDGE.y + 0.62, az), [3.0, 1.2, 0.5]);
    kit.add("iron", new THREE.ConeGeometry(0.13, 0.12, 12, 1, true), p, place(ax, EDGE.y + 0.7, az), IRON_L, 0.4);
    // The cut ends of the rails catch it.
    const Pe = new THREE.Vector3();
    const Te = new THREE.Vector3();
    const Se = new THREE.Vector3();
    const Ue = new THREE.Vector3();
    L.final.at(L.final.length, Pe);
    L.final.frame(L.final.length, Te, Se, Ue);
    for (const sd of [RAIL_HALF, -RAIL_HALF]) {
      const c = Pe.clone().addScaledVector(Se, sd).addScaledVector(Ue, -RAIL_DROP + (sd > 0 ? -0.024 : 0.012));
      kit.add("light", new THREE.SphereGeometry(RAIL_R * 1.2, 8, 6), p, place(c.x, c.y, c.z), [2.2, 1.4, 0.9]);
    }
  }
  parts.push({ id: "cliff", box: new THREE.Box3(V(9.5, 23.5, -2), V(EDGE.x + 1.2, 30, EDGE.z + 1.5)) });

  /* ---- the gear train on the tower's back, turned by the crank ---------------- */
  // The windlass's chain turns a sprocket on the front-left column; a line-shaft
  // runs from it along the tower's left side (built below, after the corner)
  // to a small pinion behind the back-left column. The pinion drives the rear
  // wheel of the great gear; the great gear the rest, one after another.
  const wheels = trainLayout();
  const trainParts: { p: Piece; rel: number }[] = [];
  const trainAxles: { x: number; y: number; r: number; z1: number }[] = [];
  const TRAIN_COLOR: Record<string, [number, number, number]> = { drive: BRASS, c: BRASS, f: BRASS };
  for (const w of wheels) {
    if (w.from < 0) continue; // the pinion is on the line-shaft
    const p = w.axle ? trainParts[trainParts.length - 1].p : kit.piece(V(w.x, w.y, TRAIN_Z), "gear", (w.rp + w.m) * 2);
    kit.add("iron", spurGear(w.m, w.n, w.face, w.phase, w.rp > 3 ? 6 : 5), p, place(w.x, w.y, w.z), TRAIN_COLOR[w.name] ?? IRON, TRAIN_COLOR[w.name] ? 0.45 : 0.65);
    if (w.axle) continue;
    // Hub, axle, a hexagon nut behind (it shows the turn), the boss on the front.
    const hub = Math.max(0.1, 0.16 + w.rp * 0.08) + 0.06;
    const back = w.name === "drive" ? TRAIN_REAR - 0.12 : TRAIN_Z - 0.2;
    kit.add("iron", unitCyl(20), p, place(w.x, w.y, (TRAIN_Z + 0.16 + back) / 2, Math.PI / 2, 0, 0, hub * 2, TRAIN_Z + 0.16 - back, hub * 2), IRON_L, 0.55);
    kit.add("iron", unitCyl(14), p, place(w.x, w.y, (-6.58 + back - 0.1) / 2, Math.PI / 2, 0, 0, 0.17, -6.58 - back + 0.1, 0.17), IRON_L, 0.4);
    kit.add("iron", new THREE.CylinderGeometry(hub * 0.62, hub * 0.62, 0.08, 6), p, place(w.x, w.y, back - 0.05, Math.PI / 2, 0, 0), IRON_L, 0.35);
    trainParts.push({ p, rel: w.rel });
    trainAxles.push({ x: w.x, y: w.y, r: hub, z1: TRAIN_Z + 0.16 });
  }

  /* ---- the owner's corner: the windlass, the desk, the owner (owner.ts) ------ */
  // The chain runs from the windlass to a sprocket on the front-left column.
  const corner = buildCorner(kit, {
    sprocket: SPROCKET.clone(),
    column: V(colX[0], 0, colZ[0]),
  });
  parts.push({ id: "crank", box: corner.box });
  parts.push({ id: "pit", box: new THREE.Box3(V(-20, -30, -20), V(20, 6, 20)) });

  /* ---- the line-shaft: sprocket → universal joint → along the side → pinion -- */
  // (Built after the corner, so the pieces before keep their ids.)
  const J = JOINT;
  const ji = (k: number) => J.clone().addScaledVector(CX, k);
  // On the sprocket (it turns about CX): the axle through both bearings, the input yoke.
  const sp = corner.sprocket;
  kit.add("iron", unitCyl(14), sp, between(SPROCKET.clone().addScaledVector(CX, -0.16), ji(-0.13), [0.11, 0.11]), IRON_L, 0.35);
  kit.add("iron", unitCyl(18), sp, between(ji(-0.16), ji(-0.11), [0.19, 0.19]), IRON_L, 0.35);
  for (const sd of [1, -1]) kit.add("iron", unitBox, sp, between(ji(-0.13).addScaledVector(Y_UP, sd * 0.095), ji(0.045).addScaledVector(Y_UP, sd * 0.095), [0.05, 0.05]), IRON_L, 0.35);
  // The cross between the yokes (turnTrain keeps it square to both).
  const spider = kit.piece(J.clone(), "ujoint", 0.3);
  kit.add("iron", unitBox, spider, place(J.x, J.y, J.z, 0, 0, 0, 0.075, 0.075, 0.075), BRASS, 0.25);
  kit.add("iron", unitCyl(10), spider, place(J.x, J.y, J.z, 0, 0, 0, 0.045, 0.25, 0.045), BRASS, 0.25);
  kit.add("iron", unitCyl(10), spider, place(J.x, J.y, J.z, 0, 0, Math.PI / 2, 0.045, 0.25, 0.045), BRASS, 0.25);
  // The output half: yoke, the shaft along the tower's left side, the pinion behind the back-left column.
  const pin = wheels[0];
  const endZ = TRAIN_REAR - 0.16;
  const shaft = kit.piece(V(J.x, J.y, (J.z + endZ) / 2), "shaft", J.z - endZ);
  const zc = (z0: number, z1: number, r: number) => place(J.x, J.y, (z0 + z1) / 2, Math.PI / 2, 0, 0, r * 2, Math.abs(z1 - z0), r * 2);
  kit.add("iron", unitCyl(18), shaft, zc(J.z - 0.16, J.z - 0.11, 0.095), IRON_L, 0.35);
  for (const sd of [1, -1]) kit.add("iron", unitBox, shaft, place(J.x + sd * 0.095, J.y, J.z - 0.045, 0, 0, 0, 0.05, 0.05, 0.18), IRON_L, 0.35);
  kit.add("iron", unitCyl(14), shaft, zc(J.z - 0.13, endZ, 0.058), GALV, 0.3);
  const HANG = [1.4, -3.0];
  for (const z of [...HANG, TOWER_Z[1]]) for (const dz of [-0.17, 0.17]) kit.add("iron", unitCyl(14), shaft, zc(z + dz - 0.025, z + dz + 0.025, 0.085), IRON_L, 0.4);
  kit.add("iron", spurGear(pin.m, pin.n, pin.face, pin.phase, 0), shaft, place(pin.x, pin.y, pin.z), BRASS, 0.4);
  kit.add("iron", unitCyl(18), shaft, zc(pin.z + 0.13, pin.z - 0.13, 0.17), BRASS, 0.35);
  kit.add("iron", new THREE.CylinderGeometry(0.1, 0.1, 0.06, 6), shaft, place(J.x, J.y, endZ + 0.02, Math.PI / 2, 0, 0), IRON_L, 0.3);
  // Its bearings: drop hangers from the side girder overhead, and one on the back-left column.
  const SIDE_GIRDER = 17.5;
  for (const z of [...HANG, TOWER_Z[1]]) {
    const b = kit.piece(V(J.x, J.y, z), "frame", 1);
    kit.add("iron", unitBox, b, place(J.x, J.y - 0.02, z, 0, 0, 0, 0.36, 0.2, 0.26), IRON_L, 0.55);
    kit.add("iron", unitCyl(16), b, place(J.x, J.y + 0.04, z, Math.PI / 2, 0, 0, 0.24, 0.26, 0.24), IRON_L, 0.5);
    for (const sd of [1, -1]) kit.add("iron", unitCyl(6), b, place(J.x + sd * 0.13, J.y + 0.09, z, 0, 0, 0, 0.05, 0.05, 0.05), BRASS, 0.3);
    if (z === TOWER_Z[1]) {
      kit.add("iron", unitBox, b, between(V(J.x + 0.1, J.y, z), V(TOWER_X[0], J.y, z), [0.2, 0.22]), IRON, 0.6);
    } else {
      const xg = TOWER_X[0] - 0.08;
      kit.add("iron", unitBox, b, between(V(J.x, J.y + 0.1, z), V(J.x, SIDE_GIRDER + 0.1, z), [0.1, 0.14]), IRON, 0.6);
      kit.add("iron", unitBox, b, between(V(J.x - 0.07, SIDE_GIRDER, z), V(xg, SIDE_GIRDER, z), [0.2, 0.18]), IRON, 0.6);
      // A diagonal stay keeps the hanger square.
      kit.add("iron", unitBox, b, between(V(J.x, SIDE_GIRDER - 0.7, z), V(xg, SIDE_GIRDER - 0.1, z), [0.06, 0.08]), IRON, 0.65);
    }
  }

  /* ---- each gear's bearing, bolted to the back frame ------------------------- */
  const levelsY = [0, 9.4, 17.5, 24.4, 28.6];
  const anchors = (x: number, y: number) => {
    const out: { x: number; y: number; d: number; node: boolean }[] = [];
    const seg = (x0: number, y0: number, x1: number, y1: number, weak: boolean) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)));
      const px = x0 + t * dx;
      const py = y0 + t * dy;
      out.push({ x: px, y: py, d: Math.hypot(px - x, py - y) * (weak ? 1.3 : 1), node: false });
    };
    for (const cx of TOWER_X) seg(cx, levelsY[0], cx, levelsY[levelsY.length - 1], false);
    for (const gy of levelsY) seg(TOWER_X[0], gy, TOWER_X[2], gy, false);
    for (let j = 0; j < 2; j++)
      for (let i = 0; i < levelsY.length - 1; i++) {
        const [x0, x1, y0, y1] = [TOWER_X[j], TOWER_X[j + 1], levelsY[i], levelsY[i + 1]];
        seg(x0, y0, x1, y1, true);
        seg(x1, y0, x0, y1, true);
        const nx = (x0 + x1) / 2;
        const ny = (y0 + y1) / 2;
        out.push({ x: nx, y: ny, d: Math.hypot(nx - x, ny - y) * 0.9, node: true });
      }
    return out.sort((a, b) => a.d - b.d);
  };
  const BZ0 = TOWER_Z[1] - 0.07;
  const BZ1 = TRAIN_Z + 0.16;
  for (const ax of trainAxles) {
    const b = kit.piece(V(ax.x, ax.y, (BZ0 + BZ1) / 2), "frame", 1.2);
    const s = ax.r * 1.6 + 0.12;
    kit.add("iron", unitBox, b, place(ax.x, ax.y, (BZ0 + BZ1) / 2 + 0.01, 0, 0, Math.PI / 4, s, s, BZ0 - BZ1 - 0.02), IRON_L, 0.55);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      kit.add("iron", unitCyl(6), b, place(ax.x + Math.cos(a) * s * 0.52, ax.y + Math.sin(a) * s * 0.52, BZ0, Math.PI / 2, 0, 0, 0.07, 0.05, 0.07), BRASS, 0.3);
    }
    const list = anchors(ax.x, ax.y);
    const first = list[0];
    const struts = [first];
    if (first.d > 0.45) {
      const a0 = Math.atan2(first.y - ax.y, first.x - ax.x);
      const second = list.find((q) => {
        let da = Math.abs(Math.atan2(q.y - ax.y, q.x - ax.x) - a0);
        if (da > Math.PI) da = Math.PI * 2 - da;
        return da > 0.9 && q.d < 2.6;
      });
      if (second) struts.push(second);
    }
    for (const q of struts) {
      if (q.d < s * 0.5) continue;
      kit.add("iron", unitBox, b, between(V(ax.x, ax.y, TOWER_Z[1] - 0.16), V(q.x, q.y, TOWER_Z[1] - 0.16), [0.2, 0.2]), IRON, 0.6);
      if (q.node) kit.add("iron", unitBox, b, place(q.x, q.y, TOWER_Z[1] - 0.05, 0, 0, Math.PI / 4, 0.6, 0.6, 0.05), IRON_L, 0.6);
    }
  }

  // Everything the crank turns about z, for world.ts's `crankA * 0.22 * ratio`:
  // the sprocket turns −wound / SPROCKET_R about CX (≈ −z), wound = DRUM_R·(θ − 2.2),
  // so the shaft turns (DRUM_R / SPROCKET_R)·θ about +z, and each gear by its tooth ratio.
  const PIN = DRUM_R / SPROCKET_R / (0.22 / 1.6);
  const gears = [{ p: shaft, ratio: PIN, phase: 0 }, ...trainParts.map(({ p, rel }) => ({ p, ratio: PIN * rel, phase: 0 }))];
  const train: Train = { shaft, spider, wheels: trainParts };

  return {
    kit,
    labels,
    rig: {
      gates,
      needle,
      wheel,
      sun,
      moon,
      hatch,
      claws,
      tubes,
      gears,
      train,
      gateSides,
      corner,
      lid: corner.lid,
      bulb: corner.bulb,
      shade: corner.shade,
      door,
      stamp,
      counterweights,
      faults,
      gateDrives,
      gateRacks,
      pumps,
      labels,
      parts,
    } as OldRig,
  };
}
