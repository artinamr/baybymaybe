import * as THREE from "three";
import { ATMOS_GLSL, bindAtmos } from "./atmos";

/**
 * THE DROP: the new way, as one thing. A drop of liquid glass with light
 * inside it (the brand's indigo, white at its heart), born at the turn from
 * the owner's paperwork, and from then on the job's own: it carries Sam's
 * details (three points of the customer's amber, held in the glass) and
 * becomes, in turn, everything the job needs: the page on Sam's phone, the
 * reply, the calendar, the quote, the invoice, the review, the reminder,
 * the day's summary. Between them it travels, fast, with weight.
 *
 * One mesh (a finely divided sphere) whose every vertex is placed by a
 * shape blended in the vertex shader: the drop (a sphere, a little
 * stretched along its way when it moves fast, trembling after a stop) and
 * the panel (a slab with rounded edges and soft corners, its face flat).
 * Normals come from the shape itself (finite differences), so the light
 * reads true in every state between.
 *
 * The glass: drawn after the scene, over a copy of it (post.ts), so it can
 * bend what is behind it, most at its rim, split into colours there; it
 * reflects the sky (atmos.ts) more at a glancing angle; and the light inside
 * is measured along each view ray (its closest pass to the heart, and to
 * each amber point). As a panel, its face shows a screen (ui.ts), read
 * through the glass.
 */

const VERT = /* glsl */ `
uniform float uShape;
uniform vec3 uHalf;
uniform float uR;
uniform vec3 uVel;
uniform float uTime;
uniform float uWobble;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
varying float vFront;
vec3 shapeAt(vec3 n) {
  // The drop: a sphere, trembling, stretched along its way.
  vec3 s = n * uR;
  float w = sin(n.x * 3.1 + uTime * 4.3) * sin(n.y * 2.7 + uTime * 3.4) * sin(n.z * 3.3 + uTime * 4.9);
  w += 0.5 * sin(n.x * 5.3 - uTime * 6.1) * sin(n.z * 4.7 + uTime * 5.2);
  s *= 1.0 + uWobble * 0.1 * w;
  float st = length(uVel);
  if (st > 1e-4) {
    vec3 v = uVel / st;
    float a = dot(s, v);
    // Longer behind (a tail), a little pulled in at the waist.
    s += v * a * st * (a < 0.0 ? 1.25 : 0.45);
    s -= (s - v * dot(s, v)) * st * 0.22;
  }
  // The panel: a slab, its corners soft (a squircle), its edges round.
  vec3 an = abs(n) + 1e-6;
  float F = pow(pow(an.x, 10.0) + pow(an.y, 10.0), 0.8) + pow(an.z, 8.0);
  vec3 p = n / pow(F, 0.125) * uHalf;
  return mix(s, p, uShape);
}
void main() {
  vec3 n = normalize(position);
  vec3 p = shapeAt(n);
  vec3 t1 = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 t2 = cross(n, t1);
  float e = 0.0035;
  vec3 pa = shapeAt(normalize(n + t1 * e));
  vec3 pb = shapeAt(normalize(n + t2 * e));
  vec3 nn = normalize(cross(pa - p, pb - p));
  if (dot(nn, n) < 0.0) nn = -nn;
  vUv = p.xy / (2.0 * max(uHalf.xy, vec2(1e-3))) + 0.5;
  vFront = smoothstep(0.82, 0.98, nn.z) * uShape;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorld = wp.xyz;
  vNormal = normalize(mat3(modelMatrix) * nn);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FRAG = /* glsl */ `
precision highp float;
${ATMOS_GLSL}
uniform sampler2D tScene;
uniform vec2 uRes;
uniform float uPx;
uniform sampler2D tUI;
uniform float uUI;
uniform float uUIScale;
uniform vec3 uCore;
uniform float uR;
uniform float uGlow;
uniform vec3 uTint;
uniform vec3 uHeart;
uniform vec3 uMote0;
uniform vec3 uMote1;
uniform vec3 uMote2;
uniform vec3 uMoteK;
uniform float uShape;
uniform float uSweep;
uniform float uNight;
uniform float uFade;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
varying float vFront;
vec3 fin(vec3 c) {
  bvec3 bad = equal(floatBitsToUint(c) & uvec3(0x7f800000u), uvec3(0x7f800000u));
  return clamp(mix(c, vec3(0.0), bad), 0.0, 64.0);
}
// The light of a point along a view ray: how near the ray passes to it.
float rayNear(vec3 ro, vec3 rd, vec3 c, float r) {
  vec3 oc = c - ro;
  float t = max(dot(oc, rd), 0.0);
  float d2 = dot(oc, oc) - t * t;
  return exp(-max(d2, 0.0) / (r * r));
}
void main() {
  vec3 V = normalize(vWorld - cameraPosition);
  vec3 N = normalize(vNormal);
  if (dot(N, V) > 0.0) N = -N;
  float cosi = clamp(dot(-V, N), 0.0, 1.0);
  float F = 0.035 + 0.965 * pow(1.0 - cosi, 5.0);
  // What is behind, bent: little in the middle, most at the rim, the colours apart at the edge.
  vec2 suv = gl_FragCoord.xy / uRes;
  vec3 nv = normalize(mat3(viewMatrix) * N);
  float rim = pow(1.0 - cosi, 1.6);
  vec2 off = -nv.xy * uPx * (0.35 + 0.95 * rim) * (1.0 - 0.75 * uShape);
  vec2 asp = vec2(uRes.y / uRes.x, 1.0);
  vec3 refr;
  refr.r = fin(texture2D(tScene, suv + off * asp * 0.96).rgb).r;
  refr.g = fin(texture2D(tScene, suv + off * asp).rgb).g;
  refr.b = fin(texture2D(tScene, suv + off * asp * 1.05).rgb).b;
  refr *= uTint;
  // The sky, reflected (and the land below the horizon: dark, warm specks at night).
  vec3 R = reflect(V, N);
  vec3 refl = R.y > 0.0 ? atmosSky(R) : mix(aHor * 0.2 + vec3(0.01), atmosHaze(R) * 0.6, exp(R.y * 6.0));
  refl += aTown * 3.0 * exp(-abs(R.y) * 14.0) * uNight;
  // The light inside: its heart (indigo, white at the very middle), and the customer's three amber points.
  float r = uR;
  float core = rayNear(cameraPosition, V, uCore, r * 0.42);
  float hot = rayNear(cameraPosition, V, uCore, r * 0.13);
  vec3 inner = (uHeart * core * 1.4 + vec3(1.0, 0.97, 1.0) * hot * 2.2) * uGlow * (1.0 - 0.9 * uShape);
  vec3 amber = vec3(1.0, 0.62, 0.28);
  inner += amber * (rayNear(cameraPosition, V, uMote0, r * 0.075) * uMoteK.x + rayNear(cameraPosition, V, uMote1, r * 0.075) * uMoteK.y + rayNear(cameraPosition, V, uMote2, r * 0.075) * uMoteK.z) * 3.2;
  // Its rim catches the light inside it (it reads as glass even in the dark); a panel's edge glows.
  inner += uHeart * uGlow * rim * mix(0.5, 0.55, uShape);
  vec3 col = refr * (1.0 - F) + refl * F + inner;
  // The screen on its face, read through the glass; a sweep of light across it as it changes.
  if (uUI > 0.001 && vFront > 0.001) {
    vec4 ui = texture2D(tUI, vUv);
    float k = clamp(uUI * vFront, 0.0, 1.0);
    vec3 face = ui.rgb * uUIScale;
    col = mix(col, face + refl * F * 0.12, k * ui.a);
    float swd = (vUv.y - uSweep) * 16.0;
    float sw = exp(-swd * swd) * step(0.001, uSweep) * step(uSweep, 0.999);
    col += uHeart * sw * 0.55 * k;
  }
  gl_FragColor = vec4(fin(col) * uFade, 1.0);
}`;

/** The same shape, for the depth pass (post.ts: depth of field). */
const DEPTH_FRAG = /* glsl */ `
#include <packing>
void main() {
  gl_FragColor = packDepthToRGBA(gl_FragCoord.z);
}`;

export type DropPose = {
  /** Where its middle is, and how fast and which way it goes (m per screen of P, for its stretch). */
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  /** Radius as a drop (m). */
  r: number;
  /** 0 a drop … 1 a panel; the panel's size (m) and its turn. */
  shape: number;
  w: number;
  h: number;
  q: THREE.Quaternion;
  /** The screen on the panel's face and how much it shows. */
  ui: THREE.Texture | null;
  uiK: number;
  /** A sweep of light down the face (0..1 its place; 0 none). */
  sweep: number;
  /** The light inside, the amber points shown (0..3), the tremble. */
  glow: number;
  motes: number;
  wobble: number;
  /** 0 hidden … 1 whole (it grows from nothing at the turn). */
  vis: number;
};

export function dropPose(): DropPose {
  return { pos: new THREE.Vector3(), vel: new THREE.Vector3(), r: 0.32, shape: 0, w: 1, h: 1, q: new THREE.Quaternion(), ui: null, uiK: 0, sweep: 0, glow: 1, motes: 0, wobble: 0, vis: 0 };
}

export class Drop {
  /** Drawn after the scene (post.ts), over a copy of it. */
  readonly scene = new THREE.Scene();
  /** Its depth, for the depth of field. */
  readonly depthScene = new THREE.Scene();
  readonly mesh: THREE.Mesh;
  readonly light: THREE.PointLight;
  readonly mat: THREE.ShaderMaterial;
  private depthMesh: THREE.Mesh;
  private blank: THREE.DataTexture;
  private inv = new THREE.Quaternion();
  private v = new THREE.Vector3();

  constructor(main: THREE.Scene) {
    const geo = new THREE.IcosahedronGeometry(1, 48);
    this.blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
    this.blank.needsUpdate = true;
    const uniforms = bindAtmos({
      uShape: { value: 0 },
      uHalf: { value: new THREE.Vector3(0.5, 0.5, 0.03) },
      uR: { value: 0.32 },
      uVel: { value: new THREE.Vector3() },
      uTime: { value: 0 },
      uWobble: { value: 0 },
      tScene: { value: null },
      uRes: { value: new THREE.Vector2(1, 1) },
      uPx: { value: 0.05 },
      tUI: { value: this.blank },
      uUI: { value: 0 },
      uUIScale: { value: 1 },
      uCore: { value: new THREE.Vector3() },
      uGlow: { value: 1 },
      uTint: { value: new THREE.Color(0.86, 0.85, 1.0) },
      uHeart: { value: new THREE.Color(0.42, 0.3, 1.0) },
      uMote0: { value: new THREE.Vector3() },
      uMote1: { value: new THREE.Vector3() },
      uMote2: { value: new THREE.Vector3() },
      uMoteK: { value: new THREE.Vector3() },
      uSweep: { value: 0 },
      uNight: { value: 0 },
      uFade: { value: 1 },
    });
    this.mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, toneMapped: false });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.scene.add(this.mesh);
    const dmat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: DEPTH_FRAG, uniforms });
    this.depthMesh = new THREE.Mesh(geo, dmat);
    this.depthMesh.frustumCulled = false;
    this.depthMesh.visible = false;
    this.depthScene.add(this.depthMesh);
    // Its light on the world round it (the room it enters, the roofs it crosses).
    this.light = new THREE.PointLight(0xc4bcff, 0, 7, 1.8);
    main.add(this.light);
  }

  /** The scene's copy it bends (post.ts) and the frame's size. */
  bind(tex: THREE.Texture, w: number, h: number) {
    this.mat.uniforms.tScene.value = tex;
    (this.mat.uniforms.uRes.value as THREE.Vector2).set(w, h);
  }

  update(p: DropPose, time: number, camera: THREE.PerspectiveCamera, opts: { uiScale: number; night: number; motes: THREE.Vector3[] }) {
    const u = this.mat.uniforms;
    const on = p.vis > 0.002;
    this.mesh.visible = this.depthMesh.visible = on;
    this.light.visible = on;
    if (!on) {
      this.light.intensity = 0;
      return;
    }
    const s = p.vis;
    this.mesh.position.copy(p.pos);
    this.mesh.quaternion.copy(p.q);
    this.mesh.scale.setScalar(1);
    this.mesh.updateMatrixWorld();
    this.depthMesh.position.copy(p.pos);
    this.depthMesh.quaternion.copy(p.q);
    this.depthMesh.updateMatrixWorld();
    u.uShape.value = p.shape;
    (u.uHalf.value as THREE.Vector3).set((p.w / 2) * s, (p.h / 2) * s, 0.035 * s);
    u.uR.value = p.r * s;
    // The stretch, in its own frame: grows with speed, never more than half again.
    this.inv.copy(p.q).invert();
    this.v.copy(p.vel).applyQuaternion(this.inv);
    const sp = this.v.length();
    const st = Math.min(0.55, sp * 0.012) * (1 - p.shape);
    if (sp > 1e-4) this.v.multiplyScalar(st / sp);
    (u.uVel.value as THREE.Vector3).copy(this.v);
    u.uTime.value = time;
    u.uWobble.value = p.wobble;
    (u.uCore.value as THREE.Vector3).copy(p.pos);
    u.uGlow.value = p.glow;
    u.uUI.value = p.ui ? p.uiK : 0;
    u.tUI.value = p.ui ?? this.blank;
    u.uUIScale.value = opts.uiScale;
    u.uSweep.value = p.sweep;
    u.uNight.value = opts.night;
    // How big it is on screen (for how far it bends what is behind it).
    const d = Math.max(0.05, camera.position.distanceTo(p.pos));
    const R = Math.max(p.r * s, p.shape * Math.min(p.w, p.h) * 0.5 * s);
    u.uPx.value = Math.min(0.5, R / (d * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) * 0.5);
    // The customer's points, inside.
    const mk = u.uMoteK.value as THREE.Vector3;
    mk.set(Math.min(1, Math.max(0, p.motes)), Math.min(1, Math.max(0, p.motes - 1)), Math.min(1, Math.max(0, p.motes - 2)));
    (u.uMote0.value as THREE.Vector3).copy(opts.motes[0]);
    (u.uMote1.value as THREE.Vector3).copy(opts.motes[1]);
    (u.uMote2.value as THREE.Vector3).copy(opts.motes[2]);
    // Its light.
    this.light.position.copy(p.pos);
    this.light.intensity = 2.6 * p.glow * s * (0.3 + 0.7 * opts.night) * (1 - 0.6 * p.shape);
  }
}
