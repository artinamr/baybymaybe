"use client";

import { useEffect, useRef, useState } from "react";
import type { Shot } from "@/content/work";
import "./crazy-live.css";

/**
 * A concept website, live, in its browser frame. Until asked it is a picture
 * of the first screen (the whole site would otherwise load with the case
 * study and compete with it); "Try it here" swaps in the real site in an
 * iframe, and "Open in a new tab" is always there. On a phone the frame is
 * portrait and the picture is the phone view: the site inside lays itself out
 * for the frame's width, as it would on the device.
 *
 * Living paper: the frame tilts a degree or two toward a fine pointer and an
 * indigo light follows it across the glass (written straight onto the
 * element, once per frame, only while the pointer moves); when the live site
 * is asked for, the screen powers on with a scan of light and the site fades
 * up once it has loaded.
 */
export function LiveSite({ live, domain, name, poster, phone }: { live: string; domain: string; name: string; poster: Shot; phone: Shot }) {
  const [on, setOn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    let raf = 0;
    let px = 0.5;
    let py = 0.5;
    const paint = () => {
      raf = 0;
      el.style.setProperty("--mx", `${(px * 100).toFixed(2)}%`);
      el.style.setProperty("--my", `${(py * 100).toFixed(2)}%`);
      el.style.setProperty("--ry", `${((px - 0.5) * 3.2).toFixed(3)}deg`);
      el.style.setProperty("--rx", `${((0.5 - py) * 2.4).toFixed(3)}deg`);
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      el.dataset.lit = "";
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const leave = () => {
      delete el.dataset.lit;
      px = 0.5;
      py = 0.5;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="cz-live" ref={wrap}>
      <div className="dev-browser ss-browser cz-live-frame" role="group" aria-label={`${name}, the concept website`}>
        <div className="dev-bar" aria-hidden>
          <span className="dev-dots">
            <i />
            <i />
            <i />
          </span>
          <span className="dev-url">{domain}</span>
          <span className="cz-live-status" data-state={on ? (loaded ? "live" : "loading") : "idle"} />
        </div>
        <div className="ss-screen" data-on={on ? "" : undefined} data-loaded={loaded ? "" : undefined}>
          {on ? (
            <>
              <iframe src={live} title={`The ${name} website, running live`} className="ss-frame cz-live-site" onLoad={() => setLoaded(true)} />
              <span className="cz-live-scan" aria-hidden />
            </>
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
          <span className="cz-live-light" aria-hidden />
        </div>
      </div>
    </div>
  );
}
