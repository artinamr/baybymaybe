"use client";

import { useEffect } from "react";

/**
 * Which stage you are reading, for the methodology's sticky photograph: it
 * writes `data-active` (the stage's index) on the element `root` names, and
 * marks the stage's link in the rail with `aria-current`. The stages are the
 * `[data-stage]` elements inside it; the one whose top has passed the middle
 * of the screen is current. CSS does the rest (the photographs cross-fade).
 * Renders nothing: the page itself is server-rendered.
 */
export function StageSpy({ root }: { root: string }) {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(root);
    if (!el) return;
    const stages = [...el.querySelectorAll<HTMLElement>("[data-stage]")];
    const links = [...el.querySelectorAll<HTMLAnchorElement>(".mf-rail a")];
    let raf = 0;
    let last = -1;
    const pick = () => {
      raf = 0;
      const line = innerHeight * 0.5;
      let cur = 0;
      stages.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= line) cur = i;
      });
      if (cur === last) return;
      last = cur;
      el.dataset.active = String(cur);
      links.forEach((a, i) => (i === cur ? a.setAttribute("aria-current", "step") : a.removeAttribute("aria-current")));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    pick();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [root]);
  return null;
}
