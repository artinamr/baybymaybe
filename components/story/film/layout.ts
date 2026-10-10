import * as THREE from "three";
import { Helix, Track } from "./track";

/**
 * THE MACHINE'S PLAN (docs/STORY.md §4). One tower in a nave, run top to
 * bottom, one level per leak, standing in a round pit in the cathedral's
 * floor. Every coordinate the geometry, the customers, the ride and the
 * camera share lives here. World units: a marble is 0.22 across; the tower
 * stands about 30 tall above the floor, the pit falls 40 below it.
 *
 *   y 50  the door (how they find you) and the ramp, five lanes
 *   y 46  the gate (your website)
 *   y 44  the chute: the lanes merge and turn back
 *   y 41  the funnel → y 35.4 the dish (your inbox), the wheel of hours behind
 *   y 33  the gantries → y 29.4 the trays (your admin)
 *   y 25  the last track, ending over the pit (your follow-up)
 *   y 10  the floor of the nave; the owner's desk by the pit's edge
 *   y −30 the bottom of the pit, where the lost ones end up
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export const R = 0.11;
/** Rails: half the gap between the two, how far below a marble's centre, their radius. */
export const RAIL_HALF = 0.072;
export const RAIL_DROP = 0.078;
export const RAIL_R = 0.017;

export const FLOOR_Y = 10;
export const PIT_R = 20.5;
export const PIT_Y = -30;

/** The lanes on the ramp (z): ours first, nearest the camera. */
export const LANES_WIDE = [1.2, 0.45, -0.3, -1.05, -1.8];
export const LANES_NARROW = [1.2, 0.2, -0.8];

export const DOOR = { x: -14.3, y: 52.8, z: -0.3, w: 4.9, h: 6.6 };
export const GATE_X = 5.6;
export const GATE_Y = 46.45;
export const MERGE = V(10.4, 45.55, 0);

/** The chute's U-turn round a vertical axis. */
export const UTURN = { cx: 10.4, cz: -2.4, r: 2.4, y0: 45.55, y1: 44.0 };

export const FUNNEL = { x: -5.0, z: -2.4, yTop: 40.9, yBot: 38.45, rTop: 2.8, rBot: 0.34 };
export const DISH = { x: -5.0, y: 35.4, z: -2.4, r: 4.0, k: 0.035 };
/** The dish's hatch and the pipe down to the first tray (just in front of the dish's centre). */
export const PIPE_Z = DISH.z + 0.45;
/** The wheel of hours: a great ring behind the dish, sun and moon on it. */
export const WHEEL = { x: -5.0, y: 39.5, z: -11.5, r: 9.6 };

export const TRAY_Y = 29.4;
export const TRAYS = [
  { x: -5.0, z: -1.4, name: "SPREADSHEET" },
  { x: 0.5, z: -1.4, name: "QUOTE" },
  { x: 6.0, z: -1.4, name: "INVOICE" },
];
export const TRAY_W = 3.4;
export const TRAY_D = 2.7;
export const GANTRY_Y = 33.1;
/** Our claws run on the front rail, the crowd's on the back one. */
export const GANTRY_Z = { front: -0.42, back: -2.35 };

/** Where the last track ends, out over the pit (a fall from here stays inside it). */
export const EDGE = V(13.4, 25.25, 6.2);

/** The owner's corner, on the floor by the pit's edge. */
export const DESK = { x: -21.5, z: 9.2 };
export const CRANK = V(-19.6, FLOOR_Y + 1.25, 7.3);

/** Dish height at radius r from its centre (a shallow bowl). */
export const dishY = (r: number) => DISH.y + DISH.k * r * r;

/** Where the pit's lake is lit (a dim red sea of the lost). */
export const LAKE = { y: PIT_Y, r: 26 };

/** The spiral of the funnel: angle turns, radius in, height down. */
function funnelPoints(): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const turns = 1.6;
  const a0 = -0.35;
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const r = THREE.MathUtils.lerp(FUNNEL.rTop - 0.22, FUNNEL.rBot + 0.02, Math.pow(t, 0.85));
    const a = a0 + t * turns * Math.PI * 2;
    const ys = FUNNEL.yBot + ((r - FUNNEL.rBot) / (FUNNEL.rTop - FUNNEL.rBot)) * (FUNNEL.yTop - FUNNEL.yBot);
    pts.push(V(FUNNEL.x + Math.cos(a) * r, ys + R * 1.45, FUNNEL.z + Math.sin(a) * r));
  }
  return pts;
}

export type Layout = ReturnType<typeof buildLayout>;

/** Every path, built once. `wide`: five lanes (a laptop) or three (a phone). */
export function buildLayout(wide: boolean) {
  const lanesZ = wide ? LANES_WIDE : LANES_NARROW;

  const lanes = lanesZ.map((z) => {
    const pts = [
      V(DOOR.x + 0.7, 50.45, z),
      V(-9.5, 49.55, z),
      V(-4.0, 48.15, z),
      V(1.0, 46.95, z),
      V(4.1, 46.52, z),
      V(GATE_X, GATE_Y, z),
      V(6.8, 46.3, z),
      V(8.55, 45.95, z * 0.45),
      V(MERGE.x, MERGE.y, 0),
    ];
    const t = new Track(pts);
    return { z, track: t, sGate: t.nearest(V(GATE_X, GATE_Y, z)) };
  });

  // The chute: the U-turn, the run back, the funnel's spiral down to its spout.
  const helix = new Helix(UTURN.cx, UTURN.cz, UTURN.r, Math.PI / 2, -Math.PI / 2, UTURN.y0, UTURN.y1);
  const chutePts: THREE.Vector3[] = [];
  for (let i = 0; i <= 12; i++) chutePts.push(helix.getPoint(i / 12));
  const fun = funnelPoints();
  chutePts.push(V(7.0, 43.25, -4.8), V(2.5, 42.2, -4.75), V(-0.6, 41.55, -4.55));
  chutePts.push(...fun);
  const chute = new Track(chutePts);
  const sFunnel = chute.nearest(fun[0]);
  const spout = fun[fun.length - 1].clone();

  // The dish's places, filled from the middle out (a sunflower spiral). Place 0
  // (front and centre) is kept for the customer we follow.
  const dishSlots: THREE.Vector3[] = [];
  for (let k = 0; k < 190; k++) {
    const r = 0.27 * Math.sqrt(k + 0.6);
    if (r > DISH.r - 0.3) break;
    const a = k * 2.39996 + 1.3;
    const x = DISH.x + Math.cos(a) * r;
    const z = DISH.z + Math.sin(a) * r;
    dishSlots.push(V(x, dishY(r) + R, z));
  }
  dishSlots.sort((a, b) => a.distanceTo(V(DISH.x, a.y, DISH.z + 1.2)) - b.distanceTo(V(DISH.x, b.y, DISH.z + 1.2)));

  // The trays' places: a grid; the front row is ours.
  const traySlots = TRAYS.map((t) => {
    const s: THREE.Vector3[] = [];
    for (let iz = 0; iz < 7; iz++)
      for (let ix = 0; ix < 9; ix++) s.push(V(t.x - 1.2 + ix * 0.3, TRAY_Y + R + 0.02, t.z - 0.95 + iz * 0.3));
    // Ours sits at the front middle.
    s.sort((a, b) => Math.abs(a.x - t.x) + Math.abs(a.z - (t.z + 0.85)) * 1.3 - (Math.abs(b.x - t.x) + Math.abs(b.z - (t.z + 0.85)) * 1.3));
    return s;
  });

  // The last track: out of the invoice tray, over the pit, and nothing after it.
  const out = TRAYS[2];
  const final = new Track([
    V(out.x + TRAY_W / 2 - 0.25, TRAY_Y + R + 0.02, out.z + 0.2),
    V(out.x + TRAY_W / 2 + 0.6, TRAY_Y + 0.02, out.z + 0.25),
    V(10.4, 28.55, 0.2),
    V(11.9, 27.3, 2.2),
    V(12.9, 26.15, 4.3),
    EDGE.clone(),
  ]);

  // THE NEW MACHINE's own paths. The channel: out of the turbine, through the
  // three nodes (where the trays were), and on toward the edge, which now
  // turns up into the loop.
  const TURB = { x: FUNNEL.x, y: 38.9, z: FUNNEL.z + 0.2, r: 2.35 };
  const nchute = new Track([...chutePts.slice(0, 13), V(7.0, 43.25, -4.8), V(2.5, 42.2, -4.75), V(-0.9, 41.7, -4.3), V(TURB.x + 1.6, TURB.y + TURB.r + 0.25, TURB.z)]);
  const channel = new Track([
    V(TURB.x - 2.1, TURB.y - 1.35, TURB.z + 0.2),
    V(TURB.x - 3.0, TURB.y - 3.6, TURB.z + 0.6),
    V(TRAYS[0].x - 1.6, TRAY_Y + 1.0, TRAYS[0].z + 0.7),
    V(TRAYS[0].x, TRAY_Y + 0.9, TRAYS[0].z + 0.85),
    V(TRAYS[1].x, TRAY_Y + 0.75, TRAYS[1].z + 0.85),
    V(TRAYS[2].x, TRAY_Y + 0.6, TRAYS[2].z + 0.85),
    V(out.x + TRAY_W / 2 + 0.6, TRAY_Y + 0.1, out.z + 0.5),
    V(10.4, 28.55, 0.2),
    V(11.9, 27.3, 2.2),
    V(12.9, 26.15, 4.3),
    EDGE.clone(),
  ]);
  const sNodes = TRAYS.map((t) => channel.nearest(V(t.x, TRAY_Y + 0.75, t.z + 0.85)));

  // The loop: past the edge the track curves up and round the whole tower, a
  // gold spiral that carries customers back to the door.
  // A turn and a half round the tower's axis (x 0, z −1), from the edge's
  // side to the door's, rising all the way. It leaves the edge the way the
  // channel arrives and bends round onto the spiral over a few metres (a
  // cubic Bézier: no hairpin for the customers, or the camera chasing them).
  const aStart = Math.atan2(9.6, 15.2) + 0.35;
  const sweep = Math.PI * 3 - aStart;
  const spiral = (t: number) => {
    const a = aStart + sweep * t;
    const r = THREE.MathUtils.lerp(18.2, 15.6, t);
    const y = THREE.MathUtils.lerp(26.2, 51.6, t * t * (3 - 2 * t) * 0.35 + t * 0.65);
    return V(Math.cos(a) * r, y, Math.sin(a) * r - 1.0);
  };
  const h0 = spiral(0);
  const inTan = V(EDGE.x - 12.9, 0, EDGE.z - 4.3).normalize();
  const outTan = V(-Math.sin(aStart), 0, Math.cos(aStart));
  const b1 = EDGE.clone().addScaledVector(inTan, 3);
  const b2 = h0.clone().addScaledVector(outTan, -3);
  const bez = (t: number) => {
    const u = 1 - t;
    const p = EDGE.clone().multiplyScalar(u * u * u).addScaledVector(b1, 3 * u * u * t).addScaledVector(b2, 3 * u * t * t).addScaledVector(h0, t * t * t);
    // It dips a little under the edge, then climbs.
    p.y = THREE.MathUtils.lerp(EDGE.y, h0.y, t * t) - 0.35 * Math.sin(Math.PI * t) * (1 - t);
    return p;
  };
  const loopPts: THREE.Vector3[] = [EDGE.clone(), bez(0.25), bez(0.5), bez(0.75)];
  for (let i = 0; i <= 40; i++) loopPts.push(spiral(i / 40));
  loopPts.push(V(DOOR.x - 0.6, 51.2, DOOR.z + 0.3), V(DOOR.x + 0.7, 50.45, lanesZ[0]));
  const loop = new Track(loopPts);

  return { wide, lanesZ, lanes, chute, sFunnel, spout, dishSlots, traySlots, final, TURB, nchute, channel, sNodes, loop };
}
