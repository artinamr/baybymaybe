"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { World } from "./world";
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

function detect(): { phone: boolean; quality: Quality } {
  if (typeof window === "undefined") return { phone: false, quality: 1 };
  const coarse = matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const phone = coarse && small;
  const forced = q.get("q");
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
  const rig = useRef<Rig | null>(null);
  const pointer = useRef({ x: 0, y: 0, cx: 0, cy: 0, has: false });
  const perf = useRef({ avg: 16, n: 0, last: 0, dpr: 0 });
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
      world.prewarm(80);
      world.sim.lost = { website: 0, inbox: 0, admin: 0, followup: 0 };
      world.sim.kept = 0;
      world.update({ dt: 0, time: 0, P: 0, pointer: { x: 0, y: 0, has: false } });
      film.progress = 0.5;
      try {
        await gl.compileAsync(world.scene, world.camera);
      } catch {
        /* compileAsync is an optimisation; drawing compiles anything left */
      }
      if (!alive) return;
      film.progress = 0.82;
      // Draw a few frames from the film's far ends, so every program is ready.
      for (const P of [0, 3.4, 15.5, 16.8, 19]) {
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
        const st = P < 4.6 ? "website" : P < 7.2 ? "inbox" : P < 9.6 ? "admin" : P < 14 ? "followup" : P > 16.9 ? "new" : null;
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
      if (!r) return;
      r.clock.start(gl.domElement);
      if (DEV_AT !== null) {
        const P = Number(DEV_AT) || 0;
        requestAnimationFrame(() => r.clock.jump(P));
      } else window.scrollTo(0, 0);
      if (!HUD) document.documentElement.setAttribute("data-st-clean", "");
      if (film.sound && audio.ctx) cmd.sound(true);
    };
    const offStart = events.on("start", onStart);
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
    };
    const leave = () => (pointer.current.has = false);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      alive = false;
      offStart();
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
    if (r.dom.update(P, r.world, p)) r.score.land();
    r.score.update(P, r.world, dt);

    // Keep it smooth: if frames run long, draw fewer pixels (and more if there is room).
    const pf = perf.current;
    pf.avg += (delta * 1000 - pf.avg) * 0.05;
    pf.n++;
    if (pf.n > 90 && !FREEZE) {
      const cur = state.viewport.dpr;
      const max = Math.min(window.devicePixelRatio || 1, DETECT.phone ? 1.5 : 1.6);
      if (pf.avg > 24 && cur > 0.75) {
        setDpr(Math.max(0.75, cur - 0.2));
        pf.n = 0;
      } else if (pf.avg < 13 && cur < max) {
        setDpr(Math.min(max, cur + 0.1));
        pf.n = 0;
      }
    }
  }, 1);

  return null;
}

/** THE FILM: its own canvas. Loaded on /story/ only, behind the door. */
export default function Film() {
  const start = Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, DETECT.phone ? 1.25 : 1.35);
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
