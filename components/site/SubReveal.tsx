"use client";

import { useEffect } from "react";

/**
 * The site's own pages' motion: every [data-rv] element rises out of a soft
 * blur as it enters the viewport — once. Nothing waits for it: without JS
 * everything is simply shown (the rule lives under html[data-sp]).
 */
export function SubReveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-sp", "");
    root.dataset.intro = "done";
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-rv]"));
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
    return () => {
      io.disconnect();
      root.removeAttribute("data-sp");
    };
  }, []);
  return null;
}
