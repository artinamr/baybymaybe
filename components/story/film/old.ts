import * as THREE from "three";
import { Kit, type Piece } from "./kit";
import { between, gearGeometry, gothicArch, place, torus, tubeAlong, unitBox, unitCyl } from "./geo";
import {
  CRANK,
  DESK,
  DISH,
  DOOR,
  EDGE,
  FLOOR_Y,
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

/**
 * THE OLD MACHINE: years of parts. Iron rails on sleepers (some lengths
 * replaced in galvanised steel or copper, one or two taped), a toll gate with
 * a portcullis per lane and a load gauge creeping past three seconds, a
 * funnel and a dish for an inbox under a wheel of hours, gantries whose claws
 * carry customers from tray to stencilled tray, and a last track that runs
 * out over the pit. The tower's iron frame and gears hold it up; at its foot,
 * by the pit, one desk, one lamp, one crank, one person.
 */

const IRON: [number, number, number] = [0.05, 0.048, 0.05];
const IRON_L: [number, number, number] = [0.09, 0.085, 0.085];
const GALV: [number, number, number] = [0.3, 0.31, 0.33];
const COPPER: [number, number, number] = [0.42, 0.19, 0.1];
const TAPE: [number, number, number] = [0.42, 0.42, 0.4];
const ENAMEL: [number, number, number] = [0.07, 0.1, 0.085];
const BRASS: [number, number, number] = [0.5, 0.34, 0.13];
const WOOD: [number, number, number] = [0.09, 0.05, 0.03];

/** How far out the crank's handle is (the hand follows it round). */
export const HANDLE_R = 0.42;

const rnd = (() => {
  let s = 1337;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
})();

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
  gears: { p: Piece; ratio: number }[];
  crank: Piece;
  figure: { torso: Piece; upper: Piece; fore: Piece; hips: THREE.Vector3; SH0: THREE.Vector3; EL0: THREE.Vector3; HA0: THREE.Vector3; legs: Piece };
  lid: Piece;
  bulb: Piece;
  shade: Piece;
  door: Piece;
  stamp: Piece[];
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

  /* ---- the tower's frame ------------------------------------------------ */
  const colX = [-11.6, -1.2, 9.4];
  const colZ = [3.0, -6.4];
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
    const glow = new THREE.PlaneGeometry(DOOR.w, DOOR.h * 0.86);
    kit.add("light", glow, door, place(DOOR.x - 0.3, DOOR.y - DOOR.h * 0.17, DOOR.z, 0, Math.PI / 2, 0), [3.2, 2.3, 1.45]);
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
    kit.add("iron", g, p, place(FUNNEL.x, 0, FUNNEL.z), IRON, 0.3);
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
    kit.add("iron", g, p, place(DISH.x, 0, DISH.z), [0.035, 0.04, 0.05], 0.06);
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
  kit.add("light", new THREE.CircleGeometry(1.15, 40), sun, place(wc.x, wc.y + WHEEL.r, wc.z + 0.2), [4.2, 2.4, 0.9]);
  const moon = kit.piece(wc, "moon", 2);
  kit.add("light", new THREE.CircleGeometry(0.95, 40), moon, place(wc.x, wc.y - WHEEL.r, wc.z + 0.2), [1.3, 1.75, 2.8]);
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

  /* ---- gears on the tower's back, turned by the crank's chain ----------------- */
  const gears: { p: Piece; ratio: number }[] = [];
  const gearSpec: [number, number, number, number, number][] = [
    // x, y, z, radius, ratio
    [-9.6, 20.5, -6.9, 3.2, 1],
    [-4.35, 22.4, -6.9, 2.1, -1.52],
    [-0.3, 19.6, -6.9, 2.9, 1.1],
    [4.9, 22.0, -6.9, 2.4, -1.33],
    [9.8, 18.8, -6.9, 3.4, 0.94],
    [-8.0, 13.4, -6.9, 2.4, -1.33],
    [2.6, 13.2, -6.9, 3.8, 0.84],
  ];
  for (const [x, y, z, r, ratio] of gearSpec) {
    const p = kit.piece(V(x, y, z), "gear", r * 2);
    const teeth = Math.round(r * 9);
    kit.add("iron", gearGeometry(r, teeth, 0.32, r > 3 ? 6 : 5), p, place(x, y, z), rnd() < 0.3 ? BRASS : IRON, 0.65);
    kit.add("iron", unitCyl(16), p, place(x, y, z + 0.1, Math.PI / 2, 0, 0, 0.5, 0.7, 0.5), IRON_L, 0.6);
    gears.push({ p, ratio });
  }

  /* ---- the owner's corner, on the floor by the pit ---------------------------- */
  const dx = DESK.x;
  const dz = DESK.z;
  const fy = FLOOR_Y;
  const deskP = kit.piece(V(dx, fy + 0.7, dz), "desk", 2);
  kit.add("iron", unitBox, deskP, place(dx, fy + 0.95, dz, 0, 0.35, 0, 2.0, 0.08, 0.95), WOOD, 0.1);
  for (const [ax, az] of [
    [-0.9, -0.4],
    [0.9, -0.4],
    [-0.9, 0.4],
    [0.9, 0.4],
  ])
    kit.add("iron", unitBox, deskP, place(dx + ax * Math.cos(0.35) + az * Math.sin(0.35), fy + 0.47, dz - ax * Math.sin(0.35) + az * Math.cos(0.35), 0, 0.35, 0, 0.07, 0.94, 0.07), WOOD, 0.1);
  // Paper: stacks of it.
  for (let k = 0; k < 4; k++) kit.add("iron", unitBox, deskP, place(dx - 0.5 + k * 0.08, fy + 1.0 + k * 0.035, dz + 0.1 - k * 0.05, 0, 0.35 + k * 0.2, 0, 0.42, 0.03, 0.3), [0.55, 0.53, 0.48], 0);
  // A mug.
  kit.add("iron", new THREE.CylinderGeometry(0.07, 0.065, 0.16, 12), deskP, place(dx + 0.55, fy + 1.07, dz + 0.15), [0.35, 0.33, 0.3], 0);
  // The lamp: base, two arms, the shade, the bulb.
  kit.add("iron", unitCyl(14), deskP, place(dx + 0.35, fy + 1.0, dz - 0.2, 0, 0, 0, 0.26, 0.04, 0.26), IRON, 0.2);
  kit.add("iron", unitBox, deskP, between(V(dx + 0.35, fy + 1.02, dz - 0.2), V(dx + 0.2, fy + 1.55, dz - 0.15), 0.025), IRON, 0.2);
  kit.add("iron", unitBox, deskP, between(V(dx + 0.2, fy + 1.55, dz - 0.15), V(dx - 0.15, fy + 1.62, dz + 0.0), 0.025), IRON, 0.2);
  const shade = kit.piece(V(dx - 0.2, fy + 1.55, dz + 0.02), "shade", 0.4);
  kit.add("iron", new THREE.ConeGeometry(0.17, 0.2, 18, 1, true), shade, place(dx - 0.2, fy + 1.55, dz + 0.02, 0.35, 0, 0.2), [0.12, 0.2, 0.14], 0.1);
  const bulb = kit.piece(V(dx - 0.2, fy + 1.49, dz + 0.04), "bulb", 0.1);
  kit.add("light", new THREE.SphereGeometry(0.06, 10, 8), bulb, place(dx - 0.2, fy + 1.49, dz + 0.04), [14, 8.4, 3.8]);
  // A chair, pushed back.
  const chair = kit.piece(V(dx + 0.2, fy + 0.5, dz + 1.0), "chair", 1);
  kit.add("iron", unitBox, chair, place(dx + 0.3, fy + 0.5, dz + 1.15, 0, 0.6, 0, 0.5, 0.05, 0.5), WOOD, 0.1);
  kit.add("iron", unitBox, chair, place(dx + 0.45, fy + 0.85, dz + 1.38, 0.12, 0.6, 0, 0.5, 0.65, 0.05), WOOD, 0.1);
  for (const [ax, az] of [
    [-0.2, -0.2],
    [0.2, -0.2],
    [-0.2, 0.2],
    [0.2, 0.2],
  ])
    kit.add("iron", unitBox, chair, place(dx + 0.3 + ax, fy + 0.25, dz + 1.15 + az, 0, 0.6, 0, 0.04, 0.5, 0.04), IRON, 0.3);
  // The crank: a stand, a big wheel, a handle; the chain up to the first gear.
  const cs = kit.piece(V(CRANK.x, fy + 0.6, CRANK.z), "crankstand", 1.4);
  kit.add("iron", unitBox, cs, place(CRANK.x, fy + 0.62, CRANK.z - 0.35, 0, 0, 0, 0.18, 1.25, 0.18), IRON, 0.7);
  kit.add("iron", unitBox, cs, place(CRANK.x, fy + 0.06, CRANK.z - 0.35, 0, 0, 0, 1.0, 0.12, 0.7), IRON, 0.7);
  const crank = kit.piece(CRANK.clone(), "crank", 1.6);
  kit.add("iron", torus(0.78, 0.06, 6, 36), crank, place(CRANK.x, CRANK.y, CRANK.z), IRON_L, 0.6);
  for (let k = 0; k < 4; k++) kit.add("iron", unitBox, crank, place(CRANK.x, CRANK.y, CRANK.z, 0, 0, (k / 4) * Math.PI, 1.5, 0.05, 0.05), IRON, 0.6);
  // The handle: an arm out from the hub, a wooden grip toward whoever turns it.
  kit.add("iron", unitBox, crank, place(CRANK.x + HANDLE_R, CRANK.y, CRANK.z + 0.3, 0, 0, 0, 0.06, 0.06, 0.6), BRASS, 0.2);
  kit.add("iron", unitCyl(10), crank, place(CRANK.x + HANDLE_R, CRANK.y, CRANK.z + 0.66, Math.PI / 2, 0, 0, 0.085, 0.24, 0.085), WOOD, 0.1);
  {
    // The chain: a line of links from the crank to the first gear on the tower.
    const a = V(CRANK.x, CRANK.y, CRANK.z - 0.1);
    const b = V(gearSpec[0][0], gearSpec[0][1] - gearSpec[0][3] * 0.2, gearSpec[0][2] + 0.4);
    const p = kit.piece(a.clone().lerp(b, 0.5), "chain", a.distanceTo(b));
    const n = Math.round(a.distanceTo(b) / 0.22);
    for (let k = 0; k < n; k++) {
      const c = a.clone().lerp(b, k / n);
      const c2 = a.clone().lerp(b, (k + 0.8) / n);
      kit.add("iron", unitBox, p, between(c, c2, [0.05, 0.12], k % 2 ? Math.PI / 2 : 0), IRON_L, 0.8);
    }
  }
  // The laptop on the desk, open: the emails. (It closes at six, in the new world.)
  const lx = dx - 0.08;
  const lz = dz + 0.2;
  const laptop = kit.piece(V(lx, fy + 1.0, lz), "laptop", 0.4);
  kit.add("iron", unitBox, laptop, place(lx, fy + 1.0, lz, 0, 0.35, 0, 0.36, 0.018, 0.25), [0.05, 0.05, 0.055], 0);
  const hinge = V(lx - 0.125 * Math.sin(0.35), fy + 1.01, lz - 0.125 * Math.cos(0.35));
  const lid = kit.piece(hinge, "lid", 0.4);
  {
    // Built open (about 105 degrees), facing the chair.
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.26, 0.35, 0, "YXZ"));
    const up = new THREE.Vector3(0, 0.125, 0).applyQuaternion(q);
    const c = hinge.clone().add(up);
    kit.add("iron", unitBox, lid, new THREE.Matrix4().compose(c, q, new THREE.Vector3(0.36, 0.25, 0.012)), [0.05, 0.05, 0.055], 0);
    const glow = new THREE.PlaneGeometry(0.32, 0.21);
    const n = new THREE.Vector3(0, 0, 0.008).applyQuaternion(q);
    kit.add("light", glow, lid, new THREE.Matrix4().compose(c.clone().add(n), q, new THREE.Vector3(1, 1, 1)), [0.9, 1.05, 1.35]);
  }

  // THE PERSON AT THE CRANK: standing, leaning into it, one hand on the grip.
  // Cloth, not metal: a figure in the lamp's light, the hand following the
  // handle round (two-bone IK, world.ts).
  const CLOTH: [number, number, number] = [0.05, 0.05, 0.06];
  const SKIN: [number, number, number] = [0.2, 0.13, 0.1];
  const px = CRANK.x + 0.14;
  const pz = CRANK.z + 1.22;
  const legs = kit.piece(V(px, fy + 0.5, pz), "legs", 1);
  for (const sd of [-0.1, 0.1]) {
    kit.add("cloth", new THREE.CapsuleGeometry(0.07, 0.78, 4, 8), legs, place(px + sd, fy + 0.47, pz + 0.03), CLOTH, 0);
    kit.add("cloth", unitBox, legs, place(px + sd, fy + 0.04, pz - 0.04, 0, 0, 0, 0.1, 0.08, 0.26), [0.015, 0.015, 0.015], 0);
  }
  const hips = V(px, fy + 0.92, pz);
  const torso = kit.piece(hips, "torso", 1.2);
  kit.add("cloth", new THREE.CapsuleGeometry(0.16, 0.42, 4, 12), torso, place(px, fy + 1.2, pz, 0, 0, 0, 1, 1, 0.72), CLOTH, 0);
  kit.add("cloth", new THREE.SphereGeometry(0.1, 14, 10), torso, place(px, fy + 1.66, pz - 0.02), SKIN, 0);
  kit.add("cloth", new THREE.SphereGeometry(0.106, 14, 10), torso, place(px, fy + 1.69, pz + 0.02, 0, 0, 0, 1, 0.88, 1), [0.018, 0.014, 0.012], 0);
  kit.add("cloth", new THREE.CapsuleGeometry(0.048, 0.5, 4, 8), torso, place(px - 0.21, fy + 1.2, pz + 0.02, 0, 0, -0.07), CLOTH, 0);
  const SH0 = V(px + 0.2, fy + 1.45, pz);
  const EL0 = V(px + 0.22, fy + 1.1, pz);
  const HA0 = V(px + 0.23, fy + 0.74, pz);
  const along = (a: THREE.Vector3, b: THREE.Vector3) =>
    new THREE.Matrix4().compose(
      a.clone().add(b).multiplyScalar(0.5),
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()),
      new THREE.Vector3(1, 1, 1)
    );
  const upper = kit.piece(SH0.clone(), "upper", 0.4);
  kit.add("cloth", new THREE.CapsuleGeometry(0.05, SH0.distanceTo(EL0) - 0.04, 4, 8), upper, along(SH0, EL0), CLOTH, 0);
  const fore = kit.piece(EL0.clone(), "fore", 0.4);
  kit.add("cloth", new THREE.CapsuleGeometry(0.044, EL0.distanceTo(HA0) - 0.04, 4, 8), fore, along(EL0, HA0), CLOTH, 0);
  kit.add("cloth", new THREE.SphereGeometry(0.048, 10, 8), fore, place(HA0.x, HA0.y, HA0.z), SKIN, 0);
  parts.push({ id: "crank", box: new THREE.Box3(V(DESK.x - 1.6, FLOOR_Y - 0.2, CRANK.z - 1.4), V(CRANK.x + 2.2, FLOOR_Y + 2.6, DESK.z + 2)) });
  parts.push({ id: "pit", box: new THREE.Box3(V(-20, -30, -20), V(20, 6, 20)) });

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
      crank,
      figure: { torso, upper, fore, hips, SH0, EL0, HA0, legs },
      lid,
      bulb,
      shade,
      door,
      stamp,
      labels,
      parts,
    } as OldRig,
  };
}
