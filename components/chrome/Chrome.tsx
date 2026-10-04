"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { CHAPTERS, jumpS } from "@/lib/chapters";
import { jumpToAudit, jumpToS } from "@/lib/scroll";
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
        aria-label="Nerodyn, back to the top"
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
      <MobileMenu open={menu} onClose={closeMenu} />
      <div className="grain" aria-hidden />
    </>
  );
}
