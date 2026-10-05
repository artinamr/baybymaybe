import { notFound } from "next/navigation";
import { Page, Crumbs, Kicker, Closing } from "@/components/site/Page";
import { QaList } from "@/components/site/QaList";
import { QaLd, ServiceLd } from "@/components/site/JsonLd";
import { Photo, BANNER_SIZES } from "@/components/site/Photo";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { Journey } from "@/components/site/Journey";
import { PAGES, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { WorkTitle } from "@/components/work/WorkTitle";
import { SERVICES, service } from "@/content/services";
import { project } from "@/content/work";
import { PUBLISHED } from "@/content/blog";

/** What the discipline is called in a sentence ("the steps a website takes care of"). */
const ROLE = { websites: "a website", platforms: "a platform", "ai-automation": "automation" } as const;

// Only the three disciplines exist; anything else under /services/ is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const s = service((await params).slug);
  if (!s) return {};
  return pageMeta({ title: s.seoTitle, description: s.description, path: `services/${s.slug}/`, image: ogCard(`services-${s.slug}`, s.photo.alt) });
}

/**
 * ONE DISCIPLINE: the title with the facts at a glance beside it (how long,
 * the first step, the price, what is yours), when it is the right call, what
 * you get, how we approach it, what decides the price, what we need from you,
 * a working demonstration, the questions people ask, what we have written
 * about it, and where it fits with the other two.
 */
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = service((await params).slug);
  if (!s) notFound();
  const others = SERVICES.filter((o) => o.slug !== s.slug);
  // What the blog says about this discipline: up to three articles, newest first.
  const reading = PUBLISHED.filter((a) => a.related.services.includes(s.slug)).slice(0, 3);
  const crumbs = [
    { name: "Services", href: PAGES.services },
    { name: s.name, href: PAGES.service(s.slug) },
  ];
  return (
    <Page here="services" crumbs={crumbs}>
      <ServiceLd name={s.name} description={s.description} href={PAGES.service(s.slug)} image={s.photo} />
      <QaLd items={s.faq} />

      <section className="sp-hero svc-hero">
        <Crumbs crumbs={crumbs} />
        <h1 className="sp-h1" data-rv>
          {s.h1[0]}
          <br />
          <em>{s.h1[1]}</em>
        </h1>
        <div className="svc-hero-row">
          <div className="svc-hero-text">
            <p className="sp-lede" data-rv>
              {s.lede}
            </p>
            <div className="closing-actions" data-rv>
              <a className="pill btn-shine" href="#contact">
                <span>Start with a free audit</span>
                <span className="pill-arrow" aria-hidden>
                  <span>→</span>
                  <span>→</span>
                </span>
              </a>
              <a className="text-link" href={PAGES.methodology}>
                How a project runs <span aria-hidden>→</span>
              </a>
            </div>
          </div>
          <dl className="svc-glance" data-rv aria-label="At a glance">
            <div>
              <dt>How long</dt>
              <dd>{s.timeline}</dd>
            </div>
            <div>
              <dt>First step</dt>
              <dd>
                <a href={PAGES.audit}>A free audit</a>, answered within two days.
              </dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>
                Fixed, from a written scope, before anything starts. <a href="#price-h">What decides it</a>
              </dd>
            </div>
            <div>
              <dt>Yours to keep</dt>
              <dd>The code, the data and every account, in your name.</dd>
            </div>
          </dl>
        </div>
      </section>

      <figure className="sp-banner svc-banner" data-rv>
        <Photo p={s.photo} sizes={BANNER_SIZES} eager />
      </figure>

      <section className="sp-block split" aria-labelledby="signs-h">
        <header className="split-head">
          <Kicker>When it’s the right call</Kicker>
          <h2 id="signs-h" className="sp-h2" data-rv>
            Sound familiar?
          </h2>
        </header>
        <ul className="items items-1">
          {s.signs.map((it, i) => (
            <li key={it.title} data-rv style={{ transitionDelay: `${i * 80}ms` }}>
              <h3 className="item-t">{it.title}</h3>
              <p className="item-b">{it.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block split" aria-labelledby="deliver-h">
        <header className="split-head">
          <Kicker>What you get</Kicker>
          <h2 id="deliver-h" className="sp-h2" data-rv>
            What we deliver.
          </h2>
        </header>
        <ul className="items">
          {s.deliver.map((it, i) => (
            <li key={it.title} data-rv style={{ transitionDelay: `${(i % 2) * 90}ms` }}>
              <span className="item-n mono">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="item-t">{it.title}</h3>
              <p className="item-b">{it.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block split" aria-labelledby="approach-h">
        <header className="split-head">
          <Kicker>How we approach it</Kicker>
          <h2 id="approach-h" className="sp-h2" data-rv>
            The way we work on it.
          </h2>
        </header>
        <ol className="flow flow-4">
          {s.approach.map((it, i) => (
            <li key={it.title} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="flow-n mono">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="item-t">{it.title}</h3>
              <p className="item-b">{it.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="sp-block split" aria-labelledby="price-h">
        <header className="split-head">
          <Kicker>What shapes the price</Kicker>
          <h2 id="price-h" className="sp-h2" data-rv>
            The size of the job, not its name.
          </h2>
          <p className="split-more" data-rv>
            <a className="text-link" href={PAGES.pricing}>
              How pricing works <span aria-hidden>→</span>
            </a>
          </p>
        </header>
        <ul className="items">
          {s.price.map((it, i) => (
            <li key={it.title} data-rv style={{ transitionDelay: `${(i % 2) * 90}ms` }}>
              <h3 className="item-t">{it.title}</h3>
              <p className="item-b">{it.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block own" aria-labelledby="bring-h">
        <div className="own-head">
          <Kicker>What you bring</Kicker>
          <h2 id="bring-h" className="sp-h2" data-rv>
            What we’ll need from you.
          </h2>
          <p className="sp-lede" data-rv>
            Not much, and we tell you exactly what and when. The rest is ours to do.
          </p>
        </div>
        <ul className="own-list own-list-s" data-rv>
          {s.bring.map((b) => (
            <li key={b}>
              <span className="own-tick" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d="M5 12.5l4.4 4.3L19 7.5" />
                </svg>
              </span>
              {b}
            </li>
          ))}
        </ul>
      </section>

      {s.work.map((slug) => project(slug)).filter(Boolean).map((p) => (
        <section key={p!.slug} className="sp-block" aria-labelledby={`work-${p!.slug}`}>
          <Kicker>See it working</Kicker>
          <a className="wk-card cs-feature" href={PAGES.project(p!.slug)} data-rv>
            <span className="wk-img">
              {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
              <img src={p!.cover} alt="" width={2400} height={1500} loading="lazy" decoding="async" />
            </span>
            <span className="wk-kind">
              <b>{p!.client}</b>
              <span>{p!.kind === "demo" ? "Studio demonstration" : "Client project"}</span>
            </span>
            <h2 id={`work-${p!.slug}`} className="wk-title">
              <WorkTitle text={p!.title} />
            </h2>
            <span className="svc-go">
              Open the case study <span aria-hidden>→</span>
            </span>
          </a>
        </section>
      ))}

      <section className="sp-block split" aria-labelledby="faq-h">
        <header className="split-head">
          <Kicker>Questions</Kicker>
          <h2 id="faq-h" className="sp-h2" data-rv>
            Straight answers.
          </h2>
          <p className="split-more" data-rv>
            <a className="text-link" href={PAGES.faq}>
              All questions <span aria-hidden>→</span>
            </a>
          </p>
        </header>
        <div data-rv>
          <QaList items={s.faq} id={`${s.slug}-qa`} />
        </div>
      </section>

      {reading.length ? (
        <section className="sp-block bl-related" aria-labelledby="read-h">
          <header className="split-head bl-related-head">
            <Kicker>From the blog</Kicker>
            <h2 id="read-h" className="sp-h2" data-rv>
              Before you decide.
            </h2>
            <p className="split-more" data-rv>
              <a className="text-link" href={PAGES.blog}>
                All articles <span aria-hidden>→</span>
              </a>
            </p>
          </header>
          <div className="bl-grid bl-grid-3">
            {reading.map((a, i) => (
              <ArticleCard key={a.slug} a={a} level="h3" delay={i * 90} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="sp-block svc-others" aria-labelledby="fits-h">
        <header className="svc-system-head">
          <Kicker>Where it fits</Kicker>
          <h2 id="fits-h" className="sp-h2" data-rv>
            One part of one system.
          </h2>
          <p className="sp-lede" data-rv>
            One enquiry, start to finish: the steps {ROLE[s.slug]} takes care of, and the parts the other two do. The same team
            builds all three.
          </p>
        </header>
        <div data-rv>
          <Journey focus={s.slug} />
        </div>
        <nav className="svc-others-grid" aria-label="The other disciplines">
          {others.map((o) => (
            <a key={o.slug} className="svc-other" href={PAGES.service(o.slug)} data-rv>
              <span className="svc-n mono">{o.n}</span>
              <span className="svc-other-name">{o.name}</span>
              <span className="svc-line">{o.line}</span>
              <span className="svc-go" aria-hidden>
                →
              </span>
            </a>
          ))}
        </nav>
      </section>

      <Closing
        title="Start with what you have."
        line="Send us your website, or tell us about the work that’s slowing you down. You’ll get a straight answer within two days."
        more={{ label: "Or read how a project runs", href: PAGES.methodology }}
      />
    </Page>
  );
}
