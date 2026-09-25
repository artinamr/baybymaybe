"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Section, Marker, Line } from "./Section";
import { onScrollFrame } from "@/lib/scroll";
import { chapter } from "@/lib/chapters";

const STEPS = [
  { n: "01", title: "Discover", body: "We learn the business, the people and the systems before we design anything." },
  { n: "02", title: "Architect", body: "Structure, stack and data — decided deliberately and written down plainly." },
  { n: "03", title: "Build", body: "Design and engineering as one team, shipped in increments you can use." },
  { n: "04", title: "Automate", body: "AI added where it removes real work — and we stay on to run it." },
];

/**
 * 05 · METHOD. Each step lights as its group of fragments seats back into the
 * stone (from the point up): the four steps and the four seatings are the
 * same four beats.
 */
export function Method() {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const S0 = chapter("method").S0;
    return onScrollFrame((S) => {
      const el = ref.current;
      if (!el) return;
      // Seating windows: 10.6 + 0.225·k (SPEC §5 ch05).
      const k = Math.max(0, Math.min(3, Math.floor((S - 10.6) / 0.225)));
      const v = String(S < 10.45 ? -1 : k);
      if (el.dataset.step !== v) el.dataset.step = v;
      el.style.setProperty("--fill", Math.max(0, Math.min(1, (S - S0) / 1.2)).toFixed(3));
    });
  }, []);

  return (
    <Section id="method" labelledBy="method-title">
      <div className="col-left method">
        <Marker n="05">Method</Marker>
        <h2 id="method-title" className="h2">
          <Line i={0}>How we work.</Line>
        </h2>
        <ol className="steps" ref={ref} data-step="-1">
          {STEPS.map((s, i) => (
            <li key={s.n} className="step rv-fade" data-i={i} style={{ "--i": 1 + i } as CSSProperties}>
              <span className="step-n" aria-hidden>
                <span className="step-n-o">{s.n}</span>
                <span className="step-n-f">{s.n}</span>
              </span>
              <span className="step-text">
                <span className="step-title">{s.title}</span>
                <span className="step-body">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
