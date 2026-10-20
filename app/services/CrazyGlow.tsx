"use client";

import { useEffect } from "react";

/**
 * The indigo light that follows the pointer across the services index's
 * cards: one delegated listener writes --mx/--my (px, relative to the card)
 * onto the nearest [data-glow] element, at most once a frame. Renders nothing.
 */
export function CrazyGlow() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let ev: PointerEvent | null = null;
    const paint = () => {
      raf = 0;
      if (!ev) return;
      const t = ev.target instanceof Element ? ev.target.closest<HTMLElement>("[data-glow]") : null;
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty("--mx", `${(ev.clientX - r.left).toFixed(1)}px`);
      t.style.setProperty("--my", `${(ev.clientY - r.top).toFixed(1)}px`);
    };
    const move = (e: PointerEvent) => {
      ev = e;
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
