import * as THREE from "three";
import { Card, Screen } from "./cards";
import { nodeLabel } from "./ui";
import { halo } from "./mail";

/**
 * THE NEW ROUTE: one line of light over the town, from the customer's
 * house through the six parts of the rebuilt business and back to the
 * house again. It is drawn at the turn (the line grows, each part flies in
 * and locks), then carries the customer: a pulse that travels it, lighting
 * each part as it passes.
 *
 * Website → Instant reply → Booking → Quote → Invoice → (the workshop) →
 * Follow-up → home.
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export type NodeId = "website" | "reply" | "booking" | "quote" | "invoice" | "followup";
export const NODES: { id: NodeId; title: string; line: string; icon: number; pos: THREE.Vector3 }[] = [
  { id: "website", title: "Website", line: "Fast, with one clear button", icon: 0, pos: V(-31, 12.5, 6) },
  { id: "reply", title: "Instant reply", line: "Answers in a minute, day or night", icon: 1, pos: V(-14, 15.5, -1) },
  { id: "booking", title: "Booking", line: "The customer picks a time", icon: 2, pos: V(4, 17, -6) },
  { id: "quote", title: "Quote", line: "Filled in from the enquiry", icon: 3, pos: V(21, 15.5, -10) },
  { id: "invoice", title: "Invoice", line: "Sent and paid online", icon: 4, pos: V(35, 12.5, -12) },
  { id: "followup", title: "Follow-up", line: "A thank-you, a review, a reminder", icon: 5, pos: V(0, 19, 24) },
];

const LINE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const LINE_FRAG = /* glsl */ `
precision highp float;
uniform float uDraw;
uniform float uTime;
uniform float uPulse;
uniform float uPulseOn;
uniform float uGlow;
uniform vec3 uColor;
varying vec2 vUv;
void main() {
  float u = vUv.x;
  if (u > uDraw) discard;
  // A slow current of small pulses along it, and the customer's own bright pulse.
  float current = 0.55 + 0.45 * pow(0.5 + 0.5 * sin((u * 90.0 - uTime * 2.2)), 6.0);
  float d = abs(u - uPulse);
  d = min(d, 1.0 - d);
  float pulse = exp(-d * d * 9000.0) * 6.0 * uPulseOn;
  float tip = smoothstep(0.03, 0.0, uDraw - u) * 3.0 * step(uDraw, 0.999);
  vec3 c = uColor * (current + tip) * uGlow + vec3(1.0, 0.85, 0.7) * pulse;
  gl_FragColor = vec4(c, 1.0);
}`;

export class System {
  readonly group = new THREE.Group();
  readonly curve: THREE.CatmullRomCurve3;
  readonly nodeU: number[] = [];
  readonly cards: Card[] = [];
  private line: THREE.Mesh;
  private u: Record<string, THREE.IUniform>;
  private flash: THREE.Mesh[] = [];
  private flashMat: THREE.MeshBasicMaterial[] = [];
  /** Where each node flies in from (the assembly). */
  private from: THREE.Vector3[] = [];
  readonly home: THREE.Vector3;
  readonly shop: THREE.Vector3;

  constructor(scene: THREE.Scene, home: THREE.Vector3, shop: THREE.Vector3) {
    this.home = home;
    this.shop = shop;
    const pts = [home.clone().setY(6), ...NODES.slice(0, 5).map((n) => n.pos), shop.clone().setY(7.5), V(30, 15, 14), NODES[5].pos, V(-28, 13, 22)];
    this.curve = new THREE.CatmullRomCurve3(pts, true, "centripetal", 0.5);
    // Each node's place along the line.
    const N = 2000;
    const samples = this.curve.getSpacedPoints(N);
    for (const n of NODES) {
      let best = 0;
      let bd = Infinity;
      samples.forEach((p, i) => {
        const d = p.distanceToSquared(n.pos);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      this.nodeU.push(best / N);
    }
    this.u = {
      uDraw: { value: 0 },
      uTime: { value: 0 },
      uPulse: { value: 0 },
      uPulseOn: { value: 0 },
      uGlow: { value: 2.6 },
      uColor: { value: new THREE.Color(0.36, 0.24, 0.95) },
    };
    const tube = new THREE.TubeGeometry(this.curve, 900, 0.085, 8, true);
    this.line = new THREE.Mesh(tube, new THREE.ShaderMaterial({ vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, uniforms: this.u, toneMapped: false }));
    this.line.frustumCulled = false;
    this.group.add(this.line);
    NODES.forEach((n, i) => {
      const sc = new Screen(1000, 300, 1);
      sc.draw(`node-${n.id}`, (c) => nodeLabel(c, 1000, 300, n.title, n.line, n.icon));
      const card = new Card(sc, 7.2, 2.16, 1.08, 0.1);
      card.bodyMat.color.setRGB(0.93, 0.92, 0.95);
      this.cards.push(card);
      this.group.add(card.group);
      const fm = new THREE.MeshBasicMaterial({ map: halo(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), fm);
      this.flash.push(fl);
      this.flashMat.push(fm);
      this.group.add(fl);
      const a = (i / NODES.length) * Math.PI * 2;
      this.from.push(n.pos.clone().add(V(Math.cos(a) * 26, 18 + i * 3, Math.sin(a) * 26)));
    });
    this.group.visible = false;
    scene.add(this.group);
  }

  /** Redraw the labels (the fonts arrived). */
  dirty() {
    NODES.forEach((n, i) => {
      this.cards[i].screen.dirty();
      this.cards[i].screen.draw(`node-${n.id}`, (c) => nodeLabel(c, 1000, 300, n.title, n.line, n.icon));
    });
  }

  /** The point at u along the route. */
  at(u: number, out = new THREE.Vector3()) {
    return this.curve.getPointAt(((u % 1) + 1) % 1, out);
  }

  /**
   * `draw` 0..1 the line drawn; `build` 0..1 the parts flying in (each in
   * turn); `show` overall; `pulse` the customer's place along the line (or
   * <0 for none); `lit` per node 0..1 (passed, working); `camera` for facing.
   */
  update(show: number, draw: number, build: number, pulse: number, lit: number[], time: number, camera: THREE.Camera, reduced: boolean) {
    this.group.visible = show > 0.005;
    if (!this.group.visible) return;
    this.u.uDraw.value = draw;
    this.u.uTime.value = reduced ? 0 : time;
    this.u.uPulse.value = pulse < 0 ? 0 : pulse;
    this.u.uPulseOn.value = pulse < 0 ? 0 : 1;
    this.u.uGlow.value = 2.6 * show;
    NODES.forEach((n, i) => {
      const t0 = i / (NODES.length + 1);
      const kk = THREE.MathUtils.clamp((build - t0) / (2 / (NODES.length + 1)), 0, 1);
      const e = 1 - Math.pow(1 - kk, 3);
      const card = this.cards[i];
      card.group.position.lerpVectors(this.from[i], n.pos, e);
      card.group.position.y += 2.6;
      // Face the camera across the town (turned only about the vertical).
      const yaw = Math.atan2(camera.position.x - card.group.position.x, camera.position.z - card.group.position.z);
      card.group.rotation.set(-0.08, yaw, (1 - e) * 0.6 * (i % 2 ? 1 : -1));
      const s = 0.4 + 0.6 * e;
      card.group.scale.setScalar(s);
      const on = lit[i] ?? 0;
      card.show(Math.min(1, kk * 3) * show, 1.15 + on * 0.6);
      // A flash as it locks, and a glow while it works.
      const lock = kk >= 1 ? Math.exp(-Math.max(0, (build - (t0 + 2 / (NODES.length + 1))) * 30)) : 0;
      const fl = this.flash[i];
      fl.position.copy(n.pos).setY(n.pos.y + 0.2);
      fl.quaternion.copy(camera.quaternion);
      this.flashMat[i].color.setRGB(0.5, 0.42, 1.0).multiplyScalar((lock * 1.4 + on * 0.5) * show);
      fl.visible = lock + on > 0.01;
    });
  }
}
