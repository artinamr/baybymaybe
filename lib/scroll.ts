"use client";

import { useSyncExternalStore } from "react";
import Lenis from "lenis";
import { CHAPTERS, chapter, type ChapterId } from "./chapters";
import { bus, intro, measured, pointer, scroll, type ChapterState } from "./stores";
import { computeLayout, invalidateTextMetrics, layout, type Layout } from "./layout";
import { easeInOutCubic, easeInOutQuart } from "./ease";

/**
 * SCROLL, POINTER, LAYOUT — the page's inputs (CONTRACTS §3 E5).
 *
 * Lenis eases the wheel; everything else reads `scroll.S` (screens). Section
 * heights are multiples of --vh, set from innerHeight and only refreshed when
 * the width changes or the height moves by more than 120px — so a mobile URL
 * bar sliding in and out never re-flows the film.
 */

let lenis: Lenis | null = null;
let vhPx = 9;
let lastW = 0;
let lastH = 0;
let maxScrollY = 1;
let sections: HTMLElement[] = [];
const frameHooks = new Set<(S: number) => void>();

export function getLenis(): Lenis | null {
  return lenis;
}

/** Run `cb` once per frame after the scroll store updates. Returns an unsubscribe. */
export function onScrollFrame(cb: (S: number) => void): () => void {
  frameHooks.add(cb);
  return () => frameHooks.delete(cb);
}

function px(n: number) {
  return `${Math.round(n * 100) / 100}px`;
}

/** Write the layout authority's numbers as CSS custom properties. */
function writeLayoutVars(L: Layout) {
  const s = document.documentElement.style;
  const h = L.hero;
  const vars: [string, number][] = [
    ["--g", L.G],
    ["--nav-h", L.navH],
    ["--pot-size", h.potSize],
    ["--pot-left", h.potLeft],
    ["--pot-width", h.potWidth],
    ["--pot-baseline", h.potBaseline],
    ["--pot-cap", h.potCapTop],
    ["--l1-size", h.l1Size],
    ["--l1-left", h.l1Left],
    ["--l1-cap", h.l1CapTop],
    ["--l2-size", h.l2Size],
    ["--l2-left", h.l2Left],
    ["--l2-indent", h.l2Indent],
    ["--l2-baseline", h.l2Baseline],
    ["--eyebrow-top", h.eyebrowTop],
    ["--band-top", h.bandTop],
    ["--cta-left", h.ctaLeft],
    ["--cta-right", h.ctaRight],
    ["--desc-width", h.descWidth],
  ];
  for (const [k, v] of vars) if (Number.isFinite(v)) s.setProperty(k, px(v));
  s.setProperty("--hero-axis", `${(h.axisX * 100).toFixed(3)}%`);
  measureDisplay(s);
  document.documentElement.dataset.layout = L.mode;
}

let metricsCtx: CanvasRenderingContext2D | null = null;

/**
 * The display face's real vertical metrics, as ratios of font-size:
 *   --dA / --dD   ascent / descent CSS uses to build the line box
 *   --dCap        cap height (ink top of "H")
 * so CSS can place a line by its BASELINE (or cap top) exactly where the
 * layout authority solved it, for any face — no magic offsets.
 */
function measureDisplay(s: CSSStyleDeclaration) {
  metricsCtx ??= document.createElement("canvas").getContext("2d");
  const ctx = metricsCtx;
  if (!ctx) return;
  const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-bodoni").trim() || "Georgia, serif";
  ctx.font = `400 100px ${fam}`;
  const m = ctx.measureText("H");
  const a = m.fontBoundingBoxAscent / 100;
  const d = m.fontBoundingBoxDescent / 100;
  const cap = m.actualBoundingBoxAscent / 100;
  if (a > 0 && d >= 0 && cap > 0) {
    s.setProperty("--dA", a.toFixed(4));
    s.setProperty("--dD", d.toFixed(4));
    s.setProperty("--dCap", cap.toFixed(4));
  }
}

function relayout(force = false) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (force || w !== lastW || Math.abs(h - lastH) > 120 || lastH === 0) {
    lastW = w;
    lastH = h;
    vhPx = h / 100;
    document.documentElement.style.setProperty("--vh", px(vhPx));
    scroll.vw = w;
    scroll.vh = h;
    layout.current = computeLayout(w, h);
    writeLayoutVars(layout.current);
  }
  sections = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
  maxScrollY = Math.max(1, document.documentElement.scrollHeight - scroll.vh);
  const y = window.scrollY;
  measured.rowS = Array.from(document.querySelectorAll<HTMLElement>("[data-row]")).map((el) => {
    const r = el.getBoundingClientRect();
    return (r.top + y + r.height / 2 - scroll.vh / 2) / scroll.vh;
  });
}

/**
 * Mount once. Starts Lenis (native scroll under reduced motion), the pointer
 * store, layout + CSS vars, and the intro skip. Returns cleanup.
 */
export function initScroll(): () => void {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.toggleAttribute("data-reduced", reduced);

  relayout(true);
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.85, smoothWheel: true, syncTouch: false, autoRaf: false });
  }

  const onResize = () => relayout();
  window.addEventListener("resize", onResize);
  const ro = new ResizeObserver(() => relayout());
  ro.observe(document.body);
  document.fonts?.ready.then(() => {
    invalidateTextMetrics();
    relayout(true);
  });

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    pointer.has = true;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1);
    pointer.moved = true;
    pointer.lastMove = performance.now();
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  // Any wheel / touch before the intro finishes fast-forwards it; scroll is never blocked.
  const onEarly = () => {
    if (intro.state !== "done" && !intro.skipped) {
      intro.skipped = true;
      root.setAttribute("data-intro-skip", "");
    }
  };
  window.addEventListener("wheel", onEarly, { passive: true });
  window.addEventListener("touchstart", onEarly, { passive: true });
  window.addEventListener("keydown", onEarly);

  return () => {
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("wheel", onEarly);
    window.removeEventListener("touchstart", onEarly);
    window.removeEventListener("keydown", onEarly);
    ro.disconnect();
    lenis?.destroy();
    lenis = null;
  };
}

/** Reveal state of a chapter from its local s. */
function stateFor(i: number, s: number): ChapterState {
  const c = CHAPTERS[i];
  const end = c.sticky ? c.holdEnd + 0.45 : c.vh / 100 - 0.4;
  if (s < -0.35) return "before";
  if (s > end) return "after";
  return "active";
}

/** Once per frame, after lenis.raf. */
export function updateScroll(time: number): void {
  if (lenis) lenis.raf(time);
  const y = lenis ? lenis.scroll : window.scrollY;
  scroll.y = y;
  scroll.S = y / Math.max(1, scroll.vh);
  scroll.v = lenis ? lenis.velocity : 0;

  let active = 0;
  for (let i = 0; i < CHAPTERS.length; i++) {
    const c = scroll.chapters[i];
    c.s = scroll.S - c.S0;
    const st = stateFor(i, c.s);
    const el = sections[i];
    if (el) {
      el.style.setProperty("--s", c.s.toFixed(4));
      if (st !== c.state || el.dataset.state !== st) el.dataset.state = st;
    }
    c.state = st;
    if (scroll.S >= c.S0 - 0.5) active = i;
  }
  document.documentElement.style.setProperty("--page-progress", String(Math.min(1, y / maxScrollY)));
  const scrolled = scroll.S > 0.15;
  if (scrolled !== document.documentElement.hasAttribute("data-scrolled")) {
    document.documentElement.toggleAttribute("data-scrolled", scrolled);
  }
  if (active !== scroll.active) {
    scroll.active = active;
    bus.emit("chapter", { id: CHAPTERS[active].id, index: active });
  }
  pointer.moved = false;
  frameHooks.forEach((cb) => cb(scroll.S));
}

/** Smooth-scroll to a global S (screens). */
export function scrollToS(S: number, durationSec?: number, easing?: (t: number) => number): void {
  const target = S * scroll.vh;
  const d = durationSec ?? Math.min(2.8, Math.max(1.2, 0.35 * Math.abs(S - scroll.S)));
  if (lenis) lenis.scrollTo(target, { duration: d, easing: easing ?? easeInOutQuart, force: true });
  else window.scrollTo({ top: target, behavior: document.documentElement.hasAttribute("data-reduced") ? "auto" : "smooth" });
}

export function scrollToChapter(id: ChapterId): void {
  scrollToS(chapter(id).jumpS);
}

/** "Hear the story": into the thesis, slow and even. */
export function hearTheStory(): void {
  scrollToS(chapter("cut").jumpS, 2.4, easeInOutCubic);
}

function subscribe(cb: () => void) {
  return bus.on("chapter", cb);
}

/** The active chapter index (re-renders only when it changes). */
export function useActiveChapter(): number {
  return useSyncExternalStore(
    subscribe,
    () => scroll.active,
    () => 0
  );
}
