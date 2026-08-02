"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Environment, Lightformer } from "@react-three/drei";
import { Suspense, useState } from "react";
import { CAMERA } from "@/lib/heroLayout";
import { Crystal } from "./Crystal";

/**
 * The canvas is TRANSPARENT and carries nothing but the rock.
 *
 * That is the point: with no opaque backdrop, DOM sitting below it in z shows
 * through, and the rock genuinely occludes the headline running behind it. The
 * page field itself is CSS (see .hero-field), which is also cheaper and sharper
 * than a gradient shader.
 */
function Scene({
  onEnter,
  onHover,
}: {
  onEnter: () => void;
  onHover: (h: boolean) => void;
}) {
  return (
    <>
      {/* Broad and soft, because the stone is fully rough — matte has no
          highlights to carry brightness, so light level alone sets its value. */}
      <hemisphereLight args={["#ffffff", "#b9b3c9", 0.8]} />
      <directionalLight position={[4, 6, 5]} intensity={1.75} color="#fffdf8" />
      <directionalLight position={[-6, 2, 1]} intensity={0.7} color="#8b76ff" />
      <directionalLight position={[0, -4, 3]} intensity={0.35} color="#ffffff" />

      <Suspense fallback={null}>
        <Crystal onEnter={onEnter} onHover={onHover} />
      </Suspense>

      <Environment resolution={128}>
        <Lightformer intensity={0.7} position={[3, 3, 4]} scale={[6, 8, 1]} color="#ffffff" />
        <Lightformer intensity={0.4} position={[-4, 1, 3]} scale={[5, 7, 1]} color="#d8d4e6" />
      </Environment>
    </>
  );
}

export default function HeroCanvas({
  onEnter,
  onHover,
}: {
  onEnter: () => void;
  onHover: (h: boolean) => void;
}) {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      className="!fixed inset-0"
      style={{ position: "fixed" }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [...CAMERA.position], fov: CAMERA.fov }}
      dpr={dpr}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} />
      <AdaptiveDpr />
      <Scene onEnter={onEnter} onHover={onHover} />
    </Canvas>
  );
}
