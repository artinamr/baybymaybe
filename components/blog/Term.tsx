import type { ReactNode } from "react";
import { PAGES } from "@/lib/content";
import { term as findTerm, type TermId } from "@/content/blog/glossary";

/**
 * A word from the glossary, on its first use in an article: a link to its
 * definition (/blog/glossary/#id), and on a screen with a pointer the
 * definition itself on hover or keyboard focus. Screen readers hear it as the
 * link's description. Use it once per term per article (the definition's id
 * must be unique on the page); the term's id is checked by TypeScript.
 */
export function Term({ id, children }: { id: TermId; children: ReactNode }) {
  const t = findTerm(id);
  const tip = `gt-${id}`;
  return (
    <span className="term">
      <a className="term-a" href={`${PAGES.glossary}#${id}`} aria-describedby={tip}>
        {children}
      </a>
      <span className="term-tip" id={tip} role="tooltip">
        <span className="term-tip-h">
          {t.term}
          {t.also ? <span>{t.also}</span> : null}
        </span>
        {t.def}
      </span>
    </span>
  );
}
