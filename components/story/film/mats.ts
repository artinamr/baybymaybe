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

/**
 * MIST ON THE GROUND. three's fog is one density everywhere; the model's
 * mornings want a mist that lies low (thick at the lawns, gone at the
 * roofs). The fog chunks are patched for every material: the vertex keeps
 * its world height, the fragment adds an extinction that falls off with
 * height, by the distance looked through. The strength and the height
 * scale are two uniforms shared by every material the world hooks
 * (`hookMist`); a material left unhooked reads them as zero.
 */
export const MIST = { value: 0 };
export const MIST_H = { value: 6 };
if (!THREE.ShaderChunk.fog_fragment.includes("fogMist")) {
  THREE.ShaderChunk.fog_pars_vertex += `
#ifdef USE_FOG
	varying float vFogY;
#endif`;
  THREE.ShaderChunk.fog_vertex = `#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
	{
		vec4 fogWorld = vec4( transformed, 1.0 );
		#ifdef USE_INSTANCING
			fogWorld = instanceMatrix * fogWorld;
		#endif
		vFogY = ( modelMatrix * fogWorld ).y;
	}
#endif`;
  THREE.ShaderChunk.fog_pars_fragment += `
#ifdef USE_FOG
	varying float vFogY;
	uniform float fogMist;
	uniform float fogMistH;
#endif`;
  THREE.ShaderChunk.fog_fragment = `#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	float mist = 1.0 - exp( - fogMist * exp( - max( vFogY, 0.0 ) / max( fogMistH, 0.1 ) ) * vFogDepth );
	fogFactor = max( fogFactor, mist );
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`;
}
/** Bind the mist's uniforms into a material (once, before it compiles). */
export function hookMist(m: THREE.Material) {
  if ((m as { fog?: boolean }).fog === false || (m.userData as { mist?: boolean }).mist) return;
  (m.userData as { mist?: boolean }).mist = true;
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    prev.call(m, sh, r);
    sh.uniforms.fogMist = MIST;
    sh.uniforms.fogMistH = MIST_H;
  };
  const key = m.customProgramCacheKey;
  m.customProgramCacheKey = () => `${key.call(m)}-mist`;
}

/** The wind's clock (seconds), set by the world each frame. */
export const WIND = { value: 0 };

/**
 * Foliage: the model's card, and a slow wind in it. Every leaf above the
 * trunk sways on its own phase (the tree's place in the town, its height),
 * the crown most, a few centimetres, so no outdoor shot is ever still.
 */
export function foliageMat() {
  const m = withAO(new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.95, metalness: 0 }), 0.5);
  const ao = m.onBeforeCompile;
  m.onBeforeCompile = (s, r) => {
    ao(s, r);
    s.uniforms.uWind = WIND;
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uWind;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
{
  vec3 seat = vec3(0.0);
  #ifdef USE_INSTANCING
  seat = vec3(instanceMatrix[3]);
  #endif
  float h = max(0.0, transformed.y - 1.6);
  float ph = seat.x * 0.21 + seat.z * 0.17;
  float sway = h * 0.014;
  transformed.x += (sin(uWind * 0.9 + ph) + 0.5 * sin(uWind * 2.3 + ph * 1.7 + transformed.y)) * sway;
  transformed.z += (cos(uWind * 0.7 + ph * 1.3) + 0.5 * sin(uWind * 1.9 + ph + transformed.x)) * sway;
}`
      );
  };
  m.customProgramCacheKey = () => "model-ao-0.50-wind";
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
