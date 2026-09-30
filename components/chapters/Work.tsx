"use client";

import type { CSSProperties } from "react";
import { PageSection, PageMarker } from "./Section";
import { WORK } from "@/lib/content";

/**
 * 03 · SELECTED WORK — the proof, as a sheet over the film (held on the AI's
 * last frame). An editorial stagger of three projects: a big cover, the
 * discipline, the name, the client, one line on what changed. Covers catch a
 * white glint on hover — the glass's own light (CLAUDE.md "glints").
 * PLACEHOLDER entries mark the slots the client's real projects fill.
 */
export function Work() {
  return (
    <PageSection id="work" labelledBy="work-title">
      <header className="ps-head">
        <PageMarker of="work">Selected work</PageMarker>
        <h2 id="work-title" className="ps-title" data-rv>
          Recent work.
        </h2>
        <p className="ps-lede" data-rv>
          Websites, platforms and automations we have designed and engineered — and what changed for the business once they
          were live.
        </p>
      </header>
      <div className="work-grid">
        {WORK.map((w, i) => (
          <article
            key={w.id}
            className={`work-card work-card-${i + 1}`}
            data-rv
            data-placeholder={w.placeholder || undefined}
            style={{ transitionDelay: `${i * 90}ms` } as CSSProperties}
          >
            <a
              className="work-media"
              href={w.href ?? "#work"}
              aria-label={`${w.name} — ${w.kind}`}
              onClick={w.href ? undefined : (e) => e.preventDefault()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized covers */}
              <img src={w.cover} alt="" loading="eager" fetchPriority="low" decoding="async" />
              <span className="work-shine" aria-hidden />
              {w.placeholder ? <span className="work-ph mono">Placeholder</span> : null}
            </a>
            <div className="work-body">
              <p className="work-kind mono">
                <span>{String(i + 1).padStart(2, "0")}</span> {w.kind}
              </p>
              <h3 className="work-name">{w.name}</h3>
              <p className="work-client">{w.client}</p>
              <p className="work-line">{w.line}</p>
              {w.href ? (
                <a className="text-link work-more" href={w.href}>
                  Read the case study <span aria-hidden>→</span>
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </PageSection>
  );
}
