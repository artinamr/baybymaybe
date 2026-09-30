import { LogoMark } from "@/components/chrome/LogoMark";
import { PAGES } from "@/lib/content";

type Here = "methodology" | "faq" | "privacy" | "terms";

/**
 * The header of the site's own pages (methodology, questions, the legal
 * pages): the name back home, the pages a buyer looks for, and the audit —
 * which lands on the form at the foot of this very page.
 */
export function SubHeader({ here, audit = "#contact" }: { here?: Here; audit?: string }) {
  const link = (key: Here, href: string, label: string) => (
    <a href={href} className="sp-link" aria-current={here === key ? "page" : undefined}>
      {label}
    </a>
  );
  return (
    <header className="sp-nav">
      <a href={PAGES.home} className="sp-brand" aria-label="Nerodyn — home">
        <LogoMark className="sp-mark" />
        <span>Nerodyn</span>
      </a>
      <nav className="sp-links" aria-label="Site">
        <a href={`${PAGES.home}#build`} className="sp-link">
          What we build
        </a>
        <a href={`${PAGES.home}#work`} className="sp-link">
          Work
        </a>
        {link("methodology", PAGES.methodology, "Methodology")}
        {link("faq", PAGES.faq, "Questions")}
        <a href={audit} className="sp-cta">
          Free audit <span aria-hidden>{audit.startsWith("#") ? "↓" : "→"}</span>
        </a>
      </nav>
    </header>
  );
}
