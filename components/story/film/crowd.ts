import * as THREE from "three";
import { faceGeometry } from "./cards";
import type { House } from "./town";

/**
 * THE TOWN'S OTHER CUSTOMERS. A hundred people in a hundred houses open
 * the same website at the same time: a phone above each roof, loading. On
 * the old site, past three seconds, fifty-three of them give up (Google's
 * 2016 finding, the film's one statistic): the phone tips over and goes
 * dark. On the new site the page is there at once and almost all stay.
 *
 * Each phone is an instance; its screen (a spinner, then a page) is drawn
 * in the shader from three numbers: loaded, on, and which site.
 */

const VERT = /* glsl */ `
attribute vec4 aState;
varying vec2 vUv;
varying vec4 vState;
void main() {
  vUv = uv;
  vState = aState;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`;

const FRAG = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uGlow;
varying vec2 vUv;
varying vec4 vState;
float box(vec2 p, vec2 a, vec2 b) { vec2 q = step(a, p) * step(p, b); return q.x * q.y; }
void main() {
  float loaded = vState.x;
  float on = vState.y;
  float seed = vState.z;
  float fresh = vState.w;
  vec2 p = vUv;
  // The bezel: a dark rim round the screen.
  vec2 e = min(p, 1.0 - p) * vec2(1.5, 3.0);
  float bezel = smoothstep(0.075, 0.09, min(e.x, e.y));
  p = (p - 0.5) / vec2(0.9, 0.95) + 0.5;
  vec3 screen = vec3(0.97, 0.965, 0.955);
  // Loading: a spinner's arc turning in the middle.
  vec2 c = p - vec2(0.5, 0.5);
  c.y *= 2.0;
  float r = length(c);
  float a = atan(c.y, c.x);
  float spin = fract((a / 6.2831853) - uTime * 0.9 + seed);
  float band = smoothstep(0.05, 0.035, abs(r - 0.22));
  float ring = band * (0.22 + 0.78 * smoothstep(0.1, 0.9, spin)) * (1.0 - loaded);
  vec3 col = mix(screen, vec3(0.35, 0.36, 0.42), ring);
  // Loaded: a page (a bar, a picture, a line of text, a button).
  vec3 page = screen;
  page = mix(page, vec3(0.16, 0.17, 0.2), box(p, vec2(0.0, 0.9), vec2(1.0, 1.0)) * (1.0 - fresh));
  page = mix(page, mix(vec3(0.78, 0.69, 0.56), vec3(0.8, 0.71, 0.58), fresh), box(p, vec2(0.06, 0.58), vec2(0.94, 0.86)));
  page = mix(page, vec3(0.6, 0.6, 0.63), box(p, vec2(0.08, 0.46), vec2(0.8, 0.5)));
  page = mix(page, vec3(0.6, 0.6, 0.63), box(p, vec2(0.08, 0.4), vec2(0.62, 0.44)));
  page = mix(page, mix(vec3(0.3, 0.31, 0.35), vec3(0.357, 0.239, 0.941), fresh), box(p, vec2(0.08, 0.22), vec2(0.92, 0.32)));
  col = mix(col, page, loaded);
  // The screen's own light; off is near black glass.
  col *= uGlow;
  // Giving up: the screen flushes red as it goes.
  col = mix(col, vec3(0.9, 0.22, 0.16) * uGlow * 0.8, clamp((1.0 - on) * 2.0, 0.0, 1.0) * step(0.02, on));
  col = mix(vec3(0.015, 0.016, 0.02), col, on);
  col = mix(vec3(0.02, 0.02, 0.025), col, bezel);
  gl_FragColor = vec4(col, 1.0);
}`;

export type Phone = { house: House; drop: number; seed: number; stay: boolean; nDrop: number };

export class Crowd {
  readonly mesh: THREE.InstancedMesh;
  readonly phones: Phone[];
  private state: THREE.InstancedBufferAttribute;
  private u = { uTime: { value: 0 }, uGlow: { value: 1 } };
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  constructor(scene: THREE.Scene, houses: House[], centre: THREE.Vector3, n = 100) {
    const near = houses.slice().sort((a, b) => Math.hypot(a.x - centre.x, a.z - centre.z) - Math.hypot(b.x - centre.x, b.z - centre.z)).slice(0, n);
    // Fifty-three of the hundred leave on the old site, each at its own moment past three seconds;
    // six on the new one (people leave a page for all sorts of reasons).
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const order = near.map((_, i) => i).sort(() => rnd() - 0.5);
    // Who leaves is chance; when they leave is a wave across the town (the far
    // side first, Sam's street last), each a little early or late.
    const far = near.reduce((m, h) => Math.max(m, Math.hypot(h.x - centre.x, h.z - centre.z)), 1);
    const leavers = near.map((h, i) => ({ i, t: 1 - Math.hypot(h.x - centre.x, h.z - centre.z) / far + (rnd() - 0.5) * 0.3 })).filter((e) => order.indexOf(e.i) < 53);
    const lo = Math.min(...leavers.map((e) => e.t));
    const hi = Math.max(...leavers.map((e) => e.t));
    const when = new Map(leavers.map((e) => [e.i, (e.t - lo) / Math.max(1e-6, hi - lo)]));
    this.phones = near.map((house, i) => {
      const rank = order.indexOf(i);
      return { house, drop: rank < 53 ? when.get(i)! * 0.96 : -1, seed: rnd(), stay: rank >= 53, nDrop: rank < 6 ? rank / 6 : -1 };
    });
    const g = faceGeometry(1.5, 3.0, 0.24);
    this.state = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    g.setAttribute("aState", this.state);
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: this.u, side: THREE.DoubleSide, toneMapped: false });
    this.mesh = new THREE.InstancedMesh(g, mat, n);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  /** The house whose customer has given up by now (its window goes dark): by house id. */
  private byHouse = new Map<number, Phone>();
  gone(houseId: number, dropK: number, fresh: boolean): boolean {
    if (!this.byHouse.size) for (const ph of this.phones) this.byHouse.set(ph.house.id, ph);
    const ph = this.byHouse.get(houseId);
    if (!ph) return false;
    const d = fresh ? ph.nDrop : ph.drop;
    return d >= 0 && (dropK - d * 0.85) / 0.15 > 0.5;
  }

  /**
   * `show` 0..1; `t` seconds since the tap (the old site loads at 5.6 s);
   * `dropK` 0..1 through the leaving; `fresh` the new site; `camera` for facing.
   */
  update(show: number, t: number, dropK: number, fresh: boolean, time: number, camera: THREE.Camera, glow = 1) {
    this.mesh.visible = show > 0.01;
    if (!this.mesh.visible) return 0;
    this.u.uTime.value = time;
    this.u.uGlow.value = glow;
    let lost = 0;
    const up = new THREE.Vector3(0, 1, 0);
    const toCam = new THREE.Vector3();
    this.phones.forEach((ph, i) => {
      const d = fresh ? ph.nDrop : ph.drop;
      // Leaving: tip forward and sink, the screen going out.
      const leave = d >= 0 ? THREE.MathUtils.clamp((dropK - d * 0.85) / 0.15, 0, 1) : 0;
      if (leave > 0.5) lost++;
      const loaded = fresh ? Math.min(1, t / 0.35) : t > 5.6 ? Math.min(1, (t - 5.6) / 0.3) : 0;
      // Coming and going with the chapter, they grow out of the roofs and shrink back (the red is for giving up only).
      const on = 1 - leave;
      const grow = show * show * (3 - 2 * show);
      this.state.setXYZW(i, leave > 0 ? loaded * (1 - leave) : loaded, Math.max(0.0, on), ph.seed, fresh ? 1 : 0);
      const p = ph.house.top;
      toCam.set(camera.position.x - p.x, 0, camera.position.z - p.z).normalize();
      const yaw = Math.atan2(toCam.x, toCam.z);
      this.q.setFromEuler(new THREE.Euler(-0.12 - leave * 1.35, yaw, 0, "YXZ"));
      const bob = Math.sin(time * 1.3 + ph.seed * 20) * 0.08;
      const s = grow * (1 - leave * 0.35);
      this.m.compose(new THREE.Vector3(p.x, p.y + 1.2 + bob - leave * 3.2 + (1 - show) * 1.5, p.z), this.q, new THREE.Vector3(s, s, s));
      this.mesh.setMatrixAt(i, this.m);
    });
    void up;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.state.needsUpdate = true;
    return lost;
  }
}
