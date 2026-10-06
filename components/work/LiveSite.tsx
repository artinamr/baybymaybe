"use client";

import { useState } from "react";
import type { Shot } from "@/content/work";

/**
 * A concept website, live, in its browser frame. Until asked it is a picture
 * of the first screen (the whole site would otherwise load with the case
 * study and compete with it); "Try it here" swaps in the real site in an
 * iframe, and "Open in a new tab" is always there. On a phone the frame is
 * portrait and the picture is the phone view: the site inside lays itself out
 * for the frame's width, as it would on the device.
 */
export function LiveSite({ live, domain, name, poster, phone }: { live: string; domain: string; name: string; poster: Shot; phone: Shot }) {
  const [on, setOn] = useState(false);
  return (
    <div className="dev-browser ss-browser" role="group" aria-label={`${name}, the concept website`}>
      <div className="dev-bar" aria-hidden>
        <span className="dev-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="dev-url">{domain}</span>
      </div>
      <div className="ss-screen" data-on={on ? "" : undefined}>
        {on ? (
          <iframe src={live} title={`The ${name} website, running live`} className="ss-frame" />
        ) : (
          <>
            <picture>
              <source media="(max-width: 700px)" srcSet={phone.src} width={phone.w} height={phone.h} />
              <img
                className="ss-poster"
                src={poster.src}
                srcSet={poster.half ? `${poster.half} 1200w, ${poster.src} 2400w` : undefined}
                sizes="(min-width: 1400px) 1300px, 94vw"
                alt={poster.alt}
                width={poster.w}
                height={poster.h}
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <span className="ss-veil" aria-hidden />
            <span className="ss-try">
              <a className="ss-open" href={live} target="_blank" rel="noopener">
                Open in a new tab <span aria-hidden>↗</span>
              </a>
              <button type="button" className="pill btn-shine" onClick={() => setOn(true)}>
                <span>Try the live site here</span>
                <span className="pill-arrow" aria-hidden>
                  <span>→</span>
                  <span>→</span>
                </span>
              </button>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
