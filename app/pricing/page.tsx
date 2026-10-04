import { Page, Kicker, Title, Closing } from "@/components/site/Page";
import { QaList } from "@/components/site/QaList";
import { PageLd, QaLd } from "@/components/site/JsonLd";
import { FAQ_ALL, PAGES, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

const DESCRIPTION =
  "How Nerodyn prices a website, platform or automation: a written scope and a fixed quote before anything starts, what moves the price, and the running costs.";

export const metadata = pageMeta({
  title: "Investment: how our projects are priced",
  description: DESCRIPTION,
  path: "pricing/",
  image: ogCard("pricing", "What a Nerodyn project costs, and why."),
});

const QUOTE = [
  { title: "The free audit, or a first call", body: "We look at what you have and what you want it to do, and ask the questions that decide the size of the job." },
  { title: "A written scope", body: "What’s included, what isn’t, what we need from you, and the milestones, in plain language." },
  { title: "A fixed quote and a date", body: "The price, when each part is paid and when it goes live. What is in the quote is what you pay." },
  { title: "Changes agreed first", body: "If you want something new along the way, we price it and you decide before any work on it starts." },
];

const MOVES = [
  { title: "Pages and screens", body: "Many pages built from a few layouts cost less than pages that each need a design of their own." },
  { title: "Content", body: "Whether you supply finished words and photos, or we write, source and shape them with you." },
  { title: "Functionality", body: "Booking, payments, accounts, search and forms with logic each add design, building and testing." },
  { title: "Integrations", body: "Every system we connect to (accounting, CRM, calendar) is mapped, built and tested against real data." },
  { title: "What moves across", body: "Content, customers or records brought over from an old system, and old addresses redirected to new ones." },
  { title: "Automation scope", body: "How many steps, how many systems, and how much review each automation needs to be safe." },
];

const INCLUDED = [
  "Design and prototypes you approve",
  "Building, testing on real devices, and launch",
  "Search and analytics set up",
  "Everything handed over in your name, with plain notes",
  "Training for the people who will use it",
  "Support after launch, as set out in the quote",
];

const RUNNING = [
  { title: "Domain", body: "Renewed each year, in your name." },
  { title: "Hosting", body: "Sized to what the site or platform needs. We recommend the simplest option that fits." },
  { title: "Services you choose", body: "Booking, payment, email or CRM subscriptions, billed to you directly by their providers." },
  { title: "AI usage", body: "AI services charge for what they process. We estimate it from your real volumes and set limits and alerts." },
  { title: "Looking after it", body: "Optional, and your call how much: ongoing care, or help when you need it." },
];

const SAVE = [
  { title: "Start with the smallest useful version", body: "Launch what removes the most friction first. Add the rest once it’s earning its place." },
  { title: "Bring your content ready", body: "Finished words, photos and decisions shorten every stage after them." },
  { title: "Keep the tools that work", body: "Connecting to software you already pay for is usually cheaper than replacing it." },
  { title: "Give us one decision-maker", body: "One person who can say yes keeps the project on its date." },
];

const QA = [
  ...FAQ_ALL.find((g) => g.group === "Price and time")!.items,
  {
    q: "Can we start small and add to it later?",
    a: "Yes, and it is often the best way. We plan the first version so the next parts fit onto it, rather than needing a rebuild.",
  },
];

/** INVESTMENT — how a project is priced, without a rate card that would mislead. */
export default function Pricing() {
  return (
    <Page here="pricing" crumbs={[{ name: "Investment", href: PAGES.pricing }]}>
      <PageLd href={PAGES.pricing} name="Investment" description={DESCRIPTION} />
      <QaLd items={QA} />
      <section className="sp-hero">
        <Kicker>Investment</Kicker>
        <Title lines={["What it costs,", "and why."]} />
        <p className="sp-lede" data-rv>
          Every project is quoted from a written scope, and the price is fixed before anything starts. We don’t publish a rate
          card: two projects with the same name can differ a great deal in size, and a number without the scope behind it would only
          mislead.
        </p>
      </section>

      <section className="sp-block split" aria-labelledby="quote-h">
        <header className="split-head">
          <Kicker>How a quote comes together</Kicker>
          <h2 id="quote-h" className="sp-h2" data-rv>
            A real number, in writing.
          </h2>
        </header>
        <ol className="flow flow-4">
          {QUOTE.map((it, i) => (
            <li key={it.title} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
              <span className="flow-n mono">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="item-t">{it.title}</h3>
              <p className="item-b">{it.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="sp-block split" aria-labelledby="moves-h">
        <header className="split-head">
          <Kicker>What moves the price</Kicker>
          <h2 id="moves-h" className="sp-h2" data-rv>
            The size of the job, not its name.
          </h2>
        </header>
        <ul className="items">
          {MOVES.map((it, i) => (
            <li key={it.title} data-rv style={{ transitionDelay: `${(i % 2) * 90}ms` }}>
              <span className="item-n mono">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="item-t">{it.title}</h3>
              <p className="item-b">{it.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block own" aria-labelledby="incl-h">
        <div className="own-head">
          <Kicker>In every quote</Kicker>
          <h2 id="incl-h" className="sp-h2" data-rv>
            What the price includes.
          </h2>
          <p className="sp-lede" data-rv>
            The parts that are easy to leave out of a quote are the ones that decide whether a project lasts.
          </p>
        </div>
        <ul className="own-list own-list-s" data-rv>
          {INCLUDED.map((x) => (
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

      <section className="sp-block split" aria-labelledby="run-h">
        <header className="split-head">
          <Kicker>After launch</Kicker>
          <h2 id="run-h" className="sp-h2" data-rv>
            The running costs to plan for.
          </h2>
          <p className="split-more sp-lede" data-rv>
            Every one is listed in the quote (what it’s for, roughly what it costs and who you pay), so nothing arrives unexpectedly.
          </p>
        </header>
        <ul className="items items-1">
          {RUNNING.map((it, i) => (
            <li key={it.title} data-rv style={{ transitionDelay: `${i * 60}ms` }}>
              <h3 className="item-t">{it.title}</h3>
              <p className="item-b">{it.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block split" aria-labelledby="save-h">
        <header className="split-head">
          <Kicker>Getting the most from it</Kicker>
          <h2 id="save-h" className="sp-h2" data-rv>
            Four ways to keep the cost down.
          </h2>
        </header>
        <ul className="items">
          {SAVE.map((it, i) => (
            <li key={it.title} data-rv style={{ transitionDelay: `${(i % 2) * 90}ms` }}>
              <h3 className="item-t">{it.title}</h3>
              <p className="item-b">{it.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block split" aria-labelledby="pq-h">
        <header className="split-head">
          <Kicker>Questions</Kicker>
          <h2 id="pq-h" className="sp-h2" data-rv>
            About price and time.
          </h2>
        </header>
        <div data-rv>
          <QaList items={QA} id="price-qa" />
        </div>
      </section>

      <Closing
        title="Get a real number."
        line="Start with the free audit. You’ll have a straight answer within two days, and a written, fixed quote if you want one."
        more={{ label: "See how a project runs", href: PAGES.methodology }}
      />
    </Page>
  );
}
