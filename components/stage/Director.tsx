"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { evaluate, plan } from "@/lib/choreo";
import { blendPose, fragTarget, pose, poseMatrix, prepareFormations, prepared, TIER_X, TIER_Y, type FormationCtx } from "@/lib/formations";
import { getStone } from "@/lib/geo/crystal";
import { fragTex } from "@/lib/fragTex";
import { layout } from "@/lib/layout";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { bus, intro, pointer, scroll, ui } from "@/lib/stores";
import { dev, devNum, FROZEN_TIME_S } from "@/lib/dev";
import { DEG, clamp01, easeInOutCubic, easeInOutSine, easeIntro, easeOutSine, lerp, range } from "@/lib/ease";
import { decayFlash, graphFlash } from "@/lib/graph";
import { spring, springTo } from "@/lib/springs";

/**
 * THE DIRECTOR — runs first every frame (PRIORITY.director).
 *
 *  1. evaluate(S): camera keys, stone placement, formation plan, uniforms.
 *  2. Layers the TIME-based life on top: the load intro, Ken Burns, idle yaw
 *     and pointer tilt, the ridge thread, seam pulses, seating flashes.
 *  3. Blends every fragment between two formations (staggered, on arcs) and
 *     writes its world matrix + glow/flash/fade into fragTex.
 */

type Thread = { ridge: number; t0: number; dur: number; live: boolean };

const devYaw = devNum("yaw");
const INTRO_MS = 1500;
const THREAD_MS = 1280; // 520 crown + 760 pavilion
const PULSE_MS = 1100;

export function Director() {
  const { camera, size } = useThree();
  const stone = useMemo(() => getStone(), []);
  useMemo(() => prepareFormations(stone.frags, stone.crackOrigin), [stone]);

  const A = useMemo(pose, []);
  const Bp = useMemo(pose, []);
  const P = useMemo(pose, []);
  const M = useMemo(() => new THREE.Matrix4(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  const ctx = useMemo<FormationCtx>(
    () => ({ stoneQuat: quat, gap: 0, lift: 0, focusTier: -1, focusSlide: 0, time: 0, crownLift: 0, bandLift: 0, split: 0 }),
    [quat]
  );
  const v = useMemo(() => new THREE.Vector3(), []);
  const head = useMemo(() => new THREE.Vector3(), []);

  const st = useRef({
    time: 0,
    yawSpring: spring(0),
    pitchSpring: spring(0),
    slide: spring(0),
    hoverLight: 0,
    thread: { ridge: -1, t0: -1, dur: THREAD_MS, live: false } as Thread,
    introThreadFired: false,
    potFired: false,
    lastHoverThread: -10,
    pulseT0: -1,
    pulseKind: 0,
    lastS: 0,
    seatFlash: [0, 0, 0, 0],
    seatDone: [false, false, false, false],
    markRunFired: false,
    bandLineFired: false,
  });

  useFrame((_, rawDt) => {
    const s = st.current;
    const dt = Math.min(rawDt, 1 / 20);
    const motionReduced = typeof window !== "undefined" && document.documentElement.hasAttribute("data-reduced");
    s.time = dev.freeze ? FROZEN_TIME_S : motionReduced ? 0 : s.time + dt;
    const time = s.time;
    sceneState.frozen = dev.freeze;
    sceneState.time = time;
    sceneState.dt = dt;
    const S = scroll.S;
    sceneState.S = S;
    const L = layout.current;
    const reduced = typeof window !== "undefined" && document.documentElement.hasAttribute("data-reduced");

    evaluate(S, time, L, sceneState);
    const cam = sceneState.cam;

    /* ---- intro + hero life (fades out as the hero scrolls away) ------- */
    const heroK = 1 - range(S, 0.2, 0.8);
    let introK = 1;
    if (intro.state === "wait") introK = 0;
    else if (intro.state === "run" && !intro.skipped && !dev.freeze) introK = easeIntro(clamp01(intro.ms / INTRO_MS));
    if (reduced) introK = 1;
    let yaw = plan.yaw;
    if (S < 1.0 && !cam.path) {
      // Intro: the product shot becomes a monument — pull back, recentre, turn.
      const dollyIn = lerp(1.28, 1, introK);
      const introMs = intro.state === "wait" ? 0 : intro.ms;
      // Ken Burns after the intro, then a slow breath.
      const kbT = Math.max(0, (introMs - INTRO_MS) / 1000);
      let kb = lerp(1, 0.965, easeOutSine(clamp01(kbT / 24)));
      if (kbT > 24) kb *= 1 + 0.004 * Math.sin((2 * Math.PI * (kbT - 24)) / 14);
      if (reduced || dev.freeze) kb = 1;
      const k = lerp(1, dollyIn * kb, 1 - range(S, 0, 1));
      cam.dist *= k;
      cam.ppx = lerp(0.68, cam.ppx, introK) + 0.004 * pointer.nx * heroK * (pointer.has ? 1 : 0);
      cam.ppy = lerp(0.51, cam.ppy, introK);
      cam.pos.set(
        cam.pivot.x + cam.dist * Math.sin(cam.az) * Math.cos(cam.el),
        cam.pivot.y + cam.dist * Math.sin(cam.el),
        cam.pivot.z + cam.dist * Math.cos(cam.az) * Math.cos(cam.el)
      );
      yaw = lerp(38 * DEG, yaw, introK);
    }
    // Idle yaw + pointer tilt in the hero; a slow breath in the finale.
    const idle = reduced || dev.freeze ? 0 : 18 * DEG * Math.sin((2 * Math.PI * time) / 38);
    const pYaw = pointer.has && !reduced ? 2 * DEG * pointer.nx : 0;
    const pPitch = pointer.has && !reduced ? 1 * DEG * pointer.ny : 0;
    springTo(s.yawSpring, (idle + pYaw) * heroK * introK, 4.5, dt);
    const pitchIdle = reduced ? 0 : 0.8 * DEG * Math.sin((2 * Math.PI * time) / 51);
    const finaleK = S > 11.6 ? range(S, 11.6, 12.0) * (1 - range(S, 12.6, 12.7)) : 0;
    springTo(s.pitchSpring, (pitchIdle + pPitch) * heroK + (pPitch * 0.3 + pitchIdle) * finaleK, 4.5, dt);
    yaw += s.yawSpring.x;
    // Look-dev: `?yaw=<deg>` pins the stone's rotation (screenshots per angle).
    if (devYaw !== null) yaw = devYaw * DEG;
    // The mark lock: pointer tilt ≤ ±1.5° so it breathes but never breaks.
    if (S >= 12.6 && !reduced) yaw += (pointer.has ? 1.5 * DEG * pointer.nx : 0) * (1 - range(S - 12.6, 0.3, 0.5));
    const bob = reduced ? 0 : 0.004 * Math.sin((2 * Math.PI * time) / 9) * heroK;
    euler.set(s.pitchSpring.x, yaw, 0, "YXZ");
    quat.setFromEuler(euler);
    sceneState.stone.yaw = yaw;
    sceneState.stone.pitch = s.pitchSpring.x;
    sceneState.stone.bob = bob;
    const sm = sceneState.stone.matrix;
    sm.makeRotationFromQuaternion(quat);
    sm.elements[12] = sceneState.stone.home.x;
    sm.elements[13] = sceneState.stone.home.y + bob;
    sm.elements[14] = sceneState.stone.home.z;

    /* ---- threads ------------------------------------------------------ */
    const u = sceneState.u;
    if (!s.introThreadFired && intro.state !== "wait" && intro.ms >= 1900 && S < 0.9 && !reduced) {
      s.introThreadFired = true;
      // The front-left meridian: the corner nearest the camera on the left.
      s.thread = { ridge: frontLeftRidge(yaw), t0: time, dur: THREAD_MS, live: true };
    }
    if (ui.hoverStone && time - s.lastHoverThread > 3 && !s.thread.live && !reduced) {
      s.lastHoverThread = time;
      s.thread = { ridge: frontLeftRidge(yaw), t0: time, dur: THREAD_MS, live: true };
    }
    s.hoverLight = lerp(s.hoverLight, ui.hoverStone ? 1 : 0, 1 - Math.exp(-dt / 0.13));
    u.cursorLight *= 1 + 0.5 * s.hoverLight;
    if (s.thread.live) {
      const p = (time - s.thread.t0) / (s.thread.dur / 1000);
      if (p >= 1.2) {
        s.thread.live = false;
        u.threadRidge = -1;
        u.threadAmp = 0;
      } else {
        // 520 ms down the crown (to aRidgeT ≈ 0.34), 760 ms down the pavilion.
        const crownT = 520 / THREAD_MS;
        const hp = clamp01(p);
        const headT = hp < crownT ? 0.343 * easeInOutSine(hp / crownT) : 0.343 + 0.657 * easeInOutSine((hp - crownT) / (1 - crownT));
        u.threadRidge = s.thread.ridge;
        u.threadHead = headT;
        u.threadAmp = p < 1 ? 1 : 1 - (p - 1) / 0.2;
        // Tell the DOM when the head crosses POTENTIAL's cap line (once, intro only).
        if (!s.potFired && S < 0.9) {
          const r = stone.ridges[s.thread.ridge];
          ridgePoint(r, headT, head);
          head.applyMatrix4(sm).project(camera);
          const yPx = (1 - (head.y * 0.5 + 0.5)) * size.height;
          if (yPx >= L.hero.potCapTop) {
            s.potFired = true;
            bus.emit("thread:potential", { x: (head.x * 0.5 + 0.5) * size.width });
          }
        }
      }
    } else {
      u.threadRidge = -1;
      u.threadAmp = 0;
    }

    /* ---- seam pulses (on crossing, re-armed on reversal) --------------- */
    if (s.lastS < 1.7 && S >= 1.7) {
      s.pulseT0 = time;
      s.pulseKind = 0;
    }
    if (s.lastS < 12.6 + 0.52 && S >= 12.6 + 0.52) {
      s.pulseT0 = time;
      s.pulseKind = 1;
      bus.emit("mark:lock");
    }
    if (S < 1.6 || (S > 3 && S < 12.5)) s.pulseT0 = s.pulseT0 > 0 && time - s.pulseT0 < PULSE_MS / 1000 ? s.pulseT0 : -1;
    if (s.pulseT0 >= 0 && !reduced) {
      const p = (time - s.pulseT0) / (PULSE_MS / 1000);
      if (p > 1) {
        s.pulseT0 = -1;
        u.pulseAmp = 0;
      } else {
        // Around the girdle once, then down the vertical seam to the culet
        // (the finale runs the other way: culet up, then around).
        const q = s.pulseKind === 0 ? p : 1 - p;
        if (q < 0.55) {
          const a = (q / 0.55) * Math.PI * 2 + Math.PI / 2;
          v.set(Math.cos(a) * 0.707, 0.006, Math.sin(a) * 0.707);
        } else {
          const k = (q - 0.55) / 0.45;
          v.set(0, lerp(0, -1.94, k), lerp(0.707, 0, k));
        }
        v.applyMatrix4(sm);
        u.pulsePos.copy(v);
        u.pulseAmp = Math.sin(Math.PI * clamp01(p));
      }
    } else u.pulseAmp = 0;

    /* ---- seating flashes (ch05) ---------------------------------------- */
    for (let g = 0; g < 4; g++) {
      const done = plan.seat[g] >= 1;
      if (done && !s.seatDone[g]) {
        s.seatFlash[g] = 1;
        bus.emit("seat", { group: g });
      }
      s.seatDone[g] = done;
      s.seatFlash[g] *= Math.exp(-dt / 0.35);
    }
    decayFlash(dt);
    s.lastS = S;

    /* ---- fragments ------------------------------------------------------ */
    springTo(s.slide, sceneState.tiers.focus >= 0 ? 1 : 0, 9, dt);
    ctx.gap = plan.gap;
    ctx.lift = plan.lift;
    ctx.focusTier = sceneState.tiers.focus;
    ctx.focusSlide = s.slide.x;
    ctx.time = reduced ? 0 : time;
    ctx.crownLift = plan.crownLift;
    ctx.bandLift = plan.bandLift;
    ctx.split = plan.split;

    const frags = stone.frags;
    for (let i = 0; i < frags.length; i++) {
      const f = frags[i];
      const pr = prepared(i);
      fragTarget(plan.a, f, ctx, A);
      let m = plan.mix;
      if (plan.a !== plan.b) {
        // Per-fragment stagger inside the window.
        let d = 0;
        let span = 1;
        switch (plan.stagger) {
          case 1:
            d = 0.3 * pr.crackK;
            span = 0.7;
            break;
          case 2:
            d = 0.2 * f.tier;
            span = 0.4;
            break;
          case 3:
            d = 0.15 * (3 - f.tier);
            span = 0.55;
            break;
          case 4:
            d = 0.4 * pr.rand;
            span = 0.6;
            break;
          case 5:
            m = plan.seat[f.group];
            break;
        }
        if (plan.stagger !== 5) m = clamp01((m - d) / span);
        fragTarget(plan.b, f, ctx, Bp);
        blendPose(A, Bp, plan.stagger === 5 ? easeInOutCubic(m) : easeInOutCubic(m), f.out, plan.arc, P);
      } else {
        P.pos.copy(A.pos);
        P.quat.copy(A.quat);
        P.scale.copy(A.scale);
      }
      // The monolith hands off to the solid sculptures and returns for the finale.
      const presence = S < 3 ? 1 - easeInOutSine(range(S, 2.05, 2.85)) : easeInOutSine(range(S, 10.45, 10.95));
      if (presence < 1) {
        P.pos.sub(sceneState.stone.home).multiplyScalar(presence).add(sceneState.stone.home);
        P.scale.multiplyScalar(Math.max(0.0001, presence));
      }
      poseMatrix(P, M);

      // Glow / flash / fade.
      let glow = 1;
      let flash = graphFlash[i];
      let fade = 0;
      if (plan.glowMode === 1) {
        const fo = sceneState.tiers.focus;
        const all = range(S, 4.35, 4.45);
        glow = fo < 0 ? lerp(0.25, 0.5, all) : f.tier === fo ? 1 : 0.25;
      } else if (plan.glowMode === 2) {
        // Unseated pieces carry the light; seating heals the cut.
        const sp = plan.seat[f.group];
        glow = 1 - sp;
        flash = Math.max(flash, s.seatFlash[f.group]);
      } else if (plan.glowMode === 3) {
        glow = f.piece === "crown" ? 0 : 1;
        if (f.piece === "crown") fade = easeInOutSine(range(S - 12.6, 0.22, 0.36));
      }
      fragTex.writeFrag(i, M, glow, flash, fade);
    }
    fragTex.writeDone();

    /* ---- ch02 tier anchors (the leader lines' targets) ------------------ */
    for (let t = 0; t < 4; t++) {
      sceneState.tiers.anchors[t].set(TIER_X[0] - 0.55, TIER_Y(t), 0).add(sceneState.stone.home);
      if (t === sceneState.tiers.focus) sceneState.tiers.anchors[t].x += 0.15 * s.slide.x;
    }
  }, PRIORITY.director);

  return null;
}

/** The meridian whose girdle corner is left of centre and nearest the camera. */
function frontLeftRidge(yaw: number): number {
  let best = 0;
  let bestScore = -Infinity;
  for (let r = 0; r < 4; r++) {
    const a = (r * Math.PI) / 2;
    // Corner direction after the stone's yaw (rotation about +Y).
    const x = Math.cos(a) * Math.cos(yaw) + Math.sin(a) * Math.sin(yaw);
    const z = -Math.cos(a) * Math.sin(yaw) + Math.sin(a) * Math.cos(yaw);
    const score = z - 0.6 * Math.max(0, x);
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best;
}

/** Point on a meridian polyline at aRidgeT = t (by height). */
function ridgePoint(line: THREE.Vector3[], t: number, out: THREE.Vector3) {
  const y = 1.012 - t * 2.952;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    if ((y <= a.y && y >= b.y) || i === line.length - 2) {
      const k = a.y === b.y ? 0 : (a.y - y) / (a.y - b.y);
      return out.lerpVectors(a, b, THREE.MathUtils.clamp(k, 0, 1));
    }
  }
  return out.copy(line[0]);
}
