import type { Metadata } from "next";
import { SubHeader } from "@/components/site/SubHeader";
import { SubReveal } from "@/components/site/SubReveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { QaList } from "@/components/site/QaList";
import { CONTACT, FAQ_ALL } from "@/lib/content";
import { FaqLd } from "@/components/site/JsonLd";

export const metadata: Metadata = {
  title: "Questions — Nerodyn",
  description: "Straight answers to what people ask Nerodyn before the first call: price, time, ownership, working together and AI automation.",
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-").replace(/(^-|-$)/g, "");

/** QUESTIONS — everything a buyer asks before the first call, grouped, with the topics alongside. */
export default function Questions() {
  return (
    <div className="sp">
      <SubReveal />
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
            </a>{" "}
            — the people who answer are the people who build.
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
          </nav>
          <div className="doc-body">
            {FAQ_ALL.map((g, gi) => (
              <section key={g.group} id={slug(g.group)} className="fq-group" aria-labelledby={`${slug(g.group)}-h`} data-rv>
                <h2 id={`${slug(g.group)}-h`} className="fq-h">
                  <span className="mono">{String(gi + 1).padStart(2, "0")}</span>
                  {g.group}
                </h2>
                <QaList items={g.items} id={slug(g.group)} first={gi === 0 ? 0 : -1} />
              </section>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
