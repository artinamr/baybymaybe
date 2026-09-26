"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { evaluate, LAND_S, M0, plan } from "@/lib/choreo";
import { evaluateStory } from "@/lib/storyFilm";
import { story } from "@/lib/story";
import { blendPose, COL_C, fragTarget, fx, MONUMENT_C, pose, poseMatrix, prepareFormations, prepared, SORT_C, type FormationCtx } from "@/lib/formations";
import { CORE } from "@/lib/geo/types";
import { getStone } from "@/lib/geo/crystal";
import { fragTex } from "@/lib/fragTex";
import { layout } from "@/lib/layout";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { bus, intro, pointer, scroll, ui } from "@/lib/stores";
import { dev, devNum, FROZEN_TIME_S } from "@/lib/dev";
import { DEG, clamp01, easeInOutCubic, easeInOutSine, easeIntro, easeOutSine, lerp, range } from "@/lib/ease";
import { spring, springTo } from "@/lib/springs";

/**
 * THE DIRECTOR — runs first every frame (PRIORITY.director).
 *
 *  1. evaluate(S): camera keys, places, the formation plan, uniforms.
 *  2. Layers the TIME-based life on top: the load intro, Ken Burns, idle yaw
 *     and pointer tilt, the ridge thread, seam pulses, the flow's clock (a fast
 *     sweep of the cursor hurries it), the core's turn, the lean toward the
 *     pointer, the lock-in flash of every shard as it lands, the seat flashes.
 *  3. Blends every fragment between two formations (staggered, on arcs,
 *     spiralling), gives it weight (its own critically damped spring), lifts
 *     the shards near the cursor out of their form, and writes its world
 *     matrix + glow/flash/fade/core-light to fragTex.
 */

type Thread = { ridge: number; t0: number; dur: number; live: boolean };

const devYaw = devNum("yaw");
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const INTRO_MS = 1500;
const THREAD_MS = 1280; // 520 crown + 760 pavilion
const PULSE_MS = 1100;

export function Director() {
  const { camera, size } = useThree();
  const stone = useMemo(() => getStone(), []);
  useMemo(() => {
    prepareFormations(stone.frags, stone.crackOrigin);
    fragTex.setCentres(stone.frags);
  }, [stone]);

  const A = useMemo(pose, []);
  const Bp = useMemo(pose, []);
  const P = useMemo(pose, []);
  const M = useMemo(() => new THREE.Matrix4(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  const tilt = useMemo(() => new THREE.Quaternion(), []);
  const ctx = useMemo<FormationCtx>(
    () => ({
      stoneQuat: quat,
      home: new THREE.Vector3(),
      K: 1,
      gap: 0,
      lift: 0,
      monumentYaw: 0,
      coreSpin: 0,
      tilt,
      flowT: 0,
      ai: 0,
      explode: 1,
      camPos: new THREE.Vector3(),
      open: 0,
    }),
    [quat, tilt]
  );
  const tiltEuler = useMemo(() => new THREE.Euler(), []);
  const swirlQ = useMemo(() => new THREE.Quaternion(), []);
  const ndc = useMemo(() => new THREE.Vector3(), []);
  const ndc2 = useMemo(() => new THREE.Vector2(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const head = useMemo(() => new THREE.Vector3(), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const rayO = useMemo(() => new THREE.Vector3(), []);
  const rayD = useMemo(() => new THREE.Vector3(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const invM = useMemo(() => new THREE.Matrix4(), []);
  const liftDir = useMemo(() => new THREE.Vector3(), []);

  const st = useRef({
    time: 0,
    yawSpring: spring(0),
    pitchSpring: spring(0),
    hoverLight: 0,
    thread: { ridge: -1, t0: -1, dur: THREAD_MS, live: false } as Thread,
    introThreadFired: false,
    potFired: false,
    lastHoverThread: -10,
    pulseT0: -1,
    pulseKind: 0,
    lastS: 0,
    /** The hero's quiet invitation: a thread of light down a ridge every few seconds. */
    lastIdleThread: 0,
    /** When the stone last touched down on the flat, and last shattered (−1: not yet). */
    landT0: -1,
    breakT0: -1,
    /** The 3D's own scroll clock: follows scroll.S with weight (−1 = not started). */
    S: -1,
    /** 1 while the stone is whole (fragments locked rigid), easing to 0 when it breaks. */
    rigid: 1,
    springsLive: false,
    /** Cursor stir + beat emphasis + tilt for the sculptures. */
    px: 0,
    py: 0,
    stirT: 0,
    stir: 0,

    tiltX: spring(0),
    tiltY: spring(0),
    cursorAmt: spring(0),
  });

  // Every fragment follows its target on its own critically damped spring —
  // pieces carry momentum, overshoot nothing, and settle at slightly different
  // rates, so a formation change reads as matter moving, not a tween.
  const springs = useMemo(
    () =>
      stone.frags.map((f, i) => ({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        quat: new THREE.Quaternion(),
        scale: new THREE.Vector3(1, 1, 1),
        omega: 3.6 + 2.4 * ((i * 0.618034) % 1),
        phase: i * 1.713,
        /** Blend progress last frame (for the lock-in flash) and the flash itself. */
        lastM: 0,
        flash: 0,
        /** How far the cursor has lifted this shard out of its form (spring). */
        lift: spring(0),
        /** The colossus: how open this piece was last frame (it flashes as it seats). */
        lastOpen: 0,
      })),
    [stone]
  );
  const drift = useMemo(() => new THREE.Quaternion(), []);
  const driftAxis = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDt) => {
    const s = st.current;
    const dt = Math.min(rawDt, 1 / 20);
    s.time = dev.freeze ? FROZEN_TIME_S : s.time + dt;
    const time = s.time;
    sceneState.frozen = dev.freeze;
    sceneState.time = time;
    sceneState.dt = dt;
    const L = layout.current;
    const reduced = typeof window !== "undefined" && document.documentElement.hasAttribute("data-reduced");
    const still = reduced || dev.freeze;
    // The film follows the scroll with a little weight of its own (on top of
    // Lenis), so a flick of the wheel becomes a glide, never a jolt.
    if (s.S < 0 || dev.freeze || reduced || Math.abs(scroll.S - s.S) > 3) s.S = scroll.S;
    else s.S += (scroll.S - s.S) * (1 - Math.exp(-dt * 4.5));
    const S = s.S;
    sceneState.S = S;

    // Story mode replaces the scroll's film with the story's (same stone, same camera rig).
    const inStory = story.phase !== "closed";
    if (inStory) evaluateStory(story.P, time, L, sceneState);
    else evaluate(S, time, L, sceneState);
    const cam = sceneState.cam;

    /* ---- intro + hero life (fades out as the hero scrolls away) ------- */
    const heroK = inStory ? 0 : 1 - range(S, 0.2, 0.8);
    let introK = 1;
    if (intro.state === "wait") introK = 0;
    else if (intro.state === "run" && !intro.skipped && !dev.freeze) introK = easeIntro(clamp01(intro.ms / INTRO_MS));
    if (reduced) introK = 1;
    let yaw = plan.yaw;
    if (S < 1.0 && !cam.path && !inStory) {
      // Intro: the product shot becomes a monument — pull back, recentre, turn.
      const dollyIn = lerp(1.28, 1, introK);
      const introMs = intro.state === "wait" ? 0 : intro.ms;
      const kbT = Math.max(0, (introMs - INTRO_MS) / 1000);
      let kb = lerp(1, 0.965, easeOutSine(clamp01(kbT / 24)));
      if (kbT > 24) kb *= 1 + 0.004 * Math.sin((2 * Math.PI * (kbT - 24)) / 14);
      if (still) kb = 1;
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
    const idle = still ? 0 : 18 * DEG * Math.sin((2 * Math.PI * time) / 38);
    const pYaw = pointer.has ? 4 * DEG * pointer.nx : 0;
    const pPitch = pointer.has ? 2 * DEG * pointer.ny : 0;
    springTo(s.yawSpring, (idle + pYaw) * heroK * introK, 4.5, dt);
    const pitchIdle = reduced ? 0 : 0.8 * DEG * Math.sin((2 * Math.PI * time) / 51);
    const finaleK = S > M0 - 1.0 ? range(S, M0 - 1.0, M0 - 0.6) * (1 - range(S, M0, M0 + 0.1)) : 0;
    springTo(s.pitchSpring, (pitchIdle + pPitch) * heroK + (pPitch * 0.3 + pitchIdle) * finaleK, 4.5, dt);
    yaw += s.yawSpring.x;
    if (devYaw !== null) yaw = devYaw * DEG;
    // The mark lock: pointer tilt ≤ ±1.5° so it breathes but never breaks.
    if (S >= M0) yaw += (pointer.has ? 1.5 * DEG * pointer.nx : 0) * (1 - range(S - M0, 0.3, 0.5));
    const bob = reduced ? 0 : 0.004 * Math.sin((2 * Math.PI * time) / 9) * heroK;
    euler.set(s.pitchSpring.x, yaw, 0, "YXZ");
    quat.setFromEuler(euler);
    sceneState.stone.yaw = yaw;
    sceneState.stone.pitch = s.pitchSpring.x;
    sceneState.stone.bob = bob;
    const sm = sceneState.stone.matrix;
    const K = sceneState.stone.scale;
    sm.makeRotationFromQuaternion(quat);
    sm.scale(v.set(K, K, K));
    sm.elements[12] = sceneState.stone.home.x;
    sm.elements[13] = sceneState.stone.home.y + bob;
    sm.elements[14] = sceneState.stone.home.z;

    /* ---- threads ------------------------------------------------------ */
    const u = sceneState.u;
    if (!s.introThreadFired && intro.state !== "wait" && intro.ms >= 1900 && S < 0.9 && !reduced) {
      s.introThreadFired = true;
      s.thread = { ridge: frontLeftRidge(yaw), t0: time, dur: THREAD_MS, live: true };
    }
    if (ui.hoverStone && time - s.lastHoverThread > 3 && !s.thread.live && !reduced) {
      s.lastHoverThread = time;
      s.thread = { ridge: frontLeftRidge(yaw), t0: time, dur: THREAD_MS, live: true };
    }
    // At rest in the hero the stone keeps inviting: a thread of light every few seconds.
    if (S < 0.15 && !inStory && intro.state === "done" && time - s.lastIdleThread > 7.5 && !s.thread.live && !reduced) {
      s.lastIdleThread = time;
      s.thread = { ridge: frontLeftRidge(yaw), t0: time, dur: THREAD_MS * 1.25, live: true };
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
        const crownT = 520 / THREAD_MS;
        const hp = clamp01(p);
        const headT = hp < crownT ? 0.343 * easeInOutSine(hp / crownT) : 0.343 + 0.657 * easeInOutSine((hp - crownT) / (1 - crownT));
        u.threadRidge = s.thread.ridge;
        u.threadHead = headT;
        u.threadAmp = p < 1 ? 1 : 1 - (p - 1) / 0.2;
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
    if (S < 1.6 || S > 2.4) s.pulseT0 = s.pulseT0 > 0 && time - s.pulseT0 < PULSE_MS / 1000 ? s.pulseT0 : -1;
    if (s.pulseT0 >= 0 && !reduced) {
      const p = (time - s.pulseT0) / (PULSE_MS / 1000);
      if (p > 1) {
        s.pulseT0 = -1;
        u.pulseAmp = 0;
      } else {
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

    // TOUCH-DOWN: a jolt through the camera, the seams flaring. (The shatter
    // hits too, more lightly.)
    if (!inStory && s.lastS < LAND_S && S >= LAND_S && !still) s.landT0 = time;
    if (S < LAND_S - 0.05) s.landT0 = -1;
    if (!inStory && s.lastS < 2.3 && S >= 2.3 && !still) s.breakT0 = time;
    const landK = s.landT0 >= 0 ? Math.exp(-(time - s.landT0) / 0.28) : 0;
    const breakK = s.breakT0 >= 0 ? 0.45 * Math.exp(-(time - s.breakT0) / 0.22) : 0;
    sceneState.cam.shake = Math.max(landK, breakK);
    u.seam += 0.8 * landK;
    s.lastS = S;

    /* ---- the forms' own life -------------------------------------------- */
    ctx.gap = plan.gap;
    ctx.lift = plan.lift;
    ctx.home.copy(plan.home);
    ctx.K = plan.K;
    ctx.explode = plan.explode + (still ? 0 : 0.025 * Math.sin(time * 0.9));
    ctx.ai = plan.ai;
    ctx.open = plan.open;
    ctx.camPos.copy(cam.pos);
    ctx.monumentYaw = plan.monumentYaw + (still ? 0 : 0.035 * time);

    // The flow runs on its own clock; a quick sweep of the cursor hurries it
    // (and spins the core); the whole sculpture leans toward the pointer.
    const inSculpt = !inStory && S > 2.85 && S < 6.3;
    if (pointer.has) {
      const speed = Math.hypot(pointer.x - s.px, pointer.y - s.py) / Math.max(dt, 1e-3);
      s.px = pointer.x;
      s.py = pointer.y;
      if (inSculpt) s.stirT = Math.max(s.stirT, Math.min(1.6, speed / 1400));
    }
    s.stir += (s.stirT - s.stir) * (1 - Math.exp(-dt * (s.stirT > s.stir ? 5 : 1.1)));
    s.stirT *= Math.exp(-dt * 5);
    const stirK = 1 + 2.2 * s.stir;
    if (still) {
      ctx.flowT = 4.2;
      ctx.coreSpin = 1.2;
    } else {
      ctx.flowT += dt * stirK;
      ctx.coreSpin += 0.22 * stirK * dt;
    }
    const lean = inSculpt && pointer.has && !reduced ? 1 : 0;
    springTo(s.tiltX, -pointer.ny * 0.16 * lean + (still ? 0 : 0.04 * Math.sin(time * 0.21)), 3, dt);
    springTo(s.tiltY, pointer.nx * 0.26 * lean + (still ? 0 : 0.05 * Math.sin(time * 0.17)), 3, dt);
    if (dev.freeze) {
      s.tiltX.x = 0;
      s.tiltY.x = 0;
    }
    tiltEuler.set(s.tiltX.x, s.tiltY.x, 0);
    tilt.setFromEuler(tiltEuler);
    const aspect = size.width / Math.max(1, size.height);

    // The light inside the glass follows the cursor (level here; where, per piece, below).
    const wantCursor = pointer.has && !still && S < 6 && performance.now() - pointer.lastMove < 6000 ? 1 : 0;
    springTo(s.cursorAmt, wantCursor * (inSculpt ? 1 : 0.6), 3, dt);
    u.cursorAmt = s.cursorAmt.x;
    if (pointer.has) {
      ndc2.set(pointer.nx, pointer.ny);
      ray.setFromCamera(ndc2, camera);
    }

    // Rigid while the stone is whole: it must never wobble apart. Released
    // quickly when it breaks, re-locked gently.
    // The colossus is rigid too: its opening is exact, driven by the camera.
    const whole = plan.a === plan.b && (plan.a === "F0" || plan.a === "F7");
    s.rigid += ((whole ? 1 : 0) - s.rigid) * (1 - Math.exp(-dt * (whole ? 2.2 : 9)));
    if (plan.cut) s.rigid = whole ? 1 : 0;
    const snap = !s.springsLive || still || plan.cut;
    const loose = 1 - s.rigid;

    // The cursor lifts shards out of the exploded view, the monument and the flow.
    const holdForm = plan.a === plan.b && (plan.a === "F2" || plan.a === "F3" || plan.a === "F4");
    // The sort: how much the core is judging right now (it flares as it decides).
    let scanSum = 0;
    // The colossus: a wave of light running out from the core through the burst.
    const wavePeriod = 2.6;
    const waveR = ctx.K * (0.4 + 3.4 * (((time % wavePeriod) + wavePeriod) % wavePeriod) / wavePeriod);

    const frags = stone.frags;
    for (let i = 0; i < frags.length; i++) {
      const f = frags[i];
      const pr = prepared(i);
      const isCore = i === CORE;
      const sp = springs[i];
      fragTarget(plan.a, f, ctx, A);
      let fxFade = fx.fade;
      let fxGlow = fx.glow;
      let fxFlash = fx.flash;
      let fxLit = fx.lit;
      const fxOpen = fx.open;
      if (plan.a === "F3" && plan.b === "F3") scanSum += fx.scan;
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
            // Course by course: each lands in its own window, with a little scatter.
            m = isCore ? plan.course[0] : clamp01((plan.course[pr.course] - 0.12 * pr.rand) / 0.88);
            break;
          case 3:
            d = 0.4 * pr.rand;
            span = 0.6;
            break;
          case 6:
            // Re-forming: the far pieces arrive first, the crack closes last.
            d = 0.3 * (1 - pr.crackK);
            span = 0.7;
            break;
          case 7:
            // Assembly: from the heart out, each piece on its own beat.
            d = 0.46 * pr.radK + 0.06 * pr.rand;
            span = 0.48;
            break;
        }
        if (plan.stagger !== 2) m = clamp01((m - d) / span);
        fragTarget(plan.b, f, ctx, Bp);
        const e = easeInOutCubic(m);
        fxFade = lerp(fxFade, fx.fade, e);
        fxGlow = lerp(fxGlow, fx.glow, e);
        fxFlash = lerp(fxFlash, fx.flash, e);
        fxLit = lerp(fxLit, fx.lit, e);
        blendPose(A, Bp, e, f.out, plan.arc, P);
        // The spiral: swept round the vertical axis mid-flight, straight at both ends.
        if (plan.swirl !== 0) {
          const ang = plan.swirl * Math.sin(Math.PI * e);
          const cx = plan.swirlC.x;
          const cz = plan.swirlC.z;
          const dx = P.pos.x - cx;
          const dz = P.pos.z - cz;
          const c = Math.cos(ang);
          const sn = Math.sin(ang);
          P.pos.x = cx + dx * c + dz * sn;
          P.pos.z = cz - dx * sn + dz * c;
          swirlQ.setFromAxisAngle(Y_AXIS, ang);
          P.quat.premultiply(swirlQ);
        }
        // Lock-in: a shard flashes as it lands in its new form.
        if (!isCore && (plan.stagger === 2 || plan.stagger === 7) && sp.lastM < 0.985 && m >= 0.985 && !still) sp.flash = 1;
        sp.lastM = m;
      } else {
        P.pos.copy(A.pos);
        P.quat.copy(A.quat);
        P.scale.copy(A.scale);
        sp.lastM = 1;
      }
      // The colossus closing: each piece flashes as it seats back into place.
      if (plan.a === "F7" && !isCore) {
        if (sp.lastOpen > 0.02 && fxOpen <= 0.0005 && !still) sp.flash = 1;
        sp.lastOpen = fxOpen;
      } else sp.lastOpen = 0;
      sp.flash *= Math.exp(-dt / 0.5);

      // Suspended pieces breathe: a slow float and a drift of rotation.
      if (loose > 0.001 && !reduced) {
        const ph = sp.phase;
        P.pos.x += 0.03 * loose * Math.sin(time * 0.61 + ph);
        P.pos.y += 0.045 * loose * Math.sin(time * 0.47 + ph * 1.3);
        P.pos.z += 0.03 * loose * Math.cos(time * 0.53 + ph * 0.7);
        driftAxis.set(Math.sin(ph), Math.cos(ph * 1.7), Math.sin(ph * 0.9)).normalize();
        drift.setFromAxisAngle(driftAxis, 0.06 * loose * Math.sin(time * 0.33 + ph));
        P.quat.multiply(drift);
      }

      // The cursor lifts shards out of their form: those near it rise outward
      // from the form's heart and glow — pull a stone from the wall.
      let near = 0;
      if (pointer.has && holdForm && !isCore && !reduced) {
        ndc.copy(P.pos).project(camera);
        const dx = (ndc.x - pointer.nx) * aspect;
        const dy = ndc.y - pointer.ny;
        near = Math.max(0, 1 - Math.hypot(dx, dy) / 0.22);
        near = near * near * (3 - 2 * near);
      }
      springTo(sp.lift, near, near > sp.lift.x ? 7 : 3, dt);
      if (sp.lift.x > 0.001) {
        liftDir.copy(P.pos).sub(plan.a === "F3" ? SORT_C : plan.a === "F4" ? v.set(0, -0.464, 0) : MONUMENT_C);
        if (liftDir.lengthSq() < 1e-6) liftDir.set(0, 1, 0);
        liftDir.normalize();
        P.pos.addScaledVector(liftDir, 0.42 * sp.lift.x);
      }

      // Spring toward the target; blend back to the exact target while rigid.
      if (snap) {
        sp.pos.copy(P.pos);
        sp.vel.set(0, 0, 0);
        sp.quat.copy(P.quat);
        sp.scale.copy(P.scale);
      } else {
        const w = sp.omega;
        const ax = w * w * (P.pos.x - sp.pos.x) - 2 * w * sp.vel.x;
        const ay = w * w * (P.pos.y - sp.pos.y) - 2 * w * sp.vel.y;
        const az = w * w * (P.pos.z - sp.pos.z) - 2 * w * sp.vel.z;
        sp.vel.x += ax * dt;
        sp.vel.y += ay * dt;
        sp.vel.z += az * dt;
        sp.pos.addScaledVector(sp.vel, dt);
        sp.quat.slerp(P.quat, 1 - Math.exp(-dt * w * 0.85));
        sp.scale.lerp(P.scale, 1 - Math.exp(-dt * w));
      }
      if (s.rigid > 0.001) {
        P.pos.lerpVectors(sp.pos, P.pos, s.rigid);
        P.quat.slerpQuaternions(sp.quat, P.quat, s.rigid);
        P.scale.lerpVectors(sp.scale, P.scale, s.rigid);
      } else {
        P.pos.copy(sp.pos);
        P.quat.copy(sp.quat);
        P.scale.copy(sp.scale);
      }
      poseMatrix(P, M);

      // Where the cursor's light sits inside this piece (stone object space).
      if (pointer.has && u.cursorAmt > 0.001) {
        invM.copy(M).invert();
        rayO.copy(ray.ray.origin).applyMatrix4(invM);
        rayD.copy(ray.ray.direction).transformDirection(invM);
        const tt = Math.max(0, -rayO.dot(rayD));
        hit.copy(rayO).addScaledVector(rayD, tt);
        const dist = hit.length();
        const lim = f.radius * 0.8;
        if (dist > lim) hit.multiplyScalar(lim / dist);
        hit.add(f.centroid);
        const cp = u.cursorPiece[i];
        const k = 1 - Math.exp(-dt * 7);
        cp.x += (hit.x - cp.x) * k;
        cp.y += (hit.y - cp.y) * k;
        cp.z += (hit.z - cp.z) * k;
        const nearR = Math.exp(-((dist / (f.radius * 1.3)) ** 2));
        cp.w += (nearR - cp.w) * k;
      }

      // Glow / flash / fade / core light.
      let glow = 1;
      let flash = Math.max(sp.flash, 0.7 * sp.lift.x);
      let fade = 0;
      let boost = 0;
      if (plan.glowMode === 1) {
        // The monument: laid courses glow softly, the course being laid bright; all lit when complete.
        const fo = sceneState.tiers.focus;
        glow = lerp(pr.course === fo ? 1 : 0.45, 1, plan.complete);
      } else if (plan.glowMode === 2) {
        // The flow: dark leads, a flash at the core, the qualified stay lit —
        // full of light through every face, like the core that chose them.
        glow = fxGlow;
        flash = Math.max(flash, fxFlash);
        fade = fxFade;
        boost = 3.2 * fxLit;
      } else if (plan.glowMode === 3) {
        // The exploded view: every cut face a window onto the light inside;
        // seating heals the cut.
        glow = plan.b === "F0" && plan.a !== "F0" ? 1 - 0.75 * easeInOutCubic(m) : 1;
        if (plan.a === "F3") boost = 2.4 * fxLit * (1 - easeInOutCubic(m));
      } else if (plan.glowMode === 6) {
        // The colossus: the walls light a little as they stand aside, and a
        // wave of light runs out from the core through every piece — INSIDE
        // the glass (the core's own light), never a flat wash on the cuts.
        glow = 0.25 + 0.25 * fxOpen;
        if (fxOpen > 0.001 && !isCore) {
          const dW = (P.pos.distanceTo(COL_C) - waveR) / (0.5 * ctx.K);
          boost = 1.5 * fxOpen * Math.exp(-dW * dW);
        }
      }
      if (isCore) {
        // The core: hidden inside the whole stone; laid bare by the burst; the
        // heart of the exploded view, the monument and the flow; swelling with
        // light as the leads are drawn in; burning inside the open colossus.
        const hidden =
          (plan.a === "F0" && plan.b === "F0") ||
          (plan.b === "F0" && m > 0.95) ||
          (plan.a === "F0" && plan.b !== "F0" && m < 0.04) ||
          (plan.a === "F7" && plan.open < 0.01);
        let lvl = 2.6;
        if (plan.glowMode === 1) lvl = 3.6;
        else if (plan.glowMode === 2) lvl = 2.6 + 0.4 * Math.sin(time * 1.6) + 1.8 * Math.min(1, scanSum);
        else if (plan.glowMode === 3) lvl = 2.8;
        else if (plan.glowMode === 6) {
          // It beats with the waves it sends out.
          const beat = Math.exp(-Math.pow(((time % wavePeriod) + wavePeriod) % wavePeriod, 2) / 0.02);
          lvl = 1.1 + 1.5 * plan.open + 1.6 * plan.open * beat;
        }
        boost = hidden ? 0 : lvl;
        glow = 1;
        flash = 0;
      }
      fragTex.writeFrag(i, M, glow, flash, fade, boost);
    }
    fragTex.writeDone();
    s.springsLive = true;
  }, PRIORITY.director);

  return null;
}

/** The meridian whose girdle corner is left of centre and nearest the camera. */
function frontLeftRidge(yaw: number): number {
  let best = 0;
  let bestScore = -Infinity;
  for (let r = 0; r < 4; r++) {
    const a = (r * Math.PI) / 2;
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
