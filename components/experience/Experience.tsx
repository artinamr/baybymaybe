"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { advance } from "@react-three/fiber";
import { getLenis, initScroll, updateScroll } from "@/lib/scroll";
import { bus, intro, ready, scroll } from "@/lib/stores";
import { atToS, dev } from "@/lib/dev";
import { openStory, story, updateStory } from "@/lib/story";
import { devNum } from "@/lib/dev";
import { LogoMark, MARK_MASK } from "@/components/chrome/LogoMark";
import { CHAPTERS, type ChapterId } from "@/lib/chapters";
import { jumpToAudit, scrollToChapter } from "@/lib/scroll";

const StageCanvas = dynamic(() => import("@/components/stage/StageCanvas"), { ssr: false });
// Without WebGL the stage stays empty — through a client-only component all
// the same, so the server's markup (a client-render boundary) is what the
// browser hydrates in either case (a bare null here was a hydration error).
const NoStage = dynamic(() => Promise.resolve(() => null), { ssr: false });

const INTRO_DONE_MS = 3400;
/** The loader waits for the stone, its room and its compiled shaders — never
    longer than this (a slow device still gets the page, a hitch or two). */
const GATE_FALLBACK_MS = 7000;
/** …and shows for at least this long, so the mark always finishes assembling. */
const GATE_MIN_MS = 950;

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
    if (dev.render) root.setAttribute("data-render", "");
    root.dataset.intro = "wait";
    const cleanup = initScroll();
    const reduced = root.hasAttribute("data-reduced");
    document.fonts?.ready.then(() => (ready.fonts = true));

    const land = () => {
      const at = atToS(dev.at);
      if (at === null) return;
      const y = at * scroll.vh;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    };
    land();
    // (Look-dev: again once the page is measured — on a phone the sheets are
    // far taller than their minimum, and the first landing falls short or long.)
    if (dev.at) {
      const off = bus.on("intro:run", () => {
        off();
        requestAnimationFrame(land);
      });
    }

    // A link to `/#story` (the methodology page's nav) opens the story once the intro has played.
    if (window.location.hash === "#story") {
      const off = bus.on("intro:done", () => {
        off();
        window.setTimeout(openStory, 300);
      });
    }
    // Look-dev: `?story=<P>` opens the story at that point of its film.
    const storyAt = devNum("story");
    if (storyAt !== null) {
      window.setTimeout(() => {
        openStory();
        story.P = story.target = storyAt;
      }, 400);
    }

    const t0 = performance.now();
    let skipAt = -1;
    const start = (t: number) => {
      // THE HAND-OFF: the loader's mark flies up into the nav's own (whose
      // rect is already final — before the intro it is only transparent) as
      // the paper lifts, and the nav's mark takes over the moment it lands.
      const fly = document.querySelector<HTMLElement>("#loader .ld-fly");
      const to = document.querySelector<SVGElement>(".nav-brand .nav-mark");
      if (fly && to && !reduced && !dev.freeze) {
        const a = fly.getBoundingClientRect();
        const b = to.getBoundingClientRect();
        if (a.width > 0 && b.width > 0) {
          const L = document.getElementById("loader");
          L?.style.setProperty("--fx", `${(b.left + b.width / 2 - (a.left + a.width / 2)).toFixed(1)}px`);
          L?.style.setProperty("--fy", `${(b.top + b.height / 2 - (a.top + a.height / 2)).toFixed(1)}px`);
          L?.style.setProperty("--fs", (b.width / a.width).toFixed(4));
          root.setAttribute("data-handoff", "");
          window.setTimeout(() => root.removeAttribute("data-handoff"), 1000);
        }
      }
      intro.state = "run";
      intro.t0 = t;
      performance.mark("nd:start");
      root.dataset.intro = "run";
      bus.emit("intro:run");
    };

    // A link from another page (/#build, /#contact…) lands on its section as
    // soon as the page is up — measured, fonts in — the hero's intro skipped.
    const hash = window.location.hash.slice(1);
    if (hash === "contact" || CHAPTERS.some((c) => c.id === hash && c.id !== "potential")) {
      const off = bus.on("intro:run", () => {
        off();
        intro.skipped = true;
        root.setAttribute("data-intro-skip", "");
        requestAnimationFrame(() => (hash === "contact" ? jumpToAudit() : scrollToChapter(hash as ChapterId)));
      });
    }
    const finish = () => {
      intro.state = "done";
      root.dataset.intro = "done";
      bus.emit("intro:done");
    };

    let raf = 0;
    let lastT = -1;
    let loadP = 0;
    const loader = document.getElementById("loader");
    const loaderN = loader?.querySelector<HTMLElement>(".ld-n") ?? null;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const dt = lastT < 0 ? 1 / 60 : Math.min(0.05, (t - lastT) / 1000);
      lastT = t;
      updateScroll(t);
      updateStory(dt);

      if (intro.state === "wait") {
        const all = ready.fonts && ready.stone && ready.env && ready.compiled;
        // The loader's line: what is really ready, eased; creeping on while
        // the shaders compile so it never sits still.
        const got = (+ready.fonts + +ready.stone + +ready.env + +ready.compiled) / 4;
        const creep = 0.55 * (1 - Math.exp(-(t - t0) / 1400));
        loadP += (Math.max(got * 0.97, Math.min(0.9, creep)) - loadP) * (1 - Math.exp(-dt * 7));
        if (loader) loader.style.setProperty("--ld", loadP.toFixed(4));
        if (loaderN) loaderN.textContent = String(Math.round(loadP * 100)).padStart(3, "0");
        const due = all && t - t0 > GATE_MIN_MS;
        if (due || !webgl || reduced || dev.freeze || t - t0 > GATE_FALLBACK_MS) {
          if (loader) loader.style.setProperty("--ld", "1");
          if (loaderN) loaderN.textContent = "100";
          start(t);
        }
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
      {/* THE LOADER — the mark assembles (plate, then the two blades) while
          the stone, its room and its shaders get ready; it gives way to the
          intro. Server-rendered, so it is the very first paint. */}
      <div id="loader" aria-hidden>
        <div className="ld-veil" />
        <div className="ld-in">
          <div className="ld-fly">
            <LogoMark className="ld-mark" />
            <span className="ld-glint" style={{ WebkitMaskImage: MARK_MASK, maskImage: MARK_MASK }} />
          </div>
          <div className="ld-bar">
            <span />
            <i />
          </div>
          <p className="ld-n mono">000</p>
        </div>
      </div>
      <div id="field" aria-hidden />
      <div id="field-card" aria-hidden />
      <div id="stage" aria-hidden>
        {gl ? <StageCanvas /> : <NoStage />}
      </div>
      <div id="stage-frame" aria-hidden />
      {children}
    </>
  );
}
