"use client";

import type { CSSProperties } from "react";
import { Section, Marker, Line } from "./Section";
import { ui } from "@/lib/stores";
import { scrollToChapter } from "@/lib/scroll";

/** Top → bottom as read; `tier` is the floor it points at (0 = the bottom floor). */
const LAYERS = [
  { n: "04", tier: 3, name: "Interface", line: "Brand-grade front ends, with motion, 3D and accessibility built in." },
  { n: "03", tier: 2, name: "Platform", line: "Headless CMS, commerce, portals — and the integrations between them." },
  { n: "02", tier: 1, name: "Data", line: "Clean content models, analytics and pipelines you can trust." },
  { n: "01", tier: 0, name: "Foundation", line: "Hosting, performance, security and uptime." },
];

/**
 * 02 · DIGITAL INFRASTRUCTURE. The stone parts into its four layers — the
 * stack — and the camera cranes down it as the rows are read, top to bottom;
 * the row in focus lights its layer and slides it out, and hovering a row does
 * the same at any scroll position.
 */
export function Order() {
  return (
    <Section
      id="order"
      labelledBy="order-title"
    >
      <div className="col-left">
        <Marker n="02">Digital infrastructure</Marker>
        <h2 id="order-title" className="h2">
          <Line i={0}>Websites and platforms,</Line> <Line i={1}>built like infrastructure.</Line>
        </h2>
        <p className="body-l rv-fade" style={{ "--i": 2 } as CSSProperties}>
          Fast, secure and simple to change. We design and engineer the whole stack — from the interface your customers touch
          to the systems they never see.
        </p>
        <ol className="layers">
          {LAYERS.map((l, k) => (
            <li
              key={l.n}
              className="layer rv-fade"
              data-tier-row={l.tier}
              style={{ "--i": 3 + k } as CSSProperties}
              onPointerEnter={() => (ui.focusTier = l.tier)}
              onPointerLeave={() => (ui.focusTier = -1)}
            >
              <span className="layer-n">{l.n}</span>
              <span className="layer-name">{l.name}</span>
              <span className="layer-line">{l.line}</span>
            </li>
          ))}
        </ol>
        <button type="button" className="text-link rv-fade" style={{ "--i": 7 } as CSSProperties} onClick={() => scrollToChapter("mark")}>
          Plan a platform <span aria-hidden>→</span>
        </button>
      </div>
    </Section>
  );
}
