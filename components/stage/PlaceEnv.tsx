"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { story } from "@/lib/story";

/**
 * WHAT THE GLASS SEES.
 *
 * The hero and the statement keep StudioEnv — a dark room of narrow strips and
 * broad dim softboxes, which gives the single stone its black silhouette (liked
 * exactly as it is). From the break on, the page is a WHITE studio full of
 * glass, and glass must reflect that room or every piece reads as a flat black
 * cut-out. So the pieces get the product photographer's answer for glossy
 * black on white: a pale room lit from above and below, with bold BLACK FLAGS
 * standing round it — every face then carries a crisp dark reflection or a
 * pale sheen, never one flat tone (an evenly bright room is grey plastic; the
 * flags are what keep it glass). Baked once (PMREM), swapped in mid-burst,
 * where the motion hides the change.
 *
 * Past the statement the room TURNS with the scroll, so highlights and flag
 * edges sweep across the glass the way a product film's lights do.
 */

function whiteStudio(): THREE.Scene {
  const scene = new THREE.Scene();
  const R = 40;
  const geo = new THREE.SphereGeometry(R, 64, 32);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / R;
    // A pale cove: a bright top light, a white floor bounce, a softer wall.
    let k = 0.62 + 0.22 * Math.max(0, y) ** 0.7 + 0.2 * Math.max(0, -y) ** 0.8;
    k += 0.35 * Math.exp(-((y - 0.95) ** 2) / 0.004); // the top softbox, a disc of light
    colors[i * 3] = k;
    colors[i * 3 + 1] = k * 0.997;
    colors[i * 3 + 2] = k * 0.99;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false })));

  const black = new THREE.MeshBasicMaterial({ color: 0x050507, side: THREE.DoubleSide, toneMapped: false });
  const panel = (w: number, h: number, az: number, r: number, y: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(Math.sin(az) * r, y, Math.cos(az) * r);
    m.lookAt(0, y, 0);
    scene.add(m);
  };
  // Black flags standing round the glass (tall, of different widths, so the
  // reflections they make are never a regular pattern).
  const flags: [number, number, number][] = [
    [9, 0.35, 22],
    [5, 1.55, 20],
    [11, 2.6, 24],
    [6, 3.7, 21],
    [4, 4.7, 19],
    [8, 5.6, 23],
  ];
  for (const [w, az, r] of flags) panel(w, 34, az, r, 2, black);
  // A low black card in front, for a dark line along the lower facets.
  panel(40, 3, 0.9, 16, -9, black);
  // Two narrow strip lights between the flags: the crisp edge highlights.
  const strip = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.15, 3.05), side: THREE.DoubleSide, toneMapped: false });
  panel(0.7, 26, 1.05, 17, 3, strip);
  panel(0.5, 26, 4.2, 17, 3, strip);
  // (No coloured light in this room: a flat face that caught it went solid
  // indigo — the rejected "flat purple" — the indigo lives inside the glass.)
  return scene;
}

/** 0 → 1 across [a, b], eased both ends. */
function sweep(S: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (S - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function PlaceEnv() {
  const { gl, scene } = useThree();
  const tex = useRef<{ studio: THREE.Texture | null; white: THREE.Texture | null }>({ studio: null, white: null });

  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const rt = pm.fromScene(whiteStudio(), 0.02, 0.1, 100);
    tex.current.white = rt.texture;
    pm.dispose();
    return () => rt.dispose();
  }, [gl]);

  useFrame(() => {
    const t = tex.current;
    // The studio's baked room is whatever drei's <Environment> left on the scene first.
    if (!t.studio && scene.environment && scene.environment !== t.white) t.studio = scene.environment;
    if (!t.studio) return;
    const S = sceneState.S;
    const inFilm = story.phase === "closed";
    const want = inFilm && S > 2.36 && t.white ? t.white : t.studio;
    if (scene.environment !== want) scene.environment = want;
    const turn = inFilm
      ? 0.32 * Math.max(0, S - 2.2) + 1.1 * sweep(S, 4.7, 5.0) + 1.3 * sweep(S, 8.9, 9.4) + 0.9 * sweep(S, 9.7, 10.6)
      : 0;
    scene.environmentRotation.set(0, turn, 0);
  }, PRIORITY.scene);

  return null;
}
