import { PAGES } from "./content";

/** Where a page sits in the site's navigation (the header marks it). */
export type Here = "services" | "work" | "methodology" | "blog" | "studio" | "pricing" | "contact" | "faq" | "privacy" | "terms";

/**
 * The site's main navigation — the same on every page, home included (the
 * home page's own sections are reached from its phone menu). The free
 * audit is the header's pill, not one of these. Studio lives in the footer
 * (six links and the pill don't fit the header at 1100–1280 px).
 */
export const NAV: { key: Here; label: string; href: string }[] = [
  { key: "services", label: "Services", href: PAGES.services },
  { key: "work", label: "Work", href: PAGES.work },
  { key: "methodology", label: "Methodology", href: PAGES.methodology },
  { key: "blog", label: "Blog", href: PAGES.blog },
  { key: "contact", label: "Contact", href: PAGES.contact },
];
