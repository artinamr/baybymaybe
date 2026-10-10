import * as THREE from "three";
import { PIECE_GLSL } from "./kit";

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
 *   shaft   light falling through the high windows
 *   window  the cathedral's windows and rose, tracery drawn in the shader
 *   halo    a soft glow (the pit, the sun, the moon, the lamp)
 */

export const shared = {
  uTime: { value: 0 },
  /** The chapter's key light colour (dust and shafts take it). */
  uKey: { value: new THREE.Color(1, 0.6, 0.3) },
  uShaft: { value: 1 },
  uDust: { value: 1 },
  /** The windows' light. */
  uWin: { value: new THREE.Color(1, 0.5, 0.2) },
  uWinK: { value: 1 },
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

/** Inject the kit's piece transforms into a built-in material. */
function withPieces(m: THREE.Material, tex: THREE.Texture, extra?: (s: THREE.WebGLProgramParametersWithUniforms) => void, key = "") {
  m.onBeforeCompile = (s) => {
    s.uniforms.uPieces = { value: tex };
    s.vertexShader = s.vertexShader
      .replace("#include <common>", `#include <common>\n${PIECE_GLSL}\nattribute float aRust;\nvarying vec3 vRest;\nvarying float vRustK;\nvarying float vGlow;`)
      .replace("#include <beginnormal_vertex>", `loadPiece();\nvec3 objectNormal = pieceNormal(vec3(normal));`)
      .replace("#include <begin_vertex>", `vec3 transformed = piecePoint(vec3(position));\nvRest = position;\nvRustK = aRust;\nvGlow = pcGlow;`);
    extra?.(s);
  };
  m.customProgramCacheKey = () => `kit-${key}`;
}

/** The old machine's iron. */
export function ironMaterial(tex: THREE.Texture) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 0.82, roughness: 0.48, envMapIntensity: 1 });
  withPieces(
    m,
    tex,
    (s) => {
      s.fragmentShader = s.fragmentShader
        .replace("#include <common>", `#include <common>\n${NOISE}\nvarying vec3 vRest;\nvarying float vRustK;\nvarying float vGlow;`)
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
  float rn = fbm3(vRest * 1.35);
  float rFine = vnoise(vRest * 9.0);
  float rustMask = smoothstep(0.66 - vRustK * 0.36, 0.9 - vRustK * 0.28, rn + rFine * 0.1);
  vec3 rustCol = mix(vec3(0.075, 0.03, 0.014), vec3(0.24, 0.09, 0.03), rFine * rFine);
  diffuseColor.rgb = mix(diffuseColor.rgb, rustCol, rustMask * step(0.001, vRustK));`
        )
        .replace("#include <roughnessmap_fragment>", `float roughnessFactor = mix(roughness + (rFine - 0.5) * 0.12, 0.95, rustMask * step(0.001, vRustK));`)
        .replace("#include <metalnessmap_fragment>", `float metalnessFactor = mix(metalness, 0.2, rustMask * step(0.001, vRustK));`)
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n  totalEmissiveRadiance += vec3(1.0, 0.82, 0.6) * vGlow;`);
    },
    "iron"
  );
  return m;
}

/** Cloth (the person at the crank): matte, not metal. */
export function clothMaterial(tex: THREE.Texture) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 0, roughness: 0.92, envMapIntensity: 0.5 });
  withPieces(
    m,
    tex,
    (s) => {
      s.fragmentShader = s.fragmentShader.replace("#include <common>", `#include <common>\nvarying vec3 vRest;\nvarying float vRustK;\nvarying float vGlow;`);
    },
    "cloth"
  );
  return m;
}

/** Polished black metal for the new machine's frame. */
export function chromeMaterial(tex: THREE.Texture) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 1, roughness: 0.2, envMapIntensity: 1.3 });
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
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vW;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", `#include <common>\n${NOISE}\nvarying vec3 vW;`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n  diffuseColor.rgb *= 0.74 + 0.48 * vnoise(vW * 0.35);`);
  };
  m.customProgramCacheKey = () => "stone";
  return m;
}

const PIECE_VERT_BASIC = /* glsl */ `
${PIECE_GLSL}
attribute vec3 color;
attribute float aAlong;
varying vec3 vCol;
varying float vAlong;
varying float vPow;
varying float vGl;
varying vec3 vN;
varying vec3 vV;
varying float vFog;
void main() {
  loadPiece();
  vec3 p = piecePoint(position);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vCol = color;
  vAlong = aAlong;
  vPow = pcPower;
  vGl = pcGlow;
  vN = normalize(normalMatrix * pieceNormal(normal));
  vV = normalize(-mv.xyz);
  vFog = -mv.z;
  gl_Position = projectionMatrix * mv;
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
        float face = 0.75 + 0.25 * abs(dot(vN, vV));
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
        float ndv = abs(dot(normalize(vN), normalize(vV)));
        // A thin bright edge where the glass turns away; almost nothing face-on.
        float rim = pow(1.0 - ndv, 4.5);
        float sheen = pow(1.0 - ndv, 1.5) * 0.06;
        vec3 edge = mix(vec3(0.32, 0.22, 1.0), vec3(0.92, 0.94, 1.0), smoothstep(0.2, 0.9, rim));
        vec3 c = vCol * (0.012 + sheen) + edge * rim * 0.95 * vCol.g;
        c *= vPow * uK;
        c += vec3(0.75, 0.7, 1.0) * vGl * (0.3 + rim * 2.0);
        float f = fogK(vFog);
        gl_FragColor = vec4(c * (1.0 - f), 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    fog: true,
  });
}

/** The new machine's running light (pulses along `aAlong`). */
export function coreMaterial(tex: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: { uPieces: { value: tex }, uTime: shared.uTime, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, uFlow: { value: 1 } },
    vertexShader: PIECE_VERT_BASIC,
    fragmentShader: /* glsl */ `
      ${FOG_FRAG}
      uniform float uTime; uniform float uFlow;
      varying vec3 vCol; varying float vAlong; varying float vPow; varying float vGl; varying float vFog;
      void main() {
        float ph = fract(vAlong * 0.18 - uTime * 0.55 * uFlow);
        float pulse = smoothstep(0.82, 0.98, ph) * (1.0 - smoothstep(0.98, 1.0, ph));
        vec3 c = vCol * (0.55 + 2.2 * pulse) * vPow + vec3(0.8, 0.75, 1.0) * vGl * 2.0;
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
      varying vec3 vCol; varying vec3 vN; varying vec3 vV; varying float vFog;
      void main() {
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vCol = aColor;
        vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
        vV = normalize(-mv.xyz);
        vFog = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${FOG_FRAG}
      varying vec3 vCol; varying vec3 vN; varying vec3 vV; varying float vFog;
      void main() {
        float ndv = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
        // A glass bead lit from inside: a hot heart, a coloured body, a bright rim.
        vec3 heart = vCol * 1.4 + vec3(0.25) * dot(vCol, vec3(0.33));
        vec3 c = mix(vCol * 0.55, heart, pow(ndv, 1.6));
        c += vCol * pow(1.0 - ndv, 3.0) * 0.8;
        float spec = pow(max(dot(normalize(vN), normalize(vec3(-0.4, 0.75, 0.55))), 0.0), 40.0);
        c += vec3(1.0) * spec * 0.6 * min(1.0, dot(vCol, vec3(0.5)));
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
        float a = smoothstep(0.5, 0.0, length(q));
        gl_FragColor = vec4(uKey * a * vA * 0.5 * uDust, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Light through the high windows: a long soft beam with slow dust in it. */
export function shaftMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uKey: shared.uKey, uShaft: shared.uShaft },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vW;
      void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      ${NOISE}
      uniform float uTime; uniform vec3 uKey; uniform float uShaft;
      varying vec2 vUv; varying vec3 vW;
      void main() {
        float across = 1.0 - abs(vUv.x * 2.0 - 1.0);
        across = pow(across, 2.2);
        float along = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
        float n = vnoise(vec3(vW.x * 0.08, vW.y * 0.05 - uTime * 0.02, vW.z * 0.08));
        float a = across * along * (0.55 + 0.45 * n) * 0.05 * uShaft;
        gl_FragColor = vec4(uKey * a, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

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
      float bar(float x, float w) { return smoothstep(w, w * 0.5, abs(x)); }
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

/** Keep the custom materials' fog in step with the scene's. */
export function syncFog(mats: THREE.ShaderMaterial[], fog: THREE.FogExp2) {
  for (const m of mats) {
    const u = m.uniforms;
    if (u.fogColor) (u.fogColor.value as THREE.Color).copy(fog.color);
    if (u.fogDensity) u.fogDensity.value = fog.density;
  }
}
