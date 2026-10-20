import * as THREE from "three";
import { ATMOS_GLSL, bindAtmos } from "./atmos";
import { MIST, MIST_H } from "./mats";

/**
 * THE LAND ROUND THE TOWN: the suburb sits at the head of a bay. Its
 * northern street is the beach road: a grass verge under pohutukawa, a low
 * sea wall, the sand, and the harbour, a volcanic island on the water (a
 * low, even cone under dark bush, as Auckland has) and the far shore, low
 * and blue. Either side, the coast runs out to headlands; to the south,
 * east and west, paddocks with shelter belts rise into hills, bush in the
 * gullies and on the tops. Everything far fades into the haze of its own
 * direction (atmos.ts), so the hills stand in layers, each paler than the
 * one in front.
 *
 * The town's own ground (town.ts, the painted plan) covers the box the town
 * stands in; the land starts at its edge in the lawn's own colour.
 */

/** The town's box (the plan and a margin): the land stays under it. North, it ends at the beach road's verge. */
export const BOX_X = 168;
export const BOX_ZN = 104;
export const BOX_ZS = 148;
/** The sea's level. */
export const SEA_Y = -1.2;
/** The island's centre and size. */
export const ISLAND = { x: 400, z: -1080, r: 400, h: 112 };
/** How far a point is outside the town's box (0 inside). */
export function outside(x: number, z: number) {
  const dx = Math.max(Math.abs(x) - BOX_X, 0);
  const dz = z < 0 ? Math.max(-z - BOX_ZN, 0) : Math.max(z - BOX_ZS, 0);
  return Math.hypot(dx, dz);
}

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
function fbm(x: number, y: number, oct = 5) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x * f, y * f);
    f *= 2.02;
    a *= 0.5;
  }
  return s;
}
/** Ridged noise: sharp crests (hill tops), soft valleys. */
function ridged(x: number, y: number) {
  let s = 0;
  let a = 0.55;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    const n = 1 - Math.abs(vnoise(x * f, y * f) * 2 - 1);
    s += a * n * n;
    f *= 2.1;
    a *= 0.5;
  }
  return s;
}
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Where the waterline runs (its z at x): straight past the town, then out to a headland either side. */
export function coastZ(x: number) {
  const along = Math.abs(x) < 175 ? 0 : 1;
  return -124 + 2.5 * Math.sin(x / 31) * along - 210 * smoothstep(-180, -720, x) - 160 * smoothstep(180, 640, x) * (1 - 0.5 * smoothstep(900, 1400, x)) + 14 * Math.sin(x / 57 + 1.1) * smoothstep(175, 260, Math.abs(x));
}

/** The land's height at (x, z): metres above the sea (the sea is at -0.4). */
export function landH(x: number, z: number): number {
  const e = outside(x, z);
  // The hills: farther out, higher (soonest to the south); ridged tops over a rolling base.
  const base = fbm(x / 420 + 11.3, z / 420 - 4.1) * 2 - 0.55;
  const ridge = ridged(x / 520 + 3.7, z / 520 + 8.2);
  const reach = z > 0 ? 620 : 900;
  const rise = Math.pow(smoothstep(0, reach, e), 1.1);
  let h = 1.0 * smoothstep(0, 70, e) + rise * (30 + 125 * ridge + 40 * base) + smoothstep(0, 220, e) * 6 * fbm(x / 90, z / 90, 3);
  // The south: a ridge closing the view, bush along its top.
  h += 70 * smoothstep(380, 640, z) * (0.6 + 0.4 * ridged(x / 260, 3.3)) * (1 - smoothstep(1400, 2000, z));
  // The north: the verge, the sand sloping to the water, the bay deepening out.
  const cz = coastZ(x);
  if (z < cz + 30) h = (Math.abs(x) < 175 ? 0.05 : h) * smoothstep(cz + 6, cz + 30, z);
  // Below the sea wall the sand drops, then runs gently down to the water.
  const drop = Math.abs(x) < 172 ? smoothstep(cz + 15.6, cz + 14.6, z) : smoothstep(cz + 15, cz - 1, z);
  h = h * (1 - drop) + drop * (SEA_Y + 0.55 - 0.47 * smoothstep(cz + 14, cz - 1, z));
  const under = smoothstep(cz - 1, cz - 30, z);
  h = h * (1 - under) + under * (SEA_Y - 0.6 - 9 * smoothstep(cz, cz - 240, z));
  // The far shore across the harbour.
  const far = smoothstep(-2050, -2350, z + 120 * Math.sin(x / 380));
  h = Math.max(h, far * (14 + 60 * ridged(x / 300, z / 300)) - (1 - far) * 30);
  // The island.
  const ir = Math.hypot(x - ISLAND.x, z - ISLAND.z) / ISLAND.r;
  if (ir < 1.25) {
    const cone = ISLAND.h * Math.pow(Math.max(0, 1 - ir), 1.55) - 9 * Math.exp(-ir * ir * 160);
    h = Math.max(h, cone + 1.2 * (1 - smoothstep(0.95, 1.2, ir)) + SEA_Y - 0.2);
  }
  // Under the town's own ground.
  if (e <= 0) return -0.3;
  return h * smoothstep(0, 6, e) - 0.02 * (1 - smoothstep(0, 6, e));
}

const LAWN = new THREE.Color("#a7b98f");
const GRASS_A = new THREE.Color("#8ea36a");
const GRASS_B = new THREE.Color("#71894f");
const BUSH = new THREE.Color("#2e4a2f");
const BUSH_DARK = new THREE.Color("#22382a");
const SAND = new THREE.Color("#d9ccb1");
const ROCK = new THREE.Color("#6f6a5f");

const HAY = new THREE.Color("#b6ad7a");
function landColour(x: number, z: number, h: number, slope: number, out: THREE.Color) {
  const e = outside(x, z);
  out.copy(GRASS_A).lerp(GRASS_B, fbm(x / 140 + 5, z / 140, 3));
  // Paddocks: a patchwork of greens, a few cut for hay.
  const pad = hash(Math.floor(x / 90), Math.floor(z / 70));
  out.multiplyScalar(0.84 + pad * 0.3);
  if (pad > 0.86) out.lerp(HAY, 0.55);
  // Bush in the gullies and on the higher, steeper ground.
  const bush = smoothstep(0.52, 0.64, fbm(x / 230 - 7, z / 230 + 2, 4) + slope * 0.6 + smoothstep(40, 120, h) * 0.25);
  out.lerp(BUSH, bush * smoothstep(30, 120, e));
  // The island is all bush.
  const ir = Math.hypot(x - ISLAND.x, z - ISLAND.z) / ISLAND.r;
  if (ir < 1.1) out.lerp(BUSH_DARK, smoothstep(1.1, 0.85, ir) * (0.75 + 0.25 * fbm(x / 60, z / 60, 2)));
  // Rock on the steepest faces; sand at the water, wet and darker at its edge; the sea floor.
  out.lerp(ROCK, smoothstep(0.55, 0.9, slope) * 0.7);
  const cz = coastZ(x);
  const sand = smoothstep(cz + 15, cz + 9, z) * (h < 1.5 ? 1 : 0);
  // Next to the town: its lawn (and the beach road's verge).
  out.lerp(LAWN, (1 - smoothstep(0, 40, e)) * (1 - sand));
  out.lerp(SAND, sand);
  out.multiplyScalar(1 - 0.35 * smoothstep(cz + 3, cz - 1, z));
  if (h < SEA_Y - 0.3) out.copy(SAND).multiplyScalar(0.55);
  return out;
}

const SEA_VERT = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
varying vec3 vWorld;
void main() {
  vec3 transformed = position;
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  vWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// The sea: the sky reflected in a moving surface (a few octaves of
// travelling ripples, softened with distance so far water reads as a sheen,
// not as noise), a path of light under a low sun or the moon, a deep colour
// lit by the sky where the surface looks down.
const SEA_FRAG = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
uniform float uTime;
uniform vec3 uMoonDir;
uniform float uMoonOn;
uniform float uLight;
varying vec3 vWorld;
vec2 wave(vec2 p, vec2 dir, float freq, float speed, float t) {
  float ph = dot(p, dir) * freq + t * speed;
  // Slope of a sharpened sine (crests narrow, troughs wide).
  float s = cos(ph) * exp(sin(ph) - 1.0);
  return dir * s * freq;
}
void main() {
  vec3 ray = vWorld - cameraPosition;
  float dist = length(ray);
  vec3 V = ray / dist;
  vec2 p = vWorld.xz;
  float t = uTime;
  vec2 g = vec2(0.0);
  g += wave(p, normalize(vec2(0.8, 0.6)), 0.09, 0.9, t) * 0.55;
  g += wave(p, normalize(vec2(-0.5, 0.86)), 0.21, 1.3, t) * 0.3;
  g += wave(p, normalize(vec2(0.95, -0.3)), 0.47, 1.9, t) * 0.15;
  g += wave(p, normalize(vec2(-0.2, -0.98)), 1.13, 2.7, t) * 0.07;
  g += wave(p, normalize(vec2(0.6, -0.8)), 2.6, 3.6, t) * 0.03;
  // Far off, the ripples fall below a pixel: the surface calms to a sheen.
  g *= exp(-dist / 700.0) * 0.75 + 0.25 * exp(-dist / 150.0);
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  float cosV = max(dot(-V, N), 0.0);
  float F = 0.02 + 0.98 * pow(1.0 - cosV, 5.0);
  vec3 R = reflect(V, N);
  R.y = abs(R.y);
  vec3 sky = atmosSky(R);
  vec3 deep = mix(vec3(0.012, 0.03, 0.04), vec3(0.03, 0.075, 0.085), clamp(aSun.y * 3.0 + 0.3, 0.0, 1.0)) * uLight;
  deep += aHor * 0.04;
  vec3 col = mix(deep, sky, F);
  // The path of light: the sun's (and the moon's) glitter on the ripples.
  float sp = pow(max(dot(R, aSun), 0.0), 900.0) * 60.0 + pow(max(dot(R, aSun), 0.0), 60.0) * 0.6;
  col += aGlow * sp * aSunVis;
  float mp = pow(max(dot(R, normalize(uMoonDir)), 0.0), 700.0) * 8.0 + pow(max(dot(R, normalize(uMoonDir)), 0.0), 40.0) * 0.05;
  col += vec3(0.75, 0.82, 1.0) * mp * uMoonOn;
  // The wash along the town's beach: a broken line of white where the water meets the sand.
  if (abs(vWorld.x) < 172.0) {
    float edge = vWorld.z - (-124.0);
    float surge = 0.6 + 0.6 * sin(t * 0.7 + vWorld.x * 0.05);
    float foam = smoothstep(-3.5, -0.4, edge - surge) * (1.0 - smoothstep(-0.4, 0.4, edge - surge));
    foam *= 0.55 + 0.45 * sin(vWorld.x * 1.3 + t * 1.1) * sin(vWorld.x * 0.37 - t * 0.6);
    col = mix(col, aHor * 0.6 + vec3(0.06), clamp(foam, 0.0, 1.0) * 0.8 * uLight);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

export type Land = {
  group: THREE.Group;
  sea: THREE.ShaderMaterial;
  mats: THREE.Material[];
  update: (time: number, night: number, moon: THREE.Vector3) => void;
};

export function buildLand(scene: THREE.Scene): Land {
  const group = new THREE.Group();
  scene.add(group);

  // The land: a polar grid round the town, its rings closer near the middle.
  const rings = 72;
  const seg = 420;
  const r0 = 90;
  const r1 = 2300;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const c = new THREE.Color();
  const H: number[] = [];
  const RX: number[] = [];
  const RZ: number[] = [];
  for (let j = 0; j <= rings; j++) {
    const t = j / rings;
    const r = r0 * Math.pow(r1 / r0, t);
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      RX.push(x);
      RZ.push(z);
      H.push(landH(x, z));
    }
  }
  for (let v = 0; v < H.length; v++) pos.push(RX[v], H[v], RZ[v]);
  for (let j = 0; j < rings; j++)
    for (let i = 0; i < seg; i++) {
      const a = j * (seg + 1) + i;
      const b = a + seg + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const nrm = g.getAttribute("normal");
  for (let v = 0; v < H.length; v++) {
    const ny = Math.max(0.05, nrm.getY(v));
    const slope = Math.min(1, Math.sqrt(1 - ny * ny) / ny);
    landColour(RX[v], RZ[v], H[v], slope, c);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  const landMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.94, metalness: 0 });
  const land = new THREE.Mesh(g, landMat);
  land.receiveShadow = true;
  group.add(land);

  // Bush: low crowns over the bush's ground (the gullies, the tops, the island), dark and close-set.
  {
    const crowns: THREE.Matrix4[] = [];
    const R = (n: number) => hash(n * 1.37 + 0.11, n * 0.71 + 5.3);

    // Shelter belts: dark rows along some paddock edges, near the town.
    for (let gx = -16; gx <= 16; gx++)
      for (let gz = -14; gz <= 14; gz++) {
        if (hash(gx + 0.31, gz - 0.77) < 0.45) continue;
        const alongX = hash(gx * 3.1, gz * 1.7) < 0.5;
        const x0 = gx * 90;
        const z0 = gz * 70;
        const len = alongX ? 90 : 70;
        for (let t = 0; t < len; t += 6.5) {
          const x = alongX ? x0 + t : x0;
          const z = alongX ? z0 : z0 + t;
          const ex = outside(x, z);
          if (ex < 30 || ex > 900) continue;
          const h = landH(x, z);
          if (h < 0.6) continue;
          const sc = 3.2 + hash(x, z) * 1.6;
          crowns.push(new THREE.Matrix4().compose(new THREE.Vector3(x, h + sc * 0.55, z), new THREE.Quaternion(), new THREE.Vector3(sc * 0.75, sc * 1.25, sc * 0.75)));
        }
      }
    for (let i = 0; i < 26000 && crowns.length < 6200; i++) {
      const a = R(i) * Math.PI * 2;
      const r = 175 + Math.pow(R(i + 9000), 0.7) * 1500;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const h = landH(x, z);
      if (h < 1.2) continue;
      landColour(x, z, h, 0.2, c);
      // Only where the ground is bush (dark).
      if (c.g > 0.1) continue;
      const s = 3 + R(i + 300) * 4.5 + Math.min(4, r / 300);
      crowns.push(new THREE.Matrix4().compose(new THREE.Vector3(x, h - s * 0.25, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R(i + 77) * 6, 0)), new THREE.Vector3(s, s * (0.7 + R(i + 11) * 0.4), s)));

    }
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const cc = geo.getAttribute("position").count;
    const vc = new Float32Array(cc * 3);
    for (let i = 0; i < cc; i++) {
      const y = geo.getAttribute("position").getY(i);
      const k = 0.7 + 0.3 * (y * 0.5 + 0.5);
      vc.set([BUSH.r * k, BUSH.g * k, BUSH.b * k], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(vc, 3));
    const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.95, flatShading: true }), crowns.length);
    crowns.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    group.add(im);
  }

  // The sea.
  const sea = new THREE.ShaderMaterial({
    vertexShader: SEA_VERT,
    fragmentShader: SEA_FRAG,
    uniforms: bindAtmos({
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      fogMist: MIST,
      fogMistH: MIST_H,
      uTime: { value: 0 },
      uMoonDir: { value: new THREE.Vector3(-0.45, 0.72, -0.53).normalize() },
      uMoonOn: { value: 0 },
      uLight: { value: 1 },
    }),
    fog: true,
  });
  sea.userData.mist = true;
  void ATMOS_GLSL;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(9000, 6000, 1, 1), sea);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, SEA_Y, -2600);

  // The beach road's sea wall: a low concrete edge between the verge and the sand.
  {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xb9b5ab, roughness: 0.9 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(344, 1.0, 0.45), wallMat);
    wall.position.set(0, -0.45, coastZ(0) + 15.2);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(340, 0.12, 0.6), wallMat);
    cap.position.set(0, 0.1, coastZ(0) + 15.2);
    group.add(cap);
  }
  water.frustumCulled = false;
  group.add(water);

  const update = (time: number, night: number, moon: THREE.Vector3) => {
    sea.uniforms.uTime.value = time;
    sea.uniforms.uMoonOn.value = night;
    (sea.uniforms.uMoonDir.value as THREE.Vector3).copy(moon);
    sea.uniforms.uLight.value = 1 - 0.7 * night;
  };
  return { group, sea, mats: [landMat], update };
}
