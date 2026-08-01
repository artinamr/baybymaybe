"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdaptiveDpr,
  PerformanceMonitor,
  Environment,
  Lightformer,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { pointer } from "@/lib/usePointer";
import { heroAnim } from "@/lib/heroAnim";
import { drawHeadlineMask } from "@/lib/headlineMask";
import { CAMERA, heroLayout } from "@/lib/heroLayout";
import { liquidVertex, liquidFragment } from "@/shaders/liquid";
import { Crystal } from "./Crystal";

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

/** Opaque page-gradient drawn in-canvas (so bloom can run without breaking the page). */
function Backdrop() {
  const uniforms = useMemo(
    () => ({ uRes: { value: new THREE.Vector2(1, 1) }, uShadow: { value: 0.8 } }),
    []
  );
  useFrame((s) => {
    uniforms.uRes.value.set(s.size.width, s.size.height);
    uniforms.uShadow.value = heroLayout(s.size.width, s.size.height).shadowX;
  });
  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
        vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy,0.0,1.0); }`}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uShadow;
          void main(){
            // warm gallery paper — matches --paper / --paper-2
            vec3 a = vec3(0.969, 0.965, 0.953);
            vec3 b = vec3(0.929, 0.922, 0.906);
            vec3 col = mix(a, b, clamp(vUv.x * 0.6 + (1.0 - vUv.y) * 0.6, 0.0, 1.0));
            // faint indigo whispers in opposite corners
            col += vec3(0.10, 0.07, 0.28) * 0.05 * smoothstep(0.6, 0.0, distance(vUv, vec2(0.9, 1.02)));
            col += vec3(0.10, 0.07, 0.28) * 0.04 * smoothstep(0.6, 0.0, distance(vUv, vec2(0.05, -0.02)));
            // implied studio floor — the field settles very slightly toward the base
            col *= 1.0 - 0.035 * smoothstep(0.32, 0.0, vUv.y);
            // The monument's weight bleeding into the paper. Its base is cropped
            // by the frame, so contact is atmospheric — a broad soft occlusion
            // pooling at the bottom of its column — not a cast ellipse.
            vec2 sp = vec2(vUv.x - uShadow, (vUv.y + 0.10) * 1.35);
            col *= 1.0 - 0.17 * smoothstep(0.62, 0.0, length(sp));
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
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
    m.uniforms.uDive.value = heroAnim.awaken;
  });

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

function Scene() {
  return (
    <>
      <Backdrop />

      {/* Studio key from high right + a whisper of indigo rim from back-left —
          these carve the dark facets; the env map adds the glassy streaks. */}
      <directionalLight position={[4, 6, 5]} intensity={0.85} color="#ffffff" />
      <directionalLight position={[-5, 2, -4]} intensity={0.5} color="#6a4bff" />

      {/* The client's obsidian crystal, lit by a studio environment of tall
          narrow sources → crisp edge highlights on the facets. */}
      <Suspense fallback={null}>
        <Crystal />
      </Suspense>

      <Environment resolution={256}>
        <Lightformer intensity={3.6} position={[3.5, 2, 5]} scale={[1.1, 11, 1]} color="#ffffff" />
        <Lightformer intensity={2.2} position={[-4.5, 1, 4]} scale={[0.9, 9, 1]} color="#cdd6ff" />
        <Lightformer intensity={1.5} position={[1.5, -5, 3]} scale={[8, 1.5, 1]} color="#ffffff" />
        <Lightformer intensity={1.3} position={[-2, 5.5, -4]} scale={[7, 2.2, 1]} color="#c6cdff" />
        <Lightformer intensity={1.0} position={[5, -1, -3]} scale={[2.2, 6, 1]} color="#6a4bff" />
      </Environment>

      <LiquidText />
    </>
  );
}

export default function HeroCanvas() {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      className="!fixed inset-0"
      style={{ position: "fixed" }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [...CAMERA.position], fov: CAMERA.fov }}
      dpr={dpr}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} />
      <AdaptiveDpr />
      <Scene />
    </Canvas>
  );
}
