import * as THREE from "three";
import { Kit, type Piece } from "./kit";
import { gothicArch, place, torus, tubeAlong, unitBox, unitCyl, between } from "./geo";
import { CRANK, DOOR, GATE_X, GATE_Y, RAIL_DROP, RAIL_HALF, TRAYS, TRAY_Y, WHEEL, type Layout } from "./layout";
import type { Track } from "./track";

/**
 * THE NEW MACHINE: the same business, built properly, as one system. Glass
 * tubes with light running along their rails; a ring of light where the gate
 * was; a turbine where the inbox was, under a new wheel of hours (3am, the
 * moon high); one channel through three lit nodes where the trays were; and
 * past the edge, a gold spiral up round the whole tower and back to the
 * door. Where the crank was, a flywheel turns on its own.
 */

const IND: [number, number, number] = [0.55, 0.42, 2.4];
const IND_HI: [number, number, number] = [1.2, 1.05, 3.2];
const TEAL: [number, number, number] = [0.35, 1.6, 1.9];
const GOLDL: [number, number, number] = [3.2, 2.1, 0.7];
const GLASS: [number, number, number] = [0.6, 0.85, 1.0];
const CHROME: [number, number, number] = [0.06, 0.06, 0.075];

export type NewRig = {
  rotor: Piece;
  rings: Piece[];
  lanes: Piece[];
  nodes: Piece[];
  portal: Piece;
  wheel: Piece[];
  moon: Piece;
  sun: Piece;
  flywheel: Piece;
  door: Piece;
  /** The assembly: where each piece comes from, and when it arrives (in P). */
  from: { t: THREE.Vector3; q: THREE.Quaternion; at: number }[];
  parts: { id: string; box: THREE.Box3 }[];
};

const rnd = (() => {
  let s = 4242;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
})();

/** A glass tube with two running light rails, along part of a track, in pieces. */
function glassRun(kit: Kit, track: Track, col: [number, number, number], s0 = 0, s1 = track.length, seg = 3.2, tag = "tube") {
  const n = Math.max(1, Math.round((s1 - s0) / seg));
  const Ls = (s1 - s0) / n;
  const out: Piece[] = [];
  const P = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const a = s0 + i * Ls;
    const b = a + Ls;
    track.at((a + b) / 2, P);
    const p = kit.piece(P, tag, Ls);
    kit.add("glass", tubeAlong(track, a, b + 0.005, 0, 0.0, 0.135, 12, 2), p, null, GLASS);
    // The light rails, running.
    for (const sd of [RAIL_HALF, -RAIL_HALF]) {
      const g = tubeAlong(track, a, b + 0.005, sd, -RAIL_DROP, 0.011, 4, 3);
      // aAlong: distance along the track, per vertex (rings of 4).
      const segs = g.getAttribute("position").count / 4;
      kit.add("core", g, p, null, col, 0, (vi) => a + ((b - a) * Math.floor(vi / 4)) / Math.max(1, segs - 1));
    }
    out.push(p);
  }
  return out;
}

export function buildNew(L: Layout) {
  const kit = new Kit();
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const parts: { id: string; box: THREE.Box3 }[] = [];

  // The door: an arch of light.
  const door = kit.piece(V(DOOR.x, DOOR.y, DOOR.z), "door", 6);
  {
    const arch = gothicArch(DOOR.w + 0.6, DOOR.h * 0.42, 0.08, 0.08);
    kit.add("core", arch, door, place(DOOR.x, DOOR.y + DOOR.h * 0.08, DOOR.z, 0, Math.PI / 2, 0), IND_HI);
    for (const dz of [DOOR.w / 2 + 0.15, -DOOR.w / 2 - 0.15]) kit.add("core", unitBox, door, place(DOOR.x, DOOR.y - DOOR.h * 0.3, DOOR.z + dz, 0, 0, 0, 0.08, DOOR.h * 0.78, 0.08), IND_HI);
    kit.add("light", new THREE.PlaneGeometry(DOOR.w, DOOR.h * 0.86), door, place(DOOR.x - 0.3, DOOR.y - DOOR.h * 0.17, DOOR.z, 0, Math.PI / 2, 0), [2.6, 2.4, 3.4]);
  }

  // The lanes, in glass.
  const lanes: Piece[] = [];
  L.lanes.forEach((ln) => lanes.push(...glassRun(kit, ln.track, IND)));
  // The ring of light where the gate was: one great ring, and a small one round each lane.
  const zs = L.lanesZ;
  const zMid = (Math.min(...zs) + Math.max(...zs)) / 2;
  const span = Math.max(...zs) - Math.min(...zs) + 1.2;
  const portal = kit.piece(V(GATE_X, GATE_Y + 0.5, zMid), "portal", span);
  kit.add("core", torus(span * 0.62, 0.05, 6, 64), portal, place(GATE_X, GATE_Y + 0.5, zMid, 0, Math.PI / 2, 0), IND_HI);
  kit.add("glass", torus(span * 0.62 + 0.14, 0.12, 8, 64), portal, place(GATE_X, GATE_Y + 0.5, zMid, 0, Math.PI / 2, 0), GLASS);
  const rings: Piece[] = [];
  L.lanes.forEach((ln) => {
    const p = kit.piece(V(GATE_X, GATE_Y, ln.z), "ring", 0.5);
    kit.add("core", torus(0.24, 0.02, 5, 32), p, place(GATE_X, GATE_Y, ln.z, 0, Math.PI / 2, 0), IND_HI);
    rings.push(p);
  });
  parts.push({ id: "portal", box: new THREE.Box3(V(GATE_X - 1.2, GATE_Y - 2, zMid - span), V(GATE_X + 1.2, GATE_Y + 3, zMid + span)) });

  // The chute, in glass, to the turbine.
  lanes.push(...glassRun(kit, L.nchute, IND));

  // THE TURBINE: where the inbox was. A rotor of glass blades round a bright hub.
  const T = L.TURB;
  const rotor = kit.piece(V(T.x, T.y, T.z), "rotor", T.r * 2);
  kit.add("core", torus(T.r + 0.1, 0.045, 6, 64), rotor, place(T.x, T.y, T.z), TEAL);
  kit.add("glass", torus(T.r + 0.22, 0.1, 8, 64), rotor, place(T.x, T.y, T.z), GLASS);
  kit.add("glass", new THREE.CylinderGeometry(T.r + 0.1, T.r + 0.1, 0.06, 48, 1, true), rotor, place(T.x, T.y, T.z, Math.PI / 2, 0, 0), GLASS);
  for (let b = 0; b < 9; b++) {
    const a0 = (b / 9) * Math.PI * 2;
    // A curved blade: a few short boxes bending as they go out.
    for (let k = 0; k < 4; k++) {
      const r0 = 0.45 + k * ((T.r - 0.45) / 4);
      const r1 = 0.45 + (k + 1) * ((T.r - 0.45) / 4);
      const aa = a0 + k * 0.14;
      const ab = a0 + (k + 1) * 0.14;
      kit.add("glass", unitBox, rotor, between(V(T.x + Math.cos(aa) * r0, T.y + Math.sin(aa) * r0, T.z), V(T.x + Math.cos(ab) * r1, T.y + Math.sin(ab) * r1, T.z), [0.05, 0.42]), GLASS);
    }
    kit.add("core", unitBox, rotor, between(V(T.x + Math.cos(a0) * 0.45, T.y + Math.sin(a0) * 0.45, T.z + 0.22), V(T.x + Math.cos(a0 + 0.56) * T.r, T.y + Math.sin(a0 + 0.56) * T.r, T.z + 0.22), 0.016), TEAL);
  }
  kit.add("chrome", unitCyl(24), rotor, place(T.x, T.y, T.z, Math.PI / 2, 0, 0, 0.9, 0.5, 0.9), CHROME);
  kit.add("light", new THREE.CircleGeometry(0.3, 24), rotor, place(T.x, T.y, T.z + 0.26), [2.4, 3.2, 3.8]);
  parts.push({ id: "turbine", box: new THREE.Box3(V(T.x - T.r - 0.6, T.y - T.r - 0.6, T.z - 1), V(T.x + T.r + 0.6, T.y + T.r + 0.6, T.z + 1)) });
  // Its stand.
  {
    const p = kit.piece(V(T.x, T.y - T.r - 2, T.z - 0.4), "stand", 3);
    kit.add("chrome", unitBox, p, between(V(T.x, T.y, T.z - 0.5), V(T.x - 1.4, 33.8, T.z - 0.6), 0.14), CHROME);
    kit.add("chrome", unitBox, p, between(V(T.x, T.y, T.z - 0.5), V(T.x + 1.4, 33.8, T.z - 0.6), 0.14), CHROME);
  }

  // A new wheel of hours: glass, the moon at the top at 3am.
  const wc = V(WHEEL.x, WHEEL.y, WHEEL.z);
  const wheel: Piece[] = [];
  for (let k = 0; k < 8; k++) {
    const p = kit.piece(wc, "nwheel", 6);
    kit.add("glass", torus(WHEEL.r, 0.12, 6, 18, Math.PI / 4), p, place(wc.x, wc.y, wc.z, 0, 0, (k / 8) * Math.PI * 2), GLASS);
    for (let h = 0; h < 3; h++) {
      const a = ((k * 3 + h) / 24) * Math.PI * 2;
      const major = (k * 3 + h) % 6 === 0;
      kit.add("core", unitBox, p, place(wc.x + Math.cos(a) * (WHEEL.r - 0.4), wc.y + Math.sin(a) * (WHEEL.r - 0.4), wc.z, 0, 0, a, major ? 0.6 : 0.3, 0.035, 0.035), IND);
    }
    wheel.push(p);
  }
  const moon = kit.piece(wc, "nmoon", 2);
  kit.add("light", new THREE.CircleGeometry(0.95, 40), moon, place(wc.x, wc.y - WHEEL.r, wc.z + 0.2), [1.6, 2.2, 3.6]);
  const sun = kit.piece(wc, "nsun", 2);
  kit.add("light", new THREE.CircleGeometry(1.15, 40), sun, place(wc.x, wc.y + WHEEL.r, wc.z + 0.2), [8, 4.6, 1.8]);

  // THE CHANNEL: out of the turbine, through three nodes, on to where the edge was.
  lanes.push(...glassRun(kit, L.channel, TEAL));
  const nodes: Piece[] = [];
  const Pn = new THREE.Vector3();
  const Tn = new THREE.Vector3();
  L.sNodes.forEach((s, k) => {
    L.channel.at(s, Pn);
    L.channel.tangent(s, Tn);
    const p = kit.piece(Pn, "node", 1.2);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), Tn);
    const m = new THREE.Matrix4().compose(Pn, q, new THREE.Vector3(1, 1, 1));
    kit.add("core", torus(0.48, 0.03, 6, 40), p, m, TEAL);
    kit.add("glass", torus(0.62, 0.09, 8, 40), p, m, GLASS);
    kit.add("core", torus(0.78, 0.012, 4, 40), p, m, IND);
    nodes.push(p);
    void k;
  });
  parts.push({ id: "channel", box: new THREE.Box3(V(TRAYS[0].x - 2.5, TRAY_Y - 1, -2.5), V(TRAYS[2].x + 2.5, TRAY_Y + 2.5, 1.5)) });

  // THE LOOP: gold, up and round the tower, back to the door.
  lanes.push(...glassRun(kit, L.loop, GOLDL, 0, L.loop.length, 4.2, "loop"));
  parts.push({ id: "loop", box: new THREE.Box3(V(-22, 24, -22), V(22, 53, 20)) });

  // A slim frame of polished black, with seams of light.
  const cols: [number, number][] = [
    [-11.6, 3.0],
    [-1.2, 3.0],
    [9.4, 3.0],
    [-11.6, -6.4],
    [-1.2, -6.4],
    [9.4, -6.4],
  ];
  for (const [x, z] of cols) {
    const p = kit.piece(V(x, 20, z), "ncol", 50);
    kit.add("chrome", unitBox, p, place(x, 20, z, 0, 0, 0, 0.18, 62, 0.18), CHROME);
    // Seams of light on the back columns only: the front ones stand between
    // the camera and the lanes, and a lit seam there reads as a bar of light.
    if (z < 0) kit.add("core", unitBox, p, place(x, 20, z - 0.1, 0, 0, 0, 0.02, 62, 0.02), IND);
  }
  for (const y of [28.6, 33.8, 44.6]) {
    for (const z of [3.0, -6.4]) {
      if (z > 0 && y !== 44.6) continue;
      const p = kit.piece(V(-1.1, y, z), "nbeam", 21);
      kit.add("chrome", unitBox, p, place(-1.1, y, z, 0, 0, 0, 21.2, 0.14, 0.14), CHROME);
    }
  }

  // The flywheel where the crank was: it turns on its own.
  const flywheel = kit.piece(CRANK.clone(), "flywheel", 1.8);
  kit.add("glass", new THREE.CylinderGeometry(0.85, 0.85, 0.08, 40, 1, true), flywheel, place(CRANK.x, CRANK.y, CRANK.z, Math.PI / 2, 0, 0), GLASS);
  kit.add("core", torus(0.86, 0.035, 6, 48), flywheel, place(CRANK.x, CRANK.y, CRANK.z), GOLDL);
  for (let k = 0; k < 6; k++) kit.add("core", unitBox, flywheel, place(CRANK.x, CRANK.y, CRANK.z, 0, 0, (k / 6) * Math.PI, 1.6, 0.025, 0.025), GOLDL);
  kit.add("chrome", unitCyl(16), flywheel, place(CRANK.x, CRANK.y, CRANK.z, Math.PI / 2, 0, 0, 0.3, 0.3, 0.3), CHROME);
  parts.push({ id: "flywheel", box: new THREE.Box3(V(CRANK.x - 1.4, CRANK.y - 1.4, CRANK.z - 1), V(CRANK.x + 1.4, CRANK.y + 1.4, CRANK.z + 1)) });

  // The assembly: every piece comes in from the dark, nearest the camera first.
  const C = V(0.6, 38.4, 2.4);
  const from = kit.pieces.map((p) => {
    const d = p.pivot.distanceTo(C);
    const dir = p.pivot.clone().sub(C).normalize();
    // Out along the line from the middle, swung round, and spun.
    const out = dir.multiplyScalar(26 + rnd() * 40).add(V((rnd() - 0.5) * 20, (rnd() - 0.5) * 20, (rnd() - 0.5) * 20));
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 4, (rnd() - 0.5) * 4, (rnd() - 0.5) * 4));
    const at = 15.98 + Math.min(1, d / 60) * 0.62 + rnd() * 0.12;
    return { t: out, q, at };
  });

  return { kit, rig: { rotor, rings, lanes, nodes, portal, wheel, moon, sun, flywheel, door, from, parts } as NewRig };
}
