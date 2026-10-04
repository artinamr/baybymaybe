"use client";

import { useState, type ReactNode } from "react";

/**
 * The topic filter over the blog's cards. Every card is in the static HTML
 * (search engines and readers without scripts see them all); the filter only
 * sets `data-on` on the list, and the page's own rule hides the other topics'
 * cards (see app/blog/page.tsx). A topic with nothing to show says so.
 */
export function BlogIndex({ topics, children }: { topics: { key: string; label: string; count: number }[]; children: ReactNode }) {
  const [on, setOn] = useState("all");
  const empty = on !== "all" && (topics.find((t) => t.key === on)?.count ?? 0) === 0;
  return (
    <>
      <div className="wk-filter bl-filter" role="group" aria-label="Show articles about">
        {[{ key: "all", label: "All" }, ...topics].map((f) => (
          <button key={f.key} type="button" aria-pressed={on === f.key} onClick={() => setOn(f.key)}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="bl-index" data-on={on}>
        {children}
      </div>
      {empty ? <p className="bl-none">Nothing on this topic yet.</p> : null}
    </>
  );
}
