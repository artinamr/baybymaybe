"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { PageSection, PageMarker } from "./Section";
import { PAGES, PROCESS } from "@/lib/content";
import { onScrollFrame } from "@/lib/scroll";
import { scroll } from "@/lib/stores";

/**
 * 05 · HOW WE WORK — the methodology's four steps as a sheet over the film
 * (held on the closed colossus). One hairline runs through the four days and
 * fills with indigo as you read down the section; each day lights as the line
 * reaches it.
 */
export function Process() {
  const rail = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    // The rail's place on the page, measured only when the layout changes —
    // never read back from the DOM in the frame loop (that forces a layout
    // on every frame of the film).
    let top = 0;
    const measure = () => {
      top = el.getBoundingClientRect().top + window.scrollY;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    let last = "";
    const off = onScrollFrame(() => {
      const vh = window.innerHeight;
      const y = top - scroll.y;
      if (y > vh * 1.2 || y < -vh * 1.5) return;
      // 0 as the steps enter the lower third, 1 by the time they reach the upper third.
      const p = Math.max(0, Math.min(1, (vh * 0.85 - y) / Math.max(1, vh * 0.6)));
      const v = p.toFixed(4);
      if (v === last) return;
      last = v;
      el.style.setProperty("--line", v);
      const lit = Math.min(PROCESS.length, Math.floor(p * PROCESS.length + 0.35));
      if (el.dataset.lit !== String(lit)) el.dataset.lit = String(lit);
    });
    return () => {
      off();
      ro.disconnect();
    };
  }, []);

  return (
    <PageSection id="process" labelledBy="process-title">
      <header className="ps-head">
        <PageMarker n="05">How we work</PageMarker>
        <h2 id="process-title" className="ps-title" data-rv>
          From first call to live.
        </h2>
        <p className="ps-lede" data-rv>
          Most websites go live in about fourteen days. Platforms and automation take longer — the quote after your audit
          says exactly how long, and that is the date we work to.
        </p>
      </header>
      <ol className="steps" ref={rail} data-lit="0">
        <span className="steps-line" aria-hidden>
          <span />
        </span>
        {PROCESS.map((s, i) => (
          <li key={s.title} className="step" data-i={i} data-rv style={{ transitionDelay: `${i * 90}ms` } as CSSProperties}>
            <span className="step-dot" aria-hidden />
            <p className="step-day mono">{s.day}</p>
            <h3 className="step-title">{s.title}</h3>
            <p className="step-body">{s.body}</p>
            <p className="step-note mono">{s.note}</p>
          </li>
        ))}
      </ol>
      <p className="ps-foot" data-rv>
        <a className="text-link" href={PAGES.methodology}>
          Read the full methodology <span aria-hidden>→</span>
        </a>
      </p>
    </PageSection>
  );
}
