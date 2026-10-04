"use client";

import { useEffect, useState } from "react";

/**
 * An article's contents, sticky beside the words on wide screens. The section
 * you are reading is marked (indigo, and `aria-current` for screen readers):
 * the last heading that has passed the top third of the screen.
 */
export function Toc({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const heads = items.map((t) => document.getElementById(t.id)).filter((e): e is HTMLElement => Boolean(e));
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
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    pick();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items]);

  return (
    <nav className="doc-toc ar-toc" aria-label="Contents">
      <p className="doc-toc-h">Contents</p>
      {items.map((t) => (
        <a key={t.id} href={`#${t.id}`} aria-current={active === t.id ? "true" : undefined}>
          {t.title}
        </a>
      ))}
    </nav>
  );
}
