"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getStone, stoneHullGeometry } from "@/lib/geo/crystal";
import { createObsidian, syncObsidianUniforms } from "@/shaders/obsidian";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { bus, pointer, ready, ui } from "@/lib/stores";

/**
 * THE STONE — one merged geometry of 24 fragments, three draws:
 *   solid    the opaque pass (discards fragments whose fade is in flight)
 *   fade     the blended pass that draws exactly those (the finale's crown)
 *   mirror   a faint reflection below the floor
 *
 * The meshes keep identity matrices: every fragment's world transform comes
 * from fragTex, written by the Director. The reflection carries only the
 * floor mirror, so three flips its winding for us.
 *
 * Hover is a raycast against an invisible proxy of the intact hull, and only
 * when the pointer has moved — the canvas itself never takes pointer events.
 */
export function Stone() {
  const { camera } = useThree();
  const build = useMemo(() => getStone(), []);
  const mats = useMemo(
    () => ({
      solid: createObsidian({ frag: true }),
      fade: createObsidian({ frag: true, fadePass: true }),
      mirror: createObsidian({ frag: true, reflection: true }),
    }),
    []
  );
  const proxy = useMemo(() => {
    const m = new THREE.Mesh(stoneHullGeometry(), new THREE.MeshBasicMaterial());
    m.matrixAutoUpdate = false;
    return m;
  }, []);
  const mirror = useRef<THREE.Mesh>(null);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const hits = useMemo<THREE.Intersection[]>(() => [], []);
  const lastMove = useRef(0);

  useEffect(() => {
    ready.stone = true;
    return () => {
      ready.stone = false;
    };
  }, []);

  useFrame(() => {
    syncObsidianUniforms();

    const m = mirror.current;
    if (m) {
      // Mirror about y = floorY: y' = 2·floorY − y.
      m.matrix.makeScale(1, -1, 1);
      m.matrix.elements[13] = 2 * sceneState.u.floorY;
      m.matrixWorld.copy(m.matrix);
      m.visible = sceneState.u.reflect > 0.002;
    }

    // Hover only while the stone is whole enough for the proxy to be true.
    const S = sceneState.S;
    const whole = S < 1.6 || S > 11.55;
    if (pointer.has && pointer.lastMove !== lastMove.current) {
      lastMove.current = pointer.lastMove;
      let on = false;
      if (whole && sceneState.stone.visible) {
        proxy.matrixWorld.copy(sceneState.stone.matrix);
        ndc.set(pointer.nx, pointer.ny);
        ray.setFromCamera(ndc, camera);
        hits.length = 0;
        proxy.raycast(ray, hits);
        on = hits.length > 0;
      }
      if (on !== ui.hoverStone) {
        ui.hoverStone = on;
        bus.emit("stone:hover", { on });
        document.documentElement.toggleAttribute("data-stone-hover", on);
      }
    }
  }, PRIORITY.scene);

  return (
    <group>
      <mesh geometry={build.geometry} material={mats.solid} frustumCulled={false} renderOrder={1} />
      <mesh geometry={build.geometry} material={mats.fade} frustumCulled={false} renderOrder={3} />
      <mesh
        ref={mirror}
        geometry={build.geometry}
        material={mats.mirror}
        frustumCulled={false}
        matrixAutoUpdate={false}
        renderOrder={0}
      />
    </group>
  );
}
