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
 * studio with a few NARROW bright sources. A dielectric only returns light at
 * its facets and round-overs, so this environment is the stone's whole look:
 * the dark surround keeps faces black, thin strips draw the ridge lines (a wide
 * strip is caught by a whole facet at once and returns a grey plastic panel),
 * a soft top panel grades the crown, the paper floor puts a warm bounce on the
 * pavilion, and one indigo kicker gives the far edges a trace of brand colour.
 *
 * Baked once into a cube map (frames = 1): zero per-frame cost.
 */
export function StudioEnv() {
  const frames = useRef(0);
  useFrame(() => {
    if (frames.current < 3 && ++frames.current === 2) ready.env = true;
  }, PRIORITY.scene);

  return (
    <Environment frames={1} resolution={256} background={false}>
      <color attach="background" args={["#0B0B0F"]} />
      <Lightformer form="rect" intensity={9} position={[-3.2, 1.2, 3.4]} scale={[0.16, 9, 1]} />
      <Lightformer form="rect" intensity={7} position={[3.6, 0.6, -2.6]} scale={[0.12, 8, 1]} />
      <Lightformer form="rect" intensity={4} position={[0, 5.5, 1]} scale={[7, 0.14, 1]} />
      <Lightformer form="rect" intensity={2.5} position={[0, -0.4, 6]} scale={[14, 0.08, 1]} />
      <Lightformer form="rect" intensity={0.6} position={[0, 8, 0]} scale={[6, 6, 1]} color="#EFEEE9" />
      <Lightformer form="rect" intensity={0.5} position={[0, -6, 0]} scale={[14, 14, 1]} color="#F6F5F2" />
      <Lightformer form="rect" intensity={2.2} position={[-4, -1.5, -3.5]} scale={[0.2, 5, 1]} color="#5B3DF0" />
    </Environment>
  );
}
