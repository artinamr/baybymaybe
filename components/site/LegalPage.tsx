import type { CSSProperties, ReactNode } from "react";
import { SubHeader } from "./SubHeader";
import { SubReveal } from "./SubReveal";
import { SiteFooter } from "./SiteFooter";
import { PageLd } from "./JsonLd";
import { PAGES } from "@/lib/content";
import "./crazy-legal.css";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** A named scroll timeline per section, so the contents can follow the reader. */
const tl = (id: string) => `--lg-${id}`;

/**
 * A legal page (privacy, terms): the title and its date, the sections listed
 * alongside for a quick jump, and plain paragraphs, written to be read. The
 * contents light the section you are in and a hairline shows how far you are,
 * both driven by the scroll in CSS (crazy-legal.css), no script.
 */
export function LegalPage({
  here,
  description,
  kicker,
  title,
  updated,
  lede,
  sections,
}: {
  here: "privacy" | "terms";
  /** The page description (its structured data, as in its metadata). */
  description: string;
  kicker: string;
  title: string;
  updated: string;
  lede: ReactNode;
  sections: LegalSection[];
}) {
  const scope = { "--lg-scope": sections.map((s) => tl(s.id)).join(", ") } as CSSProperties;
  return (
    <div className="sp">
      <PageLd href={here === "privacy" ? PAGES.privacy : PAGES.terms} name={title} description={description} />
      <SubReveal />
      <SubHeader here={here} />
      <span className="lg-progress" aria-hidden />
      <main id="main" className="sp-main">
        <section className="sp-hero sp-hero-s lg-hero">
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
        <div className="doc lg-doc" style={scope}>
          <nav className="doc-toc" aria-label="Sections">
            <p className="doc-toc-h">On this page</p>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} style={{ "--lg-tl": tl(s.id) } as CSSProperties}>
                {s.title}
              </a>
            ))}
          </nav>
          <div className="doc-body lg-body">
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="lg-sec"
                aria-labelledby={`${s.id}-h`}
                style={{ "--lg-tl": tl(s.id) } as CSSProperties}
              >
                <h2 id={`${s.id}-h`} className="lg-h">
                  <span className="mono" data-n={String(i + 1).padStart(2, "0")} aria-hidden />
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
