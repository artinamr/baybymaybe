"use client";

import { useState, type PointerEvent } from "react";
import "./crazy-qa.css";

/** The row's light follows the pointer: written straight onto the row, no re-render. */
function follow(e: PointerEvent<HTMLLIElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

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
          <li key={f.q} className="qa" data-open={on || undefined} onPointerMove={follow}>
            <h3>
              <button
                type="button"
                className="qa-q"
                aria-expanded={on}
                aria-controls={`${id}-${i}`}
                onClick={() => setOpen((cur) => (on ? cur.filter((x) => x !== i) : [...cur, i]))}
              >
                <span className="qa-n mono" data-n={String(i + 1).padStart(2, "0")} aria-hidden />
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
