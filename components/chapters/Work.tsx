"use client";

import type { CSSProperties } from "react";
import { PageSection, PageMarker } from "./Section";
import { PAGES } from "@/lib/content";
import { WORK_ITEMS } from "@/content/work";
import { service } from "@/content/services";

/**
 * 03 · SELECTED WORK — the proof, as a sheet over the film (held on the AI's
 * last frame). An editorial stagger of three projects from content/work.ts: a
 * big cover, the discipline, the name, what it is, one line. Covers catch a
 * white glint on hover — the glass's own light (CLAUDE.md "glints"). For now
 * they are studio demonstrations, labelled so; each opens its case study.
 */
export function Work() {
  return (
    <PageSection id="work" labelledBy="work-title">
      <header className="ps-head">
        <PageMarker of="work">Selected work</PageMarker>
        <h2 id="work-title" className="ps-title" data-rv>
          Click through it.
        </h2>
        <p className="ps-lede" data-rv>
          A website, a platform and an automation — each a working demonstration you can use, with the brief, the decisions
          and the limits written up.
        </p>
      </header>
      <div className="work-grid">
        {WORK_ITEMS.map((w, i) => (
          <article key={w.slug} className={`work-card work-card-${i + 1}`} data-rv style={{ transitionDelay: `${i * 90}ms` } as CSSProperties}>
            <a className="work-media" href={PAGES.project(w.slug)} tabIndex={-1} aria-hidden>
              {/* The middle card is tall on a wide screen: it shows the phone view where there is one. */}
              <picture>
                {i === 1 && w.coverTall ? <source media="(min-width: 1100px)" srcSet={w.coverTall} /> : null}
                <img src={w.cover} alt="" width={2400} height={1500} loading="eager" fetchPriority="low" decoding="async" />
              </picture>
              <span className="work-shine" aria-hidden />
              {w.kind === "demo" ? <span className="work-ph mono">Studio demonstration</span> : null}
            </a>
            <div className="work-body">
              <p className="work-kind mono">
                <span>{String(i + 1).padStart(2, "0")}</span> {w.services.map((sl) => service(sl)?.name).join(" · ")}
              </p>
              <h3 className="work-name">
                <a href={PAGES.project(w.slug)}>{w.client}</a>
              </h3>
              <p className="work-client">{w.title}</p>
              <a className="text-link work-more" href={PAGES.project(w.slug)}>
                Open the case study <span aria-hidden>→</span>
              </a>
            </div>
          </article>
        ))}
      </div>
      <p className="work-all" data-rv>
        <a className="text-link" href={PAGES.work}>
          All the work <span aria-hidden>→</span>
        </a>
      </p>
    </PageSection>
  );
}
