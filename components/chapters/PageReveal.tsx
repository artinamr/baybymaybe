"use client";

import { useEffect } from "react";

/**
 * The page sections' motion: each [data-rv] item rises out of a soft blur as
 * it comes into view (the methodology page's voice), once. Without JS or with
 * reduced motion everything is simply shown (globals.css).
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
  return null;
}
