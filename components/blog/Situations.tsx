"use client";

import { useState } from "react";
import { Photo } from "@/components/site/Photo";
import type { Photo as PhotoData } from "@/content/images";

export type Situation = {
  slug: string;
  href: string;
  situation: string;
  title: string;
  short: string;
  minutes: number;
  cover: PhotoData;
};

/**
 * START WHERE YOU ARE: the reader's situation, in their words, leading to the
 * article that answers it. On a wide screen the row under the pointer (or
 * keyboard focus) brings its article's photograph and short answer into the
 * panel alongside, so the answer is there before the click. On a phone it is
 * a plain list. The panel repeats what the article says, so it is hidden from
 * screen readers; the rows are the links.
 */
export function Situations({ items }: { items: Situation[] }) {
  const [on, setOn] = useState(0);
  const cur = items[on];
  return (
    <div className="bl-start-grid" data-rv>
      <ol className="bl-sit">
        {items.map((s, i) => (
          <li key={s.slug}>
            <a href={s.href} data-on={i === on ? "" : undefined} onPointerEnter={() => setOn(i)} onFocus={() => setOn(i)}>
              <span className="bl-sit-n mono" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="bl-sit-q">{s.situation}</span>
              <span className="bl-sit-a">
                {s.title}
                <span className="bl-sit-m"> · {s.minutes} min read</span>
              </span>
              <span className="bl-sit-go" aria-hidden>
                →
              </span>
            </a>
          </li>
        ))}
      </ol>
      <a className="bl-peek" href={cur.href} tabIndex={-1} aria-hidden>
        <span className="bl-peek-img">
          {items.map((s, i) => (
            <span key={s.slug} data-on={i === on ? "" : undefined}>
              <Photo p={s.cover} sizes="(min-width: 1360px) 520px, 40vw" decorative />
            </span>
          ))}
        </span>
        <span className="bl-peek-h">The short answer</span>
        <span className="bl-peek-b">
          {items.map((s, i) => (
            <span key={s.slug} data-on={i === on ? "" : undefined}>
              {s.short}
            </span>
          ))}
        </span>
        <span className="bl-peek-go">
          Read the article <span>→</span>
        </span>
      </a>
    </div>
  );
}
