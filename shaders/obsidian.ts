import * as THREE from "three";
import { fragTex } from "@/lib/fragTex";
import { sceneState } from "@/lib/sceneState";
import { FRAG_COUNT, STONE } from "@/lib/geo/types";
import { hullPlanes, pieceBounds } from "@/lib/geo/crystal";

/**
 * OBSIDIAN — the one material on the page (docs/SPEC.md §4.4, CONTRACTS §3 E2).
 *
 * Stone, fragments, field stones and flakes are all this: a near-black
 * DIELECTRIC under a thin clearcoat. Its look is almost entirely reflection, so
 * StudioEnv (a dark room with narrow bright strips) matters more than any
 * number here. Calibrated on the real GPU: deep black faces, 2–3px silver
 * round-overs on the bevels, a warm bounce on the lower facets.
 *
 * Everything the choreography drives is a UNIFORM shared by every variant
 * (`obsidianUniforms`), copied from sceneState once per frame by
 * syncObsidianUniforms(). Variants differ only by #defines fixed at creation,
 * each with its own customProgramCacheKey — never toggled at runtime.
 *
 * Variants:
 *   frag        the merged 24-fragment stone. The vertex shader fetches each
 *               fragment's model/normal matrix + fx row from fragTex by aFrag and
 *               outputs WORLD space, so the mesh itself keeps an identity matrix
 *               (the reflection mesh carries only the floor mirror).
 *   reflection  a faint mirrored copy below the floor, blended.
 *   instanced   field stones / flakes; optional per-instance aInstFx (glint, fade).
 *   fadePass    (Stone-internal) the blended pass that draws fragments while their
 *               `fade` is between 0 and 1 — see the note at OBS_FADEPASS.
 *
 * Output is FOG-AS-ALPHA, premultiplied, in the opaque pipeline: the canvas is
 * transparent over the real DOM, so a fogged object melts into whatever the
 * page shows behind it — no paper-coloured ghosts, no transparency sorting.
 */

export type ObsidianOpts = {
  frag?: boolean;
  reflection?: boolean;
  instanced?: boolean;
  clip?: "above-floor" | "below-floor" | null;
  /**
   * frag only (Stone.tsx). The opaque frag pass discards fragments whose fade is
   * in flight; this blended pass draws exactly those. Without it a fading crown
   * would write alpha straight to the canvas and punch a paper-coloured hole
   * through the band plate it covers, which then pops in when the fade ends.
   */
  fadePass?: boolean;
  /** Interior ray-march steps (frag only). */
  steps?: number;
};

type U<T> = THREE.IUniform<T>;

/** The intact stone's planes, padded to a fixed count for the shader loop. */
const HULL_N = 16;
const HULL = (() => {
  const h = hullPlanes().slice(0, HULL_N);
  while (h.length < HULL_N) h.push(new THREE.Vector4(0, 1, 0, 1e3));
  return h;
})();

/** Indigo #5B3DF0 in linear RGB. Every emissive is a multiple of this. */
const INDIGO_LIN = new THREE.Vector3(0.1047, 0.0466, 0.872);

export const obsidianUniforms: {
  uTime: U<number>;
  uFragTex: U<THREE.Texture>;
  uSeam: U<number>;
  uPulsePos: U<THREE.Vector3>;
  uPulseAmp: U<number>;
  uThreadRidge: U<number>;
  uThreadHead: U<number>;
  uThreadAmp: U<number>;
  uCutGlow: U<number>;
  uFogNear: U<number>;
  uFogFar: U<number>;
  uReflect: U<number>;
  uFloorY: U<number>;
  uIndigoLin: U<THREE.Vector3>;
  /** Flow-banding kill switch (1 on, 0 off). `?flow=0` turns it off for A/B on the GPU. */
  uFlow: U<number>;
  /** Cut-face base colour #06050C (linear). */
  uCutColor: U<THREE.Color>;
  /** Indigo veins of light on some faces, 0..1 (sceneState.u.vein). */
  uVein: U<number>;
  /** Facet undulation — how far polished-but-knapped facets bend reflections. */
  uUndulate: U<number>;
  /** The light inside, seen through the outer faces (sceneState.u.inner). */
  uInner: U<number>;
  /** Level seams (aCrack == 3) lit 0..1. */
  uLevelSeam: U<number>;
  /** The inner light gathers where the cursor points (stone object space) × amount. */
  uCursorP: U<THREE.Vector4[]>;
  uCursorAmt: U<number>;
  /** 0..1 night (ch03): signals in the glass run faster and brighter. */
  uNight: U<number>;
  /** Floors of light at the level cuts (the stack, the build). */
  uFloors: U<number>;
  /** 0..1 the light inside wakes and fills the whole stone (the story's "light inside"). */
  uWake: U<number>;
  /** A band of light rising through the glass: its height (object space) and strength. */
  uRiseY: U<number>;
  uRiseAmp: U<number>;
  /** The stone's scale: the reflection fades over a distance that grows with it. */
  uReflK: U<number>;
  /** The stone's bounding planes (object, n·x ≤ w) and each piece's cut bounds (yMin, yMax, xSign). */
  uHull: U<THREE.Vector4[]>;
  uPieceBox: U<THREE.Vector3[]>;
} = {
  uTime: { value: 0 },
  uFragTex: { value: fragTex.texture },
  uSeam: { value: 0 },
  uPulsePos: { value: new THREE.Vector3() },
  uPulseAmp: { value: 0 },
  uThreadRidge: { value: -1 },
  uThreadHead: { value: 0 },
  uThreadAmp: { value: 0 },
  uCutGlow: { value: 0 },
  uFogNear: { value: 60 },
  uFogFar: { value: 90 },
  uReflect: { value: 1 },
  uFloorY: { value: STONE.floorY },
  uIndigoLin: { value: INDIGO_LIN },
  uFlow: { value: 1 },
  uCutColor: { value: new THREE.Color("#06050C") },
  uVein: { value: 1 },
  uUndulate: { value: 0.06 },
  uInner: { value: 0.3 },
  uLevelSeam: { value: 0 },
  uCursorP: { value: Array.from({ length: FRAG_COUNT }, () => new THREE.Vector4(0, -0.4, 0, 0)) },
  uCursorAmt: { value: 0 },
  uNight: { value: 0 },
  uFloors: { value: 0 },
  uWake: { value: 0 },
  uRiseY: { value: -2 },
  uRiseAmp: { value: 0 },
  uReflK: { value: 1 },
  uHull: { value: HULL },
  uPieceBox: { value: pieceBounds() },
};

if (typeof window !== "undefined") {
  try {
    if (new URLSearchParams(window.location.search).get("flow") === "0") obsidianUniforms.uFlow.value = 0;
  } catch {
    /* no URL in this context — keep the default */
  }
}

/** Flow banding on/off (the SPEC's kill switch). */
export function setFlowBanding(on: boolean): void {
  obsidianUniforms.uFlow.value = on ? 1 : 0;
}

/*
 * Floor clipping planes (world space, shared). three keeps the POSITIVE side:
 *   above-floor  keeps y ≥ floorY  — field stones buried in the floor
 *   below-floor  keeps y ≤ floorY  — their mirrored reflections
 * Their constants follow uFloorY in syncObsidianUniforms().
 */
const planeAbove = new THREE.Plane(new THREE.Vector3(0, 1, 0), -STONE.floorY);
const planeBelow = new THREE.Plane(new THREE.Vector3(0, -1, 0), STONE.floorY);

/** Copy this frame's sceneState into the shared uniforms. Idempotent; call at PRIORITY.scene. */
export function syncObsidianUniforms(): void {
  const s = sceneState;
  const u = s.u;
  const U = obsidianUniforms;
  U.uTime.value = s.time;
  U.uSeam.value = u.seam;
  U.uPulsePos.value.copy(u.pulsePos);
  U.uPulseAmp.value = u.pulseAmp;
  U.uThreadRidge.value = u.threadRidge;
  U.uThreadHead.value = u.threadHead;
  U.uThreadAmp.value = u.threadAmp;
  U.uCutGlow.value = u.cutGlow;
  U.uFogNear.value = u.fogNear;
  U.uFogFar.value = u.fogFar;
  U.uReflect.value = u.reflect;
  U.uFloorY.value = u.floorY;
  U.uVein.value = u.vein;
  U.uInner.value = u.inner;
  U.uLevelSeam.value = u.levelSeam;
  for (let i = 0; i < FRAG_COUNT; i++) U.uCursorP.value[i].copy(u.cursorPiece[i]);
  U.uCursorAmt.value = u.cursorAmt;
  U.uNight.value = u.dusk;
  U.uFloors.value = u.floors;
  U.uWake.value = u.wake;
  U.uRiseY.value = u.riseY;
  U.uRiseAmp.value = u.riseAmp;
  U.uReflK.value = s.stone.scale;
  planeAbove.constant = -u.floorY;
  planeBelow.constant = u.floorY;
}

/* ------------------------------------------------------------------------ */
/* GLSL                                                                      */
/* ------------------------------------------------------------------------ */

const VERT_PARS = /* glsl */ `
attribute float aKind;
varying vec3 vObs;      // object-space position: flow banding stays fixed to the glass as it breaks
varying float vKind;    // 0 facet · 1 bevel · 2 cut face
varying float vWorldY;  // final world y (after the mesh matrix) — the reflection's fade
#ifdef OBS_FRAG
  uniform highp sampler2D uFragTex;
  attribute float aFrag;
  attribute float aRidge;
  attribute float aRidgeT;
  attribute vec3 aBary;
  attribute vec3 aCrack;
  attribute vec3 aObj;
  attribute vec3 aFaceC;
  attribute float aFaceR;
  attribute vec3 aRipO;
  varying float vRidge;
  varying float vRidgeT;
  varying vec3 vBary;
  varying vec3 vCrack;
  varying vec3 vFaceD;   // aObj − aFaceC (object)
  varying float vFaceR;
  varying vec3 vRipD;    // aObj − aRipO (object) — its length drives the conchoidal ripple
  varying vec3 vRipV;    // the same vector in VIEW space — the ripple's radial direction
  varying vec4 vFx;      // glow, flash, fade, core (fragTex texel 7)
  varying vec3 vPulseP;  // world position before the floor mirror — the seam pulse is authored in world space
  varying vec3 vViewObj; // camera → surface in STONE object space (vein parallax)
  varying mat3 vObjToView; // stone object frame → view (facet undulation stays glued to the glass)
  uniform vec3 uPieceBox[${FRAG_COUNT}];
  varying vec3 vPieceBox;  // this piece's cut bounds (yMin, yMax, xSign) for the interior march
  varying vec3 vFragC;     // this piece's rest centroid (object space): a piece full of light centres on it
  uniform vec4 uCursorP[${FRAG_COUNT}];
  varying vec4 vCursorP;   // the cursor's light inside this piece (object space) + nearness
#endif
#ifdef OBS_INSTANCED
  attribute vec2 aInstFx;
  varying vec2 vInstFx;  // glint, fade
#endif
`;

/* beginnormal_vertex runs BEFORE begin_vertex in three's physical vertex main, so
   the fragment row is fetched here and reused for the position below. */
const VERT_NORMAL = /* glsl */ `
#include <beginnormal_vertex>
#ifdef OBS_FRAG
  int obsRow = int(aFrag + 0.5);
  mat4 obsModel = mat4(
    texelFetch(uFragTex, ivec2(0, obsRow), 0),
    texelFetch(uFragTex, ivec2(1, obsRow), 0),
    texelFetch(uFragTex, ivec2(2, obsRow), 0),
    texelFetch(uFragTex, ivec2(3, obsRow), 0));
  // Formations scale non-uniformly (floor plates), so normals take the real
  // inverse-transpose the Director baked, not the model 3×3.
  vec4 obsN0 = texelFetch(uFragTex, ivec2(4, obsRow), 0);
  vec4 obsN1 = texelFetch(uFragTex, ivec2(5, obsRow), 0);
  vec4 obsN2 = texelFetch(uFragTex, ivec2(6, obsRow), 0);
  mat3 obsNormalM = mat3(obsN0.xyz, obsN1.xyz, obsN2.xyz);
  vFragC = vec3(obsN0.w, obsN1.w, obsN2.w);
  vFx = texelFetch(uFragTex, ivec2(7, obsRow), 0);
  objectNormal = obsNormalM * objectNormal;
#endif
`;

const VERT_BEGIN = /* glsl */ `
#include <begin_vertex>
#ifdef OBS_FRAG
  // Fragment-local → WORLD. modelMatrix is identity (or the floor mirror) from here on.
  transformed = (obsModel * vec4(transformed, 1.0)).xyz;
  vObs = aObj;
  vRidge = aRidge;
  vRidgeT = aRidgeT;
  vBary = aBary;
  vCrack = aCrack;
  vFaceD = aObj - aFaceC;
  vFaceR = aFaceR;
  vRipD = aObj - aRipO;
  // Linear in the vertex position, so it interpolates exactly across the face.
  vRipV = mat3(modelViewMatrix) * (mat3(obsModel) * vRipD);
  vPulseP = transformed;
  // Rotation-only inverse (formations that scale are floor plates, far from any vein close-up).
  vViewObj = transpose(mat3(obsModel)) * (transformed - cameraPosition);
  vObjToView = normalMatrix * obsNormalM;
  vPieceBox = uPieceBox[obsRow];
  vCursorP = uCursorP[obsRow];
#else
  vObs = position;
#endif
vKind = aKind;
#ifdef OBS_INSTANCED
  vInstFx = aInstFx;
#endif
`;

const VERT_PROJECT = /* glsl */ `
#include <project_vertex>
{
  vec4 obsW = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    obsW = instanceMatrix * obsW;
  #endif
  vWorldY = (modelMatrix * obsW).y;
}
`;

const FRAG_PARS = /* glsl */ `
uniform float uTime;
uniform float uSeam;
uniform float uPulseAmp;
uniform vec3 uPulsePos;
uniform float uThreadRidge;
uniform float uThreadHead;
uniform float uThreadAmp;
uniform float uCutGlow;
uniform float uFogNear;
uniform float uFogFar;
uniform float uReflect;
uniform float uFloorY;
uniform float uFlow;
uniform vec3 uIndigoLin;
uniform vec3 uCutColor;
uniform float uVein;
uniform float uUndulate;
uniform float uInner;
uniform float uLevelSeam;
uniform float uCursorAmt;
uniform float uNight;
uniform float uFloors;
uniform float uWake;
uniform float uRiseY;
uniform float uRiseAmp;
uniform float uReflK;
uniform vec4 uHull[16];
varying vec3 vObs;
varying float vKind;
varying float vWorldY;
#ifdef OBS_FRAG
  varying float vRidge;
  varying float vRidgeT;
  varying vec3 vBary;
  varying vec3 vCrack;
  varying vec3 vFaceD;
  varying float vFaceR;
  varying vec3 vRipD;
  varying vec3 vRipV;
  varying vec4 vFx;
  varying vec3 vPulseP;
  varying vec3 vViewObj;
  varying mat3 vObjToView;
  varying vec3 vPieceBox;
  varying vec3 vFragC;
  varying vec4 vCursorP;
#endif
#ifdef OBS_INSTANCED
  varying vec2 vInstFx;
#endif

float obsHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float obsNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(obsHash(i), obsHash(i + vec3(1, 0, 0)), f.x),
        mix(obsHash(i + vec3(0, 1, 0)), obsHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(obsHash(i + vec3(0, 0, 1)), obsHash(i + vec3(1, 0, 1)), f.x),
        mix(obsHash(i + vec3(0, 1, 1)), obsHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}

/* Veins of light. A slanted plane coordinate bent by LOW-frequency noise gives
   a few long meandering lines (marble veining), never speckle or cells — both
   of those were rejected. A second noise masks them to some regions only, so
   some faces carry a vein and others stay clean black glass. Lines are drawn
   to a fixed PIXEL width via fwidth, with a soft halo, and light runs along
   them slowly. */
float obsVeinField(vec3 p, float deep, float blur) {
  float warp = obsNoise(p * vec3(0.8, 0.55, 0.8) + 4.3) * 1.7 + obsNoise(p * 1.9 + 1.1) * 0.3;
  float s = dot(p, vec3(0.42, 0.78, 0.2)) * 1.6 + warp;
  float d = abs(fract(s) - 0.5);
  float fw = max(fwidth(s), 1e-5);
  // blur (in periods) widens a vein like light out of focus deep in the glass — and dims it.
  float core = 1.0 - smoothstep(0.0, max(fw * mix(1.1, 2.6, deep), blur), d);
  float halo = exp(-d / max(fw * mix(4.5, 8.0, deep), blur * 2.2));
  float defocus = blur > 0.0 ? clamp(fw * 2.5 / blur, 0.3, 1.0) : 1.0;
  core *= defocus;
  halo *= defocus;
  // Seen edge-on, a face packs many vein periods into a few pixels and they
  // alias into zebra stripes: fade out once a pixel spans too much of a period.
  float dense = 1.0 - smoothstep(0.08, 0.22, fw);
  core *= dense;
  halo *= dense;
  float mask = smoothstep(0.36, 0.58, obsNoise(p * 0.72 + 11.0));
  // Width breathes along the line so it reads as a vein, not a drawn stroke.
  float along = dot(p, vec3(-0.3, 0.25, 0.92)) * 1.4 + warp * 0.8;
  float body = 0.45 + 0.55 * obsNoise(vec3(along * 2.0, s * 0.5, 3.7));
  float run = smoothstep(0.62, 1.0, 0.5 + 0.5 * sin(along * 2.4 - uTime * 0.85));
  return mask * body * (core * 0.85 + halo * 0.3) * (0.6 + 0.9 * run);
}

/* The same veins, deeper in the glass: turned so they cross the sections on
   long diagonals, sparser, and carrying SIGNALS — pulses of light running
   along them (faster and brighter at night: the stone at work). */
float obsDeepVein(vec3 p, float deep, float blur) {
  vec3 q = p.yzx * vec3(1.0, 1.0, 0.8) + vec3(2.7, 0.0, 5.3);
  float warp = obsNoise(q * vec3(0.7, 0.5, 0.7) + 8.1) * 1.5;
  float s = dot(q, vec3(0.5, 0.74, 0.3)) * 1.45 + warp;
  float d = abs(fract(s) - 0.5);
  float fw = max(fwidth(s), 1e-5);
  float core = 1.0 - smoothstep(0.0, max(fw * mix(1.1, 2.4, deep), blur), d);
  float halo = exp(-d / max(fw * mix(4.0, 7.0, deep), blur * 2.2));
  float defocus = blur > 0.0 ? clamp(fw * 2.5 / blur, 0.3, 1.0) : 1.0;
  float dense = 1.0 - smoothstep(0.08, 0.22, fw);
  float mask = smoothstep(0.46, 0.66, obsNoise(q * 0.6 + 3.0));
  float along = dot(q, vec3(-0.35, 0.3, 0.88)) * 1.3 + warp * 0.6;
  float speed = 0.7 + 2.1 * uNight;
  float sig = smoothstep(0.86, 1.0, 0.5 + 0.5 * sin(along * 3.1 - uTime * speed));
  return mask * dense * defocus * (core * 0.8 + halo * 0.28) * (0.45 + (0.9 + 1.6 * uNight) * sig);
}

#ifdef OBS_FRAG
/* THE LIGHT INSIDE. Obsidian is glass: what makes it precious is depth. Every
   pixel looks INTO the piece: the view ray refracts at the surface and runs
   through the glass until it leaves (its exact exit, from the stone's planes
   and the piece's own cuts), and on the way it meets
     · veins of light at five depths — the same vein field as the surface (the
       client's "veins"), crisp at any zoom, sliding against each other with
       parallax as the stone turns, dimmer the deeper they lie;
     · a soft glow gathered toward the stone's heart and wherever the cursor
       points — the light answers the hand.
   Object space, so it is continuous across the cuts: open the stone and the
   light inside lines up. Returns (light, depth-heat) — heat tints the colour. */
/* The cursor's light, inside this piece: a soft halo with a hot heart. */
float obsCursor(vec3 p) {
  vec3 dc = p - vCursorP.xyz;
  float r2 = dot(dc, dc);
  return uCursorAmt * vCursorP.w * (exp(-r2 * 9.0) + 1.6 * exp(-r2 * 70.0));
}

float obsGlowField(vec3 p) {
  // A small core of light low in the pavilion, breathing slowly.
  vec3 h = p - vec3(0.0, -0.62, 0.0);
  float heart = exp(-(dot(h.xz, h.xz) * 7.0 + h.y * h.y * 2.4));
  float drift = 0.7 + 0.3 * sin(dot(p, vec3(2.1, 1.3, 1.7)) + uTime * 0.4);
  // Floors of light inside the glass at the level cuts: when the stack parts,
  // each section wells up with light from its centre.
  float fy = exp(-p.y * p.y * 55.0) + exp(-(p.y + 0.6) * (p.y + 0.6) * 55.0) + exp(-(p.y + 1.22) * (p.y + 1.22) * 55.0);
  float floors = uFloors * fy * exp(-dot(p.xz, p.xz) * 2.6) * (0.75 + 0.25 * drift);
  // A fragment full of light (the core crystal, a chosen lead): luminous
  // through its whole body, centred on its own middle.
  vec3 hc = p - vFragC;
  float full = vFx.w * 0.1 * exp(-dot(hc, hc) * 0.8) * (0.8 + 0.2 * drift);
  // Awake: a broad light from the stone's middle, breathing, filling the glass.
  vec3 wc = p - vec3(0.0, -0.55, 0.0);
  float awake = uWake * exp(-dot(wc, wc) * 1.6) * (0.75 + 0.25 * sin(uTime * 1.3 + p.y * 2.0));
  // A band of light rising through the glass (the monument powering up).
  float rise = uRiseAmp * exp(-(p.y - uRiseY) * (p.y - uRiseY) * 30.0) * (0.7 + 0.3 * drift);
  return heart * drift * 0.16 + floors * 1.1 + full + awake * 0.55 + rise * 0.9;
}

vec3 obsInterior(vec3 ro, vec3 rd, bool full) {
  float tMax = 2.2;
  for (int i = 0; i < 16; i++) {
    vec4 pl = uHull[i];
    float dn = dot(rd, pl.xyz);
    if (dn > 1e-4) tMax = min(tMax, (pl.w - dot(ro, pl.xyz)) / dn);
  }
  if (rd.y > 1e-4) tMax = min(tMax, (vPieceBox.y - ro.y) / rd.y);
  else if (rd.y < -1e-4) tMax = min(tMax, (vPieceBox.x - ro.y) / rd.y);
  if (vPieceBox.z * rd.x < -1e-4) tMax = min(tMax, -ro.x / rd.x);
  tMax = clamp(tMax, 0.0, 2.2);
  if (tMax < 0.004) return vec3(0.0);

  // Veins at depth.
  float lines = 0.0;
  float heat = 0.0;
  for (int k = 0; k < 4; k++) {
    float d = 0.04 + 0.14 * float(k) + 0.03 * float(k * k);
    float inside = 1.0 - smoothstep(tMax - 0.03, tMax, d);
    float T = exp(-2.4 * d);
    vec3 pk = ro + rd * d;
    // Veins near the cursor wake: the glass answers the hand.
    float fk = float(k);
    if (!full && k >= 2) break;
    float v = obsDeepVein(pk + vec3(0.0, 0.0, 0.37 * fk), 0.35 + 0.16 * fk, 0.008 * fk * fk) * T * inside * (1.0 + 3.5 * obsCursor(pk));
    lines += v;
    heat += v * T;
  }

  // The soft glow.
  // Through the outer faces the glow is faint: half the samples.
  int N = full ? OBS_STEPS : OBS_STEPS / 2;
  float dt = tMax / float(N);
  float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  float glow = 0.0;
  float cur = 0.0;
  float T = 1.0;
  float k = exp(-2.2 * dt);
  for (int i = 0; i < OBS_STEPS; i++) {
    if (i >= N) break;
    vec3 p = ro + rd * ((float(i) + jit) * dt);
    glow += obsGlowField(p) * T * dt;
    cur += obsCursor(p) * T * dt;
    T *= k;
  }
  // (light, depth-heat, the cursor's light — weighted separately by the caller)
  return vec3(lines * 0.95 + glow, heat * 0.95 + glow * 0.4, cur * 1.25);
}
#endif
`;

/* Pass ownership, decided first so dead fragments skip all lighting. */
const FRAG_CLIP = /* glsl */ `
#include <clipping_planes_fragment>
#ifdef OBS_FRAG
  #ifdef OBS_FADEPASS
    if (vFx.z <= 0.002) discard;
  #elif !defined(OBS_REFLECT)
    if (vFx.z > 0.002) discard;
  #endif
#endif
`;

const FRAG_COLOR = /* glsl */ `
#include <color_fragment>
float obsBevel = step(0.5, vKind) * step(vKind, 1.5);
float obsCut = step(1.5, vKind);
diffuseColor.rgb = mix(diffuseColor.rgb, uCutColor, obsCut);
`;

/* Bevels are the polished round-overs (the edge highlight); cut faces are fresh
   fracture. Flow banding is a roughness WOBBLE seen only inside strip
   reflections — never a texture — so it stays at ±0.015 and off the cuts. */
const FRAG_ROUGH = /* glsl */ `
#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.035, obsBevel);
roughnessFactor = mix(roughnessFactor, 0.07, obsCut);
roughnessFactor += (obsNoise(vObs * vec3(0.8, 0.8, 6.0)) - 0.5) * 0.03 * uFlow * (1.0 - obsCut);
`;

/* Conchoidal ripple: the shell-like rings of a fresh obsidian break, as a normal
   tilt along the radial direction from a point on the face's edge. 0.05 reads
   only where the face catches a strip — at specular angles, as the SPEC wants. */
const FRAG_NORMAL = /* glsl */ `
#include <normal_fragment_maps>
float obsRipple = 0.0;
// Knapped, then polished: facets are never optically flat. A LOW-frequency
// tilt field (object space, so it stays glued to the glass as it turns) bends
// the studio strips into flowing highlights across each face instead of one
// flat tone — the difference between black glass and a black cut-out.
#ifdef OBS_FRAG
  if (vKind < 0.5) {
    vec3 obsQ = vObs * 1.15;
    vec3 obsW = vec3(obsNoise(obsQ + 1.7), obsNoise(obsQ + 9.2), obsNoise(obsQ + 17.3)) - 0.5;
    obsW += 0.35 * (vec3(obsNoise(obsQ * 2.3 + 5.1), obsNoise(obsQ * 2.3 + 2.9), obsNoise(obsQ * 2.3 + 8.4)) - 0.5);
    vec3 obsWv = vObjToView * obsW;
    obsWv -= dot(obsWv, normal) * normal;
    normal = normalize(normal + uUndulate * 2.0 * obsWv);
  }
#endif
#ifdef OBS_FRAG
  if (obsCut > 0.5) {
    float obsRippleArg = 36.0 * length(vRipD);
    // Same anti-alias for the conchoidal rings at grazing angles.
    obsRipple = cos(obsRippleArg) * (1.0 - smoothstep(0.6, 1.6, fwidth(obsRippleArg)));
  }
#endif
`;

/* Every indigo term is summed as a scalar on uIndigoLin, then clamped so the
   brightest channel stays ≤ 0.9: above that NeutralToneMapping starts rolling
   indigo toward lavender, and pale violet is the banned periwinkle. */
const FRAG_EMISSIVE = /* glsl */ `
#include <emissivemap_fragment>
{
  float obsInd = 0.0;
  #ifdef OBS_FRAG
    float obsGlow = vFx.x * uCutGlow;
    float obsFlash = vFx.y;

    // Cut faces: a whisper of light right at the rim (the seam), and a flash on a seat.
    float obsRim = smoothstep(0.82, 1.0, length(vFaceD) / max(vFaceR, 1e-4));
    obsInd += obsCut * (obsGlow * 0.12 * obsRim + obsFlash * 0.35);

    // Mark seams: ONLY primary-cut edges (aCrack == 2), only on the outer skin.
    // Distance to the edge in pixels from the barycentric gradient, so the line
    // is ~2px at any zoom. Voronoi edges (type 1) never glow — they show only
    // as physical gaps.
    vec3 obsPx = vBary / max(fwidth(vBary), vec3(1e-6));
    vec3 obsLine = 1.0 - smoothstep(0.6, 1.8, obsPx);
    vec3 obsMarkE = obsLine * step(1.5, vCrack) * step(vCrack, vec3(2.5));
    vec3 obsLevelE = obsLine * step(2.5, vCrack);
    float obsVein = max(obsMarkE.x, max(obsMarkE.y, obsMarkE.z)) * (1.0 - obsCut);
    float obsLevel = max(obsLevelE.x, max(obsLevelE.y, obsLevelE.z)) * (1.0 - obsCut);
    vec3 obsDp = vPulseP - uPulsePos;
    float obsPulse = uPulseAmp * exp(-dot(obsDp, obsDp) / 0.0036);
    obsInd += obsVein * (uSeam * (0.35 + obsPulse) + obsFlash * 0.9);
    obsInd += obsLevel * (uLevelSeam * 0.8 + obsFlash * 0.9);

    // The thread: a head of light running down one meridian's bevel strip.
    // uThreadRidge = −1 is "off"; aRidge = −1 marks non-ridge geometry.
    if (uThreadRidge > -0.5 && vRidge > -0.5 && abs(vRidge - uThreadRidge) < 0.5) {
      float obsX = (vRidgeT - uThreadHead) / 0.035;
      float obsHead = exp(-obsX * obsX);
      float obsBehind = uThreadHead - vRidgeT;
      float obsTail = 0.25 * step(0.0, obsBehind) * (1.0 - smoothstep(0.14, 0.22, obsBehind));
      obsInd += obsBevel * uThreadAmp * (3.0 * obsHead + obsTail);
    }

    // Veins: a crisp line at the surface and a softer copy sampled a little
    // way INTO the glass along the view ray — it slides against the first as
    // the stone turns, so the light reads as inside the stone, not painted on.
    if (obsCut < 0.5 && uVein > 0.001) {
      vec3 obsVd = normalize(vViewObj);
      float obsV = obsVeinField(vObs, 0.0, 0.0) + 0.5 * obsVeinField(vObs + obsVd * 0.09, 1.0, 0.0);
      obsInd += uVein * obsV * (1.0 - vFx.z);
    }
  #endif
  #ifdef OBS_INSTANCED
    // Glint (station stones, hover): a slow run of light down the bevels —
    // the thread's vocabulary, never a facet wash.
    if (vInstFx.x > 0.001) {
      float obsPh = fract(vObs.y * 0.35 + uTime * 0.55) - 0.5;
      float obsBand = exp(-(obsPh * obsPh) / 0.0025);
      obsInd += vInstFx.x * obsBevel * (0.3 + 2.2 * obsBand);
    }
  #endif
  vec3 obsE = uIndigoLin * obsInd;
  #ifdef OBS_FRAG
    // The light inside: strong through a polished cut (a window into the
    // glass), faint through the outer faces (dark glass, mostly reflection).
    // vFx.w: a fragment full of light seen through its outer faces (the core).
    float obsWin = obsCut > 0.5 ? vFx.x * uCutGlow * 1.2 + vFx.y * 0.8 : uInner * (0.55 + 0.45 * vFx.x) * 0.2 + vFx.w * 0.34 + uWake * 0.9;
    obsWin *= 1.0 - vFx.z;
    if (obsWin > 0.002) {
      vec3 obsRd = normalize(vViewObj);
      vec3 obsNo = normalize(transpose(vObjToView) * normal);
      vec3 obsRi = refract(obsRd, obsNo, 0.671);
      if (dot(obsRi, obsRi) < 1e-4) obsRi = obsRd;
      vec3 obsIn = obsInterior(vObs - obsNo * 0.002, normalize(obsRi), obsCut > 0.5);
      // Fresnel: at grazing angles the surface is a mirror and hides the inside.
      float obsFr = pow(1.0 - clamp(dot(-obsRd, obsNo), 0.0, 1.0), 4.0);
      // The cursor's light reads through the outer faces too — the stone answers the hand.
      float obsCurW = (obsCut > 0.5 ? 1.2 : 0.4) * (1.0 - vFx.z);
      float obsL = (obsIn.x * obsWin + obsIn.z * obsCurW) * (1.0 - 0.85 * obsFr);
      float obsH = clamp((obsIn.y + obsIn.z * 0.6) / max(obsIn.x + obsIn.z, 1e-4), 0.0, 1.0);
      // Deep indigo in the depths, brand indigo where it gathers, never lighter than #6B4BFF.
      vec3 obsDeep = vec3(0.035, 0.016, 0.34);
      vec3 obsHot = vec3(0.147, 0.068, 1.0);
      vec3 obsC = mix(obsDeep, mix(uIndigoLin, obsHot, smoothstep(0.55, 1.0, obsL)), smoothstep(0.0, 0.7, obsH));
      obsE += obsC * obsL * 2.6;
    }
  #endif
  float obsM = max(obsE.r, max(obsE.g, obsE.b));
  totalEmissiveRadiance += obsE * min(1.0, 0.9 / max(obsM, 1e-5));
}
`;

/* The cuts are sawn and POLISHED sections (windows into the glass): they keep
   the lacquer, a little softer than the facets. */
const FRAG_LIGHTS = /* glsl */ `
#include <lights_physical_fragment>
#ifdef USE_CLEARCOAT
  material.clearcoat *= 1.0 - 0.65 * obsCut;
#endif
`;

/* A section seen from above would mirror the studio's white ceiling as a flat
   grey card; the cuts keep half their environment reflection, so they read as
   dark windows with a sheen, the light inside showing through. */
const FRAG_LIGHTS_END = /* glsl */ `
#include <lights_fragment_end>
reflectedLight.indirectSpecular *= 1.0 - 0.5 * obsCut;
`;

/* FOG AS ALPHA — the last word on gl_FragColor (after tone mapping + sRGB).
   Opaque variants run with NoBlending, so this premultiplied pair lands in the
   canvas as-is and the compositor blends it over the DOM. Fully fogged
   fragments are discarded so they write no depth. */
const FRAG_TAIL = /* glsl */ `
#include <dithering_fragment>
{
  float obsFogT = clamp((vViewPosition.z - uFogNear) / max(uFogFar - uFogNear, 1e-3), 0.0, 1.0);
  float obsF = obsFogT * obsFogT * (3.0 - 2.0 * obsFogT);
  #ifdef OBS_FRAG
    obsF = max(obsF, vFx.z);
  #endif
  #ifdef OBS_INSTANCED
    obsF = max(obsF, vInstFx.y);
  #endif
  float obsA = 1.0 - obsF;
  vec3 obsRgb = gl_FragColor.rgb;
  #ifdef OBS_REFLECT
    // A mirror floor reflects only what stands above it.
    if (vWorldY > uFloorY + 1e-3) discard;
    obsA *= 0.16 * (1.0 - smoothstep(0.0, 1.1 * uReflK, uFloorY - vWorldY)) * uReflect;
    obsRgb *= 0.85;
  #endif
  if (obsA < 0.004) discard;
  gl_FragColor = vec4(obsRgb * obsA, obsA);
}
`;

function inject(src: string, chunk: string, code: string): string {
  const tag = `#include <${chunk}>`;
  if (!src.includes(tag)) throw new Error(`obsidian: three shader chunk ${tag} not found`);
  return src.replace(tag, code);
}

function patchVertex(src: string): string {
  let s = inject(src, "common", `#include <common>\n${VERT_PARS}`);
  s = inject(s, "beginnormal_vertex", VERT_NORMAL);
  s = inject(s, "begin_vertex", VERT_BEGIN);
  s = inject(s, "project_vertex", VERT_PROJECT);
  return s;
}

function patchFragment(src: string): string {
  let s = inject(src, "common", `#include <common>\n${FRAG_PARS}`);
  s = inject(s, "clipping_planes_fragment", FRAG_CLIP);
  s = inject(s, "color_fragment", FRAG_COLOR);
  s = inject(s, "roughnessmap_fragment", FRAG_ROUGH);
  s = inject(s, "normal_fragment_maps", FRAG_NORMAL);
  s = inject(s, "emissivemap_fragment", FRAG_EMISSIVE);
  s = inject(s, "lights_physical_fragment", FRAG_LIGHTS);
  s = inject(s, "lights_fragment_end", FRAG_LIGHTS_END);
  s = inject(s, "dithering_fragment", FRAG_TAIL);
  return s;
}

/** three reads this off any material for attributes the geometry lacks. */
type WithDefaults = THREE.MeshPhysicalMaterial & { defaultAttributeValues?: Record<string, number[]> };

/**
 * Create an obsidian material. Every call shares `obsidianUniforms`, so one
 * syncObsidianUniforms() per frame drives them all.
 */
export function createObsidian(o: ObsidianOpts = {}): THREE.MeshPhysicalMaterial {
  const frag = !!o.frag;
  const reflection = !!o.reflection;
  const instanced = !!o.instanced;
  const fadePass = !!o.fadePass && frag && !reflection;

  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#07080C"),
    metalness: 0,
    roughness: 0.085,
    ior: 1.49,
    specularIntensity: 1,
    // A second, glassier lacquer over the body: two reflections at slightly
    // different depths are what make polished obsidian look deep, not flat.
    clearcoat: 0.85,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.5,
    side: THREE.FrontSide,
  });

  const defines: Record<string, string> = { ...(m.defines as Record<string, string>) };
  if (frag) defines.OBS_FRAG = "";
  defines.OBS_STEPS = String(o.steps ?? 10);
  if (reflection) defines.OBS_REFLECT = "";
  if (instanced) defines.OBS_INSTANCED = "";
  if (fadePass) defines.OBS_FADEPASS = "";
  m.defines = defines;

  if (reflection || fadePass) {
    // Premultiplied output + (ONE, ONE_MINUS_SRC_ALPHA): same convention as the
    // opaque passes, so the transparent canvas composites identically.
    m.transparent = true;
    m.premultipliedAlpha = true;
    // The fade pass keeps depth so a fading piece still hides its own far side.
    m.depthWrite = fadePass;
  }

  if (o.clip) m.clippingPlanes = [o.clip === "above-floor" ? planeAbove : planeBelow];

  // Flakes / plain shards may lack aKind; instanced meshes may lack aInstFx.
  (m as WithDefaults).defaultAttributeValues = { aKind: [0], aInstFx: [0, 0] };

  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, obsidianUniforms);
    shader.vertexShader = patchVertex(shader.vertexShader);
    shader.fragmentShader = patchFragment(shader.fragmentShader);
  };

  const key =
    "obsidian:" +
    (frag ? "f" : "-") +
    (reflection ? "r" : "-") +
    (instanced ? "i" : "-") +
    (fadePass ? "x" : "-") +
    (o.steps ?? 10) +
    (o.clip ?? "");
  m.customProgramCacheKey = () => key;
  return m;
}
