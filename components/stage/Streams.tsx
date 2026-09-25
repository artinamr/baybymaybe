"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createStreamsGeometry, createStreamsMaterial } from "@/shaders/streams";
import { ORBIT_P, ORBIT_R, ORBIT_W, RING_R, TIER_Y } from "@/lib/formations";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { perf, pointer } from "@/lib/stores";

/**
 * The light that runs through the ch02 tower and the ch03 armillary. All the
 * motion is in the shader; this only feeds it the sculpture's live phases,
 * tilt, the morph and the cursor once a frame.
 */
export function Streams() {
  const { gl, size } = useThree();
  const geo = useMemo(() => createStreamsGeometry(), []);
  const mat = useMemo(
    () => createStreamsMaterial(ORBIT_P, ORBIT_W, ORBIT_R, RING_R, [0, 1, 2, 3].map(TIER_Y)),
    []
  );
  const pts = useRef<THREE.Points>(null);
  const beat = useMemo(() => new THREE.Vector2(1, 1), []);
  const m4 = useMemo(() => new THREE.Matrix4(), []);

  useFrame((_, dt) => {
    const p = pts.current;
    if (!p) return;
    const fade = sceneState.streams.fade;
    p.visible = fade > 0.002;
    if (!p.visible) return;
    const u = mat.uniforms;
    const sc = sceneState.sculpt;
    u.uTime.value = sceneState.time;
    for (let i = 0; i < 4; i++) (u.uRingPhase.value as number[])[i] = sc.ringPhase[i];
    for (let i = 0; i < 3; i++) (u.uOrbitPhase.value as number[])[i] = sc.orbitPhase[i];
    (u.uTilt.value as THREE.Matrix3).setFromMatrix4(m4.makeRotationFromQuaternion(sc.tilt));
    (u.uCenter.value as THREE.Vector3).copy(sceneState.stone.home).setY(0);
    u.uMorph.value = sceneState.streams.morph;
    u.uFade.value = fade * (perf.tier >= 3 ? 0.6 : 1);
    (u.uPointer.value as THREE.Vector2).set(pointer.nx, pointer.ny);
    u.uPointerOn.value = pointer.has ? 1 : 0;
    u.uAspect.value = size.width / Math.max(1, size.height);
    u.uDpr.value = gl.getPixelRatio();
    // The active beat's orbit carries the light; the other dims.
    const b = sceneState.graph.beat;
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 3);
    beat.x += ((b === 2 ? 0.35 : 1) - beat.x) * k;
    beat.y += ((b === 1 ? 0.35 : 1) - beat.y) * k;
    (u.uBeat.value as THREE.Vector2).copy(beat);
  }, PRIORITY.scene);

  return <points ref={pts} geometry={geo} material={mat} frustumCulled={false} renderOrder={4} visible={false} />;
}
