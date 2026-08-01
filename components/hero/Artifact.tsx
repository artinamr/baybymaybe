"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { pointer } from "@/lib/usePointer";
import { heroAnim } from "@/lib/heroAnim";
import { artifactVertex, artifactFragment } from "@/shaders/artifact";

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** World-space waterline — the black mirror the artifact hovers above. */
export const WATER_Y = -1.5;
const ARTIFACT_Y = 0.72;

/**
 * The silhouette: an elongated faceted kite — a tall upper pyramid, a wide
 * shoulder, and a long tapering lower point (the client's reference object,
 * and the Nerodyn mark extruded into the third dimension). Six radial
 * segments keep the facets bold; tiny per-ring jitter and twist keep it
 * alien rather than machine-cut.
 */
function buildKiteGeometry(radialSegments = 6): THREE.BufferGeometry {
  // profile rings from top apex to bottom apex: [radius, y]
  const profile: Array<[number, number]> = [
    [0.0, 1.62], // top apex
    [0.34, 0.86], // upper ridge
    [0.6, 0.3], // shoulder — the widest point
    [0.46, -0.22], // upper taper
    [0.29, -0.92], // lower taper
    [0.0, -1.78], // bottom apex
  ];

  // deterministic pseudo-random for the jitter
  const rand = (i: number, j: number) => {
    const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
  };

  const positions: number[] = [];
  const ringPoints: THREE.Vector3[][] = [];

  for (let i = 0; i < profile.length; i++) {
    const [r, y] = profile[i];
    const twist = rand(i, 99) * 0.08; // slight alien twist per ring
    const pts: THREE.Vector3[] = [];
    for (let j = 0; j < radialSegments; j++) {
      const a = (j / radialSegments) * Math.PI * 2 + twist;
      const jr = r * (1 + rand(i, j) * 0.05);
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * jr,
          y + rand(j, i) * 0.02 * (r > 0 ? 1 : 0),
          Math.sin(a) * jr
        )
      );
    }
    ringPoints.push(pts);
  }

  const pushTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };

  for (let i = 0; i < ringPoints.length - 1; i++) {
    const upper = ringPoints[i];
    const lower = ringPoints[i + 1];
    const upperIsApex = profile[i][0] === 0;
    const lowerIsApex = profile[i + 1][0] === 0;

    for (let j = 0; j < radialSegments; j++) {
      const jn = (j + 1) % radialSegments;
      if (upperIsApex) {
        pushTri(upper[0], lower[j], lower[jn]);
      } else if (lowerIsApex) {
        pushTri(lower[0], upper[jn], upper[j]);
      } else {
        pushTri(upper[j], lower[j], lower[jn]);
        pushTri(upper[j], lower[jn], upper[jn]);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geo.computeVertexNormals(); // non-indexed → flat facet normals
  return geo;
}

function makeArtifactMaterial(reflect: boolean) {
  return new THREE.ShaderMaterial({
    vertexShader: artifactVertex,
    fragmentShader: artifactFragment,
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uAwaken: { value: 0 },
      uHover: { value: 0 },
      uReflect: { value: reflect ? 1 : 0 },
      uWaterY: { value: WATER_Y },
    },
    transparent: reflect,
    depthWrite: !reflect,
    blending: reflect ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

export function Artifact({ onEnter }: { onEnter: () => void }) {
  const group = useRef<THREE.Group>(null);
  const ghost = useRef<THREE.Group>(null);
  const debris = useRef<THREE.Group>(null);

  const geometry = useMemo(() => buildKiteGeometry(6), []);
  const shardGeometry = useMemo(() => new THREE.TetrahedronGeometry(1, 0), []);
  const material = useMemo(() => makeArtifactMaterial(false), []);
  const ghostMaterial = useMemo(() => makeArtifactMaterial(true), []);

  const debrisSeeds = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        angle: (i / 7) * Math.PI * 2 + Math.sin(i * 7.3) * 0.8,
        radius: 1.25 + ((i * 0.37) % 1) * 1.1,
        y: ((i * 0.61) % 1) * 2.6 - 1.3,
        size: 0.025 + ((i * 0.17) % 1) * 0.045,
        speed: 0.05 + ((i * 0.23) % 1) * 0.06,
      })),
    []
  );

  useFrame((state) => {
    const g = group.current;
    const gh = ghost.current;
    if (!g || !gh) return;
    const t = prefersReduced ? 1.2 : state.clock.elapsedTime;
    const reveal = heroAnim.reveal;
    const ease = 1 - Math.pow(1 - reveal, 3);

    // idle sway + pointer parallax + slow drift while awake
    const swayY = 0.62 + Math.sin(t * 0.14) * 0.34 + t * 0.02;
    g.rotation.y +=
      (swayY + pointer.x * 0.24 + heroAnim.awaken * 0.6 - g.rotation.y) * 0.045;
    const swayX = 0.05 + Math.sin(t * 0.21) * 0.045;
    g.rotation.x += (swayX - pointer.y * 0.1 - g.rotation.x) * 0.045;
    g.rotation.z = Math.sin(t * 0.1) * 0.03;

    // float, rising into frame on reveal
    const floatY = Math.sin(t * 0.5) * 0.085;
    g.position.y = ARTIFACT_Y + floatY + (1 - ease) * 1.1;
    g.position.x = pointer.x * 0.1;
    const s = 0.85 * (0.92 + 0.08 * ease) * (1 + heroAnim.awaken * 0.05);
    g.scale.setScalar(s);

    // the water ghost mirrors the artifact across the waterline
    gh.position.y = 2 * WATER_Y - g.position.y;
    gh.position.x = g.position.x;
    gh.rotation.y = g.rotation.y;
    gh.rotation.x = -g.rotation.x;
    gh.rotation.z = -g.rotation.z;
    gh.scale.set(s, -s, s);

    // debris shards drift in slow orbit
    const d = debris.current;
    if (d) {
      d.children.forEach((child, i) => {
        const seed = debrisSeeds[i];
        const a = seed.angle + t * seed.speed;
        child.position.set(
          Math.cos(a) * seed.radius,
          seed.y + Math.sin(t * 0.4 + i * 1.7) * 0.16,
          Math.sin(a) * seed.radius * 0.75
        );
        child.rotation.x = t * 0.12 + i;
        child.rotation.y = t * 0.09 + i * 2.1;
        child.visible = reveal > 0.35;
      });
    }

    // shared uniforms
    for (const m of [material, ghostMaterial]) {
      m.uniforms.uTime.value = t;
      m.uniforms.uReveal.value = ease;
      m.uniforms.uAwaken.value = heroAnim.awaken;
      m.uniforms.uHover.value = heroAnim.hover;
    }
  });

  return (
    <>
      <group ref={group}>
        <mesh
          geometry={geometry}
          material={material}
          onPointerOver={(e) => {
            e.stopPropagation();
            heroAnim.hoverTarget = 1;
          }}
          onPointerOut={() => {
            heroAnim.hoverTarget = 0;
          }}
          onClick={(e) => {
            e.stopPropagation();
            onEnter();
          }}
        />
        <group ref={debris}>
          {debrisSeeds.map((seed, i) => (
            <mesh
              key={i}
              geometry={shardGeometry}
              material={material}
              scale={seed.size}
            />
          ))}
        </group>
      </group>

      {/* the ghost in the water */}
      <group ref={ghost}>
        <mesh geometry={geometry} material={ghostMaterial} renderOrder={2} />
      </group>
    </>
  );
}
