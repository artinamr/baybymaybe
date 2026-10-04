import type { ReactNode } from "react";
import { Page, Crumbs, Closing, Kicker } from "@/components/site/Page";
import { ArticleLd, QaLd } from "@/components/site/JsonLd";
import { Photo, BANNER_SIZES } from "@/components/site/Photo";
import { PAGES, abs } from "@/lib/content";
import { service } from "@/content/services";
import { project } from "@/content/work";
import { CC0_URL } from "@/content/images";
import { article as findArticle, longDate, topicLabel, type ArticleMeta } from "@/content/blog";
import type { TocItem } from "@/content/blog/bodies";
import { ArticleCard } from "./ArticleCard";
import { Toc } from "./Toc";
import { Share } from "./Share";

/**
 * AN ARTICLE: the trail, the topic, the title, who wrote it and when, the
 * short answer up front, the cover photograph, then the article with its
 * contents alongside (sticky on wide screens, marking where you are), a few
 * questions answered in a line or two, and at the end everything it rests on:
 * the sources its facts were checked against and the photograph's credit.
 * Then a way to pass it on, where to go next, and one ask.
 */
export function Article({ a, toc, children }: { a: ArticleMeta; toc: TocItem[]; children: ReactNode }) {
  const crumbs = [
    { name: "Blog", href: PAGES.blog },
    { name: a.title, href: PAGES.article(a.slug) },
  ];
  const next = a.related.articles
    .map((sl) => findArticle(sl))
    .filter((x): x is ArticleMeta => Boolean(x))
    .slice(0, 2);
  const svc = a.related.services.slice(0, 1).map((sl) => service(sl)!);
  const work = a.related.work.slice(0, 1).map((sl) => project(sl)!);
  const c = a.cover.credit;
  return (
    <Page here="blog" crumbs={crumbs}>
      <ArticleLd a={a} />
      {a.faq.length ? <QaLd items={a.faq} /> : null}
      {/* How far through you are: a hairline of indigo along the top (CSS, scroll-driven; no script). */}
      <div className="ar-progress" aria-hidden />
      <article className="ar" aria-labelledby="ar-title">
        <header className="ar-head">
          <Crumbs crumbs={crumbs} />
          <p className="ar-topic" data-rv>
            {topicLabel(a.topic)}
          </p>
          <h1 id="ar-title" className="ar-h1" data-rv>
            {a.title}
          </h1>
          <p className="ar-meta" data-rv>
            <span>
              By <a href={PAGES.studio}>the Nerodyn studio</a>
            </span>
            <span>
              <time dateTime={a.published}>{longDate(a.published)}</time>
            </span>
            {a.updated ? (
              <span>
                Updated <time dateTime={a.updated}>{longDate(a.updated)}</time>
              </span>
            ) : null}
            <span>{a.minutes} min read</span>
            <span>
              <a href="#sources">{a.sources.length} sources</a>
            </span>
          </p>
          <div className="ar-short" data-rv>
            <p className="ar-short-h">The short answer</p>
            <p className="ar-short-b">{a.short}</p>
          </div>
        </header>

        <figure className="sp-banner ar-cover" data-rv>
          <Photo p={a.cover} sizes={BANNER_SIZES} eager />
        </figure>

        <div className="doc ar-doc">
          <Toc items={[...toc, ...(a.faq.length ? [{ id: "questions", title: "Questions" }] : []), { id: "sources", title: "Sources" }]} />
          <div className="doc-body prose">
            {children}

            {a.faq.length ? (
              <section className="ar-faq" aria-labelledby="questions">
                <h2 id="questions" className="ar-h2">
                  Questions people ask
                </h2>
                <dl>
                  {a.faq.map((f) => (
                    <div key={f.q}>
                      <dt>{f.q}</dt>
                      <dd>{f.a}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <section className="ar-sources" aria-labelledby="sources">
              <h2 id="sources" className="ar-h2">
                Sources
              </h2>
              <p className="ar-sources-note">
                Every fact above that isn’t our own experience was checked against these pages on the date shown. They are
                numbered in the order the article first cites them.
              </p>
              <ol>
                {a.sources.map((s, i) => (
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
              <p className="ar-credit">
                <span className="ar-credit-h">Photograph</span> “{c.title}” by{" "}
                <a href={c.authorUrl} rel="noopener noreferrer" target="_blank">
                  {c.author}
                </a>
                , from{" "}
                <a href={c.page} rel="noopener noreferrer" target="_blank">
                  StockSnap
                </a>
                . Public domain under{" "}
                <a href={CC0_URL} rel="noopener noreferrer" target="_blank">
                  CC0 1.0
                </a>
                ; cropped and colour-graded by us.
              </p>
            </section>

            <Share url={abs(PAGES.article(a.slug))} title={a.title} />
          </div>
        </div>
      </article>

      <section className="sp-block ar-rel" aria-labelledby="ar-rel-h">
        <Kicker>
          <span id="ar-rel-h">Where to go next</span>
        </Kicker>
        {next.length ? (
          <div className="bl-grid bl-grid-2">
            {next.map((x, i) => (
              <ArticleCard key={x.slug} a={x} level="h2" delay={i * 90} sizes="(min-width: 900px) 42vw, 92vw" />
            ))}
          </div>
        ) : null}
        <div className="svc-others-grid ar-rel-more">
          {svc.map((s) => (
            <a key={s.slug} className="svc-other" href={PAGES.service(s.slug)} data-rv>
              <span className="svc-n mono">The service</span>
              <span className="svc-other-name">{s.name}</span>
              <span className="svc-line">{s.line}</span>
              <span className="svc-go" aria-hidden>
                →
              </span>
            </a>
          ))}
          {work.map((p) => (
            <a key={p.slug} className="svc-other" href={PAGES.project(p.slug)} data-rv>
              <span className="svc-n mono">{p.kind === "demo" ? "Studio demonstration" : "Client project"}</span>
              <span className="svc-other-name">{p.client}</span>
              <span className="svc-line">{p.title}</span>
              <span className="svc-go" aria-hidden>
                →
              </span>
            </a>
          ))}
        </div>
      </section>

      <Closing
        title="Want a straight answer about your own site?"
        line="Start with the free audit: what is working, what is costing you enquiries, and what we would build instead, within two days."
        more={{ label: "More from the blog", href: PAGES.blog }}
      />
    </Page>
  );
}
