"use client";

import { useState } from "react";

/**
 * Questions that open in place (the home page's accordion, as a list of its
 * own): any number open at once, the height easing, the plus turning.
 */
export function QaList({ items, id, first = -1 }: { items: { q: string; a: string }[]; id: string; first?: number }) {
  const [open, setOpen] = useState<number[]>(first >= 0 ? [first] : []);
  return (
    <ul className="qa-list">
      {items.map((f, i) => {
        const on = open.includes(i);
        return (
          <li key={f.q} className="qa" data-open={on || undefined}>
            <h3>
              <button
                type="button"
                className="qa-q"
                aria-expanded={on}
                aria-controls={`${id}-${i}`}
                onClick={() => setOpen((cur) => (on ? cur.filter((x) => x !== i) : [...cur, i]))}
              >
                <span className="qa-n mono">{String(i + 1).padStart(2, "0")}</span>
                <span className="qa-text">{f.q}</span>
                <span className="qa-icon" aria-hidden />
              </button>
            </h3>
            <div className="qa-a" id={`${id}-${i}`} role="region" aria-hidden={!on}>
              <div>
                <p>{f.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
