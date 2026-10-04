import { Page, Kicker, Title, Closing } from "@/components/site/Page";
import { PageLd } from "@/components/site/JsonLd";
import { Photo } from "@/components/site/Photo";
import { PAGES, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { SERVICES } from "@/content/services";

const DESCRIPTION =
  "Websites, platforms and AI automation for New Zealand businesses, designed and built by one Auckland team so they work as one, and owned by you.";

export const metadata = pageMeta({
  title: "Services: websites, platforms and AI automation",
  description: DESCRIPTION,
  path: "services/",
  image: ogCard("services", "Nerodyn services: websites, platforms and AI automation."),
});

const FLOW = [
  { title: "The website brings people in", body: "It says clearly what you do, is easy to find and makes the first step simple: an enquiry, a booking, a call." },
  { title: "The platform runs the work", body: "Bookings, jobs, clients and payments move through one system your team and your clients share." },
  { title: "Automation keeps it moving", body: "Repetitive steps between them (reading, sorting, drafting, updating) happen on their own, with a person approving what matters." },
];

const EVERY = [
  { title: "Yours to keep", body: "The code, the domain, the data and every account are in your name. Nothing locks you to us." },
  { title: "Designed for your customers", body: "Every screen starts from what the people using it need to find out or do." },
  { title: "Fast and accessible", body: "Lean pages that load quickly on a phone, readable and usable by everyone who needs them." },
  { title: "Secure from the start", body: "Sensible accounts and permissions, backups and updates are part of the first version." },
  { title: "A written scope and a fixed quote", body: "You know what is included, what it costs and when it goes live before anything starts." },
  { title: "Looked after after launch", body: "Fixes, updates and improvements for as long as you want us. You decide how much." },
];

/** SERVICES: the three disciplines, how they connect, and what every project includes. */
export default function Services() {
  return (
    <Page here="services" crumbs={[{ name: "Services", href: PAGES.services }]}>
      <PageLd type="CollectionPage" href={PAGES.services} name="Services" description={DESCRIPTION} />
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
              <span className="svc-go">
                Explore {s.name.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase())} <span aria-hidden>→</span>
              </span>
            </span>
          </a>
        ))}
      </section>

      <section className="sp-block split" aria-labelledby="connect-h">
        <header className="split-head">
          <Kicker>How they connect</Kicker>
          <h2 id="connect-h" className="sp-h2" data-rv>
            Built by one team,
            <br />
            so nothing falls between them.
          </h2>
        </header>
        <ol className="flow">
          {FLOW.map((f, i) => (
            <li key={f.title} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="flow-n mono">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="item-t">{f.title}</h3>
              <p className="item-b">{f.body}</p>
            </li>
          ))}
        </ol>
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

      <Closing
        title="Not sure which you need?"
        line="Most projects start with the free audit: we look at what you have and tell you plainly what would help most."
        more={{ label: "See what it costs, and why", href: PAGES.pricing }}
      />
    </Page>
  );
}
