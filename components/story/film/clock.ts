import Lenis from "lenis";
import { FILM_LEN, RESTS, dwellAt } from "../timeline";
import { events, film } from "../store";
import { spring } from "./ease";

/**
 * THE FILM'S CLOCK. The page scrolls (Lenis smooths the wheel); P is how many
 * screens down the film's track you are, and the film runs on Ps, which
 * follows P with a little weight of its own, so a flick of the wheel is a
 * glide, never a jolt. Rest a moment and it settles on the nearest composed
 * frame (biased the way you were going). Press play and it runs like a film:
 * it travels from one composed frame to the next and holds on each long
 * enough to read. The arrow keys, space and page keys step between frames;
 * a drag on the picture scrolls it. Any input of yours stops the playing.
 */
export class Clock {
  lenis: Lenis | null = null;
  P = 0;
  Ps = 0;
  private sp = { x: 0, v: 0 };
  private lastInput = -1e9;
  private dir = 1;
  private auto: { phase: "hold" | "move"; t0: number; from: number; to: number; dur: number; until: number } | null = null;
  private gliding = false;
  private drag: { y: number; t: number; moved: boolean } | null = null;
  private offs: (() => void)[] = [];
  private top = 0;
  onTap: ((x: number, y: number) => void) | null = null;

  start(canvas: HTMLElement) {
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.85, smoothWheel: true, syncTouch: false, autoRaf: false });
    this.lenis = lenis;
    this.measure();
    const touched = () => {
      this.lastInput = performance.now();
      this.gliding = false;
      if (film.playing) this.pause();
    };
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 0.5) this.dir = Math.sign(e.deltaY);
      touched();
    };
    const touch = () => touched();
    const key = (e: KeyboardEvent) => {
      if (!film.started || this.P > FILM_LEN + 0.2) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select") || t.isContentEditable)) return;
      const next = ["ArrowDown", "ArrowRight", "PageDown"].includes(e.key) || (e.key === " " && !t?.closest("button, a"));
      const prev = ["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key);
      if (next || prev) {
        e.preventDefault();
        touched();
        this.step(next ? 1 : -1);
      } else if (e.key === "Home") {
        e.preventDefault();
        touched();
        this.goto(0);
      } else if (e.key === "End") {
        e.preventDefault();
        touched();
        this.goto(FILM_LEN);
      } else if (e.key === "k" || e.key === "K" || e.key === "p" || e.key === "P") {
        this.toggle();
      }
    };
    // A drag on the picture scrolls the film (a mouse; touch scrolls natively). A tap drops a customer in.
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      this.drag = { y: e.clientY, t: performance.now(), moved: false };
      if (e.pointerType === "mouse") canvas.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const d = this.drag;
      if (!d) return;
      const dy = e.clientY - d.y;
      if (Math.abs(dy) > 6) d.moved = true;
      if (d.moved && e.pointerType === "mouse") {
        touched();
        this.lenis?.scrollTo(this.lenis.targetScroll - dy * 2.2, { immediate: false, lerp: 0.12 });
        this.dir = dy < 0 ? 1 : -1;
        d.y = e.clientY;
      }
    };
    const up = (e: PointerEvent) => {
      const d = this.drag;
      this.drag = null;
      if (d && !d.moved && performance.now() - d.t < 350) this.onTap?.(e.clientX, e.clientY);
    };
    const resize = () => this.measure();
    window.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("touchstart", touch, { passive: true });
    window.addEventListener("keydown", key);
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("resize", resize);
    this.offs.push(() => {
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("touchstart", touch);
      window.removeEventListener("keydown", key);
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("resize", resize);
      lenis.destroy();
    });
  }

  /** The film's track: where it starts on the page, and how tall a screen is. */
  measure() {
    const vw = window.innerWidth;
    // Keep the height steady while a phone's toolbars come and go.
    if (vw !== film.vw || Math.abs(window.innerHeight - film.vh) > 120 || !this.top) film.vh = window.innerHeight;
    film.vw = vw;
    const track = document.querySelector<HTMLElement>(".st-track");
    if (track) {
      track.style.setProperty("--st-vh", `${film.vh}px`);
      this.top = track.getBoundingClientRect().top + window.scrollY;
    }
  }

  stop() {
    this.offs.forEach((f) => f());
    this.offs = [];
    this.lenis = null;
  }

  private y(P: number) {
    return this.top + P * film.vh;
  }

  /** Once per frame. */
  update(dt: number, time: number) {
    const lenis = this.lenis;
    if (lenis) lenis.raf(time);
    const scrollY = lenis ? lenis.scroll : window.scrollY;
    this.P = Math.max(0, (scrollY - this.top) / film.vh);
    const now = performance.now();

    if (film.playing && this.auto) this.play_(now);
    else if (!film.playing && lenis && film.started && !this.gliding && now - this.lastInput > 1150 && this.P < FILM_LEN - 0.02) {
      // At rest: settle on the nearest composed frame, biased the way you were going.
      const v = Math.abs(lenis.velocity ?? 0);
      if (v < 0.4) {
        const r = this.nearest(this.P, this.dir);
        if (Math.abs(r - this.P) > 0.004 && Math.abs(r - this.P) < 1.25) {
          this.gliding = true;
          lenis.scrollTo(this.y(r), {
            duration: 0.9 + Math.abs(r - this.P) * 1.2,
            easing: (t: number) => 1 - Math.pow(1 - t, 3),
            onComplete: () => (this.gliding = false),
          });
        }
        this.lastInput = now;
      }
    }

    // The film follows the scroll with weight; a big jump cuts.
    const target = Math.min(this.P, FILM_LEN + 0.5);
    if (film.reduced || Math.abs(target - this.sp.x) > 2.5) {
      this.sp.x = target;
      this.sp.v = 0;
    } else spring(this.sp, target, 4.2, dt);
    this.Ps = this.sp.x;
    film.P = this.P;
    film.Ps = this.Ps;
  }

  /**
   * The composed frame to settle on: the next one the way you were going once
   * you are a fifth of the way there (the home film's rule), else the one you
   * left, so a deliberate scroll is never pulled back.
   */
  private nearest(P: number, dir: number) {
    let a = RESTS[0];
    let b = RESTS[RESTS.length - 1];
    for (const r of RESTS) {
      if (r <= P) a = r;
      if (r >= P) {
        b = r;
        break;
      }
    }
    if (b - a < 1e-6) return a;
    const k = (P - a) / (b - a);
    if (dir > 0) return k > 0.2 ? b : a;
    if (dir < 0) return k < 0.8 ? a : b;
    return k < 0.5 ? a : b;
  }

  /** Step to the next / previous composed frame. */
  step(dir: 1 | -1) {
    const P = this.P;
    let to = dir > 0 ? FILM_LEN : 0;
    if (dir > 0) {
      for (const r of RESTS) if (r > P + 0.05) {
        to = r;
        break;
      }
    } else {
      for (let i = RESTS.length - 1; i >= 0; i--)
        if (RESTS[i] < P - 0.05) {
          to = RESTS[i];
          break;
        }
    }
    this.dir = dir;
    this.goto(to);
  }

  /** Land on P at once (look-dev, and the far jumps). */
  jump(P: number) {
    this.lenis?.scrollTo(this.y(P), { immediate: true, force: true });
    this.sp.x = P;
    this.sp.v = 0;
    this.P = this.Ps = P;
    this.lastInput = performance.now();
  }

  goto(P: number) {
    const lenis = this.lenis;
    if (!lenis) return;
    const d = Math.abs(P - this.P);
    this.gliding = true;
    if (d > 3) {
      // Far: cut there (the film lands on the new frame at once).
      lenis.scrollTo(this.y(P), { immediate: true, force: true });
      this.gliding = false;
    } else
      lenis.scrollTo(this.y(P), {
        duration: Math.min(3.2, 0.9 + d * 1.1),
        easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
        force: true,
        onComplete: () => (this.gliding = false),
      });
    this.lastInput = performance.now();
  }

  /* ---- playing like a film -------------------------------------------------- */

  play() {
    if (!this.lenis || film.playing) return;
    if (this.P >= FILM_LEN - 0.05) this.goto(0);
    film.playing = true;
    const now = performance.now();
    this.auto = { phase: "hold", t0: now, from: this.P, to: this.P, dur: 0, until: now + 600 };
    events.emit("playing", true);
  }
  pause() {
    if (!film.playing) return;
    film.playing = false;
    this.auto = null;
    events.emit("playing", false);
  }
  toggle() {
    if (film.playing) this.pause();
    else this.play();
  }

  private play_(now: number) {
    const a = this.auto!;
    const lenis = this.lenis!;
    if (a.phase === "hold") {
      if (now < a.until) return;
      let to = FILM_LEN;
      for (const r of RESTS) if (r > this.P + 0.02) {
        to = r;
        break;
      }
      if (this.P >= FILM_LEN - 0.02) {
        this.pause();
        return;
      }
      const d = to - this.P;
      // About five and a half seconds a screen, a little quicker over long stretches.
      a.phase = "move";
      a.t0 = now;
      a.from = this.P;
      a.to = to;
      a.dur = Math.max(1200, d * 5200 - Math.max(0, d - 1) * 900);
    }
    if (a.phase === "move") {
      const k = Math.min(1, (now - a.t0) / a.dur);
      // Ease in and out, so it arrives on each frame and leaves it gently.
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const P = a.from + (a.to - a.from) * e;
      lenis.scrollTo(this.y(P), { immediate: true, force: true });
      if (k >= 1) {
        a.phase = "hold";
        a.until = now + dwellAt(a.to) * 1000;
      }
    }
  }
}
