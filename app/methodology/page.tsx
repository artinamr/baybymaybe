import type { Metadata } from "next";
import { Page, Kicker } from "@/components/site/Page";
import { QaList } from "@/components/site/QaList";
import { HowToLd, PageLd, QaLd } from "@/components/site/JsonLd";
import { Photo, BANNER_SIZES } from "@/components/site/Photo";
import { StageSpy } from "@/components/site/StageSpy";
import { Plan } from "./Plan";
import { Artefact } from "./Artefact";
import { FAQ_ALL, PAGES, ogCard } from "@/lib/content";
import { METHOD_PRINCIPLES as PRINCIPLES, METHOD_STAGES as STAGES } from "./stages";
import { pageMeta } from "@/lib/meta";
import { PHOTOS } from "@/content/images";
// Its own stylesheet: the stages, the sticky photograph, your part. No other page loads it.
import "./methodology.css";
// crazy-r29 "living paper": scroll-driven reveals, the stacked decisions, the pointer's light.
import "./crazy-methodology.css";
import { PointerGlow } from "./PointerGlow";

const DESCRIPTION =
  "How we take a project from first conversation to launch: five clear stages, useful deliverables and your decisions at the right points.";

export const metadata: Metadata = pageMeta({
  title: "Methodology: five stages from first call to launch",
  description: DESCRIPTION,
  path: "methodology/",
  image: ogCard("methodology", "How a Nerodyn project runs, in five stages."),
});

const YOURS = ["The project code", "Your domain and hosting accounts", "Your content and project assets", "Access to the tools we set up", "Training and written handover notes"];

/** The three moments the client decides (from the stages: the scope is signed, the prototype approved, the review link tried). */
const DECIDE = [
  {
    stage: "Define",
    title: "You sign the scope",
    body: "Review what’s included, what it costs and when it launches. We start once you approve the written scope.",
  },
  {
    stage: "Design",
    title: "You approve the prototype",
    body: "Try the main tasks with your own content. We resolve your feedback before building the approved design.",
  },
  {
    stage: "Build",
    title: "You try it before it launches",
    body: "Use the private review link on your own devices. Your team checks the work and gives the go-ahead to launch.",
  },
];

/** What to have to hand before the first call (the first stages' "you bring", in one list). */
const READY = [
  "Half an hour for the call",
  "Your website address and the tools you use",
  "A few real enquiries or examples of the problem",
  "Your brand files, if you have them",
  "The name of the person who signs off",
  "Any dates that can’t move",
];

const GOOD = [
  {
    title: "If something changes",
    body: "If the brief changes, we explain the effect on the price and timing. You approve the change in writing before we do the extra work.",
  },
  {
    title: "Platforms and automation",
    body: "The same five stages, with a timetable suited to the work. We plan the smallest useful platform release first and test automation against real examples. The scope sets out the dates and checks for your project.",
  },
  {
    title: "After launch",
    body: "We agree the support you need, including updates and future improvements. The handover gives you the access and information to keep working with us or choose another team.",
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
      <HowToLd stages={STAGES} />
      <QaLd items={QA} />
      <PointerGlow sel=".ma, .mf-decide li" />

      <section className="sp-hero">
        <Kicker>Methodology</Kicker>
        <h1 className="sp-h1" data-rv>
          <span className="cz-l">
            <span>Good work starts</span>
          </span>{" "}
          <span className="cz-l">
            <span>
              <em>with a clear plan.</em>
            </span>
          </span>
        </h1>
        <p className="sp-lede" data-rv>
          You work directly with the Auckland team designing and building your project. We agree the scope, show you the
          design and give you a working version to try. You know what comes next and where we need your decision.
        </p>
        <div className="mf-intro" data-rv>
          <p><span className="mono">01 to 05</span> Five stages, with a clear deliverable at each.</p>
          <a className="text-link" href="#mp-h">See the project plan <span aria-hidden>↓</span></a>
        </div>
      </section>

      {/* The fourteen days as a plan; each stage opens its own section below. */}
      <Plan />

      <figure className="sp-banner" data-rv>
        <Photo p={PHOTOS["method-hero"]} sizes={BANNER_SIZES} eager />
      </figure>

      <section className="ms" aria-labelledby="ms-title">
        <header className="ms-head">
          <Kicker>Five stages</Kicker>
          <h2 id="ms-title" className="sp-h2" data-rv>
            From a first look to a finished build.
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
                <Artefact i={i} />
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
            Your decisions, at the right points.
          </h2>
          <p className="sp-lede mf-decide-note" data-rv>
            We handle the day-to-day work and keep you informed. These approvals give you a proper chance to review it
            before the next stage begins.
          </p>
        </header>
        <div className="mf-part">
          <ol className="mf-decide">
            {DECIDE.map((d, i) => (
              <li key={d.title} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="mf-decide-n mono" data-n={String(i + 1).padStart(2, "0")} aria-hidden />
                <span className="mf-decide-s">{d.stage}</span>
                <h3 className="item-t">{d.title}</h3>
                <p className="item-b">{d.body}</p>
              </li>
            ))}
          </ol>
          <div className="mf-ready" data-rv>
            <p className="mf-ready-h">Useful for the first conversation</p>
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
            A proper handover, with everything you need.
          </h2>
          <p className="sp-lede" data-rv>
            You receive the code, access and practical notes to run the work. Hosting and any third-party subscriptions
            are listed in your scope, so the ongoing costs are clear too.
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
          Start with a clear view of what needs work.
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
      <details className="mf-credits">
        <summary>Photographs and sources</summary>
        <ul>
          {[PHOTOS["method-hero"], ...STAGES.map((s) => s.photo)].map((p) => (
            <li key={p.src}>
              <a href={p.credit.page} target="_blank" rel="noopener noreferrer">{p.credit.title}</a>{" "}
              by {p.credit.author}. {p.credit.source}, {p.credit.licence}.
            </li>
          ))}
        </ul>
      </details>
    </Page>
  );
}
