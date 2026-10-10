"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/chrome/LogoMark";
import { PAGES } from "@/lib/content";
import { CONTROLS, STORY_TITLE } from "@/content/story";
import { cmd, events, film, unlockAudio } from "./store";

/** A speaker; waves when the sound is on, a stroke through it when it is off. */
export function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false" className="st-ico">
      <path d="M4 9.5h3.2L12 5.6v12.8l-4.8-3.9H4z" fill="currentColor" />
      {on ? (
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path className="st-wave st-wave-1" d="M15.2 9.2a4 4 0 0 1 0 5.6" />
          <path className="st-wave st-wave-2" d="M17.6 6.9a7.3 7.3 0 0 1 0 10.2" />
        </g>
      ) : (
        <path d="M15.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

/** Turn the sound on or off (a click is the gesture a browser needs to start audio). */
export function setSound(on: boolean) {
  if (on && !unlockAudio()) return;
  film.sound = on;
  cmd.sound(on);
  events.emit("sound", on);
}

/**
 * THE STORY'S TOP BAR: the name back home, the film's title, the sound (always
 * there), and the way back to the site.
 */
export function StoryBar() {
  const [sound, setOn] = useState(false);
  useEffect(() => events.on("sound", (v) => setOn(!!v)), []);
  return (
    <header className="st-bar">
      <a href={PAGES.home} className="st-brand" aria-label="Nerodyn, home">
        <LogoMark className="st-mark" />
        <span>Nerodyn</span>
      </a>
      <span className="st-bar-title" aria-hidden>
        {STORY_TITLE}
      </span>
      <div className="st-bar-r">
        <button
          type="button"
          className="st-chip st-sound"
          aria-pressed={sound}
          aria-label={sound ? "Sound is on. Turn it off" : "Sound is off. Turn it on"}
          onClick={() => setSound(!film.sound)}
        >
          <SoundIcon on={sound} />
          <span className="st-chip-l">{sound ? CONTROLS.soundOn : CONTROLS.soundOff}</span>
        </button>
        <a href={PAGES.home} className="st-chip st-back">
          <span className="st-chip-l">{CONTROLS.back}</span>
          <span className="st-x" aria-hidden />
        </a>
      </div>
    </header>
  );
}
