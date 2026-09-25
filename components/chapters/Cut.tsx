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
      Considered design.<br />Powerful engineering.<br />A little more <span className="accent">possibility.</span>
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
          From the first impression to the systems behind it. We bring websites, platforms and AI together — designed,
          built and cared for by one studio.
        </p>
      </div>
    </Section>
  );
}
