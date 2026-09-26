"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { Section, Marker, Line } from "./Section";
import { onScrollFrame } from "@/lib/scroll";
import { WHY_S } from "@/lib/choreo";

const CLAIMS = [
  {
    n: "01",
    title: "No hand-offs.",
    body: "The people you meet are the people who design it, build it and wire in the AI. Nothing gets lost between agencies, freelancers and plugins.",
  },
  {
    n: "02",
    title: "Nothing off the shelf.",
    body: "Every line is written for your business. No template a competitor can buy tomorrow, no page builder slowing it down.",
  },
  {
    n: "03",
    title: "Nothing rented.",
    body: "The code, the data and every account are yours. No licence to keep paying, no platform that can hold you hostage.",
  },
];

/**
 * 03 · WHY NERODYN. Out of a flood of light onto a salt flat, where the stone
 * stands at colossal scale. It opens; the camera flies through it, past the
 * light at its heart, and turns as it closes behind. The headline holds at the
 * top; one claim at a time, large, at the bottom — each with its beat.
 */
export function Why() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      onScrollFrame((S) => {
        const el = ref.current;
        if (!el) return;
        const k = S < WHY_S[1] ? 0 : S < WHY_S[2] ? 1 : 2;
        const v = String(k);
        if (el.dataset.claim !== v) el.dataset.claim = v;
        // Inside the colossus the headline steps back and the claim rides on glass.
        const inside = S > 7.74 && S < 8.95 ? "1" : "0";
        if (el.dataset.inside !== inside) el.dataset.inside = inside;
        const p = Math.max(0, Math.min(1, (S - WHY_S[0]) / (WHY_S[3] - WHY_S[0])));
        el.style.setProperty("--claim-p", p.toFixed(4));
      }),
    []
  );

  return (
    <Section id="why" labelledBy="why-title">
      <div className="why-sec" ref={ref} data-claim="0">
        <div className="why-top">
          <Marker n="03">Why Nerodyn</Marker>
          <h2 id="why-title" className="h2 why-h2">
            <Line i={0}>One team builds it.</Line> <Line i={1}>You own all of it.</Line>
          </h2>
        </div>
        <div className="why-claims rv-fade" style={{ "--i": 2 } as CSSProperties}>
          <div className="claim-index" aria-hidden>
            {CLAIMS.map((c, i) => (
              <span key={c.n} className="claim-tick mono" data-i={i}>
                {c.n}
              </span>
            ))}
            <span className="claim-bar">
              <span />
            </span>
          </div>
          <div className="claims">
            {CLAIMS.map((c, i) => (
              <article key={c.n} className="claim" data-i={i}>
                <h3 className="claim-title">
                  {c.title.split(" ").map((w, k) => (
                    <Fragment key={k}>
                      <span className="claim-w" style={{ "--k": k } as CSSProperties}>
                        {w}
                      </span>{" "}
                    </Fragment>
                  ))}
                </h3>
                <p className="claim-body">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
