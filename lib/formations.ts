import * as THREE from "three";
import { CORE_SCALE } from "./geo/crystal";
import { CORE, SHARD_COUNT, STONE, type FragInfo, type StoneBuild } from "./geo/types";
import type { Formation } from "./sceneState";
import { easeLock, mulberry32 } from "./ease";

/**
 * THE FORMS OF THE STONE (home film, lib/choreo.ts). One stone, whole only at
 * the start and the end; in between it is always something new:
 *
 *   F0  intact      the stone (the core hidden inside it) — the studio, and
 *                   the colossus at rest
 *   F1  burst       it SHATTERS — forty shards thrown out, the core laid bare
 *   F4  exploded    WEBSITES: the burst finds its order — every shard turned
 *                   back to its place and held a hand's breadth apart on the
 *                   line it broke along (loose at first, then exact), the
 *                   mark's cuts open, the core burning at the heart
 *   F2  stair       PLATFORMS: the blades' splinters build a floating spiral
 *                   STAIR round an open well, step by step from the floor up —
 *                   every tread the same length, the same rise, the same turn —
 *                   roofed by the crown on the girdle's plate, the core at its
 *                   foot. AI AUTOMATION (ctx.ai): the core climbs the well;
 *                   every step it passes turns a quarter on its own length into
 *                   a blade and swings on round the well — the stair becomes a
 *                   turbine, and runs
 *   F7  colossus    WHY: the stair winds itself round the core into the stone
 *                   at colossal scale, open (ctx.open 1) — a hollow round the
 *                   burning core, the glass toward the camera standing aside —
 *                   closing to whole
 *
 * Every pose is world space; blends happen between world poses (Director).
 */

export type Pose = { pos: THREE.Vector3; quat: THREE.Quaternion; scale: THREE.Vector3 };

export function pose(): Pose {
  return { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: new THREE.Vector3(1, 1, 1) };
}

export type FormationCtx = {
  /** The stone's current rotation (stone-relative forms). */
  stoneQuat: THREE.Quaternion;
  /** Where the stone's origin stands (F0 / F1 / F4 / F7). */
  home: THREE.Vector3;
  /** The stone's scale (1 in the studio; colossal at the end). */
  K: number;
  /** F0: push along `out` (the cracks opening). */
  gap: number;
  /** F0/F1: how far the stone has risen off its reflection (world y). */
  lift: number;
  /** F2: the stair's turn (rad). */
  towerYaw: number;
  /** The core's own turn (rad, integrated by the Director). */
  coreSpin: number;
  /** F2/F4: the sculpture leans toward the cursor, about its centre. */
  tilt: THREE.Quaternion;
  /** Time-based life (seconds, integrated by the Director). */
  flowT: number;
  /** F2: how far the AI has worked up the stair, 0..1 (scroll). */
  ai: number;
  /** F1: how far into the slow-motion drift of the burst (0..1) — it never freezes. */
  burstT: number;
  /** F4: 0 loose (just out of the burst) → 1 exact. */
  exact: number;
  /** F4: how far apart the exploded view is held (1 = its rest). */
  explode: number;
  /** F7: where the camera is (the stone opens toward it), and how open it is (0..1). */
  camPos: THREE.Vector3;
  open: number;
};

/* ------------------------------------------------------------------------ */
/* Places + scales                                                           */
/* ------------------------------------------------------------------------ */

/** The studio's floor (the mirror everything stands on — the hero's floor). */
export const FLAT_Y = STONE.floorY;
/** How far the stone rises off its reflection as it breaks. */
export const LIFT_Y = 0.55;

/* THE STAIR (F2). Stone units, then × TOWER_K. It stands on the studio floor,
   on the stone's own axis, its reflection under it. */
export const TOWER_K = 2.4;
export const TOWER_BASE = new THREE.Vector3(0, FLAT_Y, 0);
/** The steps: every shard but the girdle's plate — the blades' splinters low,
    the crown's at the top (the order they will seat in the colossus). */
export const STEPS = 39;
/** Each step turns this far round the well from the one below (fifteen to a
    turn) — the same way the camera travels, so the stair winds with the shot. */
const STEP_TURN = (24 * Math.PI) / 180;
/** …and rises this far (a hair more than a tread is thick: no two ever touch). */
const STEP_RISE = 0.23;
/** The first tread above the floor, and its bearing. */
const STEP_Y0 = 0.3;
const STEP_A0 = (-205 * Math.PI) / 180;
/** The open well the core climbs: every step's inner end stands this far off the axis. */
const WELL_R = 0.75;
/** Every tread the same length (so the stair reads as built, not piled), never thicker than STEP_T. */
const STEP_LEN = 1.3;
const STEP_T = 0.21;
/** The last tread, and where the core ends its climb (standing on it, in the well). */
const STAIR_TOP = STEP_Y0 + (STEPS - 1) * STEP_RISE;
const CLIMB_TOP = STAIR_TOP + 0.5;
/** The core, a little over four steps tall, as it climbs the well. */
const CORE_IN_TOWER = 1;
/** The AI: each step it passes turns a quarter on its own length, and swings on round the well. */
const FLIP = Math.PI / 2;
const SWING = (30 * Math.PI) / 180;
/** Stair height in world units, and its middle. */
export const TOWER_H = (CLIMB_TOP + 0.3) * TOWER_K;
export const TOWER_C = new THREE.Vector3(TOWER_BASE.x, TOWER_BASE.y + TOWER_H * 0.5, TOWER_BASE.z);
/** The top of the well (world y) — where the core ends its climb. */
export const TOWER_TOP_Y = TOWER_BASE.y + CLIMB_TOP * TOWER_K;

/* THE COLOSSUS (F7): the stone at colossal scale, standing on the same floor. */
export const COL_K = 7;
/** The colossus's origin: its culet just touches the floor. */
export const COL_HOME = new THREE.Vector3(0, FLAT_Y - STONE.floorY * COL_K, 0);
/** The colossus's centre (world). */
export const COL_C = new THREE.Vector3(0, COL_HOME.y + STONE.centerY * COL_K, 0);
/* How it opens (stone units × K): the tunnel's radius toward the camera, the
   hollow round the heart, and how far every joint opens. */
const TUNNEL_R = 0.62;
const HOLLOW_R = 1.7;
const EXPAND = 0.45;

/* F4: the exploded view — how far apart (× distance from the heart, per axis)
   and how the mark's cuts open. */
const EXPLODE_XZ = 0.62;
const EXPLODE_Y = 0.2;
const CUT_OPEN = { crown: 0.3, band: 0.12, blade: 0.2 };

const Y = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();
const _cd = new THREE.Vector3();
const _perp = new THREE.Vector3();
const _off = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const stoneMid = new THREE.Vector3(0, STONE.centerY, 0);

/** Per-fragment constants, precomputed once from the stone. */
type Prep = {
  /** F1 */
  burst: THREE.Vector3;
  spin: THREE.Quaternion;
  /** F4: offset from the heart in the exploded view (stone object space), and its "loose" jitter. */
  explodeOff: THREE.Vector3;
  looseOff: THREE.Vector3;
  looseQ: THREE.Quaternion;
  /** F2: which step (0 at the foot … 31; −1 the roof and the core), and 0..1 up the stair (the roof 1). */
  step: number;
  stepK: number;
  /** F2: the piece's pose in the stair frame (stone units, foot at the origin), its tread height and bearing. */
  stairPos: THREE.Vector3;
  stairQ: THREE.Quaternion;
  stairS: number;
  stairY: number;
  stairN: THREE.Vector3;
  tumble: THREE.Vector3;
  /** 0..1 distance from the crack origin (burst stagger). */
  crackK: number;
  /** 0..1 distance from the heart (assembly stagger: the inside first). */
  radK: number;
  /** 0..1 height in the stone, culet → apex (the colossus seats from the point up). */
  hK: number;
  rand: number;
};

let prep: Prep[] = [];

/** Vertex positions of every fragment (fragment-local), from the merged geometry. */
function fragVerts(stone: StoneBuild): THREE.Vector3[][] {
  const pos = stone.geometry.getAttribute("position");
  const fid = stone.geometry.getAttribute("aFrag");
  const out: THREE.Vector3[][] = stone.frags.map(() => []);
  for (let i = 0; i < pos.count; i++) {
    const f = Math.round(fid.getX(i));
    out[f].push(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
  }
  return out;
}

/**
 * A tread: the piece's long axis out along `n`, turned on that axis so it lies
 * as flat as it can (its thinnest way up). Returns the orientation.
 */
function treadQ(f: FragInfo, verts: THREE.Vector3[], n: THREE.Vector3): THREE.Quaternion {
  const base = new THREE.Quaternion().setFromUnitVectors(f.longAxis, n);
  const roll = new THREE.Quaternion();
  const q = new THREE.Quaternion();
  const w = new THREE.Vector3();
  let best = base.clone();
  let bestH = Infinity;
  for (let k = 0; k < 36; k++) {
    roll.setFromAxisAngle(n, (k * Math.PI) / 36);
    q.copy(roll).multiply(base);
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of verts) {
      w.copy(v).applyQuaternion(q);
      lo = Math.min(lo, w.y);
      hi = Math.max(hi, w.y);
    }
    if (hi - lo < bestH - 1e-4) {
      bestH = hi - lo;
      best = q.clone();
    }
  }
  return best;
}

/** Build the per-fragment constants. Deterministic; call once. */
export function prepareFormations(stone: StoneBuild): void {
  const frags = stone.frags;
  const crackOrigin = stone.crackOrigin;
  const verts = fragVerts(stone);
  const rand = mulberry32(0x5b3df0);
  const shards = frags.filter((f) => f.index < SHARD_COUNT);
  const maxCrack = Math.max(...shards.map((f) => f.centroid.distanceTo(crackOrigin)));
  const maxRad = Math.max(...shards.map((f) => f.centroid.distanceTo(stoneMid)));
  const H = STONE.height;

  // F2: the steps, in the order they will seat in the colossus (the point's
  // pieces at the foot, the crown's at the top), so when the stair winds
  // itself into the colossus every piece is already near its own height.
  const treads = shards.filter((f) => f.piece !== "band").map((f) => f.index);
  treads.sort((a, b) => frags[a].centroid.y - frags[b].centroid.y || a - b);
  const stepOf = new Map<number, number>();
  treads.forEach((fi, k) => stepOf.set(fi, k));

  prep = frags.map((f) => {
    const axis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const spin = new THREE.Quaternion().setFromAxisAngle(axis, (rand() * 40 * Math.PI) / 180);
    const burst = f.out.clone().multiplyScalar(1.1 + 1.6 * rand());
    if (f.piece === "crown") burst.y += 0.42;
    if (f.piece === "bladeL") burst.x -= 0.5;
    if (f.piece === "bladeR") burst.x += 0.5;
    // Over a mirror floor nothing may fly into it: the lowest pieces are
    // thrown outward instead, just clear of their own reflections.
    const low = STONE.floorY - LIFT_Y + 0.45;
    if (f.centroid.y + burst.y < low) {
      const h = Math.hypot(burst.x, burst.z) || 1;
      const extra = (low - (f.centroid.y + burst.y)) * 0.6;
      burst.x += (burst.x / h) * extra;
      burst.z += (burst.z / h) * extra;
      burst.y = low - f.centroid.y + 0.1 * rand();
    }
    const r = rand();
    const tumble = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();

    // F4 — apart along the line from the heart: mostly outward (so the
    // silhouette reads as the stone, opened), a little along the height; the
    // mark's cuts opened — crown up, blades apart.
    const d = f.centroid.clone().sub(stoneMid);
    const explodeOff = new THREE.Vector3(d.x * EXPLODE_XZ, d.y * EXPLODE_Y, d.z * EXPLODE_XZ);
    if (f.piece === "crown") explodeOff.y += CUT_OPEN.crown;
    if (f.piece === "band") explodeOff.y += CUT_OPEN.band;
    if (f.piece === "bladeL") explodeOff.x -= CUT_OPEN.blade;
    if (f.piece === "bladeR") explodeOff.x += CUT_OPEN.blade;
    // Loose: a little off its line and a little turned — the burst still settling.
    const looseOff = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.16);
    const looseQ = new THREE.Quaternion().setFromAxisAngle(tumble, (rand() - 0.5) * 0.5);

    // F2 — the stair.
    const step = stepOf.get(f.index) ?? -1;
    const stairPos = new THREE.Vector3();
    let stairQ = new THREE.Quaternion();
    let stairS = 0.002 / TOWER_K;
    let stairY = STAIR_TOP;
    const stairN = new THREE.Vector3(0, 0, 1);
    if (step >= 0) {
      const a = STEP_A0 - step * STEP_TURN;
      stairN.set(Math.sin(a), 0, Math.cos(a));
      stairQ = treadQ(f, verts[f.index], stairN);
      let aMin = Infinity;
      let aMax = -Infinity;
      let yMin = Infinity;
      let yMax = -Infinity;
      const w = new THREE.Vector3();
      for (const v of verts[f.index]) {
        w.copy(v).applyQuaternion(stairQ);
        const along = w.dot(stairN);
        aMin = Math.min(aMin, along);
        aMax = Math.max(aMax, along);
        yMin = Math.min(yMin, w.y);
        yMax = Math.max(yMax, w.y);
      }
      // Every tread the same length where it can be; never thick enough to
      // touch the next.
      stairS = THREE.MathUtils.clamp(Math.min(STEP_LEN / Math.max(0.05, aMax - aMin), STEP_T / Math.max(0.05, yMax - yMin)), 0.6, 1.8);
      stairY = STEP_Y0 + step * STEP_RISE;
      // Its inner end at the well, its top at its tread's height.
      stairPos.copy(stairN).multiplyScalar(WELL_R - aMin * stairS);
      stairPos.y = stairY - yMax * stairS;
    } else if (f.index !== CORE) {
      // The girdle's plate waits, folded away at the top, for the colossus.
      stairPos.set(0, CLIMB_TOP, 0);
    }

    return {
      burst,
      spin,
      explodeOff,
      looseOff,
      looseQ,
      step,
      stepK: step >= 0 ? step / STEPS : f.index === CORE ? 0 : 1,
      stairPos,
      stairQ,
      stairS,
      stairY,
      stairN,
      tumble,
      crackK: f.index === CORE ? 0 : f.centroid.distanceTo(crackOrigin) / maxCrack,
      radK: f.index === CORE ? 0 : f.centroid.distanceTo(stoneMid) / maxRad,
      hK: f.index === CORE ? 0.5 : (f.centroid.y - STONE.culet[1]) / H,
      rand: r,
    };
  });
}

export function prepared(i: number): Prep {
  return prep[i];
}

/** Rotate a pose about a centre (the sculpture leaning toward the cursor). */
function tiltAbout(out: Pose, centre: THREE.Vector3, tilt: THREE.Quaternion) {
  out.pos.sub(centre).applyQuaternion(tilt).add(centre);
  out.quat.premultiply(tilt);
}

/**
 * What a formation says about a fragment's light, beyond its pose. Read by the
 * Director right after fragTarget. Pieces come and go by SCALE, never by
 * alpha: a half-faded shard reads as white ghost glass.
 *   lit   0..1 a step the AI has turned
 *   pass  0..1 the core is passing this step right now
 *   open  0..1 how open this piece of the colossus is
 *   snap  0..1 how exact this piece of the exploded view is
 */
export const fx = { fade: 0, glow: 1, flash: 0, lit: 0, open: 0, pass: 0, snap: 0 };

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** Ease in and out, with a gentle middle: every leg starts and lands softly. */
export const glide = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10));

/* ------------------------------------------------------------------------ */
/* F2 — the stair, and the AI working up it                                  */
/* ------------------------------------------------------------------------ */

function lerpN(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
/** How high the core stands in the well (stone units above the foot) at AI progress `ai`. */
function coreClimb(ai: number): number {
  return lerpN(0.72, CLIMB_TOP, glide(ai));
}

/** The core's world position at AI progress `ai` (the camera rides beside it). */
export function aiCore(ai: number, out: THREE.Vector3): THREE.Vector3 {
  return out.set(TOWER_BASE.x, TOWER_BASE.y + coreClimb(ai) * TOWER_K, TOWER_BASE.z);
}

/**
 * A step's state at AI progress `ai`: how near the core is, and how far the
 * step has turned behind it (it turns like a lock's tumbler: a hair back,
 * round, a click past, home).
 */
function stepState(y: number, ai: number): { pass: number; done: number } {
  const dy = (coreClimb(ai) - y) / STEP_RISE; // steps the core is past this one
  const pass = Math.exp(-dy * dy * 0.18) * (ai > 0.001 && ai < 0.999 ? 1 : 0);
  const done = easeLock((dy + 0.5) / 2);
  return { pass, done };
}

/** A piece of the stair (or its roof) at AI progress ctx.ai. */
function stairTarget(p: Prep, ctx: FormationCtx, out: Pose) {
  const K = TOWER_K;
  const st = stepState(p.stairY, ctx.ai);
  _v.copy(p.stairPos);
  out.quat.copy(p.stairQ);
  if (p.step >= 0) {
    // A quarter turn on its own length: a tread becomes a blade.
    _q.setFromAxisAngle(p.stairN, FLIP * st.done);
    out.quat.premultiply(_q);
  }
  // …and swings on round the well: the part of the stair the AI has passed
  // runs ahead of the rest.
  _q.setFromAxisAngle(Y, ctx.towerYaw + SWING * st.done);
  _v.applyQuaternion(_q);
  out.quat.premultiply(_q);
  out.pos.copy(_v).multiplyScalar(K).add(TOWER_BASE);
  out.scale.setScalar(p.stairS * K);
  tiltAbout(out, TOWER_C, ctx.tilt);
  fx.pass = st.pass;
  fx.lit = st.done;
}

/* ------------------------------------------------------------------------ */
/* F7 — the colossus                                                         */
/* ------------------------------------------------------------------------ */

/**
 * One shard of the colossus. Open, every joint parts a little from the heart;
 * the glass between the heart and the camera stands aside (radially from that
 * line, only up to just behind the camera), and a hollow opens round the heart
 * — wherever the camera goes, it has room, and the heart is always in view.
 */
function colossusTarget(f: FragInfo, p: Prep, ctx: FormationCtx, out: Pose) {
  const K = ctx.K;
  _v.copy(f.centroid).multiplyScalar(K).applyQuaternion(ctx.stoneQuat).add(ctx.home);
  out.quat.copy(ctx.stoneQuat);
  out.scale.setScalar(K);
  // Each piece on its own beat: the point seats first, the crown last.
  const d = 0.55 * (1 - p.hK);
  const open = Math.min(1, Math.max(0, (ctx.open - d) / (1 - d)));
  fx.open = open;
  if (open > 1e-4) {
    _c.copy(stoneMid).multiplyScalar(K).applyQuaternion(ctx.stoneQuat).add(ctx.home);
    _d.copy(_v).sub(_c);
    _cd.copy(ctx.camPos).sub(_c);
    const camDist = Math.max(1e-3, _cd.length());
    _cd.divideScalar(camDist);
    const along = _d.dot(_cd);
    _perp.copy(_d).addScaledVector(_cd, -along);
    let pr = _perp.length();
    if (pr < 1e-3) {
      _perp.set(0, 1, 0).addScaledVector(_cd, -_cd.y);
      pr = Math.max(1e-3, _perp.length());
    }
    // The tunnel: between the heart and a little behind the camera.
    const wT = smooth((along + 0.1 * K) / (0.25 * K)) * (1 - smooth((along - camDist - 0.25 * K) / (0.4 * K)));
    const pushT = (Math.max(0, TUNNEL_R * K - pr) + 0.06 * K) * wT;
    _off.copy(_perp).multiplyScalar(pushT / pr);
    // The hollow round the heart, and every joint opened a little.
    const dl = Math.max(1e-3, _d.length());
    const pushH = Math.max(0, HOLLOW_R * K - dl) + EXPAND * dl;
    _off.addScaledVector(_d, pushH / dl);
    const e = glide(open);
    _v.addScaledVector(_off, e);
    // Each piece turns a little on itself as it stands open.
    _q2.setFromAxisAngle(p.tumble, 0.22 * e * (0.5 + p.rand));
    out.quat.multiply(_q2);
  }
  out.pos.copy(_v);
}

/* ------------------------------------------------------------------------ */
/* The core                                                                  */
/* ------------------------------------------------------------------------ */

function coreTarget(F: Formation, ctx: FormationCtx, out: Pose) {
  switch (F) {
    case "F2": {
      // In the well: at the foot while the stair is built; climbing it as the AI works.
      aiCore(ctx.ai, out.pos);
      out.quat.setFromAxisAngle(Y, ctx.coreSpin * 1.6);
      out.scale.setScalar(CORE_SCALE * CORE_IN_TOWER * TOWER_K);
      tiltAbout(out, TOWER_C, ctx.tilt);
      return;
    }
    case "F4": {
      _v.copy(stoneMid).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.quat.setFromAxisAngle(Y, ctx.coreSpin).premultiply(ctx.stoneQuat);
      out.scale.setScalar(CORE_SCALE * 1.25);
      return;
    }
    case "F7": {
      // The heart of the colossus: it draws in a little as the stone opens, so
      // the camera can turn round it, and burns.
      _v.copy(stoneMid).multiplyScalar(ctx.K).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.quat.setFromAxisAngle(Y, ctx.coreSpin).premultiply(ctx.stoneQuat);
      out.scale.setScalar(CORE_SCALE * ctx.K * (1 - 0.25 * ctx.open));
      fx.open = ctx.open;
      return;
    }
    default: {
      // Inside the stone, turning with it; laid bare by the burst.
      _v.copy(stoneMid).multiplyScalar(ctx.K).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.pos.y += ctx.lift;
      out.quat.copy(ctx.stoneQuat);
      out.scale.setScalar((F === "F1" ? 0.62 : CORE_SCALE) * ctx.K);
    }
  }
}

/** Fill `out` with fragment `f`'s world pose in formation `F`. Allocation-free. Also sets `fx`. */
export function fragTarget(F: Formation, f: FragInfo, ctx: FormationCtx, out: Pose): void {
  out.scale.set(1, 1, 1);
  fx.fade = 0;
  fx.glow = 1;
  fx.lit = 0;
  fx.flash = 0;
  fx.open = 0;
  fx.pass = 0;
  fx.snap = 0;
  if (f.index === CORE) {
    coreTarget(F, ctx, out);
    return;
  }
  const p = prep[f.index];
  switch (F) {
    case "F0": {
      _v.copy(f.centroid).addScaledVector(f.out, ctx.gap).multiplyScalar(ctx.K).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.pos.y += ctx.lift;
      out.quat.copy(ctx.stoneQuat);
      out.scale.setScalar(ctx.K);
      return;
    }
    case "F1": {
      // In slow motion the burst never stops: every piece keeps drifting out
      // along its line and tumbling on, however slowly you scroll.
      const t = ctx.burstT;
      _v.copy(p.burst).multiplyScalar(1 + 0.42 * t).add(f.centroid).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.pos.y += ctx.lift;
      out.quat.copy(ctx.stoneQuat).multiply(p.spin);
      if (t > 0) {
        _q.setFromAxisAngle(p.tumble, (0.9 + 1.3 * p.rand) * t);
        out.quat.multiply(_q);
      }
      return;
    }
    case "F4": {
      // Loose → exact: the burst's last drift is taken out of every piece,
      // from the heart outward, each on its own beat.
      const ex = glide(Math.min(1, Math.max(0, (ctx.exact - 0.42 * p.radK) / 0.58)));
      const loose = 1 - ex;
      fx.snap = ex;
      _v.copy(f.centroid)
        .addScaledVector(p.explodeOff, ctx.explode)
        .addScaledVector(p.looseOff, loose)
        .applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.quat.copy(ctx.stoneQuat);
      if (loose > 1e-4) {
        _q.identity().slerp(p.looseQ, loose);
        out.quat.multiply(_q);
      }
      // The girdle band is a thin plate: held apart it reads as a line. It
      // steps out of the exploded view and back as the stone comes together.
      if (f.piece === "band") out.scale.setScalar(0.002);
      tiltAbout(out, _c.copy(stoneMid).add(ctx.home), ctx.tilt);
      return;
    }
    case "F2":
      stairTarget(p, ctx, out);
      return;
    case "F7":
      colossusTarget(f, p, ctx, out);
      return;
    default:
      out.pos.copy(ctx.home);
      out.quat.identity();
  }
}

/**
 * Blend two world poses along a quadratic Bézier arc whose control point is
 * pushed along the fragment's burst direction — pieces swing out and around
 * rather than sliding in straight lines.
 */
export function blendPose(a: Pose, b: Pose, t: number, dir: THREE.Vector3, arc: number, out: Pose): void {
  const u = 1 - t;
  const dist = _v2.subVectors(b.pos, a.pos).length();
  const cx = (a.pos.x + b.pos.x) * 0.5 + dir.x * arc * dist;
  const cy = (a.pos.y + b.pos.y) * 0.5 + dir.y * arc * dist;
  const cz = (a.pos.z + b.pos.z) * 0.5 + dir.z * arc * dist;
  out.pos.set(
    u * u * a.pos.x + 2 * u * t * cx + t * t * b.pos.x,
    u * u * a.pos.y + 2 * u * t * cy + t * t * b.pos.y,
    u * u * a.pos.z + 2 * u * t * cz + t * t * b.pos.z
  );
  _q2.copy(a.quat);
  out.quat.copy(_q2).slerp(b.quat, t);
  out.scale.copy(a.scale).lerp(b.scale, t);
}

const _S = new THREE.Matrix4();
const _R = new THREE.Matrix4();

/** Compose T·S·R into `m` (uniform scales only — every form scales uniformly). */
export function poseMatrix(p: Pose, m: THREE.Matrix4): THREE.Matrix4 {
  _R.makeRotationFromQuaternion(p.quat);
  _S.makeScale(p.scale.x, p.scale.y, p.scale.z);
  m.multiplyMatrices(_S, _R);
  m.elements[12] = p.pos.x;
  m.elements[13] = p.pos.y;
  m.elements[14] = p.pos.z;
  return m;
}

/** World height of step `k`'s tread (fractional k is fine) — the stair's build front. */
export function stairStepY(k: number): number {
  return TOWER_BASE.y + (STEP_Y0 + k * STEP_RISE) * TOWER_K;
}
