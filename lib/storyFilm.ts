import type { Layout } from "./layout";
import type { Formation, SceneState } from "./sceneState";
import { DEG, easeInOutSine, lerp, range } from "./ease";
import { STONE } from "./geo/types";
import { buildSpline, plan, sampleSpline, smoother, writeCamera, type Key, type Spline } from "./choreo";
import { STORY_END, STORY_START } from "./story";

/**
 * THE STORY'S FILM — why Nerodyn exists, told by the stone, as a function of
 * the story clock P (lib/story.ts). It starts on the hero's exact frame, so
 * entering is one continuous move into the stone.
 *
 *   0 POTENTIAL        close on the stone; the light inside barely stirs
 *   1 THE FIRST MEETING far away: the stone small and alone on the mirror
 *   2 SECONDS          it cracks and bursts in slow motion — and time stops,
 *                      the shards hanging round the camera
 *   3 THE CUT          the shards find each other again: the stone, perfect
 *   4 THE LIGHT INSIDE close: the light inside wakes and fills the glass
 *   5 YOURS            the stone turns to you and settles on its reflection
 *   end                pulled back, the stone whole — the offer
 */

function keys(L: Layout): Key[] {
  const mob = L.mode === "mobile";
  const heroD = L.hero.dist;
  const pp = (x: number, y: number): [number, number] => (mob ? [0.5, 0.34] : [x, y]);
  const D = (d: number) => (mob ? d / 0.62 : d);
  const cY = STONE.centerY;
  return [
    { S: STORY_START, pivot: [0, cY, 0], az: 0, el: 4, dist: heroD, fov: 30, pp: L.hero.pp },
    { S: 0.05, pivot: [0, -0.25, 0], az: 26, el: 3, dist: heroD * 0.4, fov: 40, pp: pp(0.6, 0.5) },
    { S: 0.55, pivot: [0, -0.3, 0], az: 42, el: 6, dist: D(5.3), fov: 32, pp: pp(0.64, 0.46) },
    { S: 1.05, pivot: [0, -0.6, 0], az: 58, el: 10, dist: D(14), fov: 30, pp: pp(0.66, 0.48) },
    { S: 1.55, pivot: [0, -1.0, 0], az: 72, el: 13, dist: D(27), fov: 30, pp: pp(0.66, 0.5) },
    { S: 2.05, pivot: [0, -0.4, 0], az: 88, el: 6, dist: D(9), fov: 32, pp: pp(0.6, 0.5) },
    { S: 2.55, pivot: [0, -0.3, 0], az: 104, el: 4, dist: D(4.6), fov: 44, pp: pp(0.64, 0.46) },
    { S: 3.05, pivot: [0, -0.35, 0], az: 128, el: 6, dist: D(6.5), fov: 34, pp: pp(0.62, 0.5) },
    { S: 3.55, pivot: [0, -0.4, 0], az: 150, el: 8, dist: D(7.4), fov: 30, pp: pp(0.64, 0.5) },
    { S: 4.1, pivot: [0, -0.3, 0], az: 172, el: 4, dist: D(5.2), fov: 34, pp: pp(0.62, 0.5) },
    { S: 4.55, pivot: [0, -0.25, 0], az: 186, el: 2, dist: D(4.9), fov: 36, pp: pp(0.69, 0.5) },
    { S: 5.1, pivot: [0, cY, 0], az: 208, el: 8, dist: D(7.6), fov: 30, pp: pp(0.64, 0.5) },
    { S: 5.55, pivot: [0, cY, 0], az: 222, el: 10, dist: D(9), fov: 30, pp: pp(0.66, 0.5) },
    { S: STORY_END, pivot: [0, cY, 0], az: 240, el: 7, dist: D(11.5), fov: 30, pp: pp(0.66, 0.46) },
  ];
}

let cachedFor = "";
let spline: Spline | null = null;

function splineFor(L: Layout): Spline {
  const id = `${L.vw}x${L.vh}:${L.mode}:${L.hero.dist.toFixed(3)}`;
  if (id !== cachedFor || !spline) {
    cachedFor = id;
    spline = buildSpline(keys(L));
  }
  return spline;
}

/** Fill sceneState from the story clock P (the Director's story branch). */
export function evaluateStory(P: number, _time: number, L: Layout, out: SceneState): void {
  writeCamera(sampleSpline(splineFor(L), P), out);
  const u = out.u;
  const env = out.env;

  out.stone.home.set(0, 0, 0);
  out.stone.scale = 1;
  out.stone.visible = true;
  out.cam.cut = false;
  plan.home.set(0, 0, 0);
  plan.K = 1;
  plan.cut = false;
  plan.open = 0;
  plan.explode = 1;
  // The stone turns slowly the whole way through; faster through the cut.
  plan.yaw = (20 + 38 * (P - STORY_START) + 90 * smoother(range(P, 3.0, 3.6))) * DEG;
  plan.buildYaw = plan.yaw;
  plan.lift = 0;
  plan.gap = 0;
  plan.crownLift = 0;
  plan.bandLift = 0;
  plan.split = 0;
  plan.arc = 0.35;
  plan.swirl = 0;
  plan.stagger = 0;
  plan.mix = 0;
  plan.glowMode = 0;
  plan.complete = 0;
  plan.discipline = -1;
  plan.step = -1;
  const set = (a: Formation, b: Formation, mix: number, stagger: number) => {
    plan.a = a;
    plan.b = b;
    plan.mix = mix;
    plan.stagger = stagger;
  };
  if (P < 2.05) {
    set("F0", "F0", 0, 0);
    plan.gap = 0.004 * easeInOutSine(range(P, 1.9, 2.05));
  } else if (P < 3.0) {
    // SECONDS: the burst in slow motion, and time stops with the shards in the air.
    plan.gap = 0.004;
    set("F0", "F1", smoother(range(P, 2.05, 2.7)), 1);
    plan.arc = 0.5;
  } else if (P < 3.55) {
    // THE CUT: they find each other again.
    set("F1", "F0", range(P, 3.0, 3.55), 6);
    plan.swirl = 0.8;
    plan.swirlC.set(0, 0, 0);
  } else set("F0", "F0", 0, 0);
  out.formation.a = plan.a;
  out.formation.b = plan.b;
  out.formation.mix = plan.mix;

  env.mirror = 1;
  env.sky = 0;
  env.inCloud = 0;
  env.flat = 0;
  env.ripple = 0;
  env.lake = 0;
  env.plain = 0;
  env.void = 0;
  env.flood = 0;
  env.floodLight = 0;

  // The seams light before the break; the light inside wakes in chapter 4.
  u.seam = range(P, 1.85, 2.05) * (1 - range(P, 2.7, 3.2)) + 0.5 * range(P, 3.45, 3.55) * (1 - range(P, 3.6, 3.9));
  u.levelSeam = 0;
  u.cutGlow = lerp(0.3, 1, range(P, 2.0, 2.4)) * (P < 3.6 ? 1 : 0.4);
  const wake = smoother(range(P, 3.9, 4.5)) * (1 - smoother(range(P, 5.1, 5.6)));
  u.inner = 0.28 + 1.5 * wake;
  u.vein = 0.8 + 1.4 * wake;
  u.floors = 0;
  u.wake = wake;
  u.riseAmp = 0;
  u.spill = 0.5 * wake + 0.4 * range(P, 2.05, 2.3) * (1 - range(P, 2.6, 3.0));
  u.dusk = 0;
  u.fogNear = 60;
  u.fogFar = 110;
  u.reflect = 1;
  u.floorY = STONE.floorY;
  u.mistAlpha = 0;
  u.mistClipY = 1;
  u.cursorLight = 8;

  out.tiers.visible = false;
  out.tiers.focus = -1;
  out.clip.active = false;
  out.mark.lock = 0;
}
