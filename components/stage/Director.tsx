"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { evaluate, M0, plan } from "@/lib/choreo";
import { blendPose, fragTarget, MONUMENT_C, ORBIT_SPEED, pose, poseMatrix, prepareFormations, prepared, type FormationCtx } from "@/lib/formations";
import { CORE } from "@/lib/geo/types";
import { getStone } from "@/lib/geo/crystal";
import { fragTex } from "@/lib/fragTex";
import { layout } from "@/lib/layout";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { bus, intro, measured, pointer, scroll, ui } from "@/lib/stores";
import { dev, devNum, FROZEN_TIME_S } from "@/lib/dev";
import { DEG, clamp01, easeInOutCubic, easeInOutSine, easeIntro, easeOutSine, lerp, range } from "@/lib/ease";
import { spring, springTo } from "@/lib/springs";

/**
 * THE DIRECTOR — runs first every frame (PRIORITY.director).
 *
 *  1. evaluate(S): camera keys, places, the formation plan, uniforms.
 *  2. Layers the TIME-based life on top: the load intro, Ken Burns, idle yaw
 *     and pointer tilt, the ridge thread, seam pulses, the halo's orbits (with
 *     the beat and the cursor's stir), the lean toward the pointer, the lock-in
 *     flash of every shard as it lands, the seat flashes.
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
  useMemo(() => prepareFormations(stone.frags, stone.crackOrigin), [stone]);

  const A = useMemo(pose, []);
  const Bp = useMemo(pose, []);
  const P = useMemo(pose, []);
  const M = useMemo(() => new THREE.Matrix4(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  const orbitPhase = useMemo(() => [0, 0, 0], []);
  const tilt = useMemo(() => new THREE.Quaternion(), []);
  const ctx = useMemo<FormationCtx>(
    () => ({
      stoneQuat: quat,
      gap: 0,
      lift: 0,
      monumentYaw: 0,
      orbitPhase,
      tilt,
      conveyor: 0,
      specSpin: 0,
      seat: [0, 0, 0, 0],
      buildQuat: quat,
      crownLift: 0,
      bandLift: 0,
      split: 0,
    }),
    [quat, orbitPhase, tilt]
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
    seatFlash: [0, 0, 0, 0],
    seatDone: [false, false, false, false],
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
    mP: 1,
    mW: 1,
    tiltX: spring(0),
    tiltY: spring(0),
    cursorAmt: spring(0),
    glint: [0, 0, 0, 0],
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
    sm.makeRotationFromQuaternion(quat);
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
    if (s.lastS < M0 + 0.52 && S >= M0 + 0.52) {
      s.pulseT0 = time;
      s.pulseKind = 1;
      bus.emit("mark:lock");
    }
    if (S < 1.6 || (S > 3 && S < M0 - 0.1)) s.pulseT0 = s.pulseT0 > 0 && time - s.pulseT0 < PULSE_MS / 1000 ? s.pulseT0 : -1;
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

    /* ---- seat flashes (ch05) ------------------------------------------- */
    for (let g = 0; g < 4; g++) {
      const done = plan.seat[g] >= 0.999 && S < M0;
      if (done && !s.seatDone[g]) {
        s.seatFlash[g] = 1;
        bus.emit("seat", { group: g });
      }
      s.seatDone[g] = done;
      s.seatFlash[g] *= Math.exp(-dt / 0.4);
    }
    s.lastS = S;

    /* ---- the forms' own life -------------------------------------------- */
    ctx.gap = plan.gap;
    ctx.lift = plan.lift;
    ctx.monumentYaw = plan.monumentYaw + (still ? 0 : 0.035 * time);
    ctx.conveyor = plan.conveyor;
    ctx.specSpin = still ? 0.9 : 0.9 + 0.18 * time;
    for (let g = 0; g < 4; g++) ctx.seat[g] = plan.seat[g];
    ctx.crownLift = plan.crownLift;
    ctx.bandLift = plan.bandLift;
    ctx.split = plan.split;

    // The halo's orbits spin on their own; the beat's orbit runs faster; a
    // quick sweep of the cursor stirs them; the whole sculpture leans toward
    // the pointer.
    const inSculpt = S > 2.95 && S < 7.5;
    if (pointer.has) {
      const speed = Math.hypot(pointer.x - s.px, pointer.y - s.py) / Math.max(dt, 1e-3);
      s.px = pointer.x;
      s.py = pointer.y;
      if (inSculpt) s.stirT = Math.max(s.stirT, Math.min(1.6, speed / 1400));
    }
    s.stir += (s.stirT - s.stir) * (1 - Math.exp(-dt * (s.stirT > s.stir ? 5 : 1.1)));
    s.stirT *= Math.exp(-dt * 5);
    const beat = plan.beat;
    s.mP += ((beat === 1 ? 1.9 : beat === 2 ? 0.55 : 1) - s.mP) * (1 - Math.exp(-dt * 2));
    s.mW += ((beat === 2 ? 1.9 : beat === 1 ? 0.55 : 1) - s.mW) * (1 - Math.exp(-dt * 2));
    const stirK = 1 + 2.2 * s.stir;
    if (still) {
      for (let r = 0; r < 3; r++) orbitPhase[r] = ORBIT_SPEED[r] * FROZEN_TIME_S;
    } else {
      orbitPhase[0] += ORBIT_SPEED[0] * s.mP * stirK * dt;
      orbitPhase[1] += ORBIT_SPEED[1] * s.mW * stirK * dt;
      orbitPhase[2] += ORBIT_SPEED[2] * stirK * dt;
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
    const wantCursor = pointer.has && !still && S < 10.4 && performance.now() - pointer.lastMove < 6000 ? 1 : 0;
    springTo(s.cursorAmt, wantCursor * (inSculpt ? 1 : 0.6), 3, dt);
    u.cursorAmt = s.cursorAmt.x;
    if (pointer.has) {
      ndc2.set(pointer.nx, pointer.ny);
      ray.setFromCamera(ndc2, camera);
    }

    // Rigid while the stone is whole: it must never wobble apart. Released
    // quickly when it breaks, re-locked gently.
    const seatedAll = plan.seat.every((x) => x >= 0.999);
    const whole = plan.a === plan.b && (plan.a === "F0" || plan.a === "F6" || (plan.a === "F5" && seatedAll));
    s.rigid += ((whole ? 1 : 0) - s.rigid) * (1 - Math.exp(-dt * (whole ? 2.2 : 9)));
    const snap = !s.springsLive || still;
    const loose = 1 - s.rigid;

    // The active specimen (ch04): the hovered row, else the row nearest the viewport centre.
    let activeRow = ui.focusRow;
    if (activeRow < 0) {
      let bd = 0.3;
      measured.rowS.forEach((r, i) => {
        const dd = Math.abs(scroll.S - r);
        if (dd < bd) {
          bd = dd;
          activeRow = i;
        }
      });
    }
    for (let k = 0; k < 4; k++) s.glint[k] += ((k === activeRow ? 1 : 0) - s.glint[k]) * Math.min(1, dt * 4);

    // The cursor lifts shards out of the monument / halo / specimens.
    const holdForm = plan.a === plan.b && (plan.a === "F2" || plan.a === "F3" || plan.a === "F4");

    const frags = stone.frags;
    for (let i = 0; i < frags.length; i++) {
      const f = frags[i];
      const pr = prepared(i);
      const isCore = i === CORE;
      const sp = springs[i];
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
            // Course by course: each lands in its own window, with a little scatter.
            m = isCore ? plan.course[0] : clamp01((plan.course[pr.course] - 0.12 * pr.rand) / 0.88);
            break;
          case 3:
            d = 0.4 * pr.rand;
            span = 0.6;
            break;
          case 4:
            d = 0.1 * pr.spec + 0.2 * pr.rand;
            span = 0.6;
            break;
        }
        if (plan.stagger !== 2) m = clamp01((m - d) / span);
        fragTarget(plan.b, f, ctx, Bp);
        const e = easeInOutCubic(m);
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
        if (!isCore && plan.stagger === 2 && sp.lastM < 0.985 && m >= 0.985 && !still) sp.flash = 1;
        sp.lastM = m;
      } else {
        P.pos.copy(A.pos);
        P.quat.copy(A.quat);
        P.scale.copy(A.scale);
        sp.lastM = 1;
      }
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
        if (plan.a === "F4") liftDir.set(P.pos.x, 0, P.pos.z);
        else liftDir.copy(P.pos).sub(MONUMENT_C);
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
        // The halo: the orbit of the current beat carries the light.
        glow = beat === 0 ? 0.75 : (pr.orbit === 0) === (beat === 1) ? 1 : 0.3;
      } else if (plan.glowMode === 3) {
        glow = 0.45 + 0.55 * s.glint[pr.spec];
      } else if (plan.glowMode === 4) {
        // Unseated pieces carry the light; seating heals the cut.
        const g = Math.max(0, f.group);
        glow = 1 - 0.8 * plan.seat[g];
        flash = Math.max(flash, s.seatFlash[g]);
      } else if (plan.glowMode === 5) {
        glow = f.piece === "crown" ? 0 : 1;
        if (f.piece === "crown") fade = easeInOutSine(range(S - M0, 0.22, 0.36));
      }
      if (isCore) {
        // The core: hidden inside the whole stone; laid bare by the burst; the light of the monument and the halo.
        const shown = (plan.a === "F0" && plan.b === "F0") || plan.a === "F5" || plan.a === "F6" ? 0 : 1;
        boost = shown * (plan.glowMode === 2 ? 5 + 1.2 * Math.sin(time * 1.6) : plan.glowMode === 1 ? 3.6 : 2.6);
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
