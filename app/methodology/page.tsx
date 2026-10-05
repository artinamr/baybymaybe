import type { Metadata } from "next";
import { Page, Kicker } from "@/components/site/Page";
import { QaList } from "@/components/site/QaList";
import { HowToLd, PageLd, QaLd } from "@/components/site/JsonLd";
import { Photo, BANNER_SIZES } from "@/components/site/Photo";
import { StageSpy } from "@/components/site/StageSpy";
import { FAQ_ALL, PAGES, PRINCIPLES, STAGES, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { PHOTOS } from "@/content/images";

const DESCRIPTION =
  "How a Nerodyn project runs in five stages: what happens in each, what you bring, what we produce, where you decide, and what is yours at the end.";

export const metadata: Metadata = pageMeta({
  title: "Methodology: five stages from first call to launch",
  description: DESCRIPTION,
  path: "methodology/",
  image: ogCard("methodology", "How a Nerodyn project runs, in five stages."),
});

const YOURS = ["The code", "The domain", "The content, and every asset", "Every account, in your name", "Plain notes on how it all works"];

/** The three moments the client decides (from the stages: the scope is signed, the prototype approved, the review link tried). */
const DECIDE = [
  {
    stage: "Define",
    title: "You sign the scope",
    body: "The written scope, the fixed quote and the launch date. Nothing is built until you agree to it.",
  },
  {
    stage: "Design",
    title: "You approve the prototype",
    body: "Click through every page with your real words in it. Production code waits for your yes.",
  },
  {
    stage: "Build",
    title: "You try it before it launches",
    body: "The working site on its review link, on your own phone and computer. It goes live once you’ve tried it.",
  },
];

/** What to have to hand before the first call (the first stages' "you bring", in one list). */
const READY = [
  "Half an hour for the call",
  "Access to the current site, its analytics and the tools you use",
  "A few real enquiries, good and bad",
  "Your brand files, if you have them",
  "The name of the person who signs off",
  "Any dates that can’t move",
];

const GOOD = [
  {
    title: "If something changes",
    body: "Changes are normal. If you want something new along the way, we price it and tell you what it does to the date, and you decide before any work on it starts.",
  },
  {
    title: "Platforms and automation",
    body: "The same five stages. A platform is released in stages, the smallest useful version first; an automation is tried on your own past examples before it goes live. Each has its dates in the quote.",
  },
  {
    title: "After launch",
    body: "Fixes, updates and improvements, as much or as little as you want. Everything is in your name, so you can also take it elsewhere.",
  },
];

// The questions people ask about how a project runs (answers from the questions page, so they never disagree).
const QS = ["How long does it take?", "What do you need from us to start?", "Who will we be working with?", "How do payments work?"];
const QA = QS.map((q) => FAQ_ALL.flatMap((g) => g.items).find((it) => it.q === q)!).filter(Boolean);

const tick = (
  <span className="own-tick" aria-hidden>
    <svg viewBox="0 0 24 24">
      <path d="M5 12.5l4.4 4.3L19 7.5" />
    </svg>
  </span>
);

/**
 * METHODOLOGY: the fourteen days, told as an editorial. The five stages at a
 * glance; then each in turn beside a photograph that stays in view and
 * changes as you read (a rail of the five under it; on a phone each stage has
 * its own photograph); good to know (changes, platforms and automation, after
 * launch); the three moments you decide and what to have ready; the
 * principles; what is yours at the end; the questions people ask; the audit
 * form at the foot.
 */
export default function Methodology() {
  const crumbs = [{ name: "Methodology", href: PAGES.methodology }];
  return (
    <Page here="methodology" crumbs={crumbs}>
      <PageLd href={PAGES.methodology} name="Methodology" description={DESCRIPTION} image={PHOTOS["method-hero"]} />
      <HowToLd />
      <QaLd items={QA} />

      <section className="sp-hero">
        <Kicker>Methodology</Kicker>
        <h1 className="sp-h1" data-rv>
          From first call to live,
          <br />
          <em>in about fourteen days.</em>
        </h1>
        <p className="sp-lede" data-rv>
          One team takes it from the first call to the launch: designers and engineers together, with no hand-offs and no
          subcontractors. It is done in weeks, not months, and nothing is lost on the way.
        </p>
      </section>

      {/* The five stages at a glance; each opens its own section below. */}
      <nav className="ms-map" aria-label="The five stages" data-rv>
        <ol>
          {STAGES.map((s) => (
            <li key={s.n}>
              <a href={`#stage-${s.n}`}>
                <span className="ms-map-n mono">{s.n}</span>
                <span className="ms-map-t">{s.title}</span>
                <span className="ms-map-w">{s.whenShort}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <figure className="sp-banner" data-rv>
        <Photo p={PHOTOS["method-hero"]} sizes={BANNER_SIZES} eager />
      </figure>

      <section className="ms" aria-labelledby="ms-title">
        <header className="ms-head">
          <Kicker>Five stages</Kicker>
          <h2 id="ms-title" className="sp-h2" data-rv>
            The same way, every time.
          </h2>
        </header>
        <div className="mf" data-active="0">
          <StageSpy root=".mf" />
          {/* Wide screens: one photograph that stays in view, changing with the stage you are reading. */}
          <div className="mf-media" aria-hidden>
            <div className="mf-frame">
              {STAGES.map((s, i) => (
                <span key={s.n} className="mf-shot" data-i={i}>
                  <Photo p={s.photo} sizes="(min-width: 1360px) 540px, 40vw" decorative />
                </span>
              ))}
              <span className="mf-count mono">
                {STAGES.map((s, i) => (
                  <span key={s.n} data-i={i}>
                    {s.n}
                  </span>
                ))}{" "}
                / {String(STAGES.length).padStart(2, "0")}
              </span>
            </div>
            <div className="mf-rail">
              {STAGES.map((s, i) => (
                <a key={s.n} href={`#stage-${s.n}`} tabIndex={-1} data-i={i}>
                  {s.title}
                </a>
              ))}
            </div>
          </div>
          <div className="mf-steps">
            {STAGES.map((s, i) => (
              <article className="mf-stage" id={`stage-${s.n}`} data-stage={i} key={s.title} aria-labelledby={`ms-${s.n}`}>
                <figure className="ms-img mf-img" data-rv>
                  <Photo p={s.photo} sizes="92vw" />
                </figure>
                <p className="ms-day" data-rv>
                  <span className="mono">{s.n}</span>
                  <span>{s.when}</span>
                </p>
                <h3 id={`ms-${s.n}`} className="ms-title" data-rv>
                  {s.title}
                </h3>
                <p className="ms-line" data-rv>
                  {s.line}
                </p>
                <p className="ms-lede" data-rv>
                  {s.happens}
                </p>
                <div className="ms-lists" data-rv>
                  <div>
                    <p className="ms-list-h">You bring</p>
                    <ul className="ms-points">
                      {s.bring.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="ms-list-h">We produce</p>
                    <ul className="ms-points" data-produce="">
                      {s.produce.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <p className="ms-note" data-rv>
          The days are typical for a website. A platform or an automation is planned stage by stage in its own quote.
        </p>
      </section>

      <section className="sp-block split" aria-labelledby="decide-h">
        <header className="split-head">
          <Kicker>Your part</Kicker>
          <h2 id="decide-h" className="sp-h2" data-rv>
            Three moments you decide.
          </h2>
          <p className="sp-lede mf-decide-note" data-rv>
            Between them, the work is ours. You see progress as it happens and can ask anything at any point.
          </p>
        </header>
        <div className="mf-part">
          <ol className="mf-decide">
            {DECIDE.map((d, i) => (
              <li key={d.title} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="mf-decide-n mono">{String(i + 1).padStart(2, "0")}</span>
                <span className="mf-decide-s">{d.stage}</span>
                <h3 className="item-t">{d.title}</h3>
                <p className="item-b">{d.body}</p>
              </li>
            ))}
          </ol>
          <div className="mf-ready" data-rv>
            <p className="mf-ready-h">Before the first call, have these to hand</p>
            <ul>
              {READY.map((r) => (
                <li key={r}>
                  {tick}
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="sp-block split" aria-labelledby="good-h">
        <header className="split-head">
          <Kicker>Good to know</Kicker>
          <h2 id="good-h" className="sp-h2" data-rv>
            When plans meet real life.
          </h2>
        </header>
        <ul className="items items-1">
          {GOOD.map((g, i) => (
            <li key={g.title} data-rv style={{ transitionDelay: `${i * 70}ms` }}>
              <h3 className="item-t">{g.title}</h3>
              <p className="item-b">{g.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block pr" aria-label="Principles">
        <h2 className="sp-h2" data-rv>
          You work with the people who build it.
          <br />
          You keep everything.
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

      <section className="sp-block own" aria-labelledby="own-title">
        <div className="own-head">
          <Kicker>At the end</Kicker>
          <h2 id="own-title" className="sp-h2" data-rv>
            What is yours on day fourteen.
          </h2>
          <p className="sp-lede" data-rv>
            No licence to keep paying, and nothing that locks you to us. If you ever want to move it, it moves with you.
          </p>
        </div>
        <ul className="own-list" data-rv>
          {YOURS.map((y) => (
            <li key={y}>
              {tick}
              {y}
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-block split" aria-labelledby="ms-qa-h">
        <header className="split-head">
          <Kicker>Questions</Kicker>
          <h2 id="ms-qa-h" className="sp-h2" data-rv>
            About how we work.
          </h2>
          <p className="split-more" data-rv>
            <a className="text-link" href={PAGES.faq}>
              All questions <span aria-hidden>→</span>
            </a>
          </p>
        </header>
        <div data-rv>
          <QaList items={QA} id="method-qa" />
        </div>
      </section>

      <section className="sp-block sp-more" aria-label="More">
        <p className="sp-more-line" data-rv>
          Ready when you are.
        </p>
        <div className="sp-more-links" data-rv>
          <a className="text-link" href={PAGES.services}>
            See what we build <span aria-hidden>→</span>
          </a>
          <a className="text-link" href={PAGES.pricing}>
            How pricing works <span aria-hidden>→</span>
          </a>
          <a className="text-link" href="#contact">
            Or start with a free audit <span aria-hidden>↓</span>
          </a>
        </div>
      </section>
    </Page>
  );
}
