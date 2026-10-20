import type * as THREE from "three";
import type { World } from "./world";
import { range } from "./ease";
import { B } from "./script";

/**
 * THE SCORE, made live (Web Audio: no files, nothing licensed). Half of the
 * film. Everything is synthesised here:
 *
 *   room      a large room's reverb, generated: noise that decays over ~4.5 s,
 *             darker as it fades
 *   pad       six voices that glide to a new chord as each chapter begins:
 *             dusk, waiting, a cold minor for the night, a sour cluster for
 *             the admin, a low drone a year on; at the turn, nothing; then
 *             lydian, major, warm
 *   taps      a soft click for every tap on a screen
 *   mail      a whoosh as an envelope flies; a ping as it lands
 *   lost      a falling tone for every customer who leaves
 *   ticks     the clock, faster as the hours fly past (backward at the turn)
 *   type      keys in bursts while the owner types it all out again
 *   turn      silence; a sub-bass hit; paper as it comes apart; a riser into
 *             the evening again; a glass tick as each new part locks
 *   kept      a bell for every customer who stays, or comes back
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
  if (P < 2.4) return "open";
  if (P < 5.0) return "website";
  if (P < 7.8) return "inbox";
  if (P < 10.6) return "admin";
  if (P < 12.8) return "followup";
  if (P < B.handsOff[1]) return "you";
  if (P < B.rewind[1]) return "silence";
  if (P < 19.8) return "indigo";
  if (P < 21.8) return "teal";
  if (P < 23.8) return "platform";
  if (P < 25.8) return "gold";
  if (P < 28.0) return "home";
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
  private pulseAcc = 0;
  private pulseN = 0;
  private loops: (OscillatorNode | AudioBufferSourceNode)[] = [];
  private clangs: number[] = [];
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
    this.loops.push(lfo);
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
      this.loops.push(a, bo);
      this.pad.push({ a, b: bo, g });
    }
    this.sub = c.createOscillator();
    this.sub.type = "sine";
    this.sub.frequency.value = mtof(26);
    this.subG = c.createGain();
    this.subG.gain.value = 0;
    this.sub.connect(this.subG).connect(this.bus);
    this.sub.start();
    this.loops.push(this.sub);

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
    this.loops.push(src);
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
    for (const source of this.loops) {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
    }
    this.loops = [];
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
  private bell(midi: number, pan: number, v = 0.08, dur = 2.6, when = 0) {
    const c = this.ctx!;
    const t = c.currentTime + when;
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

  /** One customer's musical fingerprint: unresolved first, resolved later. */
  private theme(resolved: boolean, quiet = false) {
    const notes = resolved ? [74, 78, 81, 86] : [74, 77, 81, 76];
    notes.forEach((note, i) => this.bell(note, (i - 1.5) * 0.13, quiet ? 0.024 : 0.045, 3.2, i * 0.48));
  }

  /** The old machine's rhythm feels like the owner's heartbeat. */
  private heartbeat(v: number) {
    const c = this.ctx!;
    for (const [delay, strength] of [[0, 1], [0.19, 0.55]]) {
      const t = c.currentTime + delay;
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(76, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.23);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v * strength, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
      o.connect(g).connect(this.bus);
      o.start(t);
      o.stop(t + 0.4);
    }
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
  /** Time running backward: a tone winding down and down, wobbling, under the riser. */
  private unwind(seconds: number) {
    const c = this.ctx!;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(70, t + seconds);
    const w = c.createOscillator();
    w.type = "sine";
    w.frequency.value = 6.5;
    const wg = c.createGain();
    wg.gain.value = 40;
    w.connect(wg).connect(o.frequency);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(3000, t);
    lp.frequency.exponentialRampToValueAtTime(300, t + seconds);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.3);
    g.gain.setValueAtTime(0.09, t + seconds - 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.05);
    o.connect(lp).connect(g).connect(this.pan(-0.15)).connect(this.bus);
    const s = c.createGain();
    s.gain.value = 0.5;
    g.connect(s).connect(this.rev);
    o.start(t);
    w.start(t);
    o.stop(t + seconds + 0.1);
    w.stop(t + seconds + 0.1);
  }

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

  /** Air through a band-pass sweeping up then down: an envelope flying past. */
  private whoosh(seconds: number, pan = 0, v = 0.12) {
    const c = this.ctx!;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + seconds * 0.45);
    bp.frequency.exponentialRampToValueAtTime(500, t + seconds);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + seconds * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    const p = this.pan(pan);
    src.connect(bp).connect(g).connect(p).connect(this.bus);
    const s = c.createGain();
    s.gain.value = 0.5;
    p.connect(s).connect(this.rev);
    src.start(t, Math.random() * 1.5);
    src.stop(t + seconds + 0.05);
  }

  /** A message arriving: two soft notes. */
  private ping(high = false, v = 0.05) {
    const root = high ? 81 : 76;
    this.bell(root, 0.15, v, 1.4);
    this.bell(root + 7, 0.2, v * 0.8, 1.6, 0.11);
  }

  /** A finger on glass. */
  private tap() {
    this.click(1800, 3, 0.07, 0.02, 0.1, 0, 0.15);
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
    const fwd = P > prev && P - prev < 0.5;
    const crossed = (x: number) => fwd && prev < x && P >= x;
    const inW = (a: number, b: number) => P > a && P < b;

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
      this.pulseAcc = 0;
      if (m === "open") this.theme(false, true);
      if (m === "you") this.theme(false, true);
      if (m === "home") this.theme(true, true);
    }
    const inOld = P < B.handsOff[1];
    const silent = P >= B.handsOff[1] && P < B.rewind[1];
    // THE SILENCE: hands off the keys, the room held still; nothing at all.
    const hush = P >= B.handsOff[1] && P < B.fall[0];
    this.duck.gain.setTargetAtTime(hush ? 0 : 1, t, hush ? 0.035 : 0.006);
    // The room's air: the night hums low; the new evening is lighter.
    this.hum.g.gain.setTargetAtTime(silent ? 0 : inOld ? 0.035 : 0.02, t, 0.3);
    this.hum.bp.frequency.setTargetAtTime(inOld ? 90 : 170, t, 0.5);
    this.roll.g.gain.setTargetAtTime(0, t, 0.1);

    // A pulse under the old way (the owner's heartbeat, late), a clear rhythm in the new.
    const pulseRate = P > 7.8 && P < 10.6 ? 1.3 : P >= 12.8 && P < B.handsOff[0] ? 0.94 : P >= 18 && P < 27.6 ? 1.15 : 0;
    if (!silent && pulseRate) {
      this.pulseAcc += Math.min(dt, 0.1) * pulseRate;
      if (this.pulseAcc >= 1) {
        this.pulseAcc -= 1;
        this.pulseN++;
        if (inOld) this.heartbeat(P >= 12.8 ? 0.1 : 0.06);
        else {
          const root = MOODS[this.mood]?.notes[0] ?? 38;
          const step = [24, 31, 36, 31][this.pulseN % 4];
          this.bell(root + step, this.pulseN % 2 ? -0.24 : 0.24, 0.016, 1.3);
        }
      }
    }

    // Events from the world.
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
      } else if (e.type === "drop") {
        const root = 38;
        this.bell(root + 36, -0.2, 0.09, 5);
        this.bell(root + 43, 0.2, 0.07, 5);
        this.bell(root + 48, 0, 0.05, 6);
      } else if (e.type === "node" && P > B.rewind[1]) {
        this.click(2600 + Math.random() * 2400, 18, 0.05, 0.06 + Math.random() * 0.05, panOf(e.pos), 0, 0.6);
        this.bell(86 + PENTA[this.pulseN % 5], panOf(e.pos), 0.03, 1.6);
      } else if (e.type === "kept") {
        if (this.bellsThisSec < 4) {
          this.bellsThisSec++;
          const root = MOODS[this.mood]?.notes[0] ?? 41;
          const note = root + 36 + PENTA[Math.floor(Math.random() * PENTA.length)] + (Math.random() < 0.3 ? 12 : 0);
          this.bell(note, panOf(e.pos), e.user ? 0.12 : 0.06);
        }
      }
    }

    // Taps on Sam's phone.
    for (const k of [B.tap, B.form, B.send, B.nTap, B.nSend, B.nPick, B.nAccept[1] - 0.02, B.nPaid - 0.02, 24.02, 24.08, 24.14, 24.2, 24.26, 25.24]) if (crossed(k)) this.tap();
    // The envelopes: off, and in.
    if (crossed(B.fly[0])) this.whoosh(2.4, -0.2, 0.13);
    if (crossed(B.land)) this.ping(false, 0.045);
    // Out of the black; the picture parting like a page; the quote going out (the office's side); one picture again; the end.
    for (const [k, len, pan, vol] of [
      [16.34, 2.6, 0, 0.09],
      [18.92, 1.8, 0, 0.06],
      [B.nQuoteSent, 1.0, 0.3, 0.06],
      [27.42, 2.0, 0, 0.08],
      [28.0, 2.6, 0, 0.09],
    ] as const)
      if (crossed(k)) this.whoosh(len, pan, vol);
    // BOTH SIDES: the office's laptop waking in the empty room (right), the reply going, the week filling, 3am.
    if (crossed(B.nWake[0]) || crossed(B.nNight[0] + 0.04)) {
      this.click(1700, 3, 0.05, 0.05, 0.45, 0, 0.4);
      this.bell(74, 0.45, 0.022, 2.4);
    }
    if (crossed(B.nSent) || crossed(B.nNightWrite[1])) this.click(2400, 8, 0.04, 0.04, 0.45, 0, 0.4);
    if (crossed(B.nPick + 0.04)) this.bell(81, 0.45, 0.03, 2.0);
    if (crossed(B.nBack[1])) this.ping(true, 0.06);
    if (crossed(B.replySent + 0.02)) this.ping(false, 0.04);
    // Mail landing on the pile all night, quietly.
    if (inW(B.night[0], B.night[1]) && Math.random() < dt * 1.4) this.click(2900, 6, 0.035, 0.03, 0.4, 0, 0.5);

    // The clock: through the night, faster as the hours fly; backward at the turn; 3am.
    const rewinding = inW(B.rewind[0], B.rewind[1]);
    const ticking = inW(4.7, 7.2) || inW(20.94, 21.12) || rewinding;
    if (ticking && !hush) {
      const speed = Math.min(1, Math.abs(P - prev) / Math.max(dt, 1e-3) / 0.3);
      const rate = 1 + (rewinding ? 22 : 9) * speed * (inW(5.8, 6.9) || inW(20.96, 21.08) || rewinding ? 1 : 0.2);
      this.tickAcc += dt * rate;
      while (this.tickAcc > 1) {
        this.tickAcc -= 1;
        this.tickN++;
        this.click(this.tickN % 2 ? 3200 : 2500, 9, 0.08, 0.03, -0.2, 0, 0.35);
      }
    }
    // Typing: the reply, the spreadsheet, the quote, the invoice; late at night; Sam's thumbs.
    const typing =
      inW(B.reply[0], B.reply[1]) ||
      inW(B.sheet[0], B.sheet[1]) ||
      inW(B.quote[0], B.quote[1]) ||
      inW(B.invoice[0], B.invoice[1]) ||
      inW(12.86, B.handsOff[0]) ||
      inW(B.type[0], B.type[1]) ||
      inW(B.nForm[0], B.nForm[1]);
    if (typing && !silent) {
      this.typeT -= dt;
      if (this.typeT <= 0) {
        if (this.typeBurst <= 0) {
          this.typeBurst = 3 + Math.floor(Math.random() * 9);
          this.typeT = 0.2 + Math.random() * 0.5;
        } else {
          this.typeBurst--;
          this.typeT = 0.055 + Math.random() * 0.06;
          this.click(1600 + Math.random() * 1400, 2.2, 0.05, 0.02, (Math.random() - 0.5) * 0.6, 0, 0.15);
        }
      }
    }
    // The stamp: PAID, by hand; the new way's paid chime; the quote going out.
    if (crossed(B.paid)) {
      this.clang(70, 0.16, 0.6, 0.1);
      this.click(400, 1.2, 0.2, 0.06);
    }
    if (crossed(B.nPaid)) this.ping(true, 0.07);
    if (crossed(B.quoteSent)) this.whoosh(0.7, 0.3, 0.06);

    // THE TURN.
    if (crossed(B.handsOff[0])) this.theme(false, true);
    if (crossed(B.fall[0])) {
      this.riser(2.4);
      // The paper as it burns to light: small bright crackles spread over the gathering.
      this.clangs = Array.from({ length: 22 }, (_, i) => B.fall[0] + 0.02 + i * 0.016 + Math.random() * 0.02);
    }
    for (const k of this.clangs) if (crossed(k)) this.click(3200 + Math.random() * 3600, 14, 0.035, 0.02 + Math.random() * 0.03, (Math.random() - 0.5) * 1.4, 0, 0.6);
    if (crossed(B.rewind[0])) {
      const secs = Math.max(1.2, (B.rewind[1] - B.rewind[0]) * 8);
      this.riser(secs);
      this.unwind(secs);
    }
    if (crossed(B.rewind[1])) {
      this.hit();
      this.theme(true);
      this.bell(74, 0, 0.1, 4);
      this.bell(81, -0.3, 0.07, 4);
      this.bell(86, 0.3, 0.05, 4);
    }
    // Six o'clock: the lid comes down, the lamp clicks off; the van starts.
    if (crossed(B.nClose[1] - 0.02)) this.click(420, 1.4, 0.2, 0.05, 0, 0, 0.4);
    if (crossed(B.nLamp[0] + 0.04)) {
      this.click(3000, 3, 0.25, 0.02);
      this.click(1800, 3, 0.18, 0.03, 0, 0.05);
      this.bell(86, 0, 0.05, 4.2, 0.2);
    }
    // The van's door: the latch as it opens, a low thud as it shuts behind the owner.
    if (crossed(B.nIn[0] - 0.08)) this.click(2200, 6, 0.08, 0.04, 0.3, 0, 0.3);
    if (crossed(B.nIn[1] - 0.01)) {
      this.click(180, 1.2, 0.28, 0.12, 0.3, 0, 0.35);
      this.click(1400, 4, 0.06, 0.03, 0.3, 0.01, 0.2);
    }
    if (crossed(B.nDrive[0])) this.whoosh(3.0, 0.4, 0.05);
    // The end: it all settles.
    this.master.gain.setTargetAtTime(this.on ? 0.9 * (1 - 0.6 * range(P, 28.0, 29.2)) : 0, t, 0.5);
  }
}
