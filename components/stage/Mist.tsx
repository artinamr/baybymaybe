"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createHazeGeometry, createHazeMaterial, hazeShared } from "@/shaders/haze";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { perf } from "@/lib/stores";

/**
 * Ground mist: two paper-coloured billboards hugging the floor in front of and
 * behind the stone (SPEC §4.6). Hard-cut in screen space below POTENTIAL's
 * baseline, so no translucent canvas pixel ever lies over indigo type.
 */
export function Mist() {
  const { gl } = useThree();
  const geo = useMemo(() => createHazeGeometry(), []);
  const front = useMemo(() => createHazeMaterial({ maxAlpha: 0.1, seed: 1.7 }), []);
  const back = useMemo(() => createHazeMaterial({ maxAlpha: 0.14, seed: 7.3 }), []);
  const g = useRef<THREE.Group>(null);
  const buf = useMemo(() => new THREE.Vector2(), []);

  useFrame(() => {
    const grp = g.current;
    if (!grp) return;
    const a = sceneState.u.mistAlpha * (perf.tier >= 3 ? 0 : 1);
    grp.visible = a > 0.01;
    if (!grp.visible) return;
    const home = sceneState.stone.home;
    grp.position.set(home.x, sceneState.u.floorY, home.z);
    grp.rotation.set(0, sceneState.cam.az, 0);
    front.uniforms.uAlpha.value = 0.1 * a;
    back.uniforms.uAlpha.value = 0.14 * a;
    hazeShared.uClipY.value = sceneState.u.mistClipY;
    gl.getDrawingBufferSize(buf);
    hazeShared.uBufH.value = buf.y;
    if (!sceneState.frozen) hazeShared.uTime.value = sceneState.time;
  }, PRIORITY.scene);

  return (
    <group ref={g}>
      <mesh geometry={geo} material={front} position={[0, 0, 0.9]} renderOrder={5} frustumCulled={false} />
      <mesh geometry={geo} material={back} position={[0, 0, -0.9]} renderOrder={-1} frustumCulled={false} />
    </group>
  );
}
