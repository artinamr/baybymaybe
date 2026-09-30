"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { CHAPTERS, jumpS } from "@/lib/chapters";
import { jumpToAudit, jumpToS, onScrollFrame, useActiveChapter } from "@/lib/scroll";
import { NAV } from "@/lib/nav";
import { PAGES } from "@/lib/content";
import { LogoMark } from "./LogoMark";
import { GhostPill } from "./Pills";
import { MenuSheet } from "./MenuSheet";

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
          jumpToS(0);
        }}
        aria-label="Nerodyn — back to the top"
      >
        <LogoMark className="nav-mark" />
        <span className="nav-word">Nerodyn</span>
      </a>
      <nav className="nav-links" aria-label="Site">
        {NAV.map((l, i) => (
          <a key={l.key} href={l.href} className="nav-link intro intro-drop" style={{ "--d": `${440 + i * 50}ms` } as CSSProperties}>
            <SwapLabel>{l.label}</SwapLabel>
          </a>
        ))}
        <span className="intro intro-drop" style={{ "--d": "680ms" } as CSSProperties}>
          <GhostPill small onClick={jumpToAudit}>
            Free audit
          </GhostPill>
        </span>
      </nav>
      <button type="button" className="nav-menu mono intro intro-drop" style={{ "--d": "440ms" } as CSSProperties} onClick={onMenu} aria-haspopup="dialog">
        Menu
      </button>
    </header>
  );
}

/** Seven ticks on the right edge; the active one grows and fills with its chapter's progress. */
function ChapterIndex() {
  const active = useActiveChapter();
  const ref = useRef<HTMLOListElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let last = "";
    let lastI = -1;
    return onScrollFrame((S) => {
      const el = ref.current;
      if (!el) return;
      const i = Math.max(0, CHAPTERS.findLastIndex((c) => S >= c.S0 - 0.5));
      const c = CHAPTERS[i];
      const p = Math.max(0, Math.min(1, (S - c.S0) / Math.max(0.5, c.S1 - c.S0 - 0.5))).toFixed(3);
      // The fill goes straight onto the active tick and the counter's rail —
      // only when it moves (a custom property on the list restyled all of it).
      if (p === last && i === lastI) return;
      const ticks = el.querySelectorAll<HTMLElement>(".index-tick > span");
      if (i !== lastI && ticks[lastI]) ticks[lastI].style.transform = "";
      const t = `scaleX(${p})`;
      if (ticks[i]) ticks[i].style.transform = t;
      if (rail.current) rail.current.style.transform = t;
      last = p;
      lastI = i;
    });
  }, []);
  return (
    <>
    <p className="index-counter mono" aria-hidden>
      {CHAPTERS[active].num}/0{CHAPTERS.length - 1}
      <span className="index-rail">
        <span ref={rail} />
      </span>
    </p>
    <ol className="index" ref={ref} aria-label="Chapters">
      {CHAPTERS.map((c, i) => (
        <li key={c.id} className="index-row intro-tick" data-on={i === active || undefined} style={{ "--d": `${1300 + i * 50}ms` } as CSSProperties}>
          <button type="button" onClick={() => jumpToS(jumpS(c))} aria-label={`${c.num} ${c.label}`} aria-current={i === active ? "step" : undefined}>
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
            {c.num} / 0{CHAPTERS.length - 1}
          </span>
          <span>{c.label}</span>
        </p>
        <p className="specimen-name">{c.specimen.name}</p>
        <p className="specimen-line">{c.specimen.line}</p>
        {next ? (
          <button type="button" className="specimen-next" onClick={() => jumpToS(jumpS(next))}>
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

/**
 * The phone's menu on the home page: the site's pages and the free audit, and
 * underneath, this page's own chapters — each a jump.
 */
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const links = [
    ...NAV.map((l, i) => ({ label: l.label, mark: String(i + 1).padStart(2, "0"), href: l.href })),
    { label: "Free audit", mark: "↓", href: "#contact", onClick: jumpToAudit },
  ];
  return (
    <MenuSheet
      open={open}
      onClose={onClose}
      links={links}
      extra={
        <div className="menu-here" style={{ "--i": links.length } as CSSProperties}>
          <p className="menu-here-h mono">On this page</p>
          <div className="menu-here-links">
            {CHAPTERS.slice(1).map((c) => (
              <a
                key={c.id}
                href={`${PAGES.home}#${c.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  jumpToS(jumpS(c));
                }}
              >
                <span className="mono">{c.num}</span> {c.label}
              </a>
            ))}
          </div>
        </div>
      }
    />
  );
}

export function Chrome() {
  const [menu, setMenu] = useState(false);
  const closeMenu = useCallback(() => setMenu(false), []);
  return (
    <>
      <Nav onMenu={() => setMenu(true)} />
      <ChapterIndex />
      <SpecimenCard />
      <MobileMenu open={menu} onClose={closeMenu} />
      <div className="grain" aria-hidden />
    </>
  );
}
