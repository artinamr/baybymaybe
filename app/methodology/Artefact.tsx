/**
 * WHAT YOU RECEIVE AT EACH STAGE, shown rather than listed: the audit, the
 * scope, the prototype, the review link and the keys, each drawn as the thing
 * itself (HTML, not pictures, so it reflows and reads aloud). Index = the
 * stage (STAGES in lib/content.ts).
 */

import type { ReactNode } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const tick = (
  <svg viewBox="0 0 24 24" aria-hidden className="ma-tick">
    <path d="M5 12.5l4.4 4.3L19 7.5" />
  </svg>
);

function Card({ kind, title, children, foot }: { kind: string; title: string; children: ReactNode; foot?: string }) {
  return (
    <figure className="ma" data-rv>
      <figcaption className="ma-k">
        <span className="ma-dot" aria-hidden /> You receive · {kind}
      </figcaption>
      <p className="ma-title">{title}</p>
      {children}
      {foot ? <p className="ma-foot">{foot}</p> : null}
    </figure>
  );
}

export function Artefact({ i }: { i: number }) {
  if (i === 0)
    return (
      <Card kind="the audit" title="Your website, the way your customers meet it" foot="Within two days of the first call. Free, and yours to keep.">
        <dl className="ma-rows">
          <div>
            <dt>Working</dt>
            <dd>What to keep: the pages and words that already bring people in.</dd>
          </div>
          <div>
            <dt>Costing you</dt>
            <dd>What loses enquiries: slow pages, buried contact details, dead ends on a phone.</dd>
          </div>
          <div>
            <dt>We’d build</dt>
            <dd>What we would change, in order, and roughly how long it would take.</dd>
          </div>
        </dl>
      </Card>
    );
  if (i === 1)
    return (
      <Card kind="the scope" title="One document, signed before anything is built">
        <dl className="ma-rows ma-rows-tight">
          <div>
            <dt>Pages and screens</dt>
            <dd>Listed one by one</dd>
          </div>
          <div>
            <dt>Features</dt>
            <dd>What each does, and what it doesn’t</dd>
          </div>
          <div>
            <dt>Connects to</dt>
            <dd>Your calendar, CRM, payments or email</dd>
          </div>
          <div>
            <dt>From you</dt>
            <dd>The content and decisions we need, and when</dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd>
              <b>Fixed, in writing</b>
            </dd>
          </div>
          <div>
            <dt>Live</dt>
            <dd>
              <b>A date, in writing</b>
            </dd>
          </div>
        </dl>
        <p className="ma-sign" aria-hidden>
          <span>Signed</span>
          <i />
        </p>
      </Card>
    );
  if (i === 2)
    return (
      <Card kind="the prototype" title="Every page, clickable, with your real words" foot="A page from Butter Days, one of our concept websites. A prototype looks and clicks like the finished site.">
        <div className="ma-browser">
          <div className="dev-bar" aria-hidden>
            <span className="dev-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="dev-url">prototype, private to you</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
          <img src={`${BASE}/work/butter-days/page-menu.webp`} alt="A prototype page: the Butter Days menu, with tabs for pastries, bread, cakes and drinks." width={1200} height={750} loading="lazy" decoding="async" />
        </div>
      </Card>
    );
  if (i === 3)
    return (
      <Card kind="the review link" title="The real thing, to try before it launches">
        <p className="ma-url">
          <span className="ma-lock" aria-hidden /> review link, private to you
        </p>
        <ul className="ma-checks">
          {[
            "Real phones, tablets and computers",
            "Accessibility, checked against WCAG at level AA",
            "Speed on a slow phone connection",
            "Every form, link and redirect",
            "Search basics: titles, descriptions, sitemap",
          ].map((x) => (
            <li key={x}>
              {tick}
              {x}
            </li>
          ))}
        </ul>
      </Card>
    );
  return (
    <Card kind="the keys" title="Everything handed over, in your name">
      <ul className="ma-keys">
        {["The domain", "The hosting", "The code", "The editor’s logins", "Analytics and search tools"].map((x) => (
          <li key={x}>
            <span>{x}</span>
            <b>In your name</b>
          </li>
        ))}
        <li>
          <span>Plain notes on how it all works</span>
          <b>Yours</b>
        </li>
      </ul>
    </Card>
  );
}
