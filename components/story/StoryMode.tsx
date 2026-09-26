"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LogoMark } from "@/components/chrome/LogoMark";
import { Pill } from "@/components/chrome/Pills";
import { bus } from "@/lib/stores";
import { closeStory, setHold, STORY, STORY_END, story } from "@/lib/story";
import { scrollToChapter } from "@/lib/scroll";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/+*";

/** A title that decodes: each letter flickers through glyphs, then locks, left to right. */
function Decode({ text, delay = 120 }: { text: string; delay?: number }) {
  const [out, setOut] = useState(() => text.replace(/\S/g, " "));
  useEffect(() => {
    const reduced = document.documentElement.hasAttribute("data-reduced");
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = reduced ? 1e9 : now - t0 - delay;
      let s = "";
      let done = true;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const lock = i * 38 + 260;
        if (c === " " || t >= lock) s += c;
        else if (t < i * 38) {
          s += " ";
          done = false;
        } else {
          s += GLYPHS[Math.floor((now / 55 + i * 7) % GLYPHS.length)];
          done = false;
        }
      }
      setOut(s);
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay]);
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{out}</span>
    </>
  );
}

/** Body copy that types itself in, word by word, each word lifting out of a soft blur. */
function Typed({ text, delay = 520 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((w, i) => (
          <span key={i} className="typed-w" style={{ "--wd": `${delay + i * 42}ms` } as CSSProperties}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </>
  );
}

/**
 * STORY MODE (lib/story.ts, lib/storyFilm.ts): a full-screen film over the
 * stone. The page gives way; a rail of chapters on the left, the chapter's
 * title decoding and its text typing in, a hold-to-continue ring, and the
 * offer at the end. Everything but the controls lets the pointer through.
 */
export function StoryMode() {
  const [open, setOpen] = useState(false);
  const [k, setK] = useState(-1);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const a = bus.on("story", ({ open }) => setOpen(open));
    const b = bus.on("story:chapter", ({ k }) => setK(k));
    const c = bus.on("story:closed", () => setK(-1));
    return () => {
      a();
      b();
      c();
    };
  }, []);

  // The rail and the hold ring follow the film's clock.
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = root.current;
      if (!el) return;
      el.style.setProperty("--sp", Math.max(0, Math.min(1, story.P / STORY_END)).toFixed(4));
      el.style.setProperty("--hold", story.hold.toFixed(3));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const chapter = k >= 0 && k < STORY.length ? STORY[k] : null;
  const end = k >= STORY.length;

  return (
    <div className="story" ref={root} data-open={open || undefined} aria-hidden={!open} role="dialog" aria-label="The Nerodyn story">
      <header className="story-top">
        <p className="story-brand">
          <LogoMark className="story-mark" />
          <span>Nerodyn</span>
          <span className="story-brand-sub">Why we exist</span>
        </p>
        <button type="button" className="story-close" onClick={closeStory} tabIndex={open ? 0 : -1}>
          <span>Close</span>
          <span className="story-x" aria-hidden />
        </button>
      </header>

      <ol className="story-rail" aria-hidden>
        {STORY.map((c, i) => (
          <li key={c.title} data-on={i === k || undefined} data-past={i < k || undefined}>
            <span className="mono">{String(i + 1).padStart(2, "0")}</span>
            <span className="story-rail-name">{c.title}</span>
          </li>
        ))}
        <li className="story-rail-bar">
          <span />
        </li>
      </ol>

      <div className="story-copy" key={k} data-on={chapter ? true : undefined}>
        {chapter ? (
          <>
            <p className="story-n mono">
              {String(k + 1).padStart(2, "0")} <span>/ {String(STORY.length).padStart(2, "0")}</span>
            </p>
            <h2 className="story-title">
              <Decode text={chapter.title} />
            </h2>
            <p className="story-text">
              <Typed text={chapter.text} />
            </p>
          </>
        ) : null}
      </div>

      <div className="story-end" data-on={end || undefined}>
        <p className="story-end-kicker mono">Nerodyn</p>
        <p className="story-end-line">{end ? <Decode text="We exist to maximise your digital potential." delay={200} /> : null}</p>
        <div className="story-end-ctas">
          <Pill
            onClick={() => {
              closeStory();
              window.setTimeout(() => scrollToChapter("audit"), 900);
            }}
          >
            Request an audit
          </Pill>
          <button type="button" className="text-link story-back" onClick={closeStory} tabIndex={end ? 0 : -1}>
            Back to the site <span aria-hidden>↩</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        className="story-hold"
        tabIndex={open ? 0 : -1}
        onPointerDown={() => setHold(true)}
        onPointerUp={() => setHold(false)}
        onPointerLeave={() => setHold(false)}
        onPointerCancel={() => setHold(false)}
        aria-label="Hold to continue"
        data-hidden={end || undefined}
      >
        <svg viewBox="0 0 100 100" aria-hidden>
          <circle className="story-hold-track" cx="50" cy="50" r="46" />
          <circle className="story-hold-ring" cx="50" cy="50" r="46" pathLength={1} />
        </svg>
        <span className="story-hold-label">
          Hold
          <br />
          to continue
        </span>
      </button>
      <p className="story-hint mono" aria-hidden data-hidden={end || undefined}>
        Scroll · drag · hold
      </p>
    </div>
  );
}
