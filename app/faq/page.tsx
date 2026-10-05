import type { Metadata } from "next";
import { SubHeader } from "@/components/site/SubHeader";
import { SubReveal } from "@/components/site/SubReveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { QaList } from "@/components/site/QaList";
import { CONTACT, FAQ_ALL, PAGES, ogCard } from "@/lib/content";
import { CrumbsLd, FaqLd, SiteLd } from "@/components/site/JsonLd";
import { pageMeta } from "@/lib/meta";

export const metadata: Metadata = pageMeta({
  title: "Questions: straight answers before the first call",
  description:
    "Straight answers to what people ask Nerodyn before the first call: price, time, ownership, working together and AI automation for NZ businesses.",
  path: "faq/",
  image: ogCard("faq", "Straight answers: what people ask Nerodyn before the first call."),
});

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-").replace(/(^-|-$)/g, "");

/** Where each group's questions are answered at length: an article, or a page of the site. */
const FURTHER: Record<string, { label: string; href: string }[]> = {
  "Getting started": [
    { label: "Website redesign or targeted improvements: how to decide", href: PAGES.article("redesign-or-improve") },
    { label: "The free audit", href: PAGES.audit },
  ],
  "Price and time": [
    { label: "What a business website quote should include", href: PAGES.article("website-quote-checklist") },
    { label: "How our projects are priced", href: PAGES.pricing },
  ],
  "Working together": [{ label: "How a project runs, stage by stage", href: PAGES.methodology }],
  "Ownership and after launch": [{ label: "After launch: website ownership, hosting and support", href: PAGES.article("after-launch-ownership") }],
  "AI automation": [{ label: "Five practical AI automation workflows for NZ businesses", href: PAGES.article("ai-automation-workflows") }],
};

/** QUESTIONS: everything a buyer asks before the first call, grouped, with the topics alongside. */
export default function Questions() {
  return (
    <div className="sp">
      <SubReveal />
      <SiteLd />
      <CrumbsLd crumbs={[{ name: "Home", href: PAGES.home }, { name: "Questions", href: PAGES.faq }]} />
      <FaqLd />
      <SubHeader here="faq" />
      <main id="main" className="sp-main">
        <section className="sp-hero sp-hero-s">
          <p className="sp-kicker" data-rv>
            <span className="sp-rule" aria-hidden /> Questions
          </p>
          <h1 className="sp-h1" data-rv>
            Straight answers.
          </h1>
          <p className="sp-lede" data-rv>
            What people ask us before the first call. Anything else, write to{" "}
            <a className="sp-inline" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
            . The people who answer are the people who build.
          </p>
        </section>

        <div className="doc">
          <nav className="doc-toc" aria-label="Topics">
            <p className="doc-toc-h">Topics</p>
            {FAQ_ALL.map((g) => (
              <a key={g.group} href={`#${slug(g.group)}`}>
                {g.group}
              </a>
            ))}
            <p className="doc-toc-h fq-toc-more">Words you don’t know?</p>
            <a href={PAGES.glossary}>The glossary</a>
          </nav>
          <div className="doc-body">
            {FAQ_ALL.map((g, gi) => (
              <section key={g.group} id={slug(g.group)} className="fq-group" aria-labelledby={`${slug(g.group)}-h`} data-rv>
                <h2 id={`${slug(g.group)}-h`} className="fq-h">
                  <span className="mono">{String(gi + 1).padStart(2, "0")}</span>
                  {g.group}
                </h2>
                <QaList items={g.items} id={slug(g.group)} first={gi === 0 ? 0 : -1} />
                {FURTHER[g.group]?.length ? (
                  <p className="fq-more">
                    <span>Go further</span>
                    {FURTHER[g.group].map((f) => (
                      <a key={f.href} href={f.href}>
                        {f.label} <span aria-hidden>→</span>
                      </a>
                    ))}
                  </p>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
