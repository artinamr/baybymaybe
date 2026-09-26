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
 * THE SHARDS — the mark's own cuts (y = bandH, y = 0, x = 0 through the
 * pavilion) split the stone into crown, band and two blades; an anisotropic
 * Voronoi splinters crown and blades along Y like obsidian: 40 shards. The
 * 41st fragment is the CORE — a small whole copy of the stone that lives
 * inside it, full of light, revealed when the stone breaks.
 */
export const SHARD_COUNT = 40;
export const CORE = 40;
export const FRAG_COUNT = 41;

export type Piece = "crown" | "band" | "bladeL" | "bladeR" | "core";

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
  /** 0..3 by volume, largest = 0. */
  tier: number;
  /** 0..3 build order from the culet up; group 3 = band + crown (ch05). The core: −1. */
  group: number;
  /** Halo orbit (ch03): P (product) or W (workspace). */
  cluster: "P" | "W";
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
 *                   (0 none/internal diagonal · 1 Voronoi boundary · 2 primary mark cut)
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
