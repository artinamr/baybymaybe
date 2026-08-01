"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { pointer } from "@/lib/usePointer";
import { heroLayout } from "@/lib/heroLayout";

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * The centerpiece: the client's heart-in-glass model — a faceted transparent
 * shell (32 tris) with a heart suspended inside it (836 tris).
 *
 * The GLB shipped 7 baked textures at 12.9MB; scripts/strip-glb.mjs removes them
 * (→ 40KB) because both materials are rebuilt here: the heart is clad in the
 * client's dark volcanic rock reference, the shell is left as glass so the heart
 * stays visible — the encasement is the whole point of the model.
 */
/** Alpha of the shell face-on. The Fresnel patch below lifts it toward opaque
 *  at grazing angles, so this is the value through the middle of the glass. */
const glassBase = 0.022;

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const GLB_URL = `${BASE}/heart.glb`;
const ROCK_URL = `${BASE}/rock.jpg`;

export function Crystal() {
  const group = useRef<THREE.Group>(null);
  const placed = useRef(false);
  const heart = useRef<THREE.MeshStandardMaterial | null>(null);
  const { scene } = useGLTF(GLB_URL);
  const rock = useTexture(ROCK_URL);
  const uTime = useMemo(() => ({ value: 0 }), []);

  // The colour map and the relief map are the same photograph, but they must be
  // sampled in different colour spaces — hence a clone rather than one texture.
  const rockBump = useMemo(() => {
    const t = rock.clone();
    t.colorSpace = THREE.NoColorSpace;
    t.needsUpdate = true;
    return t;
  }, [rock]);

  useEffect(() => {
    for (const t of [rock, rockBump]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      // 1:1. Tiled harder, the photograph's own large forms repeat across the
      // heart's UVs and read as horizontal banding rather than as rock.
      t.repeat.set(1, 1);
      t.anisotropy = 8;
    }
    rock.colorSpace = THREE.SRGBColorSpace;

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const src = mesh.material as THREE.MeshStandardMaterial;
      if (!src || (src as THREE.Material).userData.built) return;

      if (src.name === "Crystal") {
        // The shell. Not real transmission — that is expensive, and its quality
        // is exactly what a headless check cannot verify. A thin, low-opacity
        // dielectric with a bright environment reads as glass on any GPU and
        // cannot fail to something ugly.
        const glass = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(0.78, 0.8, 0.9),
          metalness: 0,
          roughness: 0.06,
          transparent: true,
          // Low, because DoubleSide means every ray crosses the shell twice —
          // the front and back faces compound, so the value on screen is close
          // to double this. At 0.19 it stacked into milky white plastic and
          // buried the heart.
          opacity: 0.1,
          side: THREE.DoubleSide,
          depthWrite: false, // so the heart behind it is never punched out
          envMapIntensity: 0.9,
          iridescence: 0.5,
          iridescenceIOR: 1.4,
          iridescenceThicknessRange: [120, 520],
          clearcoat: 0.45,
          clearcoatRoughness: 0.04,
        });
        // FRESNEL ALPHA. A uniformly translucent shell on a white page just
        // reads as frosted plastic — what makes glass legible is that it is
        // near-invisible face-on and bright at grazing angles. Driving alpha off
        // N·V gives that edge definition from geometry, so it holds up even
        // where environment reflections are weak.
        glass.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <opaque_fragment>",
            /* glsl */ `
            {
              // A HIGH exponent matters here. This shell is faceted, so almost
              // every face sits at a middling angle to the camera; a gentle
              // curve lifts all of them at once and the glass turns back into
              // frosted plastic. Only near-grazing angles may brighten.
              float ndv = abs(dot(normalize(normal), normalize(vViewPosition)));
              float rim = pow(1.0 - ndv, 5.0);
              diffuseColor.a = ${glassBase.toFixed(3)} + 0.72 * rim;
            }
            #include <opaque_fragment>
            `
          );
        };
        glass.userData.built = true;
        mesh.material = glass;
        mesh.renderOrder = 2;
        src.dispose();
        return;
      }

      // The heart, clad in the client's volcanic rock reference: near-black,
      // rough, with the photograph's own relief driving the bump so the facets
      // catch light like stone rather than like a smooth solid.
      const stone = new THREE.MeshStandardMaterial({
        map: rock,
        bumpMap: rockBump,
        bumpScale: 0.35,
        // Left near 1: the reference photograph is already near-black, so
        // tinting it down again only crushes it into a silhouette.
        color: new THREE.Color(0.96, 0.95, 1.0),
        roughness: 0.94,
        metalness: 0,
        envMapIntensity: 0.5,
        emissive: new THREE.Color("#5b3df0"),
        emissiveIntensity: 0.0,
      });
      stone.userData.built = true;
      mesh.material = stone;
      mesh.renderOrder = 1;
      heart.current = stone;
      src.dispose();
    });
  }, [scene, rock, rockBump, uTime]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    uTime.value = prefersReduced ? 0 : t;
    const L = heroLayout(state.size.width, state.size.height);
    g.scale.setScalar(L.scale);

    if (!placed.current) {
      placed.current = true;
      g.position.set(L.posX, L.posY, 0);
      g.rotation.set(0.04, 0.5, 0);
    }

    // A slow turn, so the heart is read from changing angles rather than sitting
    // as one fixed silhouette.
    const swayY = prefersReduced ? 0.5 : 0.5 + Math.sin(t * 0.13) * 0.4;
    const swayX = prefersReduced ? 0.04 : 0.04 + Math.sin(t * 0.2) * 0.05;
    g.rotation.y += (swayY + pointer.x * 0.26 - g.rotation.y) * 0.04;
    g.rotation.x += (swayX - pointer.y * 0.09 - g.rotation.x) * 0.04;

    g.position.x += (L.posX + pointer.x * 0.1 - g.position.x) * 0.04;
    const drift = prefersReduced ? 0 : Math.sin(t * 0.38) * 0.05;
    g.position.y += (L.posY + drift - g.position.y) * 0.06;

    // A heartbeat. Two close pulses then a rest — the double thump is what
    // makes it read as a beat instead of a throb. Held very low: it should be
    // noticed on the second look, not the first.
    if (heart.current && !prefersReduced) {
      const beat = (t * 0.72) % 1;
      const thump =
        Math.exp(-beat * 26) * 1.0 + Math.exp(-Math.abs(beat - 0.18) * 30) * 0.55;
      heart.current.emissiveIntensity = 0.015 + thump * 0.085;
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_URL);
