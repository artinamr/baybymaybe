"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createCloudSeaMaterial, createFlatMaterial, createFloodMaterial, createHazeMaterial, createPuffMaterial } from "@/shaders/env";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { CLOUD_Y, COL_HOME, FLAT_Y } from "@/lib/formations";
import { mulberry32 } from "@/lib/ease";
import { perf } from "@/lib/stores";
import { fragTex } from "@/lib/fragTex";
import { getStone } from "@/lib/geo/crystal";
import { CORE } from "@/lib/geo/types";
import { cloudNoiseTexture, SUN_DIR } from "@/lib/sky";
import { syncTypeMirror, typeMirror } from "@/lib/typeMirror";
import { M0 } from "@/lib/choreo";
import { range } from "@/lib/ease";

/**
 * THE PLACES the home film passes through (lib/choreo.ts `env`). The studio is
 * the mirror floor in Stone.tsx; here:
 *   the sky    a sea of cloud below everything — relief-marched billows lit
 *              by a low sun, the pieces' shadows lying across them — with
 *              cumulus banks standing on the horizon; it rolls in from below
 *              as the stone shatters
 *   the deck   banks of cloud the fall passes through
 *   the flat   a salt flat to a far horizon, where the stone stands colossal;
 *              a ring runs out across it as it lands. (Its sky is the page
 *              itself — #field, keyed to --flat / --horizon by lib/project.ts —
 *              so type set behind the canvas is never veiled.)
 */

export { CLOUD_Y };

type Puff = { x: number; y: number; z: number; s: number; a: number; deck: boolean };

/** Cumulus banks on the horizon and further in; the deck the fall passes through. */
function puffs(): Puff[] {
  const rand = mulberry32(0xc10d);
  const out: Puff[] = [];
  // Great banks standing on the horizon.
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 + rand() * 0.3;
    const r = 120 + rand() * 60;
    const s = 34 + rand() * 30;
    out.push({ x: Math.cos(ang) * r, y: CLOUD_Y + s * 0.16, z: Math.sin(ang) * r, s, a: 0.9, deck: false });
  }
  // Nearer banks, well clear of the sculptures.
  for (let i = 0; i < 8; i++) {
    const ang = rand() * Math.PI * 2;
    const r = 48 + rand() * 36;
    const s = 14 + rand() * 10;
    out.push({ x: Math.cos(ang) * r, y: CLOUD_Y + s * 0.08, z: Math.sin(ang) * r, s, a: 0.85, deck: false });
  }
  // The deck the fall passes through: billows round its line and the camera's.
  for (let i = 0; i < 10; i++) {
    const ang = rand() * Math.PI * 2;
    const r = 3 + rand() * 24;
    out.push({ x: Math.cos(ang) * r, y: CLOUD_Y - 2 - rand() * 10, z: Math.sin(ang) * r, s: 9 + rand() * 12, a: 0.85, deck: true });
  }
  return out;
}

export function Places() {
  const { camera, size, gl } = useThree();
  const buf = useMemo(() => new THREE.Vector2(), []);
  const P = useMemo(puffs, []);
  const noise = useMemo(() => cloudNoiseTexture(), []);
  const seaGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(700, 700, 1, 1);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const seaMat = useMemo(() => createCloudSeaMaterial(noise, SUN_DIR), [noise]);
  const cardGeo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const puffMats = useMemo(() => P.map((_, i) => createPuffMaterial(1.3 + i * 2.7, noise)), [P, noise]);
  const quadGeo = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const hazeMat = useMemo(() => createHazeMaterial(noise), [noise]);
  const floodMat = useMemo(() => createFloodMaterial(), []);
  const flatGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1400, 1400, 1, 1);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const flatMat = useMemo(() => createFlatMaterial(noise), [noise]);
  const frags = useMemo(() => getStone().frags, []);

  const sea = useRef<THREE.Mesh>(null);
  const puffGroup = useRef<THREE.Group>(null);
  const haze = useRef<THREE.Mesh>(null);
  const flood = useRef<THREE.Mesh>(null);
  const flat = useRef<THREE.Mesh>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  const sunV = useMemo(() => new THREE.Vector3(), []);
  const qInv = useMemo(() => new THREE.Quaternion(), []);

  useFrame(() => {
    const env = sceneState.env;
    const t = sceneState.time;

    // THE SKY — the sea rolls in from below as it arrives.
    const sm = sea.current;
    if (sm) {
      sm.visible = env.sky > 0.002;
      // An endless sea: the plane follows the camera, the pattern stays in the world.
      sm.position.set(Math.round(camera.position.x), CLOUD_Y - 16 * (1 - env.sky), Math.round(camera.position.z));
      const U = seaMat.uniforms;
      U.uFade.value = env.sky;
      U.uTime.value = t;
      (U.uProj.value as THREE.Matrix4).copy(camera.projectionMatrix);
      // The hole the falling spiral tears through the deck: as wide as the spiral.
      (U.uHole.value as THREE.Vector4).set(COL_HOME.x, COL_HOME.z, 16 + 10 * env.hole, env.hole);
      // While the tower stands, the billows bank up round its foot.
      const S = sceneState.S;
      const mound = Math.min(1, Math.max(0, (S - 3.85) / 0.15)) * (1 - Math.min(1, Math.max(0, (S - 6.1) / 0.2)));
      (U.uMound.value as THREE.Vector4).set(0, 0, 6.5, mound);
      if (sm.visible) {
        // Every piece standing over the clouds throws its shadow on them.
        const fr = U.uFrag.value as THREE.Vector4[];
        for (let i = 0; i < fr.length; i++) {
          if (i === CORE) {
            fr[i].w = 0;
            continue;
          }
          const p = fragTex.fragPos[i];
          const e = fragTex.fragWorld[i].elements;
          const k = Math.hypot(e[0], e[1], e[2]);
          fr[i].set(p.x, p.y, p.z, frags[i].radius * k * 0.62);
        }
      }
    }
    const pg = puffGroup.current;
    if (pg) {
      const amount = Math.max(env.sky, env.inCloud);
      pg.visible = amount > 0.002 && perf.tier < 3;
      if (pg.visible) {
        qInv.copy(camera.quaternion).invert();
        sunV.copy(SUN_DIR).applyQuaternion(qInv);
        pg.children.forEach((child, i) => {
          const p = P[i];
          const m = child as THREE.Mesh;
          m.position.set(p.x + Math.sin(t * 0.03 + i) * 0.5, p.y - 16 * (1 - env.sky), p.z);
          m.quaternion.copy(camera.quaternion);
          m.scale.set(p.s * 1.6, p.s, 1);
          const mat = puffMats[i];
          // The deck shows only while the fall passes through it.
          const k = p.deck ? env.inCloud * 1.25 : env.sky;
          mat.uniforms.uAlpha.value = p.a * Math.min(1, k);
          mat.uniforms.uTime.value = t;
          mat.uniforms.uSunV.value.copy(sunV);
          // Soften a billow as the lens reaches it, so it is never a flat card —
          // and skip it once it is all round the lens (it would only fill the frame).
          const d = v.copy(m.position).sub(camera.position).length();
          mat.uniforms.uNear.value = THREE.MathUtils.smoothstep(d, 3, 9);
          m.visible = k > 0.002 && d > 3;
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
      // The flat shows through the torn deck before the camera is through it.
      const flatK = Math.max(env.flat, env.hole);
      fm.visible = flatK > 0.002;
      fm.position.set(Math.round(camera.position.x), FLAT_Y, Math.round(camera.position.z));
      flatMat.uniforms.uFade.value = flatK;
      flatMat.uniforms.uTime.value = t;
      // The finale's word, reflected: its mask, and where the horizon lies.
      const FU = flatMat.uniforms;
      const S = sceneState.S;
      const typeK = S > M0 - 0.1 ? range(S, M0, M0 + 0.25) : 0;
      if (typeK > 0 && size.width >= 768) {
        syncTypeMirror();
        if (typeMirror.texture) {
          FU.uType.value = typeMirror.texture;
          (FU.uTypeDim.value as THREE.Vector3).set(typeMirror.w, typeMirror.h, typeMirror.base);
          gl.getDrawingBufferSize(buf);
          (FU.uScreen.value as THREE.Vector4).set(buf.x, buf.y, size.width, size.height);
          const hz = parseFloat(document.documentElement.style.getPropertyValue("--horizon"));
          FU.uHorizon.value = Number.isFinite(hz) ? hz : size.height * 0.5;
        }
        FU.uTypeK.value = typeMirror.texture ? typeK : 0;
      } else FU.uTypeK.value = 0;
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
      {/* After the glass (renderOrder 1/3): depth-tested at the relief's own depth. */}
      <mesh ref={sea} geometry={seaGeo} material={seaMat} renderOrder={6} frustumCulled={false} visible={false} />
      <group ref={puffGroup} visible={false}>
        {P.map((_, i) => (
          <mesh key={i} geometry={cardGeo} material={puffMats[i]} renderOrder={7} />
        ))}
      </group>
      <mesh ref={haze} geometry={quadGeo} material={hazeMat} renderOrder={1000} frustumCulled={false} visible={false} />
      <mesh ref={flood} geometry={quadGeo} material={floodMat} renderOrder={1001} frustumCulled={false} visible={false} />
    </>
  );
}
