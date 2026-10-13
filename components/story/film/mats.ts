import * as THREE from "three";

/**
 * THE FILM'S MATERIALS. The world is an architect's model: matte warm white
 * card for everything built, a painted ground, and light (windows, lamps,
 * screens) as the only colour besides the customer's amber and the new
 * system's indigo. Built things carry baked occlusion (model.ts `aAO`).
 */

/*
 * Light culling: three runs the full lighting model for every point and spot
 * light at every pixel, even where a light is off or out of its range. A
 * light it has already found to be dark there (`visible` false) is skipped.
 * The rooms carry several small lights; the town carries none of their cost.
 */
if (!THREE.ShaderChunk.lights_fragment_begin.includes("if ( directLight.visible ) RE_Direct")) {
  THREE.ShaderChunk.lights_fragment_begin = THREE.ShaderChunk.lights_fragment_begin.replace(/(\t+)RE_Direct\( directLight/g, "$1if ( directLight.visible ) RE_Direct( directLight");
}

/** Model white: warm card, slightly tinted per part by vertex colour. */
export const PAPER: [number, number, number] = [0.86, 0.845, 0.815];
export const CARD: [number, number, number] = [0.8, 0.785, 0.755];
export const SHADE: [number, number, number] = [0.6, 0.59, 0.57];
export const INK: [number, number, number] = [0.05, 0.052, 0.06];
export const INDIGO = new THREE.Color(0x5b3df0);
export const AMBER = new THREE.Color(1.0, 0.62, 0.3);

const AO_VERT = /* glsl */ `
attribute float aAO;
varying float vAO;
`;

/**
 * Occlusion: it darkens the light from the sky and the bounce fully and the
 * direct light a little (a model's corners are dark even in the sun).
 */
function withAO(m: THREE.MeshStandardMaterial, direct = 0.35) {
  m.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader.replace("#include <common>", `#include <common>\n${AO_VERT}`).replace("#include <begin_vertex>", "#include <begin_vertex>\nvAO = aAO;");
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vAO;")
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
reflectedLight.indirectDiffuse *= vAO;
reflectedLight.indirectSpecular *= mix(1.0, vAO, 0.6);
reflectedLight.directDiffuse *= mix(1.0, vAO, ${direct.toFixed(2)});`
      );
  };
  m.customProgramCacheKey = () => `model-ao-${direct}`;
  return m;
}

/** The model's white card (walls, roofs, furniture, figures' clothes of card). */
export function modelMat(rough = 0.82, direct = 0.35) {
  return withAO(new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: rough, metalness: 0 }), direct);
}

/** Satin: the figures, a laptop's shell (smoother, a soft sheen). */
export function satinMat(color: THREE.ColorRepresentation = 0xffffff, rough = 0.42, metal = 0) {
  return withAO(new THREE.MeshStandardMaterial({ color, vertexColors: true, roughness: rough, metalness: metal }), 0.2);
}

/** Light itself: windows, lamp shades, screens' glow (unlit; colour per vertex or instance, HDR). */
export function glowMat() {
  return new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, toneMapped: false, fog: true });
}

/** Light that fades with its own alpha (soft cards of light, beams). */
export function veilMat(color: THREE.ColorRepresentation, opacity = 1) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, fog: false });
}

/**
 * The ground: the plan painted on a canvas (roads, paths, lawns, drives),
 * occlusion round everything standing on it (a second canvas, blurred), and
 * the pools of the streetlights and of lit rooms, added as light.
 */
export type GroundUniforms = {
  uAO: { value: THREE.Texture | null };
  uLamps: { value: THREE.Texture | null };
  uLampK: { value: number };
  uPlanBox: { value: THREE.Vector4 };
  uPools: { value: THREE.Vector4[] };
  uPoolCol: { value: THREE.Vector3[] };
  uPoolOn: { value: number };
};

/** Pools of light that move or change one by one (lit rooms); the streetlights are baked (uLamps). */
export const POOLS = 6;

export function groundMat(plan: THREE.Texture, ao: THREE.Texture, lamps: THREE.Texture, box: THREE.Vector4) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, map: plan, roughness: 0.92, metalness: 0 });
  const u: GroundUniforms = {
    uAO: { value: ao },
    uLamps: { value: lamps },
    uLampK: { value: 0 },
    uPlanBox: { value: box },
    uPools: { value: Array.from({ length: POOLS }, () => new THREE.Vector4(0, 0, 1, 0)) },
    uPoolCol: { value: Array.from({ length: POOLS }, () => new THREE.Vector3(1, 0.7, 0.4)) },
    uPoolOn: { value: 1 },
  };
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u);
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWorld;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    s.fragmentShader = s.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vWorld;
uniform sampler2D uAO;
uniform sampler2D uLamps;
uniform float uLampK;
uniform vec4 uPlanBox;
uniform vec4 uPools[${POOLS}];
uniform vec3 uPoolCol[${POOLS}];
uniform float uPoolOn;`
      )
      .replace(
        "#include <aomap_fragment>",
        `#include <aomap_fragment>
vec2 auv = (vWorld.xz - uPlanBox.xy) / uPlanBox.zw;
float gao = texture2D(uAO, auv).r;
reflectedLight.indirectDiffuse *= gao;
reflectedLight.directDiffuse *= mix(1.0, gao, 0.45);`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
// The streetlights' pools (baked), and the few that change (each a soft disc: x, z, radius, power).
vec2 luv = (vWorld.xz - uPlanBox.xy) / uPlanBox.zw;
vec3 pool = vec3(1.0, 0.72, 0.42) * (texture2D(uLamps, luv).r * 1.25 * uLampK);
for (int i = 0; i < ${POOLS}; i++) {
  vec4 p = uPools[i];
  if (p.w <= 0.0) continue;
  vec2 d = vWorld.xz - p.xy;
  float r2 = dot(d, d) / (p.z * p.z);
  float f = exp(-r2 * 2.2) + 0.25 * exp(-r2 * 0.55);
  pool += uPoolCol[i] * (p.w * f);
}
totalEmissiveRadiance += pool * uPoolOn * diffuseColor.rgb;`
      );
  };
  m.customProgramCacheKey = () => "ground";
  return { mat: m, u };
}

/** Bake the occlusion map's sampler settings. */
export function aoTexture(canvas: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.NoColorSpace;
  // Sampled by world position (north at v = 0): no flip.
  t.flipY = false;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 4;
  return t;
}
