"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PRIORITY, sceneState } from "@/lib/sceneState";
import { ready } from "@/lib/stores";
import { compileFor } from "./compile";

/**
 * WHAT THE GLASS SEES.
 *
 * The hero and the statement keep StudioEnv — a dark room of narrow strips and
 * broad dim softboxes, which gives the single stone its black silhouette (liked
 * exactly as it is). From the break on the glass is in pieces, every size and
 * every angle, and gets the same kind of room opened up for it: DARK, so the
 * glass keeps its depth (an evenly pale room turned every face grey plastic),
 * with
 *   · a HORIZON of soft light all the way round (the white cove seen far off):
 *     a face at a grazing angle reflects it — Fresnel does the rest — so every
 *     piece, however small, is drawn by a bright edge while the faces turned
 *     toward the lens stay black;
 *   · the hero's narrow strips for the crisp edge lines;
 *   · softboxes with a real light's falloff (a plateau, soft edges, a hotspot)
 *     — a uniform panel caught whole by a flat face reads as a grey card;
 *   · the paper floor bright below, and one deep trace of the brand far back.
 * Baked once (PMREM, the hero room's size — see below), swapped in mid-burst,
 * where the motion hides the change.
 *
 * Past the statement the room TURNS with the scroll, so highlights and edges
 * sweep across the glass the way a product film's lights do.
 */

type Light = [x: number, y: number, z: number, w: number, h: number, intensity: number, color?: string];

/** A softbox: a bright plateau with soft edges and a gentle hotspot. */
function softboxTexture(): THREE.Texture {
  const N = 128;
  const data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const u = ((i + 0.5) / N) * 2 - 1;
      const v = ((j + 0.5) / N) * 2 - 1;
      const r = Math.pow(Math.pow(Math.abs(u), 4) + Math.pow(Math.abs(v), 4), 0.25);
      const edge = 1 - Math.min(1, Math.max(0, (r - 0.5) / 0.5));
      const plateau = edge * edge * (3 - 2 * edge);
      const hot = 0.7 + 0.3 * Math.exp(-(u * u + v * v) * 2.2);
      const k = Math.round(255 * plateau * hot);
      const o = (j * N + i) * 4;
      data[o] = k;
      data[o + 1] = k;
      data[o + 2] = k;
      data[o + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

/** Planes of light facing the stone, as drei's <Lightformer> makes them (with a softbox's falloff when mapped). */
function addLights(scene: THREE.Scene, lights: Light[], map: THREE.Texture | null) {
  for (const [x, y, z, w, h, k, color] of lights) {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color ?? "#ffffff").multiplyScalar(k),
      map,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.position.set(x, y, z);
    m.scale.set(w, h, 1);
    m.lookAt(0, 0, 0);
    scene.add(m);
  }
}

/** The room the glass sees from the break on (see above). */
function openStudio(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#08080B");
  // THE HORIZON: a ring of soft light all the way round.
  {
    const R = 12;
    const geo = new THREE.CylinderGeometry(R, R, 6, 96, 24, true);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const k = HORIZON * Math.exp(-(((y - 0.2) / 0.9) ** 2)) + 0.25 * Math.exp(-(((y - 0.2) / 0.22) ** 2));
      col[i * 3] = k * 0.98;
      col[i * 3 + 1] = k * 0.98;
      col[i * 3 + 2] = k;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, toneMapped: false })));
  }
  const W = "#EFEEE9";
  // Narrow strips — the crisp edge lines (as the hero's, and one more behind).
  addLights(
    scene,
    [
      [-3.2, 1.2, 3.4, 0.16, 9, 9],
      [3.6, 0.6, -2.6, 0.12, 8, 7],
      [0, 5.5, 1, 7, 0.14, 4],
      [0, -0.4, 6, 14, 0.08, 2.5],
      [2.2, 3.5, 4.5, 0.1, 5, 3],
      [-2.6, 2.4, -4.2, 0.1, 6, 4],
      [0, 4.5, 7, 11, 0.1, 3],
    ],
    null
  );
  // Softboxes with falloff: overhead, graded toward the camera side, round the
  // sides and behind; the bright paper floor below.
  const soft = softboxTexture();
  addLights(
    scene,
    [
      [0, 8, 0, 8, 5, 3.0, W],
      [0, 7.6, 5, 12, 2.2, 2.0, W],
      [0, 6.0, 6.3, 12, 1.8, 0.9, W],
      [-6, 5.5, -2, 6, 4, 1.6, W],
      [-7, 1.5, 1, 5, 10, 1.3, W],
      [7, 0.5, 3, 5, 10, 1.1, "#E9E7F2"],
      [6, 2, -5, 4, 8, 0.9, W],
      [0, 2, -9, 13, 7, 0.6, W],
      [0, -6, 0, 20, 20, 1.2, "#F6F5F2"],
      [0, -4, 3, 6, 4, 1.8, "#F6F5F2"],
      [0, -3.5, -4, 7, 4, 1.2, "#F6F5F2"],
    ],
    soft
  );
  // A deep trace of the brand, low and far behind: an occasional dark indigo
  // gradient on a face turned to it (the hero's richness), never a flat fill.
  if (INDIGO > 0) addLights(scene, [[3, -2.5, -8, 7, 4, INDIGO, "#3B2A9E"]], soft);
  return scene;
}

/** Look-dev: `?hz=` the horizon's brightness, `?indigo=` the brand trace. */
const Q = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
const HORIZON = Q?.get("hz") ? Number(Q.get("hz")) : 2.0;
const INDIGO = Q?.get("indigo") ? Number(Q.get("indigo")) : 1.2;
/** Where the ending takes the hero's room back (the camera sinking to the floor). */
const FINALE_S = 9.62;
const FIN_SIGN = Q?.get("fin") ? Number(Q.get("fin")) : 1;

/** 0 → 1 across [a, b], eased both ends. */
function sweep(S: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (S - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** A PMREM of a 512 cube, as three keys programs on it: only its mapping and height. */
const PMREM_SIZE = 512;
function keyOnlyRoom(): THREE.Texture {
  const t = new THREE.Texture();
  t.mapping = THREE.CubeUVReflectionMapping;
  t.image = { width: 3 * PMREM_SIZE, height: 4 * PMREM_SIZE };
  return t;
}

/**
 * The PMREM generator's heavy programs (its GGX convolution alone takes the
 * D3D compiler over a second, and a bake that meets it uncompiled blocks the
 * page while it compiles), compiled off the main thread before the first bake
 * — the bakes are then only draws. Private three API, guarded: without it the
 * bake compiles as it goes (a pause, not a failure).
 */
function warmPMREM(gl: THREE.WebGLRenderer, pm: THREE.PMREMGenerator, room: THREE.Scene): Promise<void> {
  const p = pm as unknown as {
    _setSize?: (n: number) => void;
    _allocateTargets?: () => THREE.WebGLRenderTarget;
    _ggxMaterial?: THREE.Material | null;
    _blurMaterial?: THREE.Material | null;
    _pingPongRenderTarget?: THREE.WebGLRenderTarget | null;
  };
  if (typeof p._setSize !== "function" || typeof p._allocateTargets !== "function") return Promise.resolve();
  try {
    p._setSize(PMREM_SIZE);
    p._allocateTargets().dispose();
    const target = p._pingPongRenderTarget ?? null;
    const passes = new THREE.Scene();
    for (const m of [p._ggxMaterial, p._blurMaterial]) {
      if (!m) continue;
      const q = new THREE.Mesh(new THREE.BufferGeometry(), m);
      q.frustumCulled = false;
      passes.add(q);
    }
    const cam = new THREE.PerspectiveCamera(90, 1, 0.1, 100);
    // (The room's own lights draw into the same kind of target.)
    return Promise.all([compileFor(gl, passes, cam, passes, target), compileFor(gl, room, cam, room, target)]).then(() => undefined);
  } catch {
    return Promise.resolve();
  }
}

export function PlaceEnv() {
  const { gl, scene } = useThree();
  const tex = useRef<{ cube: THREE.Texture | null; studio: THREE.Texture | null; open: THREE.Texture | null }>({ cube: null, studio: null, open: null });
  const bake = useRef<{
    pm: THREE.PMREMGenerator | null;
    room: THREE.Scene | null;
    warm: boolean;
    key: THREE.Texture;
    rts: THREE.WebGLRenderTarget[];
    studioRT: THREE.WebGLRenderTarget | null;
    cubeVersion: number;
  }>({ pm: null, room: null, warm: false, key: keyOnlyRoom(), rts: [], studioRT: null, cubeVersion: -1 });

  // Both rooms are baked by ONE generator (the same size as drei's hero room,
  // 512: the glass's programs are keyed on it, so a different size would
  // recompile every glass program at the swap — a multi-second freeze
  // mid-shatter), its programs warmed first. Meanwhile the scene carries a
  // stand-in with the rooms' key, so the glass's programs compile alongside;
  // nothing draws until the real rooms are in (`ready.env`).
  useEffect(() => {
    let dead = false;
    const b = bake.current;
    const t = tex.current;
    const pm = new THREE.PMREMGenerator(gl);
    const room = openStudio();
    b.pm = pm;
    b.room = room;
    warmPMREM(gl, pm, room).then(() => {
      if (!dead) b.warm = true;
    });
    return () => {
      dead = true;
      for (const rt of b.rts) rt.dispose();
      b.rts = [];
      b.studioRT = null;
      pm.dispose();
      b.pm = null;
      b.warm = false;
      t.studio = t.open = null;
      ready.env = false;
    };
  }, [gl]);

  useFrame(() => {
    const t = tex.current;
    const b = bake.current;
    if (!t.studio) {
      // drei's <Environment> (StudioEnv) leaves the hero room on the scene as a
      // cube map: kept for the bake; the stand-in takes its place meanwhile
      // (a cube map on the scene would make three convert it on the spot,
      // compiling the convolution on the main thread).
      const e = scene.environment;
      if (e && e !== b.key && e.mapping === THREE.CubeReflectionMapping) t.cube = e;
      if (scene.environment !== b.key) scene.environment = b.key;
      ready.envKey = true;
      if (!b.warm || !b.pm || !b.room || !t.cube || !ready.cube) return;
      const studio = b.pm.fromCubemap(t.cube as THREE.CubeTexture);
      const open = b.pm.fromScene(b.room, 0.02, 0.1, 100, { size: PMREM_SIZE });
      b.rts.push(studio, open);
      b.studioRT = studio;
      b.cubeVersion = t.cube.pmremVersion;
      t.studio = studio.texture;
      t.open = open.texture;
      scene.environment = t.studio;
      ready.env = true;
      performance.mark("nd:env");
    } else if (t.cube && b.pm && b.studioRT && t.cube.pmremVersion !== b.cubeVersion) {
      // drei draws the hero room again whenever its <Environment> re-renders
      // (three followed it the same way when it converted the room itself).
      b.pm.fromCubemap(t.cube as THREE.CubeTexture, b.studioRT);
      b.cubeVersion = t.cube.pmremVersion;
    }
    const S = sceneState.S;
    // At the end the stone is whole again, and sees the hero's own room again
    // (swapped while the camera sinks to the floor): the film ends on the
    // look it began with.
    const hero = S <= 2.36 || S >= FINALE_S;
    const want = !hero && t.open ? t.open : t.studio;
    if (scene.environment !== want) scene.environment = want;
    let turn = 0.32 * Math.max(0, S - 2.2) + 1.1 * sweep(S, 4.7, 5.0) + 1.3 * sweep(S, 8.9, 9.4) + 0.9 * sweep(S, 9.7, 10.6);
    // …held round with the camera, so its strips fall on the glass as they do in the hero.
    if (S >= FINALE_S) turn = FIN_SIGN * sceneState.cam.az;
    scene.environmentRotation.set(0, turn, 0);
  }, PRIORITY.scene);

  return null;
}
