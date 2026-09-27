"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { Section, Marker, Line } from "./Section";
import { LogoMark } from "@/components/chrome/LogoMark";
import { ui } from "@/lib/stores";
import { scrollToChapter, scrollToS } from "@/lib/scroll";
import { easeInOutCubic } from "@/lib/ease";
import { CONTACT, METHODOLOGY_HREF } from "@/lib/content";
import { openStory } from "@/lib/story";

const EMAIL = CONTACT.email;
/** Where the form posts (JSON). Unset → the form writes the email for you instead. */
const ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT ?? "";
const NEEDS = ["Website", "Platform", "AI automation", "Not sure yet"] as const;

/**
 * THE AUDIT FORM — the page's one ask, made as short as it can be: your site,
 * your email, and (if you like) what you need. With an endpoint configured it
 * posts; on the static site it opens a written email with everything filled in.
 */
function AuditForm() {
  const [need, setNeed] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "mailed" | "error">("idle");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const site = String(data.get("site") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    if (!email) return;
    const needs = need.length ? need.join(", ") : "Not said";
    if (ENDPOINT) {
      setState("sending");
      try {
        const r = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ site, email, need: needs, source: "nerodyn.com free audit" }),
        });
        setState(r.ok ? "sent" : "error");
      } catch {
        setState("error");
      }
      return;
    }
    const subject = encodeURIComponent(`Free audit${site ? ` — ${site}` : ""}`);
    const body = encodeURIComponent(`Website: ${site || "—"}\nEmail: ${email}\nWhat we need: ${needs}\n\n`);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    setState("mailed");
  };

  const note =
    state === "sent"
      ? "Thank you — it's with us. You'll hear back within two days."
      : state === "mailed"
        ? `Your email is written — just press send. (Or write to ${EMAIL}.)`
        : state === "error"
          ? `That didn't go through. Write to ${EMAIL} and we'll pick it up.`
          : "Free, and no pitch. We reply within two days.";

  return (
    <form className="audit-form" onSubmit={submit} data-state={state}>
      <div className="af-need" role="group" aria-label="What do you need?">
        {NEEDS.map((n) => {
          const on = need.includes(n);
          return (
            <button
              key={n}
              type="button"
              className="chip"
              aria-pressed={on}
              onClick={() => setNeed((cur) => (on ? cur.filter((x) => x !== n) : [...cur, n]))}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="af-row">
        <label className="field">
          <span className="field-label">Your website</span>
          <input type="text" name="site" inputMode="url" autoComplete="url" placeholder="yourbusiness.com" />
        </label>
        <label className="field">
          <span className="field-label">Your email</span>
          <input type="email" name="email" autoComplete="email" required placeholder="you@yourbusiness.com" />
        </label>
        <button type="submit" className="pill btn-shine pill-lg af-send" disabled={state === "sending"}>
          <span>{state === "sending" ? "Sending…" : "Start my audit"}</span>
          <span className="pill-arrow" aria-hidden>
            <span>→</span>
            <span>→</span>
          </span>
        </button>
      </div>
      <p className="af-note" aria-live="polite">
        {note}
      </p>
    </form>
  );
}

/**
 * 07 · LET'S TALK. The colossus and its reflection on the floor, "Let's talk."
 * standing on the horizon behind the canvas (the stone genuinely hides part
 * of it): the marker and the promise above, the audit form below it.
 */
export function Audit() {
  return (
    <Section
      id="audit"
      labelledBy="mark-title"
      back={
        <h2 id="mark-title" className="mark-display">
          <Line i={0}>Let&apos;s talk.</Line>
        </h2>
      }
    >
      <div className="mark-front">
        <div className="mark-head">
          <Marker n="07">Start with a free audit</Marker>
          <p className="mark-body rv-fade" style={{ "--i": 1 } as CSSProperties}>
            Send us your website. Within two days you get a straight answer: what is working, what is costing you
            enquiries, and what we would build instead.
          </p>
        </div>
        <div className="mark-foot rv-fade" style={{ "--i": 3 } as CSSProperties}>
          {/* On a phone the promise sits here, clear of the stone (the one at the top hides). */}
          <p className="mark-body mark-body-m">
            Send us your website. Within two days you get a straight answer: what is working, what is costing you
            enquiries, and what we would build instead.
          </p>
          <AuditForm />
        </div>
      </div>
    </Section>
  );
}

/**
 * THE FOOTER — the page's last sheet: it rises over the film's final frame
 * (the film holds at its end). The address, every way round the site, and the
 * name signed across the bottom.
 */
export function SiteFooter() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  return (
    <footer className="site-foot" aria-label="Site">
      <div className="sf-in">
        <div className="sf-top">
          <p className="sf-line">
            Websites, platforms and AI automation — designed, built and looked after by one team.
          </p>
          <div className="sf-contact">
            <button
              type="button"
              className="email sf-email"
              onClick={copy}
              onPointerEnter={() => (ui.hoverEmail = true)}
              onPointerLeave={() => (ui.hoverEmail = false)}
              aria-label={`Copy ${EMAIL}`}
            >
              <span className="email-text">{EMAIL}</span>
              <span className="email-state" aria-live="polite">
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
            <button type="button" className="text-link" onClick={() => scrollToChapter("audit")}>
              Start a free audit <span aria-hidden>↑</span>
            </button>
          </div>
        </div>
        <nav className="sf-cols" aria-label="Footer">
          <div className="f-col">
            <p className="f-h">What we build</p>
            <button type="button" onClick={() => scrollToChapter("build")}>
              Websites
            </button>
            <button type="button" onClick={() => scrollToChapter("build")}>
              Platforms
            </button>
            <button type="button" onClick={() => scrollToChapter("build")}>
              AI automation
            </button>
          </div>
          <div className="f-col">
            <p className="f-h">Studio</p>
            <button type="button" onClick={() => scrollToChapter("work")}>
              Work
            </button>
            <button type="button" onClick={() => scrollToChapter("process")}>
              How we work
            </button>
            <a href={METHODOLOGY_HREF}>Methodology</a>
            <button type="button" onClick={openStory}>
              The story
            </button>
          </div>
          <div className="f-col">
            <p className="f-h">Elsewhere</p>
            {/* Placeholders — the client supplies the real profiles. */}
            <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={CONTACT.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          </div>
          <div className="f-col">
            <p className="f-h">© 2026 Nerodyn</p>
            <button type="button" className="text-link" onClick={() => scrollToS(0, 2.6, easeInOutCubic)}>
              Back to the top <span aria-hidden>↑</span>
            </button>
          </div>
        </nav>
        <p className="sf-mark" aria-hidden>
          <LogoMark className="sf-logo" />
          <span>Nerodyn</span>
        </p>
      </div>
    </footer>
  );
}
