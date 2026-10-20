"use client";

import { Fragment, useState, type PointerEvent } from "react";
import "./crazy-work-index.css";

/** The indigo light follows the pointer over a cover (--mx/--my, in px). */
function follow(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${(e.clientX - r.left).toFixed(0)}px`);
  el.style.setProperty("--my", `${(e.clientY - r.top).toFixed(0)}px`);
}

export type WorkCard = { slug: string; kind: string; href: string; client: string; title: string; summary: string; cover: string; coverAlt: string; label: string; services: { slug: string; name: string }[]; srcSet: string; preview?: string };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "websites", label: "Websites" },
  { key: "platforms", label: "Platforms" },
  { key: "ai-automation", label: "AI automation" },
];

/**
 * The work, filterable by discipline. Every card is in the static HTML (the
 * filter only hides); the first is set large. Image and title both open the
 * case study.
 */
export function WorkIndex({ items }: { items: WorkCard[] }) {
  const [on, setOn] = useState("all");
  const shown = (w: WorkCard) => on === "all" || w.services.some((s) => s.slug === on);
  const count = items.filter(shown).length;
  return (
    <>
      <div className="wk-tools" id="work-index">
        <div className="wk-filter" role="group" aria-label="Show work for">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={on === f.key} onClick={() => setOn(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <p className="wk-count mono" role="status" aria-live="polite">{count} {count === 1 ? "project" : "projects"}</p>
      </div>
      <div className="wk-grid">
        {items.map((w, i) => (
          <Fragment key={w.slug}>
            {w.kind === "site" && items[i - 1]?.kind !== "site" ? (
              <div className="wk-group wk-group-first" hidden={!items.some((x) => x.kind === "site" && shown(x))} data-rv>
                <h2>Complete concept websites</h2>
                <p>Three different businesses, each with its own identity and a full website to explore.</p>
              </div>
            ) : null}
            {/* The demonstrations get a heading of their own, where the first of them starts. */}
            {w.kind === "demo" && items[i - 1]?.kind !== "demo" ? (
              <div className="wk-group" hidden={!items.some((x) => x.kind === "demo" && shown(x))} data-rv>
                <h2>Working demonstrations</h2>
                <p>Try the booking, job board and enquiry desk inside their studies. All data is fictional; nothing you enter is sent.</p>
              </div>
            ) : null}
          <article className="wk-card" data-kind={w.kind} data-featured={i === 0 ? "" : undefined} hidden={!shown(w)} data-rv>
            <a className="wk-img" href={w.href} tabIndex={-1} aria-hidden onPointerMove={follow} style={w.preview ? { backgroundImage: `url(${w.preview})` } : undefined}>
              <span className="wk-light" aria-hidden />
              {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
              <img
                src={w.cover}
                srcSet={w.srcSet}
                sizes={i === 0 ? "(max-width: 760px) 92vw, 66vw" : "(max-width: 760px) 92vw, (max-width: 1100px) 46vw, 600px"}
                alt=""
                width={2400}
                height={1500}
                loading={i ? "lazy" : "eager"}
                decoding="async"
              />
            </a>
            <p className="wk-kind">
              <b>{w.services.map((s) => s.name).join(" · ")}</b>
              <span>{w.label}</span>
            </p>
            <h2 className="wk-title">
              <a href={w.href}>
                {w.client}
                <span className="wk-project-go" aria-hidden>↗</span>
              </a>
            </h2>
            <p className="wk-sum">{w.title}.</p>
          </article>
          </Fragment>
        ))}
      </div>
    </>
  );
}
