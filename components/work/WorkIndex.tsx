"use client";

import { useState } from "react";
import { WorkTitle } from "./WorkTitle";

export type WorkCard = { slug: string; href: string; client: string; title: string; summary: string; cover: string; coverAlt: string; demo: boolean; services: { slug: string; name: string }[] };

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
          <article key={w.slug} className="wk-card" hidden={on !== "all" && !w.services.some((s) => s.slug === on)} data-rv>
            <a className="wk-img" href={w.href} tabIndex={-1} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
              <img src={w.cover} alt="" width={2400} height={1500} loading={i ? "lazy" : "eager"} decoding="async" />
            </a>
            <p className="wk-kind">
              <b>{w.services.map((s) => s.name).join(" · ")}</b>
              <span>{w.demo ? "Studio demonstration" : "Client project"}</span>
            </p>
            <h2 className="wk-title">
              <a href={w.href}>
                <WorkTitle text={`${w.client} — ${w.title.charAt(0).toLowerCase() + w.title.slice(1)}`} />
              </a>
            </h2>
            <p className="wk-sum">{w.summary}</p>
          </article>
        ))}
      </div>
    </>
  );
}
