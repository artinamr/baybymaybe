import { notFound } from "next/navigation";
import { Page, Crumbs, Kicker, Closing } from "@/components/site/Page";
import { QaList } from "@/components/site/QaList";
import { QaLd, ServiceLd } from "@/components/site/JsonLd";
import { PAGES } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { SERVICES, service } from "@/content/services";

// Only the three disciplines exist; anything else under /services/ is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const s = service((await params).slug);
  if (!s) return {};
  return pageMeta({ title: s.name, description: s.description, path: `services/${s.slug}/` });
}

/**
 * ONE DISCIPLINE — what it is for, what you get, how we approach it, what we
 * need from you, the questions people ask, and the other two disciplines.
 */
export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = service((await params).slug);
  if (!s) notFound();
  const others = SERVICES.filter((o) => o.slug !== s.slug);
  const crumbs = [
    { name: "Services", href: PAGES.services },
    { name: s.name, href: PAGES.service(s.slug) },
  ];
  return (
    <Page here="services" crumbs={crumbs}>
      <ServiceLd name={s.name} description={s.description} href={PAGES.service(s.slug)} />
      <QaLd items={s.faq} />

      <section className="sp-hero svc-hero">
        <Crumbs crumbs={crumbs} />
        <h1 className="sp-h1" data-rv>
          {s.h1[0]}
          <br />
          <em>{s.h1[1]}</em>
        </h1>
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
      </section>

      <figure className="sp-banner svc-banner" data-rv>
        {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
        <img src={s.image} alt={s.imageAlt} width={2400} height={1100} fetchPriority="high" decoding="async" />
      </figure>

      <section className="sp-block split" aria-labelledby="signs-h">
        <header className="split-head">
          <Kicker>When it&apos;s the right call</Kicker>
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

      <section className="sp-block own" aria-labelledby="bring-h">
        <div className="own-head">
          <Kicker>What you bring</Kicker>
          <h2 id="bring-h" className="sp-h2" data-rv>
            What we&apos;ll need from you.
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

      <nav className="sp-block svc-others" aria-label="The other disciplines">
        <Kicker>Also from the same team</Kicker>
        <div className="svc-others-grid">
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
        </div>
      </nav>

      <Closing
        title="Start with what you have."
        line="Send us your website — or tell us about the work that's slowing you down. You'll get a straight answer within two days."
        more={{ label: "Or read how a project runs", href: PAGES.methodology }}
      />
    </Page>
  );
}
