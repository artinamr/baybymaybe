"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { Section, Marker } from "./Section";
import { onScrollFrame } from "@/lib/scroll";
import { DISCIPLINE_S } from "@/lib/choreo";

const DISCIPLINES = [
  {
    n: "01",
    name: "Websites",
    title: "Designed and engineered from a blank page.",
    body: "No templates, no page builders. A site written for your business — instant on every device, and built to turn visitors into enquiries.",
  },
  {
    n: "02",
    name: "Platforms",
    title: "The systems your business runs on.",
    body: "Client portals, booking, dashboards and internal tools — engineered to carry real load, and connected to the software you already use.",
  },
  {
    n: "03",
    name: "AI automation",
    title: "AI that does the work.",
    body: "Assistants that answer, qualify and book on your site. Agents that file, draft and follow up inside your team's tools.",
  },
];

/**
 * 02 · WHAT WE BUILD. After the shatter, in the sky: the pieces fall into an
 * exploded view and assemble (websites), rebuild the stone at monument scale
 * course by course (platforms), then become a working system around the
 * glowing core (AI automation). The three disciplines share one slot and
 * change with the 3D.
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
        <Marker n="02">
          <span id="build-title">What we build</span>
        </Marker>
        <div className="disc-rail rv-fade" style={{ "--i": 1 } as CSSProperties} aria-hidden>
          {DISCIPLINES.map((d, i) => (
            <span key={d.n} className="disc-tick" data-i={i}>
              <span className="mono">{d.n}</span> {d.name}
            </span>
          ))}
          <span className="disc-bar">
            <span />
          </span>
        </div>
        <div className="discs rv-fade" style={{ "--i": 2 } as CSSProperties}>
          {DISCIPLINES.map((d, i) => (
            <article key={d.n} className="disc" data-i={i}>
              <h3 className="disc-title">
                {d.title.split(" ").map((w, k) => (
                  <Fragment key={k}>
                    <span className="disc-w" style={{ "--k": k } as CSSProperties}>
                      {w}
                    </span>{" "}
                  </Fragment>
                ))}
              </h3>
              <p className="disc-body">{d.body}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
