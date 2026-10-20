"use client";

import { useEffect } from "react";

/**
 * Sets --mx / --my (px, relative to the card) on whichever card under the
 * pointer matches `sel`, so the CSS can carry an indigo light that follows it.
 * Mouse and pen only; touch never shows the light.
 */
export function PointerGlow({ sel }: { sel: string }) {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const t = e.target as Element | null;
      const card = t && "closest" in t ? (t.closest(sel) as HTMLElement | null) : null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${Math.round(e.clientX - r.left)}px`);
      card.style.setProperty("--my", `${Math.round(e.clientY - r.top)}px`);
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => document.removeEventListener("pointermove", move);
  }, [sel]);
  return null;
}
