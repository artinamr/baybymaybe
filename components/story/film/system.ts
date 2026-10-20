import * as THREE from "three";
import { Card, Screen } from "./cards";
import { clamp01, range, settle, smooth } from "./ease";
import { nodeLabel } from "./ui";
import { halo } from "./mail";

/**
 * THE SYSTEM: the rebuilt business, drawn in light over the town. One clean
 * arc from the customer's roof across the town to the workshop (website,
 * instant reply, booking, quote, invoice stand on it as STATIONS: a ring of
 * light on a hairline beam, a tag of dark glass under it), and a lower
 * return arc with the follow-up, back to the customer's house: a loop.
 *
 * It comes alive at the turn: a SCAN of light sweeps the town from the
 * workshop; where it passes, the beams rise and the rings and tags build;
 * then the line draws itself round from the customer's house. After that it
 * carries the customer as a comet (a bright head, a long tail) that pings
 * each station it reaches; and at the end other customers' pulses run it
 * on their own.
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export type NodeId = "website" | "reply" | "booking" | "quote" | "invoice" | "followup";
type Node = { id: NodeId; title: string; line: string; icon: number; pos: THREE.Vector3; /** which arc, where on it */ arc: 0 | 1; t: number };

/** The two ends of the loop: over the customer's roof, over the workshop's. */
const HOME_END = V(-42, 6.5, 16.5);
const SHOP_END = V(40, 8.5, -13);
const DIR = SHOP_END.clone().sub(HOME_END).setY(0);
const SIDE = V(DIR.z, 0, -DIR.x).normalize().negate();

/** The outbound arc (0) bows toward the south and rises to twenty metres; the return (1) bows north, lower. */
export function arcAt(arc: 0 | 1, t: number, out = new THREE.Vector3()) {
  const s = Math.sin(Math.PI * t);
  const rise = Math.pow(s, 0.7);
  if (arc === 0) {
    out.copy(HOME_END).addScaledVector(DIR, t);
    out.y = 6.5 + 2 * t + 11.5 * rise;
    out.addScaledVector(SIDE, 9 * s);
  } else {
    out.copy(SHOP_END).addScaledVector(DIR, -t);
    out.y = 8.5 - 2 * t + 8 * rise;
    out.addScaledVector(SIDE, -13 * s);
  }
  return out;
}

export const NODES: Node[] = [
  { id: "website", title: "Website", line: "Fast, with one clear button", icon: 0, pos: arcAt(0, 0.1), arc: 0, t: 0.1 },
  { id: "reply", title: "Instant reply", line: "Answers in a minute, day or night", icon: 1, pos: arcAt(0, 0.32), arc: 0, t: 0.32 },
  { id: "booking", title: "Booking", line: "The customer picks a time", icon: 2, pos: arcAt(0, 0.52), arc: 0, t: 0.52 },
  { id: "quote", title: "Quote", line: "Filled in from the enquiry", icon: 3, pos: arcAt(0, 0.72), arc: 0, t: 0.72 },
  { id: "invoice", title: "Invoice", line: "Sent and paid online", icon: 4, pos: arcAt(0, 0.9), arc: 0, t: 0.9 },
  { id: "followup", title: "Follow-up", line: "A thank-you, a review, a reminder", icon: 5, pos: arcAt(1, 0.5), arc: 1, t: 0.5 },
];

/** How far below its ring a station's tag hangs, and its work card. */
export const TAG_DROP = 1.35;
export const CARD_DROP = 3.6;

const LINE_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
// The line: a slow current along it; the customer's comet (a head, a tail
// behind it the way it came); two more pulses of other customers'.
const LINE_FRAG = /* glsl */ `
precision highp float;
uniform float uDraw;
uniform float uTime;
uniform vec4 uPulse;   // u, on, direction, warmth (1 amber, 0 indigo)
uniform vec4 uPulseB;
uniform vec4 uPulseC;
uniform float uGlow;
uniform vec3 uColor;
varying vec2 vUv;
float comet(vec4 p, float u) {
  if (p.y < 0.5) return 0.0;
  float d = u - p.x;
  d -= floor(d + 0.5);
  float head = exp(-d * d * 14000.0);
  float behind = max(0.0, -d * p.z);
  float tail = exp(-behind * 70.0) * step(0.0, -d * p.z) * 0.6;
  return head * 6.0 + tail * 2.2;
}
void main() {
  float u = vUv.x;
  if (u > uDraw) discard;
  float current = 0.55 + 0.45 * pow(0.5 + 0.5 * sin((u * 90.0 - uTime * 2.2)), 6.0);
  float tip = smoothstep(0.03, 0.0, uDraw - u) * 3.0 * step(uDraw, 0.999);
  vec3 warm = vec3(1.0, 0.82, 0.62);
  vec3 cool = vec3(0.72, 0.62, 1.0);
  vec3 c = uColor * (current + tip) * uGlow;
  c += mix(cool, warm, uPulse.w) * comet(uPulse, u);
  c += mix(cool, warm, uPulseB.w) * comet(uPulseB, u) * 0.7;
  c += mix(cool, warm, uPulseC.w) * comet(uPulseC, u) * 0.7;
  gl_FragColor = vec4(c, 1.0);
}`;

/** A beam: a hairline of light up from the ground, fading to nothing at its foot. */
function beamGeometry() {
  const g = new THREE.CylinderGeometry(0.03, 0.03, 1, 6, 8, true);
  g.translate(0, 0.5, 0);
  const pos = g.getAttribute("position");
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const k = Math.pow(y, 1.6) * 0.9 + 0.1 * (y > 0.98 ? 1 : 0);
    col[i * 3] = 0.5 * k;
    col[i * 3 + 1] = 0.42 * k;
    col[i * 3 + 2] = 1.0 * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

/**
 * THE DETAILS: Sam's three answers (who, how to reach them, the job) as
 * three bars of light. Typed once, they fly along the loop from the website
 * station to the quote and drop into its lines: used everywhere.
 */
export class Fields {
  readonly group = new THREE.Group();
  private bars: THREE.Mesh[] = [];
  private mats: THREE.MeshBasicMaterial[] = [];
  private halos: THREE.Mesh[] = [];
  private haloMats: THREE.MeshBasicMaterial[] = [];
  constructor(scene: THREE.Scene) {
    const g = new THREE.PlaneGeometry(1.1, 0.16);
    for (let i = 0; i < 3; i++) {
      const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
      const bar = new THREE.Mesh(g, m);
      bar.layers.set(1);
      const hm = new THREE.MeshBasicMaterial({ map: halo(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
      const h = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), hm);
      h.layers.set(1);
      this.bars.push(bar);
      this.mats.push(m);
      this.halos.push(h);
      this.haloMats.push(hm);
      this.group.add(bar, h);
    }
    this.group.visible = false;
    scene.add(this.group);
  }
  /**
   * `k` 0..1 the flight along the loop from `u0` to `u1`, each bar a little
   * behind the last; then into the card (`card`'s group, lines spaced down
   * its face); `show` overall.
   */
  update(sys: System, u0: number, u1: number, k: number, card: THREE.Object3D, show: number, camera: THREE.Camera) {
    this.group.visible = show > 0.005 && k > 0 && k < 1;
    if (!this.group.visible) return;
    const p = new THREE.Vector3();
    const land = new THREE.Vector3();
    for (let i = 0; i < 3; i++) {
      const ki = clamp01((k - i * 0.1) / 0.72);
      const fly = smooth(Math.min(1, ki / 0.82));
      const drop = clamp01((ki - 0.82) / 0.18);
      sys.at(u0 + (u1 - u0) * fly, p);
      p.y += 0.5 + 0.22 * (2 - i);
      // Its line on the card.
      land.set(-0.9, 0.62 - i * 0.26, 0.06).applyQuaternion(card.quaternion).add(card.position);
      p.lerp(land, settle(drop, 0.3));
      const b = this.bars[i];
      b.position.copy(p);
      b.quaternion.copy(camera.quaternion);
      const gone = clamp01((ki - 0.94) / 0.06);
      const a = show * (1 - gone) * (ki > 0 ? 1 : 0);
      this.mats[i].color.setRGB(1.0, 0.85, 0.6).multiplyScalar(2.2 * a);
      const h = this.halos[i];
      h.position.copy(p);
      h.quaternion.copy(camera.quaternion);
      this.haloMats[i].color.setRGB(1.0, 0.7, 0.4).multiplyScalar(0.9 * a * (1 - drop * 0.6));
    }
  }
}

const light = (color: THREE.ColorRepresentation, vertexColors = false) =>
  new THREE.MeshBasicMaterial({ color, vertexColors, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });

export class System {
  readonly group = new THREE.Group();
  readonly curve: THREE.CatmullRomCurve3;
  readonly nodeU: number[] = [];
  readonly cards: Card[] = [];
  readonly home: THREE.Vector3;
  readonly shop: THREE.Vector3;
  private line: THREE.Mesh;
  private u: Record<string, THREE.IUniform>;
  private rings: THREE.Mesh[] = [];
  private pings: THREE.Mesh[] = [];
  private sweeps: THREE.Mesh[] = [];
  private sweepMat: THREE.MeshBasicMaterial[] = [];
  private beams: THREE.Mesh[] = [];
  private ringMat: THREE.MeshBasicMaterial[] = [];
  private pingMat: THREE.MeshBasicMaterial[] = [];
  private beamMat: THREE.MeshBasicMaterial[] = [];
  private flash: THREE.Mesh[] = [];
  private flashMat: THREE.MeshBasicMaterial[] = [];
  /** Each station's distance from the workshop (the scan reaches it in that order). */
  readonly reach: number[] = [];
  /** 1 on a wide screen; smaller on a narrow one. */
  labelScale = 1;

  constructor(scene: THREE.Scene, home: THREE.Vector3, shop: THREE.Vector3) {
    this.home = home;
    this.shop = shop;
    // The loop: both arcs, sampled, through one closed curve.
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 24; i++) pts.push(arcAt(0, i / 24));
    for (let i = 0; i < 24; i++) pts.push(arcAt(1, i / 24));
    this.curve = new THREE.CatmullRomCurve3(pts, true, "centripetal", 0.5);
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
      this.reach.push(Math.hypot(n.pos.x - SHOP_END.x, n.pos.z - SHOP_END.z));
    }
    this.u = {
      uDraw: { value: 0 },
      uTime: { value: 0 },
      uPulse: { value: new THREE.Vector4(0, 0, 1, 1) },
      uPulseB: { value: new THREE.Vector4(0, 0, 1, 1) },
      uPulseC: { value: new THREE.Vector4(0, 0, 1, 0) },
      uGlow: { value: 2.6 },
      uColor: { value: new THREE.Color(0.36, 0.24, 0.95) },
    };
    const tube = new THREE.TubeGeometry(this.curve, 1200, 0.075, 8, true);
    this.line = new THREE.Mesh(tube, new THREE.ShaderMaterial({ vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, uniforms: this.u, toneMapped: false }));
    this.line.frustumCulled = false;
    this.group.add(this.line);
    const ringGeo = new THREE.TorusGeometry(1.5, 0.045, 10, 96);
    const pingGeo = new THREE.TorusGeometry(1.5, 0.03, 8, 96);
    const sweepGeo = new THREE.TorusGeometry(1.5, 0.07, 8, 32, Math.PI * 0.3);
    const beamGeo = beamGeometry();
    NODES.forEach((n) => {
      // The ring, and the ping that spreads from it.
      const rm = light(0x9a86ff);
      const ring = new THREE.Mesh(ringGeo, rm);
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(n.pos);
      ring.layers.set(1);
      const pm = light(0x9a86ff);
      const ping = new THREE.Mesh(pingGeo, pm);
      ping.rotation.x = Math.PI / 2;
      ping.position.copy(n.pos);
      ping.layers.set(1);
      // A brighter segment that runs round the ring (the station's own scanner).
      const sm = light(0xc9bfff);
      const sweep = new THREE.Mesh(sweepGeo, sm);
      sweep.rotation.x = Math.PI / 2;
      sweep.position.copy(n.pos);
      sweep.layers.set(1);
      this.sweeps.push(sweep);
      this.sweepMat.push(sm);
      // The beam from the ground.
      const bm = light(0xffffff, true);
      const beam = new THREE.Mesh(beamGeo, bm);
      beam.position.set(n.pos.x, 0, n.pos.z);
      beam.scale.set(1, n.pos.y, 1);
      beam.layers.set(1);
      // The tag: dark glass, the name and what it does, hung under the ring.
      const sc = new Screen(1000, 300, 1);
      sc.draw(`node-${n.id}`, (c) => nodeLabel(c, 1000, 300, n.title, n.line, n.icon, true));
      const card = new Card(sc, 5.0, 1.5, 0.75, 0.06, { bezel: 0.0, body: 0x0b0c16, metal: 0.4, holo: true });
      // A soft flash as the station locks or works.
      const fm = new THREE.MeshBasicMaterial({ map: halo(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), fm);
      fl.layers.set(1);
      this.rings.push(ring);
      this.pings.push(ping);
      this.beams.push(beam);
      this.ringMat.push(rm);
      this.pingMat.push(pm);
      this.beamMat.push(bm);
      this.cards.push(card);
      this.flash.push(fl);
      this.flashMat.push(fm);
      this.group.add(ring, ping, sweep, beam, card.group, fl);
    });
    this.group.visible = false;
    scene.add(this.group);
  }

  /** Redraw the labels (the fonts arrived). */
  dirty() {
    NODES.forEach((n, i) => {
      this.cards[i].screen.dirty();
      this.cards[i].screen.draw(`node-${n.id}`, (c) => nodeLabel(c, 1000, 300, n.title, n.line, n.icon, true));
    });
  }

  /** The point at u along the loop. */
  at(u: number, out = new THREE.Vector3()) {
    return this.curve.getPointAt(((u % 1) + 1) % 1, out);
  }

  /**
   * How far each station has risen for a scan of radius `r` from the workshop
   * (0 nothing, 1 its ring and tag are built): the beam shoots up as the scan
   * reaches it, then the ring, then the tag.
   */
  rise(i: number, r: number) {
    return clamp01((r - this.reach[i]) / 14);
  }

  /**
   * `show` overall; `scanR` the scan's radius from the workshop (<0 none);
   * `draw` 0..1 the line drawn; `pulses` up to three comets [u, on, dir,
   * warmth]; `lit` per station 0..1 (working); `ping` per station 0..1 (a
   * ring spreading as it starts to work); `camera` for facing.
   */
  update(show: number, scanR: number, draw: number, pulses: THREE.Vector4[], lit: number[], ping: number[], time: number, camera: THREE.Camera, reduced: boolean) {
    this.group.visible = show > 0.005;
    if (!this.group.visible) return;
    this.u.uDraw.value = draw;
    this.u.uTime.value = reduced ? 0 : time;
    (this.u.uPulse.value as THREE.Vector4).copy(pulses[0]);
    (this.u.uPulseB.value as THREE.Vector4).copy(pulses[1]);
    (this.u.uPulseC.value as THREE.Vector4).copy(pulses[2]);
    this.u.uGlow.value = 2.6 * show;
    NODES.forEach((n, i) => {
      const k = scanR < 0 ? 1 : this.rise(i, scanR);
      const beam = smooth(range(k, 0, 0.45));
      const ringK = settle(range(k, 0.35, 0.75), 0.6);
      const tagK = settle(range(k, 0.6, 1), 0.4);
      const on = lit[i] ?? 0;
      const pg = ping[i] ?? 0;
      // The beam: up from the ground, then a thread (it stays, faint).
      const b = this.beams[i];
      b.scale.set(1, Math.max(0.01, n.pos.y * beam), 1);
      this.beamMat[i].color.setScalar((0.35 + 1.2 * (1 - beam) + 0.9 * on) * show);
      b.visible = beam > 0.001;
      // The ring: its size with a little weight, brighter while the station works.
      const ring = this.rings[i];
      ring.scale.setScalar(Math.max(0.001, ringK));
      ring.visible = ringK > 0.001;
      this.ringMat[i].color.setRGB(0.5, 0.42, 1.0).multiplyScalar((1.2 + 2.0 * on) * show);
      // The scanner: a bright segment running round the ring, faster while it works.
      const sw = this.sweeps[i];
      sw.visible = ringK > 0.5;
      sw.scale.setScalar(Math.max(0.001, ringK));
      sw.rotation.z = (reduced ? 0 : time) * (0.7 + 1.6 * on) + i * 1.3;
      this.sweepMat[i].color.setRGB(0.8, 0.74, 1.0).multiplyScalar((0.8 + 1.6 * on) * show);
      // The ping: a second ring spreading out and fading as the station starts.
      const p = this.pings[i];
      p.visible = pg > 0.001;
      p.scale.setScalar(1 + 2.6 * (1 - pg));
      this.pingMat[i].color.setRGB(0.6, 0.5, 1.0).multiplyScalar(pg * pg * 2.2 * show);
      // The tag, hung under the ring, facing the camera across the town.
      const card = this.cards[i];
      const yaw = Math.atan2(camera.position.x - n.pos.x, camera.position.z - n.pos.z);
      card.group.position.set(n.pos.x, n.pos.y - TAG_DROP - (1 - tagK) * 0.6, n.pos.z);
      card.group.rotation.set(-0.06, yaw, 0);
      card.group.scale.setScalar(Math.max(0.001, (0.6 + 0.4 * tagK) * this.labelScale));
      card.build = tagK;
      // A tag the camera passes close to steps aside (fades), rather than filling the frame.
      const near = THREE.MathUtils.smoothstep(camera.position.distanceTo(card.group.position), 6, 11);
      card.show(Math.min(1, tagK * 3) * show * near, 1.0 + on * 0.12);
      // A flash as it locks, and a glow while it works.
      const lock = Math.exp(-Math.max(0, k - 1) * 0) * (ringK >= 1 && tagK < 1 ? 1 - tagK : 0);
      const fl = this.flash[i];
      fl.position.copy(n.pos);
      fl.quaternion.copy(camera.quaternion);
      this.flashMat[i].color.setRGB(0.5, 0.42, 1.0).multiplyScalar((lock * 1.4 + on * 0.45) * show);
      fl.visible = lock + on > 0.01;
    });
  }
}
