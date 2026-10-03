import type { ReactNode } from "react";

/**
 * THE ARTICLES' DIAGRAMS — drawn in the page's own type and hairlines, as
 * HTML rather than pictures: they reflow to a phone's width, their words stay
 * real text (readable, searchable, translatable), and they share the site's
 * ink and indigo. Four shapes cover the six articles.
 */

/**
 * A decision: questions down a spine. "Yes" carries on down; "No" steps out
 * to its answer. The last box is where every "yes" arrives.
 */
export function DecisionTree({ steps, end }: { steps: { q: string; no: { t: string; b: string } }[]; end: { t: string; b: string } }) {
  return (
    <div className="dg dg-tree">
      <ol className="dg-tree-list">
        {steps.map((s, i) => (
          <li key={s.q} className="dg-tree-row">
            <div className="dg-q">
              <span className="dg-n mono" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <p>{s.q}</p>
            </div>
            <div className="dg-no">
              <span className="dg-branch" aria-hidden>
                No
              </span>
              <div className="dg-out">
                <span className="sr-only">If not: </span>
                <p className="dg-out-t">{s.no.t}</p>
                <p className="dg-out-b">{s.no.b}</p>
              </div>
            </div>
            <span className="dg-yes" aria-hidden>
              Yes
            </span>
          </li>
        ))}
      </ol>
      <div className="dg-end">
        <span className="sr-only">If every answer is yes: </span>
        <p className="dg-out-t">{end.t}</p>
        <p className="dg-out-b">{end.b}</p>
      </div>
    </div>
  );
}

/**
 * A flow: steps left to right (top to bottom on a phone). A step marked
 * `person` is where a person decides; `alt` is a side door out of a step.
 */
export function Flow({ steps }: { steps: { t: string; b?: string; person?: boolean; alt?: string }[] }) {
  return (
    <ol className="dg dg-flow">
      {steps.map((s) => (
        <li key={s.t} className="dg-step" data-person={s.person ? "" : undefined}>
          <p className="dg-step-t">
            {s.person ? (
              <span className="dg-person" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="3.6" />
                  <path d="M4.8 20c.9-3.9 3.7-6 7.2-6s6.3 2.1 7.2 6" />
                </svg>
              </span>
            ) : null}
            {s.t}
          </p>
          {s.b ? <p className="dg-step-b">{s.b}</p> : null}
          {s.alt ? <p className="dg-alt">{s.alt}</p> : null}
        </li>
      ))}
    </ol>
  );
}

/** Where each thing goes: a source, an arrow, one or more destinations, and what happens if it fails. */
export function Routes({ rows, failure }: { rows: { from: string; to: string[]; note?: string }[]; failure?: ReactNode }) {
  return (
    <div className="dg dg-routes">
      <ul className="dg-routes-list">
        {rows.map((r) => (
          <li key={r.from} className="dg-route">
            <p className="dg-node dg-from">{r.from}</p>
            <span className="dg-arrow" aria-hidden>
              <svg viewBox="0 0 40 12" preserveAspectRatio="none">
                <path d="M0 6h36M31 1.5 37 6l-6 4.5" />
              </svg>
            </span>
            <span className="sr-only">goes to</span>
            <div className="dg-to">
              {r.to.map((t) => (
                <p key={t} className="dg-node">
                  {t}
                </p>
              ))}
            </div>
            {r.note ? <p className="dg-route-note">{r.note}</p> : null}
          </li>
        ))}
      </ul>
      {failure ? <div className="dg-failure">{failure}</div> : null}
    </div>
  );
}

/** Layers, top to bottom, each with what it is and what "yours" means for it. */
export function Layers({ rows }: { rows: { t: string; b: string; yours: string }[] }) {
  return (
    <ol className="dg dg-layers">
      {rows.map((r, i) => (
        <li key={r.t} className="dg-layer">
          <span className="dg-n mono" aria-hidden>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="dg-layer-what">
            <p className="dg-layer-t">{r.t}</p>
            <p className="dg-layer-b">{r.b}</p>
          </div>
          <p className="dg-layer-yours">
            <span className="dg-tick" aria-hidden>
              <svg viewBox="0 0 24 24">
                <path d="M5 12.5l4.4 4.3L19 7.5" />
              </svg>
            </span>
            {r.yours}
          </p>
        </li>
      ))}
    </ol>
  );
}
