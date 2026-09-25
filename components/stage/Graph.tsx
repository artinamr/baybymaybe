"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createRibbonGeometry, createRibbonMaterial } from "@/shaders/ribbon";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { fragTex } from "@/lib/fragTex";
import { getStone } from "@/lib/geo/crystal";
import { fragTarget, pose, prepareFormations, type FormationCtx } from "@/lib/formations";
import {
  buildGraph,
  edgeGrow,
  graph,
  MAX_EDGES,
  MAX_WALKERS,
  MAX_WALKERS_MOBILE,
  spawnWalker,
  stepWalkers,
  walkers,
  walkerScale,
  WALKER_HEAD,
  WALKER_TAIL,
} from "@/lib/graph";
import { pointer, scroll, ui } from "@/lib/stores";

const INK = [10 / 255, 11 / 255, 16 / 255];
const INDIGO = [0x5b / 255, 0x3d / 255, 0xf0 / 255];
const MAX_INST = MAX_EDGES + MAX_WALKERS * 3;

/**
 * ch03 — THE CURRENT. The fragments hang in two clusters; hairlines grow
 * between neighbours; light walks shard to shard, staining each edge indigo as
 * it passes and flashing each fragment's cut faces on arrival. Hovering a node
 * sends a walker from it.
 */
export function Graph() {
  const { camera, size, gl } = useThree();
  const { geometry, attrs } = useMemo(() => createRibbonGeometry(MAX_INST), []);
  const mat = useMemo(() => createRibbonMaterial(), []);
  const mesh = useRef<THREE.Mesh>(null);
  const view = useMemo(() => new THREE.Vector3(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const lastHover = useRef(0);
  const buf = useMemo(() => new THREE.Vector2(), []);

  // Topology from the F3 TARGETS (deterministic), not from wherever the pieces are mid-flight.
  useEffect(() => {
    const stone = getStone();
    prepareFormations(stone.frags, stone.crackOrigin);
    const q = new THREE.Quaternion();
    const ctx: FormationCtx = { stoneQuat: q, gap: 0, focusTier: -1, focusSlide: 0, time: 0, crownLift: 0, bandLift: 0, split: 0 };
    const p = pose();
    const pts = stone.frags.map((f) => {
      fragTarget("F3", f, ctx, p);
      return p.pos.clone();
    });
    buildGraph(pts);
  }, []);

  useFrame((_, rawDt) => {
    const m = mesh.current;
    if (!m) return;
    const G = sceneState.graph;
    m.visible = G.visible && graph.built;
    if (!m.visible) return;
    const dt = Math.min(rawDt, 1 / 20);
    const time = sceneState.time;
    const pos = fragTex.fragPos;
    const reduced = document.documentElement.hasAttribute("data-reduced");

    view.copy(camera.position).sub(sceneState.stone.home).normalize();
    const max = scroll.vw <= 767 ? MAX_WALKERS_MOBILE : MAX_WALKERS;
    stepWalkers(dt, time, pos, G.beat, G.grow >= 1 && G.fade > 0.95 && !reduced, max, view);

    // Hover: nearest node within 28px, throttled.
    if (pointer.has && time - lastHover.current > 0.25 && G.fade > 0.9) {
      lastHover.current = time;
      let best = -1;
      let bestD = 28 * 28;
      for (let i = 0; i < pos.length; i++) {
        v.copy(pos[i]).project(camera);
        const dx = (v.x * 0.5 + 0.5) * size.width - pointer.x;
        const dy = (1 - (v.y * 0.5 + 0.5)) * size.height - pointer.y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best !== ui.hoverNode) {
        ui.hoverNode = best;
        if (best >= 0 && !reduced) spawnWalker(best, 2, time, pos, view, max);
      }
    }

    let n = 0;
    const put = (a: number, b: number, r0: number, r1: number, c: number[], alpha: number, width: number, grad: number) => {
      if (n >= MAX_INST || r1 <= r0) return;
      const A = pos[a];
      const B = pos[b];
      attrs.aA.setXYZ(n, A.x, A.y, A.z);
      attrs.aB.setXYZ(n, B.x, B.y, B.z);
      attrs.aRange.setXY(n, r0, r1);
      attrs.aColor.setXYZW(n, c[0], c[1], c[2], alpha);
      attrs.aWidth.setX(n, width);
      attrs.aGrad.setX(n, grad);
      n++;
    };

    // Edges: ink hairlines that grow from their source, stained indigo by passing light.
    const col = [0, 0, 0];
    for (let e = 0; e < graph.edgeCount; e++) {
      const g = edgeGrow(e, G.grow);
      if (g <= 0) continue;
      let stain = 0;
      for (let s = 0; s < 2; s++) {
        const rate = graph.stainRate[2 * e + s];
        if (rate === 0) continue;
        const t0 = graph.stainT0[2 * e + s];
        const tEnd = t0 + 1 / Math.abs(rate);
        if (time < t0) continue;
        stain = Math.max(stain, time < tEnd ? 1 : Math.exp(-(time - tEnd) / 1.2));
      }
      for (let k = 0; k < 3; k++) col[k] = INK[k] + (INDIGO[k] - INK[k]) * stain;
      put(graph.edgeA[e], graph.edgeB[e], 0, g, col, 0.08 + 0.3 * stain, 1.0, 0);
    }

    // Walkers: a bright head and a fading tail, carried onto the previous edge.
    for (let w = 0; w < MAX_WALKERS; w++) {
      if (!walkers.alive[w]) continue;
      const len = walkers.len[w];
      const sc = walkerScale(w);
      const head = (WALKER_HEAD * sc) / len;
      const tail = (WALKER_TAIL * sc) / len;
      const t = walkers.t[w];
      const hEnd = Math.min(1, t);
      const hStart = Math.max(0, t - head);
      put(walkers.from[w], walkers.to[w], hStart, hEnd, INDIGO, 1, 2.2, 0);
      const tStart = t - head - tail;
      put(walkers.from[w], walkers.to[w], Math.max(0, tStart), Math.min(1, hStart), INDIGO, 0.85, 2.2, 1);
      if (tStart < 0 && walkers.hasPrev[w]) {
        const over = (-tStart * len) / Math.max(1e-3, walkers.prevLen[w]);
        put(walkers.prevFrom[w], walkers.prevTo[w], Math.max(0, 1 - over), 1, INDIGO, 0.85 * Math.min(1, over / Math.max(1e-3, tail)), 2.2, 1);
      }
    }

    geometry.instanceCount = n;
    for (const a of Object.values(attrs)) {
      a.needsUpdate = true;
      a.clearUpdateRanges();
      a.addUpdateRange(0, n * a.itemSize);
    }
    gl.getDrawingBufferSize(buf);
    mat.uniforms.uRes.value.copy(buf);
    mat.uniforms.uDpr.value = gl.getPixelRatio();
    mat.uniforms.uFade.value = G.fade;
  }, PRIORITY.scene);

  return <mesh ref={mesh} geometry={geometry} material={mat} frustumCulled={false} renderOrder={6} />;
}
