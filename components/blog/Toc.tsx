"use client";

import { useEffect, useState } from "react";

/**
 * An article's contents. On a wide screen it sits sticky beside the words:
 * the section you are reading is marked (indigo, and `aria-current` for
 * screen readers), with the reading time left and two actions under it (copy
 * the link, print or save as PDF). On a phone it is a bar that stays under
 * the navigation: it names the section you are in, and opens the list.
 * "The section you are reading" is the last heading above the top third of
 * the screen.
 */
export function Toc({ items, minutes, url }: { items: { id: string; title: string }[]; minutes: number; url: string }) {
  const [active, setActive] = useState<string | null>(null);
  const [left, setLeft] = useState(minutes);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const heads = items.map((t) => document.getElementById(t.id)).filter((e): e is HTMLElement => Boolean(e));
    const body = document.querySelector<HTMLElement>(".ar-doc .doc-body");
    let raf = 0;
    const pick = () => {
      raf = 0;
      const line = innerHeight * 0.32;
      let cur: string | null = null;
      for (const h of heads) {
        if (h.getBoundingClientRect().top <= line) cur = h.id;
        else break;
      }
      setActive(cur);
      if (body) {
        const r = body.getBoundingClientRect();
        const done = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
        setLeft(Math.max(0, Math.ceil(minutes * (1 - done))));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    pick();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      removeEventListener("keydown", onKey);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items, minutes]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this address:", url);
    }
  };

  const now = items.find((t) => t.id === active)?.title ?? "Start";

  return (
    <nav className="doc-toc ar-toc" aria-label="Contents" data-open={open ? "" : undefined}>
      <button type="button" className="ar-toc-bar" aria-expanded={open} aria-controls="ar-toc-list" onClick={() => setOpen((o) => !o)}>
        <span className="ar-toc-bar-h">Contents</span>
        <span className="ar-toc-bar-now">{now}</span>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M6 9.5l6 6 6-6" />
        </svg>
      </button>
      <p className="doc-toc-h">Contents</p>
      <div className="ar-toc-list" id="ar-toc-list">
        {items.map((t) => (
          <a key={t.id} href={`#${t.id}`} aria-current={active === t.id ? "true" : undefined} onClick={() => setOpen(false)}>
            {t.title}
          </a>
        ))}
      </div>
      <p className="ar-toc-left" aria-hidden>
        <span className="ar-toc-meter">
          <span style={{ transform: `scaleX(${1 - left / Math.max(1, minutes)})` }} />
        </span>
        {left > 0 ? `${left} min left` : "Read to the end"}
      </p>
      <div className="ar-toc-acts">
        <button type="button" onClick={copy}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M9.5 14.5l5-5M10.6 6.6l1.6-1.6a4 4 0 015.7 5.7l-1.6 1.6M13.4 17.4l-1.6 1.6a4 4 0 01-5.7-5.7l1.6-1.6" />
          </svg>
          <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
        </button>
        <button type="button" onClick={() => window.print()}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M7 9V4h10v5M7 17H5a1 1 0 01-1-1v-5a2 2 0 012-2h12a2 2 0 012 2v5a1 1 0 01-1 1h-2M7 14h10v6H7z" />
          </svg>
          <span>Print or save as PDF</span>
        </button>
      </div>
    </nav>
  );
}
