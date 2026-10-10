import * as THREE from "three";
import { DISH, EDGE, GANTRY_Y, GANTRY_Z, PIPE_Z, PIT_Y, R, TRAYS, TRAY_W, dishY, type Layout } from "./layout";
import type { OldRig } from "./old";

/**
 * THE CROWD: every customer but the one we follow, simulated in real time
 * (so the machine never stops, and the longer you watch, the more it loses).
 * Each leak is a mechanism, not a decoration:
 *
 *   the gate      exactly 53 of every 100 give up waiting and leave (Google:
 *                 53% of mobile visits are likely to be abandoned past 3 s)
 *   the inbox     they wait in the dish; after the first hour their light
 *                 falls to a seventh (HBR: nearly seven times as likely to
 *                 qualify within the hour); the ones who wait too long roll
 *                 over the rim
 *   the admin     claws carry them tray to tray; one in five slips
 *   the follow-up every one who reaches the edge goes over it
 *
 * In the new machine nobody leaks: through the ring, caught by the turbine,
 * along the channel, round the loop and back to the door, bringing others.
 */

export const enum M {
  FREE = 0,
  LANE,
  CHUTE,
  DROP,
  DISH,
  RIM,
  VALVE,
  TRAY,
  CARRIED,
  FINAL,
  FALL,
  N_LANE,
  N_CHUTE,
  N_TURB,
  N_CHANNEL,
  N_LOOP,
}

export type Leak = "website" | "inbox" | "admin" | "followup";

export type SimEvent =
  | { type: "lost"; leak: Leak; pos: THREE.Vector3; user: boolean }
  | { type: "kept"; pos: THREE.Vector3; user: boolean }
  | { type: "gate"; lane: number }
  | { type: "grab"; claw: number }
  | { type: "slip"; claw: number; pos: THREE.Vector3 }
  | { type: "stamp"; pos: THREE.Vector3 }
  | { type: "node"; k: number; pos: THREE.Vector3 }
  | { type: "ring"; lane: number }
  | { type: "catch"; pos: THREE.Vector3 }
  | { type: "lake"; pos: THREE.Vector3 };

const WARM = new THREE.Color(1.45, 0.74, 0.3);
const GOLD = new THREE.Color(1.9, 1.25, 0.42);
const RED = new THREE.Color(1.5, 0.2, 0.08);
const USER = new THREE.Color(2.6, 2.2, 1.8);

const SPACING = 0.27;
const HOUR = 1.25; // seconds of crowd time per "hour" in the inbox
const GIVE_UP = 10.5;
const LEAVE_RATE = 53;

export type Tune = {
  spawn: number;
  gatePeriod: number;
  gateOpen: number;
  valve: number;
  clawCycle: number;
  slip: number;
  nSpawn: number;
};

export class Sim {
  readonly n: number;
  mode: Uint8Array;
  lane: Int16Array;
  s: Float32Array;
  v: Float32Array;
  t: Float32Array;
  wait: Float32Array;
  pos: Float32Array;
  vel: Float32Array;
  from: Float32Array;
  slot: Int16Array;
  tray: Int8Array;
  leaver: Uint8Array;
  glow: Float32Array;
  gold: Float32Array;
  user: Uint8Array;
  laps: Uint16Array;
  col: Float32Array;

  /** Per lane (old) the queue in order; the chute's; each tray's; the final track's. */
  private laneQ: number[][];
  private chuteQ: number[] = [];
  private finalQ: number[] = [];
  private nLaneQ: number[][];
  private nChuteQ: number[] = [];
  private channelQ: number[] = [];
  private loopQ: number[] = [];
  private trayQ: number[][] = [[], [], []];
  private dishUsed: Uint8Array;
  private traySlotUsed: Uint8Array[];
  private spawnN = 0;
  private spawnT: Float32Array;
  private gateT: Float32Array;
  private valveT = 0;
  private clawT: Float32Array;
  private clawHold: Int32Array;
  private clawSlip: Float32Array;
  private trayCT = 0;
  private rnd: () => number;

  /** Which machine is running: "old", "none" (the turn), "new". */
  machine: "old" | "none" | "new" = "old";
  /** Gate heights (0 shut .. 1 open) per lane, for the rig. */
  gateH: Float32Array;
  /** Crowd claws (back gantry): x, drop below the rail, fingers open 0..1. */
  claw: { x: number; drop: number; open: number }[] = [
    { x: TRAYS[0].x, drop: 1, open: 1 },
    { x: TRAYS[1].x, drop: 1, open: 1 },
  ];
  hatch = 0;
  /** Lost and kept, by leak (the counters read these). */
  lost: Record<Leak, number> = { website: 0, inbox: 0, admin: 0, followup: 0 };
  kept = 0;
  yoursIn = 0;
  yoursLost = 0;
  yoursKept = 0;
  /** The lake of the lost: positions where they came to rest (ring buffer). */
  lake: Float32Array;
  lakeN = 0;
  lakeHead = 0;
  readonly lakeMax: number;
  events: SimEvent[] = [];

  constructor(
    private L: Layout,
    n: number,
    private tune: Tune,
    seed = 12345
  ) {
    this.n = n;
    this.mode = new Uint8Array(n);
    this.lane = new Int16Array(n);
    this.s = new Float32Array(n);
    this.v = new Float32Array(n);
    this.t = new Float32Array(n);
    this.wait = new Float32Array(n);
    this.pos = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.from = new Float32Array(n * 3);
    this.slot = new Int16Array(n);
    this.tray = new Int8Array(n);
    this.leaver = new Uint8Array(n);
    this.glow = new Float32Array(n);
    this.gold = new Float32Array(n);
    this.user = new Uint8Array(n);
    this.laps = new Uint16Array(n);
    this.col = new Float32Array(n * 3);
    this.laneQ = L.lanes.map(() => []);
    this.nLaneQ = L.lanes.map(() => []);
    this.dishUsed = new Uint8Array(L.dishSlots.length);
    this.dishUsed[0] = 1; // ours
    this.traySlotUsed = L.traySlots.map((s) => {
      const u = new Uint8Array(s.length);
      u[0] = 1;
      return u;
    });
    this.spawnT = new Float32Array(L.lanes.length);
    this.gateT = new Float32Array(L.lanes.length);
    this.gateH = new Float32Array(L.lanes.length);
    this.clawT = new Float32Array(2);
    this.clawHold = new Int32Array(2).fill(-1);
    this.clawSlip = new Float32Array(2).fill(-1);
    this.lakeMax = 1600;
    this.lake = new Float32Array(this.lakeMax * 4);
    let s = seed;
    this.rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < L.lanes.length; i++) {
      this.spawnT[i] = this.rnd() * tune.spawn;
      this.gateT[i] = this.rnd() * tune.gatePeriod;
    }
    this.clawT[1] = tune.clawCycle * 0.5;
  }

  /* ---- helpers ---------------------------------------------------------- */

  private free(): number {
    for (let i = 0; i < this.n; i++) if (this.mode[i] === M.FREE) return i;
    return -1;
  }
  private setPos(i: number, p: THREE.Vector3) {
    this.pos[i * 3] = p.x;
    this.pos[i * 3 + 1] = p.y;
    this.pos[i * 3 + 2] = p.z;
  }
  private getPos(i: number, out: THREE.Vector3) {
    return out.set(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]);
  }
  private setFrom(i: number) {
    this.from[i * 3] = this.pos[i * 3];
    this.from[i * 3 + 1] = this.pos[i * 3 + 1];
    this.from[i * 3 + 2] = this.pos[i * 3 + 2];
  }
  private remove(q: number[], i: number) {
    const k = q.indexOf(i);
    if (k >= 0) q.splice(k, 1);
  }
  private enter(i: number, mode: M) {
    this.mode[i] = mode;
    this.t[i] = 0;
  }

  /** Start a fall from where it is, with velocity (vx, vy, vz). */
  private fall(i: number, vx: number, vy: number, vz: number, leak: Leak) {
    this.enter(i, M.FALL);
    // Each one tumbles away on its own line (and the lake spreads across the pit).
    this.vel[i * 3] = vx + (this.rnd() - 0.5) * 2.6;
    this.vel[i * 3 + 1] = vy;
    this.vel[i * 3 + 2] = vz + (this.rnd() - 0.5) * 2.6;
    this.lost[leak]++;
    if (this.user[i]) this.yoursLost++;
    this.events.push({ type: "lost", leak, pos: this.getPos(i, new THREE.Vector3()), user: !!this.user[i] });
  }

  private spawn(lane: number, isNew: boolean, user = false, force = false): number {
    const i = this.free();
    if (i < 0) return -1;
    const q = isNew ? this.nLaneQ[lane] : this.laneQ[lane];
    // Room at the top of the lane? (A visitor's own drop always goes in.)
    if (!force && q.length && this.s[q[q.length - 1]] < SPACING * 1.4) return -1;
    this.enter(i, isNew ? M.N_LANE : M.LANE);
    this.lane[i] = lane;
    this.s[i] = 0;
    this.v[i] = 0.4;
    this.wait[i] = 0;
    this.glow[i] = 1;
    this.gold[i] = 0;
    this.user[i] = user ? 1 : 0;
    this.laps[i] = 0;
    const n = this.spawnN++;
    this.leaver[i] = user || (n * LEAVE_RATE) % 100 < LEAVE_RATE ? 1 : 0;
    q.push(i);
    this.L.lanes[lane].track.at(0, _p);
    this.setPos(i, _p);
    return i;
  }

  /** Drop one of your own in, just before the part of the machine on screen. */
  drop(station: "website" | "inbox" | "admin" | "followup" | "new"): boolean {
    const lanes = this.L.lanes.length;
    const lane = 1 + Math.floor(this.rnd() * (lanes - 1));
    if (station === "new") {
      // Any lane with room at the top, else in it goes anyway.
      let i = -1;
      for (let k = 0; k < lanes - 1 && i < 0; k++) i = this.spawn(1 + ((lane - 1 + k) % (lanes - 1)), true, true);
      if (i < 0) i = this.spawn(lane, true, true, true);
      if (i >= 0) this.yoursIn++;
      return i >= 0;
    }
    if (station === "website") {
      // Placed straight down the ramp (below), so a crowded top doesn't matter.
      const i = this.spawn(lane, false, true, true);
      if (i < 0) return false;
      // Start most of the way down the ramp, where the camera is.
      this.s[i] = Math.max(0, this.L.lanes[lane].sGate - 3.2);
      this.remove(this.laneQ[lane], i);
      const q = this.laneQ[lane];
      let k = 0;
      while (k < q.length && this.s[q[k]] > this.s[i]) k++;
      q.splice(k, 0, i);
      this.yoursIn++;
      return true;
    }
    const i = this.free();
    if (i < 0) return false;
    this.user[i] = 1;
    this.glow[i] = 1;
    this.gold[i] = 0;
    this.leaver[i] = 1;
    this.yoursIn++;
    if (station === "inbox") {
      this.enter(i, M.CHUTE);
      this.s[i] = Math.max(0, this.L.sFunnel - 2.5);
      this.v[i] = 1;
      this.L.chute.at(this.s[i], _p);
      this.setPos(i, _p);
      this.chuteQ.push(i);
      this.chuteQ.sort((a, b) => this.s[b] - this.s[a]);
      return true;
    }
    if (station === "admin") {
      return this.toTray(i, 0, true);
    }
    // The follow-up: on the last track.
    this.enter(i, M.FINAL);
    this.s[i] = 0.4;
    this.v[i] = 0.6;
    this.gold[i] = 1;
    this.L.final.at(this.s[i], _p);
    this.setPos(i, _p);
    this.finalQ.push(i);
    return true;
  }

  private toTray(i: number, k: number, place = false): boolean {
    const used = this.traySlotUsed[k];
    // Free places from the back rows (the front middle is ours).
    let slot = -1;
    for (let j = used.length - 1; j > 0; j--)
      if (!used[j]) {
        slot = j;
        break;
      }
    if (slot < 0) return false;
    used[slot] = 1;
    this.slot[i] = slot;
    this.tray[i] = k;
    this.enter(i, M.TRAY);
    this.trayQ[k].push(i);
    if (place) this.setPos(i, this.L.traySlots[k][slot]);
    this.setFrom(i);
    return true;
  }

  /** Clear everything (the turn), keeping the counts. */
  clear() {
    this.mode.fill(M.FREE);
    this.laneQ.forEach((q) => (q.length = 0));
    this.nLaneQ.forEach((q) => (q.length = 0));
    this.chuteQ.length = 0;
    this.finalQ.length = 0;
    this.nChuteQ.length = 0;
    this.channelQ.length = 0;
    this.loopQ.length = 0;
    this.trayQ.forEach((q) => (q.length = 0));
    this.dishUsed.fill(0);
    this.dishUsed[0] = 1;
    this.traySlotUsed.forEach((u) => {
      u.fill(0);
      u[0] = 1;
    });
    this.clawHold.fill(-1);
  }

  /* ---- the step ------------------------------------------------------------- */

  /** Advance the crowd by dt (scaled: 0 freezes it, <1 is slow motion). */
  step(dt: number) {
    if (dt <= 0) return;
    // Long gaps (a hidden tab) are taken in small steps.
    while (dt > 0) {
      const h = Math.min(dt, 1 / 30);
      this.tick(h);
      dt -= h;
    }
  }

  private tick(dt: number) {
    const L = this.L;
    const tn = this.tune;
    if (this.machine === "old") {
      // Arrivals: the crowd uses every lane but ours (lane 0).
      for (let l = 1; l < L.lanes.length; l++) {
        this.spawnT[l] -= dt;
        if (this.spawnT[l] <= 0) {
          this.spawnT[l] = tn.spawn * (0.7 + this.rnd() * 0.6);
          this.spawn(l, false);
        }
      }
      // The gates: shut most of the time, open for a moment, each on its own beat.
      for (let l = 1; l < L.lanes.length; l++) {
        this.gateT[l] += dt;
        const ph = this.gateT[l] % tn.gatePeriod;
        const open = ph > tn.gatePeriod - tn.gateOpen;
        const target = open ? 1 : 0;
        this.gateH[l] += (target - this.gateH[l]) * (1 - Math.exp(-dt * (open ? 7 : 5)));
      }
      this.stepLanes(dt);
      this.stepChute(dt);
      this.stepDish(dt);
      this.stepClaws(dt);
      this.stepTrays(dt);
      this.stepFinal(dt);
    } else if (this.machine === "new") {
      for (let l = 1; l < L.lanes.length; l++) {
        this.spawnT[l] -= dt;
        if (this.spawnT[l] <= 0) {
          this.spawnT[l] = tn.nSpawn * (0.7 + this.rnd() * 0.6);
          this.spawn(l, true);
        }
      }
      this.stepNew(dt);
    }
    this.stepFalls(dt);
    this.colours(dt);
  }

  /** Along a FIFO queue on a track: accelerate toward vt, never closer than SPACING to the one ahead, stop at `stop`. */
  private advanceQueue(q: number[], track: { length: number; at: (s: number, o: THREE.Vector3) => THREE.Vector3 }, vt: number, dt: number, stop: (i: number, k: number) => number) {
    for (let k = 0; k < q.length; k++) {
      const i = q[k];
      let lim = stop(i, k);
      if (k > 0) lim = Math.min(lim, this.s[q[k - 1]] - SPACING);
      this.v[i] += (vt - this.v[i]) * (1 - Math.exp(-dt * 1.6));
      let s = this.s[i] + this.v[i] * dt;
      if (s > lim) {
        s = Math.max(this.s[i], lim);
        this.v[i] *= 0.4;
      }
      this.s[i] = s;
      track.at(Math.min(s, track.length), _p);
      this.setPos(i, _p);
    }
  }

  private stepLanes(dt: number) {
    const L = this.L;
    for (let l = 1; l < L.lanes.length; l++) {
      const ln = L.lanes[l];
      const q = this.laneQ[l];
      const stopAt = ln.sGate - 0.14;
      const open = this.gateH[l] > 0.8;
      this.advanceQueue(q, ln.track, 1.7, dt, (i) => (this.s[i] < stopAt + 0.01 && !(open && !this.leaver[i]) ? stopAt : ln.track.length));
      // Waiting at the gate; the impatient ones leave.
      for (let k = q.length - 1; k >= 0; k--) {
        const i = q[k];
        if (this.s[i] > stopAt - 3.2 && this.s[i] < stopAt + 0.02 && this.v[i] < 0.5) this.wait[i] += dt;
        if (this.leaver[i] && this.wait[i] > 1.0 + ((i * 7919) % 100) / 45) {
          q.splice(k, 1);
          const side = (i % 2 ? 1 : -1) * (0.7 + this.rnd() * 0.5);
          this.fall(i, -0.5 - this.rnd() * 0.5, 1.4 + this.rnd() * 0.8, side, "website");
        }
      }
      // Past the gate and to the end of the lane: into the chute, when there is room.
      const f = q[0];
      if (f !== undefined && this.s[f] >= ln.track.length - 0.001) {
        const last = this.chuteQ[this.chuteQ.length - 1];
        if (last === undefined || this.s[last] > SPACING * 1.3) {
          q.shift();
          this.enter(f, M.CHUTE);
          this.s[f] = 0;
          this.chuteQ.push(f);
        }
      }
    }
  }

  private stepChute(dt: number) {
    const L = this.L;
    const q = this.chuteQ;
    this.advanceQueue(q, L.chute, 2.3, dt, () => L.chute.length);
    for (const i of q) if (this.s[i] > L.sFunnel) this.v[i] = Math.min(this.v[i], 1.5);
    const f = q[0];
    if (f !== undefined && this.s[f] >= L.chute.length - 0.001) {
      // Out of the spout into the dish, to the first free place from the middle.
      let slot = -1;
      for (let k = 1; k < this.dishUsed.length; k++)
        if (!this.dishUsed[k]) {
          slot = k;
          break;
        }
      if (slot < 0) return;
      q.shift();
      this.dishUsed[slot] = 1;
      this.slot[f] = slot;
      this.enter(f, M.DROP);
      this.setFrom(f);
      this.wait[f] = 0;
    }
  }

  private stepDish(dt: number) {
    const L = this.L;
    // The hatch: someone gets back to one of them, now and then.
    this.valveT += dt;
    this.hatch += ((this.valveT < 0.6 ? 1 : 0) - this.hatch) * (1 - Math.exp(-dt * 8));
    let oldest = -1;
    let ow = -1;
    for (let i = 0; i < this.n; i++) {
      const m = this.mode[i];
      if (m === M.DROP) {
        this.t[i] += dt;
        const k = Math.min(1, this.t[i] / 0.85);
        const slot = L.dishSlots[this.slot[i]];
        // A short fall to the middle, then a roll out to its place.
        const fx = this.from[i * 3];
        const fy = this.from[i * 3 + 1];
        const fz = this.from[i * 3 + 2];
        const k1 = Math.min(1, k / 0.35);
        const k2 = Math.max(0, (k - 0.35) / 0.65);
        const e2 = 1 - Math.pow(1 - k2, 3);
        const mx = DISH.x;
        const mz = DISH.z + 0.4;
        const my = dishY(0.4) + R;
        const x = k < 0.35 ? fx + (mx - fx) * k1 : mx + (slot.x - mx) * e2;
        const z = k < 0.35 ? fz + (mz - fz) * k1 : mz + (slot.z - mz) * e2;
        const y = k < 0.35 ? fy + (my - fy) * k1 * k1 : my + (slot.y - my) * e2;
        _p.set(x, y, z);
        this.setPos(i, _p);
        if (k >= 1) this.enter(i, M.DISH);
      } else if (m === M.DISH) {
        this.wait[i] += dt;
        if (this.wait[i] > ow && this.wait[i] < GIVE_UP) {
          ow = this.wait[i];
          oldest = i;
        }
        // Waited too long: they have asked someone else. Over the rim.
        if (this.wait[i] > GIVE_UP + ((i * 3571) % 100) / 18 || (this.user[i] && this.wait[i] > HOUR * 3.2)) {
          this.dishUsed[this.slot[i]] = 0;
          this.enter(i, M.RIM);
          this.setFrom(i);
        }
      } else if (m === M.RIM) {
        this.t[i] += dt;
        const fx = this.from[i * 3];
        const fz = this.from[i * 3 + 2];
        const dx = fx - DISH.x;
        const dz = fz - DISH.z;
        const d = Math.hypot(dx, dz) || 1;
        const k = Math.min(1, this.t[i] / 0.9);
        const r = d + (DISH.r + 0.25 - d) * k * k;
        _p.set(DISH.x + (dx / d) * r, dishY(Math.min(r, DISH.r)) + R + (r > DISH.r ? 0.2 : 0), DISH.z + (dz / d) * r);
        this.setPos(i, _p);
        if (k >= 1) this.fall(i, (dx / d) * 1.1, 0.6, (dz / d) * 1.1, "inbox");
      } else if (m === M.VALVE) {
        this.t[i] += dt;
        const k = Math.min(1, this.t[i] / 1.0);
        const fx = this.from[i * 3];
        const fy = this.from[i * 3 + 1];
        const fz = this.from[i * 3 + 2];
        if (k < 0.4) {
          const e = k / 0.4;
          _p.set(fx + (DISH.x - fx) * e, fy + (DISH.y + R - fy) * e, fz + (PIPE_Z - fz) * e);
        } else {
          const e = (k - 0.4) / 0.6;
          _p.set(DISH.x, DISH.y + R - (DISH.y - 29.6) * e * e, PIPE_Z);
        }
        this.setPos(i, _p);
        if (k >= 1 && !this.toTray(i, 0)) {
          // A full tray: the customer waits in the pipe.
          this.t[i] = 1;
        }
      }
    }
    if (this.valveT > this.tune.valve && oldest >= 0) {
      this.valveT = 0;
      this.dishUsed[this.slot[oldest]] = 0;
      this.enter(oldest, M.VALVE);
      this.setFrom(oldest);
    }
  }

  private stepTrays(dt: number) {
    const L = this.L;
    for (const k of [0, 1, 2]) {
      for (const i of this.trayQ[k]) {
        this.t[i] += dt;
        const to = L.traySlots[k][this.slot[i]];
        const e = Math.min(1, this.t[i] / 0.35);
        _p.set(
          this.from[i * 3] + (to.x - this.from[i * 3]) * e,
          this.from[i * 3 + 1] + (to.y - this.from[i * 3 + 1]) * e,
          this.from[i * 3 + 2] + (to.z - this.from[i * 3 + 2]) * e
        );
        this.setPos(i, _p);
        if (k === 2 && this.t[i] > 0.8) this.gold[i] = Math.min(1, this.gold[i] + dt * 3);
      }
    }
    // The invoice tray lets one out at a time onto the last track.
    this.trayCT += dt;
    const q = this.trayQ[2];
    if (q.length && this.trayCT > 1.3 && this.t[q[0]] > 1.4) {
      const fq = this.finalQ;
      const last = fq[fq.length - 1];
      if (last === undefined || this.s[last] > SPACING * 1.5) {
        this.trayCT = 0;
        const i = q.shift()!;
        this.traySlotUsed[2][this.slot[i]] = 0;
        this.enter(i, M.FINAL);
        this.s[i] = 0;
        this.v[i] = 0.3;
        fq.push(i);
      }
    }
  }

  private stepClaws(dt: number) {
    const tn = this.tune;
    for (let c = 0; c < 2; c++) {
      const from = c;
      const to = c + 1;
      this.clawT[c] += dt;
      const T = tn.clawCycle;
      const ph = this.clawT[c] % T;
      const fx = TRAYS[from].x;
      const tx = TRAYS[to].x;
      // Down, grab, up, across, down, let go, up, back.
      const seg = [0.12, 0.08, 0.12, 0.33, 0.1, 0.06, 0.07, 0.12];
      const edges: number[] = [];
      let acc = 0;
      for (const s of seg) edges.push((acc += s));
      const u = ph / T;
      let x = fx;
      let drop = 1;
      let open = 1;
      const sm = (a: number) => a * a * (3 - 2 * a);
      if (u < edges[0]) {
        drop = 1 + 2.1 * sm(u / edges[0]);
      } else if (u < edges[1]) {
        drop = 3.1;
        open = 1 - (u - edges[0]) / seg[1];
        if (this.clawHold[c] < 0 && open < 0.5) this.grab(c, from);
      } else if (u < edges[2]) {
        drop = 3.1 - 2.1 * sm((u - edges[1]) / seg[2]);
        open = 0;
      } else if (u < edges[3]) {
        const k = (u - edges[2]) / seg[3];
        x = fx + (tx - fx) * sm(k);
        drop = 1;
        open = 0;
        const i = this.clawHold[c];
        if (i >= 0 && this.clawSlip[c] >= 0 && k > this.clawSlip[c]) {
          // It slips.
          this.clawHold[c] = -1;
          this.clawSlip[c] = -1;
          this.fall(i, (tx - fx) * 0.25, -0.3, 0.1, "admin");
          this.events.push({ type: "slip", claw: c + 2, pos: this.getPos(i, new THREE.Vector3()) });
        }
      } else if (u < edges[4]) {
        x = tx;
        drop = 1 + 2.0 * sm((u - edges[3]) / seg[4]);
        open = 0;
      } else if (u < edges[5]) {
        x = tx;
        drop = 3.0;
        open = (u - edges[4]) / seg[5];
        const i = this.clawHold[c];
        if (i >= 0 && open > 0.4) {
          this.clawHold[c] = -1;
          this.setFrom(i);
          if (!this.toTray(i, to)) this.fall(i, 0, 0.2, 0.4, "admin");
        }
      } else if (u < edges[6]) {
        x = tx;
        drop = 3.0 - 2.0 * sm((u - edges[5]) / seg[6]);
      } else {
        x = tx + (fx - tx) * sm((u - edges[6]) / seg[7]);
      }
      const cl = this.claw[c];
      cl.x = x;
      cl.drop = drop;
      cl.open = open;
      const i = this.clawHold[c];
      if (i >= 0) {
        _p.set(x, GANTRY_Y - drop - 0.38, GANTRY_Z.back);
        this.setPos(i, _p);
      }
    }
  }

  private grab(c: number, k: number) {
    const q = this.trayQ[k];
    if (!q.length) return;
    const i = q.shift()!;
    this.traySlotUsed[k][this.slot[i]] = 0;
    this.enter(i, M.CARRIED);
    this.clawHold[c] = i;
    this.clawSlip[c] = this.user[i] || this.rnd() < this.tune.slip ? 0.25 + this.rnd() * 0.5 : -1;
    this.events.push({ type: "grab", claw: c + 2 });
  }

  private stepFinal(dt: number) {
    const L = this.L;
    const q = this.finalQ;
    this.advanceQueue(q, L.final, 2.4, dt, () => L.final.length);
    const f = q[0];
    if (f !== undefined && this.s[f] >= L.final.length - 0.001) {
      q.shift();
      L.final.tangent(L.final.length, _t);
      const v = 0.9 + this.rnd() * 0.5;
      this.fall(f, _t.x * v, _t.y * v + 0.25, _t.z * v, "followup");
    }
  }

  /* ---- the new machine -------------------------------------------------------- */

  private stepNew(dt: number) {
    const L = this.L;
    const T = L.TURB;
    for (let l = 1; l < L.lanes.length; l++) {
      const ln = L.lanes[l];
      const q = this.nLaneQ[l];
      const before = q.map((i) => this.s[i]);
      this.advanceQueue(q, ln.track, 2.1, dt, () => ln.track.length);
      q.forEach((i, k) => {
        if (before[k] < ln.sGate && this.s[i] >= ln.sGate) this.events.push({ type: "ring", lane: l });
      });
      const f = q[0];
      if (f !== undefined && this.s[f] >= ln.track.length - 0.001) {
        const last = this.nChuteQ[this.nChuteQ.length - 1];
        if (last === undefined || this.s[last] > SPACING * 1.3) {
          q.shift();
          this.enter(f, M.N_CHUTE);
          this.s[f] = 0;
          this.nChuteQ.push(f);
        }
      }
    }
    this.advanceQueue(this.nChuteQ, L.nchute, 2.8, dt, () => L.nchute.length);
    const f = this.nChuteQ[0];
    if (f !== undefined && this.s[f] >= L.nchute.length - 0.001) {
      this.nChuteQ.shift();
      this.enter(f, M.N_TURB);
      this.events.push({ type: "catch", pos: this.getPos(f, new THREE.Vector3()) });
    }
    for (let i = 0; i < this.n; i++) {
      if (this.mode[i] !== M.N_TURB) continue;
      this.t[i] += dt;
      const k = Math.min(1, this.t[i] / 0.55);
      // Caught at the top right, swept round the turbine, let go at the bottom left.
      const a = THREE.MathUtils.lerp(Math.PI * 0.32, Math.PI * 1.22, k);
      _p.set(T.x + Math.cos(a) * T.r * 0.92, T.y + Math.sin(a) * T.r * 0.92, T.z);
      this.setPos(i, _p);
      if (k >= 1) {
        this.enter(i, M.N_CHANNEL);
        this.s[i] = 0;
        this.v[i] = 2.4;
        this.channelQ.push(i);
      }
    }
    const cq = this.channelQ;
    const prev = cq.map((i) => this.s[i]);
    this.advanceQueue(cq, L.channel, 2.6, dt, () => L.channel.length);
    cq.forEach((i, k) => {
      L.sNodes.forEach((sn, n) => {
        if (prev[k] < sn && this.s[i] >= sn) this.events.push({ type: "node", k: n, pos: this.getPos(i, new THREE.Vector3()) });
      });
    });
    const g = cq[0];
    if (g !== undefined && this.s[g] >= L.channel.length - 0.001) {
      cq.shift();
      this.enter(g, M.N_LOOP);
      this.s[g] = 0;
      this.loopQ.push(g);
    }
    this.advanceQueue(this.loopQ, L.loop, 6.5, dt, () => L.loop.length);
    const h = this.loopQ[0];
    if (h !== undefined && this.s[h] >= L.loop.length - 0.001) {
      // Back at the door: a customer who came back.
      const lane = 1 + ((this.laps[h] + h) % (L.lanes.length - 1));
      const q = this.nLaneQ[lane];
      const last = q[q.length - 1];
      if (last === undefined || this.s[last] > SPACING * 1.4) {
        this.loopQ.shift();
        this.kept++;
        if (this.user[h]) this.yoursKept++;
        this.laps[h]++;
        this.gold[h] = 1;
        this.events.push({ type: "kept", pos: this.getPos(h, new THREE.Vector3()), user: !!this.user[h] });
        this.enter(h, M.N_LANE);
        this.lane[h] = lane;
        this.s[h] = 0;
        this.v[h] = 0.6;
        q.push(h);
        // …and some bring someone with them.
        if (this.rnd() < 0.55) this.spawnT[1 + Math.floor(this.rnd() * (L.lanes.length - 1))] = 0;
      }
    }
  }

  /* ---- falling, and the lake --------------------------------------------------- */

  private stepFalls(dt: number) {
    for (let i = 0; i < this.n; i++) {
      if (this.mode[i] !== M.FALL) continue;
      this.t[i] += dt;
      const o = i * 3;
      this.vel[o + 1] -= 9.0 * dt;
      const drag = Math.exp(-dt * 0.05);
      this.vel[o] *= drag;
      this.vel[o + 2] *= drag;
      this.pos[o] += this.vel[o] * dt;
      this.pos[o + 1] += this.vel[o + 1] * dt;
      this.pos[o + 2] += this.vel[o + 2] * dt;
      if (this.pos[o + 1] < PIT_Y + 0.15) {
        // At rest on the bottom of the pit, with all the others.
        const k = this.lakeHead;
        // It rolls a little way across the bottom, and stays (inside the pit).
        let lx = this.pos[o] + (this.rnd() - 0.5) * 5;
        let lz = this.pos[o + 2] + (this.rnd() - 0.5) * 5;
        const lr = Math.hypot(lx, lz);
        if (lr > 19.6) {
          lx *= 19.6 / lr;
          lz *= 19.6 / lr;
        }
        this.lake[k * 4] = lx;
        this.lake[k * 4 + 1] = PIT_Y + 0.12;
        this.lake[k * 4 + 2] = lz;
        this.lake[k * 4 + 3] = this.user[i] ? 1.6 : 1;
        this.lakeHead = (k + 1) % this.lakeMax;
        this.lakeN = Math.min(this.lakeMax, this.lakeN + 1);
        this.events.push({ type: "lake", pos: new THREE.Vector3(this.pos[o], PIT_Y, this.pos[o + 2]) });
        this.mode[i] = M.FREE;
      }
    }
  }

  /** Each customer's light: warm, dimming as it waits, gold once it has paid, red as it falls. */
  private colours(dt: number) {
    for (let i = 0; i < this.n; i++) {
      const m = this.mode[i];
      if (m === M.FREE) continue;
      let k = 1;
      if (m === M.DISH || m === M.RIM) {
        const w = this.wait[i];
        k = w < HOUR ? 1 : Math.max(1 / 7, 1 - ((w - HOUR) / (HOUR * 4)) * (6 / 7));
      }
      if (m === M.FALL) k = Math.max(0.75, this.glow[i]);
      this.glow[i] += (k - this.glow[i]) * (1 - Math.exp(-dt * 3));
      const base = this.user[i] ? USER : WARM;
      _c.copy(base).lerp(GOLD, this.gold[i]);
      if (m === M.FALL) _c.lerp(RED, Math.min(1, this.t[i] * 0.38));
      _c.multiplyScalar(this.glow[i]);
      this.col[i * 3] = _c.r;
      this.col[i * 3 + 1] = _c.g;
      this.col[i * 3 + 2] = _c.b;
    }
  }

  /** The lake's points fade a little over time (but never out). */
  ageLake(dt: number) {
    for (let k = 0; k < this.lakeN; k++) this.lake[k * 4 + 3] = Math.max(0.28, this.lake[k * 4 + 3] - dt * 0.05);
  }
}

const _p = new THREE.Vector3();
const _t = new THREE.Vector3();
const _c = new THREE.Color();
void EDGE;
void TRAY_W;
export type { OldRig };
