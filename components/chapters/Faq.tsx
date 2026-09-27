"use client";

import { useState, type CSSProperties } from "react";
import { PageSection, PageMarker } from "./Section";
import { CONTACT, FAQ } from "@/lib/content";
import { scrollToChapter } from "@/lib/scroll";

/**
 * 06 · QUESTIONS — what a buyer asks before the first call, answered plainly.
 * The title and a way to ask anything else on the left; the answers open in
 * place on the right (one at a time; the height eases, the plus turns).
 */
export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <PageSection id="faq" labelledBy="faq-title" className="faq">
      <div className="faq-grid">
        <header className="ps-head faq-head">
          <PageMarker n="06">Questions</PageMarker>
          <h2 id="faq-title" className="ps-title" data-rv>
            Straight answers.
          </h2>
          <p className="ps-lede" data-rv>
            Anything else — ask us directly. The people who answer are the people who build.
          </p>
          <p className="faq-ask" data-rv>
            <a className="text-link" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
            <button type="button" className="text-link" onClick={() => scrollToChapter("audit")}>
              Start a free audit <span aria-hidden>↓</span>
            </button>
          </p>
        </header>
        <ul className="qa-list">
          {FAQ.map((f, i) => {
            const on = open === i;
            return (
              <li key={f.q} className="qa" data-open={on || undefined} data-rv style={{ transitionDelay: `${i * 60}ms` } as CSSProperties}>
                <h3>
                  <button
                    type="button"
                    className="qa-q"
                    aria-expanded={on}
                    aria-controls={`qa-${i}`}
                    onClick={() => setOpen(on ? -1 : i)}
                  >
                    <span className="qa-n mono">{String(i + 1).padStart(2, "0")}</span>
                    <span className="qa-text">{f.q}</span>
                    <span className="qa-icon" aria-hidden />
                  </button>
                </h3>
                <div className="qa-a" id={`qa-${i}`} role="region" aria-hidden={!on}>
                  <div>
                    <p>{f.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </PageSection>
  );
}
