import { Kicker } from "@/components/site/Page";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { PAGES } from "@/lib/content";
import { PUBLISHED, type ArticleMeta } from "@/content/blog";
import "./crazy-live.css";

/**
 * A case study's reading: the articles that name this project, or else the
 * articles about its services; those mainly about one of its services first,
 * and among them the buying guides (a `situation` answers a buyer's starting
 * point); newest first within each. Three at most.
 */
export function readingFor(slug: string, services: string[]): ArticleMeta[] {
  const named = PUBLISHED.filter((a) => a.related.work.includes(slug));
  const pool = named.length ? named : PUBLISHED.filter((a) => a.related.services.some((s) => services.includes(s)));
  const rank = (a: ArticleMeta) => (services.includes(a.related.services[0]) ? 0 : 2) + (a.situation ? 0 : 1);
  return pool
    .map((a, i) => ({ a, i }))
    .sort((x, y) => rank(x.a) - rank(y.a) || x.i - y.i)
    .map((x) => x.a)
    .slice(0, 3);
}

/** The block itself: the same "From the blog" row the service pages show. */
export function Reading({ articles }: { articles: ArticleMeta[] }) {
  if (!articles.length) return null;
  return (
    <section className="sp-block bl-related cz-reading" aria-labelledby="read-h">
      <header className="split-head bl-related-head">
        <Kicker>From the blog</Kicker>
        <h2 id="read-h" className="sp-h2 cz-reading-title" data-rv>
          Before you build.
        </h2>
        <p className="split-more" data-rv>
          <a className="text-link" href={PAGES.blog}>
            All articles <span aria-hidden>→</span>
          </a>
        </p>
      </header>
      <div className="bl-grid bl-grid-3">
        {articles.map((a, i) => (
          <ArticleCard key={a.slug} a={a} level="h3" delay={i * 90} />
        ))}
      </div>
    </section>
  );
}
