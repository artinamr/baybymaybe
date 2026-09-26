"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { evaluate, film, M0, rig, ROW_LAYER } from "@/lib/choreo";
import { bladeCentreOf, layerCentreOf, piecePose, pose, poseMatrix, prepareRig } from "@/lib/formations";
import { getStone } from "@/lib/geo/crystal";
import { fragTex } from "@/lib/fragTex";
import { layout } from "@/lib/layout";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { bus, intro, measured, pointer, scroll, ui } from "@/lib/stores";
import { dev, devNum, FROZEN_TIME_S } from "@/lib/dev";
import { DEG, clamp01, easeInOutSine, easeIntro, easeOutSine, lerp, range } from "@/lib/ease";
import { spring, springTo } from "@/lib/springs";

/**
 * THE DIRECTOR — runs first every frame (PRIORITY.director).
 *
 *  1. evaluate(S): camera keys, the rig's gestures, uniforms.
 *  2. Layers the TIME-based life on top: the load intro, Ken Burns, idle yaw
 *     and pointer tilt, the ridge thread, seam pulses, the stack's dials, the
 *     specimens turning, the cursor's lean and the light that follows it
 *     inside the glass, the seat flashes.
 *  3. Poses every piece from the rig, gives it weight (its own critically
 *     damped spring), and writes its world matrix + glow/flash/fade to fragTex.
 */

type Thread = { ridge: number; t0: number; dur: number; live: boolean };

const devYaw = devNum("yaw");
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const INTRO_MS = 1500;
const THREAD_MS = 1280; // 520 crown + 760 pavilion
const PULSE_MS = 1100;
/** The stack's dials: resting offsets (rad) and how they drift. */
const DIAL_BASE = [-0.42, 0.2, -0.14, 0.36];
const DIAL_AMP = [0.34, 0.26, 0.3, 0.22];
const DIAL_RATE = [0.23, -0.19, 0.27, -0.21];
/** Specimens: base heading + tilt per layer. */
const SPEC_HEAD = [0.6, -0.4, 1.2, -1.0];
const SPEC_TILT = [0.1, -0.08, 0.07, -0.12];

export function Director() {
  const { camera, size } = useThree();
  const stone = useMemo(() => getStone(), []);
  useMemo(() => prepareRig(stone.frags), [stone]);

  const P = useMemo(pose, []);
  const M = useMemo(() => new THREE.Matrix4(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  const tiltEuler = useMemo(() => new THREE.Euler(), []);
  const qa = useMemo(() => new THREE.Quaternion(), []);
  const qb = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const head = useMemo(() => new THREE.Vector3(), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const axisP = useMemo(() => new THREE.Vector3(), []);
  const axisD = useMemo(() => new THREE.Vector3(), []);
  const w0 = useMemo(() => new THREE.Vector3(), []);
  const invM = useMemo(() => new THREE.Matrix4(), []);

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
    /** Per layer: seat flash, seated flag, focus slide. */
    flash: [0, 0, 0, 0],
    seated: [false, false, false, false],
    slide: [spring(0), spring(0), spring(0), spring(0)],
    /** The 3D's own scroll clock: follows scroll.S with weight (−1 = not started). */
    S: -1,
    /** 1 while the stone is whole (pieces locked rigid), easing to 0 when it opens. */
    rigid: 1,
    springsLive: false,
    tiltX: spring(0),
    tiltY: spring(0),
    cursorAmt: spring(0),
    glint: [0, 0, 0, 0],
  });

  // Every piece follows its target on its own critically damped spring —
  // pieces carry momentum, overshoot nothing, and settle at slightly different
  // rates, so a gesture reads as heavy glass moving, not a tween.
  const springs = useMemo(
    () =>
      stone.frags.map((f) => ({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        quat: new THREE.Quaternion(),
        scale: new THREE.Vector3(1, 1, 1),
        // Per LAYER, so the two halves of a layer always move as one body…
        omega: 3.9 + 1.3 * ((f.layer * 0.618034) % 1),
        phase: f.layer * 1.713,
        // …and per BLADE, for the gestures that move whole blades (the cut, the book).
        phaseB: (f.side + 1) * 2.371,
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
    let yaw = film.yaw;
    if (S < 1.0 && !cam.path) {
      // Intro: the product shot becomes a monument — pull back, recentre, turn.
      const dollyIn = lerp(1.28, 1, introK);
      const introMs = intro.state === "wait" ? 0 : intro.ms;
      // Ken Burns after the intro, then a slow breath.
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
    // Look-dev: `?yaw=<deg>` pins the stone's rotation (screenshots per angle).
    if (devYaw !== null) yaw = devYaw * DEG;
    // The mark lock: pointer tilt ≤ ±1.5° so it breathes but never breaks.
    if (S >= M0) yaw += (pointer.has ? 1.5 * DEG * pointer.nx : 0) * (1 - range(S - M0, 0.3, 0.5));
    const bob = reduced ? 0 : 0.004 * Math.sin((2 * Math.PI * time) / 9) * heroK;
    euler.set(s.pitchSpring.x, yaw, 0, "YXZ");
    quat.setFromEuler(euler);
    sceneState.stone.yaw = yaw;
    sceneState.stone.pitch = s.pitchSpring.x;
    sceneState.stone.bob = bob;
    sceneState.stone.home.copy(rig.home);
    const sm = sceneState.stone.matrix;
    sm.makeRotationFromQuaternion(quat);
    sm.elements[12] = rig.home.x;
    sm.elements[13] = rig.home.y + bob;
    sm.elements[14] = rig.home.z;
    rig.quat.copy(quat);
    rig.home.y += bob;
    rig.quatB.setFromAxisAngle(Y_AXIS, film.yawB);

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

    /* ---- seats (ch05): each layer lands with a flash ------------------- */
    for (let k = 0; k < 4; k++) {
      const done = film.seat[k] >= 0.999;
      if (done && !s.seated[k] && S < M0) {
        s.flash[k] = 1;
        bus.emit("seat", { group: k });
      }
      s.seated[k] = done;
      s.flash[k] *= Math.exp(-dt / 0.45);
    }
    s.lastS = S;

    /* ---- the rig's life ------------------------------------------------- */
    // The stack's four layers drift like dials (bounded — they never unwind);
    // the unseated layers of the build turn slowly the same way.
    for (let k = 0; k < 4; k++) {
      const osc = still ? 0 : DIAL_AMP[k] * Math.sin(DIAL_RATE[k] * time + k * 1.9);
      const unseated = film.column * (1 - film.seat[k]);
      rig.layerSpin[k] = film.stack * (DIAL_BASE[k] + osc) + unseated * (0.5 * DIAL_BASE[k] + 0.8 * osc);
      // The focused layer slides out toward you; the springs give it weight.
      springTo(s.slide[k], film.focus === k && film.allLit < 0.5 ? 1 : 0, 5, dt);
      rig.layerOut[k] = s.slide[k].x * film.stack;
    }

    // Specimens turn slowly at their stations.
    for (let k = 0; k < 4; k++) {
      qa.setFromAxisAngle(Y_AXIS, SPEC_HEAD[k] + (still ? 0 : 0.14 * time) * (k % 2 ? -1 : 1));
      tiltEuler.set(SPEC_TILT[k], 0, SPEC_TILT[(k + 1) % 4]);
      qb.setFromEuler(tiltEuler);
      rig.stationQuat[k].copy(qb).multiply(qa);
    }

    // The sculpture leans toward the cursor (stack, book, build).
    const leanK = (S > 2.7 && S < 7.3) || (S > 10.4 && S < M0 - 0.3) ? 1 : 0;
    const lean = pointer.has && !still ? leanK : 0;
    springTo(s.tiltX, -pointer.ny * 0.16 * lean + (still ? 0 : 0.04 * Math.sin(time * 0.21)) * leanK, 2.6, dt);
    springTo(s.tiltY, pointer.nx * 0.26 * lean + (still ? 0 : 0.05 * Math.sin(time * 0.17)) * leanK, 2.6, dt);
    if (dev.freeze) {
      s.tiltX.x = 0;
      s.tiltY.x = 0;
    }
    tiltEuler.set(s.tiltX.x, s.tiltY.x, 0);
    rig.tilt.setFromEuler(tiltEuler);

    // The light inside follows the cursor (level here; where, per piece, below).
    const wantCursor = pointer.has && !still && S < 7.3 && performance.now() - pointer.lastMove < 6000 ? 1 : 0;
    springTo(s.cursorAmt, wantCursor * (0.55 + 0.45 * u.dusk), 3, dt);
    u.cursorAmt = s.cursorAmt.x;
    if (pointer.has) {
      ndc.set(pointer.nx, pointer.ny);
      ray.setFromCamera(ndc, camera);
    }

    // Rigid while the stone is whole: the intact stone must never wobble apart.
    // Released quickly when it opens, re-locked gently.
    s.rigid += (film.whole - s.rigid) * (1 - Math.exp(-dt * (film.whole ? 2.2 : 9)));
    const snap = !s.springsLive || still;
    const loose = 1 - s.rigid;

    // Which specimen is "active" (ch04): the hovered row, else the row nearest the viewport centre.
    let activeRow = ui.focusRow;
    if (activeRow < 0) {
      let bd = 0.35;
      measured.rowS.forEach((r, i) => {
        const dd = Math.abs(scroll.S - r);
        if (dd < bd) {
          bd = dd;
          activeRow = i;
        }
      });
    }
    for (let row = 0; row < 4; row++) {
      const k = ROW_LAYER[row];
      s.glint[k] += ((row === activeRow ? 1 : 0) - s.glint[k]) * Math.min(1, dt * 4);
    }

    const frags = stone.frags;
    for (let i = 0; i < frags.length; i++) {
      const f = frags[i];
      const sp = springs[i];
      piecePose(f, rig, P);

      // Suspended pieces breathe: a slow float and a drift of rotation, so an
      // open stone is never frozen — it hangs in the air. The breathing unit is
      // whatever moves as one body in this gesture — a layer (stack, specimens,
      // build) or a whole blade (the cut, the book) — and the drift turns about
      // that unit's own centre, so it never comes apart.
      if (loose > 0.001 && !still) {
        const bw = Math.max(film.book, film.open);
        for (let pass = 0; pass < 2; pass++) {
          const wgt = loose * (pass === 0 ? 1 - bw : bw);
          if (wgt < 0.001) continue;
          const ph = pass === 0 ? sp.phase : sp.phaseB;
          P.pos.x += 0.018 * wgt * Math.sin(time * 0.61 + ph);
          P.pos.y += 0.03 * wgt * Math.sin(time * 0.47 + ph * 1.3);
          P.pos.z += 0.018 * wgt * Math.cos(time * 0.53 + ph * 0.7);
          driftAxis.set(Math.sin(ph), Math.cos(ph * 1.7), Math.sin(ph * 0.9)).normalize();
          drift.setFromAxisAngle(driftAxis, 0.025 * wgt * Math.sin(time * 0.33 + ph));
          // Unit centre (world) = piece position − its rotated offset from that centre.
          v.copy(f.centroid)
            .sub(pass === 0 ? layerCentreOf(f.layer) : bladeCentreOf(i))
            .multiply(P.scale)
            .applyQuaternion(P.quat);
          head.copy(P.pos).sub(v);
          v.applyQuaternion(drift);
          P.pos.copy(head).add(v);
          P.quat.premultiply(drift);
        }
      }

      // Spring toward the target; blend back to the exact target while rigid.
      if (snap) {
        sp.pos.copy(P.pos);
        sp.vel.set(0, 0, 0);
        sp.quat.copy(P.quat);
        sp.scale.copy(P.scale);
      } else {
        // Blades move as one in the cut and the book: one rate for all their pieces.
        const w = sp.omega + (4.4 - sp.omega) * Math.max(film.book, film.open);
        const ax = w * w * (P.pos.x - sp.pos.x) - 2 * w * sp.vel.x;
        const ay = w * w * (P.pos.y - sp.pos.y) - 2 * w * sp.vel.y;
        const az = w * w * (P.pos.z - sp.pos.z) - 2 * w * sp.vel.z;
        sp.vel.x += ax * dt;
        sp.vel.y += ay * dt;
        sp.vel.z += az * dt;
        sp.pos.addScaledVector(sp.vel, dt);
        sp.quat.slerp(P.quat, 1 - Math.exp(-dt * w * 0.9));
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

      // Where the cursor's light sits inside this piece: the point on the
      // cursor's ray nearest the piece's heart, in the piece's own frame, then
      // back to stone object space (which is what the shader's glass is in).
      if (pointer.has && u.cursorAmt > 0.001) {
        invM.copy(M).invert();
        axisP.copy(ray.ray.origin).applyMatrix4(invM);
        axisD.copy(ray.ray.direction).transformDirection(invM);
        const tt = Math.max(0, -axisP.dot(axisD));
        w0.copy(axisP).addScaledVector(axisD, tt);
        const dist = w0.length();
        const lim = f.radius * 0.8;
        if (dist > lim) w0.multiplyScalar(lim / dist);
        w0.add(f.centroid);
        const cp = u.cursorPiece[i];
        const k = 1 - Math.exp(-dt * 7);
        cp.x += (w0.x - cp.x) * k;
        cp.y += (w0.y - cp.y) * k;
        cp.z += (w0.z - cp.z) * k;
        const near = Math.exp(-((dist / (f.radius * 1.3)) ** 2));
        cp.w += (near - cp.w) * k;
      }

      // Light: how much of the inner glow this piece shows.
      const k = f.layer;
      let glow = 1;
      let flash = s.flash[k];
      let fade = 0;
      switch (film.glow) {
        case 1: {
          const fo = film.focus;
          glow = fo < 0 ? 0.6 : k === fo ? 1 : 0.28;
          glow = lerp(glow, 1, film.allLit);
          break;
        }
        case 2:
          glow = f.side < 0 ? lerp(1, 0.42, film.beat) : f.side > 0 ? lerp(0.42, 1, film.beat) : 0.62;
          break;
        case 3:
          glow = 0.42 + 0.58 * s.glint[k];
          flash = Math.max(flash, 0.35 * s.glint[k] * (0.5 + 0.5 * Math.sin(time * 2.2)));
          break;
        case 4:
          glow = lerp(0.9, 0.2, film.seat[k]);
          break;
        case 5:
          glow = f.piece === "crown" ? 0 : 1;
          if (f.piece === "crown") fade = film.crownFade;
          flash = 0;
          break;
      }
      fragTex.writeFrag(i, M, glow, flash, fade);
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
