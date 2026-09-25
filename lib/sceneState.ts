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

/** useFrame priorities. Keep all ≤ 0 so R3F still auto-renders after them. */
export const PRIORITY = {
  /** Director: evaluate choreography → sceneState, write fragTex. */
  director: -50,
  /** CameraRig: apply sceneState.cam to the camera (+ view offset). */
  camera: -40,
  /** Everything else that reads sceneState (materials, graph, field, flakes, mist…). */
  scene: -30,
  /** lib/project.ts bridge: project to screen, write DOM (after camera, before render). */
  bridge: -10,
} as const;

export type Formation = "F0" | "F1" | "F2" | "F3" | "F4" | "F5" | "F6";

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
    pos: new THREE.Vector3(0, 0, 7.25),
    target: new THREE.Vector3(0, -0.464, 0),
  },

  /** The assembled stone's placement (formations F0/F1/F5/F6 compose on top of it). */
  stone: {
    home: new THREE.Vector3(0, 0, 0),
    /** radians */
    yaw: 0.349,
    pitch: 0,
    bob: 0,
    /** T(home)·R(yaw,pitch)·T(0,bob,0) — the intact stone's object→world. */
    matrix: new THREE.Matrix4(),
    visible: true,
  },

  /** Formation blend the Director is currently evaluating (informational). */
  formation: { a: "F0" as Formation, b: "F0" as Formation, mix: 0 },

  /** Material uniforms the Director drives (shaders/obsidian.ts copies these each frame). */
  u: {
    /** 0..1 mark seams lit on outer faces (aCrack == 2 edges). */
    seam: 0,
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
    /** Reflection strength 0..1 (floor mirror copies). */
    reflect: 1,
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
  },

  /** ch02: world-space left anchor of each tier (0 bottom … 3 top) for the leader lines; focused tier. */
  tiers: {
    anchors: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
    focus: -1,
    visible: false,
  },

  /** ch03 constellation. grow 0..1 (edges), beat 0 none · 1 A (product) · 2 B (workspace). */
  graph: { visible: false, grow: 0, beat: 0, fade: 0 },

  /** ch04 standing-stone field. */
  field: { visible: false, fade: 0 },

  /** Flakes (48 chips shed from the cracks). */
  flakes: { visible: false, amount: 0 },

  /**
   * Stage clip for the ch06 BOOKEND (the intro clip is pure CSS). Insets in % of the
   * viewport, radius px, tint/frame 0..1. active=false → the bridge removes the style.
   */
  clip: { active: false, t: 0, r: 0, b: 0, l: 0, rad: 0, tint: 0, frame: 0 },

  /** ch06: 0..1 how far the mark lock has progressed (for the nav mark echo). */
  mark: { lock: 0 },
};

export type SceneState = typeof sceneState;
