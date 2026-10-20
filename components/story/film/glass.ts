import * as THREE from "three";
import { bindAtmos } from "./atmos";
import { MIST, MIST_H } from "./mats";

/**
 * THE TOWN'S WINDOWS. Each pane is glass with a room behind it: the sky
 * reflected (more at a glancing angle, as glass does), and through it a room
 * drawn by "interior mapping" (the view ray, inside the pane, run on into a
 * box the size of a room: back wall, side walls, floor, ceiling), with a
 * ceiling light, a piece of furniture standing in it, and curtains or a
 * blind on some. Every pane its own room (a seed per pane): its size, its
 * colours, how its curtains are drawn, whether its lamp is on when the
 * house is lit. By day the rooms are dim behind the reflections; at dusk and
 * at night they glow, each a different warmth, the town's people at home.
 *
 * A house's light (instance colour, HDR) is its rooms' lamp; 0 is dark.
 */

/** Collects a house's panes: a quad each, with its size, seed and kind for the room behind it. */
export class Panes {
  private pos: number[] = [];
  private nor: number[] = [];
  private uv: number[] = [];
  private pane: number[] = [];
  private tan: number[] = [];
  private idx: number[] = [];
  private n = 0;
  /**
   * A pane in a wall facing `face` (0 +Z, 1 +X, 2 -Z, 3 -X), centred at (u along the wall, y), the wall's plane at `off`.
   * `kind`: 0 a window (sill above the floor), 1 a glazed door (to the floor), 2 a wide door or window wall.
   */
  add(face: number, off: number, u: number, y: number, w: number, h: number, kind = 0, floorY = 0.45) {
    const yaw = [0, Math.PI / 2, Math.PI, -Math.PI / 2][face];
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    // House-local: the pane's right (tangent) and outward normal.
    const T = [c, 0, -s];
    const N = [s, 0, c];
    const cx = u * c + (off + 0.03) * s;
    const cz = -u * s + (off + 0.03) * c;
    const seed = fract(Math.sin(cx * 12.9898 + y * 78.233 + cz * 37.719) * 43758.5453);
    // How high the pane's centre stands above the room's floor.
    const above = Math.max(0.6, y - floorY);
    for (const [a, b] of [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]) {
      const px = cx + T[0] * (a - 0.5) * w;
      const pz = cz + T[2] * (a - 0.5) * w;
      this.pos.push(px, y + (b - 0.5) * h, pz);
      this.nor.push(N[0], N[1], N[2]);
      this.uv.push(a, b);
      this.pane.push(w, h, seed, kind * 10 + Math.min(9.99, above));
      this.tan.push(T[0], T[1], T[2]);
    }
    const i = this.n;
    this.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
    this.n += 4;
    return this;
  }
  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute("aPane", new THREE.Float32BufferAttribute(this.pane, 4));
    g.setAttribute("aTan", new THREE.Float32BufferAttribute(this.tan, 3));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}
function fract(x: number) {
  return x - Math.floor(x);
}

const VERT = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
attribute vec4 aPane;
attribute vec3 aTan;
varying vec2 vUv2;
varying vec4 vPane;
varying vec3 vWorldP;
varying vec3 vN;
varying vec3 vT;
varying vec3 vLight;
varying float vHouse;
void main() {
  vec3 transformed = position;
  vec4 local = vec4(transformed, 1.0);
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
    m = modelMatrix * instanceMatrix;
    vHouse = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
  #else
    vHouse = 0.5;
  #endif
  vec4 wp = m * local;
  vWorldP = wp.xyz;
  vN = normalize(mat3(m) * normal);
  vT = normalize(mat3(m) * aTan);
  vUv2 = uv;
  vPane = aPane;
  #ifdef USE_INSTANCING_COLOR
    vLight = instanceColor;
  #else
    vLight = vec3(0.0);
  #endif
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
uniform float uDay;
uniform float uDim;
varying vec2 vUv2;
varying vec4 vPane;
varying vec3 vWorldP;
varying vec3 vN;
varying vec3 vT;
varying vec3 vLight;
varying float vHouse;
float h1(float n) { return fract(sin(n * 91.3458 + 3.7) * 47453.5453); }
void main() {
  float w = vPane.x;
  float h = vPane.y;
  float seed = vPane.z;
  float kind = floor(vPane.w / 10.0);
  float above = vPane.w - kind * 10.0;
  vec3 V = normalize(vWorldP - cameraPosition);
  vec3 N = normalize(vN);
  vec3 T = normalize(vT);
  vec3 U = vec3(0.0, 1.0, 0.0);
  // The view ray in the room's frame: x along the pane, y up, z into the room.
  vec3 rd = vec3(dot(V, T), dot(V, U), -dot(V, N));
  rd.z = max(rd.z, 0.02);
  vec3 ro = vec3((vUv2.x - 0.5) * w, (vUv2.y - 0.5) * h, 0.0);
  // The room: its size and where the pane sits in it.
  float RW = max(w + 0.8, 2.8 + 2.4 * h1(seed));
  float ox = (h1(seed + 1.0) - 0.5) * (RW - w) * 0.7;
  float floorY = -above;
  float ceilY = floorY + 2.45 + 0.2 * h1(seed + 5.0);
  float D = 2.8 + 2.6 * h1(seed + 2.0);
  vec3 bmin = vec3(ox - RW * 0.5, floorY, 0.0);
  vec3 bmax = vec3(ox + RW * 0.5, ceilY, D);
  vec3 tA = (bmin - ro) / rd;
  vec3 tB = (bmax - ro) / rd;
  vec3 tF = max(tA, tB);
  float t = min(min(tF.x, tF.y), tF.z);
  vec3 p = ro + rd * t;
  // Which surface: 0 a side wall, 1 floor or ceiling, 2 the back wall.
  float face = tF.x <= t + 1e-4 ? 0.0 : tF.y <= t + 1e-4 ? 1.0 : 2.0;
  // Colours: walls (warm white, pale grey, sage, a deep accent), floor (timber or carpet), ceiling.
  float pick = h1(seed + 3.0);
  vec3 wallC = pick < 0.45 ? vec3(0.82, 0.78, 0.7) : pick < 0.7 ? vec3(0.7, 0.71, 0.7) : pick < 0.87 ? vec3(0.62, 0.67, 0.58) : vec3(0.42, 0.45, 0.55);
  vec3 floorC = h1(seed + 4.0) < 0.6 ? vec3(0.42, 0.28, 0.17) : vec3(0.45, 0.42, 0.4);
  vec3 ceilC = vec3(0.88, 0.86, 0.82);
  vec3 alb = face < 0.5 ? wallC * 0.92 : face < 1.5 ? (p.y > floorY + 0.01 ? ceilC : floorC) : wallC;
  // A picture or a shelf on the back wall.
  if (face > 1.5) {
    vec2 q = vec2(p.x - ox - (h1(seed + 6.0) - 0.5) * RW * 0.5, p.y - floorY - 1.55);
    if (abs(q.x) < 0.45 && abs(q.y) < 0.32) alb = h1(seed + 7.0) < 0.5 ? vec3(0.18, 0.2, 0.24) : vec3(0.75, 0.55, 0.38);
  }
  // The room's light: a lamp under the ceiling, its pool on the floor, falling off to the corners.
  vec3 lampP = vec3(ox + (h1(seed + 8.0) - 0.5) * RW * 0.4, ceilY - 0.35, D * (0.45 + 0.2 * h1(seed + 9.0)));
  float dl = length(p - lampP);
  float on = step(0.28, h1(seed + 10.0 + vHouse * 7.0));
  vec3 lamp = vLight * on * (0.6 + 0.6 * h1(seed + 11.0)) * (0.18 + 1.25 / (1.0 + dl * dl * 0.55));
  // The sky's light through the window (by day the room is dim behind its glass).
  vec3 day = aHor * uDay * 0.32 * (1.0 - smoothstep(0.0, D, p.z) * 0.6);
  vec3 room = alb * (lamp + day);
  // The lamp's own shade, seen on the ceiling.
  if (face > 0.5 && face < 1.5 && p.y > floorY + 0.01) room += vLight * on * 3.0 * smoothstep(0.32, 0.18, length(p.xz - lampP.xz));
  // A piece of furniture across the room (a sofa's back, a bench, a bookcase): a silhouette at mid-depth.
  {
    float zf = D * (0.42 + 0.25 * h1(seed + 12.0));
    float tf = (zf - ro.z) / rd.z;
    if (tf < t) {
      vec3 q = ro + rd * tf;
      float fx = ox + (h1(seed + 13.0) - 0.5) * RW * 0.6;
      float tall = h1(seed + 14.0) < 0.25 ? 1.9 : 0.85;
      float halfW = tall > 1.0 ? 0.5 : 0.9 + 0.4 * h1(seed + 15.0);
      if (abs(q.x - fx) < halfW && q.y < floorY + tall) {
        vec3 fc = h1(seed + 16.0) < 0.5 ? vec3(0.3, 0.27, 0.25) : vec3(0.5, 0.45, 0.38);
        room = fc * (lamp * 0.55 + day * 0.6);
      }
    }
  }
  // Curtains drawn part way, or a blind: lit from behind when the lamp is on.
  float cur = h1(seed + 17.0);
  vec2 pp = vec2(ro.x / w + 0.5, ro.y / h + 0.5);
  float drape = 0.0;
  if (cur < 0.4) {
    float l = 0.08 + 0.28 * h1(seed + 18.0);
    float r = 0.08 + 0.28 * h1(seed + 19.0);
    drape = step(pp.x, l) + step(1.0 - r, pp.x);
  } else if (cur < 0.6) {
    drape = step(1.0 - 0.15 - 0.5 * h1(seed + 20.0), pp.y);
  }
  if (drape > 0.0) {
    float folds = cur < 0.4 ? 0.82 + 0.18 * sin(pp.x * w * 42.0) : 0.85 + 0.15 * step(0.5, fract(pp.y * h * 22.0));
    vec3 fabric = h1(seed + 21.0) < 0.5 ? vec3(0.86, 0.8, 0.7) : vec3(0.7, 0.72, 0.74);
    room = fabric * folds * (vLight * on * 0.45 + vLight * 0.12 + day * 0.9);
  }
  // The inner frame's shadow round the glass.
  float edge = min(min(vUv2.x, 1.0 - vUv2.x) * w, min(vUv2.y, 1.0 - vUv2.y) * h);
  room *= 0.55 + 0.45 * smoothstep(0.0, 0.07, edge);
  // The glass: the sky (and the street, looking down) reflected, more at a glancing angle.
  vec3 R = reflect(V, N);
  vec3 refl = R.y > 0.0 ? atmosSky(R) : mix(aHor * 0.18 + vec3(0.012), atmosHaze(R), exp(R.y * 9.0) * 0.6);
  float cosV = clamp(dot(-V, N), 0.0, 1.0);
  float F = 0.045 + 0.955 * pow(1.0 - cosV, 5.0);
  vec3 col = room * (1.0 - F) * uDim + refl * F;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

export type WindowMat = THREE.ShaderMaterial & { uniforms: { uDay: { value: number }; uDim: { value: number } } };

/** The windows' material (instanced: the instance colour is the house's light). */
export function windowMat(): WindowMat {
  const m = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: bindAtmos({
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      fogMist: MIST,
      fogMistH: MIST_H,
      uDay: { value: 1 },
      uDim: { value: 1 },
    }),
    fog: true,
  }) as WindowMat;
  m.userData.mist = true;
  return m;
}
