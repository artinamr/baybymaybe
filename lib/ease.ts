/**
 * EASING + SCALAR HELPERS for the choreography (docs/SPEC.md §3, §5, §6).
 *
 * Everything here is pure and allocation-free after module init, so it is safe
 * inside the frame loop and runs unchanged in node (scripted sanity checks).
 */

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
export const clamp = (x: number, a: number, b: number): number => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Normalised position of x inside the window [a, b], clamped to 0..1. */
export function range(x: number, a: number, b: number): number {
  return b === a ? (x < a ? 0 : 1) : clamp01((x - a) / (b - a));
}

/** GLSL-style smoothstep (edge order a < b). */
export function smoothstep(a: number, b: number, x: number): number {
  const t = range(x, a, b);
  return t * t * (3 - 2 * t);
}

export const linear = (t: number): number => t;
export const easeInOutSine = (t: number): number => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
export const easeOutSine = (t: number): number => Math.sin((clamp01(t) * Math.PI) / 2);
export const easeInOutCubic = (t: number): number => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOutQuart = (t: number): number => {
  const x = clamp01(t);
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
};
export const easeOutExpo = (t: number): number => {
  const x = clamp01(t);
  return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
};

/**
 * CSS `cubic-bezier(x1, y1, x2, y2)` — the intro's camera move uses the same
 * curve as the DOM clip (`.16,1,.3,1`) so the canvas and the window it sits in
 * land together. Newton on x(t) with a bisection fallback; no allocation per call.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-6) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    // Newton stalled (flat derivative near the ends): bisect.
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

/** SPEC §3: the intro's shared curve (clip, camera distance, principal point, yaw). */
export const easeIntro = cubicBezier(0.16, 1, 0.3, 1);

/*
 * Normalised damped spring, x(0)=0 → x(1)=1 exactly, ~3% overshoot peaking near
 * t≈0.45. Used for ch05 seating ("each group springs home") and the ch06 yaw lock,
 * which are scroll-scrubbed — so the spring must be a pure function of progress,
 * not a simulated one, or rewinding would not retrace the same path.
 *   ζ = 0.745 gives e^(−ζπ/√(1−ζ²)) ≈ 0.03 overshoot; ω is chosen so the residual
 *   at t = 1 is ~4e-4, then folded out linearly so the end is exact.
 */
const SP_Z = 0.745;
const SP_W = 10.47;
const SP_WD = SP_W * Math.sqrt(1 - SP_Z * SP_Z);
function rawSpring(t: number): number {
  return 1 - Math.exp(-SP_Z * SP_W * t) * (Math.cos(SP_WD * t) + ((SP_Z * SP_W) / SP_WD) * Math.sin(SP_WD * t));
}
const SP_END = rawSpring(1);
export function easeSpring(t: number): number {
  const x = clamp01(t);
  return rawSpring(x) + (1 - SP_END) * x;
}

/** Deterministic PRNG (seeded formations, glint intervals). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEG = Math.PI / 180;
