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

// A hologram's face: the screen, built top-down behind a line of light.
const HOLO_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const HOLO_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D map;
uniform float uBuild;
uniform float uGlow;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(map, vUv);
  float edge = 1.0 - uBuild;
  float on = step(edge, vUv.y);
  float line = exp(-pow((vUv.y - edge) * 70.0, 2.0)) * step(0.001, uBuild) * step(uBuild, 0.999);
  vec3 col = c.rgb * uGlow * on + vec3(0.62, 0.52, 1.0) * line * 3.0;
  float a = (c.a * on + line) * uOpacity;
  if (a < 0.003) discard;
  gl_FragColor = vec4(col, a);
}`;

/** The edge of a hologram: a band of light just outside the face. */
function edgeGeometry(w: number, h: number, r: number, band = 0.05) {
  const outer = new THREE.Shape(roundRect(w + band * 2, h + band * 2, r + band, 10).map(([x, y]) => new THREE.Vector2(x, y)));
  outer.holes.push(new THREE.Path(roundRect(w - 0.01, h - 0.01, Math.max(0.002, r - 0.005), 10).map(([x, y]) => new THREE.Vector2(x, y))));
  return new THREE.ShapeGeometry(outer, 10);
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
    thick = 0.03,
    look: { bezel?: number; body?: THREE.ColorRepresentation; metal?: number; holo?: boolean } = {}
  ) {
    this.holo = !!look.holo;
    this.bodyMat = new THREE.MeshStandardMaterial({ color: look.body ?? 0xf2f1ee, roughness: look.body ? 0.28 : 0.35, metalness: look.metal ?? 0, transparent: true });
    this.body = new THREE.Mesh(tablet(w, h, thick, radius, Math.min(0.01, thick * 0.3)), this.bodyMat);
    this.body.castShadow = true;
    this.faceMat = faceMat(screen.tex);
    const inset = look.bezel ?? radius * 0.175;
    const fg = faceGeometry(w - inset * 2, h - inset * 2, Math.max(0.005, radius - inset * 0.7));
    if (this.holo) {
      // Dark glass, the screen built behind a line of light, an edge of light round it.
      this.bodyMat.opacity = 0.8;
      this.bodyMat.roughness = 0.18;
      this.holoMat = new THREE.ShaderMaterial({
        vertexShader: HOLO_VERT,
        fragmentShader: HOLO_FRAG,
        uniforms: { map: { value: screen.tex }, uBuild: { value: 1 }, uGlow: { value: 1 }, uOpacity: { value: 1 } },
        transparent: true,
        depthWrite: true,
        toneMapped: false,
        fog: false,
      });
      this.edgeMat = new THREE.MeshBasicMaterial({ color: 0x7a66ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false });
      this.edge = new THREE.Mesh(edgeGeometry(w - inset * 2, h - inset * 2, Math.max(0.005, radius - inset * 0.7)), this.edgeMat);
      this.edge.position.z = thick / 2 + 0.004;
      this.edge.layers.set(1);
      this.group.add(this.edge);
    }
    this.face = new THREE.Mesh(fg, this.holoMat ?? this.faceMat);
    this.face.position.z = thick / 2 + 0.002;
    const bg = faceGeometry(w - inset * 2, h - inset * 2, Math.max(0.005, radius - inset * 0.7));
    // Turned to face the other way, its UVs as they were: from behind it reads left to right too.
    bg.rotateY(Math.PI);
    this.back = new THREE.Mesh(bg, this.holoMat ?? this.faceMat);
    this.back.position.z = -thick / 2 - 0.002;
    this.group.add(this.body, this.face, this.back);
    this.group.visible = false;
  }
  /** A hologram (dark glass, an edge of light, built top-down), or a card of paper. */
  readonly holo: boolean;
  private holoMat: THREE.ShaderMaterial | null = null;
  private edge: THREE.Mesh | null = null;
  private edgeMat: THREE.MeshBasicMaterial | null = null;
  /** 0..1 how much of a hologram's face is built (top-down, behind a line of light). */
  private built = 1;
  get build() {
    return this.built;
  }
  set build(v: number) {
    this.built = v;
    if (this.holoMat) this.holoMat.uniforms.uBuild.value = v;
  }
  private k = 0;
  private glow = 1;
  /** 1, or less while it passes behind the words (World.keepClear). */
  clear = 1;
  /** Show at a brightness (the screen's light) and an opacity. */
  show(k: number, glow = 1) {
    this.k = k;
    this.glow = glow;
    this.apply();
  }
  /** What show() asked for, at the current clearance. */
  get shown() {
    return this.k;
  }
  apply() {
    const k = this.k * this.clear;
    this.group.visible = k > 0.002;
    this.faceMat.opacity = k;
    this.faceMat.color.setScalar(this.glow * uiScale.k);
    if (this.holoMat) {
      this.holoMat.uniforms.uOpacity.value = k;
      this.holoMat.uniforms.uGlow.value = this.glow * uiScale.k;
      this.bodyMat.opacity = 0.8 * k;
      this.bodyMat.depthWrite = false;
      if (this.edgeMat) this.edgeMat.color.setRGB(0.48, 0.4, 1.0).multiplyScalar(k * (0.35 + 0.65 * this.built) * (0.6 + 0.4 * this.glow));
    } else {
      this.bodyMat.opacity = k;
      this.bodyMat.depthWrite = k > 0.98;
    }
    this.body.visible = k > 0.98 ? true : k > 0.02;
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
