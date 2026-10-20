import { notFound } from "next/navigation";
import { coverSrcSet } from "@/lib/covers";
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
import { KIND_LABEL, project } from "@/content/work";
import { PUBLISHED } from "@/content/blog";
import "./crazy-service.css";

/** What the discipline is called in a sentence ("the steps a website takes care of"). */
const ROLE = { websites: "a website", platforms: "a platform", "ai-automation": "automation" } as const;
const SECTIONS = [
  { href: "#signs-h", label: "The fit" },
  { href: "#work-h", label: "The work" },
  { href: "#deliver-h", label: "What you get" },
  { href: "#spec-h", label: "The scope" },
  { href: "#runs-h", label: "The plan" },
  { href: "#price-h", label: "The cost" },
  { href: "#faq-h", label: "Questions" },
];

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
 * the work to explore, what you get, the scope in expandable groups,
 * how it runs, how it is built, what shapes the price, what we need from you,
 * after launch, the questions people ask, what we have written
 * about it, and where it fits with the other two.
 */
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = service((await params).slug);
  if (!s) notFound();
  const others = SERVICES.filter((o) => o.slug !== s.slug);
  const work = s.work.map((slug) => project(slug)!).filter(Boolean);
  // What the blog says about this discipline: up to six articles (two rows).
  // Those mainly about it come first, and among them the buying guides (an
  // article with a `situation` answers a buyer's starting point), then the
  // others that touch it; newest first within each (PUBLISHED is).
  const rank = (a: (typeof PUBLISHED)[number]) => (a.related.services[0] === s.slug ? 0 : 2) + (a.situation ? 0 : 1);
  const reading = PUBLISHED.filter((a) => a.related.services.includes(s.slug))
    .map((a, i) => ({ a, i }))
    .sort((x, y) => rank(x.a) - rank(y.a) || x.i - y.i)
    .map((x) => x.a)
    .slice(0, 6);
  const crumbs = [
    { name: "Services", href: PAGES.services },
    { name: s.name, href: PAGES.service(s.slug) },
  ];
  return (
    <Page here="services" crumbs={crumbs}>
      <ServiceLd name={s.name} description={s.description} href={PAGES.service(s.slug)} image={s.photo} />
      <QaLd items={s.faq} />

      <div className="svc-detail crazy-svc">
        <section className="sp-hero svc-hero">
          <Crumbs crumbs={crumbs} />
          <h1 className="sp-h1" data-rv>
            <span className="cz-line">
              <span>{s.h1[0]}</span>
            </span>{" "}
            <span className="cz-line">
              <span>
                <em>{s.h1[1]}</em>
              </span>
            </span>
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
                <a className="text-link" href="#work-h">
                  See the work <span aria-hidden>↓</span>
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
                  Fixed for the agreed scope. <a href="#price-h">What shapes the quote</a>
                </dd>
              </div>
              <div>
                <dt>Yours to keep</dt>
                <dd>Your code and data, with accounts in your name.</dd>
              </div>
            </dl>
          </div>
        </section>

        <nav className="svc-page-nav" aria-label="On this service page" data-rv>
          {SECTIONS.map((section) => <a key={section.href} href={section.href}>{section.label}</a>)}
        </nav>
        <figure className="svc-photo" data-rv>
          <div className="sp-banner svc-banner">
            <Photo p={s.photo} sizes={BANNER_SIZES} eager />
          </div>
          <figcaption>
            Photograph by <a href={s.photo.credit.page} target="_blank" rel="noreferrer">{s.photo.credit.author}</a>
            {" "}· {s.photo.credit.licence}
          </figcaption>
        </figure>

        <section className="sp-block split" aria-labelledby="signs-h">
          <header className="split-head">
            <Kicker>The fit</Kicker>
            <h2 id="signs-h" className="sp-h2" data-rv>
              When the work is worth doing.
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

        <section className="sp-block svc-work" aria-labelledby="work-h">
          <header className="split-head bl-related-head">
            <Kicker>See it working</Kicker>
            <h2 id="work-h" className="sp-h2" data-rv>
              {work.length > 1 ? "Explore the design and the decisions." : "Try the working demonstration."}
            </h2>
            <p className="split-more" data-rv>
              <a className="text-link" href={PAGES.work}>
                All the work <span aria-hidden>→</span>
              </a>
            </p>
          </header>
          <div className="svc-work-grid" data-n={work.length}>
            {work.map((p, i) => (
              <a key={p.slug} className="wk-card svc-work-card" href={PAGES.project(p.slug)} data-rv style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
                <span className="wk-img">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
                  <img src={p.cover} srcSet={coverSrcSet(p.cover)} sizes="(max-width: 760px) 92vw, 600px" alt="" width={2400} height={1500} loading="lazy" decoding="async" />
                </span>
                <span className="wk-kind">
                  <b>{p.client}</b>
                  <span>{KIND_LABEL[p.kind]}</span>
                </span>
                <span className="wk-title">
                  <WorkTitle text={p.title} />
                </span>
                <span className="svc-go">
                  Open the case study <span aria-hidden>→</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="sp-block split" aria-labelledby="deliver-h">
          <header className="split-head">
            <Kicker>What you get</Kicker>
            <h2 id="deliver-h" className="sp-h2" data-rv>
              Built around the job it needs to do.
            </h2>
          </header>
          <ul className="items">
            {s.deliver.map((it, i) => (
              <li key={it.title} data-rv style={{ transitionDelay: `${(i % 2) * 90}ms` }}>
                <span className="item-n mono" data-n={String(i + 1).padStart(2, "0")} aria-hidden />
                <h3 className="item-t">{it.title}</h3>
                <p className="item-b">{it.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="sp-block svc-spec" aria-labelledby="spec-h">
          <header className="svc-sec-head">
            <Kicker>The scope</Kicker>
            <h2 id="spec-h" className="sp-h2" data-rv>
              The details, before you commit.
            </h2>
            <p className="sp-lede" data-rv>
              These are the parts we plan with you. Your written scope confirms what is included, with the price and dates
              agreed before we start.
            </p>
          </header>
          <div className="svc-spec-layout">
            <div className="svc-spec-list" data-rv>
              {s.includes.map((g, i) => (
                <details key={g.group} className="svc-spec-group" open={i === 0}>
                  <summary>
                    <h3 className="svc-spec-summary">
                      <span className="svc-spec-n mono" data-n={String(i + 1).padStart(2, "0")} aria-hidden />
                      <span className="svc-spec-t">{g.group}</span>
                      <span className="svc-spec-toggle" aria-hidden>+</span>
                    </h3>
                  </summary>
                  <ul>{g.items.map((x) => <li key={x}>{x}</li>)}</ul>
                </details>
              ))}
            </div>
            <aside className="svc-spec-card svc-spec-own" data-rv>
              <p className="svc-spec-n mono">Ownership</p>
              <h3 className="svc-spec-t">The work belongs to you.</h3>
              <p className="svc-spec-own-line">Your code, content and data are yours. Hosting and service accounts are set up in your name, with ongoing fees explained in the scope.</p>
              <a className="text-link" href={PAGES.pricing}>
                How pricing works <span aria-hidden>→</span>
              </a>
            </aside>
          </div>
        </section>

        <section className="sp-block svc-runs" aria-labelledby="runs-h">
          <header className="svc-sec-head">
            <Kicker>How it runs</Kicker>
            <h2 id="runs-h" className="sp-h2" data-rv>
              {s.runs.title}
            </h2>
            <p className="sp-lede" data-rv>
              {s.runs.lede}
            </p>
          </header>
          <ol className="svc-run-line">
            {s.runs.steps.map((st, i) => (
              <li key={st.title} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="svc-run-dot" aria-hidden />
                <p className="svc-run-when mono">{st.when}</p>
                <h3 className="svc-run-t">{st.title}</h3>
                <p className="svc-run-b">{st.body}</p>
              </li>
            ))}
          </ol>
          <p className="svc-runs-more" data-rv>
            <a className="text-link" href={PAGES.methodology}>
              The whole method, stage by stage <span aria-hidden>→</span>
            </a>
          </p>
        </section>

        <section className="sp-block split" aria-labelledby="built-h">
          <header className="split-head">
            <Kicker>The build</Kicker>
            <h2 id="built-h" className="sp-h2" data-rv>
              Care beyond the first impression.
            </h2>
            <p className="sp-lede" data-rv>
              The choice of tools, the handovers and the notes matter long after launch. We build with that in mind.
            </p>
          </header>
          <ol className="flow">
            {s.built.map((it, i) => (
              <li key={it.title} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="flow-n mono" data-n={String(i + 1).padStart(2, "0")} aria-hidden />
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
              What goes into your quote.
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
              Your knowledge of the business is part of the work. We tell you what we need and when, with clear points for review and decisions.
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

        <section className="sp-block own" aria-labelledby="care-h">
          <div className="own-head">
            <Kicker>After launch</Kicker>
            <h2 id="care-h" className="sp-h2" data-rv>
              A clear plan for what comes next.
            </h2>
            <p className="sp-lede" data-rv>
              We agree the level of care your project needs, the cost and who handles each part. You can keep working with us or take the handover to another team.
            </p>
          </div>
          <ul className="own-list own-list-s" data-rv>
            {s.care.map((c) => (
              <li key={c}>
                <span className="own-tick" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12.5l4.4 4.3L19 7.5" />
                  </svg>
                </span>
                {c}
              </li>
            ))}
          </ul>
        </section>

        <section className="sp-block split" aria-labelledby="faq-h">
          <header className="split-head">
            <Kicker>Questions</Kicker>
            <h2 id="faq-h" className="sp-h2" data-rv>
              Before we start.
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
              The connections matter too.
            </h2>
            <p className="sp-lede" data-rv>
              This example follows an enquiry through the business. See where {ROLE[s.slug]} fits and where the other services
              can help. We build the connections your project needs.
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
          title="Let’s find the right starting point."
          line="Send us your website or tell us about the work that needs attention. The free audit gives you a clear recommendation within two days."
          more={{ label: "How a project runs", href: PAGES.methodology }}
        />
      </div>
    </Page>
  );
}
