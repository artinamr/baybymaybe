"use client";

import type { PointerEvent, ReactNode } from "react";

/** Record where the pointer entered/left so the ghost fill grows from (and retracts to) that point. */
function track(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

/**
 * The indigo pill: the liked shine sweep, a live dot, and an arrow that slides
 * out while its clone slides in.
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
      {live ? (
        <span className="pill-dot" aria-hidden>
          <span />
        </span>
      ) : null}
      <span>{children}</span>
      <span className="pill-arrow" aria-hidden>
        <span>→</span>
        <span>→</span>
      </span>
    </>
  );
  const cls = `pill btn-shine ${large ? "pill-lg" : ""}`;
  return href ? (
    <a className={cls} href={href}>
      {inner}
    </a>
  ) : (
    <button type="button" className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}

/** Ghost pill: an ink circle grows from the pointer's entry point and retracts toward its exit. */
export function GhostPill({ children, onClick, small = false }: { children: ReactNode; onClick?: () => void; small?: boolean }) {
  return (
    <button type="button" className={`ghost ${small ? "ghost-sm" : ""}`} onClick={onClick} onPointerEnter={track} onPointerLeave={track}>
      <span className="ghost-fill" aria-hidden />
      <span className="ghost-label">
        {children} <span aria-hidden>↗</span>
      </span>
    </button>
  );
}
