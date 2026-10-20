"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { MenuSheet } from "@/components/chrome/MenuSheet";
import { NAV, type Here } from "@/lib/nav";

/** The sub-pages' Menu button (phones) and its sheet: every page, and the free audit. */
export function SubMenu({ here, audit }: { here?: Here; audit: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const links = [
    ...NAV.map((l, i) => ({ label: l.label, mark: String(i + 1).padStart(2, "0"), href: l.href, current: l.key === here })),
    { label: "Free audit", mark: audit.startsWith("#") ? "↓" : "→", href: audit, onClick: audit.startsWith("#") ? () => jumpTo(audit) : undefined },
  ];
  const btn = useRef<HTMLButtonElement>(null);
  useNavPointer(btn);
  return (
    <>
      <button ref={btn} type="button" className="sp-menu mono" onClick={() => setOpen(true)} aria-haspopup="dialog">
        Menu
      </button>
      <MenuSheet open={open} onClose={close} links={links} />
    </>
  );
}

/**
 * The header's pointer: a soft indigo light that follows the pointer along
 * the bar (--nav-mx, --nav-on) and the audit pill leaning toward it when
 * near (--cx, --cy, used only when motion is welcome). Fine pointers only;
 * writes happen once per frame and only when the values change.
 */
function useNavPointer(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const nav = ref.current?.closest<HTMLElement>(".sp-nav");
    if (!nav || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const cta = nav.querySelector<HTMLElement>(".sp-cta");
    let raf = 0;
    let px = 0;
    let py = 0;
    let inside = false;
    const paint = () => {
      raf = 0;
      const r = nav.getBoundingClientRect();
      nav.style.setProperty("--nav-mx", `${(px - r.left).toFixed(0)}px`);
      nav.style.setProperty("--nav-on", inside ? "1" : "0");
      if (!cta) return;
      const c = cta.getBoundingClientRect();
      const dx = px - (c.left + c.width / 2);
      const dy = py - (c.top + c.height / 2);
      const near = inside && Math.hypot(dx, dy) < 110;
      cta.style.setProperty("--cx", near ? (dx * 0.22).toFixed(1) : "0");
      cta.style.setProperty("--cy", near ? (dy * 0.3).toFixed(1) : "0");
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      inside = true;
      queue();
    };
    const leave = () => {
      inside = false;
      queue();
    };
    nav.addEventListener("pointermove", move);
    nav.addEventListener("pointerleave", leave);
    return () => {
      nav.removeEventListener("pointermove", move);
      nav.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
}

/** An in-page anchor, once the sheet has let go of the page. */
function jumpTo(hash: string) {
  requestAnimationFrame(() => document.querySelector(hash)?.scrollIntoView());
}
