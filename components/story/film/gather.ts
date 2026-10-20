import * as THREE from "three";

/**
 * THE TURN'S GATHERING: the jobs that crowded the desk at 11:47pm come apart
 * into light. Each card burns away from a ragged edge (cards.ts `dissolve`)
 * and what it was made of streams off it as sparks, curling round the owner,
 * and runs together over the keyboard into the drop (drop.ts). A pure
 * function of P: every spark knows the card it left, when, its curl, and
 * where it is going.
 */

const VERT = /* glsl */ `
attribute vec3 aFrom;
attribute vec4 aSeed;
uniform float uP;
uniform vec3 uTo;
uniform float uScale;
varying float vA;
varying float vHot;
void main() {
  float delay = aSeed.x;
  float dur = 0.2 + 0.08 * aSeed.w;
  float t = clamp((uP - delay) / dur, 0.0, 1.0);
  float e = t * t * (3.0 - 2.0 * t);
  // Off the card, up and round in a curl, then in to the heart.
  vec3 d = uTo - aFrom;
  vec3 side = normalize(cross(d, vec3(0.0, 1.0, 0.0)) + 1e-4);
  vec3 up = vec3(0.0, 1.0, 0.0);
  float curl = sin(e * 3.14159) * aSeed.z;
  float ph = aSeed.y + e * 5.0;
  vec3 p = aFrom + d * e + (side * cos(ph) + up * (0.6 + 0.4 * sin(ph))) * curl;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float live = step(0.0001, t) * (1.0 - step(0.9999, t));
  vA = live * smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.82, 1.0, t));
  vHot = e;
  gl_PointSize = live * uScale * (0.6 + 0.9 * aSeed.w) * (1.0 + 0.8 * sin(t * 3.14159)) / max(-mv.z, 0.05);
}`;

const FRAG = /* glsl */ `
precision highp float;
varying float vA;
varying float vHot;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r2 = dot(c, c) * 4.0;
  if (r2 > 1.0) discard;
  float core = exp(-r2 * 5.0);
  // Warm as it leaves the paper, the brand's indigo-white as it joins the drop.
  vec3 col = mix(vec3(1.0, 0.72, 0.42), vec3(0.62, 0.52, 1.0), vHot);
  col = mix(col, vec3(1.0), core * 0.6);
  gl_FragColor = vec4(col * core * vA * 2.4, 1.0);
}`;

export type CardRest = { m: THREE.Matrix4; w: number; h: number; t0: number; t1: number };

export class Gather {
  readonly points: THREE.Points;
  private mat: THREE.ShaderMaterial;
  private built = false;
  private n: number;
  constructor(scene: THREE.Scene, n = 2600) {
    this.n = n;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("aFrom", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(n * 4), 4));
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uP: { value: 0 }, uTo: { value: new THREE.Vector3() }, uScale: { value: 40 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.visible = false;
    // Light that is not a surface: kept out of the depth pass.
    this.points.layers.set(1);
    scene.add(this.points);
  }
  /** Where each card rests at the freeze, when it burns, and where the sparks go. */
  build(cards: CardRest[], to: THREE.Vector3) {
    const from = this.points.geometry.getAttribute("aFrom") as THREE.BufferAttribute;
    const seed = this.points.geometry.getAttribute("aSeed") as THREE.BufferAttribute;
    let s = 1;
    const rnd = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    const v = new THREE.Vector3();
    for (let i = 0; i < this.n; i++) {
      const c = cards[i % cards.length];
      v.set((rnd() - 0.5) * c.w, (rnd() - 0.5) * c.h, (rnd() - 0.5) * 0.02).applyMatrix4(c.m);
      from.setXYZ(i, v.x, v.y, v.z);
      // It leaves as the burn reaches it: early from the edge, late from the middle.
      const t = c.t0 + (c.t1 - c.t0) * (0.15 + 0.8 * rnd());
      seed.setXYZW(i, t, rnd() * 6.283, 0.05 + 0.3 * rnd(), rnd());
    }
    from.needsUpdate = true;
    seed.needsUpdate = true;
    (this.mat.uniforms.uTo.value as THREE.Vector3).copy(to);
    this.built = true;
  }
  update(P: number, on: boolean, height: number) {
    this.points.visible = on && this.built;
    if (!this.points.visible) return;
    this.mat.uniforms.uP.value = P;
    // Point size in pixels at a metre: the frame's height decides it.
    this.mat.uniforms.uScale.value = height * 0.016;
  }
}
