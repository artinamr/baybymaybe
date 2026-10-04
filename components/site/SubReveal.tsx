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
    // Keyboard focus never lands on something still waiting to rise (low in the
    // screen, below the observer's line): whatever holds the focus shows at once.
    const onFocus = (e: FocusEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.<HTMLElement>("[data-rv]");
      if (el && !el.dataset.in) {
        el.style.transition = "none";
        el.dataset.in = "1";
        io.unobserve(el);
      }
    };
    document.addEventListener("focusin", onFocus);
    return () => {
      io.disconnect();
      document.removeEventListener("focusin", onFocus);
      root.removeAttribute("data-sp");
    };
  }, []);
  return null;
}
