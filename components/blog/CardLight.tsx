"use client";

import { useEffect, useRef } from "react";

/**
 * The card's surface: a sheet of paper that rises under the card on hover,
 * with an indigo light that follows the pointer. It writes --mx/--my (px,
 * in the card's own box) onto the card, once per frame at most, and only on
 * a device with a real pointer. Purely decorative: no layout, no content.
 */
export function CardLight() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    const card = el?.parentElement;
    if (!el || !card) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      raf = 0;
      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
    };
    const move = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      x = Math.round(e.clientX - r.left);
      y = Math.round(e.clientY - r.top);
      if (!raf) raf = requestAnimationFrame(paint);
    };
    card.addEventListener("pointermove", move, { passive: true });
    card.addEventListener("pointerenter", move, { passive: true });
    return () => {
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerenter", move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <span ref={ref} className="bl-card-light" aria-hidden />;
}
