import type { CSSProperties } from "react";
import { STAGES } from "@/lib/content";

/**
 * THE FOURTEEN DAYS, AS A PLAN: a typical website's five stages laid out day
 * by day, with the moments the client decides pinned under them. Each stage
 * is a way into its section below. Pure HTML and CSS (the bars draw
 * themselves when the plan comes into view: [data-in], SubReveal).
 *
 * The days follow STAGES (lib/content.ts): Discover days 1–2, Define by day
 * 3, Design from day 3, Build to day 11, launch on day 14. Where design hands
 * over to build is the prototype's approval.
 */
const SPANS: [number, number][] = [
  [1, 2],
  [3, 3],
  [3, 6],
  [7, 11],
  [12, 14],
];

const PINS = [
  { day: 3, label: "You sign the scope" },
  { day: 6, label: "You approve the prototype" },
  { day: 11, label: "You try it" },
  { day: 14, label: "Live" },
];

const DAYS = Array.from({ length: 14 }, (_, i) => i + 1);

export function Plan() {
  return (
    <section className="mp" aria-labelledby="mp-h" data-rv>
      <div className="mp-top">
        <h2 id="mp-h" className="mp-h">
          A typical website, day by day
        </h2>
        <p className="mp-key">
          <span className="mp-key-pin" aria-hidden /> Where you decide
        </p>
      </div>
      <div className="mp-chart">
        <ol className="mp-days" aria-hidden>
          <li className="mp-days-label">Day</li>
          {DAYS.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ol>
        <ol className="mp-rows">
          {STAGES.map((s, i) => {
            const [a, b] = SPANS[i];
            return (
              <li key={s.n} style={{ "--i": i } as CSSProperties}>
                <a className="mp-row" href={`#stage-${s.n}`}>
                  <span className="mp-name">
                    <span className="mono">{s.n}</span> {s.title}
                  </span>
                  <span className="mp-bar" style={{ gridColumn: `${a + 1} / ${b + 2}` }}>
                    <span className="mp-when">{a === b ? `Day ${a}` : `Days ${a}–${b}`}</span>
                  </span>
                  <span className="sr-only">: {a === b ? `day ${a}` : `days ${a} to ${b}`}</span>
                </a>
              </li>
            );
          })}
        </ol>
        <ol className="mp-pins">
          {PINS.map((p, i) => (
            <li key={p.day} style={{ gridColumn: `${p.day + 1} / span 1`, "--i": i } as CSSProperties}>
              <span className="mp-pin" aria-hidden />
              <span className="mp-pin-t">
                <span className="sr-only">Day {p.day}: </span>
                {p.label}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
