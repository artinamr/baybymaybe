import * as THREE from "three";
import { buildHall } from "./hall";
import { buildLayout, corner, CORNER_YAW, CRANK, CX, DISH, EDGE, GANTRY_Y, GANTRY_Z, GATE_X, GATE_Y, PIPE_Z, PIT_R, PIT_Y, TRAYS, WHEEL, type Layout } from "./layout";
import { buildOld, GATE_RP, pieceMatrix, turnTrain, type OldRig } from "./old";
import { DESK_YAW, dw, Owner, SIX } from "./owner";
import { ContactShade } from "./shade";
import { buildNew, type NewRig } from "./next";
import { chromeMaterial, clothMaterial, coreMaterial, depthMaterial, glassMaterial, ironMaterial, lightMaterial, shared } from "./materials";
import { M, Sim, type SimEvent, type Tune } from "./sim";
import { heroAt, heroInit, heroPlan, type HeroState } from "./hero";
import { heroBeat, Marbles } from "./marbles";
import { cameraAt, cameraSmooth, type CamOut } from "./camera";
import { lookAt, newLook, type Look } from "./look";
import { Post, makeGrade, type Grade } from "./post";
import { bump, range, smooth, smoother } from "./ease";
import { FLOOR_Y as FLOOR_LEVEL } from "./layout";
import type { Kit, Piece } from "./kit";
import type { Quality } from "../store";
import { RESTS } from "../timeline";

/**
 * THE WORLD: everything the film draws, and what moves it each frame.
 *
 *   look      the chapter's colour (fog, lights, windows, grade)
 *   crowd     the simulation, in real time (frozen and slowed at the turn)
 *   hero      our customer, from the film's clock
 *   rig       every moving part: gates, gauge, the wheel of hours, the hatch,
 *             claws, stamp, tubes, gears, crank, the person at it, the lamp
 *   turn      the old machine coming apart; the new one assembling
 *   camera    the flight, its breath, its lean toward the pointer
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const _cs = new THREE.Vector3();
const _q0 = new THREE.Quaternion();
const _q1 = new THREE.Quaternion();
const _ax = new THREE.Vector3();

/*
 * THE TEARDOWN, planned once (World.planTear) and played as a pure function
 * of P. A collapse front runs down the tower faster than free fall (1.56 g);
 * each level lets go as it arrives, punched down with two thirds of the
 * front's speed (so no level overtakes the one below it); every piece falls
 * from where it was, spins up from rest, lands flat on its broad side on
 * the pile beneath it (a height field of the pit, filled in landing order),
 * bounces once and rocks still.
 */
/** How far the stamp's head comes down at h.stamp = 1: from its rest (face at TRAY_Y+1.19) onto our customer's top (TRAY_Y+0.26). */
const STAMP_TRAVEL = 0.93;
/** A claw's pendulum swing, when its state has one (hero.ts / sim.ts). */
const swingOf = (s: { drop: number; swing?: number }) => s.swing ?? 0;
/** A tower gear's tooth phase, when old.ts gives one (so neighbours mesh). */

/** An angle difference brought into (−π, π]. */
const wrap2pi = (x: number) => x - Math.PI * 2 * Math.round(x / (Math.PI * 2));

/**
 * The direction a cloud of points is thinnest in: the eigenvector of the
 * smallest eigenvalue of its covariance (xx yy zz xy xz yz), by Jacobi sweeps.
 */
function thinnest(xx: number, yy: number, zz: number, xy: number, xz: number, yz: number, out: THREE.Vector3) {
  const a = [[xx, xy, xz], [xy, yy, yz], [xz, yz, zz]];
  const v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 12; sweep++) {
    for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
      if (Math.abs(a[p][q]) < 1e-12) continue;
      const th = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]);
      const c = Math.cos(th);
      const s = Math.sin(th);
      for (let k = 0; k < 3; k++) {
        const akp = a[k][p];
        const akq = a[k][q];
        a[k][p] = c * akp - s * akq;
        a[k][q] = s * akp + c * akq;
      }
      for (let k = 0; k < 3; k++) {
        const apk = a[p][k];
        const aqk = a[q][k];
        a[p][k] = c * apk - s * aqk;
        a[q][k] = s * apk + c * aqk;
      }
      for (let k = 0; k < 3; k++) {
        const vkp = v[k][p];
        const vkq = v[k][q];
        v[k][p] = c * vkp - s * vkq;
        v[k][q] = s * vkp + c * vkq;
      }
    }
  }
  const i = a[0][0] <= a[1][1] && a[0][0] <= a[2][2] ? 0 : a[1][1] <= a[2][2] ? 1 : 2;
  return out.set(v[0][i], v[1][i], v[2][i]).normalize();
}

/**
 * One new piece at P (next.ts, its `from`): it condenses out of light on its way
 * in, flies into its seat decelerating (its turn finishing with its travel),
 * knocks home with a small recoil of the same size for every piece, and
 * flashes as it locks. A pure function of P.
 */
export function assemble(p: Piece, f: NewRig["from"][number], P: number, reduced: boolean) {
  const tl = P - f.at;
  if (tl <= 0) {
    p.s = 0;
    p.t.set(0, 0, 0);
    p.q.identity();
    p.glow = 0;
    return;
  }
  const k = Math.min(1, tl / f.fly);
  // The recoil: amplitude A, ringing at RING (per P), losing most of its
  // energy in the knock (so the piece arrives at A·RING/REST, whatever its flight).
  const A = f.heavy ? 0.02 : 0.035;
  const RING = (2.5 * Math.PI) / 0.07;
  const REST = 0.35;
  const D = f.t.length();
  const arrive = reduced ? 0 : Math.min(0.5, (((A * RING) / REST) * f.fly) / Math.max(D, 1e-3));
  const e = 1 - Math.pow(1 - k, f.heavy ? 5 : 3) + arrive * k * k * (k - 1);
  const grow = reduced ? 1 : smooth(range(k, 0, 0.3));
  p.s = Math.max(0.001, grow);
  p.t.copy(f.t).multiplyScalar(1 - e);
  const ts = tl - f.fly;
  if (!reduced) {
    p.t.addScaledVector(f.bend, Math.sin(Math.PI * k) * (1 - k) * (1 - k));
    if (ts > 0 && ts < 0.12) p.t.addScaledVector(f.dir, -A * Math.sin(ts * RING) * Math.exp(-ts / 0.0175));
  }
  p.q.copy(f.q).slerp(_q1.identity(), smoother(k));
  const lock = ts < 0 ? Math.exp(-((ts / 0.012) ** 2)) : Math.exp(-((ts / 0.045) ** 2));
  p.glow = Math.max(lock * (p.size < 5 ? 1.2 : 0.6), (1 - grow) * 1.4);
  p.power = 0.25 + 0.75 * grow;
}

/** How far the rebuilt machine's crowd is run ahead at load (s). */
const NEW_AHEAD = 55;

/** Floats per piece in the plan. */
const TS = 20;
const GRAV = 9.81;
/** Film seconds of fall per P (slow motion). */
const SLOMO = 3.1;
const TEAR_TOP = 54;
const TEAR_P0 = 14.98;
/** The collapse front's acceleration, × g. */
const FRONT = 1 / 0.64;
/** A level leaves with this share of the front's speed. */
const KICK = 0.66;
/** The kick, the sideways push and the slide on landing take this long (film seconds). */
const T_KICK = 0.08;
const T_PUSH = 0.35;
const T_SLIDE = 0.12;
/** Spin builds from rest at this rate (1/s). */
const SPIN_B = 2.5;
const spinS = (x: number) => (x <= 0 ? 0 : x - (1 - Math.exp(-SPIN_B * x)) / SPIN_B);
/** Where the collapse front is at P (pieces above it are falling). */
const tearFront = (P: number) => {
  const t = Math.max(0, P - TEAR_P0) * SLOMO;
  return TEAR_TOP - 0.5 * FRONT * GRAV * t * t;
};
/**
 * The share of its sideways way a piece has gone by tau (film seconds): it is
 * pushed off over the first T_PUSH, flies on at that speed, and slides a
 * little where it lands (tauS) before friction stops it.
 */
const pushG = (tau: number, tauS: number) => {
  const A = (t: number) => t - T_PUSH * (1 - Math.exp(-t / T_PUSH));
  const vs = 1 - Math.exp(-tauS / T_PUSH);
  const den = A(tauS) + vs * T_SLIDE;
  return tau <= tauS ? A(tau) / den : (A(tauS) + vs * T_SLIDE * (1 - Math.exp(-(tau - tauS) / T_SLIDE))) / den;
};
/** Two diminishing hops off the pile after landing (v: the first hop's speed). */
const hopAt = (t: number, v: number) => {
  const t1 = (2 * v) / GRAV;
  if (t < t1) return v * t - 0.5 * GRAV * t * t;
  const v2 = 0.3 * v;
  const t2 = t - t1;
  return t2 < (2 * v2) / GRAV ? v2 * t2 - 0.5 * GRAV * t2 * t2 : 0;
};
/** The rotated bounding box's lowest point, relative to the pivot (b: the piece's centre offset and half extents). */
const lowOf = (q: THREE.Quaternion, b: Float32Array, o: number) => {
  const x = q.x, y = q.y, z = q.z, w = q.w;
  const r0 = 2 * (x * y + z * w);
  const r1 = 1 - 2 * (x * x + z * z);
  const r2 = 2 * (y * z - x * w);
  return r0 * b[o] + r1 * b[o + 1] + r2 * b[o + 2] - Math.abs(r0) * b[o + 3] - Math.abs(r1) * b[o + 4] - Math.abs(r2) * b[o + 5];
};

/**
 * The film's clock keys: P → hours after midnight. Equal neighbours are
 * deliberate holds (the wait at the gate, the owner's last hour).
 */
const CLOCK_KEYS: [number, number][] = [
  [0, 19.0],
  [4.6, 19 + 40 / 60],
  [5.3, 19 + 40 / 60],
  [6.72, 24 + 9 + 12 / 60],
  [7.3, 24 + 9.5],
  [11.6, 24 + 16.2],
  // The evening goes by while we rise to the owner: 11:47pm by the time we're there.
  [12.25, 24 + 23 + 47 / 60],
  [14, 24 + 23 + 47 / 60],
  [16.9, 24 + 26.5],
  [18.6, 48 + 2 + 58 / 60],
  [20.2, 48 + 3 + 4 / 60],
  [23.9, 48 + 17.6],
  [24.62, 48 + 18],
  [27.4, 48 + 18.2],
];
/**
 * One monotone cubic through the keys (Fritsch–Butland tangents, as the home
 * film's camera): the hands never run backwards or overshoot a key, a hold
 * between equal keys stays a hold, and between holds the clock keeps going
 * instead of braking to a stop at every key.
 */
const CLOCK_M = (() => {
  const k = CLOCK_KEYS;
  const n = k.length;
  const d = k.slice(0, -1).map(([a, ha], i) => (k[i + 1][1] - ha) / (k[i + 1][0] - a));
  const m = new Array<number>(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    const h0 = k[i][0] - k[i - 1][0];
    const h1 = k[i + 1][0] - k[i][0];
    if (d[i - 1] * d[i] <= 0) continue;
    m[i] = (3 * (h0 + h1)) / ((2 * h1 + h0) / d[i - 1] + (h1 + 2 * h0) / d[i]);
  }
  return m;
})();

/** The film's clock face: P → hours after midnight (the wheel of hours keeps the film's time). */
export function clockAt(P: number): number {
  const k = CLOCK_KEYS;
  if (P <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [a, ha] = k[i];
    const [b, hb] = k[i + 1];
    if (P > b) continue;
    const h = b - a;
    const t = (P - a) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return ha * (2 * t3 - 3 * t2 + 1) + CLOCK_M[i] * h * (t3 - 2 * t2 + t) + hb * (-2 * t3 + 3 * t2) + CLOCK_M[i + 1] * h * (t3 - t2);
  }
  return k[k.length - 1][1];
}

export type Frame = { dt: number; time: number; P: number; pointer: { x: number; y: number; has: boolean } };

export class World {
  readonly scene = new THREE.Scene();
  /** Depth alone, drawn first (materials.ts: the depth pre-pass). */
  private pre = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly post: Post;
  readonly L: Layout;
  readonly sim: Sim;
  readonly hero: HeroState = heroInit();
  readonly look: Look = newLook();
  readonly grade: Grade = makeGrade();
  readonly marbles: Marbles;
  private fog: THREE.FogExp2;
  private old: { kit: Kit; rig: OldRig; mats: THREE.Material[] };
  private nw: { kit: Kit; rig: NewRig; mats: THREE.Material[] };
  private lights: { hemi: THREE.HemisphereLight; key: THREE.DirectionalLight; fill: THREE.DirectionalLight; rim: THREE.DirectionalLight; hero: THREE.PointLight; zone: THREE.PointLight; stages: THREE.PointLight[] };
  private hall: ReturnType<typeof buildHall>;
  private cables: THREE.InstancedMesh;
  private flakes: THREE.InstancedMesh;
  private flakeData: Float32Array;
  private sparks: THREE.InstancedMesh;
  private sparkData: Float32Array;
  /** The teardown's plan (TS floats per piece, see planTear). */
  private tear: Float32Array;
  /** How the plan came out (look-dev): pieces eased in, pulled in, the pile's height. */
  tearInfo = { eased: 0, pulled: 0, pile: 0 };
  /** When the windlass is dragged away (its shadow goes with it). */
  private windlassT0 = TEAR_P0;
  /** The windlass's stand (its shadow is dragged with it), and when it goes over the lip. */
  private windlass: Piece | null = null;
  private windlassLip = TEAR_P0;
  private pieceBounds: Float32Array;
  private contact: Float32Array;
  private keep: Uint8Array;
  /** Pieces whose light is animated every frame before the turn (tubes, warning lamps, the door). */
  private lit: Uint8Array;
  private cam: CamOut = { eye: new THREE.Vector3(), at: new THREE.Vector3(), fov: 35, ppx: 0.5, ppy: 0.5, roll: 0 };
  private lean = { x: 0, y: 0 };
  private crankA = 0;
  /** The old crowd as it was after its first minute (restored on the way back up). */
  private crowd0: Record<string, unknown> | null = null;
  /** The new crowd fading on the way back up through the turn, and its scale. */
  private crowdOut = false;
  /** The rebuilt machine's crowd as it is after NEW_AHEAD s (restored when it powers on). */
  private crowdN: Record<string, unknown> | null = null;
  /** When it powered on (the wave of light along the route), and the route's lengths. */
  private waveT = -100;
  private waveK: Float32Array;
  /** Customers let go by the collapse this frame. */
  private going: Uint8Array;
  private route: { lane: number; chute: number; turb: number; channel: number; total: number };
  private crowdK = 1;
  private owner: Owner;
  private shade = new ContactShade(64, FLOOR_LEVEL);
  private deskLight = corner(-1.75, 1.45, 1.05);
  private machine: "old" | "none" | "new" = "old";
  private ringPow: Float32Array;
  private nodePow = new Float32Array(3);
  private prevP = 0;
  private lampOff = false;
  private turbinePow = 0;
  private returnPow = 0;
  private rotorA = 0;
  private rotorV = 0;
  /** Our customer's angle round the turbine last frame (for the blades' lock). */
  private heroA: number | null = null;
  /** The rotor's angle as drawn last frame. */
  private shownA = 0;
  private flywheelA = 0;
  readonly phone: boolean;
  private quality: Quality;
  /** Reduced motion: the camera holds each composed frame, and fades between them. */
  private reduced: boolean;
  private restP = -1;
  private fadeT = -10;
  /** What the pointer is over (a part of the machine), for the label. */
  hover: string | null = null;
  /** Look-dev (`?cam=ex,ey,ez,ax,ay,az,fov`): a fixed camera instead of the film's. */
  camOverride: { eye: THREE.Vector3; at: THREE.Vector3; fov: number } | null = null;
  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  /** This frame's events (the sound and the counter read them). */
  events: SimEvent[] = [];
  /** A short summary of the frame the page's words need. */
  info = { hours: 19, machine: "old" as "old" | "none" | "new", at: "door", speed: 0, heroY: 0, turn: 0 };

  constructor(
    private renderer: THREE.WebGLRenderer,
    opts: { phone: boolean; quality: Quality; reduced?: boolean }
  ) {
    this.phone = opts.phone;
    this.quality = opts.quality;
    this.reduced = !!opts.reduced;
    const wide = !opts.phone;
    this.L = buildLayout(wide);
    this.camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 1200);
    this.fog = new THREE.FogExp2(0x000000, 0.01);
    this.scene.fog = this.fog;
    this.scene.background = new THREE.Color(0, 0, 0);

    // A room for the metal to reflect: dark, a few soft strips.
    this.scene.environment = this.makeEnv();

    const hemi = new THREE.HemisphereLight(0x332211, 0x050403, 0.3);
    const key = new THREE.DirectionalLight(0xffaa66, 2);
    key.position.set(-20, 40, -30);
    const fill = new THREE.DirectionalLight(0x8899cc, 0.3);
    fill.position.set(10, 10, 40);
    const rim = new THREE.DirectionalLight(0x93c4ff, 1.2);
    rim.position.set(18, 44, -35);
    rim.target.position.set(0, 31, 0);
    const hero = new THREE.PointLight(0xffaa55, 0, 6, 2);
    const zone = new THREE.PointLight(0xffffff, 0, 16, 2);
    // The pull-back can read all four systems at once, each with its own
    // light. The stronger travelling zone light still chooses the subject.
    const stages = [
      [GATE_X + 1.5, GATE_Y + 1.8, -4, 0xffa044],
      [DISH.x, DISH.y + 2.6, -6.5, 0x557eff],
      [1, 31.1, -3.2, 0x7eb77c],
      [EDGE.x - 2, 25.6, EDGE.z - 2, 0xf45525],
      [...corner(-0.7, 2.2, 0.9).toArray(), 0xffc27c],
    ].map(([x, y, z, color]) => {
      const l = new THREE.PointLight(color, 0, 19, 2);
      l.position.set(x, y, z);
      return l;
    });
    this.scene.add(hemi, key, key.target, fill, fill.target, rim, rim.target, hero, zone, ...stages);
    this.lights = { hemi, key, fill, rim, hero, zone, stages };

    this.hall = buildHall(opts.phone);
    this.scene.add(this.hall.group);
    this.scene.add(this.shade.mesh);
    this.pre.add(new THREE.Mesh(this.hall.stoneMesh.geometry, depthMaterial(null)));

    // THE OLD MACHINE.
    const o = buildOld(this.L);
    const otex = o.kit.texture();
    const iron = ironMaterial(otex);
    // Open formed-metal surfaces need their inside as well as their outside.
    // Keep solid frame geometry one-sided; give only bowls/funnels this material.
    const sheet = ironMaterial(otex);
    sheet.side = THREE.DoubleSide;
    const olight = lightMaterial(otex);
    const cloth = clothMaterial(otex);
    for (const [bucket, mat] of [
      ["iron", iron],
      ["sheet", sheet],
      ["light", olight],
      ["cloth", cloth],
    ] as const) {
      const g = o.kit.geometry(bucket);
      if (!g) continue;
      const mesh = new THREE.Mesh(g, mat);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      this.pre.add(new THREE.Mesh(g, depthMaterial(otex, mat.side)));
    }
    for (const l of o.rig.labels) this.scene.add(l.mesh);
    this.old = { kit: o.kit, rig: o.rig, mats: [iron, sheet, olight, cloth] };
    this.owner = new Owner(o.rig.corner);
    // Which pieces stay (the owner's desk, chair and lamp), and each one's fall.
    this.keep = new Uint8Array(o.kit.pieces.length);
    this.lit = new Uint8Array(o.kit.pieces.length);
    for (const p of [...o.rig.tubes, ...o.rig.faults.map((x) => x.p), o.rig.door]) this.lit[p.id] = 1;
    this.tear = new Float32Array(o.kit.pieces.length * TS);
    this.contact = new Float32Array(o.kit.pieces.length).fill(-1);
    this.pieceBounds = new Float32Array(o.kit.pieces.length * 6);
    const minima = new Float32Array(o.kit.pieces.length * 3).fill(Infinity);
    const maxima = new Float32Array(o.kit.pieces.length * 3).fill(-Infinity);
    for (const bucket of o.kit.buckets.values()) for (let v = 0; v < bucket.piece.length; v++) {
      const pieceId = bucket.piece[v];
      const id = pieceId * 3;
      for (let axis = 0; axis < 3; axis++) {
        minima[id + axis] = Math.min(minima[id + axis], bucket.pos[v * 3 + axis]);
        maxima[id + axis] = Math.max(maxima[id + axis], bucket.pos[v * 3 + axis]);
      }
    }
    for (const p of o.kit.pieces) for (let axis = 0; axis < 3; axis++) {
      const id = p.id * 3 + axis;
      const pivot = p.pivot.getComponent(axis);
      this.pieceBounds[p.id * 6 + axis] = (minima[id] + maxima[id]) / 2 - pivot;
      this.pieceBounds[p.id * 6 + 3 + axis] = (maxima[id] - minima[id]) / 2;
    }
    let s = 99;
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    // The desk, its lamp and the owner stay through the turn; the windlass goes.
    for (const p of o.kit.pieces) if (["desk", "shade", "chair", "laptop", "lid", "owner"].includes(p.tag) || p === o.rig.bulb) this.keep[p.id] = 1;
    this.planTear(o.kit, r);
    const crank = o.kit.pieces.find((p) => p.tag === "crank");
    this.windlassT0 = crank ? this.tear[crank.id * TS] : TEAR_P0;
    this.windlass = crank ?? null;
    this.windlassLip = crank ? this.windlassT0 + this.tear[crank.id * TS + 11] / SLOMO : TEAR_P0;

    // THE NEW MACHINE.
    const n = buildNew(this.L);
    const ntex = n.kit.texture();
    const glass = glassMaterial(ntex);
    const core = coreMaterial(ntex);
    const chrome = chromeMaterial(ntex);
    const nlight = lightMaterial(ntex);
    for (const [bucket, mat, order] of [
      ["chrome", chrome, 0],
      ["core", core, 0],
      ["light", nlight, 0],
      ["glass", glass, 5],
    ] as const) {
      const g = n.kit.geometry(bucket);
      if (!g) continue;
      const mesh = new THREE.Mesh(g, mat);
      mesh.frustumCulled = false;
      mesh.renderOrder = order;
      this.scene.add(mesh);
      // The glass is light added over the frame: it writes no depth.
      if (bucket !== "glass") this.pre.add(new THREE.Mesh(g, depthMaterial(ntex, mat.side)));
    }
    this.nw = { kit: n.kit, rig: n.rig, mats: [glass, core, chrome, nlight] };
    this.ringPow = new Float32Array(this.L.lanes.length);

    // The claws' cables (they stretch, so they are drawn on their own).
    this.cables = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x24211c, metalness: 0.6, roughness: 0.6 }), 4);
    this.cables.frustumCulled = false;
    this.scene.add(this.cables);

    // Rust that flakes off as it comes apart.
    const nf = opts.phone ? 380 : 1100;
    this.flakes = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.09, 0.055),
      new THREE.MeshStandardMaterial({ color: 0x5a2410, roughness: 0.95, metalness: 0.2, side: THREE.DoubleSide }),
      nf
    );
    this.flakes.frustumCulled = false;
    this.flakes.count = 0;
    this.scene.add(this.flakes);
    this.flakeData = new Float32Array(nf * 8);
    const ib = o.kit.buckets.get("iron")!;
    for (let i = 0; i < nf; i++) {
      const v = Math.floor(r() * (ib.pos.length / 3));
      const pid = ib.piece[v];
      const k = i * 8;
      this.flakeData[k] = ib.pos[v * 3];
      this.flakeData[k + 1] = ib.pos[v * 3 + 1];
      this.flakeData[k + 2] = ib.pos[v * 3 + 2];
      this.flakeData[k + 3] = this.tear[pid * TS] - 0.06 + r() * 0.1;
      this.flakeData[k + 4] = (r() - 0.5) * 2.2;
      this.flakeData[k + 5] = r() * 1.4;
      this.flakeData[k + 6] = (r() - 0.5) * 2.2;
      this.flakeData[k + 7] = r() * 6.28;
    }

    // Sparks where it breaks.
    const ns = opts.phone ? 160 : 420;
    this.sparks = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false }), ns);
    this.sparks.frustumCulled = false;
    this.sparks.count = 0;
    this.scene.add(this.sparks);
    this.sparkData = new Float32Array(ns * 8);
    const sc = new THREE.Color();
    for (let i = 0; i < ns; i++) {
      const p = o.kit.pieces[Math.floor(r() * o.kit.pieces.length)];
      const k = i * 8;
      this.sparkData[k] = p.pivot.x + (r() - 0.5) * p.size * 0.6;
      this.sparkData[k + 1] = p.pivot.y + (r() - 0.5) * 0.6;
      this.sparkData[k + 2] = p.pivot.z + (r() - 0.5) * 0.6;
      this.sparkData[k + 3] = this.tear[p.id * TS] + r() * 0.05;
      this.sparkData[k + 4] = (r() - 0.5) * 9;
      this.sparkData[k + 5] = r() * 6;
      this.sparkData[k + 6] = (r() - 0.5) * 9;
      this.sparkData[k + 7] = 0.25 + r() * 0.6;
      sc.setRGB(5 + r() * 3, 2.2 + r() * 1.5, 0.6 + r() * 0.5);
      this.sparks.setColorAt(i, sc);
    }

    // THE CUSTOMERS.
    // Enough customers that the lost ones fall as rivers of light. The rebuilt
    // machine takes them in no faster than its one chute carries them on
    // (nSpawn: no queue at its gates; measured: at a new customer per lane
    // every second, the lanes jam within a minute and a half).
    const tune: Tune = opts.phone
      ? { spawn: 0.9, gatePeriod: 1.7, gateOpen: 0.5, valve: 2.2, clawCycle: 3.6, slip: 0.22, nSpawn: 2.4 }
      : { spawn: 0.62, gatePeriod: 1.6, gateOpen: 0.5, valve: 2.0, clawCycle: 3.4, slip: 0.22, nSpawn: 2.0 };
    this.sim = new Sim(this.L, opts.phone ? 420 : 900, tune);
    this.marbles = new Marbles(this.sim.n, this.sim.lakeMax, opts.phone ? 1 : 2);
    this.waveK = new Float32Array(this.sim.n);
    this.going = new Uint8Array(this.sim.n);
    {
      const L = this.L;
      const lane = L.lanes[0].track.length;
      const turb = L.TURB.r * 0.92 * Math.PI * 0.9;
      this.route = { lane, chute: L.nchute.length, turb, channel: L.channel.length, total: lane + L.nchute.length + turb + L.channel.length + L.loop.length };
    }
    for (const obj of this.marbles.objects()) this.scene.add(obj);

    const samples = opts.quality === 0 ? 0 : 4;
    this.post = new Post(samples, opts.phone ? 5 : 6);
  }

  /** A small, dark room for reflections, with a few soft strips of light. */
  private makeEnv() {
    const pm = new THREE.PMREMGenerator(this.renderer);
    const room = new THREE.Scene();
    const box = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 20), new THREE.MeshBasicMaterial({ color: 0x0c0b0a, side: THREE.BackSide }));
    room.add(box);
    const strip = (x: number, y: number, z: number, w: number, h: number, c: THREE.ColorRepresentation, k: number, ry = 0) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      (m.material as THREE.MeshBasicMaterial).color.multiplyScalar(k);
      m.position.set(x, y, z);
      m.rotation.y = ry;
      m.lookAt(0, 0, 0);
      room.add(m);
    };
    strip(-6, 4.5, -8, 6, 1.0, 0xffd6a8, 2.2);
    strip(7, 3, -6, 1.2, 5, 0xa8c4ff, 1.4);
    strip(0, 5.8, 4, 10, 0.6, 0xffffff, 1.2);
    strip(-8, 1, 6, 1.5, 4, 0xffb27a, 0.8);
    const rt = pm.fromScene(room, 0.03);
    pm.dispose();
    return rt.texture;
  }

  /**
   * Plan the teardown (see TS): when each piece lets go and how hard it is
   * punched down, how it spins, where it lands and in which pose, and how
   * high the pile under it already is. Pieces land in order onto a height
   * field of the pit (0.5 m cells) built from points on their own surfaces,
   * so the wreck stacks: nothing sinks into the floor or into what fell
   * before it. A piece that would cross the hall's floor outside the pit on
   * its way down drifts in earlier; the windlass, on the floor at the corner,
   * is dragged across it by its chain and goes over the lip.
   */
  private planTear(kit: Kit, r: () => number) {
    const T = this.tear;
    const B = this.pieceBounds;
    const pieces = kit.pieces;
    const n = pieces.length;
    const FLOOR = FLOOR_LEVEL;
    const CELL = 0.5;

    // 1. Each piece's shape: the spread of its vertices about their mean (its
    // thinnest direction is the one it ends up lying on), and its reach.
    const S = new Float64Array(n * 10);
    const reach = new Float32Array(n);
    for (const b of kit.buckets.values())
      for (let v = 0; v < b.piece.length; v++) {
        const id = b.piece[v];
        if (this.keep[id]) continue;
        const pv = pieces[id].pivot;
        const x = b.pos[v * 3] - pv.x;
        const y = b.pos[v * 3 + 1] - pv.y;
        const z = b.pos[v * 3 + 2] - pv.z;
        const o = id * 10;
        S[o]++;
        S[o + 1] += x;
        S[o + 2] += y;
        S[o + 3] += z;
        S[o + 4] += x * x;
        S[o + 5] += y * y;
        S[o + 6] += z * z;
        S[o + 7] += x * y;
        S[o + 8] += x * z;
        S[o + 9] += y * z;
        reach[id] = Math.max(reach[id], Math.hypot(x, y, z));
      }

    // 2. Its pose on the pile, and the turn that takes it there.
    const UP = V(0, 1, 0);
    const e = new THREE.Vector3();
    const qa = new THREE.Quaternion();
    const qb = new THREE.Quaternion();
    const qt = new THREE.Quaternion();
    const QS = new Float32Array(n * 4);
    for (const p of pieces) {
      if (this.keep[p.id]) continue;
      const k = p.id * TS;
      // The front reaches it, and punches it down.
      const tw = Math.sqrt((2 * Math.max(0, TEAR_TOP - p.pivot.y)) / (FRONT * GRAV));
      T[k] = TEAR_P0 + tw / SLOMO + r() * 0.012;
      T[k + 1] = KICK * FRONT * GRAV * tw;
      // Broad side down: its thinnest direction up, turned about the vertical
      // as little as it can be (of the two ways up, the nearer one).
      const o = p.id * 10;
      const c = Math.max(1, S[o]);
      const mx = S[o + 1] / c, my = S[o + 2] / c, mz = S[o + 3] / c;
      thinnest(
        S[o + 4] / c - mx * mx, S[o + 5] / c - my * my, S[o + 6] / c - mz * mz,
        S[o + 7] / c - mx * my, S[o + 8] / c - mx * mz, S[o + 9] / c - my * mz, e
      );
      const cand = [qa, qb];
      for (let i = 0; i < 2; i++) {
        const q = cand[i].setFromUnitVectors(i === 0 ? e : e.clone().negate(), UP);
        q.premultiply(qt.setFromAxisAngle(UP, 2 * Math.atan2(-q.y, q.w)));
      }
      const near = Math.abs(qa.w) >= Math.abs(qb.w) ? 0 : 1;
      // Some mid-sized pieces land on their other face (half a turn on the way down).
      const flip = p.size >= 1.2 && p.size < 6 && r() < 0.35;
      const qs = cand[flip ? 1 - near : near];
      // A turn about the vertical as well, so nothing drops like a lift.
      qs.premultiply(qt.setFromAxisAngle(UP, (r() - 0.5) * (p.size > 6 ? 0.8 : 1.6)));
      if (qs.w < 0) qs.set(-qs.x, -qs.y, -qs.z, -qs.w);
      qs.toArray(QS, p.id * 4);
      const phi = 2 * Math.acos(Math.min(1, qs.w));
      const sh = Math.sin(phi / 2);
      if (sh > 1e-4) e.set(qs.x / sh, qs.y / sh, qs.z / sh);
      else e.set(r() - 0.5, 0, r() - 0.5).normalize();
      // Small pieces tumble on the way down; large ones only turn into their pose.
      const turns = p.size < 0.8 ? 2 : p.size < 2.5 ? 1 : 0;
      T[k + 6] = e.x;
      T[k + 7] = e.y;
      T[k + 8] = e.z;
      T[k + 9] = phi + turns * Math.PI * 2;
    }

    // 3. Its footprint in that pose: the bottom and top of it over each 0.5 m
    // cell, from points on its surface (every 0.45 m on each triangle).
    const W = new Int32Array(n);
    const grids: (Float32Array | null)[] = pieces.map((p) => {
      if (this.keep[p.id]) return null;
      const w = Math.ceil(reach[p.id] / CELL) + 1;
      W[p.id] = w;
      const g = new Float32Array((2 * w + 1) * (2 * w + 1) * 2);
      for (let i = 0; i < g.length; i += 2) {
        g[i] = Infinity;
        g[i + 1] = -Infinity;
      }
      return g;
    });
    const lowest = new Float32Array(n).fill(Infinity);
    for (const b of kit.buckets.values()) {
      const pos = b.pos;
      const idx = b.index;
      for (let t = 0; t < idx.length; t += 3) {
        const id = b.piece[idx[t]];
        const g = grids[id];
        if (!g) continue;
        const i0 = idx[t] * 3;
        const i1 = idx[t + 1] * 3;
        const i2 = idx[t + 2] * 3;
        const pv = pieces[id].pivot;
        const qx = QS[id * 4], qy = QS[id * 4 + 1], qz = QS[id * 4 + 2], qw = QS[id * 4 + 3];
        const w = W[id];
        const span = 2 * w + 1;
        const ax = pos[i0] - pv.x, ay = pos[i0 + 1] - pv.y, az = pos[i0 + 2] - pv.z;
        const bx = pos[i1] - pos[i0], by = pos[i1 + 1] - pos[i0 + 1], bz = pos[i1 + 2] - pos[i0 + 2];
        const cx = pos[i2] - pos[i0], cy = pos[i2 + 1] - pos[i0 + 1], cz = pos[i2 + 2] - pos[i0 + 2];
        const nb = Math.max(1, Math.ceil(Math.hypot(bx, by, bz) / 0.45));
        const nc = Math.max(1, Math.ceil(Math.hypot(cx, cy, cz) / 0.45));
        for (let i = 0; i <= nb; i++)
          for (let j = 0; j <= nc; j++) {
            const u = i / nb;
            const v = j / nc;
            if (u + v > 1.0001) continue;
            const x = ax + bx * u + cx * v;
            const y = ay + by * u + cy * v;
            const z = az + bz * u + cz * v;
            // Rotated by the pose (q v q*).
            const ix = qw * x + qy * z - qz * y;
            const iy = qw * y + qz * x - qx * z;
            const iz = qw * z + qx * y - qy * x;
            const iw = -qx * x - qy * y - qz * z;
            const rx = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            const ry = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            const rz = iz * qw + iw * -qz + ix * -qy - iy * -qx;
            const ci = Math.min(span - 1, Math.max(0, Math.floor(rx / CELL) + w));
            const cj = Math.min(span - 1, Math.max(0, Math.floor(rz / CELL) + w));
            const gi = (ci * span + cj) * 2;
            if (ry < g[gi]) g[gi] = ry;
            if (ry > g[gi + 1]) g[gi + 1] = ry;
            if (ry < lowest[id]) lowest[id] = ry;
          }
      }
    }

    // 4. Each piece's footprint as a list, its length on the ground, and where it heads.
    const kickY = (tau: number, v0: number) => -v0 * (tau - T_KICK * (1 - Math.exp(-tau / T_KICK))) - 0.5 * GRAV * tau * tau;
    /** When the pivot, falling, comes down to height y. */
    const solveTau = (p: Piece, y: number, mode: number) => {
      const k = p.id * TS;
      const fall = p.pivot.y - y;
      if (mode === 2) return T[k + 11] + Math.sqrt((2 * Math.max(0, fall)) / GRAV);
      let a0 = 0;
      let a1 = 12;
      for (let j = 0; j < 36; j++) {
        const mid = (a0 + a1) / 2;
        if (kickY(mid, T[k + 1]) > -fall) a0 = mid;
        else a1 = mid;
      }
      return a1;
    };
    type Plan = {
      id: number;
      mode: number;
      /** Per footprint cell: di, dj (from the pivot's cell), bottom, top (relative to the pivot). */
      cells: Float32Array;
      /** Each cell's distance along the piece's length (u), for leaning. */
      su: Float32Array;
      ux: number;
      uz: number;
      lean: boolean;
      reach0: number;
      turns: number;
    };
    const plans: Plan[] = [];
    for (const p of pieces) {
      const g = grids[p.id];
      if (!g) continue;
      const k = p.id * TS;
      const o = p.id * 6;
      const w = W[p.id];
      const span = 2 * w + 1;
      const list: number[] = [];
      let sx = 0, sz = 0, sxx = 0, szz = 0, sxz = 0;
      for (let ci = 0; ci < span; ci++)
        for (let cj = 0; cj < span; cj++) {
          const gi = (ci * span + cj) * 2;
          if (g[gi] === Infinity) continue;
          list.push(ci - w, cj - w, g[gi], g[gi + 1]);
          const x = ci - w + 0.5;
          const z = cj - w + 0.5;
          sx += x;
          sz += z;
          sxx += x * x;
          szz += z * z;
          sxz += x * z;
        }
      // Its length on the ground (the footprint's long direction).
      const m = list.length / 4;
      const cxx = sxx / m - (sx / m) ** 2;
      const czz = szz / m - (sz / m) ** 2;
      const cxz = sxz / m - (sx / m) * (sz / m);
      const ang = 0.5 * Math.atan2(2 * cxz, cxx - czz);
      const ux = Math.cos(ang);
      const uz = Math.sin(ang);
      const su = new Float32Array(m);
      let ext = 0;
      for (let i = 0; i < m; i++) {
        su[i] = ((list[i * 4] + 0.5) * ux + (list[i * 4 + 1] + 0.5) * uz) * CELL;
        ext = Math.max(ext, Math.abs(su[i]));
      }
      // On the floor at the corner (the windlass and its chain): dragged to the lip.
      const bcx = p.pivot.x + B[o];
      const bcz = p.pivot.z + B[o + 2];
      const reach0 = Math.hypot(bcx, bcz) + Math.hypot(B[o + 3], B[o + 5]);
      const bottom = p.pivot.y + B[o + 1] - B[o + 4];
      const mode = reach0 > PIT_R - 0.3 && bottom > FLOOR - 0.5 && bottom < FLOOR + 2.5 ? 2 : 0;
      T[k + 10] = mode;
      if (mode === 2) {
        const d = Math.hypot(bcx, bcz);
        T[k + 17] = -bcx / d;
        T[k + 18] = -bcz / d;
        T[k + 12] = 5;
        T[k + 11] = Math.sqrt((2 * Math.max(0.2, reach0 - (PIT_R - 0.35))) / 5);
        T[k + 1] = 0;
      } else {
        // Where it was, spread outward and scattered, inside the pit.
        let rho = 0;
        for (let i = 0; i < list.length; i += 4) rho = Math.max(rho, Math.hypot(Math.abs(list[i]) + 1, Math.abs(list[i + 1]) + 1) * CELL);
        const sp = 1.1 + 0.6 * r();
        const ra = r() * Math.PI * 2;
        const rl = 5 * Math.sqrt(r());
        let lx = p.pivot.x * sp + Math.cos(ra) * rl;
        let lz = p.pivot.z * sp + Math.sin(ra) * rl;
        const lim = Math.max(0, PIT_R - 0.35 - rho);
        const lr = Math.hypot(lx, lz);
        if (lr > lim) {
          lx *= lim / lr;
          lz *= lim / lr;
        }
        T[k + 3] = lx;
        T[k + 4] = lz;
      }
      const turns = p.size < 0.8 ? 2 : p.size < 2.5 ? 1 : 0;
      plans.push({ id: p.id, mode, cells: new Float32Array(list), su, ux, uz, lean: ext > 1.2, reach0, turns });
    }

    // 5. Land them on the pile (a height field of the pit). A long piece
    // leans as it comes to rest: of the tilts along its length (up to 14°),
    // the one that brings its middle lowest while every part of it stays
    // on or above what is already there (it rests on the highest things under
    // it, an end down on the floor or across the others, never balanced on a
    // corner in the air or sunk into them).
    const N = 84;
    const OFF = 21;
    const H = new Float32Array(N * N).fill(PIT_Y);
    const under = new Float32Array(4096);
    const snap = (x: number) => Math.round((x + OFF) / CELL) * CELL - OFF;
    const rest = { y: 0, th: 0, low: 0 };
    const restOn = (pl: Plan, lx: number, lz: number) => {
      const i0 = Math.round((lx + OFF) / CELL);
      const j0 = Math.round((lz + OFF) / CELL);
      const c = pl.cells;
      const m = c.length / 4;
      const need = m <= under.length ? under : new Float32Array(m);
      for (let i = 0; i < m; i++) {
        const ci = Math.min(N - 1, Math.max(0, i0 + c[i * 4]));
        const cj = Math.min(N - 1, Math.max(0, j0 + c[i * 4 + 1]));
        need[i] = H[ci * N + cj];
      }
      // The pivot's height resting at tilt th, and its middle's height.
      const at = (th: number) => {
        const cs = Math.cos(th);
        const sn = Math.sin(th);
        let y = -Infinity;
        let mid = 0;
        for (let i = 0; i < m; i++) {
          y = Math.max(y, need[i] - (c[i * 4 + 2] * cs + pl.su[i] * sn));
          mid += (0.5 * (c[i * 4 + 2] + c[i * 4 + 3])) * cs + pl.su[i] * sn;
        }
        rest.y = y;
        return y + mid / m;
      };
      let th = 0;
      if (pl.lean) {
        let a = -0.25;
        let b = 0.25;
        for (let j = 0; j < 28; j++) {
          const m1 = a + (b - a) / 3;
          const m2 = b - (b - a) / 3;
          if (at(m1) < at(m2)) b = m2;
          else a = m1;
        }
        th = (a + b) / 2;
        // Flat, if lying flat is (nearly) as low.
        const lean = at(th);
        if (at(0) <= lean + 0.02) th = 0;
      }
      at(th);
      const cs = Math.cos(th);
      const sn = Math.sin(th);
      let low = Infinity;
      for (let i = 0; i < m; i++) low = Math.min(low, c[i * 4 + 2] * cs + pl.su[i] * sn);
      rest.th = th;
      rest.low = low;
      return rest.y;
    };
    // Does it cross the hall's floor outside the pit on the way down?
    const clear = (p: Piece, pl: Plan, tauS: number, mode: number, tauH: number, lx: number, lz: number) => {
      const k = p.id * TS;
      const o = p.id * 6;
      const allow = Math.max(PIT_R - 0.15, pl.reach0 + 0.05);
      const sS = spinS(tauS);
      e.set(T[k + 6], T[k + 7], T[k + 8]);
      for (let tau = 0.04; tau < tauS; tau += 0.04) {
        qt.setFromAxisAngle(e, sS > 0 ? (T[k + 9] * spinS(tau)) / sS : 0);
        const yc = p.pivot.y + kickY(tau, T[k + 1]);
        if (yc + lowOf(qt, B, o) > FLOOR + 0.05) continue;
        const g = mode === 1 ? smoother(tau / tauH) : pushG(tau, tauS);
        const px = p.pivot.x + (lx - p.pivot.x) * g;
        const pz = p.pivot.z + (lz - p.pivot.z) * g;
        const x = qt.x, y = qt.y, z = qt.z, w = qt.w;
        const R00 = 1 - 2 * (y * y + z * z), R01 = 2 * (x * y - z * w), R02 = 2 * (x * z + y * w);
        const R20 = 2 * (x * z - y * w), R21 = 2 * (y * z + x * w), R22 = 1 - 2 * (x * x + y * y);
        const ccx = R00 * B[o] + R01 * B[o + 1] + R02 * B[o + 2];
        const ccz = R20 * B[o] + R21 * B[o + 1] + R22 * B[o + 2];
        const ex = Math.abs(R00) * B[o + 3] + Math.abs(R01) * B[o + 4] + Math.abs(R02) * B[o + 5];
        const ez = Math.abs(R20) * B[o + 3] + Math.abs(R21) * B[o + 4] + Math.abs(R22) * B[o + 5];
        if (Math.hypot(px + ccx, pz + ccz) + Math.hypot(ex, ez) > allow) return false;
      }
      return true;
    };
    const dragTo = (p: Piece, tauS: number) => {
      const k = p.id * TS;
      const acc = T[k + 12];
      const tl = T[k + 11];
      const d = 0.5 * acc * tl * tl + acc * tl * (tauS - tl) + acc * tl * T_SLIDE;
      T[k + 3] = p.pivot.x + T[k + 17] * d;
      T[k + 4] = p.pivot.z + T[k + 18] * d;
    };
    const qf = new THREE.Quaternion();
    let eased = 0;
    let pulled = 0;
    // Its way down: where it lands (a little out from where it was) and, if
    // flying straight there would cross the hall's floor outside the pit,
    // eased in before it reaches the floor's level (or aimed further in).
    const floorTau = (p: Piece) => {
      const k = p.id * TS;
      for (let tau = 0.04; tau < 12; tau += 0.04) if (p.pivot.y + kickY(tau, T[k + 1]) + B[p.id * 6 + 1] - B[p.id * 6 + 4] < FLOOR + 0.6) return Math.max(0.45, tau);
      return 0.45;
    };
    for (const pl of plans) {
      const p = pieces[pl.id];
      const k = p.id * TS;
      if (pl.mode === 2) continue;
      let lx = snap(T[k + 3]);
      let lz = snap(T[k + 4]);
      let mode = 0;
      const tauG = solveTau(p, PIT_Y - lowest[p.id], 0);
      for (let it = 0; it < 10 && !clear(p, pl, tauG, mode, T[k + 11], lx, lz); it++) {
        if (mode === 0) {
          mode = 1;
          eased++;
          T[k + 11] = floorTau(p);
        } else {
          lx = snap(lx * 0.82);
          lz = snap(lz * 0.82);
          pulled++;
        }
      }
      pl.mode = mode;
      T[k + 3] = lx;
      T[k + 4] = lz;
    }
    // Then they come down together, and each lands on what is already there
    // when it arrives (a time-stepped pass: lower levels, punched down
    // hardest, reach the bottom first; the top of the tower comes down on them).
    let hMax = PIT_Y;
    const land = (pl: Plan, yp: number, tauS: number) => {
      const p = pieces[pl.id];
      const k = p.id * TS;
      const mode = pl.mode;
      const lx = T[k + 3];
      const lz = T[k + 4];
      // Its final pose: the pose on the pile, leant along its length.
      qf.fromArray(QS, p.id * 4).premultiply(qt.setFromAxisAngle(e.set(-pl.uz, 0, pl.ux), rest.th));
      if (qf.w < 0) qf.set(-qf.x, -qf.y, -qf.z, -qf.w);
      const phi = 2 * Math.acos(Math.min(1, qf.w));
      const sh = Math.sin(phi / 2);
      if (sh > 1e-4) e.set(qf.x / sh, qf.y / sh, qf.z / sh);
      else e.set(T[k + 6], T[k + 7], T[k + 8]);
      T[k + 6] = e.x;
      T[k + 7] = e.y;
      T[k + 8] = e.z;
      T[k + 9] = phi + pl.turns * Math.PI * 2;
      // Where its lowest point comes to rest, and how far the box's bottom lies under it.
      T[k + 5] = yp + rest.low;
      T[k + 19] = rest.low - lowOf(qf, B, p.id * 6);
      T[k + 2] = tauS;
      T[k + 10] = mode;
      if (mode === 1) T[k + 11] = Math.min(T[k + 11], tauS);
      this.contact[p.id] = tauS;
      const i0 = Math.round((lx + OFF) / CELL);
      const j0 = Math.round((lz + OFF) / CELL);
      const c = pl.cells;
      const cs = Math.cos(rest.th);
      const sn = Math.sin(rest.th);
      for (let i = 0; i < c.length / 4; i++) {
        const ci = Math.min(N - 1, Math.max(0, i0 + c[i * 4]));
        const cj = Math.min(N - 1, Math.max(0, j0 + c[i * 4 + 1]));
        const hc = yp + c[i * 4 + 3] * cs + pl.su[i] * sn;
        if (hc > H[ci * N + cj]) H[ci * N + cj] = hc;
        if (hc > hMax) hMax = hc;
      }
      // The landing: a hop and a rock, from how fast it hits and spins.
      const tv = tauS - (mode === 2 ? T[k + 11] : 0);
      const vi = mode === 2 ? GRAV * tv : T[k + 1] + GRAV * tauS;
      T[k + 13] = Math.min(2.0, 0.07 * vi) / (1 + 0.12 * p.size);
      const sS = spinS(tv);
      const wi = sS > 0 ? (T[k + 9] * (1 - Math.exp(-SPIN_B * tv))) / sS : 0;
      const hl = Math.hypot(T[k + 6], T[k + 8]);
      T[k + 14] = hl > 0.05 ? T[k + 6] / hl : 1;
      T[k + 15] = hl > 0.05 ? T[k + 8] / hl : 0;
      T[k + 16] = Math.min(0.06, 0.03 * wi) / (1 + 0.15 * p.size);
    };
    const falling = plans.slice().sort((a, b) => T[a.id * TS] - T[b.id * TS]);
    const STEP = 0.004;
    const near: { pl: Plan; y: number }[] = [];
    for (let P = TEAR_P0; falling.length && P < TEAR_P0 + 4; P += STEP) {
      // Those near the pile by the end of this step, lowest first.
      near.length = 0;
      for (const pl of falling) {
        const p = pieces[pl.id];
        const k = p.id * TS;
        if (P < T[k]) break;
        const tau = (P - T[k]) * SLOMO + STEP * SLOMO;
        const tl = pl.mode === 2 ? T[k + 11] : 0;
        const y = p.pivot.y + (pl.mode === 2 ? (tau < tl ? 0 : -0.5 * GRAV * (tau - tl) * (tau - tl)) : kickY(tau, T[k + 1]));
        if (y + lowest[p.id] > hMax + 0.05) continue;
        if (pl.mode === 2) dragTo(p, Math.max(tau, tl));
        near.push({ pl, y });
      }
      near.sort((u, v) => u.y + lowest[u.pl.id] - (v.y + lowest[v.pl.id]));
      for (const { pl, y } of near) {
        const p = pieces[pl.id];
        const k = p.id * TS;
        const lx = snap(T[k + 3]);
        const lz = snap(T[k + 4]);
        T[k + 3] = lx;
        T[k + 4] = lz;
        const i0 = Math.round((lx + OFF) / CELL);
        const j0 = Math.round((lz + OFF) / CELL);
        const c = pl.cells;
        let need = -Infinity;
        for (let i = 0; i < c.length; i += 4) {
          const ci = Math.min(N - 1, Math.max(0, i0 + c[i]));
          const cj = Math.min(N - 1, Math.max(0, j0 + c[i + 1]));
          need = Math.max(need, H[ci * N + cj] - c[i + 2]);
        }
        if (y > need) continue;
        // It lands: at rest (leaning) on what is under it now.
        let tauS = solveTau(p, restOn(pl, lx, lz), pl.mode);
        if (pl.mode === 2) {
          dragTo(p, tauS);
          T[k + 3] = snap(T[k + 3]);
          T[k + 4] = snap(T[k + 4]);
          tauS = solveTau(p, restOn(pl, T[k + 3], T[k + 4]), 2);
        }
        land(pl, rest.y, tauS);
        falling.splice(falling.indexOf(pl), 1);
      }
    }
    // Any left (none should be): onto the pit's floor.
    for (const pl of falling) land(pl, restOn(pl, T[pl.id * TS + 3], T[pl.id * TS + 4]), solveTau(pieces[pl.id], rest.y, pl.mode));
    // With the real fall times, ease in any piece whose straight flight would now cross the floor.
    for (const pl of plans) {
      const p = pieces[pl.id];
      const k = p.id * TS;
      if (pl.mode !== 0 || clear(p, pl, T[k + 2], 0, 0, T[k + 3], T[k + 4])) continue;
      T[k + 10] = 1;
      T[k + 11] = Math.min(T[k + 2], floorTau(p));
      eased++;
    }
    let top = PIT_Y;
    for (let i = 0; i < H.length; i++) top = Math.max(top, H[i]);
    this.tearInfo = { eased, pulled, pile: top - PIT_Y };
  }

  /** When each new piece locks into place (the sound ticks on each). */
  lockTimes() {
    return this.nw.rig.from.map((f) => f.at + f.fly).sort((a, b) => a - b);
  }

  /** Everything that draws, for compiling before the film shows. */
  allMaterials() {
    return [...this.old.mats, ...this.nw.mats, ...this.post.materials()];
  }

  /**
   * Run the crowd ahead, so the machine is already busy when the door opens.
   * What it loses meanwhile is not counted: the counter is what you watched.
   */
  prewarm(seconds: number) {
    const s = this.sim;
    const lost = { ...s.lost };
    const kept = s.kept;
    s.machine = "old";
    s.step(seconds);
    s.events.length = 0;
    s.lost = lost;
    s.kept = kept;
    if (!this.crowd0) this.crowd0 = s.snapshot();
    // The rebuilt machine's crowd, run ahead the same way (long enough for
    // lights all along the route and round the spiral, and the first back at
    // the door), kept for the moment it powers on.
    if (!this.crowdN) {
      const yours = [s.yoursIn, s.yoursLost, s.yoursKept];
      s.clear();
      s.machine = "new";
      s.step(NEW_AHEAD);
      s.events.length = 0;
      this.crowdN = s.snapshot();
      s.clear();
      s.restore(this.crowd0);
      s.machine = "old";
      s.lost = lost;
      s.kept = kept;
      [s.yoursIn, s.yoursLost, s.yoursKept] = yours;
    }
  }

  setSize(w: number, h: number, dpr: number) {
    this.post.setSize(w * dpr, h * dpr);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /* ---- the frame -------------------------------------------------------------- */

  update(f: Frame) {
    const { dt, time, P } = f;
    shared.uTime.value = this.reduced ? 1 : time;
    const look = lookAt(P, this.look);
    shared.uRebuild.value = smooth(range(P, 16.15, 16.85));
    shared.uPit.value = look.pit * (1 - range(P, 15.7, 16.65));
    this.applyLook(look, P, time);

    // Which machine runs, and how fast time is: it all stops at the turn.
    // The rebuilt crowd (run ahead at load) is restored once its whole route
    // is built, and lights up along it as the power comes on (waveAt), so
    // the new machine is busy from its first frame. Going back up through
    // the turn, the old crowd returns inside the black, restored, not re-run.
    const oldUntil = this.machine === "old" ? 14.02 : 14.2;
    const want: "old" | "none" | "new" = P < oldUntil ? "old" : P < 16.85 ? "none" : "new";
    if (want !== this.machine) {
      if (want === "new") {
        // The rebuilt machine is busy from the start: its crowd (run ahead at
        // load) lights up along the route as the power comes on.
        this.sim.clear();
        this.sim.machine = "new";
        if (this.crowdN) this.sim.restore(this.crowdN);
        this.waveT = time;
        this.crowdOut = false;
      } else if (want === "old") {
        this.sim.clear();
        this.sim.machine = "old";
        if (this.crowd0) this.sim.restore(this.crowd0);
        else this.prewarm(60);
        this.crowdOut = false;
      } else {
        // Back from the new machine: its crowd fades away rather than freezing.
        if (this.machine === "new") this.crowdOut = true;
        this.sim.machine = "none";
      }
      this.machine = want;
    }
    this.crowdK = this.crowdOut ? smooth(range(P, 16.55, 16.85)) : 1;
    if (this.crowdOut && this.crowdK <= 0) {
      this.sim.clear();
      this.crowdOut = false;
      this.crowdK = 1;
    }
    let ts = this.reduced ? 0.6 : 1;
    if (P >= 13.98 && P < 16.6) ts = (1 - range(P, 13.98, 14.18)) + 0.16 * range(P, 14.95, 15.25) * (1 - range(P, 16.2, 16.5));
    // The teardown runs down the tower (the collapse front, planTear): the
    // customers still on each level fall with its iron instead of hanging in the air.
    if (this.machine === "none" && P > TEAR_P0 && P < 16.12) {
      // (Punched down as the iron round them is: the front's kick at their height.)
      const s = this.sim;
      const front = tearFront(P);
      let any = false;
      for (let i = 0; i < s.n; i++) {
        const m = s.mode[i];
        this.going[i] = m !== M.FREE && m !== M.FALL && s.pos[i * 3 + 1] >= front ? 1 : 0;
        if (this.going[i]) any = true;
      }
      if (any) {
        s.releaseAbove(front);
        for (let i = 0; i < s.n; i++) {
          if (!this.going[i] || s.mode[i] !== M.FALL) continue;
          const tw = Math.sqrt((2 * Math.max(0, TEAR_TOP - s.pos[i * 3 + 1])) / (FRONT * GRAV));
          s.vel[i * 3 + 1] = -KICK * FRONT * GRAV * tw;
        }
      }
    }
    // While the tower falls, the customers on it fall on the iron's clock (its
    // film seconds per P), not the frozen crowd's: they go down with it.
    const simDt = this.machine === "none" && P > TEAR_P0 && P < 16.2 ? Math.min(0.1, Math.max(0, P - this.prevP) * SLOMO) : dt * ts;
    this.sim.step(simDt);
    this.sim.ageLake(dt * ts);
    this.events = this.sim.events;
    this.sim.events = [];
    // Clear the frozen old customers inside the deliberate white cut. The
    // rebuilt crowd starts only after its complete route is ready to use.
    if (this.machine === "none" && this.prevP < 16.12 && P >= 16.12) this.sim.clear();

    heroAt(P, this.L, this.hero, time);
    shared.uHeroPos.value.copy(this.hero.pos);
    shared.uHeroK.value = this.hero.visible && this.hero.machine === "new" ? 1 : 0;
    this.info.hours = clockAt(P);
    this.info.machine = this.machine;
    this.info.at = this.hero.at;
    this.info.speed = this.hero.speed;
    this.info.heroY = this.hero.pos.y;
    this.info.turn = range(P, 14, 14.2) * (1 - range(P, 16.5, 16.9));

    // The old machine slows with the turn continuously (never a step in its speed).
    this.animateOld(P, dt * (P >= 13.98 && P < 16.6 ? ts : 1), time);
    this.animateNew(P, dt, time);
    this.old.kit.upload();
    this.nw.kit.upload();
    const lm = new THREE.Matrix4();
    for (const l of this.old.rig.labels) {
      l.mesh.matrix.copy(pieceMatrix(l.piece, l.rest, lm));
      l.mesh.visible = l.piece.s > 0.01;
    }

    // Customers. Ours carries a heartbeat in its light (marbles.ts heroBeat),
    // which the iron round it catches too: it can be told from the crowd anywhere.
    const heroK = this.hero.visible ? 1 : 0;
    const beat = this.reduced ? 0 : heroBeat(time);
    this.marbles.update(this.sim, this.hero, heroK, this.crowdK, this.machine === "new" ? this.waveAt(P, time) : null, beat);
    const hl = this.lights.hero;
    if (this.hero.visible) {
      hl.position.copy(this.hero.pos);
      const c = this.hero.col;
      const m = Math.max(c.r, c.g, c.b, 0.001);
      hl.color.setRGB(c.r / m, c.g / m, c.b / m);
      const born = 1.0;
      hl.intensity = 2.2 * m * (this.phone ? 0.8 : 1) * smooth(range(P, born, born + 0.22)) * (1 + 0.35 * beat);
    } else hl.intensity = 0;

    this.flakesAt(P);
    this.shadesAt(P);
    this.cameraAt(P, f);
    this.hoverAt(f);
  }

  render(time: number) {
    // (Reduced motion: the grain holds still.)
    this.post.render(this.renderer, this.scene, this.camera, this.grade, this.reduced ? 1 : time, this.pre);
  }

  private applyLook(look: Look, P: number, time: number) {
    this.fog.color.copy(look.fog);
    this.fog.density = look.fogD * (this.phone ? 0.85 : 1);
    (this.scene.background as THREE.Color).copy(look.fog);
    const L = this.lights;
    L.key.color.copy(look.key);
    L.key.intensity = look.keyK;
    L.key.position.copy(look.keyDir).multiplyScalar(60).add(V(0, 30, 0));
    L.key.target.position.set(0, 30, 0);
    L.fill.color.copy(look.fill);
    L.fill.intensity = look.fillK;
    L.rim.color.copy(look.fill).lerp(new THREE.Color(0.45, 0.68, 1), 0.42);
    L.rim.intensity = (0.9 + look.fillK * 0.8) * (1 - range(P, 25.5, 26.7));
    L.hemi.color.copy(look.sky);
    L.hemi.groundColor.copy(look.ground);
    L.hemi.intensity = look.hemiK * 0.55;
    this.scene.environmentIntensity = look.env;
    const rebuilt = shared.uRebuild.value;
    const lit = (1 - range(P, 14.08, 14.32)) + range(P, 15.1, 15.65);
    const oldColors = [0xffa044, 0x557eff, 0x7eb77c, 0xf45525, 0xffc27c];
    const newColors = [0xa28aff, 0x60dfff, 0x74ddd1, 0xffc85f, 0xffd39b];
    L.stages.forEach((light, i) => {
      light.color.set(oldColors[i]).lerp(new THREE.Color(newColors[i]), rebuilt);
      light.intensity = [7, 9, 11, 5, 5][i] * lit;
      if (i === 4 && P >= SIX.lamp) light.intensity = 0;
    });
    shared.uKey.value.copy(look.key);
    shared.uDust.value = look.dust;
    shared.uWin.value.copy(look.win);
    shared.uWinK.value = look.winK * 0.42;
    (this.hall.pitGlow.material as THREE.ShaderMaterial).uniforms.uK.value = look.pit;
    // The well of red light: as long as the old machine is losing people.
    (this.hall.haze.material as THREE.ShaderMaterial).uniforms.uK.value = (1 - range(P, 14.9, 16.2)) * (0.6 + look.pit);

    // The zone light: whatever lights the part of the machine we are in.
    const z = L.zone;
    const zm = (a: number, b: number) => bump(P, a, b, 0.3);
    // The tubes' light hums, slowly and only a little (nothing that flashes).
    const flick = this.reduced ? 1 : 0.95 + 0.05 * Math.sin(time * 2.1);
    const zones: [number, THREE.Vector3, THREE.Color, number, number][] = [
      [zm(0, 4.7), V(GATE_X - 0.6, GATE_Y + 2.4, 0), new THREE.Color(1, 0.62, 0.3), 14, 14],
      [zm(4.6, 7.3), V(DISH.x + 0.5, DISH.y + 5, DISH.z + 4), new THREE.Color(0.55, 0.7, 1), 22, 16],
      [zm(7.2, 9.7), V(0.4, 32.6, 1.4), new THREE.Color(0.7, 1, 0.6), 55 * flick, 16],
      [zm(9.6, 11.8), V(EDGE.x - 0.2, EDGE.y + 0.55, EDGE.z - 0.2), new THREE.Color(1, 0.45, 0.2), 9, 9],
      [zm(12.2, 14), this.old.rig.corner.lamp, new THREE.Color(1, 0.68, 0.36), 12, 11],
      [zm(16.3, 18.7), V(GATE_X, GATE_Y + 1, 2), new THREE.Color(0.6, 0.5, 1), 22, 16],
      [zm(18.6, 20.4), V(this.L.TURB.x, this.L.TURB.y, this.L.TURB.z + 3), new THREE.Color(0.4, 0.9, 1), 26, 16],
      [zm(20.2, 22), V(0.5, 31, 2), new THREE.Color(0.4, 0.95, 1), 24, 16],
      [zm(21.9, 24.2), V(EDGE.x, 30, 6), new THREE.Color(1, 0.75, 0.35), 30, 24],
      // (At the desk the owner sits under the lamp: its light is a pool on the desk, not a glare on them.)
      [zm(24.0, 25.6), this.deskLight, new THREE.Color(1, 0.68, 0.36), P >= SIX.lamp ? 0 : 3.2, 7],
    ];
    let wsum = 0;
    const pos = V(0, 0, 0);
    const col = new THREE.Color(0, 0, 0);
    let k = 0;
    let dist = 0;
    for (const [w, p, c, inten, d] of zones) {
      if (w <= 0) continue;
      wsum += w;
      pos.addScaledVector(p, w);
      col.r += c.r * w;
      col.g += c.g * w;
      col.b += c.b * w;
      k += inten * w;
      dist += d * w;
    }
    if (wsum > 0) {
      z.position.copy(pos.multiplyScalar(1 / wsum));
      z.color.setRGB(col.r / wsum, col.g / wsum, col.b / wsum);
      z.intensity = k;
      z.distance = dist / wsum;
    } else z.intensity = 0;
    // At the owner's corner the room falls away: less sky and fill, the lamp's
    // own pool, and a stronger rim to separate the figure from the dark.
    const nook = Math.max(bump(P, 11.95, 14.05, 0.25), bump(P, 23.85, 25.75, 0.25));
    if (nook > 0) {
      L.key.intensity *= 1 - 0.6 * nook;
      L.hemi.intensity *= 1 - 0.45 * nook;
      L.fill.intensity *= 1 - 0.4 * nook;
      L.rim.intensity *= 1 + 0.8 * nook;
      const st = L.stages[4];
      st.intensity = st.intensity + (Math.min(st.intensity, 1.6) - st.intensity) * nook;
      st.distance = 19 + (7 - 19) * nook;
    }

    // The grade, and the beats that override it.
    const g = this.grade;
    g.exposure = look.exposure;
    g.bloom = look.bloom;
    g.threshold = look.threshold;
    g.lift.copy(look.lift);
    g.gamma.copy(look.gamma);
    g.gain.copy(look.gain);
    g.sat = look.sat;
    g.shadow.copy(look.shadow);
    g.high.copy(look.high);
    g.split = look.split;
    g.vignette = look.vignette;
    g.grain = look.grain * (this.quality === 0 ? 0.8 : 1);
    g.aberration = look.aberration;
    // Admin: the tubes' flicker reaches the whole frame, a little.
    g.exposure *= 1 - 0.06 * bump(P, 7.3, 9.5, 0.2) * (1 - flick);
    // The turn: down to almost nothing; the white flash; up into the new.
    // (After the hands have let go: the dark takes all but the stopped lights.)
    g.black = 0.92 * range(P, 14.46, 14.7) * (1 - range(P, 14.92, 15.3));
    g.flash = Math.max(0, Math.exp(-Math.pow((P - 16.12) / 0.07, 2)) * 1.0 - 0.0);
    g.flashColor.set(1, 0.99, 0.97);
    g.exposure *= 1 + 0.35 * bump(P, 16.1, 16.6, 0.2);
    // Reduced motion: a quick dip to black between held frames.
    if (this.reduced) {
      const k = (time - this.fadeT) / 0.45;
      if (k >= 0 && k < 1) g.black = Math.max(g.black, 1 - k);
    }
    // The end: the light fills the frame, and settles to paper.
    const end = range(P, 25.85, 26.45);
    g.fill = smooth(end) * (1 - range(P, 26.45, 26.7));
    g.exposure *= 1 + 2.5 * smooth(range(P, 25.85, 26.35));
    g.paper = smooth(range(P, 26.15, 26.65));
    g.grain *= 1 - g.paper;
  }

  /**
   * The rebuilt machine powering on: a front of light runs along the route
   * from the door (lanes, chute, turbine, channel, the spiral), and each
   * customer in it condenses out of the light as it passes (0..1 per
   * customer, for marbles.ts). It follows the scroll, and never takes longer
   * than its own pace; null once it has passed the end.
   */
  private waveAt(P: number, time: number): Float32Array | null {
    const R = this.route;
    const front = Math.max(R.total * smooth(range(P, 16.85, 17.35)), (time - this.waveT) * 110) - 4;
    if (front > R.total + 14) return null;
    const s = this.sim;
    const K = this.waveK;
    const turb = R.lane + R.chute;
    for (let i = 0; i < s.n; i++) {
      const m = s.mode[i];
      const d = m === M.N_LANE ? s.s[i]
        : m === M.N_CHUTE ? R.lane + s.s[i]
        : m === M.N_TURB ? turb + R.turb * Math.min(1, s.t[i] / 0.55)
        : m === M.N_CHANNEL ? turb + R.turb + s.s[i]
        : m === M.N_LOOP ? turb + R.turb + R.channel + s.s[i]
        : 0;
      K[i] = Math.min(1, Math.max(0, (front - d) / 12));
    }
    return K;
  }

  /* ---- the old machine's moving parts, and its end ------------------------------ */

  private animateOld(P: number, dt: number, time: number) {
    // Every piece starts the frame at rest; the moving parts and the fall go on top.
    this.old.kit.rest();
    const R = this.old.rig;
    const sim = this.sim;
    const h = this.hero;
    const q = new THREE.Quaternion();
    const ax = new THREE.Vector3();
    // Gates: lane 0 is ours.
    R.gates.forEach((g, l) => {
      const open = l === 0 ? h.gate : sim.gateH[l] ?? 0;
      g.t.set(0, 0.46 * open, 0);
    });
    // Each drive's pinion rolls on its rack: the rack runs beside it (side, in
    // z), so the pinion turns the way its teeth are pushed, by lift / pitch radius.
    const sides = R.gateSides;
    R.gateDrives.forEach((drive, i) => {
      const lane = i === 0 ? R.gates.length - 1 : 0;
      const lift = R.gates[lane].t.y;
      const side = sides?.[i] ?? 1;
      drive.q.setFromAxisAngle(ax.set(1, 0, 0), (-side * lift) / GATE_RP);
      R.gateRacks[i].t.y = lift;
    });
    // The gauge: our wait, creeping past three seconds; elsewhere, the crowd's.
    const wait = P < 3.98 ? 4.6 * smooth(range(P, 2.72, 3.86)) : 4.6 * (1 - range(P, 3.98, 4.15));
    const idle = 2.6 + 1.6 * Math.sin(time * 0.6) * Math.sin(time * 0.23);
    const sec = P > 2.6 && P < 4.4 ? wait : idle;
    R.needle.q.setFromAxisAngle(ax.set(1, 0, 0), (Math.PI * Math.min(5, sec)) / 5 - Math.PI / 2);
    // The wheel of hours: noon has the sun at the top.
    const hours = clockAt(Math.min(P, 14.0));
    const wa = ((hours - 12) / 24) * Math.PI * 2;
    q.setFromAxisAngle(ax.set(0, 0, 1), wa);
    for (const w of R.wheel) w.q.copy(q);
    R.sun.q.copy(q);
    R.moon.q.copy(q);
    // The hatch.
    const ha = Math.max(sim.hatch, h.hatch);
    R.hatch.q.setFromAxisAngle(ax.set(0, 0, 1), -1.25 * ha);
    // Claws: ours on the front rail, the crowd's on the back. The head hangs
    // from the trolley on its cable, a pendulum: its swing (radians, from the
    // claw's state; 0 when it has none) turns the head and its fingers about
    // the cable's top, so the load lags and overruns the trolley.
    const sw = new THREE.Quaternion();
    const top = new THREE.Vector3();
    const arm = new THREE.Vector3();
    R.claws.forEach((c) => {
      const s = c.rail === "front" ? h.claw[c.from] : sim.claw[c.from];
      const x = s.x;
      const drop = s.drop;
      c.trolley.t.set(x - c.restX, 0, 0);
      sw.setFromAxisAngle(ax.set(0, 0, 1), swingOf(s));
      // Ours: when it has hold of our customer off the rail's line (lifting it
      // out of its place in a tray, setting it down), the cable leans to it.
      if (c.rail === "front" && h.machine === "old") {
        const arm = drop + 0.38;
        const dz = h.pos.z - GANTRY_Z.front;
        const gx = x + arm * Math.sin(swingOf(s));
        const gy = GANTRY_Y - arm * Math.cos(swingOf(s));
        const held = (1 - smooth(range(s.open, 0.3, 0.9))) * (1 - range(Math.hypot(h.pos.x - gx, h.pos.y - gy), 0.15, 0.3));
        if (held > 0 && Math.abs(dz) > 1e-4) sw.multiply(_q1.setFromAxisAngle(ax.set(1, 0, 0), -held * Math.asin(Math.max(-0.5, Math.min(0.5, dz / arm)))));
      }
      top.set(c.restX, GANTRY_Y, GANTRY_Z[c.rail]);
      const hang = (p: Piece) => {
        // Lowered by the drop, turned about the cable's top, carried by the trolley.
        arm.set(p.pivot.x - top.x, p.pivot.y - (drop - 1) - top.y, p.pivot.z - top.z).applyQuaternion(sw);
        p.t.set(arm.x + top.x - p.pivot.x + x - c.restX, arm.y + top.y - p.pivot.y, arm.z + top.z - p.pivot.z);
      };
      hang(c.head);
      c.head.q.copy(sw);
      for (let k = 0; k < c.fingers.length; k++) {
        const f = c.fingers[k];
        const a = (k / 3) * Math.PI * 2;
        hang(f);
        // Open: each finger swings out about its hinge.
        f.q.setFromAxisAngle(ax.set(-Math.sin(a), 0, Math.cos(a)), -0.55 * s.open).premultiply(sw);
      }
    });
    // The stamp: its head comes right down onto our customer in the tray.
    for (const s of R.stamp) s.t.set(0, -STAMP_TRAVEL * h.stamp, 0);
    // The tubes flicker; one of them badly.
    // The tubes hum; one is failing (slowly: a small light, never a strobe).
    R.tubes.forEach((t, i) => {
      let p = this.reduced ? 1 : 0.92 + 0.08 * Math.sin(time * (1.3 + i * 0.4) + i);
      if (!this.reduced && i === 3 && Math.sin(time * 0.9) > 0.55 && Math.sin(time * 12.5) > 0.2) p = 0.25;
      t.power = p;
    });
    // The owner turns the windlass (owner.ts): the tower's gears, pumps and weights follow it.
    this.owner.update(P, dt, time, this.reduced);
    this.crankA = this.owner.theta / 1.6;
    turnTrain(R, this.owner.wound);
    R.pumps.forEach(({ piston, cam, rod, rodDir, phase }) => {
      const angle = this.crankA * 1.6 + phase;
      const dx = Math.cos(angle) * 0.29;
      const pin = cam.pivot.clone().add(V(dx, Math.sin(angle) * 0.29, 0.3));
      const head = V(piston.pivot.x, pin.y - Math.sqrt(0.68 * 0.68 - dx * dx), pin.z);
      piston.t.y = head.y - (piston.pivot.y + 0.6);
      cam.q.setFromAxisAngle(ax.set(0, 0, 1), angle);
      rod.t.copy(head).sub(rod.pivot);
      rod.q.setFromUnitVectors(rodDir, pin.sub(head).normalize());
    });
    R.counterweights.forEach((weight, i) => {
      weight.t.y = this.reduced ? 0 : Math.sin(this.crankA * 1.6 + i * 0.8) * 0.1;
      weight.q.setFromAxisAngle(ax.set(0, 0, 1), this.reduced ? 0 : Math.sin(this.crankA * 0.8 + i) * 0.008);
    });
    const stageTimes = [[2.3, 4.7], [4.6, 7.3], [7.2, 9.7], [9.6, 13.9]];
    R.faults.forEach(({ p, stage }) => {
      const [a, b] = stageTimes[stage];
      const active = bump(P, a, b, 0.3);
      // A slow warning breath, never a flashing alarm. Each one reveals
      // where the leak currently lives in the larger machine.
      p.power = 0.28 + active * (this.reduced ? 0.9 : 0.72 + 0.22 * Math.sin(time * 1.5));
    });
    this.lampOff = this.owner.lampOff;
    R.door.power = 1;

    // THE TURN: everything trembles, then comes apart down the tower in slow
    // motion (planTear): each piece from where it was, spinning up from rest,
    // onto the pile, flat, with a hop and a rock.
    const T = this.tear;
    const B = this.pieceBounds;
    const tremor = range(P, 14.82, 14.98) * (1 - range(P, 15.1, 15.5));
    for (const p of this.old.kit.pieces) {
      if (this.keep[p.id]) continue;
      const k = p.id * TS;
      const t0 = T[k];
      // A light on a piece that breaks away dies as it goes (a flicker, then
      // out), instead of glowing on in the debris.
      const out = P < t0 ? 1 : Math.max(0, 1 - (P - t0) * 9) * (0.75 + 0.25 * Math.sin((P - t0) * 140));
      p.power = (this.lit[p.id] ? p.power : 1) * out;
      p.glow = 0;
      if (P < t0) {
        // The shock at the top, then each level shakes harder as the collapse comes down to it.
        const shake = Math.max(0.5 * tremor, smooth(range(P, t0 - 0.1, t0 - 0.015))) * range(t0 - P, 0, 0.015);
        if (shake > 0 && !this.reduced) {
          const j = 0.025 * shake;
          p.t.x += Math.sin(time * 41 + p.id) * j;
          p.t.y += Math.sin(time * 37 + p.id * 1.7) * j;
        }
        continue;
      }
      const tau = (P - t0) * SLOMO;
      const mode = T[k + 10];
      const tauS = T[k + 2];
      const tl = mode === 2 ? T[k + 11] : 0;
      // The spin builds from rest and brings it round into its pose on the pile.
      const tv = Math.min(tau, tauS) - tl;
      const sS = spinS(tauS - tl);
      _ax.set(T[k + 6], T[k + 7], T[k + 8]);
      _q0.setFromAxisAngle(_ax, tv > 0 && sS > 0 ? (T[k + 9] * spinS(tv)) / sS : 0).multiply(p.q);
      // Sideways: pushed off and flying on (or eased in, or dragged to the lip).
      const sx = p.pivot.x + p.t.x;
      const sz = p.pivot.z + p.t.z;
      let X: number;
      let Z: number;
      if (mode === 2) {
        const acc = T[k + 12];
        const d = tau < tl ? 0.5 * acc * tau * tau
          : tau < tauS ? 0.5 * acc * tl * tl + acc * tl * (tau - tl)
          : 0.5 * acc * tl * tl + acc * tl * (tauS - tl) + acc * tl * T_SLIDE * (1 - Math.exp(-(tau - tauS) / T_SLIDE));
        X = sx + T[k + 17] * d;
        Z = sz + T[k + 18] * d;
      } else {
        const g = mode === 1 ? smoother(tau / T[k + 11]) : pushG(tau, tauS);
        X = sx + (T[k + 3] - sx) * g;
        Z = sz + (T[k + 4] - sz) * g;
      }
      const base = T[k + 5];
      let Y: number;
      if (tau < tauS) {
        const fall = mode === 2
          ? tau < tl ? 0 : -0.5 * GRAV * (tau - tl) * (tau - tl)
          : -T[k + 1] * (tau - T_KICK * (1 - Math.exp(-tau / T_KICK))) - 0.5 * GRAV * tau * tau;
        Y = p.pivot.y + p.t.y * (1 - smooth(tau / tauS)) + fall;
        // An end that reaches the pile first holds it up while it comes over.
        Y = Math.max(Y, base - lowOf(_q0, B, p.id * 6) - T[k + 19]);
      } else {
        const ta = tau - tauS;
        const th = T[k + 16] * Math.sin(ta * 15.7) * Math.exp(-ta / 0.2);
        if (th !== 0 && !this.reduced) _q0.premultiply(_q1.setFromAxisAngle(_ax.set(T[k + 14], 0, T[k + 15]), th));
        Y = base - lowOf(_q0, B, p.id * 6) - T[k + 19] + (this.reduced ? 0 : hopAt(ta, T[k + 13]));
      }
      p.q.copy(_q0);
      p.t.set(X - p.pivot.x, Y - p.pivot.y, Z - p.pivot.z);
      p.s = 1;
    }
    // Moving parts were set above from rest; pieces that broke this frame have added their fall.

    // The claws' cables, from the trolley to the head where those pieces
    // really are (so they fall with them); stretched past their length, they snap.
    const m1 = new THREE.Matrix4();
    const m2 = new THREE.Matrix4();
    R.claws.forEach((c, i) => {
      const z = GANTRY_Z[c.rail];
      const s = c.rail === "front" ? h.claw[c.from] : sim.claw[c.from];
      const top = V(c.restX, GANTRY_Y, z).applyMatrix4(pieceMatrix(c.trolley, new THREE.Matrix4(), m1));
      const bot = V(c.restX, GANTRY_Y - 1 + 0.05, z).applyMatrix4(pieceMatrix(c.head, new THREE.Matrix4(), m2));
      const dir = bot.clone().sub(top);
      const len = dir.length();
      const m = new THREE.Matrix4();
      if (len > Math.max(1.2, s.drop + 0.4) || c.trolley.s < 0.01) m.makeScale(0, 0, 0);
      else m.compose(top.clone().add(bot).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir.normalize()), V(0.016, Math.max(0.01, len), 0.016));
      this.cables.setMatrixAt(i, m);
    });
    this.cables.instanceMatrix.needsUpdate = true;
  }

  /* ---- the new machine ------------------------------------------------------------ */

  private animateNew(P: number, dt: number, time: number) {
    const N = this.nw.rig;
    const kit = this.nw.kit;
    // Pulses from the crowd going through.
    for (const e of this.events) {
      if (e.type === "ring") this.ringPow[e.lane] = 1;
      if (e.type === "node") this.nodePow[e.k] = 1;
      if (e.type === "catch") this.turbinePow = 1;
      if (e.type === "kept") this.returnPow = 1;
    }
    // Ours, too.
    const h = this.hero;
    if (h.machine === "new") {
      const plan = heroPlan(this.L);
      if (this.prevP < plan.ringP && P >= plan.ringP) this.ringPow[0] = 1.6;
      // Sent on out of the turbine.
      if (this.prevP < 19.32 && P >= 19.32) this.turbinePow = 1.4;
      this.L.sNodes.forEach((s, k) => {
        const Pk = plan.nodeP[k] ?? 19.32 + (s / this.L.channel.length) * 2.5;
        if (this.prevP < Pk && P >= Pk) this.nodePow[k] = 1.8;
      });
    }
    if (!this.reduced && this.machine === "old") {
      if (this.prevP < 4.12 && P >= 4.12) this.sim.forceLeave(1);
      if (this.prevP < 8.95 && P >= 8.95) this.sim.forceSlip();
    }
    this.prevP = P;
    for (let i = 0; i < this.ringPow.length; i++) this.ringPow[i] *= Math.exp(-dt * 3.2);
    for (let i = 0; i < 3; i++) this.nodePow[i] *= Math.exp(-dt * 2.6);
    this.turbinePow *= Math.exp(-dt * 3.1);
    this.returnPow *= Math.exp(-dt * 1.8);

    const ax = new THREE.Vector3();
    // Assembly: each piece condenses out of light on its way in and flies into its seat.
    const F = N.from;
    for (const p of kit.pieces) assemble(p, F[p.id], P, this.reduced);
    // Then its life: the turbine spins, rings and nodes pulse, the flywheel turns.
    const run = range(P, 16.4, 17.0);
    const inertia = 1 - Math.exp(-dt * 2.6);
    // THE TURBINE turns the way the customers go round it. Free, it runs at the
    // crowd's own pace through it (sim: 0.9π in 0.55 s), so the blades carry
    // them; while our customer is caught it phase-locks, a blade just behind
    // the light, so it is swept round by the blade, never cut through.
    const TB = this.L.TURB;
    const pitch = (Math.PI * 2) / 9;
    const wrap = (x: number) => x - pitch * Math.round(x / pitch);
    const lockK = h.machine === "new" && h.visible ? smooth(range(P, 18.86, 18.95)) * (1 - smooth(range(P, 19.33, 19.42))) : 0;
    let target = 0;
    if (lockK > 0) {
      const dx = h.pos.x - TB.x;
      const dy = h.pos.y - TB.y;
      const rh = Math.hypot(dx, dy);
      const aH = Math.atan2(dy, dx);
      // The blade at the customer's radius (it curves on 0.14 rad each 0.475 m out), and a clear gap behind the light.
      const bend = 0.14 * Math.min(4, Math.max(0, (rh - 0.45) / ((TB.r - 0.45) / 4)));
      target = aH - bend - 0.19 / Math.max(1, rh) - 0.03;
      const rate = dt > 1e-4 && this.heroA !== null ? Math.max(-25, Math.min(25, wrap2pi(aH - this.heroA) / dt)) : 0;
      this.heroA = aH;
      this.rotorV += (rate - this.rotorV) * (1 - Math.exp(-dt * 8));
      if (!this.reduced) this.rotorA += this.rotorV * dt + wrap(target - this.rotorA) * (1 - Math.exp(-dt * 6 * lockK));
    } else {
      this.heroA = null;
      this.rotorV += (((Math.PI * 0.9) / 0.55 + this.turbinePow * 0.25) * run - this.rotorV) * inertia;
      if (!this.reduced) this.rotorA += dt * this.rotorV;
    }
    if (!this.reduced) this.flywheelA += dt * 1.4 * run;
    const shown = this.rotorA + lockK * wrap(target - this.rotorA);
    // How fast the blades turn (rad/s), for the crowd: sim.ts, when it reads
    // it, carries the customers in the turbine round at the blades' pace.
    const W0 = (Math.PI * 0.9) / 0.55;
    (this.sim as unknown as { turbineW?: number }).turbineW = this.reduced || dt < 1e-4 ? W0 : Math.max(0, wrap2pi(shown - this.shownA) / dt);
    this.shownA = shown;
    N.rotor.q.multiply(_q0.setFromAxisAngle(ax.set(0, 0, 1), shown));
    N.rotor.power = 1 + this.turbinePow * 0.85;
    N.counterRotor.q.multiply(_q0.setFromAxisAngle(ax.set(0, 0, 1), -0.59 * shown));
    N.counterRotor.power = 1 + this.turbinePow;
    N.rings.forEach((r, i) => {
      r.power = 1 + 2.1 * (this.ringPow[i] ?? 0);
      if (!this.reduced && r.s > 0) r.s *= 1 + 0.075 * (this.ringPow[i] ?? 0);
    });
    const portalPulse = Math.max(...Array.from(this.ringPow));
    N.portal.power = 1 + 0.6 * portalPulse;
    N.vanes.forEach((v) => {
      const radial = v.pivot.clone().sub(N.portal.pivot).normalize();
      if (!this.reduced) {
        v.t.addScaledVector(radial, portalPulse * 0.11);
        v.q.multiply(new THREE.Quaternion().setFromAxisAngle(ax.set(1, 0, 0), portalPulse * 0.26));
      }
      v.power = 0.9 + portalPulse * 0.8;
    });
    N.nodes.forEach((n, i) => {
      n.power = 1 + 2.2 * this.nodePow[i];
      if (!this.reduced && n.s > 0) n.s *= 1 + 0.08 * this.nodePow[i];
    });
    N.ribs.forEach((rib) => {
      const front = rib.pivot.z > 0;
      rib.power = front ? 0.75 : 0.78 + 0.22 * range(P, 16.55, 17.3);
    });
    N.flywheel.q.multiply(new THREE.Quaternion().setFromAxisAngle(CX, -this.flywheelA));
    // (It glows where the crank was; it does not glare over the desk.)
    N.flywheel.power = 0.42 + this.returnPow * 0.3;
    const hours = clockAt(P);
    const wa = ((hours - 12) / 24) * Math.PI * 2;
    const wq = new THREE.Quaternion().setFromAxisAngle(ax.set(0, 0, 1), wa);
    for (const w of N.wheel) w.q.multiply(wq);
    N.moon.q.multiply(wq);
    N.sun.q.multiply(wq);
    N.door.power = 1 + 0.15 * Math.sin(time * 1.3);
  }

  /** Where things stand on the floor: a soft pool of shadow under each (shade.ts). */
  private shadesAt(P: number) {
    const sh = this.shade;
    sh.begin();
    const cy = CORNER_YAW;
    const at = (x: number, z: number) => corner(x, 0, z, _cs);
    // The hall's piers.
    for (const x of [-34, 34]) for (let z = 64; z >= -116; z -= 15) sh.add(x, z, 7.5, 7.5, 0, 0.42);
    // The desk: its body, its legs and the drawers.
    const deskYaw = cy + DESK_YAW;
    let p = dw(0, 0, 0);
    sh.add(p.x, p.z, 1.9, 1.15, deskYaw, 0.5);
    for (const [x, z] of [[-0.64, -0.3], [0.64, -0.3], [-0.64, 0.3], [0.64, 0.3]]) {
      p = dw(x, 0, z);
      sh.add(p.x, p.z, 0.2, 0.2, 0, 0.55);
    }
    p = dw(0.42, 0, 0);
    sh.add(p.x, p.z, 0.6, 0.8, deskYaw, 0.5);
    // The chair, wherever it has been pushed.
    const ch = this.old.rig.corner.chair;
    const cyaw = 2 * Math.atan2(ch.q.y, ch.q.w);
    sh.add(ch.pivot.x + ch.t.x, ch.pivot.z + ch.t.z, 0.66, 0.62, deskYaw + cyaw, 0.5);
    // The owner: the feet, and the body's own shadow round them.
    const pose = this.owner.pose;
    if (pose) {
      pose.ankles.forEach((a, i) => sh.add(a.x, a.z, 0.2, 0.38, cy + (pose.footYaw ? pose.footYaw[i] : pose.feetYaw), 0.72));
      const mid = pose.ankles[0].clone().add(pose.ankles[1]).multiplyScalar(0.5).lerp(pose.hip, 0.5);
      sh.add(mid.x, mid.z, 0.75, 0.62, cy + pose.yaw, 0.32);
    }
    // The windlass: its shadow is dragged with it across the floor by its
    // chain, and goes as it tips over the lip.
    const wl = 1 - smooth(range(P, this.windlassLip - 0.04, this.windlassLip + 0.03));
    if (wl > 0) {
      const w = this.windlass;
      const ox = w && P > this.windlassT0 ? w.t.x : 0;
      const oz = w && P > this.windlassT0 ? w.t.z : 0;
      for (const x of [-0.7, 0.21]) {
        const q = at(x, 0);
        sh.add(q.x + ox, q.z + oz, 0.34, 1.15, cy, 0.55 * wl);
      }
      let q = at(-0.25, 0);
      sh.add(q.x + ox, q.z + oz, 1.3, 0.62, cy, 0.38 * wl);
      q = at(-0.84, 0);
      sh.add(q.x + ox, q.z + oz, 0.36, 1.2, cy, 0.34 * wl);
    }
    // The new flywheel in its place.
    const fly = smooth(range(P, 16.3, 16.9));
    if (fly > 0) sh.add(CRANK.x, CRANK.z, 0.5, 1.9, cy, 0.3 * fly);
    sh.end();
  }

  private flakesAt(P: number) {
    const fd = this.flakeData;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    let n = 0;
    if (P > 14.9 && P < 16.5) {
      const count = fd.length / 8;
      for (let i = 0; i < count; i++) {
        const k = i * 8;
        const tau = (P - fd[k + 3]) * 3.1;
        if (tau <= 0 || tau > 3.2) continue;
        const x = fd[k] + fd[k + 4] * tau;
        const y = fd[k + 1] + fd[k + 5] * tau - 0.5 * 1.6 * tau * tau;
        const z = fd[k + 2] + fd[k + 6] * tau;
        e.set(fd[k + 7] + tau * 3, fd[k + 7] * 2 + tau * 2, tau);
        q.setFromEuler(e);
        const s = 1 - range(tau, 2.4, 3.2);
        m.compose(V(x, y, z), q, V(s, s, s));
        this.flakes.setMatrixAt(n++, m);
      }
    }
    this.flakes.count = n;
    if (n) this.flakes.instanceMatrix.needsUpdate = true;
    // Sparks: a short bright life each, flung out as the piece breaks.
    const sd = this.sparkData;
    let ns = 0;
    if (P > 14.95 && P < 16.2) {
      const count = sd.length / 8;
      for (let i = 0; i < count; i++) {
        const k = i * 8;
        const tau = (P - sd[k + 3]) * 3.1;
        if (tau <= 0 || tau > sd[k + 7]) continue;
        const life = tau / sd[k + 7];
        const s = (1 - life) * (1 - life) * 1.4;
        m.compose(V(sd[k] + sd[k + 4] * tau, sd[k + 1] + sd[k + 5] * tau - 4.5 * tau * tau, sd[k + 2] + sd[k + 6] * tau), q.identity(), V(s, s, s));
        this.sparks.setMatrixAt(ns++, m);
      }
    }
    this.sparks.count = ns;
    if (ns) this.sparks.instanceMatrix.needsUpdate = true;
  }

  /* ---- the camera ------------------------------------------------------------------- */

  private cameraAt(P: number, f: Frame) {
    const c = this.cam;
    let Pc = P;
    if (this.reduced) {
      // Hold the composed frame we are at; a change of frame is a cut through black.
      let r = RESTS[0];
      for (const x of RESTS) if (x <= P + 0.2) r = x;
      if (r !== this.restP) {
        if (this.restP >= 0) this.fadeT = f.time;
        this.restP = r;
      }
      Pc = r;
    }
    // (Reduced motion holds composed frames: nothing to smooth.)
    if (this.reduced) cameraAt(Pc, { h: this.hero, L: this.L }, c);
    else cameraSmooth(Pc, { h: this.hero, L: this.L }, f.time, c);
    if (this.camOverride) {
      c.eye.copy(this.camOverride.eye);
      c.at.copy(this.camOverride.at);
      c.fov = this.camOverride.fov;
      c.ppx = c.ppy = 0.5;
      c.roll = 0;
    }
    const cam = this.camera;
    // The phone: a narrower frame, so pull back a little and keep the subject high.
    let fov = c.fov;
    let ppx = c.ppx;
    let ppy = c.ppy;
    const aspect = cam.aspect;
    if (aspect < 1) {
      fov = Math.min(80, c.fov * (1 + (1 - aspect) * 0.75));
      ppx = 0.5;
      ppy = 0.36;
    }
    // Lean toward the pointer, and breathe.
    const lx = f.pointer.has && !this.reduced ? f.pointer.x : 0;
    const ly = f.pointer.has && !this.reduced ? f.pointer.y : 0;
    this.lean.x += (lx - this.lean.x) * (1 - Math.exp(-f.dt * 2.2));
    this.lean.y += (ly - this.lean.y) * (1 - Math.exp(-f.dt * 2.2));
    const t = f.time;
    const still = this.reduced ? 0 : this.quality === 0 ? 0.6 : 1;
    const dist = c.eye.distanceTo(c.at);
    const breath = V(Math.sin(t * 0.37) * 0.6 + Math.sin(t * 0.23) * 0.4, Math.sin(t * 0.29) * 0.5, Math.sin(t * 0.19) * 0.4).multiplyScalar(0.006 * dist * still);
    cam.position.copy(c.eye).add(breath);
    // A lean of about a degree and a half.
    const fwd = c.at.clone().sub(c.eye).normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd);
    const at = c.at.clone().addScaledVector(right, this.lean.x * 0.026 * dist).addScaledVector(up, this.lean.y * 0.018 * dist);
    cam.position.addScaledVector(right, -this.lean.x * 0.012 * dist);
    // Shake: the sub hit at the turn, and the falls.
    const shake = this.reduced ? 0 : 0.012 * bump(P, 14.95, 15.5, 0.08) + 0.004 * bump(P, 16.05, 16.4, 0.05);
    if (shake > 0) at.add(V(Math.sin(t * 47) * shake * dist, Math.sin(t * 53) * shake * dist, 0));
    cam.up.set(0, 1, 0);
    cam.lookAt(at);
    if (c.roll) cam.rotateZ(c.roll);
    cam.fov = fov;
    const W = 1000;
    const H = W / aspect;
    // The point looked at sits at (ppx, ppy) of the frame, not its middle.
    cam.setViewOffset(W, H, (0.5 - ppx) * W, (0.5 - ppy) * H, W, H);
    cam.updateProjectionMatrix();
  }

  private hoverAt(f: Frame) {
    if (!f.pointer.has) {
      this.hover = null;
      return;
    }
    this.ndc.set(f.pointer.x, f.pointer.y);
    this.ray.setFromCamera(this.ndc, this.camera);
    const parts = this.machine === "new" ? this.nw.rig.parts : this.machine === "old" ? this.old.rig.parts : [];
    let best: string | null = null;
    let bd = Infinity;
    const hit = new THREE.Vector3();
    for (const p of parts) {
      if (this.ray.ray.intersectBox(p.box, hit)) {
        const d = hit.distanceTo(this.camera.position);
        // Only near enough to be the thing on screen.
        if (d < bd && d < 60) {
          bd = d;
          best = p.id;
        }
      }
    }
    this.hover = best;
  }
}

export { CRANK, PIPE_Z, TRAYS, WHEEL };
export type { Piece };
