import { range, smoother } from "./ease";

/**
 * BOTH SIDES (round 27, docs/STORY.md "The new way: both sides"): after the
 * turn the picture divides into two locked-off shots of the same moment, the
 * customer on one side (A: left, or the top on a portrait screen) and the
 * business on the other (B: right, or the bottom). Between them, a gap of the
 * site's own paper: a diptych on a page, never a seam of light.
 *
 * `open` is how far the gap is open (0 one picture … 1 the full gap); `at`
 * is where its middle sits along the split (0..1 across, or down from the
 * top). The panes' cameras live in camera.ts (`PANE_KEYS`).
 */

/** The gap at full width: a share of the screen's width (or height, stacked). */
export const GAP = 0.014;

/** When the picture divides, and when it becomes one again: [opening, open, closing, closed] in P. */
export const SPLIT = { open: [18.92, 19.2] as [number, number], close: [27.42, 27.8] as [number, number] };

/** Whether the panes are drawn at P (a little either side of the gap, so the cameras meet exactly). */
export const splitOn = (P: number) => P >= SPLIT.open[0] && P < SPLIT.close[1];

export type SplitState = { on: boolean; open: number; at: number };

/** Sam's pane turned like a page: closing, shut, shut, open again (P). Its camera changes while it is shut. */
export const TURN_A = [22.68, 22.8, 22.88, 23.0] as const;

export function splitAt(P: number, out: SplitState = { on: false, open: 0, at: 0.5 }): SplitState {
  out.on = splitOn(P);
  out.open = out.on ? smoother(range(P, SPLIT.open[0], SPLIT.open[1])) * (1 - smoother(range(P, SPLIT.close[0], SPLIT.close[1]))) : 0;
  // (During the build's day Sam's pane folds shut into the gap and opens again on a new shot: a page turned.)
  const fold = smoother(range(P, TURN_A[0], TURN_A[1])) * (1 - smoother(range(P, TURN_A[2], TURN_A[3])));
  out.at = 0.5 * (1 - fold);
  // (As the pane shuts, its gap goes with it: the other pane fills the page.)
  out.open *= Math.min(1, out.at / 0.06);
  return out;
}

/**
 * The panes in the frame, as shares of it: pane A then pane B, each
 * [x0, y0, x1, y1] with y measured DOWN from the top (screen order).
 */
export function paneRects(s: SplitState, stacked: boolean): [number, number, number, number][] {
  const h = (GAP * s.open) / 2;
  const a = Math.max(0.002, s.at - h);
  const b = Math.min(0.998, s.at + h);
  if (stacked)
    return [
      [0, 0, 1, a],
      [0, b, 1, 1],
    ];
  return [
    [0, 0, a, 1],
    [b, 0, 1, 1],
  ];
}
