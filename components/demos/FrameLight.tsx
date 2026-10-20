"use client";

import { useEffect, useRef } from "react";

/**
 * A rim of indigo light that follows the pointer round a device frame.
 * Purely decorative: the variables are written onto this one span (never the
 * frame, so the demo inside is not restyled), and only when they change.
 */
export function FrameLight() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      raf = 0;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = host.getBoundingClientRect();
      x = Math.round(e.clientX - r.left);
      y = Math.round(e.clientY - r.top);
      if (!raf) raf = requestAnimationFrame(paint);
    };
    host.addEventListener("pointermove", move, { passive: true });
    return () => {
      host.removeEventListener("pointermove", move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <span ref={ref} className="dev-light" aria-hidden />;
}
