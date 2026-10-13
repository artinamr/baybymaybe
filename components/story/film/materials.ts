import * as THREE from "three";
import { PIECE_GLSL } from "./kit";
import { FLOOR_Y as FLOOR_LEVEL } from "./layout";

/**
 * THE FILM'S MATERIALS. Few, cheap, and each with a job:
 *   iron    the old machine: dark metal, rust that grows in patches (noise
 *           in rest space, so it stays on a part as the part falls)
 *   stone   the cathedral: dark, rough, its shapes read by fog and rim light
 *   light   anything that glows (bulbs, tubes, the door, sun and moon): HDR
 *           colour × the piece's power, for flicker and switching off
 *   glass   the new machine: a fresnel edge in indigo and white, added over
 *           the frame (no sorting), brighter where it is assembling
 *   core    the new machine's light, running along its paths in pulses
 *   marble  a customer: a warm bead of light with a hot heart
 *   streak  a falling customer: a stretch of light along its fall
 *   dust    motes in the air, lit by the chapter's light
 *   window  the cathedral's windows and rose, tracery drawn in the shader
 *   halo    a soft glow (the pit, the sun, the moon, the lamp)
 */

export const shared = {
  uTime: { value: 0 },
  /** The chapter's key light colour (the dust takes it). */
  uKey: { value: new THREE.Color(1, 0.6, 0.3) },
  uDust: { value: 1 },
  /** The windows' light. */
  uWin: { value: new THREE.Color(1, 0.5, 0.2) },
  uWinK: { value: 1 },
  /** The rebuilt system taking over, and the old loss well going dark. */
  uRebuild: { value: 0 },
  uPit: { value: 1 },
  uHeroPos: { value: new THREE.Vector3() },
  uHeroK: { value: 0 },
};

const NOISE = /* glsl */ `
float h31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = h31(i), b = h31(i + vec3(1,0,0)), c = h31(i + vec3(0,1,0)), d = h31(i + vec3(1,1,0));
  float e = h31(i + vec3(0,0,1)), g = h31(i + vec3(1,0,1)), h = h31(i + vec3(0,1,1)), k = h31(i + vec3(1,1,1));
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}
float fbm3(vec3 p) { return 0.55 * vnoise(p) + 0.3 * vnoise(p * 2.13 + 3.1) + 0.15 * vnoise(p * 4.37 + 7.7); }
`;

/**
 * THE DEPTH PRE-PASS. The machine is a lattice of beams in front of a hall of
 * piers: most of the frame was shaded two to four times over. Opaque meshes
 * first lay down depth alone (this material, colour off); the full materials
 * then shade only what is seen. Both programs compute gl_Position with the
 * same expressions and declare it invariant, so the depths match exactly
 * (the home film's glass does the same).
 */
const INVARIANT = "invariant gl_Position;\n";
export function depthMaterial(tex: THREE.Texture | null, side: THREE.Side = THREE.FrontSide) {
  return new THREE.ShaderMaterial({
    uniforms: tex ? { uPieces: { value: tex } } : {},
    vertexShader: tex
      ? `${INVARIANT}${PIECE_GLSL}
void main() {
  loadPiece();
  vec3 transformed = piecePoint(vec3(position));
  vec4 mvPosition = vec4(transformed, 1.0);
  mvPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * mvPosition;
}`
      : `${INVARIANT}
void main() {
  vec3 transformed = vec3(position);
  vec4 mvPosition = vec4(transformed, 1.0);
  mvPosition = modelViewMatrix * mvPosition;
  gl_Position = projectionMatrix * mvPosition;
}`,
    fragmentShader: "void main() { gl_FragColor = vec4(0.0); }",
    colorWrite: false,
    side,
  });
}

/**
 * A point light beyond its range, or switched off, adds exactly nothing, but
 * three still evaluates its whole BRDF on every pixel. Most of the hall and
 * the machine are out of reach of all seven point lights, so skip them there.
 * (Same pixels: the skipped term is zero.)
 */
function cullLights(frag: string) {
  const chunk = THREE.ShaderChunk.lights_fragment_begin;
  const point = chunk.indexOf("getPointLightInfo( pointLight, geometryPosition, directLight );");
  const call = chunk.indexOf("RE_Direct( directLight,", point);
  if (point < 0 || call < 0) return frag;
  return frag.replace("#include <lights_fragment_begin>", chunk.slice(0, call) + "if ( directLight.visible ) " + chunk.slice(call));
}

/** Inject the kit's piece transforms into a built-in material. */
function withPieces(m: THREE.Material, tex: THREE.Texture, extra?: (s: THREE.WebGLProgramParametersWithUniforms) => void, key = "") {
  m.onBeforeCompile = (s) => {
    s.uniforms.uPieces = { value: tex };
    s.vertexShader = INVARIANT + s.vertexShader
      .replace("#include <common>", `#include <common>\n${PIECE_GLSL}\nattribute float aRust;\nvarying vec3 vRest;\nvarying vec3 vRestN;\nvarying float vRustK;\nvarying float vGlow;`)
      .replace("#include <beginnormal_vertex>", `loadPiece();\nvec3 objectNormal = pieceNormal(vec3(normal));`)
      .replace("#include <begin_vertex>", `vec3 transformed = piecePoint(vec3(position));\nvRest = position;\nvRestN = normal;\nvRustK = aRust;\nvGlow = pcGlow;`);
    extra?.(s);
    s.fragmentShader = cullLights(s.fragmentShader);
  };
  m.customProgramCacheKey = () => `kit-${key}`;
}

/** The old machine's iron. */
export function ironMaterial(tex: THREE.Texture) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 0.74, roughness: 0.42, envMapIntensity: 1.4 });
  withPieces(
    m,
    tex,
    (s) => {
      s.fragmentShader = s.fragmentShader
        .replace("#include <common>", `#include <common>\n${NOISE}\nvarying vec3 vRest;\nvarying vec3 vRestN;\nvarying float vRustK;\nvarying float vGlow;`)
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
  // Rust where water runs and sits: long vertical runs (a rotated, stretched
  // noise), more on undersides and less on tops, a darker stain at its edge.
  // (Round blotches read as mould.)
  const mat3 ROT = mat3(0.788, -0.408, 0.462, 0.577, 0.707, -0.408, -0.211, 0.577, 0.789);
  vec3 rq = ROT * vRest;
  float rn = fbm3(rq * vec3(1.9, 0.55, 1.9));
  float rFine = vnoise(rq * 11.0);
  float rOn = step(0.001, vRustK);
  float rTh = 0.95 - vRustK * 0.45 - 0.08 * smoothstep(0.3, 0.9, -vRestN.y);
  float rustMask = smoothstep(rTh, rTh + 0.05, rn + (rFine - 0.5) * 0.08) * rOn;
  rustMask *= 1.0 - 0.7 * smoothstep(0.55, 0.85, vRestN.y);
  float stain = smoothstep(rTh - 0.12, rTh, rn) * (1.0 - rustMask) * rOn;
  vec3 rustCol = mix(vec3(0.05, 0.024, 0.014), vec3(0.17, 0.065, 0.026), rFine);
  diffuseColor.rgb = mix(diffuseColor.rgb * (1.0 - 0.3 * stain), rustCol, rustMask);
  float abrasion = pow(vnoise(vRest * vec3(3.0, 28.0, 3.0)), 12.0);
  diffuseColor.rgb += vec3(0.13, 0.15, 0.17) * abrasion * (1.0 - rustMask);`
        )
        .replace("#include <roughnessmap_fragment>", `float roughnessFactor = mix(roughness + stain * 0.15 + (rFine - 0.5) * 0.06, 0.9, rustMask);`)
        .replace("#include <metalnessmap_fragment>", `float metalnessFactor = mix(metalness, 0.15, rustMask);`)
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(1.0, 0.82, 0.6) * vGlow;`);
    },
    "iron"
  );
  return m;
}

/** What a cloth-bucket surface is, carried in the kit's rust attribute. */
export const KIND = { cloth: 0, wood: 0.3, skin: 0.6 } as const;

/** Cloth, wood and skin (the owner's corner): matte, not metal. */
export function clothMaterial(tex: THREE.Texture) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 0, roughness: 0.92, envMapIntensity: 0.5 });
  withPieces(
    m,
    tex,
    (s) => {
      s.fragmentShader = s.fragmentShader
        .replace("#include <common>", `#include <common>\nvarying vec3 vRest;\nvarying vec3 vRestN;\nvarying float vRustK;\nvarying float vGlow;`)
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
  float isWood = step(0.15, vRustK) * step(vRustK, 0.45);
  float isSkin = step(0.45, vRustK) * step(vRustK, 0.75);
  // Wood: a long grain with a little figure in it, along the piece's own length.
  float grain = sin(vRest.x * 150.0 + sin(vRest.z * 9.0) * 2.4 + sin(vRest.x * 4.3 + vRest.z * 2.1) * 2.2) * 0.5 + 0.5;
  diffuseColor.rgb *= mix(1.0, (0.88 + 0.12 * grain) * 0.88, isWood);`
        )
        .replace("#include <roughnessmap_fragment>", `float roughnessFactor = mix(mix(roughness, 0.55, isSkin), 0.46 + 0.1 * grain, isWood);`);
    },
    "cloth"
  );
  return m;
}

/** Polished black metal for the new machine's frame. */
export function chromeMaterial(tex: THREE.Texture) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 0.93, roughness: 0.16, envMapIntensity: 1.8 });
  withPieces(
    m,
    tex,
    (s) => {
      s.fragmentShader = s.fragmentShader
        .replace("#include <common>", `#include <common>\nvarying vec3 vRest;\nvarying float vRustK;\nvarying float vGlow;`)
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(0.55, 0.45, 1.0) * vGlow * 2.0;`);
    },
    "chrome"
  );
  return m;
}

/** The cathedral's stone (static: no pieces). */
export function stoneMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 0.0, roughness: 0.82, envMapIntensity: 0.6 });
  m.onBeforeCompile = (s) => {
    s.vertexShader = INVARIANT + s.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vW;\nvarying vec3 vNw;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvNw = normalize(mat3(modelMatrix) * objectNormal);");
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>\n${NOISE}\nvarying vec3 vW;\nvarying vec3 vNw;\nfloat h21(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }`)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
  // The nave's floor: large slabs in courses, each a little different, worn and
  // polished enough to hold the lamps. Joints and slab-to-slab variation fade
  // with distance (no tiled grid far off); other stone keeps its mottling.
  float isFloor = step(0.9, vNw.y) * (1.0 - step(0.06, abs(vW.y - ${FLOOR_LEVEL.toFixed(1)})));
  vec2 fp = vW.xz / vec2(2.6, 1.7);
  fp.x += 0.5 * step(1.0, mod(floor(fp.y), 2.0));
  vec2 cell = floor(fp);
  vec2 fr = fract(fp);
  vec2 dEdge = min(fr, 1.0 - fr) * vec2(2.6, 1.7);
  float dj = min(dEdge.x, dEdge.y);
  float jw = 0.014 + fwidth(dj) * 0.9;
  float far = smoothstep(22.0, 60.0, length(vViewPosition));
  float joint = (1.0 - smoothstep(jw * 0.5, jw, dj)) * (1.0 - far);
  float hs = h21(cell);
  float hs2 = h21(cell + 17.3);
  float wear = vnoise(vW * vec3(0.7, 0.0, 0.7));
  float slab = mix(0.86 + 0.24 * hs, 1.0, far);
  vec3 fcol = diffuseColor.rgb * slab * mix(vec3(1.0), mix(vec3(1.02, 1.0, 0.97), vec3(0.97, 1.0, 1.03), hs2), 1.0 - far) * (0.92 + 0.16 * wear);
  fcol *= 1.0 - 0.5 * joint;
  float stoneVar = 0.74 + 0.48 * vnoise(vW * 0.35);
  diffuseColor.rgb = mix(diffuseColor.rgb * stoneVar, fcol, isFloor);
  float floorRough = mix(mix(0.36 + 0.26 * hs2 + 0.12 * wear, 0.6, far), 0.92, joint);`
      )
      .replace("#include <roughnessmap_fragment>", "float roughnessFactor = mix(roughness, floorRough, isFloor);");
    s.fragmentShader = cullLights(s.fragmentShader);
  };
  m.customProgramCacheKey = () => "stone";
  return m;
}

const PIECE_VERT_BASIC = /* glsl */ `
${INVARIANT}${PIECE_GLSL}
attribute vec3 color;
attribute float aAlong;
varying vec3 vCol;
varying float vAlong;
varying float vPow;
varying float vGl;
varying vec3 vN;
varying vec3 vV;
varying float vFog;
varying vec3 vWorld;
void main() {
  loadPiece();
  // (Written as the depth pre-pass writes it: the depths must match exactly.)
  vec3 transformed = piecePoint(vec3(position));
  vec3 p = transformed;
  vec4 mvPosition = vec4(transformed, 1.0);
  mvPosition = modelViewMatrix * mvPosition;
  vec4 mv = mvPosition;
  vCol = color;
  vAlong = aAlong;
  vPow = pcPower;
  vGl = pcGlow;
  vN = normalize(normalMatrix * pieceNormal(normal));
  vV = normalize(-mv.xyz);
  vFog = -mv.z;
  vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
  gl_Position = projectionMatrix * mvPosition;
}`;

const FOG_FRAG = /* glsl */ `
uniform vec3 fogColor;
uniform float fogDensity;
float fogK(float d) { return 1.0 - exp(-fogDensity * fogDensity * d * d); }
`;

/** Glowing parts: unlit HDR colour × power (bulbs, tubes, door, lamp, sun, moon). */
export function lightMaterial(tex: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: { uPieces: { value: tex }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 } },
    vertexShader: PIECE_VERT_BASIC,
    fragmentShader: /* glsl */ `
      ${FOG_FRAG}
      varying vec3 vCol; varying float vPow; varying float vFog; varying vec3 vN; varying vec3 vV;
      void main() {
        float f = fogK(vFog);
        // Glowing glass: brightest face-on, falling off toward its edge (a sphere
        // reads as a sphere, a tube as a tube), never a flat card of colour.
        float ndv = abs(dot(normalize(vN), normalize(vV)));
        float face = 0.42 + 0.58 * pow(ndv, 0.7);
        gl_FragColor = vec4(mix(vCol * vPow * face, fogColor, f * 0.85), 1.0);
      }`,
    fog: true,
  });
}

/** The new machine's glass: an edge of light, added over the frame. */
export function glassMaterial(tex: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: { uPieces: { value: tex }, uTime: shared.uTime, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, uK: { value: 1 } },
    vertexShader: PIECE_VERT_BASIC,
    fragmentShader: /* glsl */ `
      ${FOG_FRAG}
      uniform float uTime; uniform float uK;
      varying vec3 vCol; varying float vPow; varying float vGl; varying float vFog; varying vec3 vN; varying vec3 vV;
      void main() {
        float ndv = min(abs(dot(normalize(vN), normalize(vV))), 1.0);
        // A thin bright edge where the glass turns away; almost nothing face-on.
        float rim = pow(1.0 - ndv, 4.5);
        float sheen = pow(1.0 - ndv, 1.5) * 0.06;
        vec3 edge = mix(vec3(0.32, 0.22, 1.0), vec3(0.92, 0.94, 1.0), smoothstep(0.2, 0.9, rim));
        vec3 c = vCol * (0.025 + sheen) + edge * rim * 1.15 * vCol.g;
        c *= vPow * uK;
        c += vec3(0.75, 0.7, 1.0) * vGl * (0.3 + rim * 2.0);
        float f = fogK(vFog);
        gl_FragColor = vec4(c * (1.0 - f), 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: true,
  });
}

/** The new machine's running light (pulses along `aAlong`). */
export function coreMaterial(tex: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: { uPieces: { value: tex }, uTime: shared.uTime, uHeroPos: shared.uHeroPos, uHeroK: shared.uHeroK, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, uFlow: { value: 1 } },
    vertexShader: PIECE_VERT_BASIC,
    fragmentShader: /* glsl */ `
      ${FOG_FRAG}
      uniform float uTime; uniform float uFlow;
      uniform vec3 uHeroPos; uniform float uHeroK;
      varying vec3 vCol; varying float vAlong; varying float vPow; varying float vGl; varying float vFog;
      varying vec3 vWorld;
      void main() {
        float ph = fract(vAlong * 0.18 - uTime * 0.55 * uFlow);
        float pulse = smoothstep(0.82, 0.98, ph) * (1.0 - smoothstep(0.98, 1.0, ph));
        // The customer's own moving pool of light answers them as they pass.
        // It follows physical position, including the gold return spiral.
        vec3 toHero = vWorld - uHeroPos;
        float wake = exp(-dot(toHero, toHero) * 1.25) * uHeroK;
        vec3 c = vCol * (0.55 + 1.6 * pulse + 1.15 * wake) * vPow + vec3(0.8, 0.75, 1.0) * vGl * 2.0;
        float f = fogK(vFog);
        gl_FragColor = vec4(mix(c, fogColor * 0.0, f), 1.0);
      }`,
    fog: true,
  });
}

/** A customer: instanced spheres, a warm bead of light with a hot heart. */
export function marbleMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec3 aColor;
      varying vec3 vCol; varying vec3 vN; varying vec3 vV; varying float vFog; varying vec3 vLocal;
      void main() {
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vCol = aColor;
        vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
        vV = normalize(-mv.xyz);
        vFog = -mv.z;
        // The bead's own frame: the swirl inside turns with it as it rolls.
        vLocal = normalize(normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${FOG_FRAG}
      varying vec3 vCol; varying vec3 vN; varying vec3 vV; varying float vFog; varying vec3 vLocal;
      void main() {
        vec3 n = normalize(vN);
        float ndv = clamp(dot(n, normalize(vV)), 0.0, 1.0);
        // A glass bead with a light inside: a hot heart seen through the glass,
        // the body darker toward the rim (it has depth, not a flat disc), a
        // thin fresnel edge, one crisp highlight. Its brightness is held under
        // a soft ceiling so a close bead stays a bead, not a white blot.
        float peak = max(max(vCol.r, vCol.g), vCol.b);
        vec3 tint = vCol / max(peak, 1e-3);
        float lum = peak / (1.0 + 0.32 * peak);
        float heart = pow(ndv, 4.5);
        vec3 c = tint * lum * (0.07 + 1.25 * heart) + vec3(1.0, 0.92, 0.82) * lum * pow(ndv, 16.0) * 0.55;
        // The swirl: a soft ribbon round the bead in its own frame.
        float band = exp(-pow(dot(vLocal, normalize(vec3(0.35, 1.0, 0.2))) / 0.2, 2.0));
        c += tint * lum * band * (0.3 + 0.7 * heart) * 0.4;
        c += mix(vec3(1.0), tint, 0.5) * pow(1.0 - ndv, 5.0) * 0.4 * min(1.0, lum);
        vec3 h = normalize(normalize(vec3(-0.4, 0.75, 0.55)) + normalize(vV));
        c += vec3(1.0) * pow(max(dot(n, h), 0.0), 140.0) * 1.1 * min(1.0, lum + 0.3);
        float f = fogK(vFog);
        gl_FragColor = vec4(mix(c, fogColor, f * 0.6), 1.0);
      }`,
    fog: true,
  });
}

/**
 * A fall of light: a quad from a falling customer back along its velocity,
 * facing the camera, bright at the head and fading to its tail.
 */
export function streakMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uWidth: { value: 0.09 }, uLen: { value: 0.09 }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec3 aPos;
      attribute vec3 aVel;
      attribute vec3 aColor;
      uniform float uWidth; uniform float uLen;
      varying vec3 vCol; varying vec2 vQ; varying float vFog;
      void main() {
        vec3 head = aPos;
        vec3 tail = aPos - aVel * uLen;
        vec4 h = modelViewMatrix * vec4(head, 1.0);
        vec4 t = modelViewMatrix * vec4(tail, 1.0);
        vec3 dir = h.xyz - t.xyz;
        vec3 side = normalize(cross(dir, h.xyz) + vec3(1e-5, 0.0, 0.0)) * uWidth;
        // position.x: 0 head .. 1 tail; position.y: -1 .. 1 across.
        vec3 p = mix(h.xyz, t.xyz, position.x) + side * position.y * mix(1.0, 0.35, position.x);
        vQ = position.xy;
        vCol = aColor;
        vFog = -h.z;
        gl_Position = projectionMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      ${FOG_FRAG}
      varying vec3 vCol; varying vec2 vQ; varying float vFog;
      void main() {
        float a = (1.0 - vQ.x) * (1.0 - vQ.x) * (1.0 - abs(vQ.y)) * 1.6;
        float f = fogK(vFog);
        gl_FragColor = vec4(vCol * a * (1.0 - f * 0.8), 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: true,
  });
}

/** Motes in the air. Positions are fixed; they drift in the shader. */
export function dustMaterial(px: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uKey: shared.uKey, uDust: shared.uDust, uPx: { value: px } },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime; uniform float uPx;
      varying float vA;
      void main() {
        vec3 p = position;
        float t = uTime * 0.06 + aSeed * 40.0;
        p += vec3(sin(t * 1.3 + aSeed * 9.0), sin(t * 0.7 + aSeed * 3.0) * 0.6 - 0.15 * uTime * 0.06, cos(t * 1.1 + aSeed * 5.0)) * 0.9;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float d = -mv.z;
        gl_PointSize = clamp(uPx * (0.9 + aSeed) / d, 0.0, 9.0);
        vA = smoothstep(0.4, 2.5, d) * (1.0 - smoothstep(30.0, 70.0, d)) * (0.35 + 0.65 * fract(aSeed * 17.0));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uKey; uniform float uDust;
      varying float vA;
      void main() {
        vec2 q = gl_PointCoord - 0.5;
        float a = 1.0 - smoothstep(0.0, 0.5, length(q));
        gl_FragColor = vec4(uKey * a * vA * 0.5 * uDust, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Light through the high windows: a long soft beam with slow dust in it. */
/**
 * The cathedral's glass: a lancet (pointed arch) or a rose, its tracery drawn
 * here. uv in [0,1]; `aKind` 0 lancet, 1 rose.
 */
export function windowMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uWin: shared.uWin, uWinK: shared.uWinK, uTime: shared.uTime, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float aKind;
      varying vec2 vUv; varying float vKind; varying float vFog;
      void main() { vUv = uv; vKind = aKind; vec4 mv = modelViewMatrix * vec4(position, 1.0); vFog = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `
      ${FOG_FRAG}
      uniform vec3 uWin; uniform float uWinK; uniform float uTime;
      varying vec2 vUv; varying float vKind; varying float vFog;
      float bar(float x, float w) { return 1.0 - smoothstep(w * 0.5, w, abs(x)); }
      void main() {
        vec2 p = vUv;
        float glass = 0.0;
        float lead = 0.0;
        if (vKind < 0.5) {
          // A lancet: two arcs meeting in a point over a rectangle.
          vec2 q = vec2(p.x * 2.0 - 1.0, p.y);
          float spring = 0.62;
          float inside;
          if (q.y < spring) inside = step(abs(q.x), 1.0);
          else {
            float dy = (q.y - spring) / (1.0 - spring);
            float r = 2.0;
            float cx = abs(q.x) + 1.0;
            inside = step(length(vec2(r - cx, dy * 1.7)), r);
            inside *= step(0.0, 1.0 - dy);
          }
          glass = inside;
          lead = max(bar(q.x, 0.035), bar(fract(q.y * 7.0) - 0.5, 0.04) * step(q.y, spring));
          lead = max(lead, bar(abs(q.x) - 0.5, 0.03));
        } else {
          vec2 q = p * 2.0 - 1.0;
          float r = length(q);
          float a = atan(q.y, q.x);
          glass = step(r, 1.0);
          float spokes = bar(sin(a * 8.0) * r, 0.05) * step(0.22, r);
          float rings = max(bar(r - 0.22, 0.03), bar(r - 0.62, 0.03));
          float petals = bar(length(vec2(r - 0.8, sin(a * 8.0) * 0.25)) - 0.16, 0.03);
          lead = max(max(spokes, rings), max(petals, bar(r - 0.98, 0.03)));
        }
        float flick = 0.94 + 0.06 * sin(uTime * 0.7 + p.y * 3.0);
        vec3 c = uWin * uWinK * glass * (1.0 - lead * 0.92) * flick * (0.65 + 0.35 * p.y);
        if (glass < 0.5) discard;
        float f = fogK(vFog);
        gl_FragColor = vec4(c * (1.0 - f * 0.55), 1.0);
      }`,
    fog: true,
  });
}

/** A soft round glow (additive). `color` HDR. */
export function haloMaterial(color: THREE.Color, k = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color }, uK: { value: k } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uK;
      varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float a = exp(-r * r * 4.5) * (1.0 - smoothstep(0.85, 1.0, r));
        gl_FragColor = vec4(uColor * a * uK, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Dust reveals the actual direction of the window light and the room's height. */
export function shaftMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uWin: shared.uWin, uWinK: shared.uWinK, uRebuild: shared.uRebuild },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uWin; uniform float uWinK; uniform float uRebuild;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() {
        float ends = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.72, 1.0, vUv.y));
        float face = pow(abs(dot(normalize(vN), normalize(vV))), 1.4);
        vec3 c = mix(uWin, vec3(0.55, 0.66, 1.0), uRebuild * 0.35);
        gl_FragColor = vec4(c * uWinK * ends * face * 0.055, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}

/** Successive rings descend into the loss well. They show how far a fall goes. */
export function pitMarkerMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uPit: shared.uPit },
    vertexShader: /* glsl */ `
      varying float vY;
      void main() { vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uPit; varying float vY;
      void main() {
        float depth = clamp((10.0 - vY) / 40.0, 0.0, 1.0);
        gl_FragColor = vec4(mix(vec3(0.16, 0.035, 0.018), vec3(0.65, 0.035, 0.012), depth) * uPit, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

/** Keep the custom materials' fog in step with the scene's. */
export function syncFog(mats: THREE.ShaderMaterial[], fog: THREE.FogExp2) {
  for (const m of mats) {
    const u = m.uniforms;
    if (u.fogColor) (u.fogColor.value as THREE.Color).copy(fog.color);
    if (u.fogDensity) u.fogDensity.value = fog.density;
  }
}
