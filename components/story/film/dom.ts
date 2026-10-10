import { CHAPTERS, PARTS, type PartId } from "@/content/story";
import { CARDS, FACT_DELAY, FILM_LEN, SPANS, cardOn, chapterAt } from "../timeline";
import { film } from "../store";
import type { World } from "./world";

/** "7:40pm": hours after midnight (any day) as the site writes a time. */
export function clockText(hours: number) {
  const h24 = ((hours % 24) + 24) % 24;
  let h = Math.floor(h24);
  let m = Math.round((h24 - h) * 60);
  if (m === 60) {
    m = 0;
    h = (h + 1) % 24;
  }
  const ampm = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

/** When the clock is shown on screen (the inbox's night, the late hour, 3am, six o'clock). */
const CLOCK_ON: [number, number][] = [
  [4.72, 7.15],
  [11.74, 13.9],
  [18.7, 20.15],
  [23.94, 25.7],
];

/**
 * The page's live words and controls, written straight from the film's
 * frame (attributes and text only when they change: no React per frame).
 */
export class Dom {
  private cards: { el: HTMLElement; i: number; on: boolean; fact: boolean }[] = [];
  private shade: HTMLElement | null;
  private count: HTMLElement | null;
  private countN: HTMLElement | null;
  private countBy: Record<string, HTMLElement> = {};
  private yours: HTMLElement | null;
  private fill: HTMLElement | null;
  private ticks: HTMLElement[];
  private nowN: HTMLElement | null;
  private nowT: HTMLElement | null;
  private tip: HTMLElement | null;
  private tipN: HTMLElement | null;
  private tipL: HTMLElement | null;
  private time: HTMLElement | null;
  private drop: HTMLElement | null;
  private endSum: HTMLElement | null;
  private last: Record<string, string | number | boolean> = {};
  /** The part the tip is about (chosen when the pointer last moved). */
  private tipFor: PartId | null = null;
  private tipMove = 0;
  private tipX = 0;
  private tipY = 0;

  constructor() {
    const q = <T extends HTMLElement>(s: string) => document.querySelector<T>(s);
    CARDS.forEach((c, i) => {
      const el = q(`[data-card="${c.id}-${c.part}"]`);
      if (el) this.cards.push({ el, i, on: false, fact: false });
    });
    this.shade = q(".st-cards");
    this.count = q(".st-count");
    this.countN = q(".st-count-n");
    document.querySelectorAll<HTMLElement>(".st-count-by li").forEach((li) => {
      const b = li.querySelector("b");
      if (b && li.dataset.leak) this.countBy[li.dataset.leak] = b as HTMLElement;
    });
    this.yours = q(".st-count-yours");
    this.fill = q(".st-prog-fill");
    this.ticks = Array.from(document.querySelectorAll<HTMLElement>(".st-ticks li"));
    this.nowN = q(".st-now-n");
    this.nowT = q(".st-now-t");
    this.tip = q(".st-tip");
    this.tipN = q(".st-tip-n");
    this.tipL = q(".st-tip-l");
    this.time = q(".st-time");
    this.drop = q(".st-drop");
    this.endSum = q(".st-end-sum");
  }

  private set(key: string, v: string | number | boolean, fn: () => void) {
    if (this.last[key] === v) return;
    this.last[key] = v;
    fn();
  }

  /** Returns true when a title has just landed (the score gives it a thump). */
  update(P: number, w: World, pointer: { cx: number; cy: number; has: boolean; moved: number }): boolean {
    // The words.
    let left = false;
    let landed = false;
    for (const c of this.cards) {
      const card = CARDS[c.i];
      const on = cardOn(card, P);
      if (on !== c.on) {
        c.on = on;
        c.el.toggleAttribute("data-on", on);
        if (on) landed = true;
      }
      const fact = on && card.part === "main" && P >= card.in + FACT_DELAY;
      if (fact !== c.fact) {
        c.fact = fact;
        c.el.toggleAttribute("data-fact", fact);
      }
      if (on && card.id !== "open" && card.id !== "turn") left = true;
    }
    this.set("shade", left, () => this.shade?.style.setProperty("--shade", left ? "1" : "0"));

    // The counter: the film's own customers.
    const sim = w.sim;
    const heroLost = P >= 10.66 && P < 16.6 ? 1 : 0;
    const lost = sim.lost.website + sim.lost.inbox + sim.lost.admin + sim.lost.followup + heroLost;
    const mode = P >= 16.6 ? "kept" : "lost";
    const show = (P > 2.62 && P < 14.02) || (P > 17.2 && P < 25.75);
    const full = (P > 12.9 && P < 14.02) || (P > 24.3 && P < 25.75);
    this.set("cmode", mode, () => this.count?.setAttribute("data-mode", mode));
    this.set("cshow", show, () => this.count?.toggleAttribute("data-show", show));
    this.set("cfull", full && mode === "lost", () => this.count?.toggleAttribute("data-full", full && mode === "lost"));
    const n = mode === "lost" ? lost : sim.kept;
    this.set("cn", n, () => {
      if (this.countN) this.countN.textContent = String(n);
    });
    for (const k of ["website", "inbox", "admin", "followup"] as const) {
      const v = sim.lost[k] + (k === "followup" ? heroLost : 0);
      this.set(`by-${k}`, v, () => {
        if (this.countBy[k]) this.countBy[k].textContent = String(v);
      });
    }
    const yours =
      sim.yoursIn > 0
        ? mode === "lost"
          ? `Yours: ${sim.yoursIn} dropped in, ${sim.yoursLost} lost`
          : `Yours: ${sim.yoursIn} dropped in, ${sim.yoursKept} came back`
        : "";
    this.set("yours", yours, () => {
      if (this.yours) this.yours.textContent = yours;
    });
    film.lost = { ...sim.lost, followup: sim.lost.followup + heroLost };
    film.kept = sim.kept;
    if (P > 25.7) {
      const sum =
        lost > 0
          ? `In the film, while you watched: ${lost} lost to the old machine${sim.kept > 0 ? `, ${sim.kept} back again in the new one` : ""}.`
          : "";
      this.set("sum", sum, () => {
        if (this.endSum) this.endSum.textContent = sum;
      });
    }

    // The clock, when the time matters.
    const tOn = CLOCK_ON.some(([a, b]) => P > a && P < b);
    const t = tOn ? clockText(w.info.hours) : "";
    this.set("time", t, () => {
      if (!this.time) return;
      this.time.textContent = t;
      this.time.toggleAttribute("data-on", !!t);
    });

    // Progress and where we are.
    const prog = Math.min(1, P / FILM_LEN);
    this.set("prog", Math.round(prog * 1000), () => {
      if (this.fill) this.fill.style.transform = `scaleX(${prog.toFixed(3)})`;
    });
    const ci = chapterAt(P);
    this.set("chapter", ci, () => {
      const ch = CHAPTERS.find((c) => c.id === SPANS[ci].id)!;
      const m = ch.kicker?.match(/^(\d\d)\s/);
      if (this.nowN) this.nowN.textContent = m ? m[1] : "";
      if (this.nowT) this.nowT.textContent = ch.name;
      this.ticks.forEach((li, k) => li.toggleAttribute("data-past", k <= ci));
    });
    const canDrop = P < 13.9 || (P > 17.0 && P < 25.7);
    this.set("drop", canDrop, () => this.drop?.toggleAttribute("data-hidden", !canDrop));
    const paper = P > FILM_LEN - 0.8;
    this.set("paper", paper, () => document.documentElement.toggleAttribute("data-st-paper", paper));

    // Hover a part: what it is in your business. Only the part you moved
    // onto, kept while you stay on it: parts the film slides under a resting
    // pointer (while you read, or scroll) don't pop up over the words.
    const under = pointer.has && P < 25.6 && !(P > 13.95 && P < 16.9) ? (w.hover as PartId | null) : null;
    if (pointer.moved !== this.tipMove) {
      this.tipMove = pointer.moved;
      this.tipFor = under;
    } else if (under !== this.tipFor) this.tipFor = null;
    const id = this.tipFor;
    this.set("tip", id ?? "", () => {
      if (!this.tip) return;
      if (id && PARTS[id]) {
        if (this.tipN) this.tipN.textContent = PARTS[id].name;
        if (this.tipL) this.tipL.textContent = PARTS[id].line;
      }
      this.tip.toggleAttribute("data-on", !!id);
      document.documentElement.toggleAttribute("data-st-hover", !!id);
    });
    if (id) {
      this.tipX += (pointer.cx + 18 - this.tipX) * 0.35;
      this.tipY += (pointer.cy + 20 - this.tipY) * 0.35;
      if (this.tip) this.tip.style.transform = `translate3d(${this.tipX.toFixed(1)}px, ${this.tipY.toFixed(1)}px, 0)`;
    } else {
      this.tipX = pointer.cx + 18;
      this.tipY = pointer.cy + 20;
    }
    return landed;
  }
}
