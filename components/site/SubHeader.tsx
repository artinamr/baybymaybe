import { LogoMark } from "@/components/chrome/LogoMark";
import { PAGES } from "@/lib/content";
import { NAV, type Here } from "@/lib/nav";
import { SubMenu } from "./SubMenu";

/**
 * The header of the site's own pages: the name back home, the site's pages,
 * and the audit — which lands on the form at the foot of this very page (the
 * 404 points it at the home page's). On phones the pages fold into a menu.
 */
export function SubHeader({ here, audit = "#contact" }: { here?: Here; audit?: string }) {
  return (
    <header className="sp-nav">
      <a href={PAGES.home} className="sp-brand" aria-label="Nerodyn — home">
        <LogoMark className="sp-mark" />
        <span>Nerodyn</span>
      </a>
      <nav className="sp-links" aria-label="Site">
        {NAV.map((l) => (
          <a key={l.key} href={l.href} className="sp-link" aria-current={here === l.key ? "page" : undefined}>
            {l.label}
          </a>
        ))}
        <a href={audit} className="sp-cta">
          Free audit <span aria-hidden>{audit.startsWith("#") ? "↓" : "→"}</span>
        </a>
        <SubMenu here={here} audit={audit} />
      </nav>
    </header>
  );
}
