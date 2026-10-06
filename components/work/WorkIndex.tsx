"use client";

import { Fragment, useState } from "react";
import { WorkTitle } from "./WorkTitle";

export type WorkCard = { slug: string; kind: string; href: string; client: string; title: string; summary: string; cover: string; coverAlt: string; label: string; services: { slug: string; name: string }[] };

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
  return (
    <>
      <div className="wk-filter" role="group" aria-label="Show work for">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" aria-pressed={on === f.key} onClick={() => setOn(f.key)}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="wk-grid">
        {items.map((w, i) => (
          <Fragment key={w.slug}>
            {/* The demonstrations get a heading of their own, where the first of them starts. */}
            {w.kind === "demo" && items[i - 1]?.kind !== "demo" ? (
              <div className="wk-group" hidden={!items.some((x) => x.kind === "demo" && shown(x))} data-rv>
                <h2>Working demonstrations</h2>
                <p>Pieces of a platform, an automation and a website, running inside their case studies. Click them; nothing is sent.</p>
              </div>
            ) : null}
          <article className="wk-card" data-kind={w.kind} hidden={!shown(w)} data-rv>
            <a className="wk-img" href={w.href} tabIndex={-1} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
              <img src={w.cover} alt="" width={2400} height={1500} loading={i ? "lazy" : "eager"} decoding="async" />
            </a>
            <p className="wk-kind">
              <b>{w.services.map((s) => s.name).join(" · ")}</b>
              <span>{w.label}</span>
            </p>
            <h2 className="wk-title">
              <a href={w.href}>
                <WorkTitle text={`${w.client}: ${w.title.charAt(0).toLowerCase() + w.title.slice(1)}`} />
              </a>
            </h2>
            <p className="wk-sum">{w.summary}</p>
          </article>
          </Fragment>
        ))}
      </div>
    </>
  );
}
