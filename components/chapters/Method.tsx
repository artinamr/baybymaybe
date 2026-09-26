"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Section, Marker, Line } from "./Section";
import { onScrollFrame } from "@/lib/scroll";
import { METHOD } from "@/lib/choreo";

const STEPS = [
  { n: "01", title: "Discover", body: "We learn the business, the people and the systems before we design anything." },
  { n: "02", title: "Architect", body: "Structure, stack and data — decided deliberately and written down plainly." },
  { n: "03", title: "Build", body: "Design and engineering as one team, shipped in increments you can use." },
  { n: "04", title: "Automate", body: "AI added where it removes real work — and we stay on to run it." },
];

/**
 * 05 · METHOD. The four layers gather over the mirror, then build the stone
 * from the point up — one layer per step, each landing with a flash: the four
 * steps and the four seats are the same four beats.
 */
export function Method() {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    return onScrollFrame((S) => {
      const el = ref.current;
      if (!el) return;
      // One step per seat: step k lights as layer k starts down onto the stone.
      const k = Math.max(0, Math.min(3, Math.floor((S - METHOD.t0 + 0.08) / METHOD.step)));
      const v = String(S < METHOD.t0 - 0.2 ? -1 : k);
      if (el.dataset.step !== v) el.dataset.step = v;
      el.style.setProperty("--fill", Math.max(0, Math.min(1, (S - METHOD.t0 + 0.08) / (4 * METHOD.step))).toFixed(3));
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
