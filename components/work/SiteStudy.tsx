import { Crumbs, Kicker, Closing, type Crumb } from "@/components/site/Page";
import { LiveSite } from "./LiveSite";
import { PAGES } from "@/lib/content";
import { WORK_ITEMS, type Project, type Shot } from "@/content/work";
import { service } from "@/content/services";

const NUM = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen"];

const tick = (
  <span className="own-tick" aria-hidden>
    <svg viewBox="0 0 24 24">
      <path d="M5 12.5l4.4 4.3L19 7.5" />
    </svg>
  </span>
);

/** A picture of the site: the half-size copy for narrow screens. */
function Pic({ s, sizes, className }: { s: Shot; sizes: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain
    <img
      className={className}
      src={s.src}
      srcSet={s.half ? `${s.half} 1000w, ${s.src} ${s.w}w` : undefined}
      sizes={sizes}
      alt={s.alt}
      width={s.w}
      height={s.h}
      loading="lazy"
      decoding="async"
    />
  );
}

/**
 * A CONCEPT WEBSITE'S CASE STUDY (/work/[slug] for `kind: "site"`): the site
 * itself, live in its frame; the brief and what the site had to do; every
 * page; the decisions; the parts that do a job, in use; the phone; the look;
 * what was measured; what was built; what is real and what is not; the way on.
 */
export function SiteStudy({ p, crumbs }: { p: Project; crumbs: Crumb[] }) {
  const s = p.site!;
  const i = WORK_ITEMS.indexOf(p);
  const next = WORK_ITEMS[(i + 1) % WORK_ITEMS.length];
  const svcs = p.services.map((sl) => service(sl)!).filter(Boolean);
  const live = (path: string) => `${s.live}${path}`;
  return (
    <>
      <section className="sp-hero cs-hero ss-hero">
        <Crumbs crumbs={crumbs} />
        <p className="cs-label" data-rv>
          Concept website · {p.client} is fictional
        </p>
        <h1 className="sp-h1" data-rv>
          {p.title}
        </h1>
        <div className="ss-hero-row">
          <p className="sp-lede" data-rv>
            {p.summary}
          </p>
          <div className="closing-actions ss-hero-actions" data-rv>
            <a className="pill btn-shine" href={s.live} target="_blank" rel="noopener">
              <span>Visit the site</span>
              <span className="pill-arrow" aria-hidden>
                <span>↗</span>
                <span>↗</span>
              </span>
            </a>
            <a className="text-link" href="#brief-h">
              How it was built <span aria-hidden>↓</span>
            </a>
          </div>
        </div>
        <ul className="cs-meta" data-rv>
          <li>
            <span>The business</span>
            {s.sector}
          </li>
          <li>
            <span>Where</span>
            {s.place}
          </li>
          <li>
            <span>Service</span>
            {svcs.map((sv) => (
              <a key={sv.slug} href={PAGES.service(sv.slug)}>
                {sv.name}
              </a>
            ))}
          </li>
          <li>
            <span>Pages</span>
            {s.pageCount}
          </li>
          <li>
            <span>Year</span>
            {p.year}
          </li>
        </ul>
      </section>

      <section className="cs-stage ss-stage" aria-label="The website" data-rv>
        <LiveSite live={s.live} domain={p.url} name={p.client} poster={s.home} phone={s.phones[0]} />
        <p className="cs-note">
          The real site, not a picture of it: try it here, or{" "}
          <a href={s.live} target="_blank" rel="noopener">
            open it in its own tab
          </a>
          . Nothing you type is sent anywhere.
        </p>
      </section>

      <section className="sp-block split" aria-labelledby="brief-h">
        <header className="split-head">
          <Kicker>The brief</Kicker>
          <h2 id="brief-h" className="sp-h2" data-rv>
            The brief we set ourselves.
          </h2>
        </header>
        <div>
          <p className="sp-lede" data-rv>
            {p.context.lede}
          </p>
          <p className="item-b ss-who" data-rv>
            <b>Who it’s for:</b> {p.context.audience}
          </p>
          <div className="ss-jobs" data-rv>
            <p className="ss-jobs-h">The site had to</p>
            <ol>
              {s.jobs.map((j, n) => (
                <li key={j}>
                  <span className="mono">{String(n + 1).padStart(2, "0")}</span>
                  {j}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="sp-block ss-pages" aria-labelledby="pages-h">
        <header className="ss-head">
          <Kicker>Every page</Kicker>
          <h2 id="pages-h" className="sp-h2" data-rv>
            {NUM[s.pageCount] ?? s.pageCount} pages, one system.
          </h2>
          <p className="sp-lede" data-rv>
            Each page has one job. They share a handful of parts, so the site reads as one place and grows without
            redesigning.
          </p>
        </header>
        <ul className="ss-page-grid">
          {s.pages.map((pg, n) => (
            <li key={pg.path} data-rv style={{ transitionDelay: `${(n % 3) * 70}ms` }}>
              <a href={live(pg.path)} target="_blank" rel="noopener" className="ss-page">
                <span className="ss-page-img">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
                  <img src={pg.shot} alt="" width={1200} height={750} loading="lazy" decoding="async" />
                </span>
                <span className="ss-page-name">
                  {pg.name}
                  <span className="sr-only"> (opens the page in a new tab)</span> <span aria-hidden>↗</span>
                </span>
                <span className="ss-page-what">{pg.what}</span>
              </a>
            </li>
          ))}
        </ul>
        {s.pageCount > s.pages.length ? (
          <p className="ss-more-pages" data-rv>
            And {s.pageCount - s.pages.length} more on the site itself.
          </p>
        ) : null}
      </section>

      <section className="sp-block split" aria-labelledby="approach-h">
        <header className="split-head">
          <Kicker>Approach</Kicker>
          <h2 id="approach-h" className="sp-h2" data-rv>
            The decisions that matter.
          </h2>
        </header>
        <ol className="flow">
          {p.approach.map((it, n) => (
            <li key={it.title} data-rv style={{ transitionDelay: `${n * 90}ms` }}>
              <span className="flow-n mono">{String(n + 1).padStart(2, "0")}</span>
              <h3 className="item-t">{it.title}</h3>
              <p className="item-b">{it.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="sp-block ss-features" aria-labelledby="features-h">
        <header className="ss-head">
          <Kicker>Up close</Kicker>
          <h2 id="features-h" className="sp-h2" data-rv>
            The parts that do a job.
          </h2>
          <p className="sp-lede" data-rv>
            Nothing here is decoration. Each part answers a question a customer has, or saves the business a reply.
          </p>
        </header>
        {s.features.map((f, n) => (
          <article key={f.title} className="ss-feature" data-flip={n % 2 ? "" : undefined} data-tall={f.tall ? "" : undefined} data-multi={f.shots.length > 1 ? "" : undefined} aria-labelledby={`feat-${n}`}>
            <div className={f.shots.length > 1 ? "ss-shots" : "ss-shot-one"} data-rv>
              {f.shots.map((sh) => (
                <figure key={sh.src} className="ss-shot">
                  <Pic s={sh} sizes={f.shots.length > 1 ? "(min-width: 900px) 30vw, 92vw" : f.tall ? "(min-width: 900px) 38vw, 92vw" : "(min-width: 900px) 58vw, 92vw"} />
                  {sh.label ? <figcaption className="mono">{sh.label}</figcaption> : null}
                </figure>
              ))}
            </div>
            <div className="ss-feature-text" data-rv>
              <p className="ss-feature-n mono">{String(n + 1).padStart(2, "0")}</p>
              <h3 id={`feat-${n}`} className="ss-feature-t">
                {f.title}
              </h3>
              <p className="item-b">{f.body}</p>
              <ul className="ss-notes">
                {f.notes.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <a className="text-link" href={live(f.path)} target="_blank" rel="noopener">
                Try it on the site <span aria-hidden>↗</span>
              </a>
            </div>
          </article>
        ))}
      </section>

      <section className="sp-block ss-phones" aria-labelledby="phones-h">
        <header className="ss-head">
          <Kicker>On a phone</Kicker>
          <h2 id="phones-h" className="sp-h2" data-rv>
            Designed for the phone first.
          </h2>
          <p className="sp-lede" data-rv>
            Most visitors arrive on a phone, so every page was laid out for one before it was widened for a desk.
          </p>
        </header>
        <div className="ss-phone-row" tabIndex={0} aria-label="Phone views of the site">
          {s.phones.map((ph, n) => (
            <figure key={ph.src} className="ss-phone-fig" data-rv style={{ transitionDelay: `${n * 90}ms` }}>
              <span className="ss-phone">
                <Pic s={ph} sizes="(min-width: 900px) 300px, 70vw" />
              </span>
              <figcaption className="cs-cap">
                <b>{String(n + 1).padStart(2, "0")}</b>
                <span>{ph.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="sp-block ss-look" aria-labelledby="look-h">
        <header className="ss-head">
          <Kicker>The look</Kicker>
          <h2 id="look-h" className="sp-h2" data-rv>
            An identity of its own.
          </h2>
        </header>
        <ul className="ss-swatches" data-rv>
          {s.palette.map((c) => (
            <li key={c.hex}>
              <span className="ss-chip" style={{ background: c.hex }} aria-hidden />
              <span className="ss-sw-name">{c.name}</span>
              <span className="ss-sw-hex mono">{c.hex}</span>
              <span className="ss-sw-role">{c.role}</span>
            </li>
          ))}
        </ul>
        <ul className="ss-type" data-rv>
          {s.type.map((t) => (
            <li key={t.name}>
              <span className="ss-type-name">{t.name}</span>
              <span className="ss-type-role">{t.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block ss-built" aria-labelledby="built-h">
        <header className="ss-head">
          <Kicker>Built properly</Kicker>
          <h2 id="built-h" className="sp-h2" data-rv>
            Measured, not claimed.
          </h2>
          <p className="sp-lede" data-rv>
            Measured on the copy you can try above, on 6 October 2026: a first visit on a desktop, sizes as they travel
            over the network.
          </p>
        </header>
        <dl className="ss-facts">
          {s.facts.map((f, n) => (
            <div key={f.label} data-rv style={{ transitionDelay: `${n * 80}ms` }}>
              <dt className="ss-fact-v">{f.value}</dt>
              <dd className="ss-fact-l">{f.label}</dd>
            </div>
          ))}
        </dl>
        <ul className="own-list own-list-s ss-craft" data-rv>
          {s.craft.map((c) => (
            <li key={c}>
              {tick}
              {c}
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block own" aria-labelledby="scope-h">
        <div className="own-head">
          <Kicker>Scope</Kicker>
          <h2 id="scope-h" className="sp-h2" data-rv>
            What we built.
          </h2>
          <p className="sp-lede" data-rv>
            Designed, written and engineered by one team, from a blank page. Most websites like this go live in about
            fourteen days; the quote gives the date.
          </p>
        </div>
        <ul className="own-list own-list-s" data-rv>
          {p.scope.map((x) => (
            <li key={x}>
              {tick}
              {x}
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block cs-out" aria-label="What it shows">
        <div data-rv>
          <h3>What it shows</h3>
          <ul>
            {p.demonstrates.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="cs-limits" data-rv>
          <h3>What’s real, and what isn’t</h3>
          <ul>
            {p.limits.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </section>

      <nav className="sp-block svc-others" aria-label="More">
        <Kicker>Keep going</Kicker>
        <div className="cs-next">
          <a className="svc-other" href={PAGES.project(next.slug)} data-rv>
            <span className="svc-n mono">Next project</span>
            <span className="svc-other-name">{next.client}</span>
            <span className="svc-line">{next.title}</span>
            <span className="svc-go" aria-hidden>
              →
            </span>
          </a>
          {svcs.map((sv) => (
            <a key={sv.slug} className="svc-other" href={PAGES.service(sv.slug)} data-rv>
              <span className="svc-n mono">The service</span>
              <span className="svc-other-name">{sv.name}</span>
              <span className="svc-line">{sv.line}</span>
              <span className="svc-go" aria-hidden>
                →
              </span>
            </a>
          ))}
        </div>
      </nav>

      <Closing
        title="Want a site like this?"
        line="Send us the one you have, or tell us about the business. You’ll get a straight answer within two days."
        more={{ label: "Or see all the work", href: PAGES.work }}
      />
    </>
  );
}

