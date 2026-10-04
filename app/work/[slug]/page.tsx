import { notFound } from "next/navigation";
import { Page, Crumbs, Kicker, Closing } from "@/components/site/Page";
import { Stage, Story } from "@/components/work/Stories";
import { WorkTitle } from "@/components/work/WorkTitle";
import { PAGES } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { WORK_ITEMS, project } from "@/content/work";
import { service } from "@/content/services";

// Only the projects in the registry exist; anything else under /work/ is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return WORK_ITEMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = project((await params).slug);
  if (!p) return {};
  return pageMeta({
    title: `${p.client}: ${p.kind === "demo" ? "studio demonstration" : "case study"}`,
    description: p.summary,
    path: `work/${p.slug}/`,
    image: { url: `work/${p.slug}.webp`, width: 2400, height: 1500, alt: p.coverAlt },
  });
}

/**
 * A CASE STUDY — the opening and the working thing itself, the context, the
 * scope, the decisions, the visual story, what it shows (and, for a
 * demonstration, what it doesn't), and the way on.
 */
export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const p = project((await params).slug);
  if (!p) notFound();
  const i = WORK_ITEMS.indexOf(p);
  const next = WORK_ITEMS[(i + 1) % WORK_ITEMS.length];
  const svcs = p.services.map((sl) => service(sl)!).filter(Boolean);
  const crumbs = [
    { name: "Work", href: PAGES.work },
    { name: p.client, href: PAGES.project(p.slug) },
  ];
  return (
    <Page here="work" crumbs={crumbs}>
      <section className="sp-hero cs-hero">
        <Crumbs crumbs={crumbs} />
        <p className="cs-label" data-rv>
          {p.kind === "demo" ? `Studio demonstration · ${p.client} is fictional` : "Client project"}
        </p>
        <h1 className="sp-h1" data-rv>
          <WorkTitle text={p.title} />
        </h1>
        <p className="sp-lede" data-rv>
          {p.summary}
        </p>
        <ul className="cs-meta" data-rv>
          <li>
            <span>Services</span>
            {svcs.map((sv) => (
              <a key={sv.slug} href={PAGES.service(sv.slug)}>
                {sv.name}
              </a>
            ))}
          </li>
          <li>
            <span>Type</span>
            {p.kind === "demo" ? "A working demonstration" : "Client project"}
          </li>
          <li>
            <span>Year</span>
            {p.year}
          </li>
        </ul>
      </section>

      <section className="cs-stage" aria-label="The working demonstration" data-rv>
        <Stage p={p} />
        <p className="cs-note">This is the working thing, not a picture of it. Click around: it runs on this page and sends nothing.</p>
        <p className="cs-note cs-touch-hint">Scroll inside the frame to see more.</p>
      </section>

      <section className="sp-block split" aria-labelledby="ctx-h">
        <header className="split-head">
          <Kicker>The situation</Kicker>
          <h2 id="ctx-h" className="sp-h2" data-rv>
            {p.kind === "demo" ? "The brief we set ourselves." : "The brief."}
          </h2>
        </header>
        <div>
          <p className="sp-lede" data-rv>
            {p.context.lede}
          </p>
          <p className="item-b" data-rv style={{ marginTop: 22 }}>
            <b>Who it’s for:</b> {p.context.audience}
          </p>
        </div>
      </section>

      <section className="sp-block own" aria-labelledby="scope-h">
        <div className="own-head">
          <Kicker>Scope</Kicker>
          <h2 id="scope-h" className="sp-h2" data-rv>
            What the project covers.
          </h2>
          <p className="sp-lede" data-rv>
            {p.kind === "demo"
              ? "The proposed scope for a live version. The demonstration shown here covers the key screens and interactions."
              : "Designed, built and looked after by one team, so the parts fit together."}
          </p>
        </div>
        <ul className="own-list own-list-s" data-rv>
          {p.scope.map((x) => (
            <li key={x}>
              <span className="own-tick" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d="M5 12.5l4.4 4.3L19 7.5" />
                </svg>
              </span>
              {x}
            </li>
          ))}
        </ul>
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

      <section className="sp-block" aria-labelledby="story-h">
        <Kicker>In detail</Kicker>
        <h2 id="story-h" className="sp-h2" data-rv style={{ marginBottom: "calc(var(--vh) * 6)" }}>
          Up close.
        </h2>
        <Story p={p} />
      </section>

      <section className="sp-block cs-out" aria-label="What it shows">
        <div data-rv>
          <h3>What it demonstrates</h3>
          <ul>
            {p.demonstrates.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="cs-limits" data-rv>
          <h3>{p.kind === "demo" ? "What it doesn’t" : "Results"}</h3>
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
        title="Want something like this?"
        line="Tell us what you have and what’s slowing you down. You’ll get a straight answer within two days."
        more={{ label: "Or see all the work", href: PAGES.work }}
      />
    </Page>
  );
}
