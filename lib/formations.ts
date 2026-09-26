import * as THREE from "three";
import { CORE_SCALE } from "./geo/crystal";
import { CORE, SHARD_COUNT, STONE, type FragInfo, type StoneBuild } from "./geo/types";
import type { Formation } from "./sceneState";
import { mulberry32 } from "./ease";

/**
 * THE FORMS OF THE STONE (home film, lib/choreo.ts). One stone, whole only at
 * the start and the end; in between it is always something new:
 *
 *   F0  intact      the stone (the core hidden inside it) — the studio, and
 *                   the colossus at rest on the flat
 *   F1  burst       it SHATTERS — forty shards thrown out, the core laid bare
 *   F4  exploded    WEBSITES: the burst finds its order — every shard turned
 *                   back to its place and held a hand's breadth apart on the
 *                   line it broke along (loose at first, then exact), the
 *                   mark's cuts open, the core burning at the heart
 *   F2  tower       PLATFORMS: the pieces stacked into a tower that rises out
 *                   of the cloud sea — eight courses of four, every polished
 *                   cut face turned out as a window, the crown as its roof, the
 *                   core in its shaft. AI AUTOMATION (ctx.ai): the core climbs
 *                   the shaft; each course opens as it passes, turns a step and
 *                   lights — the tower twists into a new form, floor by floor
 *   F3  vortex      THE FALL: the core drops out of the sky and the pieces
 *                   follow it down in a spiral, growing as they fall
 *   F7  colossus    WHY: the stone at colossal scale on the salt flat,
 *                   open (ctx.open 1) — a hollow round the burning core, the
 *                   glass toward the camera standing aside — closing to whole
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
  /** The stone's scale (1 in the studio and the sky; colossal on the flat). */
  K: number;
  /** F0: push along `out` (the cracks opening). */
  gap: number;
  /** F0/F1: how far the stone has risen off its reflection (world y). */
  lift: number;
  /** F2: the tower's slow turn (rad). */
  towerYaw: number;
  /** The core's own turn (rad, integrated by the Director). */
  coreSpin: number;
  /** F2/F4: the sculpture leans toward the cursor, about its centre. */
  tilt: THREE.Quaternion;
  /** Time-based life (seconds, integrated by the Director). */
  flowT: number;
  /** F2: how far the AI has worked up the tower, 0..1 (scroll). */
  ai: number;
  /** F4: 0 loose (just out of the burst) → 1 exact. */
  exact: number;
  /** F4: how far apart the exploded view is held (1 = its rest). */
  explode: number;
  /** F3: how far the fall has got, 0..1. */
  fall: number;
  /** F7: where the camera is (the stone opens toward it), and how open it is (0..1). */
  camPos: THREE.Vector3;
  open: number;
};

/* ------------------------------------------------------------------------ */
/* Places + scales                                                           */
/* ------------------------------------------------------------------------ */

/** The top of the cloud sea (the sky's floor). */
export const CLOUD_Y = -7;

/* THE TOWER (F2). Stone units, then × TOWER_K. It stands on the stone's own
   axis, its foot sunk in the cloud sea so it rises out of it. */
export const TOWER_K = 2.6;
export const TOWER_BASE = new THREE.Vector3(0, CLOUD_Y - 1.7, 0);
export const COURSES = 8;
const PER = 4;
/** Distance from the axis to each side's face (stone units). */
const SIDE = 0.42;
const COURSE_H = 0.76;
/** The crown, scaled so its base fits the shaft. */
const CROWN_S = (SIDE * Math.SQRT2) / STONE.halfDiag;
const SHAFT_H = COURSES * COURSE_H;
/** Height of the roof's underside above the foot (stone units). */
const ROOF_Y = SHAFT_H + 0.03;
/** The core, about one floor tall, as it climbs the tower. */
const CORE_IN_TOWER = 0.72;
/** The core climbs OUTSIDE the tower, spiralling up it, always on the camera's
    side of it (these azimuths match the AI camera keys in lib/choreo.ts). */
const CLIMB_R = SIDE * Math.SQRT2 + 0.34;
const CLIMB_AZ0 = (-236 * Math.PI) / 180;
const CLIMB_AZ1 = (-334 * Math.PI) / 180;
/** The final twist: each course turns this much more than the one below. */
export const TWIST = (16 * Math.PI) / 180;
/** Tower height in world units, and its middle. */
export const TOWER_H = (ROOF_Y + STONE.apex[1] * CROWN_S) * TOWER_K;
export const TOWER_C = new THREE.Vector3(TOWER_BASE.x, TOWER_BASE.y + TOWER_H * 0.5, TOWER_BASE.z);
/** The top of the shaft (world y) — where the core ends its climb. */
export const TOWER_TOP_Y = TOWER_BASE.y + SHAFT_H * TOWER_K;

/* THE SALT FLAT and the colossus on it (F7). The flat lies far below the sky's
   cloud sea; the pieces fall through the cloud to it, growing as they fall. */
export const FLAT_Y = -60;
export const COL_K = 7;
/** The colossus's origin: its culet just touches the flat. */
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
const Z = new THREE.Vector3(0, 0, 1);
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
  /** F2: course 0..7 from the foot up (8 = the roof), side 0..3. */
  course: number;
  side: number;
  /** F2: the piece's pose in the tower frame before its course turns (stone units, foot at the origin). */
  towerPos: THREE.Vector3;
  towerQ: THREE.Quaternion;
  towerS: number;
  /** F3: when it leaves the tower (0 first, 1 last), and its place in the spiral (0 leads, 1 trails). */
  trail: number;
  helix: number;
  phase: number;
  swirlR: number;
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

/** Orientation taking a fragment's largest cut face to `normal` and its long axis toward `along` (in that face's plane). */
function faceTo(f: FragInfo, normal: THREE.Vector3, along: THREE.Vector3): THREE.Quaternion {
  const q = new THREE.Quaternion().setFromUnitVectors(f.cutNormal, normal);
  const la = f.longAxis.clone().applyQuaternion(q);
  la.addScaledVector(normal, -la.dot(normal));
  const al = along.clone().addScaledVector(normal, -along.dot(normal));
  if (la.lengthSq() < 1e-6 || al.lengthSq() < 1e-6) return q;
  la.normalize();
  al.normalize();
  // The long axis may point either way along the piece: take the nearer turn.
  let ang = Math.atan2(la.clone().cross(al).dot(normal), la.dot(al));
  if (Math.abs(ang) > Math.PI / 2) ang -= Math.sign(ang) * Math.PI;
  return new THREE.Quaternion().setFromAxisAngle(normal, ang).multiply(q);
}

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

  // F2: the blades' 32 splinters build the shaft — the ones from the girdle
  // (the stone's broadest, strongest) at the foot, the culet's at the top;
  // round each course, in the order they stood round the stone.
  const blades = shards.filter((f) => f.piece === "bladeL" || f.piece === "bladeR").map((f) => f.index);
  blades.sort((a, b) => frags[b].centroid.y - frags[a].centroid.y);
  const courseOf = new Map<number, number>();
  const sideOf = new Map<number, number>();
  for (let c = 0; c < COURSES; c++) {
    const ring = blades.slice(c * PER, c * PER + PER);
    ring.sort((a, b) => Math.atan2(frags[a].centroid.z, frags[a].centroid.x) - Math.atan2(frags[b].centroid.z, frags[b].centroid.x));
    ring.forEach((fi, k) => {
      courseOf.set(fi, c);
      sideOf.set(fi, (k + c) % PER);
    });
  }
  // The spiral: the roof leaves first, then the shaft from the top down.
  const trailOrder = shards
    .map((f) => f.index)
    .sort((a, b) => (courseOf.get(b) ?? COURSES) - (courseOf.get(a) ?? COURSES) || frags[a].index - frags[b].index);
  const trailOf = new Map<number, number>();
  trailOrder.forEach((fi, k) => trailOf.set(fi, k / Math.max(1, trailOrder.length - 1)));
  // The spiral is ordered by where each piece will seat, from the point up.
  const helixOrder = shards.map((f) => f.index).sort((a, b) => frags[a].centroid.y - frags[b].centroid.y);
  const helixOf = new Map<number, number>();
  helixOrder.forEach((fi, k) => helixOf.set(fi, k / Math.max(1, helixOrder.length - 1)));

  prep = frags.map((f) => {
    const axis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const spin = new THREE.Quaternion().setFromAxisAngle(axis, (rand() * 40 * Math.PI) / 180);
    const burst = f.out.clone().multiplyScalar(1.1 + 1.6 * rand());
    if (f.piece === "crown") burst.y += 0.42;
    if (f.piece === "bladeL") burst.x -= 0.5;
    if (f.piece === "bladeR") burst.x += 0.5;
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
    const looseOff = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.5);
    const looseQ = new THREE.Quaternion().setFromAxisAngle(tumble, (rand() - 0.5) * 1.3);

    // F2 — the tower.
    const course = f.index === CORE ? -1 : courseOf.get(f.index) ?? COURSES;
    const side = sideOf.get(f.index) ?? 0;
    const towerPos = new THREE.Vector3();
    let towerQ = new THREE.Quaternion();
    let towerS = CROWN_S;
    if (f.index !== CORE && course < COURSES) {
      // A window: its polished cut face turned out, its length upright.
      const q0 = faceTo(f, Z, Y);
      const ang = Math.PI / 4 + (side * Math.PI) / 2;
      const n = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
      const yaw = new THREE.Quaternion().setFromAxisAngle(Y, Math.atan2(n.x, n.z));
      towerQ = yaw.multiply(q0);
      // Extents in the tower frame (relative to the centroid).
      let yMin = Infinity;
      let yMax = -Infinity;
      let out = -Infinity;
      for (const v of verts[f.index]) {
        const w = v.clone().applyQuaternion(towerQ);
        yMin = Math.min(yMin, w.y);
        yMax = Math.max(yMax, w.y);
        out = Math.max(out, w.dot(n));
      }
      // Scaled to close its side (and to its course), face on the side's plane —
      // alternate courses a hair apart, so no two faces ever share a plane.
      const tan = new THREE.Vector3(-n.z, 0, n.x);
      let wMin = Infinity;
      let wMax = -Infinity;
      for (const v of verts[f.index]) {
        const w = v.clone().applyQuaternion(towerQ).dot(tan);
        wMin = Math.min(wMin, w);
        wMax = Math.max(wMax, w);
      }
      const fitH = (COURSE_H * 0.96) / Math.max(0.05, yMax - yMin);
      const fitW = (2 * SIDE * 0.96) / Math.max(0.05, wMax - wMin);
      towerS = THREE.MathUtils.clamp(Math.max(fitH, 0.94 * fitW), 0.85, 1.9);
      const yc = (course + 0.5) * COURSE_H - ((yMax + yMin) / 2) * towerS;
      const setback = course % 2 === 0 ? 0 : -0.006;
      towerPos.copy(n).multiplyScalar(SIDE + setback - out * towerS);
      // Centred on its side (a pinwheel nudge closes the corners).
      towerPos.addScaledVector(tan, -((wMax + wMin) / 2) * towerS + 0.03);
      towerPos.y = yc;
    } else if (f.index !== CORE) {
      // The roof: the crown (and the band under it), as it stood on the stone.
      towerPos.copy(f.centroid).multiplyScalar(CROWN_S);
      towerPos.y = ROOF_Y + f.centroid.y * CROWN_S;
      towerQ = new THREE.Quaternion();
    }

    return {
      burst,
      spin,
      explodeOff,
      looseOff,
      looseQ,
      course: f.index === CORE ? -1 : course,
      side,
      towerPos,
      towerQ,
      towerS,
      trail: trailOf.get(f.index) ?? 0,
      helix: helixOf.get(f.index) ?? 0,
      phase: rand() * Math.PI * 2,
      swirlR: 0.55 + 0.45 * rand(),
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
 *   lit   0..1 full of light (a floor the AI has passed)
 *   pass  0..1 the core is passing through this piece's course right now
 *   open  0..1 how open this piece of the colossus is
 */
export const fx = { fade: 0, glow: 1, flash: 0, lit: 0, open: 0, pass: 0, snap: 0 };

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** Ease in and out, with a gentle middle: every leg starts and lands softly. */
export const glide = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10));

/* ------------------------------------------------------------------------ */
/* F2 — the tower, and the AI working up it                                  */
/* ------------------------------------------------------------------------ */

/** How high the core is up the tower (stone units above the foot) at AI progress `ai`. */
function coreClimb(ai: number): number {
  return lerpN(1.35 * COURSE_H, ROOF_Y + 0.35, glide(ai));
}
function lerpN(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
/** The core's place beside the tower (tower frame, stone units) at AI progress `ai`. */
function coreAt(ai: number, out: THREE.Vector3): THREE.Vector3 {
  const a = lerpN(CLIMB_AZ0, CLIMB_AZ1, glide(ai));
  // At the very top it steps in over the roof.
  const r = CLIMB_R * (1 - 0.85 * glide((ai - 0.9) / 0.1));
  return out.set(Math.sin(a) * r, coreClimb(ai), Math.cos(a) * r);
}

/** The core's world position at AI progress `ai` (the camera rides beside it). */
export function aiCore(ai: number, out: THREE.Vector3): THREE.Vector3 {
  return coreAt(ai, out).multiplyScalar(TOWER_K).add(TOWER_BASE);
}

/**
 * Course c's state at AI progress `ai`: how near the core is, and how far the
 * floor has turned and lit behind it.
 */
function courseState(c: number, ai: number): { pass: number; done: number } {
  const y = coreClimb(ai) / COURSE_H - 0.5; // the core's course, continuous
  const dy = y - c;
  const pass = Math.exp(-dy * dy * 2.2) * (ai > 0.001 && ai < 0.999 ? 1 : 0);
  const done = glide((dy + 0.3) / 0.9);
  return { pass, done };
}

/** A piece of the tower (or the roof) at AI progress ctx.ai. */
function towerTarget(p: Prep, ctx: FormationCtx, out: Pose) {
  const K = TOWER_K;
  const top = p.course >= COURSES;
  const c = top ? COURSES - 1 : p.course;
  const st = courseState(c, ctx.ai);
  // The turn this course takes as the AI passes: a step more for each floor.
  const turn = TWIST * (c + 1) * st.done;
  _v.copy(p.towerPos);
  // The roof lifts a hand as the core arrives beside it.
  if (top) _v.y += 0.06 * courseState(COURSES - 1, ctx.ai).pass;
  _q.setFromAxisAngle(Y, turn + ctx.towerYaw);
  _v.applyQuaternion(_q).multiplyScalar(K).add(TOWER_BASE);
  out.pos.copy(_v);
  out.quat.copy(_q).multiply(p.towerQ);
  out.scale.setScalar(p.towerS * K);
  tiltAbout(out, TOWER_C, ctx.tilt);
  fx.pass = st.pass;
  fx.lit = st.done;
}

/* ------------------------------------------------------------------------ */
/* F3 — the vortex                                                           */
/* ------------------------------------------------------------------------ */

/** The fall at progress f (0..1): how far down (0..1 of the drop) and how big. */
export function fallAt(f: number): { drop: number; K: number } {
  // Heavy: slow to leave, fast through the cloud, reined in over the flat.
  const drop = glide(Math.min(1, f * 1.04)) * 0.92 + 0.08 * f * f;
  const K = TOWER_K + (COL_K - TOWER_K) * glide(Math.min(1, f * 1.1));
  return { drop, K };
}

/** The core's centre as it falls (world): from its perch on the tower down to the colossus's heart. */
const _fs = new THREE.Vector3();
export function fallCore(f: number, out: THREE.Vector3): THREE.Vector3 {
  coreAt(1, _fs).multiplyScalar(TOWER_K).add(TOWER_BASE);
  const { drop } = fallAt(f);
  const k = glide(Math.min(1, f * 1.6));
  return out.set(_fs.x + (COL_C.x - _fs.x) * k, _fs.y + (COL_C.y - _fs.y) * drop, _fs.z + (COL_C.z - _fs.z) * k);
}

/** How far the falling spiral has turned (rad) at fall progress `f`. */
export function vortexSpin(f: number): number {
  return 3.4 * Math.PI * glide(f);
}

function vortexTarget(frag: FragInfo, p: Prep, ctx: FormationCtx, out: Pose) {
  const f = ctx.fall;
  const { K } = fallAt(f);
  fallCore(f, _c);
  // A HELIX trailing up behind the core — the pieces evenly spaced along it in
  // the order they will seat in the colossus (the point's pieces lead, the
  // crown's trail), the leaders tight round the light, the tail wider and
  // higher, the whole spiral turning as it falls: order, even in the fall —
  // and when it lands, every piece is already at its own height.
  const tail = p.helix;
  // Open enough that the pieces never close up into a mass: each falls a
  // little smaller than it will stand, growing to full size as it seats.
  const lag = (0.25 + 1.6 * tail) * K;
  const R = (0.5 + 1.3 * tail) * K * (0.85 + 0.25 * Math.sin(Math.PI * f));
  const ang = tail * Math.PI * 2 * 3.2 + vortexSpin(f) + ctx.flowT * 0.35;
  out.pos.set(_c.x + Math.cos(ang) * R, _c.y + lag, _c.z + Math.sin(ang) * R);
  // Each piece rides the spiral like a blade: its length along the turn.
  _v.set(-Math.sin(ang), 0.35, Math.cos(ang)).normalize();
  _q.setFromUnitVectors(frag.longAxis, _v);
  _q2.setFromAxisAngle(_v, 0.8 * f + p.rand * 0.6);
  out.quat.copy(_q2).multiply(_q);
  out.scale.setScalar(K * (0.95 - 0.33 * glide(f)));
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
      // Beside the tower, climbing it as the AI works (at rest, at its foot).
      coreAt(ctx.ai, out.pos);
      out.pos.multiplyScalar(TOWER_K).add(TOWER_BASE);
      out.quat.setFromAxisAngle(Y, ctx.coreSpin * 1.6);
      out.scale.setScalar(CORE_SCALE * CORE_IN_TOWER * TOWER_K);
      tiltAbout(out, TOWER_C, ctx.tilt);
      return;
    }
    case "F3": {
      fallCore(ctx.fall, out.pos);
      out.quat.setFromAxisAngle(Y, ctx.coreSpin * 2.2);
      const { K } = fallAt(ctx.fall);
      out.scale.setScalar(CORE_SCALE * (CORE_IN_TOWER + (1 - CORE_IN_TOWER) * glide(ctx.fall)) * K);
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
      _v.copy(f.centroid).add(p.burst).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.pos.y += ctx.lift;
      out.quat.copy(ctx.stoneQuat).multiply(p.spin);
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
      towerTarget(p, ctx, out);
      return;
    case "F3":
      vortexTarget(f, p, ctx, out);
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
