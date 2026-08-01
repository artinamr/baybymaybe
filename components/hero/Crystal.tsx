"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { pointer } from "@/lib/usePointer";

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * The centerpiece: the client-supplied obsidian crystal (public/crystal.glb —
 * textures resized to 1K + re-encoded, 4.1MB → 0.5MB). Y-up, centred, 2 units
 * tall. Behaviour (slow 3/4 sway + float + cursor parallax) is ours; the mesh
 * and its obsidian PBR maps are the client's asset.
 */
const GLB_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/crystal.glb`;

export function Crystal() {
  const group = useRef<THREE.Group>(null);
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

    // A persistent 3/4 view, gently swaying — the suspended turn of a thing
    // frozen in place.
    const baseY = 0.5;
    const swayY = prefersReduced ? baseY : baseY + Math.sin(t * 0.16) * 0.3;
    const swayX = prefersReduced ? 0.04 : 0.04 + Math.sin(t * 0.23) * 0.05;
    g.rotation.y += (swayY + pointer.x * 0.3 - g.rotation.y) * 0.04;
    g.rotation.x += (swayX - pointer.y * 0.12 - g.rotation.x) * 0.04;

    // Float + slight cursor parallax in position.
    g.position.x += (1.7 + pointer.x * 0.18 - g.position.x) * 0.04;
    g.position.y = prefersReduced ? 0 : Math.sin(t * 0.5) * 0.09;
  });

  return (
    <group ref={group} position={[1.7, 0, 0]} scale={1.3}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_URL);
