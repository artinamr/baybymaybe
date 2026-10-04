import type { Metadata } from "next";
import { SubHeader } from "@/components/site/SubHeader";
import { LogoMark } from "@/components/chrome/LogoMark";
import { PAGES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Not found | Nerodyn",
};

/** THE 404 — the same paper and voice: plainly lost, and the ways back. */
export default function NotFound() {
  return (
    <div className="sp nf">
      <SubHeader audit={`${PAGES.home}#contact`} />
      <main id="main" className="sp-main nf-main">
        <LogoMark className="nf-mark" />
        <p className="sp-kicker">
          <span className="sp-rule" aria-hidden /> 404
        </p>
        <h1 className="sp-h1 nf-h1">
          Nothing here.
          <br />
          <em>The stone is elsewhere.</em>
        </h1>
        <p className="sp-lede">The page you were after has moved, or never existed. Everything else is where you left it.</p>
        <nav className="nf-links" aria-label="Ways back">
          <a className="pill btn-shine" href={PAGES.home}>
            <span>Back to the home page</span>
            <span className="pill-arrow" aria-hidden>
              <span>→</span>
              <span>→</span>
            </span>
          </a>
          <a className="text-link" href={PAGES.methodology}>
            Methodology
          </a>
          <a className="text-link" href={PAGES.faq}>
            Questions
          </a>
          <a className="text-link" href={`${PAGES.home}#contact`}>
            Free audit
          </a>
        </nav>
      </main>
    </div>
  );
}
