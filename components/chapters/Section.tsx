import type { CSSProperties, ReactNode } from "react";
import { chapter, type ChapterId } from "@/lib/chapters";

/**
 * A chapter: <section data-chapter> sized in stable viewport units, holding two
 * SIBLING layers in one grid cell — `.back` (under the canvas: type the stone
 * can occlude) and `.front` (over it). The section itself carries no z-index,
 * transform, opacity or filter, so both layers join the root stacking context
 * and interleave with the fixed canvas (docs/SPEC.md §10).
 */
export function Section({
  id,
  className = "",
  back,
  children,
  labelledBy,
}: {
  id: ChapterId;
  className?: string;
  back?: ReactNode;
  children: ReactNode;
  labelledBy?: string;
}) {
  const c = chapter(id);
  return (
    <section
      data-chapter={id}
      className={`chapter ${c.sticky ? "is-sticky" : "is-flow"} ch-${id} ${className}`}
      style={{ height: `calc(var(--vh, 1vh) * ${c.vh})` }}
      aria-labelledby={labelledBy}
    >
      {back ? <div className="back">{back}</div> : null}
      <div className="front">{children}</div>
    </section>
  );
}

/** A masked line that rises on reveal (data-state driven). `i` staggers it. */
export function Line({ children, i = 0, className = "" }: { children: ReactNode; i?: number; className?: string }) {
  return (
    <span className={`rv ${className}`}>
      <span className="rv-in" style={{ "--i": i } as CSSProperties}>
        {children}
      </span>
    </span>
  );
}

/** Chapter marker: its number, a hairline, its name. Plain, small, sentence case. */
export function Marker({ n, children, i = 0 }: { n: string; children: ReactNode; i?: number }) {
  return (
    <p className="marker rv-fade" style={{ "--i": i } as CSSProperties}>
      <span className="marker-n">{n}</span>
      <span className="marker-rule" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
