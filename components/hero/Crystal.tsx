"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { pointer } from "@/lib/usePointer";
import { heroLayout } from "@/lib/heroLayout";

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * The centerpiece: a monolith of dark volcanic rock, clad in the client's own
 * reference photograph.
 *
 * Geometry is the shell of heart.glb (32 tris, a faceted bipyramid). The heart
 * mesh inside it is REMOVED at load — the client asked for the rock alone.
 * The source GLB shipped 12.9MB of baked textures; scripts/strip-glb.mjs drops
 * them (→ 40KB) since the material is rebuilt here.
 *
 * It is the entry point to story mode, so it is clickable and reports hover.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const GLB_URL = `${BASE}/heart.glb`;
const ROCK_URL = `${BASE}/rock.jpg`;

export function Crystal({
  onEnter,
  onHover,
}: {
  onEnter?: () => void;
  onHover?: (hovering: boolean) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const placed = useRef(false);
  const [hovered, setHovered] = useState(false);
  const { scene } = useGLTF(GLB_URL);
  const rock = useTexture(ROCK_URL);
  const glow = useRef(0);
  const mat = useRef<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => {
    // MUST tile. The triplanar projection below samples well outside 0..1, so
    // on ClampToEdge every out-of-range coordinate returns the same edge pixel
    // and the whole rock smears into streaks. Changing wrap mode alone is not
    // enough — texture parameters only reach the GPU on `needsUpdate`, and
    // leaving that off is exactly what caused the smearing.
    rock.wrapS = rock.wrapT = THREE.RepeatWrapping;
    rock.colorSpace = THREE.SRGBColorSpace;
    rock.anisotropy = 8;
    rock.needsUpdate = true;

    const doomed: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const src = mesh.material as THREE.MeshStandardMaterial;

      // Tag the role ONCE, from the GLB's own material name, and read the tag
      // afterwards. Deciding by `material.name` on every pass is a trap: this
      // effect re-runs (StrictMode, HMR, cached useGLTF scene), and by then the
      // shell's material has been swapped for one that isn't called "Crystal" —
      // so the shell got deleted as if it were the heart, and the rock silently
      // vanished from the page.
      if (mesh.userData.role === undefined) {
        mesh.userData.role = src?.name === "Crystal" ? "shell" : "heart";
      }

      // The heart. The client asked for the rock on its own.
      if (mesh.userData.role !== "shell") {
        doomed.push(mesh);
        return;
      }
      if ((src as THREE.Material)?.userData.built) return;

      const stone = new THREE.MeshStandardMaterial({
        map: rock,
        color: new THREE.Color(1.0, 0.98, 1.0),
        roughness: 0.88,
        metalness: 0,
        envMapIntensity: 0.4,
        emissive: new THREE.Color("#5b3df0"),
        emissiveIntensity: 0,
        side: THREE.FrontSide,
      });

      // TRIPLANAR PROJECTION.
      // This shell is 32 triangles with coarse UVs, so sampling the photograph
      // through them smears one boulder into vertical streaks across each huge
      // facet — it stopped looking like rock at all. Projecting from the three
      // object-space axes and blending by the normal ignores the UVs entirely,
      // which is the standard fix for low-poly meshes with unusable unwraps.
      // The sRGB decode still happens in the sampler, so colour stays correct.
      stone.onBeforeCompile = (shader) => {
        shader.uniforms.uTri = { value: 2.1 };
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying vec3 vObjPos;\nvarying vec3 vObjNrm;"
          )
          .replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nvObjPos = position;\nvObjNrm = normal;"
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying vec3 vObjPos;\nvarying vec3 vObjNrm;\nuniform float uTri;\nvec3 gBump = vec3(0.0);"
          )
          .replace(
            "#include <map_fragment>",
            /* glsl */ `
            {
              vec3 bw = pow(abs(normalize(vObjNrm)), vec3(4.0));
              bw /= (bw.x + bw.y + bw.z);
              vec3 p = vObjPos * uTri;
              vec4 tx = texture2D(map, p.zy) * bw.x
                      + texture2D(map, p.xz) * bw.y
                      + texture2D(map, p.xy) * bw.z;
              diffuseColor *= tx;

              // Relief from the same projection. Screen-space derivatives of the
              // sampled luminance are what a bump map is; doing it here keeps
              // the relief on the triplanar coordinates rather than the broken
              // UVs the material's own bumpMap would have used.
              float h = dot(tx.rgb, vec3(0.333));
              vec3 bump = vec3(dFdx(h), dFdy(h), 0.0) * 2.2;
              gBump = bump;
            }
            `
          )
          .replace(
            "#include <normal_fragment_begin>",
            "#include <normal_fragment_begin>\nnormal = normalize(normal + vec3(gBump.x, gBump.y, 0.0));"
          );
      };
      stone.userData.built = true;
      mat.current = stone;
      mesh.material = stone;
      src.dispose();
    });
    for (const d of doomed) {
      d.removeFromParent();
      const m = d as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material)?.dispose?.();
    }
  }, [scene, rock]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    onHover?.(hovered);
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered, onHover]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const L = heroLayout(state.size.width, state.size.height);
    g.scale.setScalar(L.scale);

    if (!placed.current) {
      placed.current = true;
      g.position.set(L.posX, L.posY, 0);
      g.rotation.set(0.04, 0.5, 0);
    }

    // A slow turn — at this size a static silhouette reads as a flat cutout.
    const swayY = prefersReduced ? 0.5 : 0.5 + Math.sin(t * 0.11) * 0.33;
    const swayX = prefersReduced ? 0.04 : 0.04 + Math.sin(t * 0.17) * 0.04;
    g.rotation.y += (swayY + pointer.x * 0.16 - g.rotation.y) * 0.04;
    g.rotation.x += (swayX - pointer.y * 0.06 - g.rotation.x) * 0.04;

    g.position.x += (L.posX + pointer.x * 0.07 - g.position.x) * 0.04;
    const drift = prefersReduced ? 0 : Math.sin(t * 0.33) * 0.035;
    g.position.y += (L.posY + drift - g.position.y) * 0.06;

    // Hovering wakes the seams inside the stone — the page's one promise that
    // this thing opens.
    const target = hovered ? 1 : 0;
    glow.current += (target - glow.current) * Math.min(1, delta * 4);
    if (mat.current) mat.current.emissiveIntensity = glow.current * 0.55;
  });

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onEnter?.();
      }}
    >
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(GLB_URL);
