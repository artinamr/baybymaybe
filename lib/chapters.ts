/**
 * THE CHAPTER TABLE — contract (docs/SPEC.md §1). Every other module derives
 * chapter geometry from here; do not restate these numbers elsewhere.
 *
 * TWO CLOCKS. The page scrolls in S = scrollY / vh ("screens"). The 3D film
 * runs on its own clock, FILM TIME F, in which every key in lib/choreo.ts is
 * written. They are the same until the first PAGE section:
 *
 *   film chapters   the pinned scenes (hero, statement, what we build, why,
 *                   let's talk) — sized in exact multiples of --vh; film time
 *                   runs 1:1 with the scroll through them.
 *   page sections   ordinary content (selected work, how we work)
 *                   that scrolls up OVER the film like a sheet of paper. The
 *                   film HOLDS while one is on screen — from the last screen of
 *                   the scene before (the sheet rising over its closing frame)
 *                   to the section's end (the sheet leaving, the scene
 *                   revealed again exactly where it stopped) — then runs on.
 *
 * Page sections flow with their content, so their size (and every page S0
 * after them) is MEASURED from the DOM (lib/scroll.ts → measureChapters); the
 * film's clock never changes: film chapter F0s are fixed sums of film vh.
 */

export type ChapterId = "potential" | "statement" | "build" | "work" | "why" | "process" | "audit";
export type ChapterKind = "film" | "page";

export type ChapterDef = {
  id: ChapterId;
  /** Two-digit index shown in the chapter index / eyebrows. */
  num: string;
  /** Label in the chapter index + nav. */
  label: string;
  kind: ChapterKind;
  /** Section height in vh (film: exact; page: the minimum — it grows with its content). */
  vh: number;
  /** Top of the chapter in page S (screens). Estimated from vh, then measured. */
  S0: number;
  /** End of the chapter in page S (measured). */
  S1: number;
  /** Film time at the top of a film chapter; for a page section, the film time it holds at. */
  F0: number;
  /**
   * Sticky layers hold while local s ∈ [0, holdEnd]; holdEnd = vh/100 − 1.
   * `false` = the chapter's content flows natively (hero, page sections).
   */
  sticky: boolean;
  holdEnd: number;
  /** Where the chapter index / nav jump lands: FILM time for film chapters (page sections land on their top). */
  jumpF: number;
  /** Specimen card copy for this chapter. */
  specimen: { name: string; line: string };
  /** Local s at which the chapter's type reveals (default −0.35: as it scrolls in). */
  revealAt?: number;
};

type Raw = Omit<ChapterDef, "S0" | "S1" | "F0" | "holdEnd">;

const RAW: Raw[] = [
  {
    id: "potential",
    num: "00",
    label: "Intro",
    kind: "film",
    vh: 100,
    sticky: false,
    jumpF: 0,
    specimen: { name: "Nerodyn", line: "Digital infrastructure and AI automation — one team." },
  },
  {
    id: "statement",
    num: "01",
    label: "The studio",
    kind: "film",
    vh: 180,
    sticky: true,
    jumpF: 1.62,
    specimen: { name: "The studio", line: "Websites, platforms and AI — one team." },
  },
  {
    // F 2.8 → 5.94 (the shatter, websites, platforms, AI), then one screen
    // held on the AI's last frame while the next sheet rises over it.
    id: "build",
    num: "02",
    label: "What we build",
    kind: "film",
    vh: 414,
    sticky: true,
    jumpF: 3.72,
    // The type waits for the shatter to play out on its own.
    revealAt: 0.12,
    specimen: { name: "What we build", line: "Websites, platforms, AI automation." },
  },
  {
    id: "work",
    num: "03",
    label: "Work",
    kind: "page",
    vh: 200,
    sticky: false,
    jumpF: 0,
    specimen: { name: "Selected work", line: "What we have built, and what it changed." },
  },
  {
    // F 5.94 → 9.3 (the gather, the colossus, the three claims), then one
    // screen held on the closed colossus while the next sheet rises.
    id: "why",
    num: "04",
    label: "Why Nerodyn",
    kind: "film",
    vh: 436,
    sticky: true,
    jumpF: 7.62,
    // The type waits for the stone to gather (F 7.05).
    revealAt: 1.11,
    specimen: { name: "Why Nerodyn", line: "One team builds it. You own it." },
  },
  {
    // The five stages on one line. (The questions live on /faq/.)
    id: "process",
    num: "05",
    label: "How we work",
    kind: "page",
    vh: 100,
    sticky: false,
    jumpF: 0,
    specimen: { name: "How we work", line: "From first call to live." },
  },
  {
    // F 9.3 → 11.5: down to the floor, and let's talk. (Its first screen is
    // the last sheet leaving: the film still held there.)
    id: "audit",
    num: "06",
    label: "Let’s talk",
    kind: "film",
    vh: 320,
    sticky: true,
    jumpF: 10.75,
    // The words rise as the stone settles on the floor between them.
    revealAt: 1.2,
    specimen: { name: "Let’s talk", line: "A free, honest audit of what you have." },
  },
];

export const CHAPTERS: ChapterDef[] = (() => {
  let s = 0;
  return RAW.map((c) => {
    const def: ChapterDef = { ...c, S0: s, S1: s + c.vh / 100, F0: 0, holdEnd: c.vh / 100 - 1 };
    s += c.vh / 100;
    return def;
  });
})();

/*
 * Film time of each film chapter: sums of film vh, minus the one held screen
 * at the end of any film chapter a page section follows (that screen shows
 * the scene's closing frame while the sheet rises). Fixed — never measured.
 */
(() => {
  let f = 0;
  for (let i = 0; i < CHAPTERS.length; i++) {
    const c = CHAPTERS[i];
    if (c.kind !== "film") {
      c.F0 = f;
      continue;
    }
    c.F0 = f;
    const next = CHAPTERS[i + 1];
    f += c.vh / 100 - (next && next.kind === "page" ? 1 : 0);
  }
})();

/** Film time at the very end of the page (the last frame of the film). */
export const F_MAX = (() => {
  const last = CHAPTERS[CHAPTERS.length - 1];
  return last.F0 + last.vh / 100 - 1;
})();

/** Page S of the footer's top edge (measured): past it the footer's paper covers the whole screen. */
export let FOOT_S = Infinity;

/** Page S of the last reachable frame (re-measured with the page). */
export let S_MAX = CHAPTERS[CHAPTERS.length - 1].S1 - 1;

export const CHAPTER_INDEX: Record<ChapterId, number> = Object.fromEntries(
  CHAPTERS.map((c, i) => [c.id, i])
) as Record<ChapterId, number>;

export function chapter(id: ChapterId): ChapterDef {
  return CHAPTERS[CHAPTER_INDEX[id]];
}

/* ------------------------------------------------------------------------ */
/* Holds: where the film stands still while a page section is on screen      */
/* ------------------------------------------------------------------------ */

/** Page-S intervals over which the film holds, and the film time it holds at. */
export const holds: { S0: number; S1: number; F: number }[] = [];

function computeHolds() {
  holds.length = 0;
  for (let i = 0; i < CHAPTERS.length; i++) {
    const c = CHAPTERS[i];
    if (c.kind !== "page") continue;
    const prev = CHAPTERS[i - 1];
    // A run of page sections is one hold: from the last screen of the film
    // chapter before it to the end of the run.
    if (prev && prev.kind === "page") continue;
    let j = i;
    while (CHAPTERS[j + 1] && CHAPTERS[j + 1].kind === "page") j++;
    holds.push({ S0: c.S0 - 1, S1: CHAPTERS[j].S1, F: c.F0 });
  }
}
computeHolds();

/**
 * Update the page geometry from the DOM (page sections flow with their
 * content). `tops[i]` / `ends[i]` in page S. Called by lib/scroll.ts.
 */
export function measureChapters(tops: number[], ends: number[], footTop = Infinity): void {
  FOOT_S = footTop;
  for (let i = 0; i < CHAPTERS.length; i++) {
    if (!Number.isFinite(tops[i]) || !Number.isFinite(ends[i])) continue;
    CHAPTERS[i].S0 = tops[i];
    CHAPTERS[i].S1 = ends[i];
  }
  S_MAX = CHAPTERS[CHAPTERS.length - 1].S1 - 1;
  computeHolds();
}

/** Softened hold edges (screens): the film eases to a stop and away again, never a jolt. */
const EDGE = 0.18;

function softClamp(x: number, len: number): number {
  // ≈ clamp(x, 0, len) with its two corners rounded over ±EDGE.
  const y = x < EDGE ? (x <= -EDGE ? 0 : ((x + EDGE) * (x + EDGE)) / (4 * EDGE)) : x;
  const d = y - len;
  if (d <= -EDGE) return y;
  if (d >= EDGE) return len;
  return len - ((EDGE - d) * (EDGE - d)) / (4 * EDGE);
}

/** Film time at page S. */
export function filmS(S: number): number {
  let held = 0;
  for (const h of holds) held += softClamp(S - h.S0, h.S1 - h.S0);
  return Math.max(0, Math.min(F_MAX, S - held));
}

/** Page S where film time F is first on screen (a held frame: the start of its hold). */
export function pageS(F: number): number {
  // filmS is continuous and never decreasing: the first page S at which the
  // film reaches F exactly (through the holds' soft corners too), by bisection.
  let lo = 0;
  let hi = S_MAX + 1;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (filmS(mid) < F - 1e-7) lo = mid;
    else hi = mid;
  }
  // A held frame is shown from the hold's start — where its scene's type is
  // still fully in place (the film is a breath from stopping; the sheet has
  // not begun to rise), not a fifth of a screen later.
  for (const h of holds) if (hi > h.S0 && hi <= h.S0 + EDGE + 1e-6) return h.S0;
  return hi;
}

/** Whether page S sits inside a run of page sections (reading), not a film scene. */
export function inPage(S: number): boolean {
  for (const h of holds) if (S > h.S0 + 1 + 0.02 && S < h.S1 - 1 - 0.02) return true;
  return false;
}

/** Where a chapter's jump lands, in page S. */
export function jumpS(c: ChapterDef): number {
  return c.kind === "page" ? c.S0 : pageS(c.jumpF);
}

/** Whether page sections cover the whole viewport at page S (the film is hidden: skip drawing it). */
export function covered(S: number): boolean {
  for (const h of holds) if (S >= h.S0 + 1 + 0.01 && S <= h.S1 - 1 - 0.01) return true;
  // The footer, once its top edge is above the screen's (it runs to the page end).
  return S >= FOOT_S + 0.01;
}
