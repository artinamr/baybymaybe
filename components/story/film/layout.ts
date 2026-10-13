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

/**
 * The owner's corner, on the floor outside the pit's railing, with a frame of
 * its own (owner.ts): local +z looks at the tower, +x is the owner's right
 * as they stand at the windlass facing away from it. The corner sits on the
 * line from the pit's centre through the tower's front-left column, so the
 * chain from the windlass runs straight to that column.
 */
const CORNER_A = Math.atan2(3.0, -11.6);
const CORNER_D = 23.6;
export const CZ = V(-Math.cos(CORNER_A), 0, -Math.sin(CORNER_A));
export const CX = V(CZ.z, 0, -CZ.x);
export const CORNER = V(Math.cos(CORNER_A) * CORNER_D, FLOOR_Y, Math.sin(CORNER_A) * CORNER_D);
/** The corner's turn about y (local → world). */
export const CORNER_YAW = Math.atan2(CZ.x, CZ.z);
/** A point of the corner (x right, y above the floor, z toward the tower) in the world. */
export function corner(x: number, y: number, z: number, out = new THREE.Vector3()) {
  return out.set(CORNER.x + CX.x * x + CZ.x * z, FLOOR_Y + y, CORNER.z + CX.z * x + CZ.z * z);
}
/** The windlass's axle: the crank turns about local x through here. */
export const CRANK = corner(0, 1.0, 0);
/** The desk (its centre on the floor). */
const deskAt = corner(-1.6, 0, 1.25);
export const DESK = { x: deskAt.x, z: deskAt.z };

/** Dish height at radius r from its centre (a shallow bowl). */
export const dishY = (r: number) => DISH.y + DISH.k * r * r;

/** Where the pit's lake is lit (a dim red sea of the lost). */
export const LAKE = { y: PIT_Y, r: 26 };

/**
 * The spiral of the funnel: angle turns, radius in, height down. Two turns
 * and a bit, so it leaves the spout swirling toward the front of the dish
 * (+z): it lands where the camera can see it, runs up the near side and rolls
 * back into its place, instead of vanishing under the funnel's back.
 */
function funnelPoints(): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const turns = 2.03;
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
  // Our lane (0) runs into the merge on the chute's own heading, so the
  // customer we follow goes from one onto the other without a kink.
  const chuteIn = chute.tangent(0, V(0, 0, 0));

  const lanes = lanesZ.map((z, i) => {
    const pts = [
      V(DOOR.x + 0.7, 50.45, z),
      V(-9.5, 49.55, z),
      V(-4.0, 48.15, z),
      V(1.0, 46.95, z),
      V(4.1, 46.52, z),
      V(GATE_X, GATE_Y, z),
      V(6.8, 46.3, z),
      i === 0 ? MERGE.clone().addScaledVector(chuteIn, -(MERGE.x - 8.55) / chuteIn.x) : V(8.55, 45.95, z * 0.45),
      V(MERGE.x, MERGE.y, 0),
    ];
    const t = new Track(pts);
    return { z, track: t, sGate: t.nearest(V(GATE_X, GATE_Y, z)) };
  });

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
  // gold spiral that carries customers back to the door. Three pieces, each
  // leaving exactly the way the last one arrives (one tangent, no kink):
  const loop = new Track(loopPath(channel, lanes[0].track));

  // From the invoice tray's front place onto the last track: the customer
  // rolls out of its place along this, and is on the rail without a corner.
  const finalIn = leadIn(traySlots[2][0], final);

  return { wide, lanesZ, lanes, chute, sFunnel, spout, dishSlots, traySlots, final, finalIn, TURB, nchute, channel, sNodes, loop };
}

/** A short lead from a resting place onto a track: it ends on the track's own tangent. */
function leadIn(from: THREE.Vector3, onto: Track) {
  const end = onto.at(0, V(0, 0, 0));
  const t = onto.tangent(0, V(0, 0, 0));
  const h = Math.min(0.6, from.distanceTo(end) * 0.36);
  const b2 = end.clone().addScaledVector(t, -h);
  // It leaves its place level.
  const b1 = from.clone().addScaledVector(b2.clone().sub(from).setY(0).normalize(), h);
  return new Track(new THREE.CubicBezierCurve3(from.clone(), b1, b2, end), 0.02);
}

/** The gold spiral round the tower's axis (x 0, z −1): angle, radius and height by t. */
class Spiral extends THREE.Curve<THREE.Vector3> {
  constructor(
    private a0: number,
    private a1: number,
    private flare: number
  ) {
    super();
    this.arcLengthDivisions = 1600;
  }
  getPoint(t: number, out = new THREE.Vector3()) {
    const a = this.a0 + (this.a1 - this.a0) * t;
    // It narrows as it climbs; over its last half-turn it swings wide again,
    // out past the door's side, to come round into the doorway.
    const f = THREE.MathUtils.clamp((t - 0.8) / 0.2, 0, 1);
    const r = THREE.MathUtils.lerp(18.2, 15.6, t) + this.flare * f * f * f * (f * (f * 6 - 15) + 10);
    const y = THREE.MathUtils.lerp(26.2, 51.6, t * t * (3 - 2 * t) * 0.35 + t * 0.65);
    return out.set(Math.cos(a) * r, y, Math.sin(a) * r - 1.0);
  }
}

/**
 * The hook into the doorway: a level arc (radius rho) from the spiral's last
 * heading round to the lane's, then straight in through the door's light.
 * Its height eases from the spiral's climb to the lane's fall (a crest).
 */
class Hook extends THREE.Curve<THREE.Vector3> {
  private c = new THREE.Vector2();
  private th0: number;
  private th1: number;
  private La: number;
  private Ls: number;
  constructor(
    p0: THREE.Vector3,
    t0: THREE.Vector3,
    private rho: number,
    private end: THREE.Vector3,
    t1: THREE.Vector3
  ) {
    super();
    this.th0 = Math.atan2(t0.z, t0.x);
    this.th1 = Math.atan2(t1.z, t1.x);
    while (this.th1 < this.th0) this.th1 += Math.PI * 2;
    // A left turn: the centre is to the left of the heading.
    this.c.set(p0.x - Math.sin(this.th0) * rho, p0.z + Math.cos(this.th0) * rho);
    this.La = (this.th1 - this.th0) * rho;
    const ax = this.c.x + Math.sin(this.th1) * rho;
    const az = this.c.y - Math.cos(this.th1) * rho;
    this.Ls = Math.max(0.01, Math.hypot(end.x - ax, end.z - az));
    const H = this.La + this.Ls;
    const g0 = t0.y / Math.hypot(t0.x, t0.z);
    const g1 = t1.y / Math.hypot(t1.x, t1.z);
    this.y = [p0.y, g0 * H, end.y, g1 * H];
    this.arcLengthDivisions = 400;
  }
  private y: number[];
  getPoint(t: number, out = new THREE.Vector3()) {
    const s = t * (this.La + this.Ls);
    if (s < this.La) {
      const th = this.th0 + s / this.rho;
      out.set(this.c.x + Math.sin(th) * this.rho, 0, this.c.y - Math.cos(th) * this.rho);
    } else {
      const k = (s - this.La) / this.Ls;
      const ax = this.c.x + Math.sin(this.th1) * this.rho;
      const az = this.c.y - Math.cos(this.th1) * this.rho;
      out.set(ax + (this.end.x - ax) * k, 0, az + (this.end.z - az) * k);
    }
    const [y0, m0, y1, m1] = this.y;
    const t2 = t * t;
    const t3 = t2 * t;
    out.y = (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * m1;
    return out;
  }
}

/**
 * THE LOOP. (1) Off the edge on the channel's own tangent, dipping a little,
 * onto the spiral's tangent (a cubic Bézier: no kink at the edge). (2) A
 * turn and a half up round the tower. (3) The hook: the spiral's last
 * half-turn swings out past the door's side, a level arc brings it round,
 * and it runs straight in through the door's light onto lane 0 heading the
 * lane's way (no U-turn in front of the door). The spiral's end angle and
 * flare are solved so the arc ends on the lane's line.
 */
function loopPath(channel: Track, lane: Track) {
  const aStart = Math.atan2(9.6, 15.2) + 0.35;
  const laneP = lane.at(0, V(0, 0, 0));
  const laneT = lane.tangent(0, V(0, 0, 0));
  const RHO = 2.4;
  // Where the straight run in begins: 2 m behind the lane's start, so the
  // customer crosses the door's light on the straight.
  const runIn = 2.0;
  const target = laneP.clone().addScaledVector(V(laneT.x, 0, laneT.z).normalize(), -runIn);
  // Solve the spiral's end (angle short of 3π, and the flare) so a left arc
  // of radius RHO from its end heading lands on the run-in's start.
  const tan = (s: Spiral, t: number) => s.getPoint(Math.min(1, t + 1e-4)).sub(s.getPoint(Math.max(0, t - 1e-4))).normalize();
  // Where a left arc from the spiral's end comes out, less where it should.
  const miss = (d: number, flare: number) => {
    const s = new Spiral(aStart, Math.PI * 3 - d, flare);
    const p = s.getPoint(1);
    const t0 = tan(s, 1);
    const th0 = Math.atan2(t0.z, t0.x);
    let th1 = Math.atan2(laneT.z, laneT.x);
    while (th1 < th0) th1 += Math.PI * 2;
    const cx = p.x - Math.sin(th0) * RHO;
    const cz = p.z + Math.cos(th0) * RHO;
    return [cx + Math.sin(th1) * RHO - target.x, cz - Math.cos(th1) * RHO - target.z];
  };
  // Newton on (end angle short of 3π, flare), from a close first guess.
  let d = 0.29;
  let flare = 3.0;
  for (let iter = 0; iter < 30; iter++) {
    const [ex, ez] = miss(d, flare);
    if (Math.abs(ex) < 1e-6 && Math.abs(ez) < 1e-6) break;
    const e = 1e-4;
    const [xd, zd] = miss(d + e, flare);
    const [xf, zf] = miss(d, flare + e);
    const j00 = (xd - ex) / e;
    const j01 = (xf - ex) / e;
    const j10 = (zd - ez) / e;
    const j11 = (zf - ez) / e;
    const det = j00 * j11 - j01 * j10;
    d -= (j11 * ex - j01 * ez) / det;
    flare -= (-j10 * ex + j00 * ez) / det;
  }
  const s = new Spiral(aStart, Math.PI * 3 - d, flare);
  const pEnd = s.getPoint(1);
  const tEnd = tan(s, 1);
  const s0 = s.getPoint(0);
  const ts0 = tan(s, 0);
  const tc = channel.tangent(channel.length, V(0, 0, 0));
  const hb = 3;
  const bez = new THREE.CubicBezierCurve3(EDGE.clone(), EDGE.clone().addScaledVector(tc, hb), s0.clone().addScaledVector(ts0, -hb), s0.clone());
  bez.arcLengthDivisions = 400;
  const path = new THREE.CurvePath<THREE.Vector3>();
  path.add(bez);
  path.add(s);
  path.add(new Hook(pEnd, tEnd, RHO, laneP, laneT));
  path.arcLengthDivisions = 4000;
  return path;
}
