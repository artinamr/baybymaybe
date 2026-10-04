import type { Metadata } from "next";
import { Page, Kicker } from "@/components/site/Page";
import { QaList } from "@/components/site/QaList";
import { HowToLd, PageLd, QaLd } from "@/components/site/JsonLd";
import { Photo, BANNER_SIZES } from "@/components/site/Photo";
import { FAQ_ALL, PAGES, PRINCIPLES, STAGES, ogCard } from "@/lib/content";
import { pageMeta } from "@/lib/meta";
import { PHOTOS } from "@/content/images";

const DESCRIPTION =
  "How a Nerodyn project runs in five stages: what happens in each, what you bring, what we produce, and what is yours at the end.";

export const metadata: Metadata = pageMeta({
  title: "Methodology: five stages from first call to launch",
  description: DESCRIPTION,
  path: "methodology/",
  image: ogCard("methodology", "How a Nerodyn project runs, in five stages."),
});

const YOURS = ["The code", "The domain", "The content, and every asset", "Every account, in your name", "Plain notes on how it all works"];

// The questions people ask about how a project runs (answers from the questions page, so they never disagree).
const QS = ["How long does it take?", "What do you need from us to start?", "Who will we be working with?", "How do payments work?"];
const QA = QS.map((q) => FAQ_ALL.flatMap((g) => g.items).find((it) => it.q === q)!).filter(Boolean);

/**
 * METHODOLOGY: the fourteen days, told as an editorial. The five stages at a
 * glance, then each in turn against a photograph (what happens, what you
 * bring, what we produce, and when), the principles, what you own at the end,
 * the questions people ask about it, and the audit form at the foot.
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
        {STAGES.map((s, i) => (
          <article className="ms-stage" id={`stage-${s.n}`} data-flip={i % 2 ? "" : undefined} key={s.title} aria-labelledby={`ms-${s.n}`}>
            <figure className="ms-img" data-rv>
              <Photo p={s.photo} sizes="(min-width: 900px) 40vw, 92vw" />
            </figure>
            <div className="ms-text">
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
            </div>
          </article>
        ))}
        <p className="ms-note" data-rv>
          The days are typical for a website. A platform or an automation is planned stage by stage in its own quote.
        </p>
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
              <span className="own-tick" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d="M5 12.5l4.4 4.3L19 7.5" />
                </svg>
              </span>
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
          <a className="text-link" href="#contact">
            Or start with a free audit <span aria-hidden>↓</span>
          </a>
        </div>
      </section>
    </Page>
  );
}
