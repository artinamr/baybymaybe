"use client";

import { useState, type CSSProperties } from "react";
import { Section, Marker, Line } from "./Section";
import { Pill } from "@/components/chrome/Pills";
import { LogoMark } from "@/components/chrome/LogoMark";
import { ui } from "@/lib/stores";
import { scrollToS } from "@/lib/scroll";
import { easeInOutCubic } from "@/lib/ease";

// Placeholder address — the client must confirm the real inbox before launch.
const EMAIL = "hello@nerodyn.com";
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * 04 · LET'S TALK. The stone at rest on the salt flat, its seams drawn in
 * indigo light, standing in front of the display line (set behind the canvas,
 * so the stone genuinely hides part of it). The footer lives inside the sticky
 * layer and rises at the very end.
 */
export function Audit() {
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
        <Marker n="04">Start with a free audit</Marker>
        <div className="mark-foot">
          <p
            className="mark-body rv-fade"
            style={{ "--i": 2 } as CSSProperties}
          >
            Send us your website. Within two days you get a straight answer:
            what is working, what is costing you enquiries, and what we would
            build instead. Free, and no pitch.
          </p>
          <div
            className="mark-ctas rv-fade"
            style={{ "--i": 3 } as CSSProperties}
          >
            <Pill href={`mailto:${EMAIL}?subject=Free%20audit`} large>
              Start my audit
            </Pill>
            <button
              type="button"
              className="email"
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
      </div>

      <footer className="footer">
        <div className="footer-grid">
          <div className="f-brand">
            <LogoMark className="f-mark" />
            <span className="f-word">Nerodyn</span>
            <span className="f-sub">
              Digital infrastructure &amp; AI automation
            </span>
          </div>
          <div className="f-col">
            <p className="f-h">Contact</p>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <a href={`${BASE}/methodology/`}>Methodology</a>
          </div>
          <div className="f-col">
            <p className="f-h">Elsewhere</p>
            {/* Placeholders — the client supplies the real profiles. */}
            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
          </div>
          <div className="f-col f-end">
            <p className="f-h">© 2026 Nerodyn</p>
            <button
              type="button"
              className="text-link"
              onClick={() => scrollToS(0, 2.6, easeInOutCubic)}
            >
              Back to the top <span aria-hidden>↑</span>
            </button>
          </div>
        </div>
      </footer>
    </Section>
  );
}
