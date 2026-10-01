"use client";

import { useState } from "react";
import { LogoMark } from "@/components/chrome/LogoMark";
import { AuditForm } from "@/components/contact/AuditForm";
import { ui } from "@/lib/stores";
import { chapter } from "@/lib/chapters";
import { CONTACT, PAGES } from "@/lib/content";
import { SERVICES } from "@/content/services";

const EMAIL = CONTACT.email;

// The home page's scroll and story code is already loaded there; these load it
// on demand, so the other pages never download it for a footer they only link from.
const jumpToAudit = () => import("@/lib/scroll").then((m) => m.jumpToAudit());
const jumpToTop = () => import("@/lib/scroll").then((m) => m.jumpToS(0));
const openStory = () => import("@/lib/story").then((m) => m.openStory());

/**
 * THE FOOTER — every page ends on it. It opens with the audit form (every
 * "free audit" on the site lands on #contact), then every way round the site,
 * and the name signed across the bottom. On the home page it is the last sheet,
 * rising over the film's final frame.
 */
export function SiteFooter({ home = false, form = true }: { home?: boolean; form?: boolean }) {
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
    <footer className="site-foot" aria-label="Site" data-noform={form ? undefined : ""}>
      <div className="sf-in">
        {form ? (
        <section id="contact" className="sf-audit" aria-labelledby="contact-title">
          <div className="sfa-head">
            <p className="marker">
              {home ? <span className="marker-n">{chapter("audit").num}</span> : null}
              {home ? <span className="marker-rule" aria-hidden /> : null}
              <span>Start with a free audit</span>
            </p>
            <h2 id="contact-title" className="sfa-title">
              Send us your website.
              <br />
              Get a straight answer in two days.
            </h2>
            <ol className="sfa-points">
              <li>
                <span className="mono">01</span>
                <p>What is working — and should stay.</p>
              </li>
              <li>
                <span className="mono">02</span>
                <p>What is quietly costing you enquiries.</p>
              </li>
              <li>
                <span className="mono">03</span>
                <p>What we would build instead, and how long it would take.</p>
              </li>
            </ol>
            <div className="sfa-direct">
              <span className="sfa-or">Rather write?</span>
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
            </div>
          </div>
          <div className="sfa-form">
            <AuditForm tone="card" />
          </div>
        </section>
        ) : null}

        <nav className="sf-cols" aria-label="Footer">
          <div className="f-col">
            <p className="f-h">Services</p>
            {SERVICES.map((s) => (
              <a key={s.slug} href={PAGES.service(s.slug)}>
                {s.name}
              </a>
            ))}
            <a href={PAGES.pricing}>Investment</a>
          </div>
          <div className="f-col">
            <p className="f-h">Studio</p>
            <a href={PAGES.work}>Work</a>
            <a href={PAGES.methodology}>Methodology</a>
            <a href={PAGES.studio}>Studio</a>
            {home ? (
              <button type="button" onClick={openStory}>
                The story
              </button>
            ) : (
              <a href={`${PAGES.home}#story`}>The story</a>
            )}
          </div>
          <div className="f-col">
            <p className="f-h">Help</p>
            <a href={PAGES.faq}>Questions</a>
            <a href={PAGES.contact}>Contact</a>
            {home ? (
              <button type="button" onClick={jumpToAudit}>
                Free audit
              </button>
            ) : (
              <a href="#contact">Free audit</a>
            )}
            <a href={`mailto:${EMAIL}`}>Email us</a>
            {CONTACT.linkedin ? (
              <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            ) : null}
            {CONTACT.instagram ? (
              <a href={CONTACT.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
            ) : null}
          </div>
          <div className="f-col">
            <p className="f-h">© 2026 Nerodyn</p>
            <a href={PAGES.privacy}>Privacy</a>
            <a href={PAGES.terms}>Terms</a>
            <button type="button" className="text-link" onClick={() => (home ? jumpToTop() : window.scrollTo({ top: 0 }))}>
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
