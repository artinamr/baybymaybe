"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { World } from "./world";
import { makeGpuTimer } from "@/components/stage/gpuTimer";
import { Clock } from "./clock";
import { Dom } from "./dom";
import { Score } from "./audio";
import { FILM_LEN, RESTS } from "../timeline";
import { audio, cmd, events, film, type Quality } from "../store";

type Rig = { world: World; clock: Clock; dom: Dom; score: Score };

const q = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
const DEV_AT = q.get("at");
const FREEZE = q.get("freeze") === "1";
const HUD = q.get("hud") !== "0";
const PERF = q.get("perf") === "1";
const CAM = q.get("cam")?.split(",").map(Number) ?? null;

function detect(): { phone: boolean; quality: Quality } {
  if (typeof window === "undefined") return { phone: false, quality: 1 };
  const coarse = matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const phone = coarse && small;
  const forced = q.get("q");
  if (forced === "low") return { phone: true, quality: 0 };
  if (forced === "high") return { phone, quality: 2 };
  if (forced === "0" || forced === "1" || forced === "2") return { phone: phone || forced === "0", quality: Number(forced) as Quality };
  return { phone, quality: phone ? 0 : 1 };
}

const DETECT = detect();

/** The frame loop: one place where the clock, the world, the words and the sound move together. */
function Director() {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const setDpr = useThree((s) => s.setDpr);
  // The render scale, adapted to the machine: frame gaps are watched in
  // windows of a second and a half; slow (a median past 19 ms) steps the
  // scale down, fast for a while steps it back up toward the ceiling.
  const adapt = useRef({ scale: 0, ceiling: 0, gaps: [] as number[], last: 0, up: 0 });
  const rig = useRef<Rig | null>(null);
  const pointer = useRef({ x: 0, y: 0, cx: 0, cy: 0, has: false, moved: 0 });
  const frames = useRef(0);

  // Build, compile and warm the film behind the door.
  useEffect(() => {
    let alive = true;
    film.quality = DETECT.quality;
    film.progress = Math.max(film.progress, 0.18);
    gl.setClearColor(0x050507, 1);
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.NoToneMapping;
    const run = async () => {
      // Let the door paint before the heavy part.
      await new Promise((r) => setTimeout(r, 30));
      const world = new World(gl, { ...DETECT, reduced: film.reduced });
      film.progress = 0.42;
      world.setSize(size.width, size.height, dpr);
      if (PERF) {
        const w = window as unknown as { __perf?: { gpu?: Record<string, { sum: number; n: number }> } };
        world.post.timer = makeGpuTimer(gl.getContext() as WebGL2RenderingContext, (w.__perf ??= {}));
      }
      if (CAM && CAM.length >= 7) world.camOverride = { eye: new THREE.Vector3(CAM[0], CAM[1], CAM[2]), at: new THREE.Vector3(CAM[3], CAM[4], CAM[5]), fov: CAM[6] };
      world.prewarm(80);
      world.sim.lost = { website: 0, inbox: 0, admin: 0, followup: 0 };
      world.sim.kept = 0;
      world.update({ dt: 0, time: 0, P: 0, pointer: { x: 0, y: 0, has: false } });
      film.progress = 0.5;
      try {
        const was: [THREE.Object3D, boolean][] = [];
        world.scene.traverse((o) => {
          was.push([o, o.visible]);
          o.visible = true;
        });
        await gl.compileAsync(world.scene, world.camera);
        for (const [o, v] of was) o.visible = v;
      } catch {
        /* compileAsync is an optimisation; drawing compiles anything left */
      }
      if (!alive) return;
      film.progress = 0.82;
      // Draw a few frames from the film's far ends, so every program is ready.
      for (const P of [0, 2.3, 3.5, 5.98, 8.3, 13.3, 16.0, 17.7, 20.76, 22.9]) {
        world.update({ dt: 0, time: 0, P, pointer: { x: 0, y: 0, has: false } });
        world.render(0);
      }
      world.update({ dt: 0, time: 0, P: 0, pointer: { x: 0, y: 0, has: false } });
      const clock = new Clock();
      const dom = new Dom();
      const score = new Score();
      rig.current = { world, clock, dom, score };
      clock.onTap = () => cmd.drop();
      cmd.play = () => clock.play();
      cmd.pause = () => clock.pause();
      cmd.toggle = () => clock.toggle();
      cmd.next = () => clock.step(1);
      cmd.prev = () => clock.step(-1);
      cmd.goto = (P) => clock.goto(P);
      cmd.sound = (on) => {
        if (on && audio.ctx) score.attach(audio.ctx);
        score.setOn(on);
      };
      cmd.drop = () => {
        const P = clock.Ps;
        const st = P < 5.0 ? "website" : P < 7.8 ? "inbox" : P < 10.6 ? "admin" : P < 15.0 ? "followup" : P > 18.0 ? "new" : null;
        if (!st) return;
        if (world.sim.drop(st)) score.drop();
      };
      if (film.sound && audio.ctx) cmd.sound(true);
      film.progress = 1;
      film.ready = true;
      events.emit("ready");
      // Look-dev: land anywhere in the film without reloading (the stills script uses it).
      (window as unknown as { __story?: object }).__story = {
        jump: (P: number) => clock.jump(P),
        frames: () => frames.current,
        state: () => ({ P: film.P, Ps: film.Ps, playing: film.playing, sound: film.sound, rests: RESTS, lost: world.sim.lost, kept: world.sim.kept, yours: world.sim.yoursIn, hover: world.hover, dpr: gl.getPixelRatio() }),
        // Cost of a frame at P: the update (CPU) and the draw, and what the draw holds.
        bench: (P: number, n = 20) => {
          const f = { dt: 1 / 60, time: 10, P, pointer: { x: 0, y: 0, has: false } };
          let t = performance.now();
          for (let i = 0; i < n; i++) world.update({ ...f, time: 10 + i / 60 });
          const upd = (performance.now() - t) / n;
          gl.info.autoReset = false;
          gl.info.reset();
          world.render(10);
          const info = { calls: gl.info.render.calls, triangles: gl.info.render.triangles, points: gl.info.render.points, lines: gl.info.render.lines };
          gl.info.autoReset = true;
          const ctx = gl.getContext();
          t = performance.now();
          for (let i = 0; i < 3; i++) world.render(10);
          ctx.finish();
          const draw = (performance.now() - t) / 3;
          return { P, updateMs: +upd.toFixed(2), drawMsSwiftShader: +draw.toFixed(1), ...info, programs: gl.info.programs?.length ?? 0, size: [gl.domElement.width, gl.domElement.height] };
        },
        world,
        Score,
      };
    };
    run().catch(() => {
      film.failed = true;
      events.emit("failed");
    });
    const onStart = () => {
      const r = rig.current;
      if (!r || r.clock.lenis) return;
      r.clock.start(gl.domElement);
      if (DEV_AT !== null) {
        const P = Number(DEV_AT) || 0;
        requestAnimationFrame(() => r.clock.jump(P));
      } else {
        window.scrollTo(0, 0);
        // Enter on the first composed shot, so starting always reveals words.
        requestAnimationFrame(() => r.clock.goto(0.66));
      }
      if (!HUD) document.documentElement.setAttribute("data-st-clean", "");
      if (film.sound && audio.ctx) cmd.sound(true);
    };
    const offStart = events.on("start", onStart);
    const offRead = events.on("reading", () => {
      rig.current?.clock.stop();
    });
    // If the door was already passed (look-dev), start as soon as we're ready.
    const offReady = events.on("ready", () => {
      if (film.started) onStart();
    });
    const move = (e: PointerEvent) => {
      const p = pointer.current;
      p.cx = e.clientX;
      p.cy = e.clientY;
      p.x = (e.clientX / window.innerWidth) * 2 - 1;
      p.y = -((e.clientY / window.innerHeight) * 2 - 1);
      p.has = e.pointerType === "mouse" || e.pointerType === "pen";
      p.moved = performance.now();
    };
    const leave = () => (pointer.current.has = false);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      alive = false;
      offStart();
      offRead();
      offReady();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      rig.current?.clock.stop();
      rig.current?.score.dispose();
    };
    // Built once for this canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  useEffect(() => {
    rig.current?.world.setSize(size.width, size.height, dpr);
  }, [size.width, size.height, dpr]);

  useFrame((state, delta) => {
    const r = rig.current;
    if (!r || !film.started) return;
    const dt = FREEZE ? 0 : Math.min(0.05, delta);
    const time = FREEZE ? 8 : state.clock.elapsedTime;
    // (Reduced motion: the grain holds still; the fades use real time.)
    r.clock.update(dt, performance.now());
    const P = r.clock.Ps;
    const p = pointer.current;
    // Past the film (the offer, the words, the footer cover it), nothing is drawn.
    if (P > FILM_LEN - 0.04) {
      r.dom.update(P, r.world, p);
      r.score.update(P, r.world, dt);
      return;
    }
    r.world.update({ dt, time, P, pointer: p });
    r.world.render(time);
    frames.current++;
    if (!FREEZE && !PERF) {
      const a = adapt.current;
      const now = performance.now();
      if (!a.ceiling) {
        a.ceiling = a.scale = gl.getPixelRatio();
        a.last = now;
      }
      if (a.last) a.gaps.push(Math.min(100, now - a.last));
      a.last = now;
      if (a.gaps.length >= 90) {
        const sorted = a.gaps.slice().sort((x, y) => x - y);
        const median = sorted[Math.floor(sorted.length / 2)];
        a.gaps.length = 0;
        if (median > 19 && a.scale > 0.7) {
          a.scale = Math.max(0.7, +(a.scale * 0.85).toFixed(2));
          a.up = 0;
          setDpr(a.scale);
        } else if (median < 12.5 && a.scale < a.ceiling && ++a.up >= 4) {
          a.scale = Math.min(a.ceiling, +(a.scale * 1.1).toFixed(2));
          a.up = 0;
          setDpr(a.scale);
        }
      }
    }
    if (r.dom.update(P, r.world, p)) r.score.land();
    r.score.update(P, r.world, dt);

  }, 1);

  return null;
}

/** THE FILM: its own canvas. Loaded on /story/ only, behind the door. */
export default function Film() {
  // The ceiling: the screen's own ratio up to 1.5 (the type is DOM, so the
  // picture need not be sharper than that); the Director steps it down on a
  // machine that cannot hold the frame (phones: 1.75, their screens are small).
  const start = Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, DETECT.phone ? 1.75 : 1.5);
  return (
    <Canvas
      gl={{ antialias: false, alpha: false, depth: true, stencil: false, powerPreference: "high-performance" }}
      dpr={start}
      flat
      frameloop="always"
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x050507, 1);
      }}
    >
      <Director />
    </Canvas>
  );
}
