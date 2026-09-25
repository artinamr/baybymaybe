"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { ready } from "@/lib/stores";
import { PRIORITY } from "@/lib/sceneState";

/**
 * The room the obsidian reflects — not the room the page shows (SPEC §4.5).
 *
 * Polished black glass on white paper is lit like a product shot: a dark
 * studio, a few NARROW bright strips for the crisp ridge lines, and — the part
 * the first pass lacked — BROAD, dim softboxes all round, so every facet at
 * every angle catches some gradient instead of returning the dark room as a
 * flat black cut-out. With the facets' slight undulation (shaders/obsidian.ts)
 * the softboxes become long flowing sheens across each face.
 *
 * Baked once into a cube map (frames = 1): zero per-frame cost.
 */
export function StudioEnv() {
  const frames = useRef(0);
  useFrame(() => {
    if (frames.current < 3 && ++frames.current === 2) ready.env = true;
  }, PRIORITY.scene);

  return (
    <Environment frames={1} resolution={512} background={false}>
      <color attach="background" args={["#0B0B0F"]} />
      {/* Narrow strips — the edge lines. */}
      <Lightformer form="rect" intensity={9} position={[-3.2, 1.2, 3.4]} scale={[0.16, 9, 1]} />
      <Lightformer form="rect" intensity={7} position={[3.6, 0.6, -2.6]} scale={[0.12, 8, 1]} />
      <Lightformer form="rect" intensity={4} position={[0, 5.5, 1]} scale={[7, 0.14, 1]} />
      <Lightformer form="rect" intensity={2.5} position={[0, -0.4, 6]} scale={[14, 0.08, 1]} />
      <Lightformer form="rect" intensity={3} position={[2.2, 3.5, 4.5]} scale={[0.1, 5, 1]} />
      {/* Broad softboxes — every facet catches a gradient from somewhere. */}
      <Lightformer form="rect" intensity={1.5} position={[0, 8, 0]} scale={[7, 7, 1]} color="#EFEEE9" />
      {/* The crown's facets tilt ~27° up, so they see the sky BEHIND the
          camera — without this panel they return nothing and read pure black. */}
      {/* Graded bands, not one panel: a single wide panel is caught whole by a
          facet and reads as grey plastic; bands of falling intensity with one
          crisp line read as a studio gradient on polished glass. */}
      <Lightformer form="rect" intensity={1.0} position={[0, 7.6, 5]} scale={[11, 1.4, 1]} color="#EFEEE9" />
      <Lightformer form="rect" intensity={0.45} position={[0, 6.2, 6.1]} scale={[11, 1.1, 1]} color="#EFEEE9" />
      <Lightformer form="rect" intensity={0.18} position={[0, 5.2, 6.7]} scale={[11, 0.9, 1]} color="#EFEEE9" />
      <Lightformer form="rect" intensity={3} position={[0, 4.5, 7]} scale={[11, 0.1, 1]} />
      <Lightformer form="rect" intensity={0.7} position={[-6, 5.5, -2]} scale={[5, 3, 1]} color="#ECEAE5" />
      <Lightformer form="rect" intensity={0.55} position={[-7, 1.5, 1]} scale={[4, 9, 1]} color="#ECEAE5" />
      <Lightformer form="rect" intensity={0.4} position={[7, 0.5, 3]} scale={[4, 9, 1]} color="#E9E7F2" />
      <Lightformer form="rect" intensity={0.3} position={[0, 2, -9]} scale={[12, 6, 1]} color="#ECEAE5" />
      {/* The paper floor, graded: a dim wide bounce and a brighter pool near the
          stone, so the pavilion's facets get a sheen that falls off, not a flat grey. */}
      <Lightformer form="rect" intensity={0.45} position={[0, -6, 0]} scale={[18, 18, 1]} color="#F6F5F2" />
      <Lightformer form="rect" intensity={0.8} position={[0, -4, 3]} scale={[5, 3, 1]} color="#F6F5F2" />
      {/* A trace of brand colour on the far edges. */}
      <Lightformer form="rect" intensity={2.2} position={[-4, -1.5, -3.5]} scale={[0.2, 5, 1]} color="#5B3DF0" />
      <Lightformer form="rect" intensity={1.2} position={[5, -2, -4]} scale={[3, 3, 1]} color="#3B2A9E" />
    </Environment>
  );
}
