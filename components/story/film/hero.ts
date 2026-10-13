import * as THREE from "three";
import { DISH, EDGE, GANTRY_Y, GANTRY_Z, PIPE_Z, PIT_Y, R, TRAYS, dishY, type Layout } from "./layout";
import { clamp01, range, smooth, smoother } from "./ease";
import { Track } from "./track";

/**
 * THE ONE WE FOLLOW. Where our customer is, and how brightly they glow, is a
 * pure function of the film's clock P (so the scroll can run it backwards
 * and forwards). Old machine: out of the door, a wait at the gate, the dish
 * through a whole night, carried tray to tray (nearly dropped once), stamped
 * gold, off the edge and down into the pit. The turn: the same light wakes
 * in the pit, rises into the heart of the rebuild (the white flash is it),
 * and goes back round to the door. New machine: the same customer, straight
 * through, answered at 3am, along the channel, round the loop and back.
 *
 * It moves like a marble with mass: every handover carries its velocity on
 * (each run starts at the speed the last one ended, along the same tangent),
 * it gathers speed going down, coasts, and where it really lands (the dish,
 * the first tray, the pit) it bounces in parabolic hops that die away, and
 * settles. Speeds below are in metres per P (a screen of scroll).
 */

export type HeroState = {
  pos: THREE.Vector3;
  /** Linear HDR colour of its light. */
  col: THREE.Color;
  visible: boolean;
  /** 0..1 its speed (the rolling sound). */
  speed: number;
  /** Which machine it is in. */
  machine: "old" | "new" | "none";
  /** The station, for the camera's framing and the drop button. */
  at: string;
  /** Lane 0's portcullis (0 shut, 1 open). */
  gate: number;
  /**
   * The front claw carrying it: which (0 A→B, 1 B→C), its x, its drop below
   * the rail, fingers open (below 0: squeezing), and the swing of its load
   * (radians about the trolley, + toward +x: the head sits drop·sin(swing)
   * along x from the trolley).
   */
  claw: { k: number; x: number; drop: number; open: number; swing: number }[];
  /** The stamp's height (0 up, 1 its face on the customer's top; a hair over 1 presses it). */
  stamp: number;
  /** The clock in the inbox: hours since 7:40pm. */
  hours: number;
  /** The hatch under the dish. */
  hatch: number;
  /** Its velocity while falling (for the streak and the camera). */
  vel: THREE.Vector3;
  /** The way it is heading on the last track and over the edge (the camera's chase). */
  dir: THREE.Vector3;
  falling: boolean;
  /** Brief contact compression, with the volume preserved by the renderer. */
  squash: number;
};

/** The fall: over the edge at FALL_START, on the floor of the pit at FALL_HIT, settled by FALL_END. */
export const FALL_START = 10.66;
export const FALL_HIT = 11.38;
export const FALL_END = 11.45;
/**
 * Where it comes to rest: 1.15 · FALL_T metres along the last track's end
 * tangent from the edge, on the pit's floor (camera.ts `landing`; heroPlan's
 * `landing` is the same point).
 */
export const FALL_T = 3.46;
const LAND_D = 1.15 * FALL_T;
/** The turn: the lost light wakes, rises to the heart of the rebuild, hovers, then goes back to the door. */
export const SPARK = { wake: 15.5, rise: 15.62, core: 16.1, launch: 16.68, door: 17.0 };

const WARM = new THREE.Color(3.0, 1.55, 0.62);
const GOLD = new THREE.Color(3.8, 2.45, 0.8);
const RED = new THREE.Color(2.4, 0.3, 0.12);

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const _a = V();
const _b = V();
const _t = V();
const _v = V();
const _p0 = V();
const _p1 = V();
const _d0 = V();
const _d1 = V();

/* ---- small kinematics ------------------------------------------------------------ */

/**
 * Cubic Hermite: from p0 (velocity v0, metres per P) to p1 (velocity v1) over
 * d (P), at u 0..1. `vel`, if given, gets the velocity there (metres per P).
 */
function herm(p0: THREE.Vector3, v0: THREE.Vector3, p1: THREE.Vector3, v1: THREE.Vector3, d: number, u: number, out: THREE.Vector3, vel?: THREE.Vector3) {
  const u2 = u * u;
  const u3 = u2 * u;
  const a = 2 * u3 - 3 * u2 + 1;
  const b = (u3 - 2 * u2 + u) * d;
  const c = -2 * u3 + 3 * u2;
  const e = (u3 - u2) * d;
  if (vel) {
    const da = (6 * u2 - 6 * u) / d;
    const db = 3 * u2 - 4 * u + 1;
    const de = 3 * u2 - 2 * u;
    vel.set(
      p0.x * da + v0.x * db - p1.x * da + v1.x * de,
      p0.y * da + v0.y * db - p1.y * da + v1.y * de,
      p0.z * da + v0.z * db - p1.z * da + v1.z * de
    );
  }
  return out.set(p0.x * a + v0.x * b + p1.x * c + v1.x * e, p0.y * a + v0.y * b + p1.y * c + v1.y * e, p0.z * a + v0.z * b + p1.z * c + v1.z * e);
}

/** A scalar cubic Hermite (end slopes per unit u). */
const herm1 = (y0: number, m0: number, y1: number, m1: number, u: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * m1;
};
/** herm1's slope (per unit u). */
const herm1d = (y0: number, m0: number, y1: number, m1: number, u: number) => {
  const u2 = u * u;
  return (6 * u2 - 6 * u) * (y0 - y1) + (3 * u2 - 4 * u + 1) * m0 + (3 * u2 - 2 * u) * m1;
};

/**
 * A ball's hops after it lands: parabolic arcs, each leaving at e times the
 * last one's speed (so e² of its height and e of its time), under the same
 * gravity throughout. t: time since the first contact. Also leaves, in HOP,
 * the time since the latest contact and how hard that contact was (1 first).
 */
const HOP = { since: 0, hard: 1 };
function hop(t: number, T0: number, h0: number, e: number) {
  let T = T0;
  let h = h0;
  let hard = 1;
  HOP.since = t;
  HOP.hard = 1;
  if (t < 0) return 0;
  for (let n = 0; n < 12; n++) {
    if (t < T) {
      HOP.since = t;
      HOP.hard = hard;
      const x = t / T;
      return 4 * h * x * (1 - x);
    }
    t -= T;
    T *= e;
    h *= e * e;
    hard *= e;
    if (T < 1e-6) break;
  }
  HOP.since = t;
  HOP.hard = hard;
  return 0;
}
/** The squash at each contact of `hop` (call right after it): compressed on landing, round again quickly. */
const hopSquash = (amount: number, tau: number) => amount * HOP.hard * Math.exp(-HOP.since / tau);

/** ∫₀ᵘ smooth: the distance covered while easing from 0 to 1 speed (u in 0..1). */
const smoothInt = (u: number) => u * u * u - (u * u * u * u) / 2;

type Key = { P: number; p: THREE.Vector3; v: THREE.Vector3 };
/** A path through keys (position and velocity at each), C1 everywhere. */
function keyed(P: number, keys: Key[], out: THREE.Vector3, vel: THREE.Vector3) {
  let i = 0;
  while (i < keys.length - 2 && P >= keys[i + 1].P) i++;
  const A = keys[i];
  const B = keys[i + 1];
  const d = B.P - A.P;
  return herm(A.p, A.v, B.p, B.v, d, clamp01((P - A.P) / d), out, vel);
}

/* ---- the turbine ------------------------------------------------------------------ */

/** One continuous catch and release, joining the real chute and channel endpoints. */
export function turbinePoint(k: number, L: Layout, out: THREE.Vector3) {
  const T = L.TURB;
  const radius = T.r * 0.92;
  const sweep = Math.PI * 0.9;
  const circle = (u: number, p: THREE.Vector3, d: THREE.Vector3) => {
    const a = Math.PI * 0.32 + sweep * u;
    p.set(T.x + Math.cos(a) * radius, T.y + Math.sin(a) * radius, T.z);
    d.set(-Math.sin(a), Math.cos(a), 0).multiplyScalar(radius * sweep);
  };
  let u: number;
  const span = 0.22;
  if (k < span) {
    L.nchute.at(L.nchute.length, _p0);
    L.nchute.tangent(L.nchute.length, _d0).multiplyScalar(radius * sweep * span);
    circle(span, _p1, _d1);
    _d1.multiplyScalar(span);
    u = k / span;
  } else if (k > 1 - span) {
    circle(1 - span, _p0, _d0);
    _d0.multiplyScalar(span);
    L.channel.at(0, _p1);
    L.channel.tangent(0, _d1).multiplyScalar(radius * sweep * span);
    u = (k - 1 + span) / span;
  } else {
    circle(k, out, _d0);
    return out;
  }
  const u2 = u * u;
  const u3 = u2 * u;
  return out.copy(_p0).multiplyScalar(2 * u3 - 3 * u2 + 1)
    .addScaledVector(_d0, u3 - 2 * u2 + u)
    .addScaledVector(_p1, -2 * u3 + 3 * u2)
    .addScaledVector(_d1, u3 - u2);
}

/* ---- the plan: every speed and handover, worked out once per layout -------------- */

/** The claws' load swings under this gravity (metres per P²): a lean of about 0.1 rad at full pull. */
const CLAW_G = 2070;
/** A leg of the claw, in P. */
const LEG = 0.95;
/** The pipe's gravity (metres per P²) and the speed it leaves the hatch at. */
const PIPE_G = 600;
const PIPE_V0 = 22;
/** The drop through the hatch into the pipe, in P (PIPE_G over its 0.42 m from rest gives PIPE_V0). */
const DROP_IN = 0.037;

export type HeroPlan = ReturnType<typeof makePlan>;
const plans = new WeakMap<Layout, HeroPlan>();
/** The ride's numbers for a layout: handover speeds, the fall, and when our customer crosses the new ring and nodes. */
export function heroPlan(L: Layout): HeroPlan {
  let p = plans.get(L);
  if (!p) {
    p = makePlan(L);
    plans.set(L, p);
  }
  return p;
}

function makePlan(L: Layout) {
  const lane = L.lanes[0];
  const sStop = lane.sGate - 0.14;
  // Through the gate (s ∝ k^1.5 over 0.64 P), the chute picks up its pace.
  const vGate = ((lane.track.length - sStop) * 1.5) / 0.64;
  const chuteA = (vGate * 0.68) / L.chute.length;
  const vSpout = (L.chute.length * (2 - chuteA)) / 0.68;
  const spoutVel = L.chute.tangent(L.chute.length, V()).multiplyScalar(vSpout);

  // THE DISH: out of the spout on a ballistic arc (it keeps its swirl), a
  // landing that hops, a run up the bowl's side to a stop, and back down
  // across the bowl into its place.
  const DF = 0.03;
  const land = V(L.spout.x + spoutVel.x * DF, 0, L.spout.z + spoutVel.z * DF);
  const rl = Math.hypot(land.x - DISH.x, land.z - DISH.z);
  if (rl > DISH.r - 1.0) {
    const k = (DISH.r - 1.0) / rl;
    land.set(DISH.x + (land.x - DISH.x) * k, 0, DISH.z + (land.z - DISH.z) * k);
  }
  land.y = dishY(Math.hypot(land.x - DISH.x, land.z - DISH.z)) + R;
  const dishG = (2 * (land.y - L.spout.y - spoutVel.y * DF)) / (DF * DF);
  const landVel = V((land.x - L.spout.x) / DF, spoutVel.y + dishG * DF, (land.z - L.spout.z) / DF);
  const slot = L.dishSlots[0];
  // Rolling on after the landing (the impact takes some of its speed), it
  // climbs the side, slowing evenly to a stop, a little round from its line.
  const roll = V(landVel.x, 0, landVel.z).multiplyScalar(0.72);
  const rollV = roll.length();
  const climb = Math.min(0.8, Math.max(0.1, DISH.r - 0.55 - Math.hypot(land.x - DISH.x, land.z - DISH.z)));
  const d1 = (2 * climb) / rollV;
  const top = land.clone().addScaledVector(roll, climb / rollV);
  const side = V(-roll.z, 0, roll.x).normalize();
  if (side.dot(V(slot.x - top.x, 0, slot.z - top.z)) < 0) side.negate();
  const dishHopV = 0.18 * Math.abs(landVel.y);
  const dish = {
    DF,
    land,
    landVel,
    keys: [
      { P: 5.3 + DF, p: land.clone(), v: roll },
      { P: 5.3 + DF + d1, p: top, v: side.multiplyScalar(0.12 * rollV) },
      { P: 5.46, p: V(slot.x, 0, slot.z), v: V() },
    ] as Key[],
    g: -dishG,
    T0: (2 * dishHopV) / -dishG,
    h0: (dishHopV * dishHopV) / (2 * -dishG),
  };

  // THE HATCH AND THE PIPE: it rolls to the opened hatch, drops in, falls
  // down the pipe, lands in the first tray and hops forward to its place.
  const hole = V(DISH.x, DISH.y + R, PIPE_Z);
  const inDir = V(hole.x - slot.x, 0, hole.z - slot.z);
  const rollD = inDir.length() - 0.17;
  inDir.normalize();
  const rim = V(slot.x + inDir.x * rollD, 0, slot.z + inDir.z * rollD);
  rim.y = dishY(Math.hypot(rim.x - DISH.x, rim.z - DISH.z)) + R;
  const rimVel = inDir.clone().multiplyScalar((2 * rollD) / 0.09);
  const inPipe = V(hole.x, DISH.y + R - 0.42, hole.z);
  const A = L.traySlots[0][0];
  const pipeFall = (-PIPE_V0 + Math.sqrt(PIPE_V0 * PIPE_V0 + 2 * PIPE_G * (inPipe.y - A.y))) / PIPE_G;
  const pipeHit = 6.93 + DROP_IN + pipeFall;
  const trayHopV = 0.16 * (PIPE_V0 + PIPE_G * pipeFall);
  const pipe = {
    rollD,
    inDir,
    rim,
    rimVel,
    inPipe,
    inVel: V(0, -PIPE_V0, 0),
    hit: pipeHit,
    T0: (2 * trayHopV) / PIPE_G,
    h0: (trayHopV * trayHopV) / (2 * PIPE_G),
  };

  // THE LAST TRACK: out of the invoice tray along the lead-in, then the rail.
  const runLen = L.finalIn.length + L.final.length;
  const vExit = (1.7 * runLen) / 0.94;

  // THE FALL, in its own time T (seconds of a real fall, g 9.2). It leaves the
  // edge at the rail's speed and direction; the air takes its forward speed
  // (drag c, solved so it comes to rest exactly at LAND_D along the edge's
  // heading, where the camera looks); it lands, hops, rolls a little and stops.
  // Film time runs into slow motion as it leaves the edge (the light hangs
  // over the drop), then faster than real time down the pit.
  const t3 = L.final.tangent(L.final.length, V());
  const R0 = FALL_T / (FALL_END - FALL_START);
  const v0 = vExit / R0;
  const g = 9.2;
  const yFloor = PIT_Y + 0.12;
  const Br = 0.3;
  const slide = 0.5;
  const D = (c: number, T: number) => (v0 / c) * (1 - Math.exp(-c * T));
  const hitAt = (c: number) => {
    let lo = 0;
    let hi = 8;
    for (let i = 0; i < 60; i++) {
      const m = (lo + hi) / 2;
      if (EDGE.y + t3.y * D(c, m) - 0.5 * g * m * m > yFloor) lo = m;
      else hi = m;
    }
    return hi;
  };
  let cLo = 0.05;
  let cHi = 8;
  for (let i = 0; i < 60; i++) {
    const c = (cLo + cHi) / 2;
    const Ti = hitAt(c);
    const reach = D(c, Ti) + (slide * v0 * Math.exp(-c * Ti) * Br) / 3;
    if (reach > LAND_D) cLo = c;
    else cHi = c;
  }
  const drag = (cLo + cHi) / 2;
  const Ti = hitAt(drag);
  const vHitH = v0 * Math.exp(-drag * Ti);
  const rollOn = (slide * vHitH * Br) / 3;
  const vHitY = Math.abs(t3.y * vHitH - g * Ti);
  const pitHopV = 0.05 * vHitY;
  // The film-time warp: rate r(x) = R0 at the edge, easing down to HANG·R0
  // over WA, held WB, then easing up over WC to RL (solved so it lands at FALL_HIT).
  const HANG = 0.35;
  const WA = 0.09;
  const WB = 0.05;
  const WC = 0.12;
  const dipInt = (x: number) =>
    x < WA ? WA * smoothInt(x / WA) : x < WA + WB ? WA / 2 + (x - WA) : WA / 2 + WB + WC * (Math.min(1, (x - WA - WB) / WC) - smoothInt(Math.min(1, (x - WA - WB) / WC)));
  const riseInt = (x: number) => (x < WA + WB ? 0 : WC * smoothInt(Math.min(1, (x - WA - WB) / WC)) + Math.max(0, x - WA - WB - WC));
  const xHit = FALL_HIT - FALL_START;
  const RL = R0 + (Ti - R0 * xHit + R0 * (1 - HANG) * dipInt(xHit)) / riseInt(xHit);
  const fall = {
    t3,
    R0,
    RL,
    v0,
    g,
    yFloor,
    drag,
    Ti,
    Br,
    rollOn,
    vHitH,
    /** Fall-time at x = P − FALL_START. */
    time: (x: number) => R0 * x - R0 * (1 - HANG) * dipInt(x) + (RL - R0) * riseInt(x),
    /** Seconds of fall per P at x. */
    rate: (x: number) => {
      const dip = x < WA ? smooth(x / WA) : x < WA + WB ? 1 : 1 - smooth((x - WA - WB) / WC);
      const rise = x < WA + WB ? 0 : smooth((x - WA - WB) / WC);
      return R0 * (1 - (1 - HANG) * dip) + (RL - R0) * rise;
    },
    D: (T: number) => D(drag, T),
    T0: (2 * pitHopV) / g,
    h0: (pitHopV * pitHopV) / (2 * g),
  };
  const landing = V(EDGE.x + t3.x * LAND_D, yFloor, EDGE.z + t3.z * LAND_D);

  // THE TURN: the lost light, from where it lies to the heart of the rebuild,
  // a hover while the new machine assembles round it, then up out of the
  // tower, over the door and round, in through the door's light onto lane 0.
  const laneT = lane.track.tangent(0, V());
  const vArrive = 20;
  const doorIn = lane.track.at(0, V()).addScaledVector(laneT, -1.3);
  const core0 = V(0, 37.5, -0.9);
  const core1 = V(0, 38.9, -0.9);
  const spark: Key[] = [
    { P: SPARK.rise, p: landing.clone(), v: V() },
    { P: SPARK.core, p: core0, v: V(0, 5, 0) },
    { P: SPARK.launch, p: core1, v: V(0, 3, -1.5) },
  ];
  // The way back to the door: up between the lanes and the new chute behind
  // them (z −3), along over the far side of the lanes, past the door's north
  // post, a level half-turn round behind the door (its light hides most of
  // it), and in through the light on the lane's own heading. One curve, one
  // speed curve along it: away from the hover, quick, then slowing to the
  // lane's pace.
  const launch = new Track([
    core1.clone(),
    V(0, 39.8, -1.15),
    V(-0.3, 44.0, -2.6),
    V(-0.8, 48.5, -3.1),
    V(-2.6, 51.4, -3.3),
    V(-6.0, 52.4, -3.4),
    V(-11.0, 52.4, -3.4),
    V(-14.0, 52.1, -3.4),
    V(-16.2, 51.8, -2.9),
    V(-17.15, 51.4, -1.1),
    V(-16.3, 50.95, 0.6),
    doorIn.clone().addScaledVector(laneT, -0.6),
    doorIn.clone(),
  ]);

  // THE NEW MACHINE: lane 0 and the new chute as one run (from behind the
  // door's light, easing up to a cruise), the turbine catching it at that
  // pace and handing it to the channel at the channel's, the loop taking it
  // on at the channel's pace and bringing it back to the door at it, then a
  // coast into the lane.
  const NEW_TURB = 18.95;
  const runS = 1.3 + lane.track.length + L.nchute.length;
  const tau = 0.45;
  const runD = NEW_TURB - SPARK.door;
  const vCruise = (runS - (vArrive * tau) / 2) / (runD - tau / 2);
  const runAt = (x: number) => vArrive * x + (vCruise - vArrive) * (tau * smoothInt(Math.min(1, x / tau)) + Math.max(0, x - tau)) - 1.3;
  let rLo = 0;
  let rHi = runD;
  for (let i = 0; i < 50; i++) {
    const m = (rLo + rHi) / 2;
    if (runAt(m) < lane.sGate) rLo = m;
    else rHi = m;
  }
  const vChannel = L.channel.length / 2.5;
  // The turbine's path by arc length (its pace per unit k is not quite even
  // where it catches and lets go), so the customer's own speed can be eased
  // from the chute's to the channel's.
  const TN = 480;
  const turbS = new Float32Array(TN + 1);
  for (let i = 1, prev = turbinePoint(0, L, V()), cur = V(); i <= TN; i++) {
    turbinePoint(i / TN, L, cur);
    turbS[i] = turbS[i - 1] + cur.distanceTo(prev);
    prev.copy(cur);
  }
  const turbLen = turbS[TN];
  /** The turbine's k at arc length s along it. */
  const turbK = (s: number) => {
    if (s <= 0) return 0;
    if (s >= turbLen) return 1;
    let lo = 0;
    let hi = TN;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (turbS[m] <= s) lo = m;
      else hi = m;
    }
    return (lo + (s - turbS[lo]) / Math.max(1e-9, turbS[hi] - turbS[lo])) / TN;
  };
  const loopA = (vChannel * 1.88) / L.loop.length;
  const backC = 3.3;
  const backS = (vChannel * 2.1 * (1 - Math.exp(-backC))) / backC;

  return {
    sStop,
    chuteA,
    spoutVel,
    dish,
    pipe,
    runLen,
    fall,
    landing,
    spark,
    launch,
    vArrive,
    vCruise,
    tau,
    runAt,
    turbLen,
    turbK,
    vChannel,
    loopA,
    backC,
    backS,
    /** When our customer passes through the new ring (where the gate stood). */
    ringP: SPARK.door + rHi,
    /** When it passes each of the channel's three nodes. */
    nodeP: L.sNodes.map((s) => 19.32 + s / vChannel),
  };
}

/* ---- the gate, the hatch, the claws, the stamp ------------------------------------ */

/** Lane 0's portcullis: driven up (eased in and out), let go, it drops under its weight and seats. */
function gateAt(P: number) {
  if (P < 4.3) return smoother(range(P, 3.86, 4.06));
  if (P < 4.46) {
    const k = (P - 4.3) / 0.16;
    return 1 - k * k;
  }
  return hop(P - 4.46, 0.05, 0.03, 0.35);
}

/** The hatch under the dish: released, it swings down under its weight, hits its stop and bounces; later it is pulled shut and seats. */
function hatchAt(P: number) {
  if (P < 6.8) return 0;
  if (P < 6.86) {
    const k = (P - 6.8) / 0.06;
    return k * k;
  }
  if (P < 7.12) return 1 - hop(P - 6.86, 0.03, 0.07, 0.4);
  if (P < 7.21) return 1 - smoother((P - 7.12) / 0.09);
  return hop(P - 7.21, 0.018, 0.035, 0.35);
}

/**
 * The invoice stamp: a breath up, then down hard (accelerating) onto the
 * customer; it presses in a few millimetres, rebounds a centimetre and
 * settles on it; held; then lifted slowly. CONTACT is when the face meets it.
 */
const STAMP_HIT = 9.614;
function stampAt(P: number) {
  if (P < 9.575) return 0;
  if (P < 9.592) return -0.04 * smooth((P - 9.575) / 0.017);
  if (P < STAMP_HIT) {
    const k = (P - 9.592) / (STAMP_HIT - 9.592);
    return -0.04 + 1.04 * k * k;
  }
  if (P < 9.652) {
    const b = P - STAMP_HIT;
    return 1 + 0.005 * Math.exp(-b / 0.005) - hop(b, 0.012, 0.012, 0.3);
  }
  return 1 - smoother((P - 9.652) / 0.083);
}

/**
 * A claw's leg, u 0..1 over LEG: down, grab, up (to UP1) while it starts
 * across (from TR0), across (to TR1) while it starts down (from DN0), set
 * down (SET), let go, up. The overlaps round the corners off.
 */
const UP1 = 0.34;
const TR0 = 0.26;
const TR1 = 0.72;
const DN0 = 0.64;
const SET = 0.86;
const legX = (u: number, fx: number, tx: number) => (u < TR0 ? fx : u < TR1 ? fx + (tx - fx) * smooth((u - TR0) / (TR1 - TR0)) : tx);
const legAcc = (u: number, fx: number, tx: number) => {
  if (u < TR0 || u > TR1) return 0;
  const k = (u - TR0) / (TR1 - TR0);
  return ((tx - fx) * (6 - 12 * k)) / Math.pow((TR1 - TR0) * LEG, 2);
};
const legDrop = (u: number, dropAt: number, dropTo: number, sag: boolean) => {
  // (The first claw's cable sags a little under the load while it crosses.)
  const sagBy = sag && u > TR0 && u < TR1 ? 0.06 * Math.sin(((u - TR0) / (TR1 - TR0)) * Math.PI) : 0;
  if (u < 0.14) return 1 + (dropAt - 1) * smooth(u / 0.14);
  if (u < 0.22) return dropAt;
  if (u < UP1) return dropAt - (dropAt - 1) * smooth((u - 0.22) / (UP1 - 0.22)) + sagBy;
  if (u < DN0) return 1 + sagBy;
  if (u < SET) return 1 + (dropTo - 1) * smooth((u - DN0) / (SET - DN0)) + sagBy;
  if (u < 0.92) return dropTo;
  return dropTo - (dropTo - 1) * smooth((u - 0.92) / 0.08);
};
/**
 * The load's swing: a damped pendulum (length drop + 0.38 to the customer's
 * centre) driven by the trolley's acceleration, integrated from the start of
 * the traverse so it stays a pure function of P. It leans back as the trolley
 * pulls away, forward as it brakes, swings on after it stops, and is damped
 * out as the customer is set down (on the tray floor nothing swings).
 */
function legSwing(u: number, fx: number, tx: number, dropAt: number, dropTo: number, sag: boolean) {
  if (u <= TR0 || u >= SET) return 0;
  const step = 0.0025 / LEG;
  let th = 0;
  let w = 0;
  for (let s = TR0; s < u; s += step) {
    const h = Math.min(step, u - s) * LEG;
    const l = legDrop(s, dropAt, dropTo, sag) + 0.38;
    const w2 = CLAW_G / l;
    w += (-w2 * Math.sin(th) - (legAcc(s, fx, tx) / l) * Math.cos(th) - 2 * 0.1 * Math.sqrt(w2) * w) * h;
    th += w * h;
  }
  return th * (1 - smooth(range(u, SET - 0.08, SET)));
}

/* ---- where it is ------------------------------------------------------------------ */

/**
 * The heading the camera chases on the new machine's channel and loop (one
 * path, joined at the edge): a secant looking a few metres ahead, so it leans
 * into a bend before it gets there and never snaps where the two meet.
 */
function heading(L: Layout, s: number, out: THREE.Vector3) {
  const at = (d: number, o: THREE.Vector3) => (d <= L.channel.length ? L.channel.at(Math.max(0, d), o) : L.loop.at(d - L.channel.length, o));
  return out.subVectors(at(s + 6, _b), at(s - 1.5, _a)).normalize();
}

/** A point s along a track, continued straight back along its first tangent for s < 0. */
function along(track: Layout["final"], s: number, out: THREE.Vector3) {
  if (s >= 0) return track.at(s, out);
  track.at(0, out);
  return out.addScaledVector(track.tangent(0, _t), s);
}

export function heroInit(): HeroState {
  return {
    pos: new THREE.Vector3(),
    col: new THREE.Color(),
    visible: false,
    speed: 0,
    machine: "old",
    at: "door",
    gate: 0,
    claw: [
      { k: 0, x: TRAYS[0].x, drop: 1, open: 1, swing: 0 },
      { k: 1, x: TRAYS[1].x, drop: 1, open: 1, swing: 0 },
    ],
    stamp: 0,
    hours: 0,
    hatch: 0,
    vel: new THREE.Vector3(),
    dir: new THREE.Vector3(1, 0, 0),
    falling: false,
    squash: 0,
  };
}

export function heroAt(P: number, L: Layout, h: HeroState, time: number) {
  const plan = heroPlan(L);
  h.visible = true;
  h.falling = false;
  h.squash = 0;
  h.speed = 0;
  h.vel.set(0, 0, 0);
  L.final.tangent(0, h.dir);
  h.gate = gateAt(P);
  h.stamp = stampAt(P);
  h.hatch = hatchAt(P);
  claws(P, L, h, false);
  h.hours = clamp01(range(P, 5.3, 6.72)) * 13.53;
  let gold = 0;
  let dim = 1;
  let red = 0;
  const lane = L.lanes[0];
  const sStop = plan.sStop;

  if (P < SPARK.wake) {
    h.machine = P < 14 ? "old" : "none";
    if (P < 2.8) {
      // Out of the door's light and down the ramp, slowing into the queue:
      // one roll. It starts behind the glowing doorway (which hides it), so
      // it comes into the hall through the light, already rolling.
      const k = range(P, 1.0, 2.8);
      along(lane.track, -1.3 + (sStop + 1.3) * (1 - Math.pow(1 - k, 2.0)), h.pos);
      h.visible = P >= 1.0;
      h.speed = 1 - k;
      h.at = k < 0.04 ? "door" : k < 0.6 ? "ramp" : "gate";
    } else if (P < 3.98) {
      // Waiting at the gate. It fidgets (not on arrival, not as it leaves).
      const fidget = smooth(range(P, 2.8, 2.95)) * (1 - smooth(range(P, 3.84, 3.98)));
      lane.track.at(sStop - 0.004 * (1 + Math.sin(time * 5.3)) * fidget, h.pos);
      h.at = "gate";
    } else if (P < 4.62) {
      // The gate opens at last; through it and down to the merge, gathering speed.
      const k = range(P, 3.98, 4.62);
      lane.track.at(sStop + (lane.track.length - sStop) * Math.pow(k, 1.5), h.pos);
      h.speed = 0.6;
      h.at = "gate";
    } else if (P < 5.3) {
      // The chute: the turn, the run back, round and down the funnel. It
      // leaves the merge at the ramp's pace and gathers speed going down.
      const k = range(P, 4.62, 5.3);
      L.chute.at(L.chute.length * (plan.chuteA * k + (1 - plan.chuteA) * k * k), h.pos);
      h.speed = 0.85;
      h.at = k < 0.75 ? "chute" : "funnel";
    } else if (P < 5.46) {
      dishArrival(P, L, h);
      h.speed = 0.4;
      h.at = "dish";
    } else if (P < 6.84) {
      // A whole night in the dish. The dimming is expressive, not a probability model.
      h.pos.copy(L.dishSlots[0]);
      h.at = "dish";
      dim = 1 - 0.8 * smooth(range(h.hours, 1, 5));
    } else if (P < 7.6) {
      // Someone gets to it, at last: the hatch, the pipe, the first tray.
      pipeDown(P, L, h);
      dim = 0.2 + 0.25 * range(P, 6.78, 7.32);
      h.speed = P < 7.32 ? 0.5 : 0;
      h.at = "admin";
    } else if (P < 9.72) {
      h.at = "admin";
      dim = 0.45 + 0.55 * range(P, 7.3, 9.4);
      claws(P, L, h, true);
      // The stamp comes down on it in the invoice tray: a sale.
      if (P >= STAMP_HIT) {
        const b = P - STAMP_HIT;
        if (P < 9.652) h.squash = Math.max(h.squash, 0.018 * Math.exp(-b / 0.005));
        gold = smooth(range(P, STAMP_HIT, STAMP_HIT + 0.026));
        dim *= 1 + 1.4 * Math.exp(-Math.pow((P - STAMP_HIT - 0.002) / 0.012, 2));
      }
    } else if (P < FALL_START) {
      // Out of its place in the invoice tray and along the last track, faster
      // and faster: one run (the lead-in, then the rail), from rest.
      const k = range(P, 9.72, FALL_START);
      const s = -L.finalIn.length + plan.runLen * Math.pow(k, 1.7);
      if (s < 0) {
        L.finalIn.at(L.finalIn.length + s, h.pos);
        L.finalIn.tangent(L.finalIn.length + s, h.dir);
      } else {
        L.final.at(s, h.pos);
        L.final.tangent(s, h.dir);
      }
      gold = 1;
      h.speed = 0.4 + 0.6 * k;
      h.at = k < 0.5 ? "final" : "edge";
    } else {
      // Over the edge, down into the pit, and at rest there with all the others.
      const f = plan.fall;
      const x = P - FALL_START;
      const T = f.time(x);
      const k = range(P, FALL_START, FALL_END);
      h.dir.copy(f.t3);
      if (T < f.Ti) {
        const D = f.D(T);
        h.pos.set(EDGE.x + f.t3.x * D, EDGE.y + f.t3.y * D - 0.5 * f.g * T * T, EDGE.z + f.t3.z * D);
        const sp = f.v0 * Math.exp(-f.drag * T);
        // The streak shows its real speed, shortened in the slow motion.
        h.vel.set(f.t3.x * sp, f.t3.y * sp - f.g * T, f.t3.z * sp).multiplyScalar(f.rate(x) / f.R0);
        h.falling = true;
        h.speed = 1;
        dim = 1;
      } else {
        // Down: a few hops that die away, a short roll on, and stillness.
        const b = T - f.Ti;
        const r = Math.min(1, b / f.Br);
        const D = f.D(f.Ti) + f.rollOn * (1 - (1 - r) * (1 - r) * (1 - r));
        h.pos.set(EDGE.x + f.t3.x * D, f.yFloor + hop(b, f.T0, f.h0, 0.38), EDGE.z + f.t3.z * D);
        h.squash = hopSquash(0.018, 0.04);
        // It flares as it joins the lake, then dims to the others' glow.
        dim = 0.4 - 0.25 * range(P, FALL_END, 13) + 0.6 * Math.exp(-b / 0.12) + 0.9 * Math.exp(-b / 0.03);
      }
      gold = 1 - k * 0.6;
      red = Math.min(1, k * 1.4);
      h.at = T < f.Ti ? "fall" : "pit";
    }
  } else if (P < SPARK.door) {
    // THE TURN: the light we lost wakes in the pit, rises into the heart of
    // the new machine (the white flash is it, igniting), hovers there while
    // the glass assembles round it, then goes up out of the tower, over the
    // door, and round to come in through its light.
    h.machine = "none";
    h.at = "spark";
    if (P < SPARK.launch) {
      keyed(Math.max(P, SPARK.rise), plan.spark, h.pos, _v);
      if (P < SPARK.rise) h.pos.copy(plan.landing);
    } else {
      const D = SPARK.door - SPARK.launch;
      const u = (P - SPARK.launch) / D;
      const Ls = plan.launch.length;
      const s = herm1(0, 3 * D, Ls, plan.vArrive * D, u);
      plan.launch.at(s, h.pos);
      plan.launch.tangent(s, _v).multiplyScalar(herm1d(0, 3 * D, Ls, plan.vArrive * D, u) / D);
    }
    // It breathes while it hovers.
    const bob = smooth(range(P, SPARK.core - 0.06, SPARK.core + 0.1)) * (1 - smooth(range(P, SPARK.launch, SPARK.launch + 0.12)));
    if (bob > 0) {
      h.pos.x += bob * 0.05 * Math.sin(time * 1.3);
      h.pos.y += bob * 0.09 * Math.sin(time * 1.9 + 1.0);
      h.pos.z += bob * 0.05 * Math.cos(time * 1.1);
    }
    const sp = _v.length();
    if (sp > 1e-3) h.dir.copy(_v).divideScalar(sp);
    if (sp > 40) {
      h.falling = true;
      h.vel.copy(_v).multiplyScalar(1 / 6);
    }
    const wake = smooth(range(P, SPARK.wake, SPARK.rise + 0.04));
    red = 1 - smooth(range(P, SPARK.rise + 0.08, SPARK.core));
    dim = 0.15 + 0.85 * wake;
    // Brightest as it reaches the heart: the flash comes from it.
    dim *= 1 + 2.5 * Math.exp(-Math.pow((P - 16.12) / 0.045, 2));
    if (P > SPARK.core) dim *= 1 + 0.06 * Math.sin(time * 3.1) * bob;
  } else {
    // THE NEW MACHINE: the same customer, straight through.
    h.machine = "new";
    if (P < 18.95) {
      // Out of the new door's light, easing up to a cruise down the lane,
      // through the ring and on down the new chute: one run.
      const s = plan.runAt(P - SPARK.door);
      if (s < lane.track.length) {
        along(lane.track, s, h.pos);
        lane.track.tangent(Math.max(0, s), h.dir);
      } else {
        L.nchute.at(s - lane.track.length, h.pos);
        L.nchute.tangent(s - lane.track.length, h.dir);
      }
      h.speed = s < lane.track.length ? 0.8 : 0.9;
      h.at = s < 0.6 ? "door" : s < lane.track.length ? "ring" : "chute";
    } else if (P < 19.32) {
      // Caught by the turbine at 3am, swept round, sent on: it takes it at the
      // chute's pace and hands it on at the channel's.
      const u = range(P, 18.95, 19.32);
      turbinePoint(plan.turbK(herm1(0, plan.vCruise * 0.37, plan.turbLen, plan.vChannel * 0.37, u)), L, h.pos);
      h.speed = 1;
      h.at = "turbine";
    } else if (P < 21.82) {
      const k = range(P, 19.32, 21.82);
      const sc = L.channel.length * k;
      L.channel.at(sc, h.pos);
      heading(L, sc, h.dir);
      h.speed = 0.9;
      h.at = k < 0.28 ? "turbine" : "channel";
      gold = range(P, 20.9, 21.4);
    } else if (P < 23.7) {
      // The loop: up and round the tower, back to the door. It comes onto the
      // loop at the channel's pace, gathers speed round the spiral and is back
      // to that pace at the door (the heading the camera chases is looked a few
      // metres ahead, so it leans into the bend instead of snapping round it).
      const k = range(P, 21.82, 23.7);
      const a = plan.loopA;
      const sl = L.loop.length * (a * k + (1 - a) * k * k * (3 - 2 * k));
      L.loop.at(sl, h.pos);
      heading(L, L.channel.length + sl, h.dir);
      h.speed = 1;
      gold = 1;
      h.at = "loop";
    } else {
      // Back at the door, and in again: it coasts down the lane at the pace
      // the loop brought it, slowing.
      const k = range(P, 23.7, 25.8);
      lane.track.at((plan.backS * (1 - Math.exp(-plan.backC * k))) / (1 - Math.exp(-plan.backC)), h.pos);
      gold = 1;
      h.speed = 0.5 * (1 - k);
      h.at = "back";
    }
  }

  h.col.copy(WARM).lerp(GOLD, clamp01(gold)).lerp(RED, clamp01(red)).multiplyScalar(dim);
}

/** Out of the spout on its arc, a landing that hops, then once round the bowl and into its place. */
function dishArrival(P: number, L: Layout, h: HeroState) {
  const d = heroPlan(L).dish;
  const x = P - 5.3;
  if (x < d.DF) {
    // In the air: straight across (nothing pushes it sideways), falling.
    h.pos.set(L.spout.x + d.landVel.x * x, 0, L.spout.z + d.landVel.z * x);
    const vy0 = d.landVel.y + d.g * d.DF;
    h.pos.y = L.spout.y + vy0 * x - 0.5 * d.g * x * x;
    return;
  }
  keyed(P, d.keys, h.pos, _v);
  h.pos.y = dishY(Math.hypot(h.pos.x - DISH.x, h.pos.z - DISH.z)) + R + hop(x - d.DF, d.T0, d.h0, 0.45);
  h.squash = hopSquash(0.018, 0.006);
}

/** Rolls to the opened hatch, drops in, falls down the pipe, lands in the first tray and hops forward to its place. */
function pipeDown(P: number, L: Layout, h: HeroState) {
  const pl = heroPlan(L).pipe;
  const slot = L.dishSlots[0];
  const A = L.traySlots[0][0];
  if (P < 6.84) {
    h.pos.copy(slot);
  } else if (P < 6.93) {
    const u = (P - 6.84) / 0.09;
    const s = pl.rollD * u * u;
    h.pos.set(slot.x + pl.inDir.x * s, 0, slot.z + pl.inDir.z * s);
    h.pos.y = dishY(Math.hypot(h.pos.x - DISH.x, h.pos.z - DISH.z)) + R;
  } else if (P < 6.93 + DROP_IN) {
    herm(pl.rim, pl.rimVel, pl.inPipe, pl.inVel, DROP_IN, (P - 6.93) / DROP_IN, h.pos);
  } else if (P < pl.hit) {
    const t = P - 6.93 - DROP_IN;
    h.pos.set(pl.inPipe.x, pl.inPipe.y - PIPE_V0 * t - 0.5 * PIPE_G * t * t, pl.inPipe.z);
  } else {
    const b = P - pl.hit;
    const u = Math.min(1, b / (7.32 - pl.hit));
    const f = 1 - (1 - u) * (1 - u) * (1 - u);
    h.pos.set(pl.inPipe.x + (A.x - pl.inPipe.x) * f, A.y + hop(b, pl.T0, pl.h0, 0.42), pl.inPipe.z + (A.z - pl.inPipe.z) * f);
    h.squash = hopSquash(0.016, 0.01);
  }
}

/** The two legs: claw 0 carries it A → B (nearly dropping it), claw 1 B → C. */
const LEG0 = 7.6;
const LEG1 = 8.64;
/**
 * Both front claws, for any P. They share one rail, so claw 1 (whose place is
 * over B) slides aside as claw 0 brings the customer in, comes back for it as
 * claw 0 leaves for home, carries it on to C, then goes home itself. With
 * `place`, the customer's position in the admin is set too (on a tray, or
 * hanging from the claw that has it).
 */
function claws(P: number, L: Layout, h: HeroState, place: boolean) {
  const A = L.traySlots[0][0];
  const B = L.traySlots[1][0];
  const C = L.traySlots[2][0];
  const [c0, c1] = h.claw;
  leg(P, LEG0, A, B, h, 0, place && P < LEG1);
  c0.x += (A.x - c0.x) * smooth(range(P, LEG0 + LEG - 0.02, LEG0 + LEG + 0.45));
  leg(P, LEG1, B, C, h, 1, place && P >= LEG1);
  if (P < LEG1) {
    const aside = B.x + 1.1;
    c1.x = B.x + (aside - B.x) * (smooth(range(P, 7.85, 8.12)) - smooth(range(P, 8.52, LEG1)));
  } else c1.x += (B.x - c1.x) * smooth(range(P, LEG1 + LEG + 0.01, LEG1 + LEG + 0.5));
}

/**
 * One claw's leg (0..1 over LEG from P0): down, grab (the fingers close and
 * squeeze), up while it starts across, across (the load swinging under it),
 * down while it arrives, let go, up. With `place`, puts the customer where
 * this leg has it: on the tray it is picked from, hanging, or set down.
 */
function leg(P: number, P0: number, from: THREE.Vector3, to: THREE.Vector3, h: HeroState, ci: number, place: boolean) {
  const c = h.claw[ci];
  const u = range(P, P0, P0 + LEG);
  const fx = from.x;
  const tx = to.x;
  const railY = GANTRY_Y;
  const dropAt = railY - from.y - 0.38;
  const dropTo = railY - to.y - 0.38;
  const sag = ci === 0;
  c.x = legX(u, fx, tx);
  c.drop = legDrop(u, dropAt, dropTo, sag);
  c.swing = legSwing(u, fx, tx, dropAt, dropTo, sag);
  // Fingers: shut (eased) and a little squeeze as they bite; open to let go.
  if (u < 0.14) c.open = 1;
  else if (u < 0.24) c.open = 1 - smoother(range(u, 0.14, 0.2)) - 0.05 * Math.sin(Math.PI * range(u, 0.19, 0.24));
  else if (u < SET) c.open = 0;
  else if (u < 0.92) c.open = smoother(range(u, SET, 0.91));
  else c.open = 1;
  // Nearly dropped: the claw jolts, it slips a little and is caught.
  const k = (u - TR0) / (TR1 - TR0);
  const jolt = sag && u > TR0 && u < TR1 ? Math.exp(-Math.pow((k - 0.5) / 0.06, 2)) : 0;
  if (jolt > 0) c.open = 0.32 * jolt;
  if (!place) return;
  if (u < 0.22) {
    h.pos.copy(from);
    return;
  }
  if (u >= SET) {
    h.pos.copy(to);
    return;
  }
  // Held: under the head, swinging with it.
  const arm = c.drop + 0.38;
  h.pos.set(c.x + arm * Math.sin(c.swing), railY - arm * Math.cos(c.swing), GANTRY_Z.front);
  h.pos.z = from.z + (GANTRY_Z.front - from.z) * smooth((u - 0.22) / (UP1 - 0.22));
  if (u > DN0) h.pos.z += (to.z - GANTRY_Z.front) * smooth((u - DN0) / (SET - DN0));
  if (jolt > 0) {
    h.pos.y -= 0.09 * jolt;
    h.pos.z += Math.sin(k * Math.PI * 2) * 0.025 * Math.sin(k * Math.PI);
  }
  h.speed = u > TR0 && u < TR1 ? 0.3 : 0;
}
