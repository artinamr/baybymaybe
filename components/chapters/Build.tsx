"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { Section, Marker } from "./Section";
import { onScrollFrame } from "@/lib/scroll";
import { filmS } from "@/lib/chapters";
import { DISCIPLINE_S } from "@/lib/choreo";
import { DELIVERABLES, PAGES } from "@/lib/content";

const DISCIPLINES = [
  {
    n: "01",
    name: "Websites",
    title: "Designed and engineered from a blank page.",
    body: "No templates, no page builders. A site written for your business — instant on every device, and built to turn visitors into enquiries.",
    list: DELIVERABLES.websites,
    href: PAGES.service("websites"),
    more: "Explore websites",
  },
  {
    n: "02",
    name: "Platforms",
    title: "The systems your business runs on.",
    body: "Client portals, booking, dashboards and internal tools — engineered to carry real load, and connected to the software you already use.",
    list: DELIVERABLES.platforms,
    href: PAGES.service("platforms"),
    more: "Explore platforms",
  },
  {
    n: "03",
    name: "AI automation",
    title: "AI that does the work.",
    body: "Assistants that answer, qualify and book on your site. Agents that file, draft and follow up inside your team's tools.",
    list: DELIVERABLES.ai,
    href: PAGES.service("ai-automation"),
    more: "Explore AI automation",
  },
];

/**
 * 02 · WHAT WE BUILD. After the shatter, in the sky: the pieces fall into an
 * exploded view and assemble (websites), rebuild the stone at monument scale
 * course by course (platforms), then become a working system around the
 * glowing core (AI automation). The three disciplines share one slot and
 * change with the 3D; each ends in a quiet way on to its own page (only the
 * one on screen takes the keyboard's focus).
 */
export function Build() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let last = "";
    return onScrollFrame((pageS) => {
      const el = ref.current;
      if (!el) return;
      // The disciplines follow the film (its clock holds under page sections).
      const S = filmS(pageS);
      const d = S < DISCIPLINE_S[1] ? 0 : S < DISCIPLINE_S[2] ? 1 : 2;
      const v = String(d);
      if (el.dataset.disc !== v) {
        el.dataset.disc = v;
        el.querySelectorAll<HTMLAnchorElement>(".disc-more").forEach((a, i) => (a.tabIndex = i === d ? 0 : -1));
      }
      const p = Math.max(0, Math.min(1, (S - DISCIPLINE_S[0]) / (DISCIPLINE_S[3] - DISCIPLINE_S[0]))).toFixed(4);
      // Straight onto the bar, only when it moves (a custom property on the
      // column restyled all of it, every frame).
      if (p !== last) {
        const bar = el.querySelector<HTMLElement>(".disc-bar > span");
        if (bar) bar.style.transform = `scaleX(${(last = p)})`;
      }
    });
  }, []);

  return (
    <Section id="build" labelledBy="build-title">
      <div className="col-left build" ref={ref} data-disc="0">
        <Marker of="build">
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
              <ul className="disc-list">
                {d.list.map((item, k) => (
                  <li key={item} style={{ "--k": k } as CSSProperties}>
                    {item}
                  </li>
                ))}
              </ul>
              <a className="text-link disc-more" href={d.href} tabIndex={i === 0 ? 0 : -1}>
                {d.more} <span aria-hidden>→</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
