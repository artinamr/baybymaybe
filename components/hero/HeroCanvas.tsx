"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { pointer } from "@/lib/usePointer";
import { heroAnim } from "@/lib/heroAnim";
import { drawHeadlineMask } from "@/lib/headlineMask";
import { liquidVertex, liquidFragment } from "@/shaders/liquid";

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function makeMaskTexture(canvas: HTMLCanvasElement, dpr: number) {
  drawHeadlineMask(canvas, dpr);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/** The headline filled with flowing liquid (masked to the letterforms). */
function LiquidText() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef(new THREE.Vector2(0, 0));

  const maskCanvas = useMemo(() => document.createElement("canvas"), []);
  const texRef = useRef<THREE.CanvasTexture | null>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uDive: { value: 0 },
      uReveal: { value: 0 },
      uMask: { value: null as THREE.Texture | null },
    }),
    []
  );

  useEffect(() => {
    let alive = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const build = () => {
      if (!alive) return;
      const tex = makeMaskTexture(maskCanvas, dpr);
      const old = texRef.current;
      texRef.current = tex;
      uniforms.uMask.value = tex;
      if (mat.current) mat.current.uniforms.uMask.value = tex;
      old?.dispose();
    };
    build();
    document.fonts?.ready.then(build);
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(build);
    };
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      texRef.current?.dispose();
    };
  }, [maskCanvas, uniforms]);

  useFrame((state) => {
    const m = mat.current;
    if (!m) return;
    m.uniforms.uTime.value = prefersReduced ? 0 : state.clock.elapsedTime;
    m.uniforms.uReveal.value = prefersReduced
      ? 1
      : THREE.MathUtils.clamp((state.clock.elapsedTime - 0.15) / 1.1, 0, 1);
    mouse.current.x += (pointer.tx - mouse.current.x) * 0.05;
    mouse.current.y += (pointer.ty - mouse.current.y) * 0.05;
    m.uniforms.uMouse.value.copy(mouse.current);
    m.uniforms.uRes.value.set(state.size.width, state.size.height);
    m.uniforms.uDive.value = heroAnim.dive;
  });

  // renderOrder + no depth test → always composited over the 3D sculpture.
  return (
    <mesh frustumCulled={false} renderOrder={999}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={liquidVertex}
        fragmentShader={liquidFragment}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}

export default function HeroCanvas() {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      className="!fixed inset-0"
      style={{ position: "fixed" }}
      gl={{ antialias: true, alpha: true, premultipliedAlpha: false, powerPreference: "high-performance" }}
      dpr={dpr}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} />
      <AdaptiveDpr />
      <LiquidText />
    </Canvas>
  );
}
