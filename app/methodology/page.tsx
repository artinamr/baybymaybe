import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/chrome/LogoMark";
import { MethodReveal } from "@/components/method/MethodReveal";

export const metadata: Metadata = {
  title: "Methodology — Nerodyn",
  description: "From first call to live in about fourteen days: how Nerodyn discovers, designs, builds and launches — and why you own everything at the end.",
};

// Placeholder address — the client must confirm the real inbox before launch.
const EMAIL = "hello@nerodyn.com";

const DAYS = [
  { day: "01", title: "Discover", body: "A thirty-minute call. You describe what's broken; we map the fix — the business, the people, the systems.", note: "Call · audit · scope" },
  { day: "03", title: "Design", body: "A clickable prototype you approve before a line of code is written. Zero surprises later.", note: "Prototype · sign-off" },
  { day: "11", title: "Build", body: "Native code on enterprise infrastructure, AI wired in where it removes real work. Tested on every device.", note: "Engineering · AI · QA" },
  { day: "14", title: "Live", body: "A zero-downtime launch. You own the codebase, the domain and every asset. Metrics start on day one.", note: "Launch · handover · metrics" },
];

const PRINCIPLES = [
  { name: "Ownership", line: "You own it all — code, domain, every asset. No platform holds you hostage." },
  { name: "Craft", line: "Built for you. Made to fit your business, not stamped from a theme ten others bought." },
  { name: "Clarity", line: "Straight answers in plain language, tied to your bottom line. Never left guessing." },
  { name: "Proof", line: "Useful first. We audit your current setup before you spend a cent — free." },
];

/**
 * METHODOLOGY — its own page (the home page stays four sections). Editorial:
 * the fourteen days as a timeline whose line fills as you read, the typical
 * agency set against it, the principles, the audit.
 */
export default function Methodology() {
  return (
    <div className="mp">
      <MethodReveal />
      <header className="mp-nav">
        <Link href="/" className="mp-brand" aria-label="Nerodyn — home">
          <LogoMark className="mp-mark" />
          <span>Nerodyn</span>
        </Link>
        <nav className="mp-links" aria-label="Site">
          <Link href="/">Home</Link>
          <Link href="/#story">The story</Link>
          <a href={`mailto:${EMAIL}?subject=Free%20audit`} className="mp-cta">
            Free audit <span aria-hidden>↗</span>
          </a>
        </nav>
      </header>

      <main id="main">
        <section className="mp-hero">
          <p className="mp-kicker" data-rv>
            <span className="mp-rule" aria-hidden /> Methodology
          </p>
          <h1 className="mp-h1" data-rv>
            From first call to live.
            <br />
            <em>In about fourteen days.</em>
          </h1>
          <p className="mp-lede" data-rv>
            Most agencies take three months. We do it in roughly two weeks — without cutting corners, without subcontractors,
            and without surprises along the way.
          </p>
        </section>

        <section className="mp-timeline" aria-label="The fourteen days">
          <div className="mp-line" aria-hidden>
            <span />
          </div>
          <ol>
            {DAYS.map((d) => (
              <li key={d.day} className="mp-day" data-rv>
                <p className="mp-day-n">
                  <span className="mono">Day</span> {d.day}
                </p>
                <div className="mp-day-body">
                  <h2 className="mp-day-title">{d.title}</h2>
                  <p>{d.body}</p>
                  <p className="mp-note mono">{d.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mp-compare" aria-label="Typical agency and Nerodyn">
          <div className="mp-row" data-rv>
            <p className="mp-who">Typical agency</p>
            <p className="mp-span">
              90<span>+ days</span>
            </p>
            <div className="mp-bar" aria-hidden>
              <span style={{ width: "100%" }} />
            </div>
            <p className="mp-how">Templates. Handoffs. Revisions in triplicate.</p>
          </div>
          <div className="mp-row mp-row-us" data-rv>
            <p className="mp-who">Nerodyn</p>
            <p className="mp-span">
              14<span> days</span>
            </p>
            <div className="mp-bar" aria-hidden>
              <span style={{ width: "15.5%" }} />
            </div>
            <p className="mp-how">Senior engineers. Native code. One team.</p>
          </div>
        </section>

        <section className="mp-principles" aria-label="Principles">
          <h2 className="mp-h2" data-rv>
            You work with the people who build it.
            <br />
            You keep everything.
          </h2>
          <ul>
            {PRINCIPLES.map((p, i) => (
              <li key={p.name} data-rv style={{ transitionDelay: `${i * 90}ms` }}>
                <p className="mp-p-n mono">0{i + 1}</p>
                <p className="mp-p-name">{p.name}</p>
                <p className="mp-p-line">{p.line}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mp-close">
          <p className="mp-kicker" data-rv>
            <span className="mp-rule" aria-hidden /> Start with a free audit
          </p>
          <p className="mp-close-line" data-rv>
            Find out what your setup is costing you.
          </p>
          <p className="mp-lede" data-rv>
            Send us your current site. Within 48 hours we return an honest read on what is winning you clients and what is
            quietly turning them away. No pitch, no cost.
          </p>
          <div className="mp-close-ctas" data-rv>
            <a className="pill btn-shine pill-lg" href={`mailto:${EMAIL}?subject=Free%20audit`}>
              <span>Start my audit</span>
              <span className="pill-arrow" aria-hidden>
                <span>→</span>
                <span>→</span>
              </span>
            </a>
            <Link href="/" className="text-link">
              Back to the home page <span aria-hidden>↩</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="mp-foot">
        <span>© 2026 Nerodyn</span>
        <span>Digital infrastructure &amp; AI automation</span>
      </footer>
    </div>
  );
}
