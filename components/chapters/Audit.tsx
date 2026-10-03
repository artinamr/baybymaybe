"use client";

import type { CSSProperties } from "react";
import { Section, Marker, Line } from "./Section";
import { Pill } from "@/components/chrome/Pills";
import { jumpToAudit } from "@/lib/scroll";
import { CONTACT } from "@/lib/content";

/**
 * 06 · LET'S TALK — the film's end card. Down at the floor's own level the
 * stone stands whole over its reflection, in the middle of the frame, and the
 * two words stand on the floor line either side of it: "Let's ◆ talk." Under
 * it, one sentence and the way on (the audit form opens the footer).
 */
export function Audit() {
  return (
    <Section
      id="audit"
      labelledBy="mark-title"
      back={
        <h2 id="mark-title" className="mark-display">
          <span className="md-w md-l">
            <Line i={0}>Let&apos;s</Line>
          </span>
          <span className="md-w md-r">
            <Line i={1}>talk.</Line>
          </span>
        </h2>
      }
    >
      <div className="mark-front">
        <div className="mark-head">
          <Marker of="audit">Start with a free audit</Marker>
        </div>
        <div className="mark-foot rv-fade" style={{ "--i": 3 } as CSSProperties}>
          <p className="mark-body">
            Send us your website. Within two days you get a straight answer: what is working, what is costing you
            enquiries, and what we would build instead.
          </p>
          <div className="mark-ctas">
            <Pill onClick={jumpToAudit}>Start my free audit</Pill>
            <a className="text-link mark-mail" href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
