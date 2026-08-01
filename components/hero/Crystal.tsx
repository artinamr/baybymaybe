"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { pointer } from "@/lib/usePointer";
import { heroLayout } from "@/lib/heroLayout";

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * The centerpiece: the client-supplied obsidian crystal (public/crystal.glb —
 * textures resized to 1K + re-encoded, 4.1MB → 0.5MB). Y-up, centred, 2 units
 * tall. Behaviour (slow 3/4 sway + drift + cursor parallax) is ours; the mesh
 * and its obsidian PBR maps are the client's asset.
 *
 * Framed as a monument by `heroLayout`: tip just under the nav, base running off
 * the bottom of the frame. The crop is deliberate — it is what gives the shard
 * mass, and it replaced the floating-shard-plus-ellipse-shadow product shot.
 */
const GLB_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/crystal.glb`;

export function Crystal() {
  const group = useRef<THREE.Group>(null);
  const placed = useRef(false);
  const { scene } = useGLTF(GLB_URL);
  // Shared with the patched shader below; ticked in useFrame.
  const uTime = useMemo(() => ({ value: 0 }), []);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = mesh.receiveShadow = true;
      const src = mesh.material as THREE.MeshStandardMaterial;
      if (!src?.isMeshStandardMaterial || (src as THREE.Material).userData.alien)
        return;

      // Upgrade Standard → Physical so the shard can carry THIN-FILM
      // IRIDESCENCE. This is what makes it read as alien rather than as a dark
      // rock: an oil-slick interference sheen that swings through violet, cyan
      // and magenta as the facets turn, on top of a near-black obsidian body.
      const mat = new THREE.MeshPhysicalMaterial({
        map: src.map,
        roughnessMap: src.roughnessMap,
        metalnessMap: src.metalnessMap,
        emissiveMap: src.emissiveMap,
        emissive: src.emissive,
        // Slight cool deepening of an already-black baseColor map (it is real
        // obsidian with pale crack veins — the veins are the client's brief, so
        // don't crush them).
        color: new THREE.Color(0.78, 0.77, 0.86),
        // OBSIDIAN IS A DIELECTRIC. Metalness tints reflection by base colour
        // and reflects the whole environment broadly — at 0.55 the tall white
        // Lightformer strips came back as big pale mirror panels that read as a
        // washed-out glass prop, not stone. At 0 the env survives only as tight
        // specular edge highlights, which is exactly the reference: polished
        // black crystal with sharp edges.
        metalness: 0.0,
        // The Sketchfab export ships emissiveFactor 1.0, which flattens every
        // light in the scene — pull it down to a faint violet inner glow.
        emissiveIntensity: 0.1,
        // Polished: tight highlights rather than broad soft sheen.
        roughness: 0.18,
        envMapIntensity: 0.9, // crisp studio reflections on the facets
        flatShading: true, // crisp per-facet normals, not waxy smooth shading
        // Iridescence is an ACCENT, the same way the veins are — enough to shift
        // violet→cyan→magenta as the facets turn, not enough to own the surface.
        iridescence: 0.6,
        iridescenceIOR: 1.9,
        // A wide film range so neighbouring facets land on different fringes —
        // the shard shifts colour as it turns instead of tinting uniformly.
        iridescenceThicknessRange: [140, 780],
        // Kept moderate: clearcoat reflects the environment on top of the
        // iridescence layer regardless of metalness, so stacking all three high
        // re-introduces the broad pale panels that metalness:0 just removed.
        clearcoat: 0.6,
        clearcoatRoughness: 0.08, // wet polish over the interference layer
      });
      mat.userData.alien = true;

      // Light that RUNS THROUGH the body — the client's original "mythic veins"
      // intent. Deliberately LOW frequency: the rejected speckle and worley
      // passes failed because high-frequency noise reads as grain. These are two
      // broad slow bands in object space, so they sweep the whole shard.
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = uTime;
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vObj;")
          .replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nvObj = position;"
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying vec3 vObj;\nuniform float uTime;"
          )
          .replace(
            "#include <emissivemap_fragment>",
            /* glsl */ `
            #include <emissivemap_fragment>
            {
              // Two slow travelling bands along the shard's long axis, warped so
              // they never look like a scanline.
              float w = sin(vObj.x * 1.7 + uTime * 0.19) * 0.6;
              float b1 = sin(vObj.y * 1.5 - uTime * 0.42 + w);
              float b2 = sin(vObj.y * 0.9 + uTime * 0.27 - w);
              float energy = smoothstep(0.62, 1.0, b1) + 0.55 * smoothstep(0.75, 1.0, b2);
              // Fresnel-weighted so the light reads as INSIDE the crystal,
              // catching on the grazing facets, not painted on the surface.
              float fres = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.2);
              totalEmissiveRadiance +=
                vec3(0.34, 0.16, 1.0) * energy * (0.16 + fres * 0.85) * 0.42;
            }
            `
          );
      };

      mesh.material = mat;
      src.dispose();
    });
  }, [scene, uTime]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    uTime.value = prefersReduced ? 0 : t;
    // Recomputed from the live canvas size, so resizing re-frames the monument
    // instead of leaving it stranded at one aspect ratio.
    const L = heroLayout(state.size.width, state.size.height);
    g.scale.setScalar(L.scale);

    // Snap on the first frame — otherwise the easing below would visibly slide
    // the shard in from the origin before the intro has even played.
    if (!placed.current) {
      placed.current = true;
      g.position.set(L.posX, L.posY, 0);
      g.rotation.set(0.04, 0.5, 0);
    }

    // A persistent 3/4 view, gently swaying — the suspended turn of a thing
    // frozen in place. Amplitudes are deliberately smaller than the old
    // floating shard used: at this mass, visible bobbing reads as weightless.
    const baseY = 0.5;
    const swayY = prefersReduced ? baseY : baseY + Math.sin(t * 0.16) * 0.22;
    const swayX = prefersReduced ? 0.04 : 0.04 + Math.sin(t * 0.23) * 0.035;
    g.rotation.y += (swayY + pointer.x * 0.22 - g.rotation.y) * 0.04;
    g.rotation.x += (swayX - pointer.y * 0.08 - g.rotation.x) * 0.04;

    // Drift + a whisper of cursor parallax. The base is cropped by the frame,
    // so vertical drift only ever moves the tip.
    g.position.x += (L.posX + pointer.x * 0.09 - g.position.x) * 0.04;
    const drift = prefersReduced ? 0 : Math.sin(t * 0.38) * 0.045;
    g.position.y += (L.posY + drift - g.position.y) * 0.06;
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_URL);
