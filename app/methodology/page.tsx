import type { Metadata } from "next";
import { SubHeader } from "@/components/site/SubHeader";
import { SubReveal } from "@/components/site/SubReveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PAGES, PRINCIPLES, STAGES } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = pageMeta({
  title: "Methodology",
  description:
    "How a Nerodyn project runs, in five stages — discover, define, design, build, launch — what you bring and what we produce at each, and all of it yours at the end.",
  path: "methodology/",
});

const YOURS = ["The code", "The domain", "The content, and every asset", "Every account, in your name", "Plain notes on how it all works"];

/**
 * METHODOLOGY — the fourteen days, told as an editorial: a hero image of the
 * stone, the five stages each set against a frame from the film (the same
 * stone, whole · finding its places · opened · climbing · alight), each with
 * what happens, what you bring and what we produce; the principles, what you
 * own at the end — and the audit form at the foot.
 */
export default function Methodology() {
  return (
    <div className="sp">
      <SubReveal />
      <SubHeader here="methodology" />
      <main id="main" className="sp-main">
        <section className="sp-hero">
          <p className="sp-kicker" data-rv>
            <span className="sp-rule" aria-hidden /> Methodology
          </p>
          <h1 className="sp-h1" data-rv>
            From first call to live,
            <br />
            <em>in about fourteen days.</em>
          </h1>
          <p className="sp-lede" data-rv>
            One team takes it from the first call to the launch — designers and engineers together, no hand-offs and no
            subcontractors — so it is done in weeks, not months, and nothing is lost on the way.
          </p>
        </section>

        <figure className="sp-banner" data-rv>
          {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
          <img
            src={`${BASE}/method/hero.webp`}
            alt="The Nerodyn stone up close: polished black glass with veins of indigo light inside it."
            width={2400}
            height={1100}
            fetchPriority="high"
            decoding="async"
          />
        </figure>

        <section className="ms" aria-labelledby="ms-title">
          <header className="ms-head">
            <p className="sp-kicker" data-rv>
              <span className="sp-rule" aria-hidden /> Five stages
            </p>
            <h2 id="ms-title" className="sp-h2" data-rv>
              The same way, every time.
            </h2>
          </header>
          {STAGES.map((s, i) => (
            <article className="ms-stage" data-flip={i % 2 ? "" : undefined} key={s.title} aria-labelledby={`ms-${s.n}`}>
              <figure className="ms-img" data-rv>
                {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
                <img src={s.image} alt={s.imageAlt} width={1296} height={1620} loading="lazy" decoding="async" />
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
            <p className="sp-kicker" data-rv>
              <span className="sp-rule" aria-hidden /> At the end
            </p>
            <h2 id="own-title" className="sp-h2" data-rv>
              What is yours on day fourteen.
            </h2>
            <p className="sp-lede" data-rv>
              No licence to keep paying, and nothing that locks you to us. If you ever want to move it, it moves with
              you.
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

        <section className="sp-block sp-more" aria-label="More">
          <p className="sp-more-line" data-rv>
            Still have a question?
          </p>
          <div className="sp-more-links" data-rv>
            <a className="text-link" href={PAGES.faq}>
              Read the straight answers <span aria-hidden>→</span>
            </a>
            <a className="text-link" href="#contact">
              Or start with a free audit <span aria-hidden>↓</span>
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
