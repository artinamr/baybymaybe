/**
 * SCENE STATE — contract (docs/SPEC.md §10 "SceneState").
 *
 * The single per-frame description of the 3D film. WRITTEN ONLY by
 * components/stage/Director.tsx (from lib/choreo.ts evaluate()) at useFrame
 * priority PRIORITY.director; READ by every other 3D component and by the
 * DOM↔3D bridge (lib/project.ts). All values are plain numbers / preallocated
 * vectors — never reallocate them, mutate in place.
 *
 * Coordinates: world units (docs/SPEC.md §1). Screen fractions are 0..1 from the
 * top-left of the viewport.
 */
import * as THREE from "three";
import { FRAG_COUNT } from "./geo/types";

/** useFrame priorities. Keep all ≤ 0 so R3F still auto-renders after them. */
export const PRIORITY = {
  /** Director: evaluate choreography → sceneState, write fragTex. */
  director: -50,
  /** CameraRig: apply sceneState.cam to the camera (+ view offset). */
  camera: -40,
  /** Everything else that reads sceneState (materials, ground, mist…). */
  scene: -30,
  /** lib/project.ts bridge: project to screen, write DOM (after camera, before render). */
  bridge: -10,
} as const;

export type Formation = "F0" | "F1" | "F2" | "F3" | "F4" | "F7" | "F8";

export const sceneState = {
  /** Global scroll coordinate this frame. */
  S: 0,
  /** Seconds since the page started (monotonic, frozen with &freeze=1). */
  time: 0,
  dt: 0,
  /** Dev `&freeze=1`: time stands still for deterministic screenshots. */
  frozen: false,

  /**
   * Camera (orbit rig): pos = pivot + dist·(sin az·cos el, sin el, cos az·cos el), looking at pivot.
   * az/el/roll in RADIANS. fov in degrees. (ppx, ppy) = where the pivot lands on screen,
   * applied with camera.setViewOffset — never by aiming off-centre.
   * If `path` is true (ch04 corridor), use pos/target directly instead of the orbit.
   */
  cam: {
    pivot: new THREE.Vector3(0, -0.464, 0),
    az: 0,
    el: 0.07,
    dist: 7.25,
    fov: 30,
    ppx: 0.62,
    ppy: 0.5,
    roll: 0,
    path: false,
    /** A hard cut (under a full flood of light): the rig and the shards jump to their goals. */
    cut: false,
    /** 0..1 a short, decaying jolt (the landing), applied by the rig. */
    shake: 0,
    /**
     * How far the film's moving frame (the falling core) moved this frame. The
     * rig adds it to its springs, so the camera rides the fall exactly and its
     * weight only smooths motion relative to it.
     */
    frameDelta: new THREE.Vector3(),
    pos: new THREE.Vector3(0, 0, 7.25),
    target: new THREE.Vector3(0, -0.464, 0),
  },

  /** The intact stone's placement (stone-relative forms compose on top of it). */
  stone: {
    home: new THREE.Vector3(0, 0, 0),
    /** radians */
    yaw: 0.349,
    pitch: 0,
    bob: 0,
    /** T(home)·R(yaw,pitch)·S(scale)·T(0,bob,0) — the intact stone's object→world. */
    matrix: new THREE.Matrix4(),
    /** 1 in the studio and the sky; colossal on the salt flat. */
    scale: 1,
    visible: true,
  },

  /** Formation blend the Director is currently evaluating (informational). */
  formation: { a: "F0" as Formation, b: "F0" as Formation, mix: 0 },

  /**
   * THE PLACES (lib/choreo.ts): how present each environment is, 0..1, and the
   * flood of light that carries the film from the sky to the flat.
   *   mirror  the studio's mirror floor
   *   sky     the sea of cloud below, the far obsidian peaks (what we build)
   *   inCloud passing through a bank of cloud
   *   flat    the salt flat: a mirror to the horizon (why, let's talk)
   *   flood   0..1 light pouring out of the core over the whole frame, from
   *           (floodX, floodY) in screen fractions
   *   ripple  0..1 a ring running out across the flat from the colossus
   *   lake / plain / void / floodLight: retired places, always 0
   */
  env: {
    mirror: 1,
    sky: 0,
    inCloud: 0,
    flat: 0,
    flood: 0,
    floodX: 0.5,
    floodY: 0.5,
    ripple: 0,
    /** 0..1 the falling spiral tears a hole through the cloud deck (the flat shows through it). */
    hole: 0,
    lake: 0,
    plain: 0,
    void: 0,
    floodLight: 0,
  },

  /** Material uniforms the Director drives (shaders/obsidian.ts copies these each frame). */
  u: {
    /** 0..1 mark seams lit on outer faces (aCrack == 2 edges). */
    seam: 0,
    /** 0..1 level seams lit on outer faces (aCrack == 3 edges) — just before the stack parts. */
    levelSeam: 0,
    /** Travelling seam pulse: world-space centre + amplitude. */
    pulsePos: new THREE.Vector3(0, 0, 0),
    pulseAmp: 0,
    /** Ridge thread: meridian index (−1 = off), head 0..1 along aRidgeT, amplitude 0..1. */
    threadRidge: -1,
    threadHead: 0,
    threadAmp: 0,
    /** Global multiplier on cut-face glow (per-fragment glow comes from fragTex). */
    cutGlow: 0,
    /** Alpha fog, view-space depth (world units). */
    fogNear: 60,
    fogFar: 90,
    /** Reflection strength (floor mirror copies; above 1 on the flat at the end — a true mirror). */
    reflect: 1,
    /** How far below the floor the reflection reaches, in stone heights × scale. */
    reflLen: 1.1,
    /** Floor height for reflections / ground effects this frame (world y). */
    floorY: -1.975,
    /** Ground mist: screen-space cutoff (0..1 from top; canvas pixels below this y are not drawn by mist) + alpha. */
    mistClipY: 1,
    mistAlpha: 1,
    /** Indigo spill on the ground under the stone 0..1. */
    spill: 0,
    /** Cursor RectAreaLight intensity. */
    cursorLight: 8,
    /** Indigo veins of light on the stone's outer faces, 0..1 (choreo). */
    vein: 1,
    /** The light inside the glass, seen through the outer faces (0 none … ~1.2 dusk). */
    inner: 0.3,
    /** 0..1 dusk: the page darkens and the stone becomes the light (ch03). */
    dusk: 0,
    /** Floors of light inside the glass at the level cuts (the stack, the build). */
    floors: 0,
    /** 0..1 the light inside wakes and fills the whole stone. */
    wake: 0,
    /** A band of light rising through the glass: height in stone object space, and its strength. */
    riseY: -2,
    riseAmp: 0,
    /**
     * The light that follows the cursor, per piece: where the cursor's ray passes
     * closest to the piece's heart, in stone object space (xyz), and how near the
     * ray passes (w, 0..1). cursorAmt is the global level (pointer active, chapter).
     */
    cursorPiece: Array.from({ length: FRAG_COUNT }, () => new THREE.Vector4(0, -0.4, 0, 0)),
    cursorAmt: 0,
  },

  /** ch02: the focused layer (0 tips … 3 crown, −1 none) while the stack is formed. */
  tiers: { focus: -1, visible: false },

  /**
   * Stage clip for the ch06 BOOKEND (the intro clip is pure CSS). Insets in % of the
   * viewport, radius px, tint/frame 0..1. active=false → the bridge removes the style.
   */
  clip: { active: false, t: 0, r: 0, b: 0, l: 0, rad: 0, tint: 0, frame: 0 },

  /** ch06: 0..1 how far the mark lock has progressed (for the nav mark echo). */
  mark: { lock: 0 },
};

export type SceneState = typeof sceneState;
