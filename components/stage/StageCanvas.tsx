"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { intro, perf, ready } from "@/lib/stores";
import { devNum } from "@/lib/dev";
import { Scene } from "./Scene";
import { compileFor } from "./compile";

// The canvas carries only the 3D (the type is DOM and stays crisp at any DPR);
// glass at 1.3× is indistinguishable from 1.5× and a third cheaper.
const DPR_TIERS = [1.3, 1.15, 1.0, 0.9];

/**
 * The first programs — the scene as it first draws, the stone in its LITE
 * glass — compiled off the main thread the moment the stone and its room
 * exist; the page starts when they are ready. The full glass and the lens's
 * programs compile alongside (Stone, Lens), so none compiles mid-scroll.
 */
function Compile() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let dead = false;
    let tries = 0;
    const tick = () => {
      if (dead) return;
      if ((ready.stone && ready.envKey) || tries++ > 60) {
        performance.mark("nd:compiling");
        compileFor(gl, scene, camera, scene).then(() => {
          if (dead) return;
          ready.compiled = true;
          performance.mark("nd:compiled");
        });
        ready.compiling = true;
        return;
      }
      setTimeout(tick, 50);
    };
    tick();
    return () => {
      dead = true;
    };
  }, [gl, scene, camera]);
  return null;
}

/**
 * The fixed, transparent canvas. Transparent so the paper field is CSS and so
 * DOM set BELOW it in z (POTENTIAL, "what's next.") is genuinely occluded by
 * the stone. frameloop="never": Experience's single rAF calls advance().
 * No post-processing at all — bloom greys a light page (CLAUDE.md).
 */
export default function StageCanvas() {
  const [tier, setTier] = useState(0);
  // (Look-dev stills: `?dpr=2` lifts the cap for print-sharp frames of the film.)
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, devNum("dpr") ?? DPR_TIERS[tier]);
  // Frame times mean nothing while shaders compile (the first seconds of a
  // first visit): judged then, the machine passed for a slow one and the hero
  // went soft. The monitor starts once every program is in (or after a while).
  const [judge, setJudge] = useState(false);
  useEffect(() => {
    let dead = false;
    const t0 = performance.now();
    const tick = () => {
      if (dead) return;
      if ((ready.lens && intro.state === "done") || performance.now() - t0 > 20000) setJudge(true);
      else setTimeout(tick, 250);
    };
    tick();
    return () => {
      dead = true;
    };
  }, []);

  return (
    <Canvas
      frameloop="never"
      dpr={dpr}
      gl={{ alpha: true, premultipliedAlpha: true, antialias: true, stencil: false, powerPreference: "high-performance" }}
      camera={{ fov: 30, near: 0.1, far: 140, position: [0, 0, 9] }}
      onCreated={({ gl }) => {
        performance.mark("nd:gl");
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1;
        gl.localClippingEnabled = true;
        gl.setClearColor(0x000000, 0);
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      {judge && (
        <PerformanceMonitor
          bounds={() => [50, 58]}
          flipflops={4}
          onDecline={() => {
            const t = Math.min(3, perf.tier + 1);
            perf.tier = t;
            setTier(t);
          }}
          onIncline={() => {
            const t = Math.max(0, perf.tier - 1);
            perf.tier = t;
            setTier(t);
          }}
        />
      )}
      <Compile />
      <Scene />
    </Canvas>
  );
}
