import * as THREE from "three";
import { range, smooth } from "./ease";

/**
 * EACH CHAPTER'S WORLD OF COLOUR (docs/STORY.md §4): amber dusk while they
 * wait at the gate, cold midnight over the unanswered inbox, a sick
 * fluorescent green for the admin, blood red at the edge and in the pit;
 * black at the turn, a white flash, then indigo, teal and gold for the new
 * machine, and warm paper at the end. A look is the fog, the lights, the
 * windows, the dust and shafts, and the grade; between stops it blends.
 */

export type Look = {
  fog: THREE.Color;
  fogD: number;
  key: THREE.Color;
  keyK: number;
  keyDir: THREE.Vector3;
  fill: THREE.Color;
  fillK: number;
  sky: THREE.Color;
  ground: THREE.Color;
  hemiK: number;
  win: THREE.Color;
  winK: number;
  shaft: number;
  dust: number;
  env: number;
  exposure: number;
  bloom: number;
  threshold: number;
  lift: THREE.Vector3;
  gamma: THREE.Vector3;
  gain: THREE.Vector3;
  sat: number;
  shadow: THREE.Vector3;
  high: THREE.Vector3;
  split: number;
  vignette: number;
  grain: number;
  aberration: number;
  pit: number;
};

const C = (r: number, g: number, b: number) => new THREE.Color(r, g, b);
const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function base(): Look {
  return {
    fog: C(0.01, 0.01, 0.012),
    fogD: 0.008,
    key: C(1, 0.6, 0.3),
    keyK: 2,
    keyDir: V3(-0.45, 0.62, -0.64).normalize(),
    fill: C(0.4, 0.45, 0.6),
    fillK: 0.25,
    sky: C(0.2, 0.15, 0.1),
    ground: C(0.02, 0.015, 0.012),
    hemiK: 0.35,
    win: C(1.2, 0.6, 0.25),
    winK: 1,
    shaft: 1,
    dust: 1,
    env: 0.9,
    exposure: 1,
    bloom: 0.9,
    threshold: 1.05,
    lift: V3(0, 0, 0),
    gamma: V3(1, 1, 1),
    gain: V3(1, 1, 1),
    sat: 1,
    shadow: V3(0, 0, 0),
    high: V3(0, 0, 0),
    split: 0,
    vignette: 0.45,
    grain: 0.055,
    aberration: 0.7,
    pit: 0.5,
  };
}

const L = (o: Partial<Look>): Look => Object.assign(base(), o);

export const LOOKS = {
  // The machine in the dark, before anyone arrives: dusk, low and warm.
  open: L({
    fog: C(0.022, 0.012, 0.008),
    fogD: 0.0062,
    key: C(1.0, 0.5, 0.2),
    keyK: 2.6,
    sky: C(0.25, 0.13, 0.06),
    hemiK: 0.28,
    win: C(2.4, 1.05, 0.38),
    winK: 1,
    shaft: 1.1,
    gain: V3(1.06, 0.96, 0.86),
    lift: V3(0.012, 0.006, 0.0),
    shadow: V3(0.0, 0.05, 0.08),
    high: V3(0.1, 0.04, -0.02),
    split: 1,
    sat: 1.05,
    exposure: 1.05,
  }),
  // Waiting: amber dusk.
  website: L({
    fog: C(0.05, 0.022, 0.009),
    fogD: 0.011,
    key: C(1.0, 0.52, 0.18),
    keyK: 3.0,
    keyDir: V3(0.15, 0.55, -0.82).normalize(),
    fill: C(0.35, 0.3, 0.4),
    sky: C(0.42, 0.22, 0.08),
    hemiK: 0.4,
    win: C(3.4, 1.5, 0.45),
    winK: 1.2,
    shaft: 1.35,
    dust: 1.3,
    gain: V3(1.1, 0.97, 0.8),
    lift: V3(0.018, 0.008, 0.0),
    shadow: V3(0.0, 0.04, 0.07),
    high: V3(0.12, 0.05, -0.03),
    split: 1,
    sat: 1.08,
    exposure: 1.1,
    pit: 0.3,
  }),
  // The unanswered inbox: cold midnight.
  inbox: L({
    fog: C(0.006, 0.012, 0.03),
    fogD: 0.012,
    key: C(0.4, 0.55, 1.0),
    keyK: 2.2,
    keyDir: V3(-0.2, 0.7, -0.68).normalize(),
    fill: C(0.25, 0.32, 0.55),
    fillK: 0.3,
    sky: C(0.06, 0.1, 0.22),
    ground: C(0.01, 0.012, 0.02),
    hemiK: 0.4,
    win: C(0.35, 0.6, 1.7),
    winK: 0.8,
    shaft: 0.55,
    dust: 0.8,
    gain: V3(0.88, 0.97, 1.12),
    lift: V3(0.0, 0.006, 0.022),
    shadow: V3(-0.02, 0.0, 0.08),
    high: V3(0.0, 0.03, 0.08),
    split: 1,
    sat: 0.85,
    exposure: 1.08,
    pit: 0.25,
  }),
  // The admin: sick, flickering fluorescent green.
  admin: L({
    fog: C(0.01, 0.018, 0.008),
    fogD: 0.0105,
    key: C(0.62, 1.0, 0.55),
    keyK: 1.5,
    keyDir: V3(0.1, 0.92, 0.35).normalize(),
    fill: C(0.4, 0.55, 0.35),
    fillK: 0.35,
    sky: C(0.1, 0.16, 0.07),
    ground: C(0.012, 0.018, 0.01),
    hemiK: 0.45,
    win: C(0.5, 0.9, 0.3),
    winK: 0.35,
    shaft: 0.0,
    dust: 0.6,
    gain: V3(0.94, 1.06, 0.84),
    lift: V3(0.008, 0.018, 0.0),
    gamma: V3(1, 1.03, 0.97),
    shadow: V3(0.0, 0.06, 0.0),
    high: V3(0.02, 0.06, -0.05),
    split: 1,
    sat: 0.78,
    exposure: 1.12,
    pit: 0.3,
  }),
  // The edge, and the pit: blood red.
  followup: L({
    fog: C(0.016, 0.0015, 0.001),
    fogD: 0.0065,
    key: C(1.0, 0.16, 0.06),
    keyK: 2.2,
    keyDir: V3(0.2, -0.7, 0.68).normalize(),
    fill: C(0.5, 0.2, 0.2),
    fillK: 0.12,
    sky: C(0.03, 0.005, 0.005),
    ground: C(0.18, 0.018, 0.008),
    hemiK: 0.3,
    win: C(1.4, 0.18, 0.08),
    winK: 0.55,
    shaft: 0.25,
    dust: 0.9,
    gain: V3(1.12, 0.9, 0.86),
    lift: V3(0.0015, 0.0, 0.0),
    shadow: V3(0.006, -0.004, -0.004),
    high: V3(0.08, 0.0, -0.02),
    split: 1,
    sat: 1.1,
    exposure: 1.0,
    pit: 0.4,
  }),
  // You: one lamp in a dark hall; then all of it at once.
  you: L({
    fog: C(0.012, 0.008, 0.008),
    fogD: 0.0058,
    key: C(0.75, 0.42, 0.3),
    keyK: 1.6,
    keyDir: V3(-0.5, 0.5, -0.7).normalize(),
    fill: C(0.3, 0.3, 0.4),
    fillK: 0.25,
    sky: C(0.1, 0.06, 0.05),
    hemiK: 0.3,
    win: C(1.2, 0.35, 0.2),
    winK: 0.6,
    shaft: 0.6,
    dust: 0.8,
    gain: V3(1.04, 0.95, 0.92),
    shadow: V3(0.0, 0.02, 0.05),
    high: V3(0.06, 0.02, 0.0),
    split: 1,
    sat: 1.0,
    exposure: 1.1,
    pit: 0.35,
  }),
  // The turn: nothing.
  black: L({
    fog: C(0.0, 0.0, 0.0),
    fogD: 0.009,
    keyK: 0.5,
    hemiK: 0.05,
    winK: 0.05,
    shaft: 0,
    dust: 0.2,
    exposure: 0.85,
    sat: 0.6,
    vignette: 0.7,
    pit: 0.4,
  }),
  // It comes apart: no fill, a cold light from behind on every falling piece.
  tear: L({
    fog: C(0.004, 0.004, 0.008),
    fogD: 0.006,
    key: C(0.72, 0.82, 1.0),
    keyK: 3.4,
    keyDir: V3(0.1, 0.55, -0.83).normalize(),
    fill: C(0.5, 0.35, 0.25),
    fillK: 0.35,
    sky: C(0.04, 0.04, 0.06),
    hemiK: 0.2,
    winK: 0.15,
    shaft: 0.35,
    dust: 1.4,
    exposure: 1.0,
    sat: 0.75,
    vignette: 0.6,
    pit: 0.7,
  }),
  // The new machine: glass and indigo light.
  indigo: L({
    fog: C(0.012, 0.008, 0.045),
    fogD: 0.0095,
    key: C(0.55, 0.45, 1.0),
    keyK: 2.4,
    keyDir: V3(-0.3, 0.7, -0.64).normalize(),
    fill: C(0.5, 0.5, 0.8),
    fillK: 0.4,
    sky: C(0.12, 0.08, 0.3),
    ground: C(0.015, 0.01, 0.03),
    hemiK: 0.45,
    win: C(0.6, 0.45, 2.6),
    winK: 1.1,
    shaft: 0.9,
    dust: 1.0,
    env: 1.2,
    gain: V3(0.98, 0.98, 1.06),
    lift: V3(0.004, 0.0, 0.016),
    shadow: V3(0.0, 0.0, 0.08),
    high: V3(0.03, 0.02, 0.06),
    split: 1,
    sat: 1.1,
    exposure: 1.12,
    grain: 0.04,
    vignette: 0.38,
    pit: 0.0,
  }),
  // AI at 3am: indigo and teal, the moon high.
  teal: L({
    fog: C(0.004, 0.02, 0.03),
    fogD: 0.0095,
    key: C(0.35, 0.85, 1.0),
    keyK: 2.2,
    keyDir: V3(-0.2, 0.75, -0.63).normalize(),
    fill: C(0.45, 0.4, 0.9),
    fillK: 0.4,
    sky: C(0.05, 0.16, 0.22),
    ground: C(0.01, 0.02, 0.03),
    hemiK: 0.45,
    win: C(0.3, 1.2, 1.6),
    winK: 1.0,
    shaft: 0.7,
    env: 1.2,
    gain: V3(0.92, 1.02, 1.06),
    lift: V3(0.0, 0.008, 0.014),
    shadow: V3(0.0, 0.03, 0.06),
    high: V3(0.02, 0.04, 0.05),
    split: 1,
    sat: 1.08,
    exposure: 1.12,
    grain: 0.04,
    vignette: 0.38,
    pit: 0.0,
  }),
  // Coming back: gold.
  gold: L({
    fog: C(0.035, 0.022, 0.006),
    fogD: 0.0075,
    key: C(1.0, 0.75, 0.35),
    keyK: 2.6,
    keyDir: V3(0.25, 0.6, -0.76).normalize(),
    fill: C(0.55, 0.45, 0.9),
    fillK: 0.4,
    sky: C(0.3, 0.2, 0.1),
    ground: C(0.03, 0.02, 0.012),
    hemiK: 0.45,
    win: C(2.6, 1.7, 0.6),
    winK: 1.2,
    shaft: 1.3,
    dust: 1.3,
    env: 1.2,
    gain: V3(1.05, 1.0, 0.9),
    lift: V3(0.012, 0.008, 0.004),
    shadow: V3(0.0, 0.02, 0.06),
    high: V3(0.08, 0.05, 0.0),
    split: 1,
    sat: 1.06,
    exposure: 1.18,
    grain: 0.035,
    vignette: 0.32,
    pit: 0.0,
  }),
};

type Name = keyof typeof LOOKS;

/** The stops: [P, look]. Between two stops the look blends (smoothly). */
const STOPS: [number, Name][] = [
  [0, "open"],
  [1.6, "open"],
  [2.35, "website"],
  [4.45, "website"],
  [4.95, "inbox"],
  [6.95, "inbox"],
  [7.4, "admin"],
  [9.45, "admin"],
  [9.85, "followup"],
  [11.7, "followup"],
  [12.3, "you"],
  [13.95, "you"],
  [14.25, "black"],
  [14.85, "black"],
  [15.1, "tear"],
  [15.85, "tear"],
  [16.12, "indigo"],
  [18.45, "indigo"],
  [18.85, "teal"],
  [20.1, "teal"],
  [20.6, "teal"],
  [21.7, "indigo"],
  [22.2, "gold"],
  [27.4, "gold"],
];

function mix(a: Look, b: Look, k: number, out: Look) {
  for (const key of Object.keys(out) as (keyof Look)[]) {
    const x = a[key];
    const y = b[key];
    const o = out[key];
    if (typeof x === "number") (out as Record<string, unknown>)[key] = x + ((y as number) - x) * k;
    else if (o instanceof THREE.Color) o.copy(x as THREE.Color).lerp(y as THREE.Color, k);
    else if (o instanceof THREE.Vector3) o.copy(x as THREE.Vector3).lerp(y as THREE.Vector3, k);
  }
}

/** The look at film time P, into `out`. */
export function lookAt(P: number, out: Look) {
  let i = 0;
  while (i < STOPS.length - 2 && P >= STOPS[i + 1][0]) i++;
  const [Pa, a] = STOPS[i];
  const [Pb, b] = STOPS[i + 1];
  const k = smooth(range(P, Pa, Pb));
  mix(LOOKS[a], LOOKS[b], k, out);
  return out;
}

export const newLook = () => base();
