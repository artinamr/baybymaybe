import * as THREE from "three";
import { DISH, GANTRY_Y, GANTRY_Z, PIPE_Z, PIT_Y, R, TRAYS, type Layout } from "./layout";
import { clamp01, ease, range, smooth } from "./ease";

/**
 * THE ONE WE FOLLOW. Where our customer is, and how brightly they glow, is a
 * pure function of the film's clock P (so the scroll can run it backwards
 * and forwards). Old machine: out of the door, a wait at the gate, the dish
 * through a whole night, carried tray to tray (nearly dropped once), stamped
 * gold, off the edge and down into the pit. New machine: a new customer,
 * straight through, answered at 3am, along the channel, round the loop and
 * back to the door.
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
  /** The front claw carrying it: which (0 A→B, 1 B→C), its x, its drop below the rail, fingers open. */
  claw: { k: number; x: number; drop: number; open: number }[];
  /** The stamp's height (0 up, 1 down). */
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
};

/** The fall: over the edge at 10.66, in the lake by FALL_END (FALL_T: its length in the fall's own time). */
export const FALL_END = 11.45;
export const FALL_T = 3.46;

const WARM = new THREE.Color(3.0, 1.55, 0.62);
const GOLD = new THREE.Color(3.8, 2.45, 0.8);
const RED = new THREE.Color(2.4, 0.3, 0.12);

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _t = new THREE.Vector3();

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
      { k: 0, x: TRAYS[0].x, drop: 1, open: 1 },
      { k: 1, x: TRAYS[1].x, drop: 1, open: 1 },
    ],
    stamp: 0,
    hours: 0,
    hatch: 0,
    vel: new THREE.Vector3(),
    dir: new THREE.Vector3(1, 0, 0),
    falling: false,
  };
}

/**
 * The heading the camera chases on the new machine's channel and loop (one
 * path, joined at the edge): a secant looking a few metres ahead, so it leans
 * into a bend before it gets there and never snaps where the two meet.
 */
function heading(L: Layout, s: number, out: THREE.Vector3) {
  const at = (d: number, o: THREE.Vector3) => (d <= L.channel.length ? L.channel.at(Math.max(0, d), o) : L.loop.at(d - L.channel.length, o));
  return out.subVectors(at(s + 6, _b), at(s - 1.5, _a)).normalize();
}

export function heroAt(P: number, L: Layout, h: HeroState, time: number) {
  h.visible = true;
  h.falling = false;
  h.speed = 0;
  h.vel.set(0, 0, 0);
  L.final.tangent(0, h.dir);
  h.gate = 0;
  h.stamp = 0;
  h.hatch = 0;
  h.claw[0].x = TRAYS[0].x;
  h.claw[0].drop = 1;
  h.claw[0].open = 1;
  h.claw[1].x = TRAYS[1].x;
  h.claw[1].drop = 1;
  h.claw[1].open = 1;
  h.hours = clamp01(range(P, 5.3, 6.72)) * 13.53;
  let gold = 0;
  let dim = 1;
  let red = 0;
  const lane = L.lanes[0];
  const sStop = lane.sGate - 0.14;

  if (P < 14) {
    h.machine = "old";
    if (P < 1.25) {
      // Not yet: still outside, beyond the door.
      h.visible = false;
      lane.track.at(0, h.pos);
      h.at = "door";
    } else if (P < 2.8) {
      // Out of the door and down the ramp, slowing into the queue.
      const k = range(P, 1.25, 2.8);
      const s = sStop * (1 - Math.pow(1 - k, 2.2));
      lane.track.at(s, h.pos);
      h.speed = 1 - k;
      h.at = k < 0.6 ? "ramp" : "gate";
    } else if (P < 3.98) {
      // Waiting at the gate. It fidgets.
      lane.track.at(sStop - 0.004 * (1 + Math.sin(time * 5.3)), h.pos);
      h.at = "gate";
      h.gate = range(P, 3.86, 3.98) * 0.6;
    } else if (P < 4.62) {
      // The gate opens at last; through it and down to the merge.
      const k = range(P, 3.98, 4.62);
      h.gate = 0.6 + 0.4 * range(P, 3.98, 4.08) - range(P, 4.3, 4.62);
      const s = sStop + (lane.track.length - sStop) * ease(k, 1.6);
      lane.track.at(s, h.pos);
      h.speed = 0.6;
      h.at = "gate";
    } else if (P < 5.18) {
      // The chute: the turn, the run back, round and down the funnel.
      const k = range(P, 4.62, 5.18);
      L.chute.at(L.chute.length * k, h.pos);
      h.speed = 0.85;
      h.at = k < 0.75 ? "chute" : "funnel";
    } else if (P < 5.36) {
      // Out of the spout, into the dish, out to its place.
      const k = range(P, 5.18, 5.36);
      const slot = L.dishSlots[0];
      if (k < 0.35) {
        const e = k / 0.35;
        h.pos.lerpVectors(L.spout, _a.set(DISH.x, DISH.y + R, DISH.z + 0.4), e * e);
      } else {
        h.pos.lerpVectors(_a.set(DISH.x, DISH.y + R, DISH.z + 0.4), slot, smooth((k - 0.35) / 0.65));
      }
      h.speed = 0.4;
      h.at = "dish";
    } else if (P < 6.78) {
      // A whole night in the dish. Its light falls to a seventh after the first hour.
      h.pos.copy(L.dishSlots[0]);
      h.at = "dish";
      dim = h.hours < 1 ? 1 : Math.max(1 / 7, 1 - ((h.hours - 1) / 3.2) * (6 / 7));
    } else if (P < 7.32) {
      // Someone gets to it, at last: the hatch, the pipe, the first tray.
      const k = range(P, 6.78, 7.32);
      h.hatch = range(P, 6.8, 6.9) * (1 - range(P, 7.1, 7.25));
      dim = 1 / 7 + (6 / 7) * 0.3 * k;
      if (k < 0.3) h.pos.lerpVectors(L.dishSlots[0], _a.set(DISH.x, DISH.y + R, PIPE_Z), smooth(k / 0.3));
      else if (k < 0.75) {
        const e = (k - 0.3) / 0.45;
        h.pos.set(DISH.x, DISH.y + R - (DISH.y - 29.7) * e * e, PIPE_Z);
      } else h.pos.lerpVectors(_a.set(DISH.x, 29.7, PIPE_Z), L.traySlots[0][0], smooth((k - 0.75) / 0.25));
      h.speed = 0.5;
      h.at = "admin";
    } else if (P < 9.72) {
      h.at = "admin";
      dim = 0.45 + 0.55 * range(P, 7.3, 9.4);
      // Tray to tray on the front gantry: A → B (nearly dropped), B → C, then the stamp.
      const A = L.traySlots[0][0];
      const B = L.traySlots[1][0];
      const C = L.traySlots[2][0];
      const railY = GANTRY_Y;
      const hold = (x: number, drop: number) => _b.set(x, railY - drop - 0.38, GANTRY_Z.front);
      const leg = (P0: number, from: THREE.Vector3, to: THREE.Vector3, ci: number) => {
        // 0..1: down, grab, up, across, down, release, up
        const c = h.claw[ci];
        const u = range(P, P0, P0 + 0.95);
        const fx = from.x;
        const tx = to.x;
        const dropAt = railY - from.y - 0.38;
        const dropTo = railY - to.y - 0.38;
        if (u <= 0) {
          c.x = fx;
          c.drop = 1;
          c.open = 1;
          return false;
        }
        if (u < 0.14) {
          c.x = fx;
          c.drop = 1 + (dropAt - 1) * smooth(u / 0.14);
          c.open = 1;
          h.pos.copy(from);
        } else if (u < 0.22) {
          c.x = fx;
          c.drop = dropAt;
          c.open = 1 - (u - 0.14) / 0.08;
          h.pos.copy(from);
        } else if (u < 0.34) {
          c.x = fx;
          c.drop = dropAt - (dropAt - 1) * smooth((u - 0.22) / 0.12);
          c.open = 0;
          h.pos.copy(hold(fx, c.drop));
        } else if (u < 0.72) {
          const k = (u - 0.34) / 0.38;
          c.x = fx + (tx - fx) * smooth(k);
          c.drop = 1 + (ci === 0 ? 0.06 * Math.sin(k * Math.PI) : 0);
          // Nearly dropped: the claw jolts, it slips a little and is caught.
          const jolt = ci === 0 ? Math.exp(-Math.pow((k - 0.5) / 0.06, 2)) : 0;
          c.open = 0.32 * jolt;
          h.pos.copy(hold(c.x, c.drop));
          h.pos.y -= 0.09 * jolt;
          h.speed = 0.3;
        } else if (u < 0.86) {
          c.x = tx;
          c.drop = 1 + (dropTo - 1) * smooth((u - 0.72) / 0.14);
          c.open = 0;
          h.pos.copy(hold(tx, c.drop));
        } else if (u < 0.92) {
          c.x = tx;
          c.drop = dropTo;
          c.open = (u - 0.86) / 0.06;
          h.pos.copy(to);
        } else {
          c.x = tx;
          c.drop = dropTo - (dropTo - 1) * smooth((u - 0.92) / 0.08);
          c.open = 1;
          h.pos.copy(to);
        }
        return u < 1;
      };
      if (P < 7.6) h.pos.copy(A);
      else if (P < 8.55) leg(7.6, A, B, 0);
      else if (P < 8.62) h.pos.copy(B);
      else if (P < 9.57) {
        leg(7.6, A, B, 0);
        leg(8.62, B, C, 1);
      } else {
        leg(8.62, B, C, 1);
        h.pos.copy(C);
      }
      if (P >= 8.55) {
        h.claw[0].x = B.x;
        h.claw[0].drop = 1;
        h.claw[0].open = 1;
        if (P < 8.62) h.pos.copy(B);
      }
      // The stamp comes down on it in the invoice tray: a sale.
      h.stamp = Math.max(0, Math.sin(Math.PI * range(P, 9.36, 9.5)));
      gold = range(P, 9.42, 9.5);
    } else if (P < 10.66) {
      // Out of the invoice tray and along the last track, faster and faster.
      const k = range(P, 9.72, 10.66);
      L.final.at(L.final.length * Math.pow(k, 1.7), h.pos);
      L.final.tangent(L.final.length * Math.pow(k, 1.7), h.dir);
      gold = 1;
      h.speed = 0.4 + 0.6 * k;
      h.at = k < 0.5 ? "final" : "edge";
    } else if (P < FALL_END) {
      // Over the edge: it falls, all the way down (and lands as k reaches 1).
      const k = range(P, 10.66, FALL_END);
      L.final.tangent(L.final.length, _t);
      h.dir.copy(_t);
      L.final.at(L.final.length, _a);
      const T = k * FALL_T;
      const v = 1.15;
      h.pos.set(_a.x + _t.x * v * T, _a.y + _t.y * v * T + 0.4 * T - 4.6 * T * T, _a.z + _t.z * v * T);
      h.vel.set(_t.x * v, _t.y * v + 0.4 - 9.2 * T, _t.z * v);
      if (h.pos.y < PIT_Y + 0.12) h.pos.y = PIT_Y + 0.12;
      h.falling = h.pos.y > PIT_Y + 0.2;
      gold = 1 - k * 0.6;
      red = Math.min(1, k * 1.4);
      dim = h.falling ? 1 : 0.4;
      h.speed = h.falling ? 1 : 0;
      h.at = "fall";
    } else {
      // At the bottom, a dim red point with all the others.
      L.final.tangent(L.final.length, _t);
      h.dir.copy(_t);
      L.final.at(L.final.length, _a);
      const T = FALL_T;
      h.pos.set(_a.x + _t.x * 1.15 * T, PIT_Y + 0.12, _a.z + _t.z * 1.15 * T);
      red = 1;
      dim = 0.4 - 0.25 * range(P, FALL_END, 13);
      h.at = "pit";
    }
  } else if (P < 17.02) {
    h.machine = "none";
    h.visible = false;
    h.at = "turn";
  } else {
    // THE NEW MACHINE: a new customer, straight through.
    h.machine = "new";
    const T = L.TURB;
    if (P < 17.9) {
      const k = range(P, 17.02, 17.9);
      lane.track.at(lane.track.length * ease(k, 1.25), h.pos);
      h.speed = 0.8;
      h.at = k < 0.35 ? "door" : "ring";
    } else if (P < 18.95) {
      const k = range(P, 17.9, 18.95);
      L.nchute.at(L.nchute.length * k, h.pos);
      h.speed = 0.9;
      h.at = "chute";
    } else if (P < 19.32) {
      // Caught by the turbine at 3am, swept round, sent on.
      const k = range(P, 18.95, 19.32);
      const a = THREE.MathUtils.lerp(Math.PI * 0.32, Math.PI * 1.22, smooth(k));
      h.pos.set(T.x + Math.cos(a) * T.r * 0.92, T.y + Math.sin(a) * T.r * 0.92, T.z);
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
      // The loop: up and round the tower, back to the door.
      // It comes onto the loop at the channel's pace and gathers speed round
      // the spiral (the heading the camera chases is looked a few metres ahead,
      // so it leans into the bend instead of snapping round it).
      const k = range(P, 21.82, 23.7);
      const a = 0.144;
      const sl = L.loop.length * (a * k + (1 - a) * k * k * (3 - 2 * k));
      L.loop.at(sl, h.pos);
      heading(L, L.channel.length + sl, h.dir);
      h.speed = 1;
      gold = 1;
      h.at = "loop";
    } else {
      // Back at the door, and in again.
      const k = range(P, 23.7, 25.8);
      lane.track.at(lane.track.length * 0.32 * smooth(k), h.pos);
      gold = 1;
      h.speed = 0.5;
      h.at = "back";
    }
  }

  h.col.copy(WARM).lerp(GOLD, clamp01(gold)).lerp(RED, clamp01(red)).multiplyScalar(dim);
}
