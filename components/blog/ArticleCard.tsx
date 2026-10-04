import { Photo } from "@/components/site/Photo";
import { PAGES } from "@/lib/content";
import { longDate, topicLabel, type ArticleMeta } from "@/content/blog";

/**
 * An article as a card: its photograph, the topic, date and reading time, the
 * title and the one-line description. The whole card is the link; the title
 * is a real heading (h2 on the blog's index, h3 where a page lists a few).
 * `data-topic` is what the index's filter reads.
 */
export function ArticleCard({
  a,
  level = "h2",
  delay = 0,
  sizes = "(min-width: 1100px) 26vw, (min-width: 700px) 45vw, 92vw",
}: {
  a: ArticleMeta;
  level?: "h2" | "h3";
  delay?: number;
  sizes?: string;
}) {
  const H = level;
  return (
    <a className="bl-card" href={PAGES.article(a.slug)} data-topic={a.topic} data-rv style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      <span className="bl-card-img">
        <Photo p={a.cover} sizes={sizes} decorative />
      </span>
      <span className="bl-kind">
        <b>{topicLabel(a.topic)}</b>
        <span>
          <time dateTime={a.published}>{longDate(a.published)}</time>
        </span>
        <span>{a.minutes} min read</span>
      </span>
      <H className="bl-card-title">{a.title}</H>
      <span className="bl-card-desc">{a.description}</span>
      <span className="bl-card-go" aria-hidden>
        Read the article <span>→</span>
      </span>
    </a>
  );
}
