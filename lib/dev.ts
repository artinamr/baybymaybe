/**
 * DEV TOOLS — parsed from the URL once (docs/SPEC.md §10 "Dev tools").
 *
 *   ?at=order:0.6      jump to chapter `order`, local s = 0.6  (global S = S0 + s)
 *   ?at=3.4            jump to global S = 3.4
 *   &freeze=1          stop film time (deterministic screenshots); intro is done instantly
 *   ?overlay=mark      superimpose public/new-logo.svg at 30 % over the finale (IoU check)
 *   ?debug=safe        draw layout safe rects + glyph boxes, show renderer.info draw calls
 *
 * Parsed at module evaluation. On the server (static export prerender) there is
 * no URL, so everything is off — which is also why every dev overlay is mounted
 * after hydration, never during the first render (no hydration mismatch).
 */
import { CHAPTERS, S_MAX, type ChapterId } from "./chapters";

export type Dev = {
  /** Raw `at` value (`"order:0.6"` or `"3.4"`), null when absent. */
  at: string | null;
  freeze: boolean;
  overlay: string | null;
  debugSafe: boolean;
};

function parse(): Dev {
  if (typeof window === "undefined") return { at: null, freeze: false, overlay: null, debugSafe: false };
  const q = new URLSearchParams(window.location.search);
  // `?debug=safe,foo` and `?debug=safe&debug=foo` both work.
  const debug = q.getAll("debug").flatMap((v) => v.split(","));
  const freeze = q.get("freeze");
  return {
    at: q.get("at"),
    freeze: freeze === "1" || freeze === "true",
    overlay: q.get("overlay"),
    debugSafe: debug.includes("safe"),
  };
}

export const dev: Dev = parse();

/**
 * Film time (seconds) the Director should hold while `dev.freeze` is on. Far
 * enough past the intro (3.4 s) and the thread that every time-based beat has
 * settled, and a fixed phase of the idle sine loops, so screenshots repeat.
 */
export const FROZEN_TIME_S = 6;

/** `"order:0.6"` → S0(order) + 0.6; `"3.4"` → 3.4. Clamped to [0, S_MAX]; null if unparseable. */
export function atToS(at: string | null): number | null {
  if (!at) return null;
  const [head, tail] = at.split(":");
  let S: number;
  if (tail !== undefined) {
    const c = CHAPTERS.find((d) => d.id === (head as ChapterId));
    const s = Number(tail);
    if (!c || !Number.isFinite(s)) return null;
    S = c.S0 + s;
  } else {
    const byId = CHAPTERS.find((d) => d.id === (head as ChapterId));
    S = byId ? byId.jumpS : Number(head);
    if (!Number.isFinite(S)) return null;
  }
  return Math.min(S_MAX, Math.max(0, S));
}

/**
 * Renderer stats for `?debug=safe`, written by StageCanvas (once per frame, only
 * while the debug flag is on) and read by the Experience overlay on a timer.
 * `calls` is the previous frame's draw-call count (renderer.info auto-resets).
 */
export const devStats = { calls: 0, triangles: 0, programs: 0, maxCalls: 0 };

/** SPEC §11 / §13 dev assert. */
export const MAX_DRAW_CALLS = 16;
