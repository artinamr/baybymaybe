"use client";

import { useState } from "react";

export type BlogCard = { slug: string; href: string; title: string; description: string; topic: string; topicLabel: string; date: string; dateLabel: string; minutes: number };

/**
 * The rest of the articles, newest first, filterable by topic. Every row is
 * in the static HTML (the filter only hides); a topic with nothing left to
 * show says so rather than leaving a gap.
 */
export function BlogIndex({ items, topics }: { items: BlogCard[]; topics: { key: string; label: string }[] }) {
  const [on, setOn] = useState("all");
  const shown = items.filter((a) => on === "all" || a.topic === on);
  return (
    <>
      <div className="wk-filter bl-filter" role="group" aria-label="Show articles about">
        {[{ key: "all", label: "All" }, ...topics].map((f) => (
          <button key={f.key} type="button" aria-pressed={on === f.key} onClick={() => setOn(f.key)}>
            {f.label}
          </button>
        ))}
      </div>
      <ol className="bl-list">
        {items.map((a) => (
          <li key={a.slug} className="bl-row" hidden={on !== "all" && a.topic !== on} data-rv>
            <p className="bl-date">
              <time dateTime={a.date}>{a.dateLabel}</time>
            </p>
            <div className="bl-text">
              <h2 className="bl-title">
                <a href={a.href}>{a.title}</a>
              </h2>
              <p className="bl-desc">{a.description}</p>
            </div>
            <p className="bl-kind">
              <b>{a.topicLabel}</b>
              <span>{a.minutes} min</span>
            </p>
          </li>
        ))}
      </ol>
      {shown.length === 0 ? <p className="bl-none">Nothing else on this topic yet.</p> : null}
    </>
  );
}
