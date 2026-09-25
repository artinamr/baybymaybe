"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Section } from "./Section";
import { Pill, GhostPill } from "@/components/chrome/Pills";
import { bus, intro } from "@/lib/stores";
import { hearTheStory, scrollToChapter } from "@/lib/scroll";

const d = (ms: number, extra?: Record<string, string>) => ({ "--d": `${ms}ms`, ...extra }) as CSSProperties;

/**
 * 00 · POTENTIAL. One display voice (Bodoni Moda) for the whole line. The
 * masthead-scale POTENTIAL crosses the frame BEHIND the canvas, so the stone
 * stands in the word and cuts it. It arrives as a hairline outline; the intro's
 * thread of light runs down the stone and, where it crosses the word, the fill
 * wipes open outward from the stone (docs/SPEC.md §2–3).
 */
export function Hero() {
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = fill.current;
    if (!el) return;
    const root = document.documentElement;
    const open = (x?: number) => {
      if (el.dataset.filled) return;
      const left = el.getBoundingClientRect().left;
      const origin = (x ?? window.innerWidth * 0.62) - left;
      el.style.setProperty("--o", `${Math.max(0, origin).toFixed(0)}px`);
      // Next frame, so the origin is committed before the wipe starts.
      requestAnimationFrame(() => (el.dataset.filled = "1"));
    };
    if (root.hasAttribute("data-reduced")) {
      el.dataset.filled = "1";
      el.dataset.instant = "1";
    }
    const off = bus.on("thread:potential", ({ x }) => open(x));
    const timer = window.setInterval(() => {
      if (el.dataset.filled) return window.clearInterval(timer);
      if (intro.state !== "wait" && (intro.ms >= 3200 || intro.skipped)) open();
    }, 150);
    return () => {
      off();
      window.clearInterval(timer);
    };
  }, []);

  return (
    <Section
      id="potential"
      labelledBy="hero-title"
      back={
        <h1 id="hero-title" className="hero-h1">
          <span className="sr-only">Maximise your digital potential</span>
          <span className="hl hl-1 intro-mask" aria-hidden style={d(560)}>
            <span>Maximise</span>
          </span>
          <span className="hl hl-2 intro-mask" aria-hidden style={d(660)}>
            <span>your digital</span>
          </span>
          <span className="hl hl-3 intro-mask" aria-hidden style={d(760, { "--dur": "1100ms" })}>
            <span className="pot">
              <span className="pot-outline" data-pot-outline>
                POTENTIAL
              </span>
              <span className="pot-fill" data-pot-fill ref={fill}>
                POTENTIAL
              </span>
            </span>
          </span>
        </h1>
      }
    >
      <p className="hero-kicker">
        <span className="kicker-rule intro-rule" aria-hidden style={d(460)} />
        <span className="intro" style={d(540)}>
          Digital infrastructure &amp; AI automation
        </span>
      </p>
      <p className="hero-desc intro intro-rise" style={d(1100)}>
        We design, build and run high-performance websites and platforms — and put AI to work inside them, and inside your
        team.
      </p>
      <div className="hero-ctas">
        <span className="intro intro-rise" style={d(1180)}>
          <Pill onClick={hearTheStory} live>
            Explore the studio
          </Pill>
        </span>
        <span className="intro intro-rise" style={d(1260)}>
          <GhostPill onClick={() => scrollToChapter("mark")}>Start a project</GhostPill>
        </span>
      </div>
      <div className="hero-footnote intro" style={d(1400)} aria-hidden="true">
        <span>Independent digital studio</span><span>Scroll to discover <span className="scroll-arrow">↓</span></span>
      </div>
    </Section>
  );
}
