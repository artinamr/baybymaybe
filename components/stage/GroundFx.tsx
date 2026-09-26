"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createGroundGeometry, createGroundMaterial } from "@/shaders/ground";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { fragTex } from "@/lib/fragTex";

/**
 * The stone's contact with the page: an ink pool under the culet, a broad soft
 * occlusion, and an indigo spill while the cut faces glow (SPEC §4.6). The quad
 * turns with the camera so the shadow always reads wide and shallow.
 */
export function GroundFx() {
  const geo = useMemo(() => createGroundGeometry(), []);
  const mat = useMemo(() => createGroundMaterial(), []);
  const mesh = useRef<THREE.Mesh>(null);
  const culet = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const home = sceneState.stone.home;
    // Lowest fragment tells us where the point actually is (the stone moves).
    let lowest = Infinity;
    for (let i = 0; i < fragTex.count; i++) {
      const p = fragTex.fragPos[i];
      if (p.y < lowest) {
        lowest = p.y;
        culet.copy(p);
      }
    }
    // Grounded = the stone is whole-ish and near the floor.
    const floor = sceneState.u.floorY;
    const K = sceneState.stone.scale;
    const near = 1 - THREE.MathUtils.smoothstep((lowest - floor) / K, 0.8, 2.2);
    // Only on a floor: the studio's mirror, the salt flat.
    const shadow = near * (sceneState.stone.visible ? 1 : 0) * Math.min(1, Math.max(sceneState.env.mirror, sceneState.env.flat));
    mat.uniforms.uShadow.value = shadow;
    mat.uniforms.uSpill.value = sceneState.u.spill;
    m.visible = shadow > 0.01 || sceneState.u.spill > 0.01;
    m.position.set(home.x, floor + 0.002 * K, home.z);
    m.scale.setScalar(K);
    m.rotation.set(0, sceneState.cam.az, 0);
    mat.uniforms.uCoreOff.value.set(0, 0);
  }, PRIORITY.scene);

  return <mesh ref={mesh} geometry={geo} material={mat} renderOrder={-2} frustumCulled={false} />;
}
