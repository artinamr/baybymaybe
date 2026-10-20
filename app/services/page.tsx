import { Page, Kicker, Title, Closing } from "@/components/site/Page";
import { coverSrcSet } from "@/lib/covers";
import { QaList } from "@/components/site/QaList";
import { PageLd, QaLd } from "@/components/site/JsonLd";
import { Photo } from "@/components/site/Photo";
import { Journey } from "@/components/site/Journey";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { FAQ_ALL, PAGES, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { SERVICES, service, type Service } from "@/content/services";
import { FEATURED, KIND_LABEL, project } from "@/content/work";
import { PUBLISHED, TOPICS } from "@/content/blog";

const DESCRIPTION =
  "Website design, web platforms and AI automation from an Auckland studio. Clear thinking, distinctive design and systems built around your business.";

export const metadata = pageMeta({
  title: "Services: websites, platforms and AI automation",
  description: DESCRIPTION,
  path: "services/",
  image: ogCard("services", "Nerodyn services: websites, platforms and AI automation."),
});

const POINTS: Record<Service["slug"], string[]> = {
  websites: ["Business and service websites", "Content your team can update", "Enquiries, bookings and payments"],
  platforms: ["Client portals and job tracking", "Bookings, approvals and accounts", "Connections between your systems"],
  "ai-automation": ["Website and enquiry assistants", "Inbox and document tasks", "Drafts, review and recorded actions"],
};

/** Small, plainly labelled examples of the work beside the photographs. */
function ServiceSpecimen({ slug }: { slug: Service["slug"] }) {
  if (slug === "websites") {
    return (
      <span className="svc-example svc-example-web">
        <span className="svc-example-label">Illustrative enquiry form</span>
        <span className="svc-example-title">Tell us what you’re planning.</span>
        <span className="svc-example-fields"><span>Your name</span><span>How can we help?</span></span>
        <span className="svc-example-action">Send enquiry <span aria-hidden>↗</span></span>
      </span>
    );
  }
  if (slug === "platforms") {
    return (
      <span className="svc-example svc-example-platform">
        <span className="svc-example-label">Illustrative client portal</span>
        <span className="svc-example-title">Your project, at a glance.</span>
        <span className="svc-example-status">Ready for your review <span aria-hidden>↗</span></span>
        <span className="svc-example-tabs"><span>Progress</span><span>Files</span><span>Approvals</span></span>
      </span>
    );
  }
  return (
    <span className="svc-example svc-example-ai">
      <span className="svc-example-label">Illustrative enquiry assistant</span>
      <span className="svc-example-title">A draft, ready to review.</span>
      <span className="svc-example-draft"><span /><span /><span /></span>
      <span className="svc-example-review"><span className="svc-example-dot" aria-hidden />Waiting for a person’s approval</span>
    </span>
  );
}

/** "Which do you need?": what an owner notices, and the discipline that answers it. */
const CHOOSE: { if: string; to: Service["slug"] | "audit" }[] = [
  { if: "The website doesn’t show the business at its best.", to: "websites" },
  { if: "Every change to the site waits on a developer.", to: "websites" },
  { if: "Clients keep asking where their job is up to.", to: "platforms" },
  { if: "Bookings, jobs and payments live in different places.", to: "platforms" },
  { if: "Someone spends hours sorting, copying and drafting the same things.", to: "ai-automation" },
  { if: "Useful information is buried in emails and documents.", to: "ai-automation" },
  { if: "A bit of all of it, and you’re not sure where to start.", to: "audit" },
];

const EVERY = [
  { title: "Ownership from the start", body: "Your code, content and data belong to you. We set up the domain, hosting and service accounts in your name." },
  { title: "Designed for your customers", body: "Every screen starts from what the people using it need to find out or do." },
  { title: "Care in the small details", body: "We check speed on a slow connection, keyboard use and form labels, alongside the layout and wording." },
  { title: "Secure from the start", body: "Sensible accounts and permissions, backups and updates are part of the first version." },
  { title: "A written scope and a fixed quote", body: "You know what is included, what it costs and when it goes live before anything starts." },
  { title: "A proper handover", body: "Your team gets training, documentation and a clear support arrangement. You can keep working with us or take it from there." },
];

const START = [
  {
    title: "The free audit",
    body: "We look at your site or the process you want to improve. Within two days, you get a short write-up of what is working, where the problems are and what we would tackle first.",
  },
  {
    title: "A written scope and a fixed quote",
    body: "The work, price, dates and anything we need from you, agreed before we start. Changes are discussed and priced before we make them.",
  },
  {
    title: "Design, build, launch",
    body: "Review the direction before we build, then try the finished work before launch. Websites, platforms and automation each have a programme suited to their scope.",
  },
  {
    title: "Handover and care",
    body: "We show your team how it works and agree what happens after launch. Ongoing support is a choice, with the work and cost made clear.",
  },
];

const QS = [
  "What does it cost?",
  "How long does it take?",
  "Can you work with the tools we already use?",
  "Can you take over our existing website?",
  "Who owns the website and the code?",
  "What happens after launch?",
];
const QA = QS.map((q) => FAQ_ALL.flatMap((g) => g.items).find((it) => it.q === q)!).filter(Boolean);

/**
 * SERVICES: the three disciplines (what each delivers), which one you need,
 * how one enquiry passes through all three, one piece of work for each to
 * try (FEATURED), what every project includes, how working together starts,
 * the questions people ask, and the blog's answers, one per discipline.
 */
export default function Services() {
  const reading = TOPICS.map((t) => PUBLISHED.find((a) => a.topic === t.key)).filter((a) => a !== undefined);
  return (
    <Page here="services" crumbs={[{ name: "Services", href: PAGES.services }]}>
      <PageLd type="CollectionPage" href={PAGES.services} name="Services" description={DESCRIPTION} />
      <QaLd items={QA} />
      <section className="sp-hero">
        <Kicker>Services</Kicker>
        <Title lines={["Better websites.", "Better ways to work."]} />
        <p className="sp-lede" data-rv>
          We design websites, build the systems behind them and automate the work that slows your team down.
          One Auckland studio, from the first conversation through to the details of the build.
        </p>
      </section>

      <section className="svc-cards svc-catalogue" aria-label="Our services">
        {SERVICES.map((s, i) => (
          <a key={s.slug} className="svc-card" href={PAGES.service(s.slug)} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
            <span className="svc-img">
              <Photo p={s.cardPhoto} sizes="(min-width: 1360px) 620px, (min-width: 900px) 46vw, 92vw" eager={i === 0} decorative />
            </span>
            <div className="svc-meta">
              <span className="svc-n mono">Service {s.n}</span>
              <h2 className="svc-name">{s.name}</h2>
              <span className="svc-line">{s.line}</span>
              <span className="svc-points">
                {POINTS[s.slug].map((p) => (
                  <span key={p}>{p}</span>
                ))}
              </span>
              <ServiceSpecimen slug={s.slug} />
              <span className="svc-go">
                Explore {s.name.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase())} <span aria-hidden>→</span>
              </span>
            </div>
          </a>
        ))}
      </section>

      <section className="sp-block split" aria-labelledby="choose-h">
        <header className="split-head">
          <Kicker>Which do you need?</Kicker>
          <h2 id="choose-h" className="sp-h2" data-rv>
            Start with the problem.
          </h2>
          <p className="sp-lede svc-choose-note" data-rv>
            You don’t need to choose a technical approach before talking to us. Start with the part of the business you want to improve.
          </p>
        </header>
        <ul className="svc-choose">
          {CHOOSE.map((c, i) => {
            const s = c.to === "audit" ? null : service(c.to)!;
            return (
              <li key={c.if} data-rv style={{ transitionDelay: `${(i % 4) * 60}ms` }}>
                <a href={s ? PAGES.service(s.slug) : PAGES.audit} data-audit={s ? undefined : ""}>
                  <span className="svc-choose-if">{c.if}</span>
                  <span className="svc-choose-to">
                    {s ? s.name : "Start with the free audit"} <span aria-hidden>→</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="sp-block svc-system" aria-labelledby="connect-h">
        <header className="svc-system-head">
          <Kicker>How they connect</Kicker>
          <h2 id="connect-h" className="sp-h2" data-rv>
            One enquiry, start to finish.
          </h2>
          <p className="sp-lede" data-rv>
            A customer finds you, gets in touch and becomes a job for the team. This example shows where a website,
            a platform and automation can help. We connect the parts your business needs.
          </p>
        </header>
        <div data-rv>
          <Journey />
        </div>
      </section>

      <section className="sp-block svc-demos" aria-labelledby="demos-h">
        <header className="split-head bl-related-head">
          <Kicker>See them working</Kicker>
          <h2 id="demos-h" className="sp-h2" data-rv>
            Explore the work yourself.
          </h2>
          <p className="split-more" data-rv>
            <a className="text-link" href={PAGES.work}>
              All work <span aria-hidden>→</span>
            </a>
          </p>
        </header>
        <div className="svc-demo-grid">
          {SERVICES.map((s) => project(FEATURED[s.slug])!).map((p, i) => (
            <a key={p.slug} className="svc-demo" href={PAGES.project(p.slug)} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="svc-demo-img">
                {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
                <img src={p.cover} srcSet={coverSrcSet(p.cover)} sizes="(max-width: 760px) 92vw, 600px" alt="" width={2400} height={1500} loading="lazy" decoding="async" />
              </span>
              <span className="svc-demo-kind">
                <b>{service(p.services[0])?.name}</b> · {p.client}, a {KIND_LABEL[p.kind].toLowerCase()}
              </span>
              <span className="svc-demo-t">{p.title}</span>
              <span className="svc-go">
                Try it <span aria-hidden>→</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="sp-block split" aria-labelledby="every-h">
        <header className="split-head">
          <Kicker>In every project</Kicker>
          <h2 id="every-h" className="sp-h2" data-rv>
            The standard we work to.
          </h2>
        </header>
        <ul className="items">
          {EVERY.map((e, i) => (
            <li key={e.title} data-rv style={{ transitionDelay: `${(i % 2) * 90}ms` }}>
              <h3 className="item-t">{e.title}</h3>
              <p className="item-b">{e.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block split" aria-labelledby="start-h">
        <header className="split-head">
          <Kicker>How it starts</Kicker>
          <h2 id="start-h" className="sp-h2" data-rv>
            Clear at every stage.
          </h2>
          <p className="split-more svc-start-links" data-rv>
            <a className="text-link" href={PAGES.methodology}>
              How a project runs <span aria-hidden>→</span>
            </a>
            <a className="text-link" href={PAGES.pricing}>
              How pricing works <span aria-hidden>→</span>
            </a>
          </p>
        </header>
        <ol className="flow flow-4">
          {START.map((it, i) => (
            <li key={it.title} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="flow-n mono" data-n={String(i + 1).padStart(2, "0")} aria-hidden />
              <h3 className="item-t">{it.title}</h3>
              <p className="item-b">{it.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="sp-block split" aria-labelledby="svc-qa-h">
        <header className="split-head">
          <Kicker>Questions</Kicker>
          <h2 id="svc-qa-h" className="sp-h2" data-rv>
            Before the first call.
          </h2>
          <p className="split-more" data-rv>
            <a className="text-link" href={PAGES.faq}>
              All questions <span aria-hidden>→</span>
            </a>
          </p>
        </header>
        <div data-rv>
          <QaList items={QA} id="services-qa" />
        </div>
      </section>

      {reading.length ? (
        <section className="sp-block bl-related" aria-labelledby="read-h">
          <header className="split-head bl-related-head">
            <Kicker>From the blog</Kicker>
            <h2 id="read-h" className="sp-h2" data-rv>
              Read before you decide.
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

      <Closing
        title="Let’s look at what would help."
        line="Send us your website or tell us about a process that needs work. We’ll give you a clear starting point in the free audit."
        more={{ label: "How pricing works", href: PAGES.pricing }}
      />
    </Page>
  );
}
