/**
 * RENDER-FREE STORES — contract (docs/SPEC.md §10).
 *
 * Plain mutable singletons. Written by their owners once per frame (or by
 * event listeners), read anywhere inside the main loop. NEVER mirror these into
 * React state per frame; React only learns about discrete changes via `bus`
 * (or useSyncExternalStore on `scroll.active`).
 *
 * Owners:
 *   scroll  — lib/scroll.ts        (updateScroll(), once per frame)
 *   pointer — lib/scroll.ts        (window pointer listeners)
 *   ui      — DOM components       (hover / focus handlers)
 *   intro   — components/experience/Experience.tsx (the intro gate + clock)
 *   bus     — anyone may emit the events listed in BusEvents
 */
import { CHAPTERS, type ChapterId } from "./chapters";

export type ChapterState = "before" | "active" | "after";

export const scroll = {
  /** Smoothed scroll position in CSS px (Lenis). */
  y: 0,
  /** y / vh — the global chapter coordinate every keyframe is written in. */
  S: 0,
  /** Lenis velocity, px per frame, signed. */
  v: 0,
  /** Viewport in CSS px (stable: innerWidth/innerHeight, updated on resize). */
  vw: 1440,
  vh: 900,
  /** Index into CHAPTERS of the chapter that owns the current S. */
  active: 0,
  /** Per chapter: local s = S − S0 (negative while entering) and its reveal state. */
  chapters: CHAPTERS.map((c) => ({ id: c.id as ChapterId, S0: c.S0, s: 0, state: "before" as ChapterState })),
};

export const pointer = {
  /** CSS px. */
  x: 0,
  y: 0,
  /** Normalised to [-1, 1], +x right, +y UP. */
  nx: 0,
  ny: 0,
  /** A mouse/pen pointer has been seen (false on touch-only devices and until first move). */
  has: false,
  /** True for the frame(s) after a move until a consumer clears it (raycast throttle). */
  moved: false,
  /** performance.now() of the last move. */
  lastMove: 0,
};

export const ui = {
  /** ch02 layer list row focused by hover (-1 = follow scroll). 0 = Foundation (bottom) … 3 = Interface (top). */
  focusTier: -1,
  /** ch04 work row hovered (-1 none). */
  focusRow: -1,
  /** ch03 graph node hovered (-1 none) — set by the Graph raycast. */
  hoverNode: -1,
  hoverEmail: false,
  hoverStone: false,
};

export type IntroState = "wait" | "run" | "done";

export const intro = {
  state: "wait" as IntroState,
  /** performance.now() when the intro started (state → run). */
  t0: 0,
  /** ms since t0 (0 while waiting; keeps counting after done). */
  ms: 0,
  /** Set when the user wheeled/touched before `done` — everything jumps to its end state over 300ms. */
  skipped: false,
};

/* ------------------------------------------------------------------------ */
/* Bus — discrete events only                                                */
/* ------------------------------------------------------------------------ */

export type BusEvents = {
  "intro:run": void;
  "intro:done": void;
  /** The hero thread's head crossed POTENTIAL's cap line. payload = stone's projected x in CSS px. */
  "thread:potential": { x: number };
  /** Active chapter changed. */
  chapter: { id: ChapterId; index: number };
  /** ch05: a method group seated (0..3). */
  seat: { group: number };
  /** ch06: the mark seams lit. */
  "mark:lock": void;
  /** Pointer entered / left the stone (raycast). */
  "stone:hover": { on: boolean };
};

type Handler<T> = (payload: T) => void;

function createBus<E extends Record<string, unknown>>() {
  const map = new Map<keyof E, Set<Handler<never>>>();
  return {
    on<K extends keyof E>(type: K, fn: Handler<E[K]>): () => void {
      let set = map.get(type);
      if (!set) map.set(type, (set = new Set()));
      set.add(fn as Handler<never>);
      return () => set!.delete(fn as Handler<never>);
    },
    emit<K extends keyof E>(type: K, ...payload: E[K] extends void ? [] : [E[K]]) {
      map.get(type)?.forEach((fn) => (fn as Handler<unknown>)(payload[0]));
    },
  };
}

export const bus = createBus<BusEvents>();

/* ------------------------------------------------------------------------ */
/* Boot readiness + DOM measurements                                         */
/* ------------------------------------------------------------------------ */

/**
 * The intro gate (Experience.tsx) waits for every flag. Owners set their own:
 *   fonts  — Experience (document.fonts.ready)
 *   stone  — components/stage/Stone.tsx (geometry built, materials created)
 *   env    — components/stage/StudioEnv.tsx (env cubemap rendered once)
 *   compiled — StageCanvas (renderer.compileAsync done, first frame presented)
 */
export const ready = { fonts: false, stone: false, env: false, compiled: false };

/**
 * DOM measurements the 3D needs, written by lib/scroll.ts on resize / layout change.
 *   rowS[i] — the global S at which ch04 work row i's centre crosses the viewport centre.
 */
export const measured = { rowS: [] as number[] };

/** GPU performance tier from StageCanvas's PerformanceMonitor: 0 best … 3 lowest (SPEC §11). */
export const perf = { tier: 0 };
