import * as THREE from "three";
import { roundRect, tablet } from "./model";
import { mailStrip, NIGHT_MAIL, type Ctx, type Mail } from "./ui";

/**
 * SCREENS AND CARDS. A Screen is a canvas and its texture: it redraws only
 * when its state's key changes. A Card is a screen in the air: a thin white
 * slab with rounded corners and the screen on its face, which can lift off a
 * device (the phone, the laptop) and settle somewhere the camera can read it.
 */

export class Screen {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: Ctx;
  readonly tex: THREE.CanvasTexture;
  private key = "";
  constructor(
    readonly w: number,
    readonly h: number,
    readonly scale: number,
    mips = true
  ) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = Math.round(w * scale);
    this.canvas.height = Math.round(h * scale);
    // Screens that change often are drawn in software: uploading a GPU canvas
    // stalls the frame while Chrome rasterises it; a CPU canvas uploads as pixels.
    this.ctx = this.canvas.getContext("2d", mips ? undefined : { willReadFrequently: true })!;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
    this.tex.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
    this.tex.generateMipmaps = mips;
    // Live screens are drawn upside down and uploaded as they are (no flip on upload).
    this.flip = !mips;
    if (this.flip) this.tex.flipY = false;
  }
  private flip = false;
  /** Draw if the key changed. `draw` works in points (the canvas is scaled). */
  draw(key: string, draw: (ctx: Ctx) => void) {
    if (key === this.key) return false;
    this.key = key;
    const c = this.ctx;
    if (this.flip) c.setTransform(this.scale, 0, 0, -this.scale, 0, this.canvas.height);
    else c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    draw(c);
    this.tex.needsUpdate = true;
    return true;
  }
  /** Forget the last key (fonts arrived: draw everything again). */
  dirty() {
    this.key = "";
  }
}

/** A rounded rectangle face with UVs over it (0..1), facing +Z, centred. */
export function faceGeometry(w: number, h: number, r: number) {
  const shape = new THREE.Shape(roundRect(w, h, r, 10).map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ShapeGeometry(shape, 10);
  const pos = g.getAttribute("position");
  const uv = g.getAttribute("uv");
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  uv.needsUpdate = true;
  return g;
}

/** The material for a screen's face: unlit, its brightness a colour (HDR). */
export function faceMat(tex: THREE.Texture) {
  return new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff, toneMapped: false, transparent: true, depthWrite: true, fog: false });
}

/**
 * The screens' light against the film's exposure: a screen is drawn at the
 * same brightness whatever the exposure (the world sets k = 1 / exposure),
 * so white stays paper-white and never blooms.
 */
export const uiScale = { k: 1 };

export class Card {
  readonly group = new THREE.Group();
  readonly body: THREE.Mesh;
  readonly face: THREE.Mesh;
  /** The same screen on the back (mirrored back so it reads from behind too). */
  readonly back: THREE.Mesh;
  readonly faceMat: THREE.MeshBasicMaterial;
  readonly bodyMat: THREE.MeshStandardMaterial;
  constructor(
    readonly screen: Screen,
    readonly w: number,
    readonly h: number,
    radius = 0.06,
    thick = 0.03
  ) {
    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0xf2f1ee, roughness: 0.35, metalness: 0, transparent: true });
    this.body = new THREE.Mesh(tablet(w, h, thick, radius, Math.min(0.01, thick * 0.3)), this.bodyMat);
    this.body.castShadow = true;
    this.faceMat = faceMat(screen.tex);
    this.face = new THREE.Mesh(faceGeometry(w - radius * 0.35, h - radius * 0.35, radius * 0.85), this.faceMat);
    this.face.position.z = thick / 2 + 0.002;
    const bg = faceGeometry(w - radius * 0.35, h - radius * 0.35, radius * 0.85);
    // Turned to face the other way, its UVs as they were: from behind it reads left to right too.
    bg.rotateY(Math.PI);
    this.back = new THREE.Mesh(bg, this.faceMat);
    this.back.position.z = -thick / 2 - 0.002;
    this.group.add(this.body, this.face, this.back);
    this.group.visible = false;
  }
  /** Show at a brightness (the screen's light) and an opacity. */
  show(k: number, glow = 1) {
    this.group.visible = k > 0.002;
    this.faceMat.opacity = k;
    this.bodyMat.opacity = k;
    this.body.visible = k > 0.98 ? true : k > 0.02;
    this.faceMat.color.setScalar(glow * uiScale.k);
    this.bodyMat.depthWrite = k > 0.98;
  }
}

/**
 * THE INBOX COLUMN: every email that lands overnight, a strip of its own,
 * stacked newest on top. The strips share one atlas (a row each), redrawn
 * when one's state changes (read, or gone cold when its customer gives up).
 */
export class Strips {
  readonly mesh: THREE.InstancedMesh;
  readonly atlas: Screen;
  readonly n: number;
  readonly W = 3.6;
  readonly H = 0.47;
  private state: Int8Array;
  private uv: THREE.InstancedBufferAttribute;
  private fade: THREE.InstancedBufferAttribute;
  readonly mails: Mail[];
  constructor(mails: Mail[] = NIGHT_MAIL) {
    this.mails = mails;
    this.n = mails.length;
    const rowH = 80;
    this.atlas = new Screen(1024, rowH * this.n, 1);
    this.state = new Int8Array(this.n).fill(-1);
    const g = new THREE.BoxGeometry(this.W, this.H, 0.03);
    // Only the front face samples the atlas; the box's other faces sample a white texel.
    this.uv = new THREE.InstancedBufferAttribute(new Float32Array(this.n * 2), 2);
    this.fade = new THREE.InstancedBufferAttribute(new Float32Array(this.n).fill(1), 1);
    g.setAttribute("aRow", this.uv);
    g.setAttribute("aFade", this.fade);
    const rows = this.n;
    const mat = new THREE.MeshBasicMaterial({ map: this.atlas.tex, color: 0xffffff, toneMapped: false, transparent: true, fog: false });
    mat.onBeforeCompile = (s) => {
      s.vertexShader = s.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec2 aRow;\nattribute float aFade;\nvarying float vFade;\nvarying float vFront;")
        .replace(
          "#include <uv_vertex>",
          `#include <uv_vertex>
vFront = step(0.5, normal.z);
vMapUv = vec2(uv.x, (aRow.x + uv.y) / ${rows.toFixed(1)});
vFade = aFade;`
        );
      s.fragmentShader = s.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vFade;\nvarying float vFront;")
        .replace("#include <map_fragment>", "#include <map_fragment>\nif (vFront < 0.5) diffuseColor.rgb = vec3(0.93, 0.925, 0.915);\ndiffuseColor.a *= vFade;");
    };
    mat.customProgramCacheKey = () => "strips";
    this.mesh = new THREE.InstancedMesh(g, mat, this.n);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < this.n; i++) {
      // Rows are stacked top-down in the canvas; UV y runs bottom-up.
      this.uv.setX(i, this.n - 1 - i);
    }
    this.uv.needsUpdate = true;
  }
  /** Set each email's state (0 unread, 1 read, 2 gone cold); redraws the rows that changed. */
  setStates(states: number[]) {
    let changed = false;
    const c = this.atlas.ctx;
    for (let i = 0; i < this.n; i++) {
      const s = states[i] ?? 0;
      if (s === this.state[i]) continue;
      this.state[i] = s;
      changed = true;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, i * 80, 1024, 80);
      mailStrip(c, 0, i * 80, 1024, 80, this.mails[i], s);
    }
    if (changed) this.atlas.tex.needsUpdate = true;
  }
  /** Place strip i (matrix) and its opacity. */
  place(i: number, m: THREE.Matrix4, fade: number) {
    this.mesh.setMatrixAt(i, m);
    this.fade.setX(i, fade);
  }
  commit() {
    (this.mesh.material as THREE.MeshBasicMaterial).color.setScalar(uiScale.k);
    this.mesh.instanceMatrix.needsUpdate = true;
    this.fade.needsUpdate = true;
  }
  dirty() {
    this.state.fill(-1);
  }
}

/** Smoothly carry a card from one place (a device's screen) to another (the air): position, turn, size. */
export function carry(o: THREE.Object3D, a: { p: THREE.Vector3; q: THREE.Quaternion; s: number }, b: { p: THREE.Vector3; q: THREE.Quaternion; s: number }, k: number, arc = 0) {
  o.position.lerpVectors(a.p, b.p, k);
  if (arc) o.position.y += Math.sin(k * Math.PI) * arc;
  o.quaternion.slerpQuaternions(a.q, b.q, k);
  o.scale.setScalar(a.s + (b.s - a.s) * k);
}
