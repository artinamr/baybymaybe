import { Page, Kicker, Title, Closing } from "@/components/site/Page";
import { QaList } from "@/components/site/QaList";
import { PageLd, QaLd } from "@/components/site/JsonLd";
import { Photo } from "@/components/site/Photo";
import { Journey } from "@/components/site/Journey";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { DELIVERABLES, FAQ_ALL, PAGES, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { SERVICES, service, type Service } from "@/content/services";
import { WORK_ITEMS } from "@/content/work";
import { PUBLISHED, TOPICS } from "@/content/blog";

const DESCRIPTION =
  "Websites, platforms and AI automation for New Zealand businesses, designed and built by one Auckland team so they work as one, and owned by you.";

export const metadata = pageMeta({
  title: "Services: websites, platforms and AI automation",
  description: DESCRIPTION,
  path: "services/",
  image: ogCard("services", "Nerodyn services: websites, platforms and AI automation."),
});

const POINTS: Record<Service["slug"], string[]> = {
  websites: DELIVERABLES.websites,
  platforms: DELIVERABLES.platforms,
  "ai-automation": DELIVERABLES.ai,
};

/** "Which do you need?": what an owner notices, and the discipline that answers it. */
const CHOOSE: { if: string; to: Service["slug"] | "audit" }[] = [
  { if: "People visit, but few get in touch.", to: "websites" },
  { if: "Every change to the site waits on a developer.", to: "websites" },
  { if: "Clients keep asking where their job is up to.", to: "platforms" },
  { if: "Bookings, jobs and payments live in different places.", to: "platforms" },
  { if: "Someone spends hours sorting, copying and drafting the same things.", to: "ai-automation" },
  { if: "Enquiries arrive after hours and wait until morning.", to: "ai-automation" },
  { if: "A bit of all of it, and you’re not sure where to start.", to: "audit" },
];

const EVERY = [
  { title: "Yours to keep", body: "The code, the domain, the data and every account are in your name. Nothing locks you to us." },
  { title: "Designed for your customers", body: "Every screen starts from what the people using it need to find out or do." },
  { title: "Fast and accessible", body: "Lean pages that load quickly on a phone, readable and usable by everyone who needs them." },
  { title: "Secure from the start", body: "Sensible accounts and permissions, backups and updates are part of the first version." },
  { title: "A written scope and a fixed quote", body: "You know what is included, what it costs and when it goes live before anything starts." },
  { title: "Looked after after launch", body: "Fixes, updates and improvements for as long as you want us. You decide how much." },
];

const START = [
  {
    title: "The free audit",
    body: "We look at what you have the way your customers do. Within two days you get a short, plain write-up: what works, what is costing you enquiries, and what we would build.",
  },
  {
    title: "A written scope and a fixed quote",
    body: "What’s included and what isn’t, what we need from you, the price and the date it goes live. What is in the quote is what you pay.",
  },
  {
    title: "Design, build, launch",
    body: "You approve a prototype before it is built and try it on a review link before it launches. Most websites take about fourteen days; platforms and automation go by the dates in their quote.",
  },
  {
    title: "Looked after, as long as you want",
    body: "Fixes, updates and improvements, as much or as little as you choose. Everything stays in your name either way.",
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
 * how one enquiry passes through all three, the three working
 * demonstrations, what every project includes, how working together starts,
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
        <Title lines={["Three disciplines.", "One system."]} />
        <p className="sp-lede" data-rv>
          Most businesses need more than a website: the systems behind it, and more and more the automation that joins them up.
          We design and build all three, as one team, so they work as one.
        </p>
      </section>

      <section className="svc-cards" aria-label="The three disciplines">
        {SERVICES.map((s, i) => (
          <a key={s.slug} className="svc-card" href={PAGES.service(s.slug)} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
            <span className="svc-img">
              <Photo p={s.cardPhoto} sizes="(min-width: 900px) 30vw, 92vw" eager={i === 0} decorative />
            </span>
            <span className="svc-meta">
              <span className="svc-n mono">{s.n}</span>
              <span className="svc-name">{s.name}</span>
              <span className="svc-line">{s.line}</span>
              <span className="svc-points">
                {POINTS[s.slug].map((p) => (
                  <span key={p}>{p}</span>
                ))}
              </span>
              <span className="svc-go">
                Explore {s.name.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase())} <span aria-hidden>→</span>
              </span>
            </span>
          </a>
        ))}
      </section>

      <section className="sp-block split" aria-labelledby="choose-h">
        <header className="split-head">
          <Kicker>Which do you need?</Kicker>
          <h2 id="choose-h" className="sp-h2" data-rv>
            Start from what you’re noticing.
          </h2>
          <p className="sp-lede svc-choose-note" data-rv>
            Most businesses recognise one or two of these. Each leads to the part of the work that fixes it.
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
            The website brings people in, the platform runs the work, and automation keeps it moving, with a person approving
            what matters. Built by one team, so nothing falls between them.
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
            Three studio demonstrations.
          </h2>
          <p className="split-more" data-rv>
            <a className="text-link" href={PAGES.work}>
              All work <span aria-hidden>→</span>
            </a>
          </p>
        </header>
        <div className="svc-demo-grid">
          {WORK_ITEMS.map((p, i) => (
            <a key={p.slug} className="svc-demo" href={PAGES.project(p.slug)} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="svc-demo-img">
                {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
                <img src={p.cover} alt="" width={2400} height={1500} loading="lazy" decoding="async" />
              </span>
              <span className="svc-demo-kind">
                <b>{service(p.services[0])?.name}</b> · {p.client}, a {p.kind === "demo" ? "studio demonstration" : "client project"}
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
            What you can count on.
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
            From a first look to looked after.
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
              <span className="flow-n mono">{String(i + 1).padStart(2, "0")}</span>
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
              Plain answers, one for each.
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
        title="Not sure which you need?"
        line="Most projects start with the free audit: we look at what you have and tell you plainly what would help most."
        more={{ label: "See what it costs, and why", href: PAGES.pricing }}
      />
    </Page>
  );
}
