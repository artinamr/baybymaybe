"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdaptiveDpr,
  PerformanceMonitor,
  Environment,
  Lightformer,
} from "@react-three/drei";
import { Suspense, useMemo, useState } from "react";
import * as THREE from "three";
import { CAMERA, heroLayout } from "@/lib/heroLayout";
import { Crystal } from "./Crystal";

/** The page field, drawn in-canvas so the object composites onto the same
 *  surface the DOM sits on. Deliberately quiet: warm paper, a whisper of the
 *  shard's own colour, and a soft contact shadow under it. */
function Backdrop() {
  const uniforms = useMemo(
    () => ({ uShadow: { value: new THREE.Vector2(0.8, 0.2) } }),
    []
  );
  useFrame((s) => {
    const L = heroLayout(s.size.width, s.size.height);
    uniforms.uShadow.value.set(L.shadowX, 1 - L.shadowY);
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
          uniform vec2 uShadow;
          void main(){
            // Warm gallery paper. Much flatter than before — the clean direction
            // wants an even field, so this is a hint of tone, not a gradient.
            vec3 a = vec3(0.969, 0.965, 0.953);
            vec3 b = vec3(0.945, 0.940, 0.928);
            vec3 col = mix(a, b, clamp(vUv.x * 0.35 + (1.0 - vUv.y) * 0.35, 0.0, 1.0));

            // The shard is shown whole and floating now, so it needs a contact
            // shadow to sit in the space rather than hover over it. A soft
            // ellipse under its base, wider than it is tall.
            // Wide and soft. The object ends in a sharp point, so a tight dark
            // pool right under it reads as a smudge stuck to the tip rather
            // than as ground shadow.
            vec2 sp = (vUv - vec2(uShadow.x, uShadow.y - 0.02)) * vec2(1.55, 9.5);
            col *= 1.0 - 0.13 * smoothstep(1.0, 0.0, length(sp));

            // Light focused THROUGH the glass and onto the paper — a small
            // caustic sitting inside the shadow. It is what tells the eye the
            // object above it is transparent rather than solid.
            vec2 cp = (vUv - vec2(uShadow.x, uShadow.y + 0.012)) * vec2(3.4, 13.0);
            col += vec3(0.52, 0.46, 1.0) * 0.055 * smoothstep(1.0, 0.0, length(cp));

            // A whisper of the object's colour bleeding onto the paper.
            vec2 hp = (vUv - vec2(uShadow.x, 0.55)) * vec2(1.5, 1.05);
            col += vec3(0.10, 0.07, 0.28) * 0.045 * smoothstep(0.55, 0.0, length(hp));

            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <Backdrop />

      {/* MATTE lighting. A rough surface scatters, so it wants broad soft
          sources that wrap the form and reveal the facet planes by shading.
          (The narrow strips this replaced were tuned for gloss — on a matte
          body they'd do nothing but leave it flat.) */}
      {/* Held DOWN. A matte body has no highlights to carry brightness, so the
          light level alone decides its value — lit like the glossy pass was,
          this dark stone came back as light lavender putty. */}
      <hemisphereLight args={["#ffffff", "#c6c1d6", 0.42]} />
      <directionalLight position={[4, 6, 5]} intensity={0.95} color="#ffffff" />
      <directionalLight position={[-5, 1.5, 2]} intensity={0.34} color="#8b76ff" />
      <directionalLight position={[0, -3, 4]} intensity={0.18} color="#ffffff" />

      <Suspense fallback={null}>
        <Crystal />
      </Suspense>

      <Environment resolution={128}>
        <Lightformer intensity={0.8} position={[3, 3, 4]} scale={[6, 8, 1]} color="#ffffff" />
        <Lightformer intensity={0.5} position={[-4, 1, 3]} scale={[5, 7, 1]} color="#dcd9ea" />
        <Lightformer intensity={0.35} position={[0, -4, 2]} scale={[7, 3, 1]} color="#ffffff" />
      </Environment>
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
