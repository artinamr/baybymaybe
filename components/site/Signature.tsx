"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { LogoMark } from "@/components/chrome/LogoMark";

const WORD = "Nerodyn";

/**
 * THE SIGNATURE: the mark and the name, signed across the foot of every page,
 * edge to edge. It behaves like the stone in the film:
 * - the letters rise into place when it comes into view;
 * - indigo light follows the pointer *inside* the letters (the light inside
 *   the black glass), and fades when the pointer leaves;
 * - a narrow band of white light sweeps across now and then (a glint, never
 *   a wash), and whenever the pointer arrives;
 * - the mark leans toward the pointer, its three pieces part when you reach
 *   for it, and it takes you back to the top.
 * Reduced motion: the letters are simply there and nothing sweeps on its own.
 * All pointer work is rAF-batched and writes only to the signature's own
 * elements (never a page-wide custom property).
 */
export function Signature({ onTop }: { onTop: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLParagraphElement>(null);
  const mark = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = root.current;
    const w = word.current;
    const m = mark.current;
    if (!el || !w || !m) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 0. Each letter paints its own share of one light: it needs to know where it sits in the word.
    const place = () => {
      w.querySelectorAll<HTMLElement>(".sf-sig-c").forEach((c) => {
        (c.firstElementChild as HTMLElement | null)?.style.setProperty("--x", `${c.offsetLeft}px`);
      });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(w);

    // 1. Rise into place once, then light up (the letters are painted by the word's own light from then on).
    let litTimer = 0;
    const show = () => {
      el.dataset.in = "";
      litTimer = window.setTimeout(() => {
        el.dataset.lit = "";
        if (!still) glint();
      }, still ? 0 : 1500);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          show();
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);

    // 2. The glint: restart the sweep (a class toggle; CSS does the rest).
    let lastGlint = 0;
    const glint = () => {
      const now = performance.now();
      if (now - lastGlint < 1800) return;
      lastGlint = now;
      el.removeAttribute("data-glint");
      void el.offsetWidth;
      el.dataset.glint = "";
    };
    // Now and then while it is on screen and nobody is pointing at it.
    let visible = false;
    const seen = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.2 });
    seen.observe(el);
    const idle = still ? 0 : window.setInterval(() => visible && !el.hasAttribute("data-hover") && el.hasAttribute("data-lit") && glint(), 9000);

    // 3. The light inside the letters, and the mark leaning toward the pointer.
    let raf = 0;
    let px = 0;
    let py = 0;
    let lastT = "";
    const frame = () => {
      raf = 0;
      const r = w.getBoundingClientRect();
      w.style.setProperty("--mx", `${(px - r.left).toFixed(1)}px`);
      w.style.setProperty("--my", `${(py - r.top).toFixed(1)}px`);
      const mr = m.getBoundingClientRect();
      const dx = (px - (mr.left + mr.width / 2)) / innerWidth;
      const dy = (py - (mr.top + mr.height / 2)) / innerHeight;
      const t = `perspective(700px) rotateY(${(dx * 28).toFixed(2)}deg) rotateX(${(-dy * 22).toFixed(2)}deg)`;
      if (t !== lastT) {
        m.style.transform = t;
        lastT = t;
      }
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const enter = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      el.dataset.hover = "";
      move(e);
      if (el.hasAttribute("data-lit") && !still) glint();
    };
    const leave = () => {
      el.removeAttribute("data-hover");
      m.style.transform = "";
      lastT = "";
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);

    return () => {
      io.disconnect();
      seen.disconnect();
      ro.disconnect();
      window.clearTimeout(litTimer);
      window.clearInterval(idle);
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div className="sf-sig-wrap">
      <div className="sf-sig" ref={root}>
        <button
          type="button"
          ref={mark}
          className="sf-sig-mark"
          aria-label="Nerodyn: back to the top"
          onClick={() => {
            const el = root.current;
            if (el) {
              el.removeAttribute("data-part");
              void el.offsetWidth;
              el.dataset.part = "";
            }
            onTop();
          }}
        >
          <LogoMark className="sf-sig-logo" />
        </button>
        <p className="sf-sig-word" ref={word} aria-hidden>
          {WORD.split("").map((c, i) => (
            <span className="sf-sig-c" key={i}>
              <span className="sf-sig-l" style={{ "--i": i } as CSSProperties}>
                {c}
              </span>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
