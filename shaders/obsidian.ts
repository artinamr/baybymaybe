import * as THREE from "three";
import { fragTex } from "@/lib/fragTex";
import { sceneState } from "@/lib/sceneState";
import { STONE } from "@/lib/geo/types";

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
};

type U<T> = THREE.IUniform<T>;

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
  varying vec3 vFx;      // glow, flash, fade (fragTex texel 7)
  varying vec3 vPulseP;  // world position before the floor mirror — the seam pulse is authored in world space
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
  mat3 obsNormalM = mat3(
    texelFetch(uFragTex, ivec2(4, obsRow), 0).xyz,
    texelFetch(uFragTex, ivec2(5, obsRow), 0).xyz,
    texelFetch(uFragTex, ivec2(6, obsRow), 0).xyz);
  vFx = texelFetch(uFragTex, ivec2(7, obsRow), 0).xyz;
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
  varying vec3 vFx;
  varying vec3 vPulseP;
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
roughnessFactor = mix(roughnessFactor, 0.16, obsCut);
roughnessFactor += (obsNoise(vObs * vec3(0.8, 0.8, 6.0)) - 0.5) * 0.03 * uFlow * (1.0 - obsCut);
`;

/* Conchoidal ripple: the shell-like rings of a fresh obsidian break, as a normal
   tilt along the radial direction from a point on the face's edge. 0.05 reads
   only where the face catches a strip — at specular angles, as the SPEC wants. */
const FRAG_NORMAL = /* glsl */ `
#include <normal_fragment_maps>
float obsRipple = 0.0;
#ifdef OBS_FRAG
  if (obsCut > 0.5) {
    obsRipple = cos(36.0 * length(vRipD));
    float rl = length(vRipV);
    if (rl > 1e-5) normal = normalize(normal + 0.05 * obsRipple * (vRipV / rl));
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

    // Cut faces: light leaking from the crack, brightest toward the face's rim.
    float obsRim = smoothstep(0.55, 1.0, length(vFaceD) / max(vFaceR, 1e-4));
    obsInd += obsCut * (obsGlow * (0.15 + 0.85 * obsRim) * (1.0 + 0.15 * obsRipple) + obsFlash * 0.6);

    // Mark seams: ONLY primary-cut edges (aCrack == 2), only on the outer skin.
    // Distance to the edge in pixels from the barycentric gradient, so the line
    // is ~2px at any zoom. Voronoi edges (type 1) never glow — they show only
    // as physical gaps.
    vec3 obsPx = vBary / max(fwidth(vBary), vec3(1e-6));
    vec3 obsEdge = (1.0 - smoothstep(0.6, 1.8, obsPx)) * step(1.5, vCrack);
    float obsVein = max(obsEdge.x, max(obsEdge.y, obsEdge.z)) * (1.0 - obsCut);
    vec3 obsDp = vPulseP - uPulsePos;
    float obsPulse = uPulseAmp * exp(-dot(obsDp, obsDp) / 0.0036);
    obsInd += obsVein * (uSeam * (0.35 + obsPulse) + obsFlash * 0.9);

    // The thread: a head of light running down one meridian's bevel strip.
    // uThreadRidge = −1 is "off"; aRidge = −1 marks non-ridge geometry.
    if (uThreadRidge > -0.5 && vRidge > -0.5 && abs(vRidge - uThreadRidge) < 0.5) {
      float obsX = (vRidgeT - uThreadHead) / 0.035;
      float obsHead = exp(-obsX * obsX);
      float obsBehind = uThreadHead - vRidgeT;
      float obsTail = 0.25 * step(0.0, obsBehind) * (1.0 - smoothstep(0.14, 0.22, obsBehind));
      obsInd += obsBevel * uThreadAmp * (3.0 * obsHead + obsTail);
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
  float obsM = max(obsE.r, max(obsE.g, obsE.b));
  totalEmissiveRadiance += obsE * min(1.0, 0.9 / max(obsM, 1e-5));
}
`;

/* Fresh fracture has no lacquer: the clearcoat goes on cut faces. */
const FRAG_LIGHTS = /* glsl */ `
#include <lights_physical_fragment>
#ifdef USE_CLEARCOAT
  material.clearcoat *= 1.0 - obsCut;
#endif
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
    obsA *= 0.16 * (1.0 - smoothstep(0.0, 1.1, uFloorY - vWorldY)) * uReflect;
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
    clearcoat: 0.4,
    clearcoatRoughness: 0.018,
    envMapIntensity: 1.3,
    side: THREE.FrontSide,
  });

  const defines: Record<string, string> = { ...(m.defines as Record<string, string>) };
  if (frag) defines.OBS_FRAG = "";
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
    (o.clip ?? "");
  m.customProgramCacheKey = () => key;
  return m;
}
