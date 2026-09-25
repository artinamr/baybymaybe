/**
 * THE LAYOUT AUTHORITY — contract (docs/SPEC.md §2, §10, §12). Replaces
 * lib/heroLayout.ts. This is the ONLY place hero/chapter geometry is derived;
 * the DOM (via CSS vars written by lib/scroll.ts) and the 3D (via
 * layout.current) both read it, which is what keeps the stone standing in
 * POTENTIAL at every viewport.
 *
 * OWNER: E5 (Platform). The contract fields keep their names and meanings; the
 * fields marked "additive" are extra outputs other modules may use.
 *
 * How the hero is solved (desktop; tablet/mobile swap the constants):
 *   1. POTENTIAL is fitted with canvas measureText in its real face (Instrument
 *      Sans wdth 75 / 700 caps) so its INK spans exactly W − 2G, unless its cap
 *      height would pass 0.21H — then it stops short, still left-aligned at G.
 *   2. Camera distance + principal-point y are solved by projecting the stone's
 *      real defining points through the K0 camera, so apex/culet land exactly on
 *      their screen fractions (perspective included, not the orthographic fit).
 *   3. The stone axis starts at wordLeft + 0.63·wordWidth, clamped to 0.55–0.66W,
 *      then moves to the NEAREST x where the occlusion rule holds: no glyph more
 *      than 55 % hidden, the I's stem visible on every row, and the stone still
 *      cutting at least one glyph. It is checked against a conservative
 *      envelope — the widest idle yaw, the end of the Ken-Burns dolly and the
 *      principal-point parallax — so the rule holds for the whole idle loop,
 *      not just one frame.
 *   4. L1 and L2 are measured and kept 0.025W clear of the stone's left flank at
 *      their own heights. L2's indent shrinks first and its size only after.
 *
 * Pure math + optional DOM text measurement: in Node (or during the static
 * prerender) the measurement falls back to approximate metrics, so the module
 * stays importable and deterministic everywhere.
 */
import { STONE } from "./geo/types";
import type { ChapterId } from "./chapters";

export type LayoutMode = "desktop" | "tablet" | "mobile";

/** Axis-aligned box in CSS px (viewport space, hero at rest). */
export type Box = { x0: number; y0: number; x1: number; y1: number };
/** A POTENTIAL glyph's ink box + how much of it the (conservative) stone hides, 0..1. */
export type GlyphBox = Box & { ch: string; hidden: number };

export type Layout = {
  vw: number;
  vh: number;
  mode: LayoutMode;
  /** Gutter, px: clamp(20, 4vw, 72). */
  G: number;
  /** Nav band height, px (76 desktop/tablet, 60 mobile). */
  navH: number;

  hero: {
    /** Stone axis x as a fraction of vw. */
    axisX: number;
    /** Apex / culet y as fractions of vh at rest. */
    apexY: number;
    culetY: number;
    /** Principal point (where the stone's bbox centre lands on screen), fractions. */
    pp: [number, number];
    /** Camera distance at K0 (fov 30, el 4°) that makes the stone span culetY − apexY. */
    dist: number;
    /** POTENTIAL: font-size px, left px, advance width px, baseline px, cap-top px. */
    potSize: number;
    potLeft: number;
    potWidth: number;
    potBaseline: number;
    potCapTop: number;
    /** L2 ("your digital") indent px, measured from G. */
    l2Indent: number;

    /* ---- additive ---- */
    /** K0 elevation (radians) and rest yaw (radians) the solve assumed. */
    el: number;
    restYaw: number;
    /** L1 "Maximise": font-size px, element left px (G − 0.03em optical), cap-top px. */
    l1Size: number;
    l1Left: number;
    l1CapTop: number;
    /** L2 "your digital": font-size px (after any shrink), left px (G + indent), baseline px. */
    l2Size: number;
    l2Left: number;
    l2Baseline: number;
    /** Eyebrow top px; bottom band (description + CTAs) top px; CTA run left/right px; description max width px. */
    eyebrowTop: number;
    bandTop: number;
    ctaLeft: number;
    ctaRight: number;
    descWidth: number;
    /** Ground-mist hard cutoff (fraction of vh from the top): POTENTIAL baseline + 0.01H (SPEC §4.6). */
    mistClipY: number;
  };

  /** Resting principal point per chapter (fractions) — choreo keys may override per key. */
  pp: Record<ChapterId, [number, number]>;

  /** Additive: everything `?debug=safe` draws, and the result of the solve's asserts. */
  safe: {
    /** No 3D above this y at rest (nav bottom + 24 px). */
    navBottom: number;
    /** Projected apex y (px) at the end of the Ken-Burns dolly — must be ≥ navBottom. */
    apexPx: number;
    glyphs: GlyphBox[];
    /** Rest-pose stone silhouette (flat x,y px) and the conservative envelope used for the rule. */
    silhouette: number[];
    envelope: number[];
    l1: Box;
    l2: Box;
    pot: Box;
    /** Bottom band blocks (description, CTA run) and the specimen card. */
    desc: Box;
    cta: Box;
    card: Box;
    /** True when every hero assert held; `notes` says which did not. */
    ok: boolean;
    notes: string[];
  };

  /**
   * Camera distance at which an object of world height `h` spans `heightFrac` of the
   * viewport height, for vertical fov `fovDeg` (degrees).
   */
  fit(heightFrac: number, fovDeg: number, h?: number): number;
};

function fit(heightFrac: number, fovDeg: number, h: number = STONE.height): number {
  const half = (fovDeg * Math.PI) / 360;
  return h / (2 * Math.tan(half) * Math.max(0.05, heightFrac));
}

/* ------------------------------------------------------------------------ */
/* Constants (SPEC §2, §4.7, §6, §8, §12)                                     */
/* ------------------------------------------------------------------------ */

const DEG = Math.PI / 180;
const FOV = 30;
/** K0 elevation. */
const EL0 = 4 * DEG;
/** Rest yaw, idle amplitude and pointer amplitude (SPEC §4.7). */
const REST_YAW = 20 * DEG;
const IDLE_YAW = 18 * DEG;
const POINTER_YAW = 4 * DEG;
/** Ken-Burns dolly bottoms out at ×0.965 distance — the stone is largest then. */
const KB_MIN = 0.965;
/** Principal-point parallax ±0.004W (SPEC §4.7). */
const PARALLAX = 0.004;

const POT_TEXT = "POTENTIAL";
const L1_TEXT = "Maximise";
const L2_TEXT = "your digital";
/** Tracking in em (SPEC §8). */
const POT_TRACK = -0.02;
const L1_TRACK = -0.028;
const L2_TRACK = -0.028;

/** Occlusion rule (SPEC §2). */
const MAX_HIDDEN = 0.55;
/** The I's stem keeps at least this fraction of its width on every row — "never fully hidden". */
const I_MIN_VISIBLE = 0.2;
/** Line clearance to the stone flank (SPEC §2: 0.025W). */
const FLANK_GAP = 0.025;

/** The 10 defining hull points in stone object space (SPEC §1). */
const H = STONE.halfDiag;
const B = STONE.bandH;
const DEFINING: readonly (readonly [number, number, number])[] = [
  [H, 0, 0],
  [0, 0, H],
  [-H, 0, 0],
  [0, 0, -H],
  [H, B, 0],
  [0, B, H],
  [-H, B, 0],
  [0, B, -H],
  STONE.apex,
  STONE.culet,
];

/* ------------------------------------------------------------------------ */
/* Text metrics                                                              */
/* ------------------------------------------------------------------------ */

type FontSpec = {
  /** CSS font-family list. */
  family: string;
  weight: number;
  style: "normal" | "italic";
  /** Percent (75 = condensed). */
  stretch: number;
};

/** Metrics of one line of text at 1px font size, tracking NOT included. */
type LineMetrics = {
  /** Origin x of each glyph (kerning-aware). */
  pos: number[];
  /** Ink box of each glyph relative to its origin. */
  inkL: number[];
  inkR: number[];
  asc: number[];
  desc: number[];
  /** Plain advance of the whole string. */
  advance: number;
};

const REF_PX = 200;
let metricsVersion = 0;
const metricsCache = new Map<string, LineMetrics>();
let measureCtx: CanvasRenderingContext2D | null | undefined;

/**
 * Drop every cached measurement. lib/scroll.ts calls this when web fonts finish
 * loading — the fallback face measured before that has different metrics.
 */
export function invalidateTextMetrics(): void {
  metricsVersion++;
  metricsCache.clear();
}

function stretchKeyword(pct: number): string {
  if (pct <= 56) return "ultra-condensed";
  if (pct <= 68) return "extra-condensed";
  if (pct <= 81) return "condensed";
  if (pct <= 93) return "semi-condensed";
  return "normal";
}

function getCtx(): CanvasRenderingContext2D | null {
  if (measureCtx !== undefined) return measureCtx;
  if (typeof document === "undefined") return (measureCtx = null);
  measureCtx = document.createElement("canvas").getContext("2d");
  return measureCtx;
}

/**
 * Approximate metrics for when there is no DOM (Node, the static prerender) —
 * close enough that the first client paint is already near its final layout.
 */
function fallbackMetrics(text: string, f: FontSpec): LineMetrics {
  const condensed = f.stretch < 90;
  const serif = f.style === "italic";
  const wide = "MWmw";
  const narrow = "Iijlt ";
  const pos: number[] = [];
  const inkL: number[] = [];
  const inkR: number[] = [];
  const asc: number[] = [];
  const desc: number[] = [];
  let x = 0;
  for (const ch of text) {
    let a = serif ? 0.42 : 0.56;
    if (wide.includes(ch)) a *= 1.45;
    else if (narrow.includes(ch)) a *= 0.5;
    if (condensed) a *= 0.8;
    if (ch === ch.toUpperCase() && ch !== " " && !condensed && !serif) a *= 1.12;
    pos.push(x);
    inkL.push(ch === " " ? 0 : 0.04);
    inkR.push(ch === " " ? 0 : a - 0.04 + (serif ? 0.04 : 0));
    const caps = ch === ch.toUpperCase();
    asc.push(ch === " " ? 0 : caps || "bdfhklt".includes(ch) ? 0.71 : 0.5);
    desc.push("gjpqy".includes(ch) ? 0.22 : 0.01);
    x += a;
  }
  return { pos, inkL, inkR, asc, desc, advance: x };
}

/**
 * The real face's width, measured by the DOM. Canvas `fontStretch` is not
 * universally supported (and a variable font's wdth can be reached several
 * ways), so the canvas result is calibrated against this; ~1.0 where canvas
 * stretch works.
 */
function domAdvance(text: string, f: FontSpec): number {
  const el = document.createElement("span");
  const s = el.style;
  s.position = "absolute";
  s.left = "-99999px";
  s.top = "0";
  s.visibility = "hidden";
  s.whiteSpace = "pre";
  s.fontFamily = f.family;
  s.fontWeight = String(f.weight);
  s.fontStyle = f.style;
  s.fontStretch = `${f.stretch}%`;
  s.fontSize = `${REF_PX}px`;
  s.letterSpacing = "0px";
  s.fontKerning = "normal";
  s.lineHeight = "1";
  el.textContent = text;
  (document.body ?? document.documentElement).appendChild(el);
  const w = el.getBoundingClientRect().width;
  el.remove();
  return w / REF_PX;
}

function measureLine(text: string, f: FontSpec): LineMetrics {
  const key = `${metricsVersion}|${text}|${f.family}|${f.weight}|${f.style}|${f.stretch}`;
  const hit = metricsCache.get(key);
  if (hit) return hit;

  const ctx = getCtx();
  if (!ctx) return fallbackMetrics(text, f);

  ctx.font = `${f.style} ${f.weight} ${REF_PX}px ${f.family}`;
  const c2 = ctx as CanvasRenderingContext2D & { fontStretch?: string; letterSpacing?: string };
  if ("fontStretch" in c2) (c2 as { fontStretch: string }).fontStretch = stretchKeyword(f.stretch);
  if ("letterSpacing" in c2) c2.letterSpacing = "0px";
  ctx.fontKerning = "normal";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const chars = Array.from(text);
  const pos: number[] = [];
  const inkL: number[] = [];
  const inkR: number[] = [];
  const asc: number[] = [];
  const desc: number[] = [];
  let prefix = "";
  for (const ch of chars) {
    // Glyph origin = width(prefix + ch) − width(ch): includes the kern pair
    // (prev, ch), which width(prefix) alone would miss.
    const whole = ctx.measureText(prefix + ch).width;
    const m = ctx.measureText(ch);
    pos.push((whole - m.width) / REF_PX);
    inkL.push(-m.actualBoundingBoxLeft / REF_PX);
    inkR.push(m.actualBoundingBoxRight / REF_PX);
    asc.push(m.actualBoundingBoxAscent / REF_PX);
    desc.push(m.actualBoundingBoxDescent / REF_PX);
    prefix += ch;
  }
  let advance = ctx.measureText(text).width / REF_PX;

  // Calibrate x against the DOM's real face (see domAdvance).
  const dom = domAdvance(text, f);
  if (dom > 0 && advance > 0) {
    const k = dom / advance;
    if (Math.abs(k - 1) > 0.004) {
      for (let i = 0; i < chars.length; i++) {
        pos[i] *= k;
        inkL[i] *= k;
        inkR[i] *= k;
      }
      advance = dom;
    }
  }

  const out: LineMetrics = { pos, inkL, inkR, asc, desc, advance };
  metricsCache.set(key, out);
  return out;
}

/** Ink extent of a measured line at `size` px with tracking `track` em. Relative to the element's left. */
function inkExtent(m: LineMetrics, size: number, track: number) {
  let l = Infinity;
  let r = -Infinity;
  let a = 0;
  let d = 0;
  for (let i = 0; i < m.pos.length; i++) {
    if (m.inkR[i] <= m.inkL[i]) continue; // spaces
    const o = m.pos[i] + i * track;
    l = Math.min(l, o + m.inkL[i]);
    r = Math.max(r, o + m.inkR[i]);
    a = Math.max(a, m.asc[i]);
    d = Math.max(d, m.desc[i]);
  }
  if (!Number.isFinite(l)) l = r = 0;
  return { left: l * size, right: r * size, asc: a * size, desc: d * size };
}

/* ------------------------------------------------------------------------ */
/* Font families                                                             */
/* ------------------------------------------------------------------------ */

function cssFamily(varName: string, probeSel: string | null, fallback: string): string {
  if (typeof document === "undefined" || typeof getComputedStyle === "undefined") return fallback;
  if (probeSel) {
    const el = document.querySelector(probeSel);
    if (el) {
      const f = getComputedStyle(el).fontFamily;
      if (f) return f;
    }
  }
  // Read from <body>: next/font's variable classes may sit on <html> or <body>,
  // and custom properties only inherit downward.
  const host = document.body ?? document.documentElement;
  const v = getComputedStyle(host).getPropertyValue(varName).trim();
  return v || fallback;
}

/* ------------------------------------------------------------------------ */
/* Projection of the stone through the K0 camera (pure math)                 */
/* ------------------------------------------------------------------------ */

type Cam = { D: number; el: number; W: number; H: number; ppx: number; ppy: number; fovDeg: number };

/**
 * Orbit camera at az 0: pos = pivot + D·(0, sin el, cos el) looking at the
 * pivot (the stone's bbox centre). Basis: right (1,0,0), up (0, cos el, −sin el),
 * forward (0, −sin el, −cos el). The principal point is where the pivot lands —
 * identical to CameraRig's setViewOffset.
 */
function project(out: number[], p: readonly [number, number, number], yaw: number, cam: Cam): void {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const x = p[0] * c + p[2] * s;
  const z = -p[0] * s + p[2] * c;
  const ce = Math.cos(cam.el);
  const se = Math.sin(cam.el);
  const dy = p[1] - (STONE.centerY + cam.D * se);
  const dz = z - cam.D * ce;
  const yc = dy * ce - dz * se;
  const zc = -(dy * se + dz * ce);
  const k = cam.H / (2 * zc * Math.tan((cam.fovDeg * Math.PI) / 360));
  out.push(cam.ppx * cam.W + x * k, cam.ppy * cam.H - yc * k);
}

/** Andrew's monotone chain; flat [x,y,…] in, flat hull (CCW in screen space) out. */
function hull2D(pts: number[]): number[] {
  const n = pts.length / 2;
  const idx = Array.from({ length: n }, (_, i) => i).sort(
    (a, b) => pts[2 * a] - pts[2 * b] || pts[2 * a + 1] - pts[2 * b + 1]
  );
  const cross = (o: number, a: number, b: number) =>
    (pts[2 * a] - pts[2 * o]) * (pts[2 * b + 1] - pts[2 * o + 1]) -
    (pts[2 * a + 1] - pts[2 * o + 1]) * (pts[2 * b] - pts[2 * o]);
  const lower: number[] = [];
  for (const i of idx) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], i) <= 0) lower.pop();
    lower.push(i);
  }
  const upper: number[] = [];
  for (let k = idx.length - 1; k >= 0; k--) {
    const i = idx[k];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], i) <= 0) upper.pop();
    upper.push(i);
  }
  const h = lower.slice(0, -1).concat(upper.slice(0, -1));
  const out: number[] = [];
  for (const i of h) out.push(pts[2 * i], pts[2 * i + 1]);
  return out;
}

function silhouette(yaw: number, cam: Cam): number[] {
  const pts: number[] = [];
  for (const p of DEFINING) project(pts, p, yaw, cam);
  return hull2D(pts);
}

/** Horizontal extent [l, r] of a convex polygon at scanline y, or null if it misses. */
function extentAt(poly: number[], y: number, out: [number, number]): boolean {
  let l = Infinity;
  let r = -Infinity;
  const n = poly.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ax = poly[2 * i];
    const ay = poly[2 * i + 1];
    const bx = poly[2 * j];
    const by = poly[2 * j + 1];
    if ((y < ay && y < by) || (y > ay && y > by)) continue;
    if (ay === by) {
      l = Math.min(l, ax, bx);
      r = Math.max(r, ax, bx);
      continue;
    }
    const x = ax + ((y - ay) / (by - ay)) * (bx - ax);
    l = Math.min(l, x);
    r = Math.max(r, x);
  }
  if (l > r) return false;
  out[0] = l;
  out[1] = r;
  return true;
}

const ROWS = 18;
const _ext: [number, number] = [0, 0];

/** Fraction of `box` covered by `poly` shifted by dx (and widened by `pad` px each side). */
function coverage(poly: number[], box: Box, dx: number, pad: number): { hidden: number; minVisible: number } {
  const w = box.x1 - box.x0;
  const h = box.y1 - box.y0;
  if (w <= 0 || h <= 0) return { hidden: 0, minVisible: 1 };
  let sum = 0;
  let minVis = 1;
  for (let k = 0; k < ROWS; k++) {
    const y = box.y0 + ((k + 0.5) / ROWS) * h;
    let cov = 0;
    if (extentAt(poly, y, _ext)) {
      const l = Math.max(box.x0, _ext[0] + dx - pad);
      const r = Math.min(box.x1, _ext[1] + dx + pad);
      cov = Math.max(0, r - l) / w;
    }
    sum += cov;
    minVis = Math.min(minVis, 1 - cov);
  }
  return { hidden: sum / ROWS, minVisible: minVis };
}

/** Leftmost x of `poly` (shifted by dx) over the band [y0, y1]; +Infinity if the band misses it. */
function flankLeft(poly: number[], y0: number, y1: number, dx: number): number {
  let l = Infinity;
  for (let k = 0; k <= ROWS; k++) {
    const y = y0 + (k / ROWS) * (y1 - y0);
    if (extentAt(poly, y, _ext)) l = Math.min(l, _ext[0] + dx);
  }
  // A band can straddle a vertex (the girdle corner): include vertices inside it.
  for (let i = 0; i < poly.length; i += 2) {
    if (poly[i + 1] >= y0 && poly[i + 1] <= y1) l = Math.min(l, poly[i] + dx);
  }
  return l;
}

/* ------------------------------------------------------------------------ */
/* The solve                                                                 */
/* ------------------------------------------------------------------------ */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function computeLayout(vw: number, vh: number): Layout {
  const W = Math.max(1, vw);
  const Hh = Math.max(1, vh);
  // Mobile means a real portrait phone; a small near-square window is a tablet.
  const mode: LayoutMode = W <= 767 && Hh > W * 1.2 ? "mobile" : W <= 1099 ? "tablet" : "desktop";
  const mobile = mode === "mobile";
  const tablet = mode === "tablet";
  const G = clamp(W * 0.04, 20, 72);
  const navH = mobile ? 60 : 76;
  const notes: string[] = [];

  /* ---- mode constants (SPEC §2, §12) ---- */
  const typeK = tablet ? 0.9 : 1;
  const potBaseline = (mobile ? 0.62 : 0.775) * Hh;
  const potCapMax = (mobile ? 0.075 : 0.21 * typeK) * Hh;
  const l1CapTop = (mobile ? 0.13 : 0.2) * Hh;
  const l2Baseline = (mobile ? 0.28 : 0.43) * Hh;
  const eyebrowTop = (mobile ? 0.1 : 0.155) * Hh;
  const culetY = mobile ? 0.71 : tablet ? 0.85 : 0.88;
  const apexWanted = mobile ? 0.31 : tablet ? 0.15 : 0.12;
  const axisRange: [number, number] = mobile ? [0.56, 0.72] : tablet ? [0.56, 0.7] : [0.55, 0.66];

  /* ---- fonts ---- */
  const serifFallback = "'Bodoni Moda', Didot, Georgia, serif";
  // One display voice: Bodoni Moda, whose hairlines and knife-point serifs are
  // the typographic twin of the stone's edge highlights.
  const displayFamily = cssFamily("--font-bodoni", "[data-pot-outline]", serifFallback);
  const potFont: FontSpec = { family: displayFamily, weight: 400, style: "normal", stretch: 100 };
  const l1Font: FontSpec = { family: displayFamily, weight: 400, style: "normal", stretch: 100 };
  const l2Font: FontSpec = { family: displayFamily, weight: 400, style: "normal", stretch: 100 };

  /* ---- 1. POTENTIAL fit ---- */
  const pm = measureLine(POT_TEXT, potFont);
  const pInk1 = inkExtent(pm, 1, POT_TRACK);
  const capRatio = Math.max(0.3, pm.asc[POT_TEXT.indexOf("T")] || 0.7); // flat-topped T = true cap height
  const inkW1 = Math.max(0.1, pInk1.right - pInk1.left);
  const sizeByWidth = (W - 2 * G) / inkW1;
  const sizeByCap = potCapMax / capRatio;
  const potSize = Math.min(sizeByWidth, sizeByCap);
  const potLeft = G - pInk1.left * potSize; // P's ink starts exactly at G
  const potWidth = (pm.advance + POT_TRACK * POT_TEXT.length) * potSize; // CSS inline box width
  const potCapTop = potBaseline - capRatio * potSize;
  const wordLeft = G;
  const wordWidth = inkW1 * potSize;

  const glyphs: GlyphBox[] = Array.from(POT_TEXT).map((ch, i) => {
    const o = potLeft + (pm.pos[i] + i * POT_TRACK) * potSize;
    return {
      ch,
      x0: o + pm.inkL[i] * potSize,
      x1: o + pm.inkR[i] * potSize,
      y0: potBaseline - pm.asc[i] * potSize,
      y1: potBaseline + pm.desc[i] * potSize,
      hidden: 0,
    };
  });

  /* ---- 2. camera distance + principal-point y (perspective-exact) ---- */
  const apexFloor = (navH + 24) / Hh;
  // The Ken-Burns dolly grows the stone ×(1/0.965) about the principal point, lifting
  // the apex; start it low enough that it still clears nav bottom + 24 px at the end.
  const kbLift = 1 / KB_MIN - 1;
  const apexY = Math.max(apexWanted, (apexFloor + kbLift * 0.5) / (1 + kbLift));
  const frac = culetY - apexY;
  const cam: Cam = { D: fit(frac, FOV), el: EL0, W, H: Hh, ppx: 0, ppy: (apexY + culetY) / 2, fovDeg: FOV };
  const tmp: number[] = [];
  for (let it = 0; it < 4; it++) {
    tmp.length = 0;
    project(tmp, STONE.apex, REST_YAW, cam);
    project(tmp, STONE.culet, REST_YAW, cam);
    const ya = tmp[1];
    const yc = tmp[3];
    cam.D *= (yc - ya) / (frac * Hh);
    tmp.length = 0;
    project(tmp, STONE.apex, REST_YAW, cam);
    project(tmp, STONE.culet, REST_YAW, cam);
    cam.ppy += ((apexY + culetY) / 2 - (tmp[1] + tmp[3]) / 2 / Hh);
  }
  const dist = cam.D;
  const ppy = cam.ppy;

  // Silhouettes at ppx = 0 — moving the axis only translates them in x.
  const rest = silhouette(REST_YAW, cam);
  // Envelope: widest idle yaw (the sway crosses 0° once the pointer adds its 4°) at
  // the closest Ken-Burns distance. The rotated square's extents are symmetric, so
  // yaw 0 contains every other idle yaw's silhouette.
  const widestYaw = Math.abs(REST_YAW - IDLE_YAW - POINTER_YAW) < 45 * DEG ? 0 : REST_YAW;
  const envCam: Cam = { ...cam, D: cam.D * KB_MIN };
  const envelope = silhouette(widestYaw, envCam);
  const pad = PARALLAX * W;

  // Apex at the end of the dolly (for the nav assert).
  tmp.length = 0;
  project(tmp, STONE.apex, REST_YAW, envCam);
  const apexPx = tmp[1];

  /* ---- 3. stone axis + occlusion rule ---- */
  const iIndex = POT_TEXT.indexOf("I");
  const prefAxis = mobile || tablet ? 0.64 : clamp((wordLeft + 0.63 * wordWidth) / W, axisRange[0], axisRange[1]);

  const evalAxis = (ax: number) => {
    const dx = ax * W;
    let worst = 0;
    let iVis = 1;
    let cuts = false;
    for (let g = 0; g < glyphs.length; g++) {
      const c = coverage(envelope, glyphs[g], dx, pad);
      worst = Math.max(worst, c.hidden);
      if (g === iIndex) iVis = c.minVisible;
      if (!cuts && coverage(rest, glyphs[g], dx, 0).hidden > 0.02) cuts = true;
    }
    const violation = Math.max(0, worst - MAX_HIDDEN) + Math.max(0, I_MIN_VISIBLE - iVis) + (cuts ? 0 : 0.5);
    return violation;
  };

  let axisX = prefAxis;
  let bestV = evalAxis(prefAxis);
  if (bestV > 0) {
    // Nearest valid x, scanning outward from the preference in 0.1 % steps.
    const step = 0.001;
    const span = Math.max(prefAxis - axisRange[0], axisRange[1] - prefAxis);
    let found = false;
    let bestX = prefAxis;
    for (let d = step; d <= span + 1e-9 && !found; d += step) {
      for (const ax of [prefAxis - d, prefAxis + d]) {
        if (ax < axisRange[0] - 1e-9 || ax > axisRange[1] + 1e-9) continue;
        const v = evalAxis(ax);
        if (v === 0) {
          bestX = ax;
          bestV = 0;
          found = true;
          break;
        }
        if (v < bestV - 1e-6) {
          bestV = v;
          bestX = ax;
        }
      }
    }
    axisX = bestX;
    if (bestV > 0) notes.push(`occlusion rule unsatisfiable in [${axisRange.join(", ")}]; least-bad axis ${axisX.toFixed(3)}`);
  }
  const dxAxis = axisX * W;
  for (const g of glyphs) g.hidden = coverage(envelope, g, dxAxis, pad).hidden;

  /* ---- 4. L1 / L2 against the stone's flank ---- */
  const gap = FLANK_GAP * W;
  const maxRight = (y0: number, y1: number) => {
    const f = flankLeft(envelope, y0, y1, dxAxis) - pad;
    // The stone is not in this band (mobile: it starts below L2) — the frame edge limits instead.
    return Number.isFinite(f) ? Math.min(f - gap, W - G) : W - G;
  };

  // L1 "Maximise": x = G − 0.03em; shrinks only if it would reach the crown.
  const l1m = measureLine(L1_TEXT, l1Font);
  let l1Size = mobile ? 0.13 * W : Math.min(0.074 * W, 0.12 * Hh) * typeK;
  for (let it = 0; it < 3; it++) {
    const e = inkExtent(l1m, l1Size, L1_TRACK);
    const left = G - 0.03 * l1Size;
    const top = l1CapTop;
    const base = top + e.asc;
    const limit = maxRight(top, base + e.desc);
    const right = left + e.right;
    if (right <= limit) break;
    l1Size *= Math.max(0.5, (limit - left) / Math.max(1, e.right));
  }
  const l1Left = G - 0.03 * l1Size;
  const l1e = inkExtent(l1m, l1Size, L1_TRACK);
  const l1Box: Box = { x0: l1Left + l1e.left, y0: l1CapTop, x1: l1Left + l1e.right, y1: l1CapTop + l1e.asc + l1e.desc };

  // L2 "your digital": indent = min(0.07W, room); the indent shrinks first, then the size.
  const l2m = measureLine(L2_TEXT, l2Font);
  let l2Size = mobile ? 0.13 * W : l1Size;
  let l2Indent = 0;
  for (let it = 0; it < 4; it++) {
    const e = inkExtent(l2m, l2Size, L2_TRACK);
    const limit = maxRight(l2Baseline - e.asc, l2Baseline + e.desc);
    const room = limit - (G + e.right);
    if (room >= 0) {
      l2Indent = Math.min(0.07 * W, room);
      break;
    }
    l2Indent = 0;
    l2Size *= Math.max(0.5, (limit - G) / Math.max(1, e.right));
  }
  const l2Left = G + l2Indent;
  const l2e = inkExtent(l2m, l2Size, L2_TRACK);
  const l2Box: Box = {
    x0: l2Left + l2e.left,
    y0: l2Baseline - l2e.asc,
    x1: l2Left + l2e.right,
    y1: l2Baseline + l2e.desc,
  };

  /* ---- bottom band (SPEC §2 / §12) ---- */
  const bandTop = (mobile ? 0.77 : 0.845) * Hh;
  const ctaLeft = mobile ? G : 0.31 * W;
  const ctaRight = mobile ? W - G : 0.53 * W;
  const descWidth = mobile ? W - 2 * G : Math.max(0.26 * W, 260);
  const desc: Box = { x0: G, y0: bandTop, x1: G + descWidth, y1: bandTop + 3 * 24 };
  const ctaTop = mobile ? 0.88 * Hh : bandTop;
  const cta: Box = { x0: ctaLeft, y0: ctaTop, x1: ctaRight, y1: ctaTop + (mobile ? 44 : 48) };
  const card: Box = mobile || tablet
    ? { x0: 0, y0: 0, x1: 0, y1: 0 }
    : { x0: W - G - 264, y0: 0.835 * Hh, x1: W - G, y1: 0.955 * Hh };

  /* ---- asserts (SPEC §13) ---- */
  const navBottom = navH + 24;
  if (apexPx < navBottom - 0.5) notes.push(`apex ${apexPx.toFixed(1)}px enters the nav band (< ${navBottom}px)`);
  if (!glyphs.some((g) => coverage(rest, g, dxAxis, 0).hidden > 0.02)) notes.push("stone overlaps no POTENTIAL glyph");
  for (const g of glyphs) if (g.hidden > MAX_HIDDEN + 1e-3) notes.push(`glyph ${g.ch} ${(g.hidden * 100).toFixed(0)}% hidden`);
  if (l2Size < (mobile ? 0.13 * W : l1Size) - 0.5) notes.push(`L2 shrunk to ${l2Size.toFixed(1)}px to clear the stone`);

  /* ---- per-chapter principal points (SPEC §6; mobile: 3D in a top band) ---- */
  const pp: Record<ChapterId, [number, number]> = mobile
    ? {
        potential: [axisX, ppy],
        cut: [0.5, 0.3],
        order: [0.5, 0.3],
        current: [0.5, 0.3],
        field: [0.5, 0.3],
        method: [0.5, 0.3],
        mark: [0.5, 0.3],
      }
    : {
        potential: [axisX, ppy],
        cut: [0.62, 0.5],
        order: [0.66, 0.52],
        current: [0.31, 0.5],
        field: [0.7, 0.48],
        method: [0.66, 0.52],
        mark: [0.66, 0.5],
      };

  return {
    vw: W,
    vh: Hh,
    mode,
    G,
    navH,
    hero: {
      axisX,
      apexY,
      culetY,
      pp: [axisX, ppy],
      dist,
      potSize,
      potLeft,
      potWidth,
      potBaseline,
      potCapTop,
      l2Indent,
      el: EL0,
      restYaw: REST_YAW,
      l1Size,
      l1Left,
      l1CapTop,
      l2Size,
      l2Left,
      l2Baseline,
      eyebrowTop,
      bandTop,
      ctaLeft,
      ctaRight,
      descWidth,
      mistClipY: potBaseline / Hh + 0.01,
    },
    pp,
    safe: {
      navBottom,
      apexPx,
      glyphs,
      silhouette: rest.map((v, i) => (i % 2 === 0 ? v + dxAxis : v)),
      envelope: envelope.map((v, i) => (i % 2 === 0 ? v + dxAxis : v)),
      l1: l1Box,
      l2: l2Box,
      pot: { x0: wordLeft, y0: potCapTop, x1: wordLeft + wordWidth, y1: potBaseline },
      desc,
      cta,
      card,
      ok: notes.length === 0,
      notes,
    },
    fit,
  };
}

/** The current layout. Recomputed by lib/scroll.ts on resize and after fonts load. */
export const layout: { current: Layout } = {
  current: computeLayout(1440, 900),
};
