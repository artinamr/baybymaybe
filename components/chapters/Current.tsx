"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Section, Marker, Line } from "./Section";
import { onScrollFrame } from "@/lib/scroll";

const BLOCKS = [
  {
    key: "a",
    label: "In your product",
    body: "Assistants, search and support that understand your customers — part of the site, not bolted on.",
    items: ["Conversational support", "Semantic search", "Personalised journeys"],
  },
  {
    key: "b",
    label: "In your workspace",
    body: "Agents that take repetitive work off your team, connected to the tools you already use.",
    items: ["Inbox and document triage", "Internal knowledge assistants", "Cross-tool workflow automation"],
  },
];

/**
 * 03 · AI AUTOMATION. Mirrored: the constellation holds the left of the frame,
 * the copy the right. Two beats share one slot and cross-fade at S 6.55, in
 * step with the light moving from the product cluster to the workspace one.
 */
export function Current() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      onScrollFrame((S) => {
        const el = ref.current;
        if (!el) return;
        const beat = S < 6.55 ? "a" : "b";
        if (el.dataset.beat !== beat) el.dataset.beat = beat;
      }),
    []
  );

  return (
    <Section id="current" labelledBy="current-title">
      <div className="col-right" ref={ref} data-beat="a">
        <Marker n="03">AI automation</Marker>
        <h2 id="current-title" className="h2">
          <Line i={0}>AI that does</Line> <Line i={1}>real work.</Line>
        </h2>
        <p className="body-l rv-fade" style={{ "--i": 2 } as CSSProperties}>
          Not a chatbot bolted to the corner. We build intelligence into your product and into the way your team works.
        </p>
        <div className="beats rv-fade" style={{ "--i": 3 } as CSSProperties}>
          {BLOCKS.map((b, k) => (
            <div key={b.key} className="beat" data-key={b.key}>
              <p className="beat-label">
                <span className="beat-n">{k + 1}/2</span> {b.label}
              </p>
              <p className="beat-body">{b.body}</p>
              <ul className="beat-items">
                {b.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
