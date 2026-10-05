import { Page, Crumbs, Closing } from "@/components/site/Page";
import { GlossaryLd } from "@/components/site/JsonLd";
import { GlossaryFilter } from "@/components/blog/GlossaryFilter";
import { CONTACT, PAGES, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { searchable } from "@/lib/search";
import { article, longDate } from "@/content/blog";
import { BODIES } from "@/content/blog/bodies";
import { GLOSSARY, TERM_GROUPS, glossarySources, type GlossaryTerm } from "@/content/blog/glossary";

const DESCRIPTION =
  "Plain-English definitions of the words that come up when a New Zealand business plans a website, platform or AI automation, from DNS and UDAI to consent.";

export const metadata = pageMeta({
  title: "Glossary: web, platform and AI terms in plain English",
  description: DESCRIPTION,
  path: "blog/glossary/",
  image: ogCard("blog-glossary", "Web words, in plain English: the Nerodyn glossary."),
});

const TERMS = GLOSSARY as readonly GlossaryTerm[];

/** Where an article goes further into a term: the article and the section's own name. */
function seeAlso(t: GlossaryTerm) {
  if (!t.see) return null;
  const a = article(t.see.slug);
  const sec = BODIES[t.see.slug]?.toc.find((x) => x.id === t.see!.id);
  if (!a || !sec) return null;
  return { href: `${PAGES.article(a.slug)}#${sec.id}`, section: sec.title, title: a.title };
}

/**
 * THE GLOSSARY: every term in a sentence or two, grouped by what it is
 * about, findable by typing, each with its own address (#id) that articles
 * link to, the article that goes further, and the sources for anything more
 * than a definition.
 */
export default function Glossary() {
  const crumbs = [
    { name: "Blog", href: PAGES.blog },
    { name: "Glossary", href: PAGES.glossary },
  ];
  const sources = glossarySources();
  const n = (key: string) => sources.findIndex((s) => s.key === key) + 1;
  const checked = sources.reduce((d, s) => (s.accessed > d ? s.accessed : d), "");
  return (
    <Page here="blog" crumbs={crumbs}>
      <GlossaryLd name="Web, platform and AI terms in plain English" description={DESCRIPTION} terms={[...TERMS]} />

      <section className="sp-hero gl-hero">
        <Crumbs crumbs={crumbs} />
        <h1 className="sp-h1" data-rv>
          Web words,
          <br />
          <em>in plain English.</em>
        </h1>
        <p className="sp-lede" data-rv>
          The words that come up when you plan a website, a platform or automation, each explained in a sentence or two.
          Where New Zealand’s rules apply, they’re here too, with the source.
        </p>
      </section>

      <div className="doc gl">
        <aside className="doc-toc gl-side" aria-label="Find a term">
          <GlossaryFilter terms={TERMS.map((t) => ({ id: t.id, text: searchable(`${t.term} ${t.also ?? ""} ${t.def}`) }))} />
          <nav className="gl-topics" aria-label="Topics">
            <p className="doc-toc-h">Topics</p>
            {TERM_GROUPS.map((g) => (
              <a key={g.key} href={`#g-${g.key}`}>
                {g.title}
              </a>
            ))}
            <a href="#sources">Sources</a>
          </nav>
        </aside>

        <div className="doc-body gl-body">
          {TERM_GROUPS.map((g) => (
            <section key={g.key} id={`g-${g.key}`} className="gl-group" aria-labelledby={`g-${g.key}-h`}>
              <header className="gl-group-head">
                <h2 id={`g-${g.key}-h`} className="gl-h">
                  {g.title}
                </h2>
                <p className="gl-line">{g.line}</p>
              </header>
              <dl className="gl-list">
                {TERMS.filter((t) => t.group === g.key).map((t) => {
                  const see = seeAlso(t);
                  return (
                    <div key={t.id} id={t.id} className="gl-term" data-term={t.id}>
                      <dt>
                        <span className="gl-t">{t.term}</span>
                        {t.also ? <span className="gl-also">{t.also}</span> : null}
                      </dt>
                      <dd>
                        <p>
                          {t.def}
                          {t.cite?.map((k) => (
                            <sup key={k} className="ar-cite">
                              <a href={`#source-${n(k)}`} aria-label={`Source ${n(k)}`}>
                                {n(k)}
                              </a>
                            </sup>
                          ))}
                        </p>
                        {see ? (
                          <a className="gl-see" href={see.href}>
                            <span className="gl-see-h">Read more:</span> {see.section} <span className="gl-see-in">in “{see.title}”</span>{" "}
                            <span aria-hidden>→</span>
                          </a>
                        ) : null}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}

          <section className="ar-sources gl-sources prose" aria-labelledby="sources">
            <h2 id="sources" className="ar-h2">
              Sources
            </h2>
            <p className="ar-sources-note">
              Anything in a definition beyond the meaning of the word (a number, a rule, the law) was checked against these
              pages on {longDate(checked)}. They are numbered in the order the terms first cite them.
            </p>
            <ol>
              {sources.map((s, i) => (
                <li key={s.url} id={`source-${i + 1}`}>
                  <a href={s.url} rel="noopener noreferrer" target="_blank">
                    {s.title}
                  </a>
                  <span>
                    {" "}
                    ({s.publisher}). Checked {longDate(s.accessed)}.
                  </span>
                </li>
              ))}
            </ol>
            <p className="gl-missing">
              Missing a word you’ve been asked about? <a href={`mailto:${CONTACT.email}?subject=${encodeURIComponent("A word for the glossary")}`}>Tell us</a>{" "}
              and we’ll add it.
            </p>
          </section>
        </div>
      </div>

      <Closing
        title="Rather we explained it on your own site?"
        line="Start with the free audit: what is working, what is costing you enquiries, and what we would build instead, in plain words, within two days."
        more={{ label: "Back to the blog", href: PAGES.blog }}
      />
    </Page>
  );
}
