"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Section, Marker, Line } from "./Section";
import { onScrollFrame } from "@/lib/scroll";
import { DISCIPLINE_S } from "@/lib/choreo";

const DISCIPLINES = [
  {
    n: "01",
    name: "Design",
    title: "A presence that looks the part.",
    body: "Built only for you, never a template. The first impression finally matches the quality of your work — and your prices.",
  },
  {
    n: "02",
    name: "Infrastructure",
    title: "Fast, secure, built to last.",
    body: "It opens the instant they tap, on any device, anywhere. Nobody you want to reach gets a reason to leave.",
  },
  {
    n: "03",
    name: "AI automation",
    title: "It works the leads for you.",
    body: "AI greets every visitor, asks the right questions, screens out the noise, and routes the serious ones straight to you.",
  },
];

/**
 * 01 · WHAT WE BUILD. The stone shatters and the film moves to the sky; the
 * three disciplines share one slot and change with the 3D: the stone re-formed
 * (design), rebuilt at monument scale (infrastructure), a working system of
 * leads and light (AI automation).
 */
export function Build() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      onScrollFrame((S) => {
        const el = ref.current;
        if (!el) return;
        const d = S < DISCIPLINE_S[1] ? 0 : S < DISCIPLINE_S[2] ? 1 : 2;
        const v = String(d);
        if (el.dataset.disc !== v) el.dataset.disc = v;
        const p = Math.max(0, Math.min(1, (S - DISCIPLINE_S[0]) / (DISCIPLINE_S[3] - DISCIPLINE_S[0])));
        el.style.setProperty("--disc-p", p.toFixed(4));
      }),
    []
  );

  return (
    <Section id="build" labelledBy="build-title">
      <div className="col-left build" ref={ref} data-disc="0">
        <Marker n="01">What we build</Marker>
        <h2 id="build-title" className="h2">
          <Line i={0}>Infrastructure that wins the buyer.</Line> <Line i={1}>Automation that handles them.</Line>
        </h2>
        <div className="disc-rail rv-fade" style={{ "--i": 2 } as CSSProperties} aria-hidden>
          {DISCIPLINES.map((d, i) => (
            <span key={d.n} className="disc-tick" data-i={i}>
              <span className="mono">{d.n}</span> {d.name}
            </span>
          ))}
          <span className="disc-bar">
            <span />
          </span>
        </div>
        <div className="discs rv-fade" style={{ "--i": 3 } as CSSProperties}>
          {DISCIPLINES.map((d, i) => (
            <article key={d.n} className="disc" data-i={i}>
              <h3 className="disc-title">{d.title}</h3>
              <p className="disc-body">{d.body}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
