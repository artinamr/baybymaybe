import type { ChapterId } from "@/content/story";

/**
 * THE FILM'S CLOCK, in screens of scroll: P = scrollY / viewport height over
 * the film's track (docs/STORY.md). Every chapter owns a span of P; inside it
 * the main card (kicker, title, line, fact) and the closing beat have their
 * windows, and the rests are the composed frames the film settles on (the
 * arrow keys step between them, autoplay holds on them to read).
 */

export const FILM_LEN = 29.6;

export type Span = { id: ChapterId; P0: number; P1: number };

export const SPANS: Span[] = [
  { id: "open", P0: 0, P1: 2.4 },
  { id: "website", P0: 2.4, P1: 5.0 },
  { id: "inbox", P0: 5.0, P1: 7.8 },
  { id: "admin", P0: 7.8, P1: 10.6 },
  { id: "followup", P0: 10.6, P1: 12.8 },
  { id: "you", P0: 12.8, P1: 15.0 },
  { id: "turn", P0: 15.0, P1: 18.0 },
  { id: "new-website", P0: 18.0, P1: 19.8 },
  { id: "new-ai", P0: 19.8, P1: 21.8 },
  { id: "new-platform", P0: 21.8, P1: 23.8 },
  { id: "new-followup", P0: 23.8, P1: 25.8 },
  { id: "new-you", P0: 25.8, P1: 28.0 },
  { id: "end", P0: 28.0, P1: FILM_LEN },
];

export const span = (id: ChapterId) => SPANS.find((s) => s.id === id)!;

/** The chapter a point of the film belongs to (index into SPANS). */
export function chapterAt(P: number): number {
  for (let i = SPANS.length - 1; i >= 0; i--) if (P >= SPANS[i].P0) return i;
  return 0;
}

/** When each card shows: [in, out] in P. */
export type Card = { id: ChapterId; part: "main" | "beat"; in: number; out: number };

/**
 * The cards' windows. The main card arrives just after its chapter starts and
 * leaves before the beat; the beat closes the chapter.
 */
export const CARDS: Card[] = [
  { id: "open", part: "main", in: 0.12, out: 1.14 },
  { id: "open", part: "beat", in: 1.26, out: 1.94 },
  { id: "website", part: "main", in: 2.5, out: 3.92 },
  { id: "website", part: "beat", in: 4.44, out: 4.96 },
  { id: "inbox", part: "main", in: 5.12, out: 6.62 },
  { id: "inbox", part: "beat", in: 7.36, out: 7.78 },
  { id: "admin", part: "main", in: 7.92, out: 9.06 },
  { id: "admin", part: "beat", in: 10.08, out: 10.56 },
  { id: "followup", part: "main", in: 10.72, out: 11.9 },
  { id: "followup", part: "beat", in: 12.36, out: 12.78 },
  { id: "you", part: "main", in: 12.92, out: 13.86 },
  { id: "you", part: "beat", in: 14.0, out: 14.86 },
  { id: "turn", part: "main", in: 15.04, out: 15.48 },
  { id: "turn", part: "beat", in: 17.4, out: 17.96 },
  { id: "new-website", part: "main", in: 18.12, out: 18.86 },
  { id: "new-ai", part: "main", in: 19.92, out: 21.62 },
  { id: "new-platform", part: "main", in: 21.92, out: 23.64 },
  { id: "new-followup", part: "main", in: 23.92, out: 25.64 },
  { id: "new-you", part: "main", in: 25.92, out: 27.3 },
];

/** The fact inside a main card comes in a little after the title. */
export const FACT_DELAY = 0.42;

/**
 * Composed frames: where the film comes to rest when you stop, and where the
 * arrow keys and autoplay stop to let you read. Kept clear of the cards'
 * edges, so a rest always has its words fully in.
 */
export const RESTS: number[] = [
  0, 0.62, 1.66, 2.3, 2.9, 3.5, 4.3, 4.74, 5.42, 5.98, 6.5, 7.1, 7.58, 8.3, 8.9, 9.5, 10.3, 11.0, 11.6, 12.56, 13.3, 14.4, 15.4, 16.9, 17.7, 18.4,
  // Both sides: the page; the office writing; the reply; booked; 3am; the morning; the quote; accepted; the job; paid;
  // how did it go; a year; the reminder; the van; six o'clock; the laptop shut; one picture again.
  19.62, 20.0, 20.3, 20.7, 21.16, 22.0, 22.3, 22.52, 23.0, 23.5, 24.2, 24.7, 25.2, 25.78, 26.3, 26.9, 27.9, FILM_LEN,
];

/** How long autoplay holds on a rest (seconds): time to read what is on screen. */
export function dwellAt(P: number): number {
  if (P >= FILM_LEN - 0.01) return 0;
  if (P < 0.01) return 1.2;
  // Moments that need to land: the turn's silence, the last image of each half.
  if ([14.4, 15.4, 27.9].some((r) => Math.abs(r - P) < 0.03)) return 4.4;
  if ([2.3, 5.42, 9.5, 16.9, 22.3].some((r) => Math.abs(r - P) < 0.03)) return 2.2;
  return 3.4;
}

/** The film's own pace at P, in seconds a screen: slower for the slow page, the long night, the flight, the turn. */
export function paceAt(P: number): number {
  return P > 5.0 && P < 5.7 ? 6.2
    : P > 5.7 && P < 7.0 ? 7.0
    : P > 16.36 && P < 16.94 ? 11.0
    : P > 15.0 && P < 17.4 ? 7.4
    : P > 9.0 && P < 9.6 ? 6.4
    : P > 11.0 && P < 12.0 ? 6.4
    // Both sides: the picture parts and each half comes down to its place; a pane's new frame; one picture again.
    : P > 18.9 && P < 19.46 ? 9.0
    : P > 20.84 && P < 21.04 ? 7.6
    : P > 25.4 && P < 25.72 ? 7.0
    : P > 27.3 && P < 27.95 ? 9.0
    : P > 26.4 && P < 27.3 ? 6.6
    : 5.4;
}

/**
 * THE SCROLL'S CEILING: however hard the wheel is thrown, the film runs no
 * faster than this many screens a second (about 2.6 times its own playing
 * pace: brisk, never a blur). Scrolling is steering, not teleporting.
 */
export function capAt(P: number): number {
  return 2.6 / paceAt(P);
}

/** Autoplay's travel between two rests. */
export function travelDuration(from: number, to: number): number {
  const distance = to - from;
  const seconds = paceAt((from + to) * 0.5);
  return Math.max(1200, distance * seconds * 1000 - Math.max(0, distance - 1) * 900);
}

/** Look-dev (`?at=`): which window is open at P (for the overlay's initial state). */
export function cardOn(c: Card, P: number): boolean {
  return P >= c.in && P < c.out;
}
