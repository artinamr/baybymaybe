import type { Metadata } from "next";
import { SubHeader } from "@/components/site/SubHeader";
import { SubReveal } from "@/components/site/SubReveal";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PAGES, STAGES } from "@/lib/content";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Methodology — Nerodyn",
  description:
    "From first call to live in about fourteen days: how Nerodyn discovers, designs, builds and launches — one team, no hand-offs, and you own everything at the end.",
};

const PRINCIPLES = [
  { name: "Ownership", line: "You own it all — code, domain, every asset. No platform holds you hostage." },
  { name: "Craft", line: "Made to fit your business, not stamped from a theme ten others bought." },
  { name: "Clarity", line: "Straight answers in plain language, tied to your bottom line. Never left guessing." },
  { name: "Proof", line: "Useful first: we audit what you have before you spend anything — free." },
];

const YOURS = ["The code", "The domain", "The content, and every asset", "Every account, in your name", "Plain notes on how it all works"];

/**
 * METHODOLOGY — the fourteen days, told as an editorial: a hero image of the
 * stone, the four stages each set against a frame from the film (the same
 * stone, discovered · planned · built · alive), the principles, what you own
 * at the end — and the audit form at the foot.
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

        <section className="ms" aria-label="The four stages">
          <header className="ms-head">
            <p className="sp-kicker" data-rv>
              <span className="sp-rule" aria-hidden /> The four stages
            </p>
            <h2 className="sp-h2" data-rv>
              The same way, every time.
            </h2>
          </header>
          {STAGES.map((s, i) => (
            <article className="ms-stage" data-flip={i % 2 ? "" : undefined} key={s.title}>
              <figure className="ms-img" data-rv>
                {/* eslint-disable-next-line @next/next/no-img-element -- a static export: no image optimiser to gain */}
                <img src={s.image} alt="" width={1200} height={1500} loading="lazy" decoding="async" />
              </figure>
              <div className="ms-text">
                <p className="ms-day" data-rv>
                  <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                  <span>{s.day}</span>
                </p>
                <h3 className="ms-title" data-rv>
                  {s.title}
                </h3>
                <p className="ms-lede" data-rv>
                  {s.lede}
                </p>
                <ul className="ms-points" data-rv>
                  {s.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
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
