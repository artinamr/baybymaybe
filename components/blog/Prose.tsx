import type { ReactNode } from "react";

/**
 * THE ARTICLE'S PARTS — the few shapes every article is built from, so the
 * six read as one publication: headings with anchors, figures (original
 * diagrams only), a callout, numbered steps, a comparison table and a
 * checklist. Styles live under `.prose` in globals.css.
 */

/** A section heading: its id is the contents list's target; the # is a mouse-only shortcut to its address. */
export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="ar-h2">
      {children}
      <a className="ar-anchor" href={`#${id}`} tabIndex={-1} aria-hidden>
        #
      </a>
    </h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="ar-h3">{children}</h3>;
}

/** A figure with its caption. */
export function Figure({ children, caption, wide = false }: { children: ReactNode; caption: ReactNode; wide?: boolean }) {
  return (
    <figure className="ar-fig" data-wide={wide ? "" : undefined}>
      <div className="ar-fig-body">{children}</div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/** A quiet aside: the one thing to remember, or the honest caveat. */
export function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ar-callout" role="note">
      <p className="ar-callout-t">{title}</p>
      <div className="ar-callout-b">{children}</div>
    </div>
  );
}

/** Numbered steps, each a short title and a line or two. */
export function Steps({ items }: { items: { t: string; b: ReactNode }[] }) {
  return (
    <ol className="ar-steps">
      {items.map((s, i) => (
        <li key={s.t}>
          <span className="ar-steps-n mono" aria-hidden>
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="ar-steps-t">{s.t}</p>
          <div className="ar-steps-b">{s.b}</div>
        </li>
      ))}
    </ol>
  );
}

/** A comparison table: a header row, then rows; the first column names the row. */
export function Compare({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="ar-table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table className="ar-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {head.map((h) =>
              h ? (
                <th key={h} scope="col">
                  {h}
                </th>
              ) : (
                <td key="corner" />
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) =>
                j === 0 ? (
                  <th key={j} scope="row">
                    {c}
                  </th>
                ) : (
                  <td key={j}>{c}</td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A checklist: the lines to tick off. */
export function Check({ items }: { items: ReactNode[] }) {
  return (
    <ul className="ar-check">
      {items.map((it, i) => (
        <li key={i}>
          <span className="ar-tick" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5l4.4 4.3L19 7.5" />
            </svg>
          </span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/** A source cited in the text: a small superscript number linking to the list at the foot. */
export function Cite({ n }: { n: number }) {
  return (
    <sup className="ar-cite">
      <a href={`#source-${n}`} aria-label={`Source ${n}`}>
        {n}
      </a>
    </sup>
  );
}
