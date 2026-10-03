import { Page, Kicker, Title, Closing } from "@/components/site/Page";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { PAGES } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { PUBLISHED, TOPICS, longDate, topicLabel } from "@/content/blog";

export const metadata = pageMeta({
  title: "Blog",
  description:
    "Plain, checked answers for small and medium businesses in New Zealand about websites, platforms and AI automation — from Nerodyn.",
  path: "blog/",
  feed: true,
});

/** THE BLOG — the newest article set large, then the rest by date, filterable by topic. */
export default function Blog() {
  const [first, ...rest] = PUBLISHED;
  const card = (a: (typeof PUBLISHED)[number]) => ({
    slug: a.slug,
    href: PAGES.article(a.slug),
    title: a.title,
    description: a.description,
    topic: a.topic,
    topicLabel: topicLabel(a.topic),
    date: a.published,
    dateLabel: longDate(a.published),
    minutes: a.minutes,
  });
  return (
    <Page here="blog" crumbs={[{ name: "Blog", href: PAGES.blog }]}>
      <section className="sp-hero">
        <Kicker>Blog</Kicker>
        <Title lines={["Questions owners ask,", "answered properly."]} />
        <p className="sp-lede" data-rv>
          Longer answers to what small and medium businesses ask us about websites, platforms and AI automation — written
          plainly, with the facts checked and the sources listed, so you can decide for yourself.
        </p>
      </section>

      {first ? (
        <article className="bl-feature" data-rv>
          <a className="bl-feature-img" href={PAGES.article(first.slug)} tabIndex={-1} aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
            <img src={first.cover.src} alt="" width={2400} height={1100} decoding="async" />
          </a>
          <div className="bl-feature-text">
            <p className="bl-kind">
              <b>{topicLabel(first.topic)}</b>
              <span>
                <time dateTime={first.published}>{longDate(first.published)}</time>
              </span>
              <span>{first.minutes} min read</span>
            </p>
            <h2 className="bl-feature-title">
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
          <BlogIndex items={rest.map(card)} topics={TOPICS} />
        </section>
      ) : null}

      <Closing
        title="Rather ask about your own?"
        line="Start with the free audit — a straight answer on what you have, within two days."
        more={{ label: "See the services", href: PAGES.services }}
      />
    </Page>
  );
}
