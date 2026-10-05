"use client";

import { useEffect, useRef, useState } from "react";
import { searchable } from "@/lib/search";

/**
 * Find a term: every definition is in the page's HTML, and typing writes one
 * CSS rule that hides the terms (and the topics) that don't match. "/" puts
 * the cursor in the field from anywhere on the page.
 */
export function GlossaryFilter({ terms }: { terms: { id: string; text: string }[] }) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const words = searchable(q).split(" ").filter(Boolean);
  const hits = words.length ? terms.filter((t) => words.every((w) => t.text.includes(w))).map((t) => t.id) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || el.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      input.current?.focus();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const keep = hits?.map((id) => `[data-term="${id}"]`).join(",");
  const css = hits
    ? hits.length
      ? `.gl [data-term]:not(${keep}){display:none}.gl .gl-group:not(:has(${keep})){display:none}`
      : `.gl .gl-group{display:none}`
    : "";

  return (
    <div className="gl-find" role="search">
      <style>{css}</style>
      <label className="gl-find-l" htmlFor="gl-q">
        Find a term
      </label>
      <div className="bl-search">
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
        <input
          ref={input}
          id="gl-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="DNS, UDAI, consent…"
          autoComplete="off"
          spellCheck={false}
        />
        <kbd aria-hidden>/</kbd>
      </div>
      <p className="gl-find-n" aria-live="polite">
        {hits ? (hits.length ? `${hits.length} of ${terms.length} terms` : `No term matches “${q.trim()}”.`) : `${terms.length} terms`}
      </p>
    </div>
  );
}
