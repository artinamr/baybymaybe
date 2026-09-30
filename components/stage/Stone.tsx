"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getStone, stoneHullGeometry } from "@/lib/geo/crystal";
import { createObsidian, obsidianUniforms, syncObsidianUniforms } from "@/shaders/obsidian";
import { dev, perfFlags } from "@/lib/dev";
import { compileFor } from "./compile";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { M0 } from "@/lib/choreo";
import { openStory, story } from "@/lib/story";

let clickBound = false;
import { bus, pointer, ready, ui } from "@/lib/stores";

/**
 * THE STONE — one merged geometry of its eight pieces, three draws:
 *   solid    the opaque pass
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
  const { camera, gl, scene } = useThree();
  const build = useMemo(() => getStone(), []);
  const mats = useMemo(() => {
    // The reflection is drawn twice: depth first, then colour only where it is
    // the nearest surface — so it reads as a reflected stone, not an x-ray of
    // every inner face blended together.
    const mirrorDepth = createObsidian({ frag: true, reflection: true, depthOnly: true });
    mirrorDepth.colorWrite = false;
    mirrorDepth.depthWrite = true;
    // The stone is drawn the same way: DEPTH FIRST (a cheap pass), then the
    // glass only where it is the nearest surface. Forty shards and a core in
    // one mesh put many hidden faces behind every pixel, and the glass's
    // shader (it can discard) would otherwise run in full for each of them.
    // The picture is the same: the same nearest surface, shaded once.
    const solidDepth = createObsidian({ frag: true, depthOnly: true });
    solidDepth.colorWrite = false;
    solidDepth.depthWrite = true;
    const solid = createObsidian({ frag: true });
    const lite = createObsidian({ frag: true, lite: true });
    solid.depthWrite = false;
    lite.depthWrite = false;
    return {
      solid,
      lite,
      solidDepth,
      // (The lite glass's own program: a reflection needs no veins or light inside.)
      mirror: createObsidian({ frag: true, reflection: true, lite: true }),
      mirrorDepth,
    };
  }, []);
  const solid = useRef<THREE.Mesh>(null);
  const solidDepth = useRef<THREE.Mesh>(null);
  const wake = useRef({ t0: -1 });

  // THE FULL GLASS. The stone first wears the lite glass: its program is
  // quick (the mirror shares it) and the page starts on it (StageCanvas). The
  // full glass compiles alongside — off the main thread, in parallel (ANGLE
  // compiles programs side by side), probed on a detached mesh against this
  // scene's lights and room — and is swapped in the moment it is ready, its
  // light fading up. Once the page is up, the whole scene again, the stone in
  // its full glass, for the lens's target (three keys every program on its
  // output); until those are ready the lens stays shut.
  useEffect(() => {
    let dead = false;
    const html = document.documentElement;
    const probe = new THREE.Mesh(build.geometry, mats.solid);
    probe.frustumCulled = false;
    const key = new THREE.WebGLRenderTarget(1, 1);
    const glass = () => {
      if (dead) return;
      if (!ready.compiling) {
        setTimeout(glass, 50);
        return;
      }
      if (dev.freeze) {
        // (Look-dev stills: the full glass from the first frame.)
        ready.full = true;
        html.dataset.glass = "full";
        return;
      }
      compileFor(gl, probe, camera, scene).then(() => {
        if (dead || !solid.current) return;
        solid.current.material = mats.solid;
        wake.current.t0 = performance.now();
        ready.full = true;
        performance.mark("nd:full");
        // (Load tests watch for it.)
        html.dataset.glass = "full";
      });
    };
    const lens = () => {
      if (dead) return;
      const mesh = solid.current;
      if (!ready.compiled || !mesh) {
        setTimeout(lens, 50);
        return;
      }
      const was = mesh.material;
      mesh.material = mats.solid;
      const done = compileFor(gl, scene, camera, scene, key);
      mesh.material = was;
      done.then(() => {
        if (dead) return;
        ready.lens = true;
        performance.mark("nd:lens");
        html.dataset.lens = "1";
      });
    };
    glass();
    lens();
    return () => {
      dead = true;
      key.dispose();
    };
  }, [gl, camera, scene, build, mats]);
  const proxy = useMemo(() => {
    const m = new THREE.Mesh(stoneHullGeometry(), new THREE.MeshBasicMaterial());
    m.matrixAutoUpdate = false;
    return m;
  }, []);
  const mirror = useRef<THREE.Mesh>(null);
  const mirrorDepth = useRef<THREE.Mesh>(null);
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
    // The full glass's light fades up after the swap (instant when frozen).
    const w = dev.freeze ? 1 : wake.current.t0 < 0 ? 0 : Math.min(1, (performance.now() - wake.current.t0) / 1400);
    obsidianUniforms.uFullIn.value = w * w * (3 - 2 * w);

    for (const m of [mirror.current, mirrorDepth.current]) {
      if (!m) continue;
      // Mirror about y = floorY: y' = 2·floorY − y.
      m.matrix.makeScale(1, -1, 1);
      m.matrix.elements[13] = 2 * sceneState.u.floorY;
      m.matrixWorld.copy(m.matrix);
      m.visible = sceneState.u.reflect > 0.002 && !perfFlags.nomirror;
    }
    if (perfFlags.on && solid.current && solidDepth.current) {
      solid.current.visible = !perfFlags.nostone;
      solidDepth.current.visible = !perfFlags.nostone && !perfFlags.noprepass;
      mats.solid.depthWrite = mats.lite.depthWrite = perfFlags.noprepass;
    }

    // Hover only while the stone is whole enough for the proxy to be true.
    const S = sceneState.S;
    // (The hero only: the stone is the door to the story.)
    const whole = S < 0.6 && M0 > 0;
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
        if (!clickBound) {
          // The stone is the door to the story: a click on it (in the hero) opens it.
          clickBound = true;
          window.addEventListener("click", (e) => {
            if (!ui.hoverStone || story.phase !== "closed" || sceneState.S > 0.4) return;
            if ((e.target as HTMLElement | null)?.closest("a, button, input, textarea")) return;
            openStory();
          });
        }
      }
    }
  }, PRIORITY.scene);

  return (
    <group>
      <mesh ref={solidDepth} geometry={build.geometry} material={mats.solidDepth} frustumCulled={false} renderOrder={0.5} />
      <mesh ref={solid} geometry={build.geometry} material={dev.freeze ? mats.solid : mats.lite} frustumCulled={false} renderOrder={1} />

      <mesh
        ref={mirrorDepth}
        geometry={build.geometry}
        material={mats.mirrorDepth}
        frustumCulled={false}
        matrixAutoUpdate={false}
        renderOrder={-1}
      />
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
