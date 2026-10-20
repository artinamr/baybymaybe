import * as THREE from "three";
import { ATMOS_GLSL, bindAtmos } from "./atmos";

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
 * THE HAZE AND THE MIST. three's fog is one density and one colour
 * everywhere; this world wants the air's own: a haze that lies low and thins
 * with height (an extinction a·e^(-b·y), integrated along the ray, so a hill
 * far off fades and a roof seen from above stays clear), coloured by the sky
 * on the horizon in the direction looked (atmos.ts: toward the sunset it is
 * warm, opposite it rose and blue), and a morning mist on the lawns (thick
 * at the ground, gone at the roofs). The fog chunks are patched for every
 * material; the uniforms are shared objects bound by `hookMist` (a
 * material left unhooked falls back to the fog's own colour).
 */
export const MIST = { value: 0 };
export const MIST_H = { value: 6 };
if (!THREE.ShaderChunk.fog_fragment.includes("atmosHaze( fogDir )")) {
  THREE.ShaderChunk.fog_pars_vertex = `#ifdef USE_FOG
	varying float vFogDepth;
	varying vec3 vFogWorld;
#endif`;
  THREE.ShaderChunk.fog_vertex = `#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
	{
		vec4 fogWorld = vec4( transformed, 1.0 );
		#ifdef USE_INSTANCING
			fogWorld = instanceMatrix * fogWorld;
		#endif
		vFogWorld = ( modelMatrix * fogWorld ).xyz;
	}
#endif`;
  THREE.ShaderChunk.fog_pars_fragment = `#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	varying vec3 vFogWorld;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
	uniform float fogMist;
	uniform float fogMistH;
	uniform float fogFall;
	uniform float fogAtmos;
	${ATMOS_GLSL}
#endif`;
  THREE.ShaderChunk.fog_fragment = `#ifdef USE_FOG
	vec3 fogRay = vFogWorld - cameraPosition;
	float fogDist = length( fogRay );
	vec3 fogDir = fogRay / max( fogDist, 1e-3 );
	#ifdef FOG_EXP2
		float fogY0 = max( cameraPosition.y, 0.0 );
		float fogK = fogDir.y * fogFall * fogDist;
		float fogAmt = fogDensity * exp( - fogFall * fogY0 ) * fogDist * ( abs( fogK ) > 1e-4 ? ( 1.0 - exp( - fogK ) ) / fogK : 1.0 );
		float fogFactor = 1.0 - exp( - fogAmt );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	// The mist: the same integral, its own (short) height.
	float mistB = 1.0 / max( fogMistH, 0.1 );
	float mistK = fogDir.y * mistB * fogDist;
	float mist = 1.0 - exp( - fogMist * exp( - mistB * max( cameraPosition.y, 0.0 ) ) * fogDist * ( abs( mistK ) > 1e-4 ? ( 1.0 - exp( - mistK ) ) / mistK : 1.0 ) );
	fogFactor = max( fogFactor, mist );
	vec3 fogC = fogAtmos > 0.5 ? atmosHaze( fogDir ) : fogColor;
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogC, fogFactor );
#endif`;
}
/** Bind the haze's and the mist's uniforms into a material (once, before it compiles). */
export function hookMist(m: THREE.Material) {
  if ((m as { fog?: boolean }).fog === false || (m.userData as { mist?: boolean }).mist) return;
  (m.userData as { mist?: boolean }).mist = true;
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    prev.call(m, sh, r);
    sh.uniforms.fogMist = MIST;
    sh.uniforms.fogMistH = MIST_H;
    bindAtmos(sh.uniforms);
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
  /** The scan: a ring of light crossing the town (x, z, radius, width) and its strength. */
  uScan: { value: THREE.Vector4 };
  uScanK: { value: number };
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
    uScan: { value: new THREE.Vector4(0, 0, 0, 1) },
    uScanK: { value: 0 },
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
uniform float uPoolOn;
uniform vec4 uScan;
uniform float uScanK;
float gHash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float gNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gHash(i), gHash(i + vec2(1.0, 0.0)), f.x), mix(gHash(i + vec2(0.0, 1.0)), gHash(i + vec2(1.0, 1.0)), f.x), f.y);
}`
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
// Close up, the ground has a surface: lawns mottled and mown in stripes,
// the road's tar grained, the footpaths' slabs; far off it settles to its plan.
{
  vec2 wp = vWorld.xz;
  float gd = length(vWorld - cameraPosition);
  float near = exp(-gd / 90.0);
  float lawn = smoothstep(0.015, 0.06, diffuseColor.g - max(diffuseColor.r, diffuseColor.b) * 0.92);
  float n = gNoise(wp * 0.16) * 0.45 + gNoise(wp * 0.55) * 0.3 + gNoise(wp * 2.1) * 0.25;
  diffuseColor.rgb *= 1.0 + (n - 0.5) * (0.26 * lawn + 0.12 * (1.0 - lawn)) * (0.45 + 0.55 * near);
  // Mowing stripes, along each lawn.
  diffuseColor.rgb *= 1.0 + lawn * 0.05 * sign(sin(wp.x * 2.4 + gNoise(wp * 0.05) * 3.0)) * near;
  // Tar: fine grain and darker wheel tracks.
  float tar = (1.0 - lawn) * smoothstep(0.62, 0.52, dot(diffuseColor.rgb, vec3(0.333)));
  float grain = gNoise(wp * 7.0) - 0.5;
  diffuseColor.rgb *= 1.0 + tar * grain * 0.16 * near;
  // Footpath slabs: a joint every 1.5 m.
  float path = (1.0 - lawn) * smoothstep(0.66, 0.74, dot(diffuseColor.rgb, vec3(0.333)));
  vec2 jt = abs(fract(wp / 1.5) - 0.5);
  float joint = smoothstep(0.47, 0.495, max(jt.x, jt.y));
  diffuseColor.rgb *= 1.0 - path * joint * 0.18 * near;
}`
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
totalEmissiveRadiance += pool * uPoolOn * diffuseColor.rgb;
// The scan: a ring crossing the town, a faint wake behind it.
if (uScanK > 0.0) {
  float sd = length(vWorld.xz - uScan.xy);
  float ring = exp(-pow((sd - uScan.z) / max(uScan.w, 0.1), 2.0));
  float wake = smoothstep(uScan.z, uScan.z - 36.0, sd) * 0.05;
  totalEmissiveRadiance += vec3(0.45, 0.36, 1.0) * (ring * 1.8 + wake) * uScanK * (0.35 + 0.65 * diffuseColor.g);
}`
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

/** The town's houses: walls take the house's own colour, roofs a colour from the town's palette (see houseMat). */
export const WALL_WB: [number, number, number] = [0.9, 0.905, 0.91];
export const WALL_SM: [number, number, number] = [0.8, 0.805, 0.81];
export const BASE: [number, number, number] = [0.6, 0.595, 0.57];

/**
 * THE HOUSES' MATERIAL. Each house is one instance of its kind; its walls
 * take the house's colour (the instance colour: warm whites, creams, greys,
 * sage, a few dark modern ones), its roof one of the town's roof colours
 * (Colorsteel greys and charcoals, a few red and green), picked by where it
 * stands. Weatherboard walls are drawn in the shader (a line of shadow under
 * each board's lip, the board a shade lighter toward its foot), fading out
 * where a board falls under a pixel; roofs are steel (a sheen, ribs down
 * the slope). Trim (frames, fascia, sills) stays white.
 */
export function houseMat() {
  const m = withAO(new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.84, metalness: 0 }), 0.35);
  const ao = m.onBeforeCompile;
  const roofs = [0x34322f, 0x45484b, 0x2b2c2e, 0x5c6164, 0x6e3a2e, 0x3d4a3e].map((h) => new THREE.Color(h));
  m.onBeforeCompile = (s, r) => {
    ao(s, r);
    s.uniforms.uRoofs = { value: roofs };
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uRoofs[6];\nvarying vec3 vLocal;\nvarying vec3 vLocalN;\nvarying float vWB;\nvarying float vRoof;")
      .replace(
        "#include <color_vertex>",
        `#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
  vColor = vec4(1.0);
#endif
vLocal = position;
vLocalN = normal;
vWB = 0.0;
vRoof = 0.0;
#ifdef USE_COLOR
{
  float isWB = step(distance(color, vec3(0.9, 0.905, 0.91)), 0.003);
  float isSM = step(distance(color, vec3(0.8, 0.805, 0.81)), 0.003);
  float isRoof = step(distance(color, vec3(0.17, 0.18, 0.2)), 0.003);
  vec3 wallC = vec3(0.86, 0.85, 0.82);
  #ifdef USE_INSTANCING_COLOR
    wallC = instanceColor;
  #endif
  float hr = 0.5;
  #ifdef USE_INSTANCING
    hr = fract(sin(dot(instanceMatrix[3].xz, vec2(7.13, 3.71))) * 9137.31);
  #endif
  vec3 roofC = uRoofs[int(min(5.0, floor(hr * 6.0)))];
  vColor.rgb = isWB + isSM > 0.5 ? wallC : isRoof > 0.5 ? roofC : color;
  vWB = isWB;
  vRoof = isRoof;
}
#endif`
      );
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vLocal;\nvarying vec3 vLocalN;\nvarying float vWB;\nvarying float vRoof;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
// Weatherboards: a line of shadow under each board's lip, each board lighter toward its foot.
if (vWB > 0.5 && abs(vLocalN.y) < 0.5) {
  float yy = vLocal.y / 0.17;
  float fw = fwidth(yy);
  float fade = 1.0 - smoothstep(0.22, 0.55, fw);
  float f = fract(yy);
  float lip = smoothstep(0.84, 1.0, f);
  diffuseColor.rgb *= mix(1.0, (0.95 + 0.07 * (1.0 - f)) * (1.0 - 0.34 * lip), fade);
}
// Steel roofs: a rib every 19 cm down the slope.
if (vRoof > 0.5 && vLocalN.y > 0.15 && vLocalN.y < 0.97) {
  vec2 sd = normalize(vLocalN.xz + 1e-4);
  float rr = dot(vLocal.xz, vec2(-sd.y, sd.x)) / 0.19;
  float fw = fwidth(rr);
  float fade = 1.0 - smoothstep(0.25, 0.6, fw);
  float f = fract(rr);
  float rib = smoothstep(0.0, 0.07, f) * smoothstep(0.2, 0.12, f);
  float side = smoothstep(0.2, 0.26, f) * smoothstep(0.34, 0.27, f);
  diffuseColor.rgb *= mix(1.0, 1.0 + 0.32 * rib - 0.22 * side, fade);
}`
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
if (vRoof > 0.5) {
  roughnessFactor = 0.44;
  metalnessFactor = 0.22;
}`
      );
  };
  m.customProgramCacheKey = () => "house-v1";
  return m;
}
