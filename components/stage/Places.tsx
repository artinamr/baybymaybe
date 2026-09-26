"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createCloudSeaMaterial, createHazeMaterial, createPuffMaterial, createTerrainMaterial, createWaterMaterial } from "@/shaders/env";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { LAKE_HOME } from "@/lib/formations";
import { STONE } from "@/lib/geo/types";
import { mulberry32 } from "@/lib/ease";
import { perf } from "@/lib/stores";

/**
 * THE PLACES the home film passes through (lib/choreo.ts `env`). The studio is
 * the mirror floor in Stone.tsx; here:
 *   the sky    an endless sea of cloud below the re-formed stone, the monument
 *              and the flow — billowing, lit low from the side — with puffs of
 *              cloud near the camera for volume
 *   the cloud  the camera sinks THROUGH the puffs; inside, the frame is haze
 *   the lake   below the cloud: still water to far hazy hills, reflected
 */

export const CLOUD_Y = -7;
const LAKE_FLOOR = LAKE_HOME.y + STONE.floorY;

type Puff = { x: number; y: number; z: number; s: number; a: number };

/** Billows: a ring round the sculptures, and a column the camera falls through. */
function puffs(): Puff[] {
  const rand = mulberry32(0xc10d);
  const out: Puff[] = [];
  for (let i = 0; i < 18; i++) {
    const ang = rand() * Math.PI * 2;
    const r = 9 + rand() * 26;
    out.push({ x: Math.cos(ang) * r, y: CLOUD_Y + 0.6 + rand() * 1.8, z: Math.sin(ang) * r, s: 9 + rand() * 11, a: 0.75 + rand() * 0.25 });
  }
  for (let i = 0; i < 12; i++) {
    const ang = rand() * Math.PI * 2;
    const r = 0.8 + rand() * 5;
    out.push({ x: Math.cos(ang) * r, y: CLOUD_Y - 0.5 - rand() * 5.5, z: Math.sin(ang) * r, s: 5 + rand() * 6, a: 0.85 });
  }
  return out;
}

export function Places() {
  const { camera, size } = useThree();
  const P = useMemo(puffs, []);
  const seaGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(700, 700, 1, 1);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const seaMat = useMemo(() => createCloudSeaMaterial(), []);
  const cardGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const puffMats = useMemo(() => P.map((_, i) => createPuffMaterial(1.3 + i * 2.7)), [P]);
  const quadGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const hazeMat = useMemo(() => createHazeMaterial(), []);
  const hillGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(460, 460, 230, 230);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const hillMat = useMemo(() => createTerrainMaterial(), []);
  const hillMirrorMat = useMemo(() => createTerrainMaterial(true), []);
  const waterGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(600, 600, 1, 1);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const waterMat = useMemo(() => createWaterMaterial(), []);
  const water = useRef<THREE.Mesh>(null);

  const sea = useRef<THREE.Mesh>(null);
  const puffGroup = useRef<THREE.Group>(null);
  const haze = useRef<THREE.Mesh>(null);
  const hills = useRef<THREE.Group>(null);
  const hillsMirror = useRef<THREE.Mesh>(null);
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const env = sceneState.env;
    const t = sceneState.time;

    // THE SKY
    const sm = sea.current;
    if (sm) {
      sm.visible = env.sky > 0.002;
      // An endless sea: the plane follows the camera, the pattern stays in the world.
      sm.position.set(Math.round(camera.position.x), CLOUD_Y, Math.round(camera.position.z));
      seaMat.uniforms.uFade.value = env.sky;
      seaMat.uniforms.uTime.value = t;
    }
    const pg = puffGroup.current;
    if (pg) {
      const amount = Math.max(env.sky, env.inCloud);
      pg.visible = amount > 0.002 && perf.tier < 3;
      if (pg.visible) {
        pg.children.forEach((child, i) => {
          const p = P[i];
          const m = child as THREE.Mesh;
          m.position.set(p.x + Math.sin(t * 0.03 + i) * 0.5, p.y, p.z);
          m.quaternion.copy(camera.quaternion);
          m.scale.set(p.s * 1.5, p.s, 1);
          const mat = puffMats[i];
          mat.uniforms.uAlpha.value = p.a * amount;
          mat.uniforms.uTime.value = t;
          // Soften a billow as the lens reaches it, so it is never a flat card.
          const d = v.copy(m.position).sub(camera.position).length();
          mat.uniforms.uNear.value = THREE.MathUtils.smoothstep(d, 1.2, 4.5);
        });
      }
    }

    // INSIDE THE CLOUD
    const hm = haze.current;
    if (hm) {
      hm.visible = env.inCloud > 0.002;
      hazeMat.uniforms.uAmount.value = env.inCloud;
      hazeMat.uniforms.uTime.value = t;
      hazeMat.uniforms.uAspect.value = size.width / Math.max(1, size.height);
    }

    // THE LAKE
    const hg = hills.current;
    if (hg) {
      hg.visible = env.lake > 0.002;
      for (const mat of [hillMat, hillMirrorMat]) {
        mat.uniforms.uFade.value = env.lake;
        mat.uniforms.uFloorY.value = LAKE_FLOOR;
      }
      waterMat.uniforms.uFade.value = env.lake;
      waterMat.uniforms.uTime.value = t;
      const wm = water.current;
      if (wm) wm.position.set(camera.position.x, LAKE_FLOOR - 0.01, camera.position.z);
      const mm = hillsMirror.current;
      if (mm) {
        // Mirror about the water: y' = 2·floor − y.
        mm.matrix.makeScale(1, -1, 1);
        mm.matrix.elements[13] = 2 * LAKE_FLOOR;
        mm.matrixWorld.copy(mm.matrix);
      }
    }
  }, PRIORITY.scene);

  return (
    <>
      <mesh ref={sea} geometry={seaGeo} material={seaMat} renderOrder={-6} frustumCulled={false} visible={false} />
      <group ref={puffGroup} visible={false}>
        {P.map((_, i) => (
          <mesh key={i} geometry={cardGeo} material={puffMats[i]} renderOrder={4} />
        ))}
      </group>
      <group ref={hills} visible={false}>
        <mesh geometry={hillGeo} material={hillMat} renderOrder={-5} frustumCulled={false} />
        <mesh ref={hillsMirror} geometry={hillGeo} material={hillMirrorMat} renderOrder={-7} frustumCulled={false} matrixAutoUpdate={false} />
        <mesh ref={water} geometry={waterGeo} material={waterMat} renderOrder={-6} frustumCulled={false} />
      </group>
      <mesh ref={haze} geometry={quadGeo} material={hazeMat} renderOrder={1000} frustumCulled={false} visible={false} />
    </>
  );
}
