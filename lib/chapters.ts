/**
 * THE CHAPTER TABLE — contract (docs/SPEC.md §1). Every other module derives
 * chapter geometry from here; do not restate these numbers elsewhere.
 *
 * Scroll coordinate: S = scrollY / vh ("screens"). Section heights are exact
 * multiples of the stable viewport unit `--vh` (set by lib/scroll.ts from
 * window.innerHeight), so each chapter's top S0 is the running sum below and
 * global S keys in the choreography hold at every viewport.
 */

export type ChapterId = "potential" | "statement" | "build" | "why" | "audit";

export type ChapterDef = {
  id: ChapterId;
  /** Two-digit index shown in the chapter index / eyebrows. */
  num: string;
  /** Label in the chapter index + nav. */
  label: string;
  /** Section height in vh. */
  vh: number;
  /** Top of the chapter in S (screens). Derived: running sum of vh/100. */
  S0: number;
  /**
   * Sticky layers hold while local s ∈ [0, holdEnd]; holdEnd = vh/100 − 1.
   * `false` = the chapter's content flows natively (hero, work list).
   */
  sticky: boolean;
  holdEnd: number;
  /** Where the chapter index / nav jump lands, in global S. */
  jumpS: number;
  /** Specimen card copy for this chapter. */
  specimen: { name: string; line: string };
  /** Local s at which the chapter's type reveals (default −0.35: as it scrolls in). */
  revealAt?: number;
};

const RAW: Omit<ChapterDef, "S0" | "holdEnd">[] = [
  {
    id: "potential",
    num: "00",
    label: "Intro",
    vh: 100,
    sticky: false,
    jumpS: 0,
    specimen: { name: "Nerodyn", line: "Digital infrastructure and AI automation — one team." },
  },
  {
    id: "statement",
    num: "01",
    label: "The studio",
    vh: 180,
    sticky: true,
    jumpS: 1.62,
    specimen: { name: "The studio", line: "Websites, platforms and AI — one team." },
  },
  {
    id: "build",
    num: "02",
    label: "What we build",
    vh: 430,
    sticky: true,
    jumpS: 3.72,
    // The type waits for the shatter to play out on its own.
    revealAt: 0.12,
    specimen: { name: "What we build", line: "Websites, platforms, AI automation." },
  },
  {
    id: "why",
    num: "03",
    label: "Why Nerodyn",
    vh: 320,
    sticky: true,
    jumpS: 7.62,
    // The type waits for the stone to land.
    revealAt: -0.05,
    specimen: { name: "Why Nerodyn", line: "One team builds it. You own it." },
  },
  {
    id: "audit",
    num: "04",
    label: "Let's talk",
    vh: 220,
    sticky: true,
    jumpS: 10.75,
    specimen: { name: "Let's talk", line: "A free, honest audit of what you have." },
  },
];

export const CHAPTERS: ChapterDef[] = (() => {
  let acc = 0;
  return RAW.map((c) => {
    const def = { ...c, S0: acc, holdEnd: c.vh / 100 - 1 };
    acc += c.vh / 100;
    return def;
  });
})();

/** Total page height in vh (1250). */
export const PAGE_VH = CHAPTERS.reduce((a, c) => a + c.vh, 0);
/** Maximum reachable S (page height − one viewport), 11.5. */
export const S_MAX = PAGE_VH / 100 - 1;

export const CHAPTER_INDEX: Record<ChapterId, number> = Object.fromEntries(
  CHAPTERS.map((c, i) => [c.id, i])
) as Record<ChapterId, number>;

export function chapter(id: ChapterId): ChapterDef {
  return CHAPTERS[CHAPTER_INDEX[id]];
}
