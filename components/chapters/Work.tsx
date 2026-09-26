"use client";

import type { CSSProperties } from "react";
import { Section, Marker, Line } from "./Section";
import { ui } from "@/lib/stores";

// LAUNCH FLAG: sector-level placeholders. Replace with real engagements (or
// delete the chapter) before launch — never invent client names or metrics.
const ROWS = [
  { n: "01", sector: "Hospitality", scope: "Direct-booking platform with a guest concierge assistant", tags: "Infrastructure · AI" },
  { n: "02", sector: "Healthcare", scope: "Patient portal with automated intake and triage", tags: "Infrastructure · AI" },
  { n: "03", sector: "Logistics", scope: "Operations dashboard with document-processing agents", tags: "AI automation" },
  { n: "04", sector: "Professional services", scope: "Brand platform with an internal knowledge assistant", tags: "Infrastructure · AI" },
];

/**
 * 04 · SELECTED WORK. The list flows natively while the camera walks the long
 * mirror; each row brings one layer of the stone down into frame as a
 * specimen, which travels with the camera while the row is read and glows
 * when it is centred or hovered.
 */
export function Work() {
  return (
    <Section id="field" labelledBy="work-title">
      <div className="work">
        <header className="work-head">
          <Marker n="04">Selected work</Marker>
          <h2 id="work-title" className="h2">
            <Line i={0}>Built for teams</Line> <Line i={1}>that move fast.</Line>
          </h2>
          <p className="small muted rv-fade" style={{ "--i": 2 } as CSSProperties}>
            Full case studies are in preparation. References are available on request.
          </p>
        </header>
        <ol className="rows">
          {ROWS.map((r, i) => (
            <li
              key={r.n}
              className="row"
              data-row={i}
              onPointerEnter={() => (ui.focusRow = i)}
              onPointerLeave={() => (ui.focusRow = -1)}
            >
              <span className="row-n">{r.n}</span>
              <span className="row-sector">{r.sector}</span>
              <span className="row-scope">{r.scope}</span>
              <span className="row-meta">
                <span>{r.tags}</span>
                <span className="chip">Case study soon</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
