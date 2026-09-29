import type { ReactNode } from "react";
import { SubHeader } from "./SubHeader";
import { SubReveal } from "./SubReveal";
import { SiteFooter } from "./SiteFooter";

export type LegalSection = { id: string; title: string; body: ReactNode };

/**
 * A legal page (privacy, terms): the title and its date, the sections listed
 * alongside for a quick jump, and plain paragraphs — written to be read.
 */
export function LegalPage({
  here,
  kicker,
  title,
  updated,
  lede,
  sections,
}: {
  here: "privacy" | "terms";
  kicker: string;
  title: string;
  updated: string;
  lede: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="sp">
      <SubReveal />
      <SubHeader here={here} />
      <main id="main" className="sp-main">
        <section className="sp-hero sp-hero-s">
          <p className="sp-kicker" data-rv>
            <span className="sp-rule" aria-hidden /> {kicker}
          </p>
          <h1 className="sp-h1" data-rv>
            {title}
          </h1>
          <p className="sp-meta" data-rv>
            Last updated {updated}
          </p>
          <p className="sp-lede" data-rv>
            {lede}
          </p>
        </section>
        <div className="doc">
          <nav className="doc-toc" aria-label="Sections">
            <p className="doc-toc-h">On this page</p>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.title}
              </a>
            ))}
          </nav>
          <div className="doc-body lg-body">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="lg-sec" aria-labelledby={`${s.id}-h`}>
                <h2 id={`${s.id}-h`} className="lg-h">
                  <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                {s.body}
              </section>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
