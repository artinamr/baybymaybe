import type { ReactNode } from "react";
import { PAGES } from "@/lib/content";
import type { Here } from "@/lib/nav";
import { SubHeader } from "./SubHeader";
import { SubReveal } from "./SubReveal";
import { SiteFooter } from "./SiteFooter";
import { CrumbsLd } from "./JsonLd";

export type Crumb = { name: string; href: string };

/**
 * A page of the site (everything but the home film): the header, the reveal,
 * the page's breadcrumb trail for search engines, its content, and the footer
 * with the audit form. No 3D is loaded here.
 */
export function Page({
  here,
  crumbs,
  children,
  footerForm = true,
}: {
  here?: Here;
  crumbs?: Crumb[];
  children: ReactNode;
  /** The contact page carries the form itself (as #contact), so the footer leaves its copy out. */
  footerForm?: boolean;
}) {
  return (
    <div className="sp">
      <SubReveal />
      {crumbs ? <CrumbsLd crumbs={[{ name: "Home", href: PAGES.home }, ...crumbs]} /> : null}
      <SubHeader here={here} />
      <main id="main" className="sp-main">
        {children}
      </main>
      <SiteFooter form={footerForm} />
    </div>
  );
}

/** The trail above a deep page's title: Home / Services / Websites. The last is where you are. */
export function Crumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb" data-rv>
      <ol>
        <li>
          <a href={PAGES.home}>Home</a>
        </li>
        {crumbs.map((c, i) => (
          <li key={c.href}>
            {i === crumbs.length - 1 ? <span aria-current="page">{c.name}</span> : <a href={c.href}>{c.name}</a>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** A page's kicker: the hairline and a word. */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="sp-kicker" data-rv>
      <span className="sp-rule" aria-hidden /> {children}
    </p>
  );
}

/** The page's title in two voices: ink, then indigo. */
export function Title({ lines, as: As = "h1" }: { lines: [string, string] | [string]; as?: "h1" | "h2" }) {
  return (
    <As className={As === "h1" ? "sp-h1" : "sp-h2"} data-rv>
      {lines[0]}
      {lines[1] ? (
        <>
          <br />
          <em>{lines[1]}</em>
        </>
      ) : null}
    </As>
  );
}

/**
 * The close of a page: one line, the audit (the form at the foot of this
 * page) and a second way on.
 */
export function Closing({ title, line, more }: { title: string; line: string; more?: { label: string; href: string } }) {
  return (
    <section className="sp-block closing" aria-label="Next step">
      <h2 className="sp-h2" data-rv>
        {title}
      </h2>
      <p className="sp-lede" data-rv>
        {line}
      </p>
      <div className="closing-actions" data-rv>
        <a className="pill btn-shine" href="#contact">
          <span>Start with a free audit</span>
          <span className="pill-arrow" aria-hidden>
            <span>→</span>
            <span>→</span>
          </span>
        </a>
        {more ? (
          <a className="text-link" href={more.href}>
            {more.label} <span aria-hidden>→</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}
