/**
 * STONE CONSTANTS + GEOMETRY CONTRACT (docs/SPEC.md §1, §4.1–4.2).
 *
 * World units: girdle square side s = 1, +Y up, camera azimuth 0 = camera on +Z
 * looking toward −Z. Right-handed.
 */
import type * as THREE from "three";

export const STONE = {
  /** Girdle square in diamond orientation: corners at (±halfDiag,0,0), (0,0,±halfDiag). */
  halfDiag: 0.70711,
  /** Girdle band: vertical slab y ∈ [0, bandH]. */
  bandH: 0.012,
  /** Crown apex (small offset for life; the crown is cut away in the finale). */
  apex: [0.03, 1.012, -0.02] as const,
  /** Culet — the long lower point. */
  culet: [0, -1.94, 0] as const,
  /** apex.y − culet.y */
  height: 2.952,
  /** Bounding-box centre y. The camera pivot for the whole-stone framings. */
  centerY: -0.464,
  /** Floor plane: culet hovers 0.035 above it. Reflections mirror about it. */
  floorY: -1.975,
  /** Rounded-bevel radius (Minkowski). */
  bevel: 0.01,
} as const;

/** Logo-fit constants — asserted by scripts/mark-fit.mjs against public/new-logo.svg. */
export const MARK = {
  /** Camera elevation (deg) at which the stone projects to the mark. */
  el: 32.91,
  /** Pavilion depth / girdle half-diagonal. */
  depthRatio: 2.745,
  /** Each blade moves ±x by this in the finale (the mark's vertical gap). */
  split: 0.0134,
  /** The band plate lifts by this in the finale (the mark's rhombus→blade gap). */
  lift: 0.028,
} as const;

export const HOME_A: readonly [number, number, number] = [0, 0, 0];
export const HOME_B: readonly [number, number, number] = [0, 0, -52];

/**
 * THE ANATOMY — eight pieces, every cut deliberate (no random fracture):
 *   0 crown   · 1 band            (the mark's own cuts: y = bandH, y = 0)
 *   2–4 blade L, top → tip        (the mark's x = 0 cut, then two LEVEL cuts
 *   5–7 blade R, top → tip         across the pavilion at LEVEL_Y)
 * Layers (the stack, the four work specimens, the method's build order):
 *   3 crown + band · 2 top blades · 1 middle blades · 0 the tips.
 */
export const FRAG_COUNT = 8;

/** The two level cuts across the pavilion (object y). */
export const LEVEL_Y = [-0.6, -1.22] as const;

export type Piece = "crown" | "band" | "bladeL" | "bladeR";

/** Per-fragment facts, fixed at build time. All vectors in STONE object space. */
export type FragInfo = {
  index: number;
  /** Rest position (fragment centroid) inside the intact stone. */
  centroid: THREE.Vector3;
  volume: number;
  piece: Piece;
  /** Unit normal of the fragment's largest cut face (pointing out of the fragment). */
  cutNormal: THREE.Vector3;
  /** Unit burst direction: from the stone's core toward the centroid. */
  out: THREE.Vector3;
  /** Unit principal (longest) axis of the fragment. */
  longAxis: THREE.Vector3;
  /** Extent along longAxis (for layout of formations). */
  length: number;
  /** 0 tips · 1 middle blades · 2 top blades · 3 crown + band. */
  layer: number;
  /** −1 left blade · 0 on the axis (crown, band) · +1 right blade. */
  side: -1 | 0 | 1;
  /** Bounding radius about the centroid. */
  radius: number;
};

/**
 * Vertex attributes of the merged stone geometry (ONE draw call).
 *   position  vec3  fragment-local (relative to its centroid)
 *   normal    vec3  fragment-local; flat on facets/cuts, brush direction on bevels
 *   aFrag     float 0..FRAG_COUNT-1
 *   aKind     float 0 facet · 1 bevel · 2 cut face
 *   aRidge    float 0..3 on bevel strips of MERIDIAN r — the crown ridge to girdle
 *                   corner r, that corner's band edge, and the pavilion ridge from it —
 *                   −1 elsewhere. Corners: 0 = +X, 1 = +Z, 2 = −X, 3 = −Z.
 *   aRidgeT   float (apex.y − y_obj) / height: 0 at the apex, 1 at the culet
 *                   (a thread running down meridian r just animates uThreadHead 0→1)
 *   aBary     vec3  barycentric (1,0,0)/(0,1,0)/(0,0,1) per triangle corner
 *   aCrack    vec3  per corner k: type of the triangle edge OPPOSITE corner k
 *                   (0 none/internal diagonal · 2 primary mark cut · 3 level cut)
 *   aObj      vec3  position in intact-stone object space
 *   aFaceC    vec3  cut-face centroid (object space; 0 for non-cut)
 *   aFaceR    float cut-face radius (max distance centroid→boundary; 0 for non-cut)
 *   aRipO     vec3  conchoidal ripple origin on the cut face's boundary (object space)
 */
export const ATTR = {
  frag: "aFrag",
  kind: "aKind",
  ridge: "aRidge",
  ridgeT: "aRidgeT",
  bary: "aBary",
  crack: "aCrack",
  obj: "aObj",
  faceC: "aFaceC",
  faceR: "aFaceR",
  ripO: "aRipO",
} as const;

export type StoneBuild = {
  /** Merged, non-indexed. ≤ 2.5k triangles. */
  geometry: THREE.BufferGeometry;
  frags: FragInfo[];
  /** The 10 defining hull points (object space) — the bridge projects these for the inversion clip. */
  definingPoints: THREE.Vector3[];
  /** Meridian polylines apex → girdle corner r → culet (object space), index = aRidge (0..3). */
  ridges: THREE.Vector3[][];
  /** Girdle corner nearest the camera at the ch01 crack moment (object space). */
  crackOrigin: THREE.Vector3;
};
