import * as THREE from "three";
import { CORE_SCALE } from "./geo/crystal";
import { CORE, SHARD_COUNT, STONE, type FragInfo } from "./geo/types";
import type { Formation } from "./sceneState";
import { mulberry32 } from "./ease";

/**
 * THE FORMS OF THE STONE (home film, lib/choreo.ts).
 *
 *   F0  intact      the stone (the core hidden inside it), at any home and
 *                   scale — the studio stone, the stone re-made in the sky
 *   F1  burst       it SHATTERS — forty shards thrown out, the core laid bare
 *   F4  exploded    WEBSITES: the burst resolves into an exploded view — every
 *                   shard turned back to its place in the stone and held apart
 *                   along its own line from the heart; the mark's cuts open
 *                   (crown up, blades apart); the core glowing in the middle
 *   F2  monument    PLATFORMS: the stone rebuilt at 2.25× over the cloud sea,
 *                   course by course from the culet up, open joints
 *   F3  sort        AI AUTOMATION, driven by the scroll: the monument is taken
 *                   apart from the top, one piece after another; each takes a
 *                   slow turn round the glowing core and is decided at its
 *                   front — LIT and filed into a column that builds up beside
 *                   the core, or dark and let down into the clouds
 *   F7  colossus    WHY: the stone at colossal scale on the salt flat. It
 *                   BURSTS in slow motion — every piece carried out from the
 *                   heart to twice its distance, a hollow round the burning
 *                   core, and the glass between the heart and the camera
 *                   always standing aside — so the camera flies into the burst,
 *                   turns round the core, and pulls out as it closes again
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
  /** F2: the monument's slow turn (rad). */
  monumentYaw: number;
  /** The core's turn (rad, integrated by the Director). */
  coreSpin: number;
  /** F2/F3: the sculpture leans toward the cursor, about its centre. */
  tilt: THREE.Quaternion;
  /** Time-based life (seconds, integrated by the Director — the cursor can hurry it). */
  flowT: number;
  /** F3: how far the sort has got, 0..1 (scroll). */
  ai: number;
  /** F4: 0..1 how far apart the exploded view is held (breathes a little). */
  explode: number;
  /** F7: where the camera is (the stone opens toward it), and how open it may be (0..1). */
  camPos: THREE.Vector3;
  open: number;
};

/* The monument (F2) stands in the sky over the cloud sea. */
export const MONUMENT_C = new THREE.Vector3(0, 1.3, 0);
export const MONUMENT_K = 2.25;
/** Open joints: every shard sits this much further out than in the stone. */
const JOINT = 0.11;
/* The sort (F3): round the monument's core, seen with the camera at SORT_AZ —
   the ring round the core, the column the chosen pieces build to its right. */
export const SORT_C = MONUMENT_C.clone();
export const SORT_AZ_DEG = -268;
const SORT_AZ = (SORT_AZ_DEG * Math.PI) / 180;
/** Screen-right and toward-the-camera at that point of the film. */
export const SORT_DIR = new THREE.Vector3(Math.cos(SORT_AZ), 0, -Math.sin(SORT_AZ));
const SORT_DEPTH = new THREE.Vector3(Math.sin(SORT_AZ), 0, Math.cos(SORT_AZ));
const LEAD_SCALE = 0.95;
/** A lead's longest extent, whatever shard carries it. */
const LEAD_LEN = 0.62;
const RING_R = 1.55;
const RING_TILT = (22 * Math.PI) / 180;
/** One piece's passage: out of the monument · round the core · to its fate. */
const P_RING = 0.32;
const P_DECIDE = 0.68;
/** How long one piece's passage takes, as a share of the sort. */
const SORT_DUR = 0.34;
const COLUMN_C = SORT_C.clone().addScaledVector(SORT_DIR, 2.45).addScaledVector(SORT_DEPTH, 0.3);
const COLUMN_BASE = -1.9;
const COLUMN_STEP = 0.34;
/* The core's size in each form. */
const CORE_IN_MONUMENT = 0.95;
const CORE_IN_SORT = 0.8;
/* F4: how far apart the exploded view holds (× distance from the heart), and the mark's cuts. */
const EXPLODE_K = 1.3;
const CUT_OPEN = { crown: 0.46, band: 0.2, blade: 0.32 };

/* THE SALT FLAT and the colossus on it (F7). The flat lies far below the sky's
   cloud sea; the stone falls through the cloud to it, growing as it falls. */
export const FLAT_Y = -60;
export const COL_K = 7;
/** The colossus's origin: its culet just touches the flat. */
export const COL_HOME = new THREE.Vector3(0, FLAT_Y - STONE.floorY * COL_K, 0);
/** The colossus's centre (world). */
export const COL_C = new THREE.Vector3(0, COL_HOME.y + STONE.centerY * COL_K, 0);
/* How it opens (stone units × K): the tunnel's radius toward the camera, the
   hollow round the heart, and how far every joint opens. */
const TUNNEL_R = 0.5;
const HOLLOW_R = 1.25;
const EXPAND = 1.05;

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

/** Per-fragment constants, precomputed once from FragInfo. */
type Prep = {
  /** F1 */
  burst: THREE.Vector3;
  spin: THREE.Quaternion;
  /** F2: place in the monument (before its turn), course 0..3 from the culet up. */
  tilePos: THREE.Vector3;
  course: number;
  /** F3: when this piece leaves the monument (0..1 of the sort), its fate, its slot in the column. */
  sortK: number;
  qualified: boolean;
  slot: number;
  /** F3: where on the ring it enters (rad), and the scale that brings it to a lead's common size. */
  entry: number;
  unit: number;
  /** The girdle band: a thin plate that reads as a line wherever it travels alone. */
  thin: boolean;
  tumble: THREE.Vector3;
  filedQ: THREE.Quaternion;
  /** F4: offset from the heart in the exploded view (stone object space). */
  explodeOff: THREE.Vector3;
  /** 0..1 distance from the crack origin (burst stagger). */
  crackK: number;
  /** 0..1 distance from the heart (assembly stagger: the inside first). */
  radK: number;
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
  const ang = Math.atan2(la.clone().cross(al).dot(normal), la.dot(al));
  return new THREE.Quaternion().setFromAxisAngle(normal, ang).multiply(q);
}

/** Build the per-fragment constants. Deterministic; call once with getStone().frags. */
export function prepareFormations(frags: FragInfo[], crackOrigin: THREE.Vector3): void {
  const rand = mulberry32(0x5b3df0);
  const shards = frags.filter((f) => f.index < SHARD_COUNT);
  const maxCrack = Math.max(...shards.map((f) => f.centroid.distanceTo(crackOrigin)));
  const maxRad = Math.max(...shards.map((f) => f.centroid.distanceTo(stoneMid)));

  // F2: courses are quartiles of height, from the culet up.
  const byHeight = shards.map((f) => f.index).sort((a, b) => frags[a].centroid.y - frags[b].centroid.y);
  const courseOf = new Map<number, number>();
  byHeight.forEach((fi, k) => courseOf.set(fi, Math.min(3, Math.floor((k * 4) / byHeight.length))));
  // F3: the monument is taken apart from the top down; a third of the pieces qualify.
  const sortOrder = byHeight.slice().reverse();
  const sortK = new Map<number, number>();
  sortOrder.forEach((fi, k) => sortK.set(fi, k));
  let slots = 0;

  prep = frags.map((f) => {
    const axis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const spin = new THREE.Quaternion().setFromAxisAngle(axis, (rand() * 40 * Math.PI) / 180);
    const burst = f.out.clone().multiplyScalar(1.1 + 1.6 * rand());
    if (f.piece === "crown") burst.y += 0.42;
    if (f.piece === "bladeL") burst.x -= 0.5;
    if (f.piece === "bladeR") burst.x += 0.5;
    const r = rand();
    const k = sortK.get(f.index) ?? 0;
    const tumble = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const qualified = f.index !== CORE && k % 3 === 1;
    const slot = qualified ? slots++ : -1;
    const entry = (rand() - 0.5) * 0.9;
    // The exploded view: along the shard's own line from the heart, further for
    // the far ones, and the mark's cuts opened — crown up, blades apart.
    const explodeOff = f.centroid.clone().sub(stoneMid).multiplyScalar(EXPLODE_K);
    if (f.piece === "crown") explodeOff.y += CUT_OPEN.crown;
    if (f.piece === "band") explodeOff.y += CUT_OPEN.band;
    if (f.piece === "bladeL") explodeOff.x -= CUT_OPEN.blade;
    if (f.piece === "bladeR") explodeOff.x += CUT_OPEN.blade;
    return {
      burst,
      spin,
      tilePos: f.index === CORE ? new THREE.Vector3() : f.centroid.clone().sub(stoneMid).multiplyScalar(MONUMENT_K * (1 + JOINT)),
      course: courseOf.get(f.index) ?? 0,
      sortK: k / Math.max(1, SHARD_COUNT - 1),
      qualified,
      slot,
      entry,
      unit: f.index === CORE ? 1 : Math.min(1.5, Math.max(0.45, LEAD_LEN / Math.max(0.05, f.length))),
      thin: f.piece === "band",
      tumble,
      // Filed: the polished cut face turned to the camera, long axis level.
      filedQ: faceTo(f, SORT_DEPTH, SORT_DIR),
      explodeOff,
      crackK: f.index === CORE ? 0 : f.centroid.distanceTo(crackOrigin) / maxCrack,
      radK: f.index === CORE ? 0 : f.centroid.distanceTo(stoneMid) / maxRad,
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
 * What a formation says about a fragment's light, beyond its pose (F3's leads
 * grow in and dwindle away, flash as they pass the core, stay lit if
 * qualified; F7's walls light as the corridor opens). Read by the Director
 * right after fragTarget. Leads come and go by SCALE, never by alpha: a
 * half-faded shard reads as white ghost glass.
 */
export const fx = { fade: 0, glow: 1, flash: 0, lit: 0, open: 0, scan: 0 };

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** A point of the ring round the core: φ 0 at its back (tilted up), −π/2 on the left, −π at its front. */
function ringPoint(phi: number, out: THREE.Vector3) {
  const c = Math.cos(phi);
  return out
    .copy(SORT_C)
    .addScaledVector(SORT_DIR, RING_R * Math.sin(phi))
    .addScaledVector(SORT_DEPTH, -RING_R * c * Math.cos(RING_TILT))
    .addScaledVector(Y, RING_R * c * Math.sin(RING_TILT));
}

const _b0 = new THREE.Vector3();
const _b1 = new THREE.Vector3();
const _b2 = new THREE.Vector3();
const _b3 = new THREE.Vector3();
function bezier(t: number, out: THREE.Vector3) {
  const s = 1 - t;
  return out
    .copy(_b0)
    .multiplyScalar(s * s * s)
    .addScaledVector(_b1, 3 * s * s * t)
    .addScaledVector(_b2, 3 * s * t * t)
    .addScaledVector(_b3, t * t * t);
}
/** Ease in and out, with a gentle middle: every leg starts and lands softly. */
const glide = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10));

/** The monument's pose of a piece (F2) — where the sort takes it from. */
function monumentPose(p: Prep, ctx: FormationCtx, out: Pose) {
  _q.setFromAxisAngle(Y, ctx.monumentYaw);
  _v.copy(p.tilePos).applyQuaternion(_q);
  out.pos.copy(MONUMENT_C).add(_v);
  out.quat.copy(_q);
  out.scale.setScalar(MONUMENT_K);
  tiltAbout(out, MONUMENT_C, ctx.tilt);
}

/**
 * F3 — one piece's passage in the sort, driven by the scroll (ctx.ai): lifted
 * out of the monument and carried to the ring; a slow half turn round the
 * core, decided at its front (the scan); then filed into the column — lit —
 * or let down into the clouds.
 */
function sortTarget(p: Prep, ctx: FormationCtx, out: Pose) {
  const start = p.sortK * (1 - SORT_DUR);
  const t = Math.min(1, Math.max(0, (ctx.ai - start) / SORT_DUR));
  // The girdle plate steps out once it leaves the monument (and back in as the stone re-forms).
  const size = LEAD_SCALE * p.unit * (p.thin ? 0.002 : 1);
  _q2.setFromAxisAngle(p.tumble, 1.2 * t + p.rand * 6.28);
  if (t <= 0) {
    monumentPose(p, ctx, out);
    fx.glow = 0.6;
    return;
  }
  if (t < P_RING) {
    // Lifted out of its course and carried round to the back of the ring.
    const k = glide(t / P_RING);
    monumentPose(p, ctx, out);
    _b0.copy(out.pos);
    _b1.copy(out.pos).sub(SORT_C).multiplyScalar(0.55).add(out.pos).addScaledVector(Y, 0.8);
    ringPoint(p.entry, _b3);
    _b2.copy(_b3).addScaledVector(SORT_DIR, 1.1).addScaledVector(Y, 0.5);
    bezier(k, out.pos);
    out.quat.slerp(_q2, k);
    out.scale.setScalar(MONUMENT_K + (size - MONUMENT_K) * k);
    fx.glow = 0.4;
    return;
  }
  if (t < P_DECIDE) {
    // Round the core by its left — slowly — and decided at the front.
    const k = (t - P_RING) / (P_DECIDE - P_RING);
    const phi = p.entry + (-Math.PI - p.entry) * glide(k);
    ringPoint(phi, out.pos);
    out.quat.copy(_q2);
    if (p.qualified) out.quat.slerp(p.filedQ, glide((k - 0.5) / 0.5));
    out.scale.setScalar(size);
    fx.scan = Math.exp(-Math.pow((k - 0.86) / 0.12, 2));
    fx.flash = fx.scan;
    fx.glow = p.qualified ? 0.25 + 0.75 * glide((k - 0.7) / 0.3) : 0.25;
    if (p.qualified) fx.lit = glide((k - 0.78) / 0.22);
    return;
  }
  const k = glide((t - P_DECIDE) / (1 - P_DECIDE));
  ringPoint(-Math.PI, _b0);
  if (p.qualified) {
    // Filed into the column, which builds up beside the core.
    _b3.copy(COLUMN_C).addScaledVector(Y, COLUMN_BASE + COLUMN_STEP * p.slot);
    _b1.copy(_b0).addScaledVector(SORT_DIR, 0.9).addScaledVector(Y, -0.2);
    _b2.copy(_b3).addScaledVector(SORT_DEPTH, 0.6).addScaledVector(Y, 0.35);
    bezier(k, out.pos);
    out.quat.copy(p.filedQ);
    out.scale.setScalar(size);
    fx.glow = 1;
    fx.lit = 1;
    return;
  }
  // The noise: let down, turning slowly, into the clouds.
  out.pos
    .copy(_b0)
    .addScaledVector(SORT_DEPTH, 0.8 * k)
    .addScaledVector(SORT_DIR, -0.4 * k)
    .addScaledVector(Y, -7.5 * k * k);
  out.quat.copy(_q2);
  out.scale.setScalar(size * Math.max(0.002, 1 - glide((k - 0.55) / 0.45)));
  fx.glow = 0.08;
}

/**
 * F7 — one shard of the colossus. Open, every joint parts a little from the
 * heart; the glass between the heart and the camera stands aside (radially
 * from that line, only up to just behind the camera), and a hollow opens
 * round the heart — wherever the camera goes, it has room, and the heart is
 * always in view.
 */
function colossusTarget(f: FragInfo, p: Prep, ctx: FormationCtx, out: Pose) {
  const K = ctx.K;
  _v.copy(f.centroid).multiplyScalar(K).applyQuaternion(ctx.stoneQuat).add(ctx.home);
  out.quat.copy(ctx.stoneQuat);
  out.scale.setScalar(K);
  // Each piece on its own beat: the outer shell leaves first and seats last.
  const d = 0.42 * (1 - p.radK);
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
    // Each piece turns on itself as it flies out — the burst has spin.
    _q2.setFromAxisAngle(p.tumble, 0.55 * e * (0.5 + p.rand));
    out.quat.multiply(_q2);
  }
  out.pos.copy(_v);
}

/** The core's pose in each form. */
function coreTarget(F: Formation, ctx: FormationCtx, out: Pose) {
  switch (F) {
    case "F2":
      out.pos.copy(MONUMENT_C);
      out.quat.setFromAxisAngle(Y, ctx.coreSpin);
      out.scale.setScalar(CORE_IN_MONUMENT);
      tiltAbout(out, MONUMENT_C, ctx.tilt);
      return;
    case "F3":
      out.pos.copy(SORT_C);
      out.quat.setFromAxisAngle(Y, ctx.coreSpin * 1.6);
      out.scale.setScalar(CORE_IN_MONUMENT + (CORE_IN_SORT - CORE_IN_MONUMENT) * glide(ctx.ai * 3));
      tiltAbout(out, SORT_C, ctx.tilt);
      return;
    case "F4":
      _v.copy(stoneMid).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.quat.setFromAxisAngle(Y, ctx.coreSpin).premultiply(ctx.stoneQuat);
      out.scale.setScalar(CORE_SCALE * 1.3);
      return;
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
      _v.copy(f.centroid).addScaledVector(p.explodeOff, ctx.explode).applyQuaternion(ctx.stoneQuat);
      out.pos.copy(ctx.home).add(_v);
      out.quat.copy(ctx.stoneQuat);
      // The girdle band is a thin plate: held apart it would read as a line. It
      // steps out of the exploded view and back in as the stone assembles.
      if (f.piece === "band") out.scale.setScalar(0.002);
      return;
    }
    case "F2": {
      _q.setFromAxisAngle(Y, ctx.monumentYaw);
      _v.copy(p.tilePos).applyQuaternion(_q);
      out.pos.copy(MONUMENT_C).add(_v);
      out.quat.copy(_q);
      out.scale.setScalar(MONUMENT_K);
      tiltAbout(out, MONUMENT_C, ctx.tilt);
      return;
    }
    case "F3":
      sortTarget(p, ctx, out);
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

/** Compose T·S·R into `m`. */
export function poseMatrix(p: Pose, m: THREE.Matrix4): THREE.Matrix4 {
  _R.makeRotationFromQuaternion(p.quat);
  _S.makeScale(p.scale.x, p.scale.y, p.scale.z);
  m.multiplyMatrices(_S, _R);
  m.elements[12] = p.pos.x;
  m.elements[13] = p.pos.y;
  m.elements[14] = p.pos.z;
  return m;
}
