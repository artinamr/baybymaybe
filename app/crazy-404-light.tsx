"use client";

import { useEffect } from "react";

/**
 * The 404's light: writes the pointer's place (--mx/--my, 0..1) onto the
 * page's main so the indigo pool and the ghost numeral follow it. Writes only
 * when the pointer moves, once per frame; nothing on touch.
 */
export function NfLight() {
  useEffect(() => {
    const el = document.querySelector<HTMLElement>(".nf-main");
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let x = 0.5;
    let y = 0.5;
    const paint = () => {
      raf = 0;
      el.style.setProperty("--mx", x.toFixed(4));
      el.style.setProperty("--my", y.toFixed(4));
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x = Math.min(1, Math.max(0, (e.clientX - r.left) / Math.max(1, r.width)));
      y = Math.min(1, Math.max(0, (e.clientY - r.top) / Math.max(1, r.height)));
      if (!raf) raf = requestAnimationFrame(paint);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
