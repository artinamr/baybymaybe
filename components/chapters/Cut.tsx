import type { CSSProperties } from "react";
import { Section, Marker } from "./Section";

/**
 * 01 · THE STUDIO — the thesis, read through the stone. The statement is set
 * twice: the ink original, and an exact paper-coloured duplicate clipped to the
 * stone's projected silhouette (lib/project.ts), so letters flip from ink to
 * paper precisely where the black stone passes behind them. No blend modes.
 */
function Statement({ inverted = false }: { inverted?: boolean }) {
  return (
    <p className={`statement ${inverted ? "is-inverted" : ""}`} aria-hidden={inverted || undefined}>
      We build the digital infrastructure your business runs on — and the <span className="accent">intelligence</span> that
      makes it work harder.
    </p>
  );
}

export function Cut() {
  return (
    <Section id="cut" labelledBy="cut-title">
      <div className="cut-wrap">
        <Marker n="01">
          <span id="cut-title">The studio</span>
        </Marker>
        <div className="statement-wrap rv-wipe">
          <Statement />
          <div className="inversion" data-inversion aria-hidden>
            <Statement inverted />
          </div>
        </div>
        <p className="cut-body rv-fade" style={{ "--i": 3 } as CSSProperties}>
          Websites, web platforms and AI automation — designed, engineered and maintained by one team, so nothing gets lost
          between strategy, design, code and intelligence.
        </p>
      </div>
    </Section>
  );
}
