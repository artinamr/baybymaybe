"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createCloudSeaMaterial, createFlatMaterial, createFloodMaterial, createHazeMaterial, createPuffMaterial } from "@/shaders/env";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { COL_HOME, FLAT_Y } from "@/lib/formations";
import { mulberry32 } from "@/lib/ease";
import { perf } from "@/lib/stores";

/**
 * THE PLACES the home film passes through (lib/choreo.ts `env`). The studio is
 * the mirror floor in Stone.tsx; here:
 *   the sky    an endless sea of cloud below the sculptures — billowing, lit
 *              low from the side — with banks of cloud round them for depth
 *              and great cumulus banks standing on the horizon; the sea rolls
 *              in from below as the stone shatters
 *   the flat   a salt flat to a far horizon, where the stone stands colossal;
 *              a ring runs out across it as it closes. (Its sky is the page
 *              itself — #field, keyed to --flat / --horizon by lib/project.ts —
 *              so type set behind the canvas is never veiled.)
 *   the flood  light pouring out of the core over the whole frame — the cut
 *              between the two happens inside it
 */

export const CLOUD_Y = -7;

type Puff = { x: number; y: number; z: number; s: number; a: number };

/** Banks of cloud: a ring round the sculptures, and great banks on the horizon. */
function puffs(): Puff[] {
  const rand = mulberry32(0xc10d);
  const out: Puff[] = [];
  for (let i = 0; i < 18; i++) {
    const ang = rand() * Math.PI * 2;
    const r = 10 + rand() * 30;
    out.push({ x: Math.cos(ang) * r, y: CLOUD_Y + 0.8 + rand() * 2.6, z: Math.sin(ang) * r, s: 9 + rand() * 12, a: 0.72 + rand() * 0.26 });
  }
  for (let i = 0; i < 14; i++) {
    const ang = (i / 14) * Math.PI * 2 + rand() * 0.3;
    const r = 95 + rand() * 60;
    const s = 34 + rand() * 30;
    out.push({ x: Math.cos(ang) * r, y: CLOUD_Y + s * 0.28, z: Math.sin(ang) * r, s, a: 0.78 + rand() * 0.2 });
  }
  // The deck the stone falls through: billows round its line and the camera's.
  for (let i = 0; i < 16; i++) {
    const ang = rand() * Math.PI * 2;
    const r = 2 + rand() * 22;
    out.push({ x: Math.cos(ang) * r, y: CLOUD_Y - 1 - rand() * 9, z: Math.sin(ang) * r, s: 8 + rand() * 12, a: 0.8 });
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
  const floodMat = useMemo(() => createFloodMaterial(), []);
  const flatGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1400, 1400, 1, 1);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const flatMat = useMemo(() => createFlatMaterial(), []);

  const sea = useRef<THREE.Mesh>(null);
  const puffGroup = useRef<THREE.Group>(null);
  const haze = useRef<THREE.Mesh>(null);
  const flood = useRef<THREE.Mesh>(null);
  const flat = useRef<THREE.Mesh>(null);
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const env = sceneState.env;
    const t = sceneState.time;

    // THE SKY — the sea rolls in from below as it arrives.
    const sm = sea.current;
    if (sm) {
      sm.visible = env.sky > 0.002;
      // An endless sea: the plane follows the camera, the pattern stays in the world.
      sm.position.set(Math.round(camera.position.x), CLOUD_Y - 16 * (1 - env.sky), Math.round(camera.position.z));
      seaMat.uniforms.uFade.value = env.sky;
      seaMat.uniforms.uTime.value = t;
    }
    const pg = puffGroup.current;
    if (pg) {
      const amount = Math.max(env.sky, env.inCloud * 1.2);
      pg.visible = amount > 0.002 && perf.tier < 3;
      if (pg.visible) {
        pg.children.forEach((child, i) => {
          const p = P[i];
          const m = child as THREE.Mesh;
          m.position.set(p.x + Math.sin(t * 0.03 + i) * 0.5, p.y - 16 * (1 - env.sky), p.z);
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

    // INSIDE A CLOUD BANK
    const hm = haze.current;
    if (hm) {
      hm.visible = env.inCloud > 0.002;
      hazeMat.uniforms.uAmount.value = env.inCloud;
      hazeMat.uniforms.uTime.value = t;
      hazeMat.uniforms.uAspect.value = size.width / Math.max(1, size.height);
    }

    // THE SALT FLAT
    const fm = flat.current;
    if (fm) {
      fm.visible = env.flat > 0.002;
      fm.position.set(Math.round(camera.position.x), FLAT_Y, Math.round(camera.position.z));
      flatMat.uniforms.uFade.value = env.flat;
      flatMat.uniforms.uRipple.value = env.ripple;
      flatMat.uniforms.uRippleC.value.set(COL_HOME.x, COL_HOME.z);
      // The stone's shadow on the flat as it falls and stands.
      const home = sceneState.stone.home;
      const K = sceneState.stone.scale;
      const h = Math.max(0, home.y - 1.94 * K - FLAT_Y);
      flatMat.uniforms.uShadow.value.set(home.x, home.z, K * (0.75 + 0.035 * h));
      flatMat.uniforms.uShadowA.value = env.flat * 0.32 * Math.exp(-h / 30);
    }
    // THE FLOOD
    const fl = flood.current;
    if (fl) {
      fl.visible = env.flood > 0.002;
      floodMat.uniforms.uFlood.value = env.flood;
      floodMat.uniforms.uC.value.set(env.floodX, 1 - env.floodY);
      floodMat.uniforms.uAspect.value = size.width / Math.max(1, size.height);
    }
  }, PRIORITY.scene);

  return (
    <>
      <mesh ref={flat} geometry={flatGeo} material={flatMat} renderOrder={-20} frustumCulled={false} visible={false} />
      <mesh ref={sea} geometry={seaGeo} material={seaMat} renderOrder={-6} frustumCulled={false} visible={false} />
      <group ref={puffGroup} visible={false}>
        {P.map((_, i) => (
          <mesh key={i} geometry={cardGeo} material={puffMats[i]} renderOrder={4} />
        ))}
      </group>
      <mesh ref={haze} geometry={quadGeo} material={hazeMat} renderOrder={1000} frustumCulled={false} visible={false} />
      <mesh ref={flood} geometry={quadGeo} material={floodMat} renderOrder={1001} frustumCulled={false} visible={false} />
    </>
  );
}
