"use client";

import dynamic from "next/dynamic";
import { Fragment, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Pill } from "@/components/chrome/Pills";
import { CHAPTERS, CONTROLS, COUNTER, DOOR, ENDING, SOURCES, type StoryChapter } from "@/content/story";
import { CARDS, FILM_LEN, SPANS } from "./timeline";
import { cmd, events, film } from "./store";
import { setSound, SoundIcon } from "./StoryBar";

// The film itself (three.js, the machine, the sound) is its own chunk, fetched
// as soon as the page is up and compiled behind the door. No other page loads it.
const Film = dynamic(() => import("./film/Film"), { ssr: false });

type Phase = "door" | "wait" | "film" | "read" | "nofilm";

let glCache: boolean | null = null;
function hasWebGL2(): boolean {
  if (glCache !== null) return glCache;
  try {
    glCache = !!document.createElement("canvas").getContext("webgl2");
  } catch {
    glCache = false;
  }
  return glCache;
}
const noSubscribe = () => () => {};

/** A line's words as spans, so they can land one after another. */
function Words({ text, base = 0 }: { text: string; base?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="w" style={{ "--i": base + i } as CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

/** "01 Your website" → the number and the words, set apart. */
function Kicker({ text }: { text: string }) {
  const m = text.match(/^(\d\d)\s+(.*)$/);
  return (
    <p className="st-k">
      {m ? <span className="st-k-n">{m[1]}</span> : <span className="st-k-dot" />}
      <span className="st-k-rule" />
      <span>{m ? m[2] : text}</span>
    </p>
  );
}

function Card({ c, part }: { c: StoryChapter; part: "main" | "beat" }) {
  const key = `${c.id}-${part}`;
  if (part === "beat") {
    return (
      <div className="st-card st-card-beat" data-card={key} data-ch={c.id}>
        <p className="st-t">
          <Words text={c.beat ?? ""} />
        </p>
      </div>
    );
  }
  const n = c.title.split(" ").length;
  return (
    <div className="st-card" data-card={key} data-ch={c.id}>
      {c.kicker ? <Kicker text={c.kicker} /> : null}
      <p className="st-t">
        <Words text={c.title} />
      </p>
      {c.line ? (
        <p className="st-l">
          <Words text={c.line} base={n} />
        </p>
      ) : null}
      {c.fact ? (
        <div className="st-fact">
          <p className="st-fact-t">{c.fact.text}</p>
          <p className="st-fact-s">{SOURCES[c.fact.source].short}</p>
        </div>
      ) : null}
    </div>
  );
}

const byId = Object.fromEntries(CHAPTERS.map((c) => [c.id, c])) as Record<string, StoryChapter>;

/**
 * THE STORY'S PAGE, ITS LIVE PART: the door (sound or silence, and the film
 * compiling behind it), the film's stage, its words (drawn over the picture,
 * hidden from screen readers: the transcript below carries them), the
 * controls, the scroll the film runs on, and the offer at the end.
 */
export function StoryFilm() {
  const [state, setPhase] = useState<Phase>("door");
  // WebGL is known only in the browser: the server (and hydration) assume it.
  const glOk = useSyncExternalStore(noSubscribe, hasWebGL2, () => true);
  const [failed, setFailed] = useState(false);
  const webgl = glOk && !failed;
  const phase: Phase = webgl ? state : "nofilm";
  const [playing, setPlaying] = useState(false);
  const [sound, setOn] = useState(false);
  const loadRef = useRef<HTMLSpanElement>(null);
  const wantRef = useRef<boolean | null>(null);

  // The page's state, for its CSS: the door holds the scroll; nofilm shows the words.
  useEffect(() => {
    document.documentElement.setAttribute("data-st", phase);
  }, [phase]);

  useEffect(() => {
    const root = document.documentElement;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    film.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (film.reduced) root.setAttribute("data-reduced", "");
    if (!hasWebGL2()) {
      film.failed = true;
      return;
    }
    const offs = [
      events.on("ready", () => {
        if (wantRef.current !== null) {
          setPhase("film");
          events.emit("start");
        }
      }),
      events.on("failed", () => setFailed(true)),
      events.on("playing", (v) => setPlaying(!!v)),
      events.on("sound", (v) => setOn(!!v)),
    ];
    // Look-dev: `?at=<P>` skips the door, in silence.
    const q = new URLSearchParams(location.search);
    if (q.get("at") !== null) begin(false);
    return () => offs.forEach((f) => f());
  }, []);

  // Without the film (reading, or no WebGL), the bar turns to ink over the paper sections.
  useEffect(() => {
    if (phase !== "read" && phase !== "nofilm") return;
    const root = document.documentElement;
    const els = [document.querySelector(".st-end"), document.getElementById("transcript"), document.querySelector(".site-foot")].filter(Boolean) as Element[];
    const on = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) on.add(e.target);
          else on.delete(e.target);
        }
        root.toggleAttribute("data-st-paper", on.size > 0);
      },
      { rootMargin: "0px 0px -92% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      root.removeAttribute("data-st-paper");
    };
  }, [phase]);

  // While the door waits for the film, its hairline shows how far along it is.
  useEffect(() => {
    if (phase !== "wait" && phase !== "door") return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      loadRef.current?.style.setProperty("--p", film.progress.toFixed(3));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  function begin(withSound: boolean) {
    wantRef.current = withSound;
    if (withSound) setSound(true);
    film.started = true;
    if (film.ready) {
      setPhase("film");
      events.emit("start");
    } else setPhase("wait");
  }

  const again = () => {
    if (phase === "read") {
      // Back to the door, at the top: the film was never started.
      window.scrollTo(0, 0);
      setPhase("door");
      return;
    }
    cmd.goto(0);
    window.setTimeout(() => cmd.play(), 600);
  };

  // "Rather read it?": the film steps aside and the page goes to its words.
  function read(e: React.MouseEvent) {
    if (phase === "nofilm") return;
    e.preventDefault();
    setPhase("read");
    requestAnimationFrame(() => document.getElementById("transcript")?.scrollIntoView());
  }

  return (
    <>
      {/* THE DOOR */}
      <section className="st-door" aria-labelledby="st-title" data-phase={phase}>
        <div className="st-door-bg" aria-hidden>
          {Array.from({ length: 14 }, (_, i) => (
            <i
              key={i}
              style={{ left: `${8 + ((i * 37) % 84)}%`, animationDuration: `${5.5 + ((i * 7) % 5)}s`, animationDelay: `${(-i * 0.83).toFixed(2)}s` }}
            />
          ))}
        </div>
        <div className="st-door-in">
          <p className="st-door-k">{DOOR.kicker}</p>
          <h1 id="st-title" className="st-door-t">
            {DOOR.title}
          </h1>
          <p className="st-door-l">{DOOR.line}</p>
          {webgl ? (
            <>
              <div className="st-door-go">
                <button type="button" className="st-btn st-btn-pri" onClick={() => begin(true)}>
                  <SoundIcon on />
                  {DOOR.sound}
                </button>
                <button type="button" className="st-btn" onClick={() => begin(false)}>
                  {DOOR.silent}
                </button>
              </div>
              <p className="st-door-how">{DOOR.how}</p>
            </>
          ) : (
            <p className="st-door-how st-door-sorry">
              This film needs WebGL, which this browser has turned off. The whole story is below, in words.
            </p>
          )}
          <a className="st-door-read" href="#transcript" onClick={read}>
            {DOOR.read} <span aria-hidden>↓</span>
          </a>
          <p className="st-door-load" aria-live="polite">
            <span className="st-door-bar" ref={loadRef}>
              <i />
            </span>
            <span>{phase === "wait" ? DOOR.loading : ""}</span>
          </p>
        </div>
      </section>

      {/* THE FILM: its stage, its words, its controls */}
      <div id="st-stage" aria-hidden>
        {webgl ? <Film /> : null}
      </div>
      <div className="st-veil" aria-hidden />

      <div className="st-cards" aria-hidden>
        {CARDS.map((k) => (
          <Card key={`${k.id}-${k.part}`} c={byId[k.id]} part={k.part} />
        ))}
      </div>

      <div className="st-count" aria-hidden data-mode="lost">
        <p className="st-count-l">
          <span className="st-count-lost">{COUNTER.lost}</span>
          <span className="st-count-kept">{COUNTER.kept}</span>
        </p>
        <p className="st-count-n">0</p>
        <ul className="st-count-by">
          {(Object.keys(COUNTER.leaks) as (keyof typeof COUNTER.leaks)[]).map((k) => (
            <li key={k} data-leak={k}>
              <span>{COUNTER.leaks[k]}</span>
              <b>0</b>
            </li>
          ))}
        </ul>
        <p className="st-count-yours" />
      </div>

      <p className="st-time" aria-hidden />

      <div className="st-tip" aria-hidden>
        <p className="st-tip-n" />
        <p className="st-tip-l" />
      </div>

      <div className="st-hud" role="group" aria-label="Film controls">
        <p className="st-now" aria-hidden>
          <span className="st-now-n">01</span>
          <span className="st-now-t">{CHAPTERS[0].name}</span>
        </p>
        <div className="st-prog">
          <span className="st-prog-track" aria-hidden>
            <i className="st-prog-fill" />
          </span>
          <ol className="st-ticks">
            {SPANS.map((s) => (
              <li key={s.id} style={{ left: `${((s.P0 / FILM_LEN) * 100).toFixed(3)}%` } as CSSProperties}>
                <button type="button" onClick={() => cmd.goto(s.P0 + (s.id === "open" ? 0 : 0.12))} aria-label={`Go to: ${byId[s.id].name}`}>
                  <span className="st-tick-l" aria-hidden>
                    {byId[s.id].name}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="st-hud-r">
          <button type="button" className="st-chip st-drop" onClick={() => cmd.drop()}>
            <span className="st-drop-dot" aria-hidden />
            <span className="st-chip-l st-drop-long">{COUNTER.drop}</span>
            <span className="st-chip-l st-drop-short">{COUNTER.dropShort}</span>
          </button>
          <button type="button" className="st-chip st-play" aria-pressed={playing} onClick={() => cmd.toggle()}>
            <span className="st-play-ico" data-on={playing || undefined} aria-hidden />
            <span className="st-chip-l">{playing ? CONTROLS.pause : CONTROLS.play}</span>
          </button>
          <button
            type="button"
            className="st-chip st-sound st-sound-m"
            aria-pressed={sound}
            aria-label={sound ? "Sound is on. Turn it off" : "Sound is off. Turn it on"}
            onClick={() => setSound(!film.sound)}
          >
            <SoundIcon on={sound} />
          </button>
        </div>
      </div>

      {/* The scroll the film runs on. */}
      <div className="st-track" aria-hidden style={{ "--len": FILM_LEN } as CSSProperties} />

      {/* THE OFFER: the film ends on paper, and the page carries on from it. */}
      <section className="st-end" aria-labelledby="st-end-h">
        <div className="st-end-in">
          <h2 id="st-end-h" className="st-end-t">
            {ENDING.title}
          </h2>
          <p className="st-end-l">{ENDING.line}</p>
          <p className="st-end-b">{ENDING.body}</p>
          <div className="st-end-ctas">
            <Pill href="#contact">{ENDING.cta}</Pill>
            {webgl ? (
              <button type="button" className="text-link st-again" onClick={again}>
                {phase === "read" ? ENDING.watch : ENDING.again} <span aria-hidden>{phase === "read" ? "↑" : "↺"}</span>
              </button>
            ) : null}
          </div>
          <p className="st-end-sum" aria-hidden />
        </div>
      </section>
    </>
  );
}
