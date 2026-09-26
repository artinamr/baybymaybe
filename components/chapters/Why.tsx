"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Section, Marker, Line } from "./Section";
import { onScrollFrame } from "@/lib/scroll";
import { METHOD } from "@/lib/choreo";

const NUMBERS = [
  { big: "14", unit: "days", line: "From brief to live. Most agencies take three months." },
  { big: "100", unit: "%", line: "Yours. Code, domain, every asset — no platform holds you hostage." },
  { big: "0", unit: "retainers", line: "Pay for the build. After that it works for you, every day." },
  { big: "48", unit: "hours", line: "For a free, honest audit of what you have now — before you spend a cent." },
];

/**
 * 02 · WHY NERODYN. Down through the cloud to the lake, where the shards build
 * the stone again — one seat for each number, landing together.
 */
export function Why() {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(
    () =>
      onScrollFrame((S) => {
        const el = ref.current;
        if (!el) return;
        let k = -1;
        for (let i = 0; i < 4; i++) if (S >= METHOD.t0 + METHOD.step * i + METHOD.seatLen * 0.5) k = i;
        const v = String(k);
        if (el.dataset.step !== v) el.dataset.step = v;
      }),
    []
  );

  return (
    <Section id="why" labelledBy="why-title">
      <div className="col-left why">
        <Marker n="02">Why Nerodyn</Marker>
        <h2 id="why-title" className="h2">
          <Line i={0}>You work with the people who build it.</Line> <Line i={1}>You keep everything.</Line>
        </h2>
        <ol className="numbers" ref={ref} data-step="-1">
          {NUMBERS.map((n, i) => (
            <li key={n.big} className="number rv-fade" data-i={i} style={{ "--i": 2 + i } as CSSProperties}>
              <span className="number-big">
                {n.big}
                <span className="number-unit">{n.unit}</span>
              </span>
              <span className="number-line">{n.line}</span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
