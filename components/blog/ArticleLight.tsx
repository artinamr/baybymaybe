"use client";

import { useEffect } from "react";

/**
 * The article's indigo light: any element marked `data-ar-light` gets the
 * pointer's position inside it as `--mx/--my` (CSS paints a soft radial glow
 * there). One delegated listener, written only on a fine pointer, one write
 * per frame. Nothing renders.
 */
export function ArticleLight() {
  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let ev: PointerEvent | null = null;
    const paint = () => {
      raf = 0;
      if (!ev) return;
      const el = (ev.target as Element | null)?.closest?.<HTMLElement>("[data-ar-light]");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((ev.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--my", `${((ev.clientY - r.top) / r.height) * 100}%`);
    };
    const onMove = (e: PointerEvent) => {
      ev = e;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    addEventListener("pointermove", onMove, { passive: true });
    return () => {
      removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
