import { bus, scroll } from "./stores";
import { getLenis } from "./scroll";

/**
 * STORY MODE — why Nerodyn exists, told by the stone (lib/storyFilm.ts) in six
 * chapters. Click the stone in the hero (or "Enter the story"): the camera
 * dives into it and the page gives way to a full-screen film you move through
 * with the wheel, a drag, the arrow keys, or by holding the button. Closing it
 * rewinds the film to the hero.
 *
 * The story has its own clock P: −0.6 is the hero's frame (so entering is one
 * continuous move), chapter k is shown while P ∈ [k, k+1), its composed frame
 * at k + 0.55, and the closing card at STORY_END.
 */

export const STORY = [
  {
    title: "Potential",
    text: "Every business holds more than its screen shows. Most of it never reaches the people it could win.",
  },
  {
    title: "The first meeting",
    text: "Your platform is the first meeting. You are rarely in the room when it happens.",
  },
  {
    title: "Seconds",
    text: "A buyer decides in seconds, before reading a word. Slow, dated or generic — they close the tab and call the next company. You never know it happened.",
  },
  {
    title: "The cut",
    text: "So we shape it for them. Designed only for you, never a template. Fast on every device. Engineered to last.",
  },
  {
    title: "The light inside",
    text: "Then we put intelligence inside it: AI that greets every visitor, asks the right questions, screens out the noise — and routes the serious ones straight to you.",
  },
  {
    title: "Yours",
    text: "Fourteen days from brief to live. You own every line and every asset. No retainers, no lock-in.",
  },
];

export const STORY_START = -0.6;
export const STORY_END = STORY.length + 0.2;
const REST = (k: number) => k + 0.55;
const P_MAX = STORY_END + 0.15;

export const story = {
  phase: "closed" as "closed" | "open" | "closing",
  /** The film's clock (smoothed) and where it is heading. */
  P: STORY_START,
  target: STORY_START,
  vel: 0,
  lastInput: 0,
  holding: false,
  /** 0..1 how far the current hold has charged (the button's ring). */
  hold: 0,
  chapter: -2,
};

function clamp(x: number, a: number, b: number) {
  return x < a ? a : x > b ? b : x;
}

function nearestRest(P: number, dir: number): number {
  const anchors = STORY.map((_, k) => REST(k)).concat(STORY_END);
  let best = anchors[0];
  let bd = Infinity;
  for (const a of anchors) {
    // Biased toward the way you were going.
    const d = Math.abs(a - P) - (Math.sign(a - P) === dir ? 0.25 : 0);
    if (d < bd) {
      bd = d;
      best = a;
    }
  }
  return best;
}

let lastDir = 1;
let touchY = 0;

function onWheel(e: WheelEvent) {
  if (story.phase !== "open") return;
  e.preventDefault();
  const d = clamp(e.deltaY, -120, 120) * 0.0024;
  story.target = clamp(story.target + d, REST(0) - 0.35, P_MAX);
  lastDir = Math.sign(d) || lastDir;
  story.lastInput = performance.now();
}

function onTouchStart(e: TouchEvent) {
  touchY = e.touches[0]?.clientY ?? 0;
}

function onTouchMove(e: TouchEvent) {
  if (story.phase !== "open") return;
  const y = e.touches[0]?.clientY ?? touchY;
  const d = (touchY - y) * 0.0042;
  touchY = y;
  story.target = clamp(story.target + d, REST(0) - 0.35, P_MAX);
  lastDir = Math.sign(d) || lastDir;
  story.lastInput = performance.now();
}

function onKey(e: KeyboardEvent) {
  if (story.phase !== "open") return;
  if (e.key === "Escape") return closeStory();
  const next = ["ArrowDown", "ArrowRight", "PageDown", " ", "Enter"].includes(e.key);
  const prev = ["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key);
  if (!next && !prev) return;
  e.preventDefault();
  stepStory(next ? 1 : -1);
}

/** Go to the next / previous chapter's composed frame. */
export function stepStory(dir: 1 | -1): void {
  const k = Math.floor(story.target - 0.55 + 1e-3);
  const to = dir > 0 ? (k + 1 >= STORY.length ? STORY_END : REST(k + 1)) : REST(Math.max(0, k - (story.target - REST(k) < 0.05 ? 1 : 0)));
  story.target = clamp(to, REST(0), STORY_END);
  lastDir = dir;
  story.lastInput = performance.now() - 2000;
}

/** Enter the story from wherever you are (the page glides to the hero under it). */
export function openStory(): void {
  if (story.phase === "open") return;
  const root = document.documentElement;
  const lenis = getLenis();
  if (scroll.S > 0.02) {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }
  lenis?.stop();
  story.phase = "open";
  if (story.P > STORY_START + 0.05 && story.P < P_MAX) {
    // Re-entered mid-rewind: carry on from there.
  } else story.P = STORY_START;
  story.target = REST(0);
  story.vel = 0;
  story.lastInput = performance.now() - 2000;
  root.setAttribute("data-story", "open");
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("keydown", onKey);
  bus.emit("story", { open: true });
}

/** Leave: the film rewinds to the hero, then the page comes back. */
export function closeStory(): void {
  if (story.phase !== "open") return;
  story.phase = "closing";
  story.target = STORY_START;
  story.holding = false;
  window.removeEventListener("wheel", onWheel);
  window.removeEventListener("touchstart", onTouchStart);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("keydown", onKey);
  document.documentElement.setAttribute("data-story", "closing");
  bus.emit("story", { open: false });
}

export function setHold(on: boolean): void {
  story.holding = on && story.phase === "open";
  if (!story.holding) story.lastInput = performance.now();
}

/** Once per frame from the one loop (before the 3D). */
export function updateStory(dt: number): void {
  if (story.phase === "closed") return;
  const now = performance.now();

  // Hold: charge, then fast-forward to the next chapter.
  if (story.holding) {
    story.hold = Math.min(1, story.hold + dt / 0.55);
    if (story.hold >= 1) {
      stepStory(1);
      story.hold = 0;
      story.holding = story.target < STORY_END;
    }
  } else story.hold = Math.max(0, story.hold - dt * 3);

  // At rest: glide to a composed frame, biased the way you were going.
  if (story.phase === "open" && !story.holding && now - story.lastInput > 650) {
    const rest = nearestRest(story.target, lastDir);
    story.target += (rest - story.target) * (1 - Math.exp(-dt * 5));
  }

  // The film follows with weight (a closing rewind runs a little faster).
  const w = story.phase === "closing" ? 3.6 : 2.6;
  const d = story.P - story.target;
  const c = story.vel + w * d;
  const e = Math.exp(-w * dt);
  story.P = story.target + (d + c * dt) * e;
  story.vel = (story.vel - w * c * dt) * e;

  const k = story.P < 0 ? -1 : Math.min(STORY.length, Math.floor(story.P));
  if (k !== story.chapter) {
    story.chapter = k;
    bus.emit("story:chapter", { k });
  }

  if (story.phase === "closing" && story.P < STORY_START + 0.02) {
    story.phase = "closed";
    story.P = STORY_START;
    story.vel = 0;
    story.chapter = -2;
    document.documentElement.removeAttribute("data-story");
    getLenis()?.start();
    bus.emit("story:closed", {});
  }
}
