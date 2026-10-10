/**
 * THE STORY'S SHARED STATE: plain mutable objects (never React state per
 * frame), written by their owners and read anywhere. The page's own client
 * code (StoryFilm: the door, the controls) owns `ui`; the film's lazily loaded
 * chunk owns `film` and fills in `cmd` once it is running.
 */

export type Quality = 0 | 1 | 2;

export const film = {
  /** The scroll's film clock (screens of scroll) and the smoothed one everything draws from. */
  P: 0,
  Ps: 0,
  /** Viewport (stable: a phone's toolbars hiding don't change it). */
  vw: 1440,
  vh: 900,
  /** 0..1 how ready the film is (chunk, world, shaders, first frames). */
  progress: 0,
  ready: false,
  /** WebGL could not start: the page shows the transcript instead. */
  failed: false,
  /** The door was passed (the film runs, the page scrolls). */
  started: false,
  playing: false,
  /** Sound wanted (the door's choice, the toggle). */
  sound: false,
  /** Counters (the film's own customers). */
  lost: { website: 0, inbox: 0, admin: 0, followup: 0 },
  kept: 0,
  yoursIn: 0,
  yoursLost: 0,
  yoursKept: 0,
  /** Rendering tier: 0 phone / low, 1 laptop, 2 strong. */
  quality: 1 as Quality,
  reduced: false,
};

export const lostTotal = () => film.lost.website + film.lost.inbox + film.lost.admin + film.lost.followup;

/** What the page asks of the film; the film sets these when it starts. */
export const cmd: {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  goto: (P: number) => void;
  drop: () => void;
  sound: (on: boolean) => void;
} = {
  play: () => {},
  pause: () => {},
  toggle: () => {},
  next: () => {},
  prev: () => {},
  goto: () => {},
  drop: () => {},
  sound: () => {},
};

type Handler = (v?: unknown) => void;
const handlers = new Map<string, Set<Handler>>();

/** Discrete events between the page and the film ("ready", "start", "playing", "sound", "chapter", "count"). */
export const events = {
  on(type: string, fn: Handler): () => void {
    let s = handlers.get(type);
    if (!s) handlers.set(type, (s = new Set()));
    s.add(fn);
    return () => s!.delete(fn);
  },
  emit(type: string, v?: unknown) {
    handlers.get(type)?.forEach((fn) => fn(v));
  },
};

/** The audio context, made inside the click that asked for sound (browsers only allow it there). */
export const audio: { ctx: AudioContext | null } = { ctx: null };

export function unlockAudio(): AudioContext | null {
  try {
    if (!audio.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      audio.ctx = new AC({ latencyHint: "interactive" });
    }
    if (audio.ctx.state === "suspended") void audio.ctx.resume();
    return audio.ctx;
  } catch {
    return null;
  }
}
