/**
 * THE CHAPTER TABLE — contract (docs/SPEC.md §1). Every other module derives
 * chapter geometry from here; do not restate these numbers elsewhere.
 *
 * Scroll coordinate: S = scrollY / vh ("screens"). Section heights are exact
 * multiples of the stable viewport unit `--vh` (set by lib/scroll.ts from
 * window.innerHeight), so each chapter's top S0 is the running sum below and
 * global S keys in the choreography hold at every viewport.
 */

export type ChapterId = "potential" | "cut" | "order" | "current" | "field" | "method" | "mark";

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
};

const RAW: Omit<ChapterDef, "S0" | "holdEnd">[] = [
  {
    id: "potential",
    num: "00",
    label: "Intro",
    vh: 100,
    sticky: false,
    jumpS: 0,
    specimen: { name: "Nerodyn", line: "Websites, platforms and AI automation — one studio." },
  },
  {
    id: "cut",
    num: "01",
    label: "Studio",
    vh: 200,
    sticky: true,
    jumpS: 1.1,
    specimen: { name: "The studio", line: "Two disciplines, one team." },
  },
  {
    id: "order",
    num: "02",
    label: "Infrastructure",
    vh: 260,
    sticky: true,
    jumpS: 3.4,
    specimen: { name: "Digital infrastructure", line: "Interface, platform, data and foundation." },
  },
  {
    id: "current",
    num: "03",
    label: "AI automation",
    vh: 260,
    sticky: true,
    jumpS: 5.95,
    specimen: { name: "AI automation", line: "In your product, and in your workspace." },
  },
  {
    id: "field",
    num: "04",
    label: "Work",
    vh: 220,
    sticky: false,
    jumpS: 8.3,
    specimen: { name: "Selected work", line: "Case studies in preparation." },
  },
  {
    id: "method",
    num: "05",
    label: "Method",
    vh: 220,
    sticky: true,
    jumpS: 10.6,
    specimen: { name: "Method", line: "Discover, architect, build, automate." },
  },
  {
    id: "mark",
    num: "06",
    label: "Contact",
    vh: 220,
    sticky: true,
    jumpS: 13.25,
    specimen: { name: "Contact", line: "We reply to every message personally." },
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

/** Total page height in vh (1480). */
export const PAGE_VH = CHAPTERS.reduce((a, c) => a + c.vh, 0);
/** Maximum reachable S (page height − one viewport), 13.8. */
export const S_MAX = PAGE_VH / 100 - 1;

export const CHAPTER_INDEX: Record<ChapterId, number> = Object.fromEntries(
  CHAPTERS.map((c, i) => [c.id, i])
) as Record<ChapterId, number>;

export function chapter(id: ChapterId): ChapterDef {
  return CHAPTERS[CHAPTER_INDEX[id]];
}
