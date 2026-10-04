import { Page, Kicker, Title, Closing } from "@/components/site/Page";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { BlogLd } from "@/components/site/JsonLd";
import { Photo } from "@/components/site/Photo";
import { PAGES, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { PUBLISHED, TOPICS, longDate, topicLabel } from "@/content/blog";

export const metadata = pageMeta({
  title: "Blog: websites, platforms and AI for NZ businesses",
  description:
    "Plain, checked answers for New Zealand businesses about websites, platforms and AI automation, written by the Nerodyn team with every source listed.",
  path: "blog/",
  feed: true,
  image: ogCard("blog", "The Nerodyn blog: plain, checked answers about websites, platforms and AI automation."),
});

/** THE BLOG: the newest article set large, then the rest as cards, filterable by topic. */
export default function Blog() {
  const [first, ...rest] = PUBLISHED;
  const topics = TOPICS.map((t) => ({ ...t, count: rest.filter((a) => a.topic === t.key).length }));
  // The filter's rule: the list carries the chosen topic, the other topics' cards step aside.
  const filterCss = TOPICS.map((t) => `.bl-index[data-on="${t.key}"] [data-topic]:not([data-topic="${t.key}"]){display:none}`).join("");
  return (
    <Page here="blog" crumbs={[{ name: "Blog", href: PAGES.blog }]}>
      <BlogLd articles={PUBLISHED} />
      <style>{filterCss}</style>
      <section className="sp-hero">
        <Kicker>Blog</Kicker>
        <Title lines={["Questions owners ask,", "answered properly."]} />
        <p className="sp-lede" data-rv>
          Longer answers to what small and medium businesses ask us about websites, platforms and AI automation. Written
          plainly, with the facts checked and the sources listed, so you can decide for yourself.
        </p>
      </section>

      {first ? (
        <article className="bl-feature" data-rv aria-labelledby="bl-feature-title">
          <a className="bl-feature-img" href={PAGES.article(first.slug)} tabIndex={-1} aria-hidden>
            <Photo p={first.cover} sizes="(min-width: 1000px) 58vw, 92vw" priority decorative />
          </a>
          <div className="bl-feature-text">
            <p className="bl-kind">
              <b>{topicLabel(first.topic)}</b>
              <span>
                <time dateTime={first.published}>{longDate(first.published)}</time>
              </span>
              <span>{first.minutes} min read</span>
            </p>
            <h2 className="bl-feature-title" id="bl-feature-title">
              <a href={PAGES.article(first.slug)}>{first.title}</a>
            </h2>
            <p className="bl-desc">{first.short}</p>
            <p className="bl-feature-go" aria-hidden>
              Read the article <span>→</span>
            </p>
          </div>
        </article>
      ) : null}

      {rest.length ? (
        <section className="bl-more" aria-label="More articles">
          <BlogIndex topics={topics}>
            <div className="bl-grid">
              {rest.map((a, i) => (
                <ArticleCard key={a.slug} a={a} delay={(i % 3) * 90} />
              ))}
            </div>
          </BlogIndex>
        </section>
      ) : null}

      <section className="sp-block bl-feed" aria-label="Follow the blog">
        <p className="bl-feed-line" data-rv>
          Follow new articles with the{" "}
          <a className="text-link" href={`${PAGES.blog}feed.xml`}>
            RSS feed
          </a>
          .
        </p>
      </section>

      <Closing
        title="Rather ask about your own?"
        line="Start with the free audit: a straight answer on what you have, within two days."
        more={{ label: "See the services", href: PAGES.services }}
      />
    </Page>
  );
}
