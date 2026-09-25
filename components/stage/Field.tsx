"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { FIELD_VARIANTS } from "@/lib/geo/shards";
import { createObsidian } from "@/shaders/obsidian";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { measured, perf, scroll, ui } from "@/lib/stores";
import { easeOutExpo, mulberry32, smoothstep } from "@/lib/ease";

type Stone = {
  variant: number;
  x: number;
  z: number;
  /** Visible height above the floor. */
  h: number;
  scale: number;
  bury: number;
  quat: THREE.Quaternion;
  station: number; // −1 or 0..3
};

const STATIONS: [number, number][] = [
  [2.4, -14],
  [3.0, -22],
  [2.4, -30],
  [3.0, -38],
];

/** Poisson placement, deterministic. */
function layoutField(): Stone[] {
  const rand = mulberry32(0x5b3df0 ^ 0xf1e1d);
  const stones: Stone[] = [];
  const taken: [number, number][] = STATIONS.map((s) => [s[0], s[1]]);
  const minD = 1.25;
  STATIONS.forEach(([x, z], i) => stones.push(make(0, x, z, 4.2, i, rand)));
  for (let v = 0; v < FIELD_VARIANTS.length; v++) {
    const need = FIELD_VARIANTS[v].count - (v === 0 ? STATIONS.length : 0);
    let placed = 0;
    let guard = 0;
    while (placed < need && guard++ < 6000) {
      // Right of the aisle only: the work list reads down the left of the
      // frame, and a black stone behind ink type makes it disappear.
      const x = 1.8 + rand() * 10.2;
      const z = -8 - rand() * 34;
      if (Math.hypot(x, z + 52) < 8) continue;
      if (taken.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < minD)) continue;
      taken.push([x, z]);
      // Log-normal heights, taller toward the aisle so the corridor has walls.
      const aisle = 1 - Math.min(1, (x - 1.8) / 10.2);
      const h = Math.min(5, Math.max(0.8, Math.exp(Math.log(1.7) + 0.45 * gauss(rand)) * (0.8 + 0.6 * aisle)));
      stones.push(make(v, x, z, h, -1, rand));
      placed++;
    }
  }
  return stones;
}

function gauss(rand: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-6, rand()))) * Math.cos(2 * Math.PI * rand());
}

function make(variant: number, x: number, z: number, h: number, station: number, rand: () => number): Stone {
  const V = FIELD_VARIANTS[variant];
  const bury = 0.15 + rand() * 0.2;
  const crown = V.height - V.pavilion;
  const scale = h / ((1 - bury) * V.pavilion + crown);
  const tilt = ((station >= 0 ? 4 : 14) * Math.PI * rand()) / 180;
  const ta = rand() * Math.PI * 2;
  const quat = new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(Math.cos(ta), 0, Math.sin(ta)), tilt)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand() * Math.PI * 2));
  return { variant, x, z, h, scale, bury, quat, station };
}

/**
 * ch04 — THE FIELD. Seventy-two standing stones rise out of a still mirror as
 * the camera walks the aisle, four of them "stations" beside the work rows.
 * Each variant is one InstancedMesh plus a mirrored copy for its reflection.
 */
export function Field() {
  const { camera } = useThree();
  const data = useMemo(() => {
    const stones = layoutField();
    return FIELD_VARIANTS.map((V, vi) => {
      const list = stones.filter((s) => s.variant === vi);
      const geo = V.geometry();
      const fx = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 2), 2);
      fx.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute("aInstFx", fx);
      return {
        V,
        list,
        geo,
        fx,
        solid: createObsidian({ instanced: true, clip: "above-floor" }),
        mirror: createObsidian({ instanced: true, reflection: true, clip: "below-floor" }),
      };
    });
  }, []);
  const group = useRef<THREE.Group>(null);
  const solids = useRef<(THREE.InstancedMesh | null)[]>([]);
  const mirrors = useRef<(THREE.InstancedMesh | null)[]>([]);
  const M = useMemo(() => new THREE.Matrix4(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  const glint = useMemo(() => new Float32Array(4), []);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.visible = sceneState.field.visible;
    if (!g.visible) return;
    const camZ = camera.position.z;
    const floor = sceneState.u.floorY;
    const fade = 1 - sceneState.field.fade;
    const lite = perf.tier >= 3;

    // Which station is "active": hovered row first, else the row nearest the viewport centre.
    let active = ui.focusRow;
    if (active < 0) {
      let bd = 0.35;
      measured.rowS.forEach((r, i) => {
        const d = Math.abs(scroll.S - r);
        if (d < bd) {
          bd = d;
          active = i;
        }
      });
    }
    for (let i = 0; i < 4; i++) glint[i] += ((i === active ? 1 : 0) - glint[i]) * Math.min(1, dt * 5);

    data.forEach((d, vi) => {
      const mesh = solids.current[vi];
      const refl = mirrors.current[vi];
      if (!mesh || !refl) return;
      d.list.forEach((st, i) => {
        if (lite && st.station < 0 && i % 2 === 1) {
          M.makeScale(0, 0, 0);
        } else {
          const rise = easeOutExpo(smoothstep(16, 7, camZ - st.z));
          const y = floor + (1 - st.bury) * d.V.pavilion * st.scale - (st.h + 0.3) * (1 - rise);
          p.set(st.x, y, st.z);
          s.setScalar(st.scale);
          M.compose(p, st.quat, s);
        }
        mesh.setMatrixAt(i, M);
        refl.setMatrixAt(i, M);
        d.fx.setXY(i, st.station >= 0 ? glint[st.station] : 0, fade);
      });
      mesh.instanceMatrix.needsUpdate = true;
      refl.instanceMatrix.needsUpdate = true;
      d.fx.needsUpdate = true;
      // Reflection: mirror about the floor, carried by the mesh (three flips winding).
      refl.matrix.makeScale(1, -1, 1);
      refl.matrix.elements[13] = 2 * floor;
      refl.matrixWorld.copy(refl.matrix);
      refl.visible = !lite;
    });
  }, PRIORITY.scene);

  return (
    <group ref={group} visible={false}>
      {data.map((d, vi) => (
        <group key={d.V.key}>
          <instancedMesh
            ref={(el) => {
              solids.current[vi] = el;
            }}
            args={[d.geo, d.solid, d.list.length]}
            frustumCulled={false}
          />
          <instancedMesh
            ref={(el) => {
              mirrors.current[vi] = el;
            }}
            args={[d.geo, d.mirror, d.list.length]}
            frustumCulled={false}
            matrixAutoUpdate={false}
            renderOrder={-1}
          />
        </group>
      ))}
    </group>
  );
}
