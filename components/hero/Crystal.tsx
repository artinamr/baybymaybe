"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = mesh.receiveShadow = true;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat?.isMeshStandardMaterial) return;
      // The Sketchfab export ships emissiveFactor 1.0, which flattens every
      // light in the scene — pull it down to a faint violet inner glow.
      mat.emissiveIntensity = 0.12;
      // Glossier obsidian: scalar roughness multiplies the MR map.
      mat.roughness = 0.32;
      mat.envMapIntensity = 1.5; // crisp studio reflections on the facets
      mat.normalMap = null; // baked flat map — dead weight
      mat.flatShading = true; // crisp per-facet normals, not waxy smooth shading
      mat.needsUpdate = true;
    });
  }, [scene]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
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
