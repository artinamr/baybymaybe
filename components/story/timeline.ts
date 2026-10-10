import type { ChapterId } from "@/content/story";

/**
 * THE FILM'S CLOCK, in screens of scroll: P = scrollY / viewport height over
 * the film's track (docs/STORY.md). Every chapter owns a span of P; inside it
 * the main card (kicker, title, line, fact) and the closing beat have their
 * windows, and the rests are the composed frames the film settles on (the
 * arrow keys step between them, autoplay holds on them to read).
 */

export const FILM_LEN = 27.4;

export type Span = { id: ChapterId; P0: number; P1: number };

export const SPANS: Span[] = [
  { id: "open", P0: 0, P1: 2.2 },
  { id: "website", P0: 2.2, P1: 4.6 },
  { id: "inbox", P0: 4.6, P1: 7.2 },
  { id: "admin", P0: 7.2, P1: 9.6 },
  { id: "followup", P0: 9.6, P1: 11.6 },
  { id: "you", P0: 11.6, P1: 14 },
  { id: "turn", P0: 14, P1: 17 },
  { id: "new-website", P0: 17, P1: 18.6 },
  { id: "new-ai", P0: 18.6, P1: 20.2 },
  { id: "new-platform", P0: 20.2, P1: 21.8 },
  { id: "new-followup", P0: 21.8, P1: 23.8 },
  { id: "new-you", P0: 23.8, P1: 25.8 },
  { id: "end", P0: 25.8, P1: FILM_LEN },
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
 * leaves before the beat; the beat closes the chapter. The turn's two lines
 * and the opening are timed to their pictures.
 */
export const CARDS: Card[] = [
  { id: "open", part: "main", in: 0.12, out: 1.12 },
  { id: "open", part: "beat", in: 1.24, out: 2.08 },
  { id: "website", part: "main", in: 2.32, out: 3.74 },
  { id: "website", part: "beat", in: 3.86, out: 4.54 },
  { id: "inbox", part: "main", in: 4.72, out: 6.3 },
  { id: "inbox", part: "beat", in: 6.42, out: 7.14 },
  { id: "admin", part: "main", in: 7.32, out: 8.76 },
  { id: "admin", part: "beat", in: 8.88, out: 9.54 },
  { id: "followup", part: "main", in: 9.72, out: 10.62 },
  { id: "followup", part: "beat", in: 10.74, out: 11.6 },
  { id: "you", part: "main", in: 11.74, out: 12.78 },
  { id: "you", part: "beat", in: 12.92, out: 13.94 },
  { id: "turn", part: "main", in: 14.34, out: 14.96 },
  { id: "turn", part: "beat", in: 16.34, out: 16.96 },
  { id: "new-website", part: "main", in: 17.12, out: 18.5 },
  { id: "new-ai", part: "main", in: 18.72, out: 20.1 },
  { id: "new-platform", part: "main", in: 20.32, out: 21.7 },
  { id: "new-followup", part: "main", in: 21.94, out: 23.7 },
  { id: "new-you", part: "main", in: 23.94, out: 25.7 },
];

/** The fact inside a main card comes in a little after the title. */
export const FACT_DELAY = 0.42;

/**
 * Composed frames: where the film comes to rest when you stop, and where the
 * arrow keys and autoplay stop to let you read. Kept clear of the cards'
 * edges, so a rest always has its words fully in.
 */
export const RESTS: number[] = [
  0, 0.66, 1.7, 2.92, 3.42, 4.2, 5.4, 5.98, 6.8, 7.9, 8.4, 9.2, 10.2, 11.5, 12.3, 12.7, 13.5, 14.66, 16.66, 17.8, 19.4,
  21, 22.6, 23.3, 24.7, 25.62, FILM_LEN,
];

/** How long autoplay holds on a rest (seconds): time to read what is on screen. */
export function dwellAt(P: number): number {
  if (P >= FILM_LEN - 0.01) return 0;
  if (P < 0.01) return 1.2;
  return 3.4;
}

/** Look-dev (`?at=`): which window is open at P (for the overlay's initial state). */
export function cardOn(c: Card, P: number): boolean {
  return P >= c.in && P < c.out;
}
