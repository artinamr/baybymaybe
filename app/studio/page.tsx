import { Page, Kicker, Title, Closing } from "@/components/site/Page";
import { PAGES, PRINCIPLES } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta({
  title: "Studio",
  description:
    "Nerodyn is one team of designers and engineers who plan, build and look after websites, platforms and AI automation — who we work with, how we are set up, and what we won't do.",
  path: "studio/",
});

const FOR = [
  {
    title: "Owner-led and growing businesses",
    body: "You make the decisions, you want them made well, and you would rather talk to the people doing the work than to a sales team.",
  },
  {
    title: "Teams whose systems haven't kept up",
    body: "The business has grown past its website, its spreadsheets or its inbox, and the workarounds now cost real time every week.",
  },
  {
    title: "Organisations that want AI, carefully",
    body: "You want the useful parts of AI without the risk: tested on your own work, limited to what it should do, with a person in control.",
  },
];

const SET_UP = [
  { title: "Designers and engineers, together", body: "The same people plan, design and build, so decisions are never lost in a hand-over." },
  { title: "No account managers", body: "You talk directly to the people doing the work, and you see progress as it happens." },
  { title: "No subcontractors", body: "Your project is never passed on to someone you haven't met." },
  { title: "Plain English", body: "We explain every choice in terms of your business, not our tools." },
];

const WONT = [
  "Lock you into our platform, or a licence you keep paying",
  "Sell you AI where a simpler fix would do the job",
  "Add a cost you didn't agree to in writing",
  "Hand your project to people you haven't met",
  "Promise results we can't stand behind",
];

/** STUDIO — who Nerodyn is for, how the team is set up, what it believes and what it won't do. */
export default function Studio() {
  return (
    <Page here="studio" crumbs={[{ name: "Studio", href: PAGES.studio }]}>
      <section className="sp-hero">
        <Kicker>Studio</Kicker>
        <Title lines={["One team,", "from first call to launch."]} />
        <p className="sp-lede" data-rv>
          Nerodyn designs, engineers and looks after websites, platforms and AI automation. The people you meet are the people who
          do the work — with no account managers in between, and no subcontractors.
        </p>
      </section>

      <section className="sp-block split" aria-labelledby="for-h">
        <header className="split-head">
          <Kicker>Who we work with</Kicker>
          <h2 id="for-h" className="sp-h2" data-rv>
            Businesses ready for their next step.
          </h2>
        </header>
        <ul className="items items-1">
          {FOR.map((it, i) => (
            <li key={it.title} data-rv style={{ transitionDelay: `${i * 80}ms` }}>
              <h3 className="item-t">{it.title}</h3>
              <p className="item-b">{it.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block split" aria-labelledby="setup-h">
        <header className="split-head">
          <Kicker>How we&apos;re set up</Kicker>
          <h2 id="setup-h" className="sp-h2" data-rv>
            Run by the people who build it.
          </h2>
          <p className="split-more sp-lede" data-rv>
            It keeps the work honest, and it keeps it moving.
          </p>
        </header>
        <ul className="items">
          {SET_UP.map((it, i) => (
            <li key={it.title} data-rv style={{ transitionDelay: `${(i % 2) * 90}ms` }}>
              <span className="item-n mono">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="item-t">{it.title}</h3>
              <p className="item-b">{it.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block pr" aria-labelledby="believe-h">
        <h2 id="believe-h" className="sp-h2" data-rv>
          What we believe in.
        </h2>
        <ul className="pr-grid">
          {PRINCIPLES.map((p, i) => (
            <li key={p.name} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
              <p className="pr-n mono">0{i + 1}</p>
              <p className="pr-name">{p.name}</p>
              <p className="pr-line">{p.line}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block own" aria-labelledby="wont-h">
        <div className="own-head">
          <Kicker>And what we won&apos;t do</Kicker>
          <h2 id="wont-h" className="sp-h2" data-rv>
            Five things you won&apos;t get from us.
          </h2>
        </div>
        <ul className="own-list own-list-s own-no" data-rv>
          {WONT.map((w) => (
            <li key={w}>
              <span className="own-tick" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d="M7 7l10 10M17 7L7 17" />
                </svg>
              </span>
              {w}
            </li>
          ))}
        </ul>
      </section>

      <Closing
        title="Let's see if we're a fit."
        line="Start with the free audit, or tell us what you're working on. Either way, you'll hear back within two days."
        more={{ label: "Contact us", href: PAGES.contact }}
      />
    </Page>
  );
}
