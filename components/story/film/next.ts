import * as THREE from "three";
import { Kit, type Piece } from "./kit";
import { gothicArch, place, torus, tubeAlong, unitBox, unitCyl, between, doorLight, orb } from "./geo";
import { CRANK, CX, DOOR, GATE_X, GATE_Y, RAIL_DROP, RAIL_HALF, TRAYS, TRAY_Y, WHEEL, type Layout } from "./layout";
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
const SILVER: [number, number, number] = [0.34, 0.40, 0.52];

export type NewRig = {
  rotor: Piece;
  counterRotor: Piece;
  vanes: Piece[];
  rings: Piece[];
  lanes: Piece[];
  nodes: Piece[];
  portal: Piece;
  wheel: Piece[];
  moon: Piece;
  sun: Piece;
  flywheel: Piece;
  door: Piece;
  ribs: Piece[];
  /**
   * The assembly: where each piece comes from (t, bend, q), when it sets off
   * (at, in P), how long its flight takes (fly), the way it arrives (dir, a
   * unit vector) and whether it is lowered like a load (heavy).
   */
  from: { t: THREE.Vector3; bend: THREE.Vector3; q: THREE.Quaternion; at: number; fly: number; dir: THREE.Vector3; heavy: boolean }[];
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
    // Machined collars explain the tube as a built object, and show pieces
    // locking together during assembly instead of light appearing from nowhere.
    const end = track.at(b, new THREE.Vector3());
    const direction = track.tangent(b, new THREE.Vector3());
    const collar = new THREE.Matrix4().compose(end, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction), new THREE.Vector3(1, 1, 1));
    kit.add("chrome", torus(0.148, 0.015, 6, 16), p, collar, SILVER);
    if (tag === "loop") kit.add("core", torus(0.167, 0.008, 4, 16), p, collar, GOLDL, 0, () => b);
    out.push(p);
  }
  return out;
}

export function buildNew(L: Layout) {
  const kit = new Kit();
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const parts: { id: string; box: THREE.Box3 }[] = [];
  const ribs: Piece[] = [];
  const vanes: Piece[] = [];

  // The door: an arch of light.
  const door = kit.piece(V(DOOR.x, DOOR.y, DOOR.z), "door", 6);
  {
    const arch = gothicArch(DOOR.w + 0.6, DOOR.h * 0.42, 0.08, 0.08);
    kit.add("core", arch, door, place(DOOR.x, DOOR.y + DOOR.h * 0.08, DOOR.z, 0, Math.PI / 2, 0), IND_HI);
    for (const dz of [DOOR.w / 2 + 0.15, -DOOR.w / 2 - 0.15]) kit.add("core", unitBox, door, place(DOOR.x, DOOR.y - DOOR.h * 0.3, DOOR.z + dz, 0, 0, 0, 0.08, DOOR.h * 0.78, 0.08), IND_HI);
    const [glow, glowCol] = doorLight(DOOR.w, DOOR.h * 0.86, [1.6, 1.5, 2.25]);
    kit.add("light", glow, door, place(DOOR.x - 0.3, DOOR.y - DOOR.h * 0.17, DOOR.z, 0, Math.PI / 2, 0), glowCol);
  }

  // The lanes, in glass.
  const lanes: Piece[] = [];
  L.lanes.forEach((ln) => lanes.push(...glassRun(kit, ln.track, IND)));
  // Each lane comes out of the door's light: a short straight lead-in from
  // behind the glowing doorway to where the lane's track begins.
  L.lanes.forEach((ln) => {
    const a = ln.track.at(0, new THREE.Vector3());
    const t = ln.track.tangent(0, new THREE.Vector3());
    const b = a.clone().addScaledVector(t, -1.7);
    const p = kit.piece(a.clone().lerp(b, 0.5), "tube", 1.7);
    kit.add("glass", unitCyl(16), p, between(b, a, 0.27), GLASS);
    lanes.push(p);
  });
  // The ring of light where the gate was: one great ring, and a small one round each lane.
  const zs = L.lanesZ;
  const zMid = (Math.min(...zs) + Math.max(...zs)) / 2;
  const span = Math.max(...zs) - Math.min(...zs) + 1.2;
  const portal = kit.piece(V(GATE_X, GATE_Y + 0.5, zMid), "portal", span);
  kit.add("core", torus(span * 0.62, 0.05, 6, 64), portal, place(GATE_X, GATE_Y + 0.5, zMid, 0, Math.PI / 2, 0), IND_HI);
  kit.add("glass", torus(span * 0.62 + 0.14, 0.12, 8, 64), portal, place(GATE_X, GATE_Y + 0.5, zMid, 0, Math.PI / 2, 0), GLASS);
  // The old drive becomes a clean, open aperture. Fine radial vanes make
  // its scale readable while the customer's way through stays completely open.
  for (let k = 0; k < 24; k++) {
    const a = k / 24 * Math.PI * 2;
    const r = span * 0.62 + 0.29;
    const v = kit.piece(V(GATE_X, GATE_Y + 0.5 + Math.sin(a) * r, zMid + Math.cos(a) * r), "portalvane", 0.3);
    kit.add("chrome", unitBox, v, place(GATE_X, GATE_Y + 0.5 + Math.sin(a) * r, zMid + Math.cos(a) * r, a, 0, 0, 0.32, 0.055, 0.23), SILVER);
    kit.add("core", unitBox, v, place(GATE_X - 0.17, GATE_Y + 0.5 + Math.sin(a) * r, zMid + Math.cos(a) * r, a, 0, 0, 0.012, 0.035, 0.15), IND);
    vanes.push(v);
  }
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
  // The blades run between two glass shrouds: behind, a ring on their tips;
  // in front, a smaller ring on their faces. The way in and out, in the
  // blades' own plane, stays open: a customer is carried through, never
  // through glass. (The counter-rotor turns just in front of the small ring.)
  kit.add("glass", torus(T.r + 0.05, 0.07, 8, 64), rotor, place(T.x, T.y, T.z - 0.28), GLASS);
  kit.add("core", torus(T.r + 0.05, 0.03, 6, 64), rotor, place(T.x, T.y, T.z - 0.36), TEAL);
  kit.add("glass", torus(T.r * 0.79, 0.05, 8, 64), rotor, place(T.x, T.y, T.z + 0.25), GLASS);
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
  {
    const [g, c] = orb(0.26, [1.7, 2.3, 2.8]);
    kit.add("light", g, rotor, place(T.x, T.y, T.z + 0.26), c);
  }
  // A second impeller turns against the first. Its silver blades make the
  // direction readable through the glass rather than blurring into a halo.
  const counterRotor = kit.piece(V(T.x, T.y, T.z + 0.4), "counterrotor", T.r * 2);
  kit.add("core", torus(T.r * 0.77, 0.022, 5, 64), counterRotor, place(T.x, T.y, T.z + 0.4), TEAL);
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * Math.PI * 2;
    kit.add("chrome", unitBox, counterRotor, place(T.x + Math.cos(a) * T.r * 0.81, T.y + Math.sin(a) * T.r * 0.81, T.z + 0.4, 0.3, 0, a + 0.28, T.r * 0.28, 0.12, 0.16), SILVER);
  }
  // A stationary housing surrounds the moving answer engine. Unlike the old
  // inbox it has no bowl for people to wait in, only a through-flow.
  const housing = kit.piece(V(T.x, T.y, T.z - 0.1), "housing", T.r * 2.8);
  kit.add("chrome", torus(T.r + 0.48, 0.14, 8, 72), housing, place(T.x, T.y, T.z - 0.16), SILVER);
  for (let k = 0; k < 36; k++) {
    // Two ports: where the chute brings customers in (60–70°) and where the
    // channel takes them out (210–220°).
    if (k === 6 || k === 7 || k === 21 || k === 22) continue;
    const a = k / 36 * Math.PI * 2;
    const r = T.r + 0.5;
    kit.add("chrome", unitBox, housing, place(T.x + Math.cos(a) * r, T.y + Math.sin(a) * r, T.z, 0, 0, a, 0.24, 0.06, 0.55), CHROME);
    if (k % 3 === 0) kit.add("core", unitBox, housing, place(T.x + Math.cos(a) * r, T.y + Math.sin(a) * r, T.z + 0.29, 0, 0, a, 0.2, 0.022, 0.012), TEAL);
  }
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
  {
    const [g, c] = orb(0.88, [1.3, 1.75, 2.9], true);
    kit.add("light", g, moon, place(wc.x, wc.y - WHEEL.r, wc.z + 0.2), c);
  }
  const sun = kit.piece(wc, "nsun", 2);
  {
    const [g, c] = orb(1.05, [6, 3.5, 1.4]);
    kit.add("light", g, sun, place(wc.x, wc.y + WHEEL.r, wc.z + 0.2), c);
  }

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
    kit.add("chrome", torus(0.63, 0.027, 8, 40), p, m, SILVER);
    for (let petal = 0; petal < 6; petal++) {
      const a = petal / 6 * Math.PI * 2;
      const local = place(Math.cos(a) * 0.69, Math.sin(a) * 0.69, 0, 0, 0, a, 0.26, 0.07, 0.3);
      kit.add("chrome", unitBox, p, m.clone().multiply(local), CHROME);
    }
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

  // A single designed skeleton takes the place of the maintenance lattice.
  // Repeating, curved ribs embrace the same four functional levels. The
  // front arc stays dark, so it never crosses the customer as a bright bar.
  for (const [level, y] of [25.8, 34.2, 43.2, 50.8].entries()) {
    const radius = level === 3 ? 13.1 : 12.3;
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * Math.PI * 2;
      const p = kit.piece(V(-1.1 + Math.cos(a + Math.PI / 8) * radius, y, -1.8 + Math.sin(a + Math.PI / 8) * radius), "rib", 10);
      kit.add("chrome", torus(radius, 0.065, 8, 20, Math.PI / 4), p, place(-1.1, y, -1.8, Math.PI / 2, 0, a), SILVER);
      kit.add("glass", torus(radius - 0.14, 0.10, 8, 20, Math.PI / 4), p, place(-1.1, y, -1.8, Math.PI / 2, 0, a), GLASS);
      if (k >= 4) kit.add("core", torus(radius, 0.012, 4, 20, Math.PI / 4), p, place(-1.1, y, -1.8, Math.PI / 2, 0, a), level === 0 ? GOLDL : IND, 0, () => level * 8 + k);
      ribs.push(p);
    }
  }
  // Four suspension fins join the levels behind the working paths.
  for (const x of [-12.9, 10.7]) for (const z of [-5.4, -8.2]) {
    for (let k = 0; k < 4; k++) {
      const y = 29 + k * 6.6;
      const p = kit.piece(V(x, y, z), "fin", 7);
      kit.add("chrome", unitBox, p, place(x, y, z, 0, 0, (x < 0 ? -1 : 1) * 0.09, 0.22, 6.9, 0.7), SILVER);
      kit.add("core", unitBox, p, place(x, y, z + 0.36, 0, 0, (x < 0 ? -1 : 1) * 0.09, 0.022, 6.7, 0.014), IND);
      ribs.push(p);
    }
  }

  // The flywheel where the windlass was, on the same axle line: it turns on its own.
  const flywheel = kit.piece(CRANK.clone(), "flywheel", 1.8);
  {
    // Built in a wheel frame (axis +z), turned so the axle lies along the windlass's.
    const qa = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), CX);
    const wm = (m: THREE.Matrix4) => new THREE.Matrix4().compose(CRANK, qa, V(1, 1, 1)).multiply(m);
    kit.add("glass", new THREE.CylinderGeometry(0.85, 0.85, 0.08, 48, 1, true), flywheel, wm(place(0, 0, 0, Math.PI / 2, 0, 0)), GLASS);
    kit.add("core", torus(0.86, 0.035, 6, 64), flywheel, wm(place(0, 0, 0)), GOLDL);
    for (let k = 0; k < 6; k++) kit.add("core", unitBox, flywheel, wm(place(0, 0, 0, 0, 0, (k / 6) * Math.PI, 1.6, 0.025, 0.025)), GOLDL);
    kit.add("chrome", unitCyl(16), flywheel, wm(place(0, 0, 0, Math.PI / 2, 0, 0, 0.3, 0.3, 0.3)), CHROME);
  }
  const fb = new THREE.Box3().setFromCenterAndSize(CRANK, V(2.2, 2.2, 2.2));
  parts.push({ id: "flywheel", box: fb });

  // The assembly is a construction sequence: structure, engine, connected
  // paths, then the open door and return loop. A travelling lock wave follows
  // each part's distance, so the rebuilt business feels deliberately built.
  const C = V(0.6, 38.4, 2.4);
  const from = kit.pieces.map((p) => {
    const d = p.pivot.distanceTo(C);
    const dir = p.pivot.clone().sub(C).normalize();
    // Out along the line from the middle, swung round, and spun.
    const out = dir.multiplyScalar(26 + rnd() * 40).add(V((rnd() - 0.5) * 20, (rnd() - 0.5) * 20, (rnd() - 0.5) * 20));
    // Every start is inside the hall: within the piers (x ±34), above the
    // floor outside the well, under the vaults.
    {
      const start = p.pivot.clone().add(out);
      const rad = Math.hypot(start.x, start.z);
      const maxR = 27;
      if (rad > maxR) {
        start.x *= maxR / rad;
        start.z *= maxR / rad;
      }
      if (Math.hypot(start.x, start.z) > 19.5 && start.y < 14) start.y = 14 + rnd() * 8;
      start.y = Math.min(start.y, 68);
      out.subVectors(start, p.pivot);
    }
    const bend = new THREE.Vector3().crossVectors(out, V(0, 1, 0)).normalize().multiplyScalar(7 + Math.min(18, d * 0.3));
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 4, (rnd() - 0.5) * 4, (rnd() - 0.5) * 4));
    if (p.tag === "ncol") {
      // A tall foundation column rises out of the well where the old machine
      // fell (it never comes through the roof, or slices the nave's floor).
      out.set(0, -44, 0);
      bend.set(0, 0, 0);
      q.identity();
    } else if (["nbeam", "fin", "stand"].includes(p.tag)) {
      // Load-bearing supports approach upright from above their own socket.
      out.set(0, 14 + rnd() * 8, 0);
      bend.set(0, 0, 0);
      q.identity();
    }
    const structural = ["ncol", "nbeam", "rib", "fin", "stand", "housing"].includes(p.tag);
    const opening = ["door", "portal", "portalvane", "ring", "loop"].includes(p.tag);
    // The structure builds inside the white cut; the rest on top of it.
    const base = structural ? 16.07 : p.tag === "rotor" ? 16.1 : opening ? 16.31 : 16.16;
    const at = base + Math.min(1, d / 60) * 0.25 + rnd() * 0.065;
    // Load-bearing members come in like a crane's load: longer, settling hard.
    const heavy = ["ncol", "nbeam", "fin", "stand"].includes(p.tag);
    const inDir = out.clone().negate().normalize();
    return { t: out, bend, q, at, fly: heavy ? 0.36 : 0.3, dir: inDir, heavy };
  });

  return { kit, rig: { rotor, counterRotor, vanes, rings, lanes, nodes, portal, wheel, moon, sun, flywheel, door, ribs, from, parts } as NewRig };
}
