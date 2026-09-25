"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CHAPTERS, type ChapterId } from "@/lib/chapters";
import { onScrollFrame, scrollToChapter, scrollToS, useActiveChapter } from "@/lib/scroll";
import { LogoMark } from "./LogoMark";
import { GhostPill } from "./Pills";

const NAV: { id: ChapterId; label: string }[] = [
  { id: "order", label: "Infrastructure" },
  { id: "current", label: "AI automation" },
  { id: "field", label: "Work" },
  { id: "method", label: "Method" },
];

function SwapLabel({ children }: { children: string }) {
  return (
    <span className="swap">
      <span className="swap-a">{children}</span>
      <span className="swap-b" aria-hidden>
        {children}
      </span>
    </span>
  );
}

function Nav({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="nav">
      <a
        href="#main"
        className="nav-brand intro intro-drop"
        style={{ "--d": "380ms" } as CSSProperties}
        onClick={(e) => {
          e.preventDefault();
          scrollToS(0);
        }}
        aria-label="Nerodyn — back to the top"
      >
        <LogoMark className="nav-mark" />
        <span className="nav-word">Nerodyn</span>
      </a>
      <nav className="nav-links" aria-label="Chapters">
        {NAV.map((l, i) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            className="nav-link intro intro-drop"
            style={{ "--d": `${440 + i * 50}ms` } as CSSProperties}
            onClick={(e) => {
              e.preventDefault();
              scrollToChapter(l.id);
            }}
          >
            <SwapLabel>{l.label}</SwapLabel>
          </a>
        ))}
        <span className="intro intro-drop" style={{ "--d": "680ms" } as CSSProperties}>
          <GhostPill small onClick={() => scrollToChapter("mark")}>
            Start a project
          </GhostPill>
        </span>
      </nav>
      <button type="button" className="nav-menu mono intro intro-drop" style={{ "--d": "440ms" } as CSSProperties} onClick={onMenu}>
        Menu
      </button>
    </header>
  );
}

/** Seven ticks on the right edge; the active one grows and fills with its chapter's progress. */
function ChapterIndex() {
  const active = useActiveChapter();
  const ref = useRef<HTMLOListElement>(null);
  useEffect(
    () =>
      onScrollFrame((S) => {
        const el = ref.current;
        if (!el) return;
        const i = CHAPTERS.findLastIndex((c) => S >= c.S0 - 0.5);
        const c = CHAPTERS[Math.max(0, i)];
        const p = Math.max(0, Math.min(1, (S - c.S0) / Math.max(0.5, c.vh / 100 - 0.5)));
        el.style.setProperty("--p", p.toFixed(3));
      }),
    []
  );
  return (
    <>
    <p className="index-counter mono" aria-hidden>
      {CHAPTERS[active].num}/06
      <span className="index-rail">
        <span />
      </span>
    </p>
    <ol className="index" ref={ref} aria-label="Chapters">
      {CHAPTERS.map((c, i) => (
        <li key={c.id} className="index-row intro-tick" data-on={i === active || undefined} style={{ "--d": `${1300 + i * 50}ms` } as CSSProperties}>
          <button type="button" onClick={() => scrollToS(c.jumpS)} aria-label={`${c.num} ${c.label}`} aria-current={i === active ? "step" : undefined}>
            <span className="index-label">{c.label}</span>
            <span className="index-num mono">{c.num}</span>
            <span className="index-tick" aria-hidden>
              <span />
            </span>
          </button>
        </li>
      ))}
    </ol>
    </>
  );
}

/**
 * The chapter card (the example's late bottom-right card): where you are, one
 * plain line about it, and the way on.
 */
function SpecimenCard() {
  const active = useActiveChapter();
  const c = CHAPTERS[active];
  const next = CHAPTERS[active + 1];
  return (
    <aside className="specimen intro intro-card" style={{ "--d": "1250ms" } as CSSProperties} aria-label="Current chapter">
      <div className="specimen-roll" key={c.id}>
        <p className="specimen-top">
          <span className="specimen-n">
            {c.num} / 06
          </span>
          <span>{c.label}</span>
        </p>
        <p className="specimen-name">{c.specimen.name}</p>
        <p className="specimen-line">{c.specimen.line}</p>
        {next ? (
          <button type="button" className="specimen-next" onClick={() => scrollToS(next.jumpS)}>
            <span>Next — {next.label}</span>
            <span className="cue-line" aria-hidden>
              <span />
            </span>
          </button>
        ) : null}
      </div>
    </aside>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div className="menu-sheet" data-open={open || undefined} aria-hidden={!open}>
      <button type="button" className="menu-close mono" onClick={onClose}>
        Close
      </button>
      <nav>
        {CHAPTERS.slice(1).map((c, i) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            style={{ "--i": i } as CSSProperties}
            tabIndex={open ? 0 : -1}
            onClick={(e) => {
              e.preventDefault();
              onClose();
              scrollToS(c.jumpS);
            }}
          >
            <span className="mono">{c.num}</span> {c.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

export function Chrome() {
  const [menu, setMenu] = useState(false);
  return (
    <>
      <Nav onMenu={() => setMenu(true)} />
      <ChapterIndex />
      <SpecimenCard />
      <MobileMenu open={menu} onClose={() => setMenu(false)} />
      <div className="grain" aria-hidden />
    </>
  );
}
