"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import { pointer } from "@/lib/usePointer";

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * The centerpiece: an alien obsidian monolith.
 *
 * A noise-displaced, vertically elongated icosahedron with flat shading → a
 * faceted but organically *wrong* silhouette (not a human-cut gem, not a
 * natural crystal). Matte dark finish with a faint indigo sheen so the facets
 * catch edge light without ever going glossy.
 *
 * ── SWAPPING IN THE REAL MODEL ───────────────────────────────────────────────
 * This procedural form is a PLACEHOLDER. To use an authored asset:
 *   1. drop it at `public/centerpiece.glb`
 *   2. replace the <mesh geometry={geometry}> below with the loaded scene, e.g.
 *        const { nodes } = useGLTF("/centerpiece.glb");
 *        <mesh geometry={nodes.YourMesh.geometry}> … </mesh>
 *      keeping the same <meshPhysicalMaterial> and the same group transform.
 */
export function FrozenCrystal() {
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const noise = new ImprovedNoise();
    const geo = new THREE.IcosahedronGeometry(1, 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    const dir = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      dir.copy(v).normalize();

      // 3D noise → irregular, alien radial displacement
      const n = noise.noise(v.x * 1.7, v.y * 1.7, v.z * 1.7);
      // a second, lower-frequency layer for large-scale asymmetry
      const n2 = noise.noise(v.x * 0.6, v.y * 0.6, v.z * 0.6);
      const r = 1 + n * 0.2 + n2 * 0.12;

      v.copy(dir).multiplyScalar(r);
      // elongate vertically → tall monolith
      v.y *= 2.25;
      // a slight, asymmetric twist so it leans off-axis (alien, not symmetric)
      v.x += Math.sin(v.y * 0.9) * 0.08;

      pos.setXYZ(i, v.x, v.y, v.z);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

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
    g.position.y = 0 + (prefersReduced ? 0 : Math.sin(t * 0.5) * 0.09);
  });

  return (
    <group ref={group} position={[1.7, 0, 0]} scale={0.55}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#13111c"
          roughness={0.88}
          metalness={0.0}
          sheen={1}
          sheenColor={new THREE.Color("#6a5cff")}
          sheenRoughness={0.55}
          clearcoat={0.12}
          clearcoatRoughness={0.7}
          flatShading
          envMapIntensity={0.9}
        />
      </mesh>
    </group>
  );
}
