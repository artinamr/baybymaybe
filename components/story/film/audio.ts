import type * as THREE from "three";
import type { World } from "./world";
import { range } from "./ease";

/**
 * THE SCORE, made live (Web Audio: no files, nothing licensed). Half of the
 * film. Everything is synthesised here:
 *
 *   room      a cathedral's reverb, generated: noise that decays over ~4.5 s,
 *             darker as it fades
 *   pad       six voices that glide to a new chord as each chapter begins:
 *             dusk, waiting, a cold minor for the inbox, a sour cluster for
 *             the admin, a low phrygian drone at the edge; at the turn,
 *             nothing; then lydian, major, warm
 *   roll      our customer rolling, the pitch following its speed
 *   lost      a falling tone for every customer that falls
 *   ticks     the clock, faster as the hours fly past
 *   type      typewriters and a carriage bell in the admin; a clank as a claw grabs
 *   turn      silence; a sub-bass hit; groans and clangs as it comes apart; a
 *             riser into the flash; a glass tick as each new piece locks
 *   kept      a bell for every customer who comes back
 */

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

type Mood = { notes: number[]; cut: number; vol: number; sub: number; q?: number };

// One chord per world of colour (MIDI notes, six voices).
const MOODS: Record<string, Mood> = {
  open: { notes: [38, 45, 50, 53, 57, 64], cut: 900, vol: 0.85, sub: 0.6 },
  website: { notes: [45, 52, 57, 59, 62, 64], cut: 1300, vol: 0.9, sub: 0.5 },
  inbox: { notes: [34, 41, 46, 49, 53, 58], cut: 700, vol: 0.85, sub: 0.75 },
  admin: { notes: [37, 44, 49, 50, 56, 61], cut: 1100, vol: 0.75, sub: 0.35, q: 3 },
  followup: { notes: [28, 35, 40, 41, 46, 52], cut: 650, vol: 0.95, sub: 1 },
  you: { notes: [38, 45, 53, 55, 60, 64], cut: 800, vol: 0.7, sub: 0.6 },
  silence: { notes: [38, 45, 53, 55, 60, 64], cut: 300, vol: 0, sub: 0 },
  indigo: { notes: [38, 45, 54, 56, 61, 66], cut: 2600, vol: 0.85, sub: 0.55 },
  teal: { notes: [45, 52, 57, 61, 64, 71], cut: 2800, vol: 0.85, sub: 0.5 },
  platform: { notes: [40, 47, 52, 56, 59, 66], cut: 2600, vol: 0.85, sub: 0.5 },
  gold: { notes: [41, 48, 53, 57, 60, 67], cut: 2400, vol: 0.9, sub: 0.6 },
  home: { notes: [38, 45, 50, 54, 57, 62], cut: 2000, vol: 0.8, sub: 0.55 },
  end: { notes: [41, 48, 53, 57, 60, 67], cut: 1600, vol: 0.45, sub: 0.3 },
};

function moodAt(P: number): string {
  if (P < 2.2) return "open";
  if (P < 4.6) return "website";
  if (P < 7.2) return "inbox";
  if (P < 9.6) return "admin";
  if (P < 11.6) return "followup";
  if (P < 14.0) return "you";
  if (P < 16.08) return "silence";
  if (P < 18.6) return "indigo";
  if (P < 20.2) return "teal";
  if (P < 21.8) return "platform";
  if (P < 23.8) return "gold";
  if (P < 26.0) return "home";
  return "end";
}

/** Notes of the current chord's scale for the bells and ticks (pentatonic over the root). */
const PENTA = [0, 2, 4, 7, 9];

export class Score {
  private ctx: AudioContext | null = null;
  private on = false;
  private master!: GainNode;
  private bus!: GainNode;
  /** Everything goes through this: the turn's silence is total (the room's tail too). */
  private duck!: GainNode;
  private rev!: GainNode;
  private noise!: AudioBuffer;
  private pad: { a: OscillatorNode; b: OscillatorNode; g: GainNode }[] = [];
  private padF!: BiquadFilterNode;
  private padG!: GainNode;
  private sub!: OscillatorNode;
  private subG!: GainNode;
  private roll!: { src: AudioBufferSourceNode; bp: BiquadFilterNode; g: GainNode };
  private hum!: { src: AudioBufferSourceNode; bp: BiquadFilterNode; g: GainNode };
  private mood = "";
  private prevP = -1;
  private tickAcc = 0;
  private tickN = 0;
  private typeT = 0;
  private typeBurst = 0;
  private lastLost = 0;
  private lostThisSec = 0;
  private secT = 0;
  private bellsThisSec = 0;
  private clangs: number[] = [];
  private lockAt: number[] = [];
  private landed = new Set<string>();

  attach(ctx: AudioContext) {
    if (this.ctx) return;
    this.ctx = ctx;
    const c = ctx;
    this.master = c.createGain();
    this.master.gain.value = 0;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.knee.value = 8;
    comp.ratio.value = 8;
    comp.attack.value = 0.004;
    comp.release.value = 0.3;
    this.master.connect(comp).connect(c.destination);
    this.duck = c.createGain();
    this.duck.gain.value = 1;
    this.duck.connect(this.master);
    this.bus = c.createGain();
    this.bus.gain.value = 1;
    this.bus.connect(this.duck);
    // The room.
    const conv = c.createConvolver();
    conv.buffer = this.impulse(4.6);
    this.rev = c.createGain();
    this.rev.gain.value = 1;
    const revOut = c.createGain();
    revOut.gain.value = 0.55;
    this.rev.connect(conv).connect(revOut).connect(this.duck);
    // Noise, for everything that hisses, rolls and clicks.
    const n = c.sampleRate * 2;
    this.noise = c.createBuffer(1, n, c.sampleRate);
    const d = this.noise.getChannelData(0);
    let b = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      b = 0.97 * b + 0.03 * w;
      d[i] = w * 0.55 + b * 3.2;
    }

    // The pad.
    this.padF = c.createBiquadFilter();
    this.padF.type = "lowpass";
    this.padF.frequency.value = 800;
    this.padF.Q.value = 0.7;
    this.padG = c.createGain();
    this.padG.gain.value = 0;
    this.padF.connect(this.padG);
    this.padG.connect(this.bus);
    const padSend = c.createGain();
    padSend.gain.value = 0.8;
    this.padG.connect(padSend).connect(this.rev);
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoG = c.createGain();
    lfoG.gain.value = 220;
    lfo.connect(lfoG).connect(this.padF.frequency);
    lfo.start();
    for (let i = 0; i < 6; i++) {
      const a = c.createOscillator();
      const bo = c.createOscillator();
      a.type = "sawtooth";
      bo.type = "triangle";
      a.detune.value = -7 + i;
      bo.detune.value = 6 - i;
      const g = c.createGain();
      g.gain.value = 0.06 / (1 + i * 0.12);
      a.connect(g);
      bo.connect(g);
      g.connect(this.padF);
      a.frequency.value = mtof(38 + i * 5);
      bo.frequency.value = mtof(38 + i * 5);
      a.start();
      bo.start();
      this.pad.push({ a, b: bo, g });
    }
    this.sub = c.createOscillator();
    this.sub.type = "sine";
    this.sub.frequency.value = mtof(26);
    this.subG = c.createGain();
    this.subG.gain.value = 0;
    this.sub.connect(this.subG).connect(this.bus);
    this.sub.start();

    // Rolling (our customer), and the machine's hum.
    this.roll = this.loopNoise(300, 1.1, 0);
    this.hum = this.loopNoise(90, 0.6, 0.0);
    const humSend = c.createGain();
    humSend.gain.value = 0.6;
    this.hum.g.connect(humSend).connect(this.rev);
  }

  private loopNoise(f: number, q: number, v: number) {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = f;
    bp.Q.value = q;
    const g = c.createGain();
    g.gain.value = v;
    src.connect(bp).connect(g).connect(this.bus);
    src.start();
    return { src, bp, g };
  }

  /** A cathedral, generated: decaying noise, two channels, darker as it fades. */
  private impulse(seconds: number) {
    const c = this.ctx!;
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / c.sampleRate;
        const w = Math.random() * 2 - 1;
        // The longer it rings, the more it is filtered.
        const k = 0.06 + 0.9 * Math.min(1, t / seconds);
        lp += (w - lp) * (1 - k);
        const env = Math.exp(-t * (6.9 / seconds)) * (t < 0.012 ? t / 0.012 : 1);
        d[i] = lp * env * 0.9;
      }
      // A few early reflections.
      for (let k = 0; k < 6; k++) {
        const at = Math.floor(c.sampleRate * (0.019 + k * 0.023 + ch * 0.007));
        if (at < len) d[at] += (0.5 - k * 0.06) * (Math.random() > 0.5 ? 1 : -1);
      }
    }
    return buf;
  }

  setOn(on: boolean) {
    this.on = on;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(on ? 0.9 : 0, t, on ? 0.25 : 0.12);
    if (on && this.ctx.state === "suspended" && typeof OfflineAudioContext !== "undefined" && !(this.ctx instanceof OfflineAudioContext)) void this.ctx.resume();
  }

  dispose() {
    if (!this.ctx) return;
    try {
      this.master.disconnect();
    } catch {
      /* already gone */
    }
  }

  /* ---- one-shot voices ------------------------------------------------------ */

  private pan(x: number) {
    const p = this.ctx!.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, x));
    return p;
  }

  /** A falling tone: a customer lost. */
  private fallTone(pan: number, big = false) {
    const c = this.ctx!;
    const t = c.currentTime;
    const f0 = big ? 520 : 600 + Math.random() * 520;
    const dur = big ? 2.6 : 1.3 + Math.random() * 0.5;
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 / (big ? 8 : 5), t + dur);
    const o2 = c.createOscillator();
    o2.type = "triangle";
    o2.frequency.setValueAtTime(f0 * 1.5, t);
    o2.frequency.exponentialRampToValueAtTime((f0 * 1.5) / 6, t + dur);
    const g = c.createGain();
    const v = big ? 0.2 : 0.05;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    const g2 = c.createGain();
    g2.gain.value = 0.25;
    const p = this.pan(pan);
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(p);
    p.connect(this.bus);
    const s = c.createGain();
    s.gain.value = big ? 0.9 : 0.6;
    p.connect(s).connect(this.rev);
    o.start(t);
    o2.start(t);
    o.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);
  }

  /** An FM bell: a customer kept. */
  private bell(midi: number, pan: number, v = 0.08, dur = 2.6) {
    const c = this.ctx!;
    const t = c.currentTime;
    const f = mtof(midi);
    const car = c.createOscillator();
    car.frequency.value = f;
    const mod = c.createOscillator();
    mod.frequency.value = f * 3.5;
    const mg = c.createGain();
    mg.gain.setValueAtTime(f * 2.4, t);
    mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dur * 0.6);
    mod.connect(mg).connect(car.frequency);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    const p = this.pan(pan);
    car.connect(g).connect(p).connect(this.bus);
    const s = c.createGain();
    s.gain.value = 0.7;
    p.connect(s).connect(this.rev);
    car.start(t);
    mod.start(t);
    car.stop(t + dur + 0.05);
    mod.stop(t + dur + 0.05);
  }

  /** A short filtered noise burst (ticks, typewriter keys, clicks). */
  private click(f: number, q: number, v: number, dur: number, pan = 0, when = 0, wet = 0.25) {
    const c = this.ctx!;
    const t = c.currentTime + when;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = f;
    bp.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    const p = this.pan(pan);
    src.connect(bp).connect(g).connect(p).connect(this.bus);
    if (wet) {
      const s = c.createGain();
      s.gain.value = wet;
      p.connect(s).connect(this.rev);
    }
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.02);
  }

  /** Metal: a few inharmonic partials, struck. */
  private clang(base: number, v: number, dur: number, pan = 0) {
    const c = this.ctx!;
    const t = c.currentTime;
    const p = this.pan(pan);
    const g = c.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    g.connect(p).connect(this.bus);
    const s = c.createGain();
    s.gain.value = 0.9;
    p.connect(s).connect(this.rev);
    for (const r of [1, 2.76, 5.4, 8.93]) {
      const o = c.createOscillator();
      o.frequency.value = base * r * (0.99 + Math.random() * 0.02);
      const og = c.createGain();
      og.gain.value = 1 / r;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + dur);
    }
    this.click(base * 6, 1, v * 0.8, 0.05, pan, 0, 0.3);
  }

  /** The hit at the turn: a sub that drops, with a crack of noise. */
  private hit() {
    const c = this.ctx!;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(70, t);
    o.frequency.exponentialRampToValueAtTime(26, t + 1.6);
    const sh = c.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = i / 128 - 1;
      curve[i] = Math.tanh(x * 2.6);
    }
    sh.curve = curve;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 2.6);
    o.connect(sh).connect(g).connect(this.bus);
    const s = c.createGain();
    s.gain.value = 0.5;
    g.connect(s).connect(this.rev);
    o.start(t);
    o.stop(t + 2.7);
    this.click(180, 0.6, 0.6, 0.6, 0, 0, 0.8);
  }

  /** The rise into the flash. */
  private riser(seconds: number) {
    const c = this.ctx!;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(200, t);
    bp.frequency.exponentialRampToValueAtTime(6000, t + seconds);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + seconds);
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.15);
    src.connect(bp).connect(g).connect(this.bus);
    const s = c.createGain();
    s.gain.value = 0.6;
    g.connect(s).connect(this.rev);
    src.start(t);
    src.stop(t + seconds + 0.2);
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(880, t + seconds);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(400, t);
    lp.frequency.exponentialRampToValueAtTime(5000, t + seconds);
    const og = c.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.05, t + seconds);
    og.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.1);
    o.connect(lp).connect(og).connect(this.bus);
    o.start(t);
    o.stop(t + seconds + 0.15);
  }

  /** A soft thump as a title lands. */
  land() {
    if (!this.ctx || !this.on) return;
    const c = this.ctx;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.45);
    o.connect(g).connect(this.bus);
    const s = c.createGain();
    s.gain.value = 0.3;
    g.connect(s).connect(this.rev);
    o.start(t);
    o.stop(t + 0.5);
  }

  /** You dropped one in. */
  drop() {
    if (!this.ctx || !this.on) return;
    this.bell(84, 0, 0.05, 0.9);
    this.click(2400, 4, 0.12, 0.05);
  }

  /* ---- the frame -------------------------------------------------------------- */

  update(P: number, w: World, dt: number) {
    const c = this.ctx;
    if (!c || !this.on) {
      this.prevP = P;
      return;
    }
    const t = c.currentTime;
    const prev = this.prevP < 0 ? P : this.prevP;
    this.prevP = P;
    const fwd = P > prev;
    const crossed = (x: number) => fwd && prev < x && P >= x;

    // The chord, per chapter.
    const m = moodAt(P);
    if (m !== this.mood) {
      const mood = MOODS[m];
      const glide = m === "indigo" ? 0.05 : 0.9;
      this.pad.forEach((v, i) => {
        const f = mtof(mood.notes[i]);
        v.a.frequency.setTargetAtTime(f, t, glide);
        v.b.frequency.setTargetAtTime(f * (i === 5 ? 2 : 1), t, glide);
      });
      this.sub.frequency.setTargetAtTime(mtof(mood.notes[0] - 12), t, glide);
      this.padF.frequency.setTargetAtTime(mood.cut, t, 1.2);
      this.padF.Q.setTargetAtTime(mood.q ?? 0.7, t, 1.2);
      // The turn: everything stops, at once.
      const silent = m === "silence";
      this.padG.gain.setTargetAtTime(mood.vol * 0.9, t, silent ? 0.03 : m === "indigo" ? 0.08 : 1.4);
      this.subG.gain.setTargetAtTime(mood.sub * 0.16, t, silent ? 0.03 : 1.5);
      this.mood = m;
    }
    const inOld = P < 14.0;
    const silent = P >= 14.0 && P < 16.08;
    // THE SILENCE: from the freeze to the hit, nothing at all, not even the room.
    const hush = P >= 14.0 && P < 14.95;
    this.duck.gain.setTargetAtTime(hush ? 0 : 1, t, hush ? 0.035 : 0.006);
    // The machine's hum (old: a low drone of gears; new: brighter, quieter).
    this.hum.g.gain.setTargetAtTime(silent ? 0 : inOld ? 0.05 : 0.025, t, 0.3);
    this.hum.bp.frequency.setTargetAtTime(inOld ? 80 : 160, t, 0.5);

    // Our customer rolling.
    const roll = !silent && w.hero.visible && !w.hero.falling ? w.info.speed : 0;
    this.roll.g.gain.setTargetAtTime(0.16 * roll, t, 0.08);
    this.roll.bp.frequency.setTargetAtTime(160 + 1100 * roll, t, 0.1);

    // Events from the crowd.
    this.secT += dt;
    if (this.secT > 1) {
      this.secT = 0;
      this.lostThisSec = 0;
      this.bellsThisSec = 0;
    }
    const cam = w.camera;
    const panOf = (p: THREE.Vector3) => Math.max(-1, Math.min(1, p.clone().project(cam).x * 0.8));
    for (const e of w.events) {
      if (e.type === "lost" && !silent) {
        if (this.lostThisSec < 7 && t - this.lastLost > 0.05) {
          this.lostThisSec++;
          this.lastLost = t;
          this.fallTone(panOf(e.pos), e.user);
        }
      } else if (e.type === "kept") {
        if (this.bellsThisSec < 4) {
          this.bellsThisSec++;
          const root = MOODS[this.mood]?.notes[0] ?? 41;
          const note = root + 36 + PENTA[Math.floor(Math.random() * PENTA.length)] + (Math.random() < 0.3 ? 12 : 0);
          this.bell(note, panOf(e.pos), e.user ? 0.12 : 0.07);
        }
      } else if (e.type === "grab" && P > 7.1 && P < 9.7) {
        this.clang(180 + Math.random() * 60, 0.05, 0.6, 0.3);
      } else if (e.type === "slip" && P > 7.1 && P < 9.7) {
        this.clang(320, 0.04, 0.4, 0.2);
      } else if ((e.type === "ring" || e.type === "node") && P > 16.9) {
        if (Math.random() < 0.5) this.bell(84 + PENTA[Math.floor(Math.random() * 5)], 0, 0.018, 0.8);
      } else if (e.type === "catch" && P > 18.5 && P < 20.3) {
        this.click(900, 0.8, 0.05, 0.35, 0, 0, 0.5);
      }
    }

    // Our customer: the gate lifting; over the edge; the stamp.
    if (crossed(3.9)) this.clang(90, 0.12, 1.6, -0.1);
    if (crossed(10.66)) this.fallTone(0, true);
    if (crossed(9.44)) this.clang(140, 0.14, 1.2, 0.1);
    if (crossed(6.8)) this.click(600, 2, 0.15, 0.25, 0, 0, 0.5);

    // The inbox: the clock, faster as the night flies past.
    if (P > 4.7 && P < 7.15 && !silent) {
      const rate = 1 + 9 * Math.min(1, Math.abs(P - prev) / Math.max(dt, 1e-3) / 0.4) * (P > 5.3 && P < 6.75 ? 1 : 0.2);
      this.tickAcc += dt * rate;
      while (this.tickAcc > 1) {
        this.tickAcc -= 1;
        this.tickN++;
        this.click(this.tickN % 2 ? 3200 : 2500, 9, 0.09, 0.03, -0.2, 0, 0.35);
      }
    }
    // The admin: typewriters, in bursts, and the carriage bell.
    if (P > 7.25 && P < 9.6) {
      this.typeT -= dt;
      if (this.typeT <= 0) {
        if (this.typeBurst <= 0) {
          this.typeBurst = 3 + Math.floor(Math.random() * 9);
          this.typeT = 0.25 + Math.random() * 0.6;
          if (Math.random() < 0.25) this.bell(91, 0.4, 0.035, 0.8);
        } else {
          this.typeBurst--;
          this.typeT = 0.06 + Math.random() * 0.07;
          this.click(2200 + Math.random() * 1600, 2.5, 0.07, 0.025, (Math.random() - 0.5) * 0.8, 0, 0.2);
        }
      }
    }

    // THE TURN.
    if (crossed(14.95)) {
      this.hit();
      // Groans and clangs as it comes apart, spread over the fall.
      this.clangs = Array.from({ length: 11 }, (_, i) => 14.98 + i * 0.09 + Math.random() * 0.08);
    }
    for (const k of this.clangs) if (crossed(k)) this.clang(60 + Math.random() * 120, 0.09, 2.2, (Math.random() - 0.5) * 1.4);
    if (crossed(15.72)) this.riser(Math.max(0.8, (16.1 - 15.72) * 2.8));
    if (crossed(16.08)) {
      this.hit();
      this.bell(74, 0, 0.12, 4);
      this.bell(81, -0.3, 0.08, 4);
      this.bell(86, 0.3, 0.06, 4);
    }
    // A glass tick as each new piece locks into place.
    if (fwd && P > 15.9 && P < 17.1) {
      if (!this.lockAt.length) this.lockAt = w.lockTimes();
      let n = 0;
      for (const a of this.lockAt) if (prev < a && P >= a) n++;
      const root = 62;
      for (let i = 0; i < Math.min(n, 5); i++) this.click(2600 + Math.random() * 2400, 18, 0.05, 0.06 + Math.random() * 0.05, (Math.random() - 0.5) * 1.6, i * 0.012, 0.6);
      if (n > 0 && Math.random() < 0.15) this.bell(root + 24 + PENTA[Math.floor(Math.random() * 5)], (Math.random() - 0.5), 0.03, 1.4);
    }
    // Six o'clock: the lamp clicks off.
    if (crossed(24.62)) {
      this.click(3000, 3, 0.25, 0.02);
      this.click(1800, 3, 0.18, 0.03, 0, 0.05);
    }
    // The end: it all settles.
    this.master.gain.setTargetAtTime(this.on ? 0.9 * (1 - 0.6 * range(P, 26.0, 27.2)) : 0, t, 0.5);
  }
}
