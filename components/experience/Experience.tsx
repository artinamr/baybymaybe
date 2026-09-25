"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { advance } from "@react-three/fiber";
import { getLenis, initScroll, updateScroll } from "@/lib/scroll";
import { bus, intro, ready, scroll } from "@/lib/stores";
import { atToS, dev } from "@/lib/dev";

const StageCanvas = dynamic(() => import("@/components/stage/StageCanvas"), { ssr: false });

const INTRO_DONE_MS = 3400;
const GATE_FALLBACK_MS = 1500;

function hasWebGL2(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * The experience shell: the fixed layers the page and the stone live on, and
 * THE ONE LOOP. A single rAF drives Lenis, the scroll store, the intro clock
 * and the R3F frame (Canvas frameloop="never" + advance), so the DOM, the
 * scroll and the 3D share one frame — the inversion clip and the leader lines
 * can never lag the stone.
 *
 * The intro waits for fonts, the stone, the baked environment and compiled
 * shaders (or 1.5 s, whichever first), then flips html[data-intro] — the DOM
 * half of the intro is pure CSS keyed on that attribute.
 */
export function Experience({ children }: { children: ReactNode }) {
  // Decided once on the client. On the server the dynamic canvas renders
  // nothing either way, so the markup matches at hydration.
  const [gl] = useState(() => (typeof window === "undefined" ? true : hasWebGL2()));

  useEffect(() => {
    const root = document.documentElement;
    const webgl = gl;
    if (!webgl) root.setAttribute("data-nowebgl", "");
    root.dataset.intro = "wait";
    const cleanup = initScroll();
    const reduced = root.hasAttribute("data-reduced");
    document.fonts?.ready.then(() => (ready.fonts = true));

    const at = atToS(dev.at);
    if (at !== null) {
      const y = at * scroll.vh;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    }

    const t0 = performance.now();
    let skipAt = -1;
    const start = (t: number) => {
      intro.state = "run";
      intro.t0 = t;
      root.dataset.intro = "run";
      bus.emit("intro:run");
    };
    const finish = () => {
      intro.state = "done";
      root.dataset.intro = "done";
      bus.emit("intro:done");
    };

    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      updateScroll(t);

      if (intro.state === "wait") {
        const all = ready.fonts && ready.stone && ready.env && ready.compiled;
        if (all || !webgl || reduced || dev.freeze || t - t0 > GATE_FALLBACK_MS) start(t);
      }
      if (intro.state !== "wait") {
        intro.ms = t - intro.t0;
        if (intro.state === "run") {
          if (intro.skipped && skipAt < 0) skipAt = t;
          if (reduced || dev.freeze || intro.ms >= INTRO_DONE_MS || (skipAt >= 0 && t - skipAt > 320)) finish();
        }
      }
      if (webgl) advance(t / 1000);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, [gl]);

  return (
    <>
      <div id="field" aria-hidden />
      <div id="field-card" aria-hidden />
      <div id="stage" aria-hidden>
        {gl ? <StageCanvas /> : null}
      </div>
      <div id="stage-frame" aria-hidden />
      {children}
    </>
  );
}
