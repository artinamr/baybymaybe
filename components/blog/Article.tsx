import type { ReactNode } from "react";
import { Page, Crumbs, Closing } from "@/components/site/Page";
import { ArticleLd } from "@/components/site/JsonLd";
import { PAGES } from "@/lib/content";
import { service } from "@/content/services";
import { project } from "@/content/work";
import { article as findArticle, longDate, topicLabel, type ArticleMeta } from "@/content/blog";
import type { TocItem } from "@/content/blog/bodies";

/**
 * AN ARTICLE — the trail, the topic, the title, who wrote it and when, the
 * short answer up front, the cover (a frame of the film), then the article
 * with its contents alongside (sticky on wide screens), the sources its facts
 * were checked against, where to go next, and one ask.
 */
export function Article({ a, toc, children }: { a: ArticleMeta; toc: TocItem[]; children: ReactNode }) {
  const crumbs = [
    { name: "Blog", href: PAGES.blog },
    { name: a.title, href: PAGES.article(a.slug) },
  ];
  // Four ways on, two by two: the service, a project, two more articles.
  const related = [
    ...a.related.services.slice(0, 1).map((sl) => {
      const s = service(sl)!;
      return { kind: "The service", name: s.name, line: s.line, href: PAGES.service(sl) };
    }),
    ...a.related.work.slice(0, 1).map((sl) => {
      const p = project(sl)!;
      return { kind: p.kind === "demo" ? "Studio demonstration" : "Client project", name: p.client, line: p.title, href: PAGES.project(sl) };
    }),
    ...a.related.articles
      .slice(0, 2)
      .map((sl) => findArticle(sl))
      .filter((x): x is ArticleMeta => Boolean(x))
      .map((x) => ({ kind: "Read next", name: x.title, line: x.description, href: PAGES.article(x.slug) })),
  ];
  return (
    <Page here="blog" crumbs={crumbs}>
      <ArticleLd a={a} />
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
              By <a href={PAGES.studio}>Nerodyn studio</a>
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
          </p>
          <div className="ar-short" data-rv>
            <p className="ar-short-h">The short answer</p>
            <p className="ar-short-b">{a.short}</p>
          </div>
        </header>

        <figure className="sp-banner ar-cover" data-rv>
          {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
          <img src={a.cover.src} alt={a.cover.alt} width={2400} height={1100} fetchPriority="high" decoding="async" />
        </figure>

        <div className="doc ar-doc">
          <nav className="doc-toc ar-toc" aria-label="Contents">
            <p className="doc-toc-h">Contents</p>
            {toc.map((t) => (
              <a key={t.id} href={`#${t.id}`}>
                {t.title}
              </a>
            ))}
            <a href="#sources">Sources</a>
          </nav>
          <div className="doc-body prose">
            {children}
            <section className="ar-sources" aria-labelledby="sources">
              <h2 id="sources" className="ar-h2">
                Sources
              </h2>
              <p className="ar-sources-note">
                Every fact above that isn’t our own experience was checked against these pages on the date shown.
              </p>
              <ol>
                {a.sources.map((s, i) => (
                  <li key={s.url} id={`source-${i + 1}`}>
                    <a href={s.url} rel="noopener noreferrer" target="_blank">
                      {s.title}
                    </a>
                    <span>
                      {" "}
                      — {s.publisher}. Checked {longDate(s.accessed)}.
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </article>

      <section className="sp-block svc-others ar-rel" aria-labelledby="ar-rel-h">
        <p className="sp-kicker" id="ar-rel-h" data-rv>
          <span className="sp-rule" aria-hidden /> Where to go next
        </p>
        <div className="svc-others-grid">
          {related.map((r) => (
            <a key={r.href} className="svc-other" href={r.href} data-rv>
              <span className="svc-n mono">{r.kind}</span>
              <span className="svc-other-name">{r.name}</span>
              <span className="svc-line">{r.line}</span>
              <span className="svc-go" aria-hidden>
                →
              </span>
            </a>
          ))}
        </div>
      </section>

      <Closing
        title="Want a straight answer about your own site?"
        line="Start with the free audit: what is working, what is costing you enquiries, and what we would build instead — within two days."
        more={{ label: "More from the blog", href: PAGES.blog }}
      />
    </Page>
  );
}
