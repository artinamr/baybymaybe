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
  fall: [15.62, 16.12] as W,
  black: [16.0, 16.34] as W,
  /** THE REWIND: the whole old half runs backward under one high frame over the town (world.ts). */
  rewind: [16.42, 16.88] as W,
  // NEW WEBSITE: the town's phones, all lit (still one picture); the picture divides (split.ts); Sam on the page.
  nOver: [18.08, 18.7] as W,
  nTap: 19.5,
  nForm: [19.54, 19.68] as W,
  nSend: 19.72,
  // NEW AI: in the empty office the screen wakes, the reply writes itself and goes; Sam's phone lights; the booking.
  nWake: [19.78, 19.86] as W,
  nWrite: [19.88, 20.08] as W,
  nSent: 20.1,
  nBack: [20.1, 20.18] as W,
  nRead: [20.18, 20.5] as W,
  nPick: 20.56,
  nBook: [20.58, 20.82] as W,
  // 3AM: a window lights up across the dark town; the screen answers; the question it can't answer waits.
  nNight: [20.98, 21.38] as W,
  nNightWrite: [21.04, 21.2] as W,
  // NEW PLATFORM: the morning; the question answered; the quote filled in, priced and sent; accepted; the job; paid.
  nMorning: [21.52, 21.82] as W,
  nHand: [21.86, 22.02] as W,
  nQuote: [22.04, 22.36] as W,
  nQuoteSent: 22.38,
  nAccept: [22.5, 22.58] as W,
  nBuild: [22.66, 23.1] as W,
  nInvoice: [23.14, 23.4] as W,
  nPaid: 23.5,
  // NEW FOLLOW-UP.
  nReview: [23.86, 24.36] as W,
  nYear: [24.44, 24.96] as W,
  nRemind: [25.0, 25.34] as W,
  nVan: [25.42, 25.72] as W,
  /** The Saturday: you come out onto Sam's deck and oil it (the grey goes). */
  nOil: [25.52, 25.68] as W,
  // NEW YOU.
  nToday: [26.12, 26.42] as W,
  nClose: [26.46, 26.6] as W,
  nLamp: [26.62, 26.7] as W,
  nStand: [26.7, 26.84] as W,
  nWalk: [26.84, 27.12] as W,
  nIn: [27.12, 27.28] as W,
  nDrive: [27.3, 28.1] as W,
  // END.
  end: [28.45, 29.0] as W,
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
  [0, 18.55],
  [1.0, 18.95],
  [1.66, 19.2],
  [2.3, 19.36],
  [4.6, 19 + 39 / 60],
  [4.72, 19 + 40 / 60],
  [5.66, 19 + 40.5 / 60],
  [5.85, 19.9],
  [6.08, 21.6],
  [6.3, 23.2],
  [6.52, D + 2.6],
  [6.66, D + 6.6],
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
  [16.42, 380 * D + 23 + 48 / 60],
  // The rewind (16.42 to 16.88) runs the hours backward itself (world.ts); the clock lands on the first evening.
  [16.42, 19 + 37 / 60],
  [16.88, 19 + 37 / 60],
  [18.0, 19 + 38 / 60],
  [19.72, 19 + 40 / 60],
  [20.1, 19 + 41 / 60],
  [20.82, 19 + 43 / 60],
  // The night runs to 3am.
  [20.86, 19 + 45 / 60],
  [21.02, D + 3 + 11 / 60],
  [21.36, D + 3 + 18 / 60],
  // ...and on to the morning.
  [21.52, D + 7 + 50 / 60],
  [21.82, D + 8.0],
  [22.38, D + 8 + 20 / 60],
  [22.6, D + 8 + 34 / 60],
  // The job, a week on: its day, from the morning.
  [22.6, 8 * D + 8 + 34 / 60],
  [22.66, 8 * D + 8.6],
  [23.1, 8 * D + 16.0],
  [23.6, 8 * D + 16.6],
  // Two days on: how did it go; then a year.
  [23.6, 10 * D + 16.6],
  [24.36, 10 * D + 17.0],
  [24.44, 10 * D + 17.0],
  [24.96, 13 * D + 9.0],
  [24.96, 375 * D + 9.0],
  [25.36, 375 * D + 9.2],
  // Saturday morning: the van.
  [25.4, 377 * D + 9.0],
  [25.76, 377 * D + 9.3],
  // That day runs on to six o'clock.
  [26.0, 377 * D + 17.92],
  [27.12, 377 * D + 18.12],
  [27.84, 377 * D + 19.2],
  [29.6, 377 * D + 19.5],
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

/**
 * A YEAR AS A TIME-LAPSE: the hours over a year window, with the nights
 * short (seven tenths of each day's turn is daylight, half past six to half
 * past seven), so the sun sweeps and the shadows wheel and the dark is a
 * blink. Starts and ends on the clock's own hours either side of the window.
 */
export function lapseHours(P: number): number | null {
  const run = (w: W, day0: number, h0: number, h1: number, cycles: number) => {
    const u = (h: number) => (h >= 6.5 && h <= 19.5 ? ((h - 6.5) / 13) * 0.7 : h > 19.5 ? 0.7 + ((h - 19.5) / 11) * 0.3 : 0.7 + ((h + 4.5) / 11) * 0.3);
    const warp = (v: number) => (v < 0.7 ? 6.5 + (v / 0.7) * 13 : 19.5 + ((v - 0.7) / 0.3) * 11);
    const u0 = u(h0);
    const u1 = u(h1);
    const total = cycles - 1 + (1 + u1 - u0);
    const phase = u0 + total * smooth(k(P, w));
    const d = Math.floor(phase);
    const hod = warp(phase - d);
    return (day0 + d) * 24 + (hod >= 24 ? hod - 24 : hod);
  };
  if (inW(P, B.year)) return run(B.year, 14, 16.5, 9.5, 3);
  if (inW(P, B.nYear)) return run(B.nYear, 11, 17.0, 9.0, 3);
  return null;
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
  // A year greys it; the Saturday's oil brings it back.
  return smooth(k(P, B.nYear)) * 0.85 * (1 - smooth(k(P, B.nOil)));
}
