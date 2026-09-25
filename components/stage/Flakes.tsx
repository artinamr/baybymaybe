"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { makeFlake } from "@/lib/geo/shards";
import { getStone } from "@/lib/geo/crystal";
import { createObsidian } from "@/shaders/obsidian";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { fragTex } from "@/lib/fragTex";
import { HOME_B, STONE } from "@/lib/geo/types";
import { easeInOutCubic, easeOutCubic, lerp, mulberry32, range } from "@/lib/ease";
import { perf } from "@/lib/stores";

const COUNT = 48;

type Flake = {
  a: number;
  b: number;
  k: number;
  dir: THREE.Vector3;
  ring: THREE.Vector3;
  node: THREE.Vector3;
  drift: THREE.Vector3;
  size: number;
  axis: THREE.Vector3;
  phase: number;
};

/**
 * The chips shed from the cracks (SPEC §4.6, §5). They are the stone's debris
 * and follow its story: burst from the gaps (ch01–02), settle into a sediment
 * ring round the floors, hang as tiny unlinked nodes in the constellation,
 * drift ahead into the field, and in ch05 fly home into the nearest seating
 * fragment and vanish. Every position is a function of S — scroll back and
 * they un-happen.
 */
export function Flakes() {
  const geo = useMemo(() => makeFlake(11), []);
  const mat = useMemo(() => createObsidian({ instanced: true }), []);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const flakes = useMemo<Flake[]>(() => {
    const stone = getStone();
    const rand = mulberry32(0xf1a4e);
    const frags = stone.frags;
    return Array.from({ length: COUNT }, () => {
      // A pair of neighbouring fragments: the flake comes off their shared crack.
      const a = Math.floor(rand() * frags.length);
      let b = a;
      let best = Infinity;
      for (let j = 0; j < frags.length; j++) {
        if (j === a) continue;
        const d = frags[a].centroid.distanceTo(frags[j].centroid) * (0.7 + 0.6 * rand());
        if (d < best) {
          best = d;
          b = j;
        }
      }
      const th = rand() * Math.PI * 2;
      const r = 1.5 + rand() * 0.8;
      const side = rand() < 0.5 ? -1 : 1;
      return {
        a,
        b,
        k: 0.3 + rand() * 0.4,
        dir: new THREE.Vector3(rand() - 0.5, rand() * 0.6 - 0.2, rand() - 0.5).normalize(),
        ring: new THREE.Vector3(Math.cos(th) * r, STONE.floorY + 0.06 + rand() * 0.08, Math.sin(th) * r * 0.6),
        node: new THREE.Vector3(side * (1.3 + (rand() - 0.5) * 2.6), (rand() - 0.5) * 2.0, (rand() - 0.5) * 1.8),
        drift: new THREE.Vector3((rand() - 0.5) * 3, (rand() - 0.5) * 1.6, HOME_B[2] + (rand() - 0.5) * 3),
        size: 0.03 + rand() * 0.09,
        axis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
        phase: rand() * 6.28,
      };
    });
  }, []);
  const M = useMemo(() => new THREE.Matrix4(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  const t1 = useMemo(() => new THREE.Vector3(), []);
  const t2 = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const F = sceneState.flakes;
    m.visible = F.visible && F.amount > 0.001;
    if (!m.visible) return;
    const S = sceneState.S;
    const home = sceneState.stone.home;
    const lite = perf.tier >= 2;
    const fp = fragTex.fragPos;

    for (let i = 0; i < COUNT; i++) {
      const f = flakes[i];
      if (lite && i % 2) {
        M.makeScale(0, 0, 0);
        m.setMatrixAt(i, M);
        continue;
      }
      // Phase 1 — shed from the crack between fragments a and b.
      t1.copy(fp[f.a]).lerp(fp[f.b], f.k);
      const shed = easeOutCubic(range(S, 1.95, 3.0));
      p.copy(t1).addScaledVector(f.dir, 0.9 * shed);
      // Phase 2 — sediment ring round the floors.
      t2.copy(f.ring).add(home);
      p.lerp(t2, easeInOutCubic(range(S, 3.0, 3.6)));
      // Phase 3 — tiny unlinked nodes in the constellation.
      t2.copy(f.node).add(home);
      p.lerp(t2, easeInOutCubic(range(S, 4.7, 5.6)));
      // Phase 4 — carried ahead into the field.
      p.lerp(f.drift, easeInOutCubic(range(S, 7.2, 8.4)));
      // Phase 5 — home into a seating fragment.
      const home5 = easeInOutCubic(range(S, 10.6, 11.4));
      p.lerp(fp[f.a], home5);

      const tumble = S * 1.7 + f.phase + sceneState.time * 0.15;
      q.setFromAxisAngle(f.axis, tumble);
      const size = f.size * F.amount * (1 - home5) * lerp(0.6, 1, range(S, 1.95, 2.4));
      s.setScalar(Math.max(0, size));
      M.compose(p, q, s);
      m.setMatrixAt(i, M);
    }
    m.instanceMatrix.needsUpdate = true;
  }, PRIORITY.scene);

  return <instancedMesh ref={mesh} args={[geo, mat, COUNT]} frustumCulled={false} visible={false} />;
}
