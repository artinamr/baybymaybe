"use client";

import type { PointerEvent, ReactNode } from "react";
import "./crazy-chrome.css";

/** Record where the pointer entered/left so the ghost fill grows from (and retracts to) that point. */
function track(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

/**
 * Magnetic pull: the button leans a few pixels toward the pointer and a soft
 * light follows it inside (--px/--py). Mouse only; CSS applies it only when
 * motion is welcome (crazy-chrome.css), so touch and reduced motion stay still.
 */
function pull(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  el.style.setProperty("--px", `${x}px`);
  el.style.setProperty("--py", `${y}px`);
  el.style.setProperty("--tx", `${((x / r.width) - 0.5) * 8}px`);
  el.style.setProperty("--ty", `${((y / r.height) - 0.5) * 6}px`);
}
function release(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  el.style.setProperty("--tx", "0px");
  el.style.setProperty("--ty", "0px");
}

/**
 * The indigo pill: the liked shine sweep, a live dot, and an arrow that slides
 * out while its clone slides in. It leans toward the pointer and carries a
 * light that follows it.
 */
export function Pill({
  children,
  onClick,
  href,
  live = false,
  large = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  live?: boolean;
  large?: boolean;
}) {
  const inner = (
    <>
      <span className="pill-glow" aria-hidden />
      {live ? (
        <span className="pill-dot" aria-hidden>
          <span />
        </span>
      ) : null}
      <span className="pill-label">{children}</span>
      <span className="pill-arrow" aria-hidden>
        <span>→</span>
        <span>→</span>
      </span>
    </>
  );
  const cls = `pill btn-shine mag ${large ? "pill-lg" : ""}`;
  return href ? (
    <a className={cls} href={href} onPointerMove={pull} onPointerLeave={release}>
      {inner}
    </a>
  ) : (
    <button type="button" className={cls} onClick={onClick} onPointerMove={pull} onPointerLeave={release}>
      {inner}
    </button>
  );
}

/** Ghost pill: an ink circle grows from the pointer's entry point and retracts toward its exit. A link when it has an href. */
export function GhostPill({
  children,
  onClick,
  href,
  small = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  small?: boolean;
}) {
  const cls = `ghost mag ${small ? "ghost-sm" : ""}`;
  const inner = (
    <>
      <span className="ghost-fill" aria-hidden />
      <span className="ghost-label">
        {children} <span className="ghost-arrow" aria-hidden>↗</span>
      </span>
    </>
  );
  const leave = (e: PointerEvent<HTMLElement>) => {
    track(e);
    release(e);
  };
  return href ? (
    <a className={cls} href={href} onPointerEnter={track} onPointerMove={pull} onPointerLeave={leave}>
      {inner}
    </a>
  ) : (
    <button type="button" className={cls} onClick={onClick} onPointerEnter={track} onPointerMove={pull} onPointerLeave={leave}>
      {inner}
    </button>
  );
}
