"use client";

import { useEffect } from "react";

/**
 * The methodology page's motion: every [data-rv] element rises out of a soft
 * blur as it enters the viewport, and the timeline's line fills with the scroll
 * (--line on .mp-timeline). The page never waits for it: without JS
 * everything is simply shown.
 */
export function MethodReveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-mp", "");
    root.dataset.intro = "done";
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-rv]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.in = "1";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));

    const line = document.querySelector<HTMLElement>(".mp-timeline");
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!line) return;
      const r = line.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (window.innerHeight * 0.6 - r.top) / Math.max(1, r.height)));
      line.style.setProperty("--line", p.toFixed(4));
    };
    raf = requestAnimationFrame(tick);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      root.removeAttribute("data-mp");
    };
  }, []);
  return null;
}
