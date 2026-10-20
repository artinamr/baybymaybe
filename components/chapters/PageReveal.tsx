"use client";

import { useEffect } from "react";
import "./crazy-sheets.css";

/**
 * The page sections' motion: each [data-rv] item rises out of a soft blur as
 * it comes into view (the methodology page's voice), once. Without JS or with
 * reduced motion everything is simply shown (globals.css).
 *
 * crazy-r29: also the pointer's light on the sheets' cards. One delegated
 * listener writes --mx/--my onto the card under the pointer (a work cover or
 * a stage), once per frame and only while the pointer is over one, so the
 * film's frame loop never pays for it.
 */
export function PageReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".page-sec [data-rv]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.in = "1";
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    let raf = 0;
    let target: HTMLElement | null = null;
    let x = 0;
    let y = 0;
    const paint = () => {
      raf = 0;
      if (!target) return;
      const r = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${(((x - r.left) / Math.max(1, r.width)) * 100).toFixed(1)}%`);
      target.style.setProperty("--my", `${(((y - r.top) / Math.max(1, r.height)) * 100).toFixed(1)}%`);
    };
    const move = (e: PointerEvent) => {
      const t = e.target instanceof Element ? e.target.closest<HTMLElement>(".page-sec .work-media, .page-sec .step") : null;
      if (!t) {
        target = null;
        return;
      }
      target = t;
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => {
      document.removeEventListener("pointermove", move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
