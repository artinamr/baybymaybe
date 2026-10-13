import type { ReactNode } from "react";
import { Page, Kicker, Title, Closing } from "@/components/site/Page";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { Situations } from "@/components/blog/Situations";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { BlogLd } from "@/components/site/JsonLd";
import { CONTACT, PAGES, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

import { ALL_SOURCES, BLOG_UPDATED, PUBLISHED, TOPICS, longDate, type ToolKind } from "@/content/blog";
import { BODIES } from "@/content/blog/bodies";
import { GLOSSARY } from "@/content/blog/glossary";

export const metadata = pageMeta({
  title: "Blog: websites, platforms and AI for NZ businesses",
  description:
    "Plain, checked answers for New Zealand businesses about websites, platforms and AI automation, with checklists, a glossary and every source listed.",
  path: "blog/",
  feed: true,
  image: ogCard("blog", "The Nerodyn blog: plain, checked answers about websites, platforms and AI automation."),
});

const ASK = `mailto:${CONTACT.email}?subject=${encodeURIComponent("A question for the blog")}`;

/** A small drawing for each kind of tool, in the page's hairlines. */
const TOOL_ICON: Record<ToolKind, ReactNode> = {
  Checklist: <path d="M4 7.5l2 2 3.5-4M4 16.5l2 2 3.5-4M13 8h7M13 17h7" />,
  Steps: <path d="M4 19h5v-5h5V9h6M17 6l3 3-3 3" />,
  "Decision path": <path d="M12 3v7M12 10l-6 6M12 10l6 6M4 18h4M16 18h4" />,
  Comparison: <path d="M4 4h16v16H4zM12 4v16M4 10h16" />,
  Template: <path d="M4 4h16v16H4zM4 9.5h16M4 15h16M10 4v16" />,
  Test: <path d="M9.2 9a3 3 0 115 2.2c-1.3.8-2.2 1.5-2.2 3M12 18.5v.01" />,
};

/** Glossary terms worth showing on the index: the ones owners ask us about most. */
const SAMPLE = ["dns", "udai", "redirect", "core-web-vitals", "crm", "webhook", "human-in-the-loop", "privacy-act", "two-factor"];

/**
 * THE BLOG: plain, checked answers for owners. Start where you are (your
 * situation, the article that answers it, its short answer alongside), every
 * article (search, topics, cards), the tools inside them, the glossary and how
 * we write, and an open door for the question we haven't answered yet.
 */
export default function Blog() {
  const situations = PUBLISHED.filter((a) => a.situation).slice(0, 8);
  const tools = PUBLISHED.flatMap((a) =>
    a.tools.map((t) => ({ ...t, a, section: BODIES[a.slug]?.toc.find((x) => x.id === t.id)?.title ?? t.title }))
  );
  const sample = SAMPLE.map((id) => GLOSSARY.find((t) => t.id === id)).filter((t) => t !== undefined);
  return (
    <Page here="blog" crumbs={[{ name: "Blog", href: PAGES.blog }]}>
      <BlogLd articles={PUBLISHED} />

      <section className="sp-hero bl-hero">
        <Kicker>Blog</Kicker>
        <Title lines={["Know what you’re", "saying yes to."]} />
        <div className="bl-hero-row">
          <p className="sp-lede" data-rv>
            Work out what your website needs, what a quote should cover, and where AI can help with the daily work.
            Written in Auckland, with practical checks and sources you can read for yourself.
          </p>
          <div className="bl-stats" data-rv>
            <dl>
              <div>
                <dt>Articles</dt>
                <dd>{PUBLISHED.length}</dd>
              </div>
              <div>
                <dt>Sources checked</dt>
                <dd>{ALL_SOURCES.length}</dd>
              </div>
              <div>
                <dt>Terms explained</dt>
                <dd>{GLOSSARY.length}</dd>
              </div>
            </dl>
            <p className="bl-stats-note">
              Last checked <time dateTime={BLOG_UPDATED}>{longDate(BLOG_UPDATED)}</time>.{" "}
              <a href={PAGES.standards}>How we write</a>
            </p>
          </div>
        </div>
      </section>

      {situations.length ? (
        <section className="sp-block bl-start" aria-labelledby="bl-start-h">
          <header className="bl-start-head">
            <Kicker>A place to start</Kicker>
            <h2 id="bl-start-h" className="sp-h2" data-rv>
              What are you deciding?
            </h2>
          </header>
          <Situations
            items={situations.map((a) => ({
              slug: a.slug,
              href: PAGES.article(a.slug),
              situation: a.situation!,
              title: a.title,
              short: a.short,
              minutes: a.minutes,
              cover: { src: a.cover.src, srcSet: a.cover.srcSet, width: a.cover.width, height: a.cover.height, position: a.cover.position },
            }))}
          />
        </section>
      ) : null}

      <section className="sp-block bl-all" aria-labelledby="bl-all-h">
        <header className="bl-all-head">
          <Kicker>Every article</Kicker>
          <h2 id="bl-all-h" className="sp-h2" data-rv>
            Read up before you commit.
          </h2>
        </header>
        <BlogIndex
          topics={TOPICS}
          ask={ASK}
          index={`${PAGES.blog}search.json`}
          items={PUBLISHED.map((a) => ({ slug: a.slug, topic: a.topic }))}
        >
          <div className="bl-grid">
            {PUBLISHED.map((a, i) => (
              <ArticleCard key={a.slug} a={a} featured={i === 0} delay={(i % 2) * 90} sizes={i === 0 ? "(min-width: 900px) 48vw, 92vw" : "(min-width: 700px) 42vw, 92vw"} />
            ))}
          </div>
        </BlogIndex>
      </section>

      <section className="sp-block split bl-kit" aria-labelledby="bl-kit-h">
        <header className="split-head">
          <Kicker>The toolkit</Kicker>
          <h2 id="bl-kit-h" className="sp-h2" data-rv>
            Take something useful to the meeting.
          </h2>
          <p className="sp-lede bl-kit-note" data-rv>
            Compare quotes, check a handover or map a connection between your tools. These sections open straight to
            the practical part. Print the article or save it as a PDF when you need a copy.
          </p>
        </header>
        <ul className="bl-kit-list">
          {tools.map((t, i) => (
            <li key={`${t.a.slug}-${t.id}`} data-rv style={{ transitionDelay: `${(i % 2) * 70}ms` }}>
              <a href={`${PAGES.article(t.a.slug)}#${t.id}`}>
                <span className="bl-kit-ic" aria-hidden>
                  <svg viewBox="0 0 24 24">{TOOL_ICON[t.kind]}</svg>
                </span>
                <span className="bl-kit-k">{t.kind}</span>
                <span className="bl-kit-t">{t.title}</span>
                <span className="bl-kit-a">In “{t.a.title}”</span>
                <span className="bl-kit-go" aria-hidden>
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block bl-pair" aria-label="The glossary, and how we write">
        <div className="bl-pair-card" data-rv>
          <p className="bl-pair-k">Glossary</p>
          <h2 className="bl-pair-h">
            <a href={PAGES.glossary}>Web words, in plain English.</a>
          </h2>
          <p className="bl-pair-b">
            {GLOSSARY.length} terms you’ll meet planning a website, a platform or automation, each in a sentence or two, with
            New Zealand’s rules where they apply.
          </p>
          <p className="bl-chips">
            {sample.map((t) => (
              <a key={t.id} href={`${PAGES.glossary}#${t.id}`}>
                {t.term}
              </a>
            ))}
          </p>
          <a className="text-link" href={PAGES.glossary}>
            Open the glossary <span aria-hidden>→</span>
          </a>
        </div>
        <div className="bl-pair-card" data-rv style={{ transitionDelay: "90ms" }}>
          <p className="bl-pair-k">How we write</p>
          <h2 className="bl-pair-h">
            <a href={PAGES.standards}>Advice you can check.</a>
          </h2>
          <ul className="bl-pair-list">
            <li>Every fact checked against a primary source, with the date</li>
            <li>No sponsored articles, affiliate links or paid mentions</li>
            <li>Public-domain photographs, credited</li>
            <li>Mistakes fixed, and the article marked as updated</li>
          </ul>
          <a className="text-link" href={PAGES.standards}>
            Read our standards <span aria-hidden>→</span>
          </a>
        </div>
      </section>

      <section className="sp-block bl-ask" aria-labelledby="bl-ask-h">
        <h2 id="bl-ask-h" className="bl-ask-h" data-rv>
          Got a question we haven’t answered?
        </h2>
        <div className="bl-ask-side" data-rv>
          <p>
            Send it through. We’ll reply. If the answer would help other business owners, we may turn it into an article
            without using your name.
          </p>
          <div className="bl-ask-actions">
            <a className="ghost" href={ASK}>
              <span className="ghost-fill" aria-hidden />
              <span className="ghost-label">Send us your question</span>
            </a>
            <a className="text-link" href={`${PAGES.blog}feed.xml`}>
              Follow new articles (RSS) <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </section>

      <Closing
        title="Let’s look at your website."
        line="Send us the link for a free audit. We’ll reply within two days with what we would fix first."
        more={{ label: "See the services", href: PAGES.services }}
      />
    </Page>
  );
}
