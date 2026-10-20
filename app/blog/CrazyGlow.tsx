"use client";

import { useEffect } from "react";

/**
 * crazy-r29: the indigo light that follows the pointer across the blog
 * index's cards. Writes --mx/--my (px, relative to the card) on the card
 * under a fine pointer; the CSS (crazy-blog-home.css) draws the light.
 * Renders nothing. Without it the light rests at its CSS fallback.
 */
const CARDS = ".bl-kit-list a, .bl-pair-card, .bl-lead-img";

export function CrazyGlow() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let last: PointerEvent | null = null;
    const paint = () => {
      raf = 0;
      const e = last;
      if (!e || !(e.target instanceof Element)) return;
      const card = e.target.closest<HTMLElement>(CARDS);
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${(e.clientX - r.left).toFixed(0)}px`);
      card.style.setProperty("--my", `${(e.clientY - r.top).toFixed(0)}px`);
    };
    const move = (e: PointerEvent) => {
      last = e;
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
