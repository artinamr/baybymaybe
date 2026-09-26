"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { story } from "@/lib/story";

/**
 * WHAT THE GLASS SEES, PLACE BY PLACE. The studio's room (StudioEnv — a dark
 * studio and softboxes, tuned for black glass on white paper) is right for the
 * hero; out in the sky and on the salt flat the obsidian must reflect the
 * world it is in, or every shard reads as a flat black cut-out. Two small
 * rooms are baked once with PMREM and swapped in as the places change:
 *
 *   sky   a bright horizon over a grey sea of cloud, a cool zenith, a low sun
 *   flat  a white horizon all round, a pale glaring flat below, an overcast
 *         zenith — a black monolith on a salt pan
 *
 * Facets facing the camera stay dark (glass reflects ~8% head-on); the ones
 * turned away catch the horizon as bright bands — which is what makes black
 * glass read as glass.
 */

type Stops = { nadir: number; below: number; horizon: number; above: number; zenith: number; tint: [number, number, number] };

function room(stops: Stops, sun: THREE.Vector3 | null, sunPower: number): THREE.Scene {
  const scene = new THREE.Scene();
  const geo = new THREE.SphereGeometry(40, 64, 32);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const [tr, tg, tb] = stops.tint;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 40;
    let k: number;
    if (y >= 0) {
      // A narrow band of light at the horizon, a darker sky above it.
      const band = Math.exp(-y * 30);
      k = stops.above + (stops.zenith - stops.above) * Math.pow(y, 0.6) + (stops.horizon - stops.above) * band;
    } else {
      const band = Math.exp(y * 36);
      k = stops.nadir + (stops.below - stops.nadir) * Math.pow(1 + y, 2) + (stops.horizon - stops.below) * band * 0.7;
    }
    colors[i * 3] = k * tr;
    colors[i * 3 + 1] = k * tg;
    colors[i * 3 + 2] = k * tb;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false });
  scene.add(new THREE.Mesh(geo, mat));
  if (sun) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 8), new THREE.MeshBasicMaterial({ toneMapped: false }));
    s.material.color.setRGB(sunPower, sunPower * 0.97, sunPower * 0.92);
    s.position.copy(sun).normalize().multiplyScalar(34);
    scene.add(s);
  }
  return scene;
}

export function PlaceEnv() {
  const { gl, scene } = useThree();
  const tex = useRef<{ studio: THREE.Texture | null; sky: THREE.Texture | null; flat: THREE.Texture | null }>({ studio: null, sky: null, flat: null });
  const sunDir = useMemo(() => new THREE.Vector3(0.75, 0.42, -0.35), []);

  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const sky = room({ nadir: 0.16, below: 0.34, horizon: 1.7, above: 0.32, zenith: 0.1, tint: [0.97, 0.98, 1.0] }, sunDir, 16);
    const flat = room({ nadir: 0.2, below: 0.42, horizon: 1.8, above: 0.28, zenith: 0.08, tint: [1.0, 0.995, 0.985] }, null, 0);
    const skyRT = pm.fromScene(sky, 0.02, 0.1, 100);
    const flatRT = pm.fromScene(flat, 0.02, 0.1, 100);
    tex.current.sky = skyRT.texture;
    tex.current.flat = flatRT.texture;
    pm.dispose();
    return () => {
      skyRT.dispose();
      flatRT.dispose();
    };
  }, [gl, sunDir]);

  useFrame(() => {
    const t = tex.current;
    // The studio's baked room is whatever drei's <Environment> left on the scene first.
    if (!t.studio && scene.environment && scene.environment !== t.sky && scene.environment !== t.flat) t.studio = scene.environment;
    if (!t.studio) return;
    const env = sceneState.env;
    let want: THREE.Texture | null = t.studio;
    if (story.phase === "closed") {
      if (env.flat > 0.5 && t.flat) want = t.flat;
      else if (env.sky > 0.5 && t.sky) want = t.sky;
    }
    if (want && scene.environment !== want) scene.environment = want;
  }, PRIORITY.scene);

  return null;
}
