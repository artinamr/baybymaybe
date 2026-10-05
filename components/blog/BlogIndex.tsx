"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { searchable } from "@/lib/search";

type Item = { slug: string; topic: string; text: string };
type Word = { id: string; term: string; href: string; text: string };

/**
 * Search and topics over the blog's cards. Every card is in the static HTML
 * (search engines and readers without scripts see them all); typing or
 * choosing a topic writes one CSS rule that hides the cards that don't match.
 * A search also looks through the glossary and offers the matching terms,
 * and a search with no answer offers to take the question instead. "/" puts
 * the cursor in the field from anywhere on the page.
 */
export function BlogIndex({
  topics,
  items,
  words,
  ask,
  children,
}: {
  topics: { key: string; label: string }[];
  items: Item[];
  words: Word[];
  /** Where an unanswered question goes (a mailto: with a subject). */
  ask: string;
  children: ReactNode;
}) {
  const [q, setQ] = useState("");
  const [on, setOn] = useState("all");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || el.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      input.current?.focus({ preventScroll: true });
      input.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const terms = searchable(q).split(" ").filter(Boolean);
  const match = (text: string) => terms.every((w) => text.includes(w));
  const shown = items.filter((it) => (on === "all" || it.topic === on) && match(it.text));
  const hidden = items.filter((it) => !shown.includes(it));
  const hits = terms.length ? words.filter((w) => match(w.text)).slice(0, 4) : [];
  const css = hidden.map((it) => `.bl-index [data-slug="${it.slug}"]`).join(",");
  const topicName = topics.find((t) => t.key === on)?.label;

  return (
    <>
      <style>{css ? `${css}{display:none}` : ""}</style>
      <div className="bl-tools-bar">
        <div className="bl-search" role="search">
          <svg viewBox="0 0 24 24" aria-hidden>
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
          <label className="sr-only" htmlFor="bl-q">
            Search the articles
          </label>
          <input
            ref={input}
            id="bl-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search: quotes, domains, privacy…"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd aria-hidden>/</kbd>
        </div>
        <div className="wk-filter bl-filter" role="group" aria-label="Show articles about">
          {[{ key: "all", label: "All" }, ...topics].map((f) => (
            <button key={f.key} type="button" aria-pressed={on === f.key} onClick={() => setOn(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <p className="bl-count" aria-live="polite">
        {shown.length === items.length
          ? `${items.length} articles`
          : `${shown.length} of ${items.length} articles${topicName && on !== "all" ? ` about ${topicName.toLowerCase()}` : ""}${terms.length ? ` matching “${q.trim()}”` : ""}`}
      </p>
      {hits.length ? (
        <p className="bl-hits">
          <span>In the glossary:</span>
          {hits.map((w) => (
            <a key={w.id} href={w.href}>
              {w.term}
            </a>
          ))}
        </p>
      ) : null}
      <div className="bl-index">{children}</div>
      {shown.length === 0 ? (
        <div className="bl-none">
          <p>
            {terms.length ? `Nothing answers “${q.trim()}” yet.` : "Nothing on this topic yet."} Ask us, and if the answer would help other owners we’ll write it up.
          </p>
          <a className="text-link" href={ask}>
            Send us your question <span aria-hidden>→</span>
          </a>
        </div>
      ) : null}
    </>
  );
}
