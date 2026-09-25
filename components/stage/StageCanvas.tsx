"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useEffect, useState } from "react";
import * as THREE from "three";
import { perf, ready } from "@/lib/stores";
import { Scene } from "./Scene";

const DPR_TIERS = [1.5, 1.25, 1.1, 1.0];

/** Compile every program once the stone + env exist, so no shader hitches mid-scroll. */
function Compile() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let dead = false;
    let tries = 0;
    const tick = () => {
      if (dead) return;
      if ((ready.stone && ready.env) || tries++ > 60) {
        gl.compileAsync(scene, camera)
          .catch(() => undefined)
          .finally(() => {
            if (!dead) ready.compiled = true;
          });
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
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, DPR_TIERS[tier]);

  return (
    <Canvas
      frameloop="never"
      dpr={dpr}
      gl={{ alpha: true, premultipliedAlpha: true, antialias: true, stencil: false, powerPreference: "high-performance" }}
      camera={{ fov: 30, near: 0.1, far: 140, position: [0, 0, 9] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1;
        gl.localClippingEnabled = true;
        gl.setClearColor(0x000000, 0);
      }}
      style={{ position: "absolute", inset: 0 }}
    >
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
      <Compile />
      <Scene />
    </Canvas>
  );
}
