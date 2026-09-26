"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createBackdropMaterial, createFloodMaterial, createFogCardMaterial, createTerrainMaterial } from "@/shaders/env";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { perf } from "@/lib/stores";

/**
 * THE PLACES the film passes through (lib/choreo.ts `env`):
 *   the plain  pale dunes rising to far hills, melting into the page
 *   the void   banks of fog drifting past as the specimens rise
 *   the flood  the full-screen fog that carries the film between them
 * The studio (hero, the build, the mark) is the mirror floor in Stone.tsx.
 */

const CARDS: { x: number; y: number; z: number; s: number; a: number }[] = [
  { x: -5.5, y: 1.5, z: -6, s: 13, a: 0.55 },
  { x: 4.5, y: -2.5, z: -9, s: 15, a: 0.5 },
  { x: -2.0, y: -4.0, z: 2.5, s: 9, a: 0.32 },
  { x: 6.0, y: 3.5, z: -3, s: 10, a: 0.4 },
  { x: -7.0, y: -1.0, z: -12, s: 18, a: 0.6 },
  { x: 1.5, y: 5.5, z: -14, s: 16, a: 0.5 },
  { x: 3.2, y: -6.0, z: 1.5, s: 8, a: 0.3 },
];

export function Places() {
  const { camera, size } = useThree();
  const terrainGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(240, 240, 220, 220);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const terrainMat = useMemo(() => createTerrainMaterial(), []);
  const cardGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const cardMats = useMemo(() => CARDS.map((_, i) => createFogCardMaterial(1.7 + i * 3.1)), []);
  const floodGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const floodMat = useMemo(() => createFloodMaterial(), []);
  const backMat = useMemo(() => createBackdropMaterial(), []);
  const back = useRef<THREE.Mesh>(null);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const terrain = useRef<THREE.Mesh>(null);
  const cards = useRef<THREE.Group>(null);
  const flood = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const env = sceneState.env;
    const t = sceneState.time;

    const tm = terrain.current;
    if (tm) {
      tm.visible = env.plain > 0.002;
      terrainMat.uniforms.uFade.value = env.plain;
      terrainMat.uniforms.uFloorY.value = sceneState.u.floorY;
    }

    const cg = cards.current;
    if (cg) {
      cg.visible = env.void > 0.002 && perf.tier < 3;
      if (cg.visible) {
        // The banks drift slowly down past the camera as the specimens rise: climbing through cloud.
        cg.children.forEach((child, i) => {
          const c = CARDS[i];
          const m = child as THREE.Mesh;
          const drift = ((((c.y - t * 0.12 * (0.6 + 0.1 * i)) % 16) + 16) % 16) - 8;
          m.position.set(c.x + Math.sin(t * 0.05 + i) * 0.6, drift, c.z);
          m.quaternion.copy(camera.quaternion);
          m.scale.setScalar(c.s);
          const mat = cardMats[i];
          mat.uniforms.uAlpha.value = c.a * env.void;
          mat.uniforms.uTime.value = t;
        });
      }
    }

    const bm = back.current;
    if (bm) {
      bm.visible = env.void > 0.002;
      // Far behind the conveyor, facing the camera, filling the frame.
      bm.position.copy(camera.position).addScaledVector(camera.getWorldDirection(fwd), 34);
      bm.quaternion.copy(camera.quaternion);
      bm.scale.set(90, 56, 1);
      backMat.uniforms.uAlpha.value = env.void;
      backMat.uniforms.uTime.value = t;
    }

    const fm = flood.current;
    if (fm) {
      fm.visible = env.flood > 0.002;
      floodMat.uniforms.uAmount.value = env.flood;
      floodMat.uniforms.uLight.value = env.floodLight;
      floodMat.uniforms.uTime.value = t;
      floodMat.uniforms.uAspect.value = size.width / Math.max(1, size.height);
    }
  }, PRIORITY.scene);

  return (
    <>
      <mesh ref={terrain} geometry={terrainGeo} material={terrainMat} renderOrder={-5} frustumCulled={false} visible={false} />
      <mesh ref={back} geometry={cardGeo} material={backMat} renderOrder={-6} frustumCulled={false} visible={false} />
      <group ref={cards} visible={false}>
        {CARDS.map((_, i) => (
          <mesh key={i} geometry={cardGeo} material={cardMats[i]} renderOrder={8} frustumCulled={false} />
        ))}
      </group>
      <mesh ref={flood} geometry={floodGeo} material={floodMat} renderOrder={1000} frustumCulled={false} visible={false} />
    </>
  );
}
