import { clamp01, range, smooth, smoother } from "./ease";

/**
 * THE SCRIPT: when everything happens, in P (screens of scroll). The film is
 * a pure function of P (plus real time for breath and small life), so every
 * beat here is a moment or a window, and the world asks "how far through
 * this beat are we" with `k(P, beat)`.
 *
 * The story (docs/STORY.md): one customer, Sam, wants a new deck. The old
 * way: a slow website, an enquiry that waits all night, details typed out
 * three times, a deck built and paid for, then nothing; and the owner at the
 * desk at 11:47pm. The turn. The same evening again: a fast site, a reply in
 * a minute, details typed once, a thank-you and a reminder a year on; the
 * owner closes the laptop at six.
 */

export type W = [number, number];

export const B = {
  // OPEN: the town at dusk; down to the one lit room; the phone.
  samClose: 1.62,
  lift: [1.78, 2.06] as W,
  tap: 2.3,
  // WEBSITE: the slow page (t seconds since the tap), the town's phones, the form.
  site: [2.36, 4.0] as W,
  over: [2.86, 3.9] as W,
  drop: [3.18, 3.66] as W,
  popup: [3.98, 4.08] as W,
  scroll: [4.08, 4.18] as W,
  form: 4.2,
  type: [4.24, 4.6] as W,
  send: 4.68,
  // INBOX: the envelope's flight, the night, the reply at 9:13am.
  fold: [4.86, 5.02] as W,
  fly: [5.02, 5.66] as W,
  land: 5.66,
  night: [5.8, 6.9] as W,
  samCheck: [6.0, 6.24] as W,
  samBed: 6.4,
  ownerIn: [6.86, 7.0] as W,
  find: [7.0, 7.1] as W,
  reply: [7.1, 7.3] as W,
  replySent: 7.32,
  // ADMIN: the spreadsheet, the quote, the cold leads, the job, the invoice, paid.
  sheet: [7.86, 8.46] as W,
  quote: [8.56, 8.98] as W,
  quoteSent: 9.0,
  cold: [8.62, 9.12] as W,
  accept: [9.1, 9.2] as W,
  build: [9.2, 9.74] as W,
  invoice: [9.8, 10.02] as W,
  paid: 10.14,
  // FOLLOW-UP: the deck enjoyed; the row sinking; a year; the other van.
  enjoy: [10.6, 10.9] as W,
  sink: [10.7, 11.1] as W,
  year: [11.1, 11.85] as W,
  search: [11.9, 12.14] as W,
  van: [12.14, 12.6] as W,
  // YOU: 11:47pm at the desk; out over the dark town; back in.
  late: [12.8, 13.6] as W,
  pullOut: [13.6, 14.4] as W,
  backIn: [14.4, 15.0] as W,
  // THE TURN: hands off; the paper comes apart; black; the evening again; the new route.
  handsOff: [15.24, 15.42] as W,
  freeze: [15.42, 15.62] as W,
  fall: [15.62, 16.3] as W,
  black: [16.16, 16.5] as W,
  rewind: [16.36, 16.66] as W,
  assemble: [16.66, 17.44] as W,
  // NEW WEBSITE.
  nLift: [18.04, 18.2] as W,
  nTap: 19.16,
  nOver: [18.5, 19.06] as W,
  nForm: [19.2, 19.56] as W,
  nSend: 19.6,
  // NEW AI.
  nFly: [19.84, 20.0] as W,
  nBack: [20.0, 20.14] as W,
  nRead: [20.16, 20.5] as W,
  nPick: 20.56,
  nBook: [20.6, 20.72] as W,
  n3am: [20.8, 21.5] as W,
  nHand: [21.06, 21.5] as W,
  // NEW PLATFORM.
  nQuote: [21.86, 22.34] as W,
  nQuoteSent: 22.36,
  nAccept: [22.42, 22.54] as W,
  nBuild: [22.6, 23.1] as W,
  nInvoice: [23.14, 23.4] as W,
  nPaid: 23.5,
  // NEW FOLLOW-UP.
  nReview: [23.86, 24.36] as W,
  nYear: [24.44, 24.96] as W,
  nRemind: [25.0, 25.34] as W,
  nVan: [25.36, 25.56] as W,
  // NEW YOU.
  nToday: [26.12, 26.42] as W,
  nClose: [26.46, 26.6] as W,
  nLamp: [26.62, 26.7] as W,
  nStand: [26.7, 26.84] as W,
  nWalk: [26.84, 27.26] as W,
  nDrive: [27.26, 27.96] as W,
  nLater: [27.34, 27.84] as W,
  // END.
  end: [28.0, 28.9] as W,
};

/** How far through a window (0..1, clamped). */
export const k = (P: number, w: W) => clamp01((P - w[0]) / (w[1] - w[0]));
/** Inside a window. */
export const inW = (P: number, w: W) => P >= w[0] && P < w[1];
/** Eased progress through a window. */
export const ke = (P: number, w: W) => smooth(k(P, w));
export const kee = (P: number, w: W) => smoother(k(P, w));
/** A fade in over [a, a+f] and out over [b-f, b]. */
export const bump = (P: number, a: number, b: number, f = 0.08) => range(P, a, a + f) * (1 - range(P, b - f, b));

/**
 * THE CLOCK: P → hours since midnight on the first evening. Within a beat
 * the hours run on; between beats they may jump by whole days (the sky looks
 * the same, the calendar moves). Keys [P, hours]; a repeated P is a jump.
 */
const D = 24;
const CLOCK: [number, number][] = [
  [0, 19 + 38 / 60],
  [4.6, 19 + 39 / 60],
  [4.72, 19 + 40 / 60],
  [5.66, 19 + 40.5 / 60],
  [5.85, 19.9],
  [6.08, 21.6],
  [6.3, 23.2],
  [6.52, D + 2.6],
  [6.74, D + 6.4],
  [6.92, D + 9.0],
  [7.32, D + 9 + 13 / 60],
  [7.8, D + 9.5],
  [8.4, D + 11.0],
  // The afternoon goes by; that evening, the quote, typed at the desk.
  [8.56, D + 20.9],
  [8.98, D + 21.75],
  // Overnight; Sam says yes in the morning.
  [9.1, 2 * D + 7.6],
  [9.2, 2 * D + 8.2],
  // The week of the job (whole days: the light does not jump).
  [9.2, 9 * D + 8.2],
  [9.74, 9 * D + 16.0],
  // The invoice, that night; the money in, the next morning.
  [9.8, 9 * D + 21.3],
  [10.04, 9 * D + 22.0],
  [10.12, 10 * D + 9.0],
  [10.42, 10 * D + 9.6],
  // Summer on the new deck; then a year goes by.
  [10.42, 14 * D + 9.6],
  [10.6, 14 * D + 15.0],
  [11.1, 14 * D + 16.5],
  [11.85, 17 * D + 9.5],
  [11.85, 380 * D + 9.5],
  [12.6, 380 * D + 10.5],
  // The day goes as we cross the town: 11:47pm, any night.
  [12.84, 380 * D + 23 + 47 / 60],
  [15.4, 380 * D + 23 + 48 / 60],
  [16.36, 380 * D + 23 + 48 / 60],
  // The rewind: the same night, back to the first evening (whole days), then the hours run backward.
  [16.36, 23 + 48 / 60],
  [16.66, 19 + 37 / 60],
  [18.0, 19 + 38 / 60],
  [19.6, 19 + 40 / 60],
  [20.0, 19 + 41 / 60],
  [20.72, 19 + 43 / 60],
  // Through the night to 3am.
  [20.8, 19.75],
  [21.06, D + 3 + 12 / 60],
  [21.5, D + 3.5],
  // Wednesday: the measure-up, the quote.
  [21.5, 2 * D + 3.5],
  [21.86, 2 * D + 15.0],
  [22.36, 2 * D + 16.2],
  [22.54, 2 * D + 19.0],
  // The job, a week on: overnight into the morning it starts.
  [22.54, 8 * D + 19.0],
  [22.68, 9 * D + 7.5],
  [23.1, 9 * D + 16.0],
  [23.6, 9 * D + 16.5],
  // Two days on: how did we do; then a year.
  [23.6, 11 * D + 16.5],
  [24.36, 11 * D + 17.0],
  [24.44, 11 * D + 17.0],
  [24.96, 14 * D + 9.0],
  [24.96, 376 * D + 9.0],
  [25.36, 376 * D + 9.2],
  // Saturday morning: the van.
  [25.4, 378 * D + 9.0],
  [25.76, 378 * D + 9.3],
  // Six o'clock, back at the workshop (the day runs by as we cross the town).
  [25.92, 378 * D + 17.92],
  [27.26, 378 * D + 18.15],
  [27.84, 378 * D + 19.2],
  [29.6, 378 * D + 19.5],
];

export function clockAt(P: number): number {
  const c = CLOCK;
  if (P <= c[0][0]) return c[0][1];
  for (let i = 0; i < c.length - 1; i++) {
    const [p0, h0] = c[i];
    const [p1, h1] = c[i + 1];
    if (P >= p0 && P < p1) {
      if (p1 === p0) continue;
      const t = (P - p0) / (p1 - p0);
      // Long runs of time (the night, a year) ease in and out; short ones run straight.
      return h0 + (h1 - h0) * (h1 - h0 > 6 ? smooth(t) : t);
    }
  }
  return c[c.length - 1][1];
}

/** 0 the old way, 1 the new (after the turn's rewind). */
export const isNew = (P: number) => P >= B.rewind[1];

/** Seasons: how weathered the deck is (0 new … 1 grey a year on). */
export function weathered(P: number) {
  if (P < B.build[0]) return 1;
  if (P < B.year[0]) return 0;
  if (P < B.rewind[1]) return smooth(k(P, B.year));
  if (P < B.nBuild[0]) return 1;
  if (P < B.nYear[0]) return 0;
  return smooth(k(P, B.nYear)) * 0.85;
}
