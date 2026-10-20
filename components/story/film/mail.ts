import * as THREE from "three";
import { tablet } from "./model";
import { uiScale } from "./cards";

/**
 * MESSAGES IN FLIGHT. An enquiry leaves the customer's house as an envelope
 * of light and arcs over the town to the business; a reply comes back the
 * same way. Each flight is a pure function of its own progress: a curve, a
 * slight bank into it, and a trail of fading light behind it.
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function envelopeTexture() {
  const c = document.createElement("canvas");
  c.width = 384;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fbfaf7";
  g.fillRect(0, 0, 384, 256);
  // The flap's fold and the lower folds, as faint lines.
  g.strokeStyle = "rgba(10,11,16,0.22)";
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(8, 10);
  g.lineTo(192, 150);
  g.lineTo(376, 10);
  g.stroke();
  g.strokeStyle = "rgba(10,11,16,0.1)";
  g.beginPath();
  g.moveTo(8, 248);
  g.lineTo(150, 128);
  g.moveTo(376, 248);
  g.lineTo(234, 128);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export type Flight = { from: THREE.Vector3; to: THREE.Vector3; lift: number; color: THREE.Color };

/** A flight's curve: up from the start, over, down into the end. */
export function flightAt(f: Flight, t: number, out = new THREE.Vector3()) {
  const s = Math.min(1, Math.max(0, t));
  out.lerpVectors(f.from, f.to, s);
  out.y += Math.sin(s * Math.PI) * f.lift + (f.to.y - f.from.y) * 0;
  return out;
}

const TRAIL = 22;

export class Envelope {
  readonly group = new THREE.Group();
  private mesh: THREE.Mesh;
  private mat: THREE.MeshBasicMaterial;
  private trail: THREE.InstancedMesh;
  private trailMat: THREE.MeshBasicMaterial;
  private glow: THREE.Mesh;
  private glowMat: THREE.MeshBasicMaterial;
  private m = new THREE.Matrix4();
  readonly pos = new THREE.Vector3();
  constructor(scene: THREE.Scene, tex = envelopeTexture()) {
    this.mat = new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff, toneMapped: false, transparent: true, fog: false });
    const g = tablet(1.2, 0.8, 0.03, 0.04, 0.01);
    // UVs for the face (the tablet has none): project x/y.
    const pos = g.getAttribute("position");
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = pos.getX(i) / 1.2 + 0.5;
      uv[i * 2 + 1] = pos.getY(i) / 0.8 + 0.5;
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    this.mesh = new THREE.Mesh(g, this.mat);
    this.group.add(this.mesh);
    // A soft light round it.
    this.glowMat = new THREE.MeshBasicMaterial({ map: halo(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
    this.glow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), this.glowMat);
    this.glow.layers.set(1);
    this.group.add(this.glow);
    this.trailMat = new THREE.MeshBasicMaterial({ map: halo(), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
    this.trail = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), this.trailMat, TRAIL);
    this.trail.layers.set(1);
    this.trail.frustumCulled = false;
    this.trail.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(TRAIL * 3), 3);
    scene.add(this.group, this.trail);
    this.group.visible = false;
    this.trail.visible = false;
  }

  /**
   * Fly along `f` at t (0..1), the camera's position for the trail's facing.
   * `k` its visibility; `size` its scale.
   */
  update(f: Flight | null, t: number, k: number, camera: THREE.Camera, size = 1) {
    const on = !!f && k > 0.005;
    this.group.visible = on;
    this.trail.visible = on && t > 0.01 && t < 0.995;
    if (!on || !f) return;
    flightAt(f, t, this.pos);
    const ahead = flightAt(f, t + 0.01, new THREE.Vector3());
    const dir = ahead.sub(this.pos).normalize();
    this.group.position.copy(this.pos);
    // Face the camera, leaning a little into the turn.
    this.group.quaternion.copy(camera.quaternion);
    const bank = Math.sin(t * Math.PI * 2) * 0.12;
    this.mesh.rotation.set(0, 0, bank + dir.x * 0.1);
    this.group.scale.setScalar(size);
    this.mat.opacity = k;
    // Paper, faintly warm or cool, a touch brighter than a screen (it carries its own light).
    this.mat.color.copy(f.color).lerp(new THREE.Color(1, 1, 1), 0.7).multiplyScalar(1.25 * uiScale.k);
    this.glowMat.color.copy(f.color).multiplyScalar(0.7 * k * Math.min(1, uiScale.k * 1.9));
    // The trail: the way it came, fading.
    const cq = camera.quaternion;
    const col = new THREE.Color();
    for (let i = 0; i < TRAIL; i++) {
      const tt = t - (i + 1) * 0.012;
      const p = flightAt(f, Math.max(0, tt), new THREE.Vector3());
      const fade = (1 - i / TRAIL) * (tt > 0 ? 1 : 0) * k;
      const s = (1.6 - i * 0.05) * size;
      this.m.compose(p, cq, new THREE.Vector3(s, s, s));
      this.trail.setMatrixAt(i, this.m);
      col.copy(f.color).multiplyScalar(0.55 * fade * fade);
      this.trail.setColorAt(i, col);
    }
    this.trail.instanceMatrix.needsUpdate = true;
    this.trail.instanceColor!.needsUpdate = true;
  }
}

let haloTex: THREE.Texture | null = null;
/** A round, soft dot of light (shared). */
export function halo() {
  if (haloTex) return haloTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.18, "rgba(255,255,255,0.55)");
  r.addColorStop(0.45, "rgba(255,255,255,0.14)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  haloTex = new THREE.CanvasTexture(c);
  return haloTex;
}

export { V as vec3 };
