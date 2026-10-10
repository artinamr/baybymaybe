import * as THREE from "three";
import { R } from "./layout";
import { marbleMaterial, streakMaterial } from "./materials";
import { M, type Sim } from "./sim";
import type { HeroState } from "./hero";

/**
 * Drawing the customers: one instanced draw for every marble (ours a little
 * larger and brighter), one for the streaks of the ones falling, one for the
 * lake of the lost at the bottom of the pit.
 */
export class Marbles {
  readonly mesh: THREE.InstancedMesh;
  readonly streaks: THREE.Mesh;
  readonly lake: THREE.Points;
  private color: THREE.InstancedBufferAttribute;
  private sPos: THREE.InstancedBufferAttribute;
  private sVel: THREE.InstancedBufferAttribute;
  private sCol: THREE.InstancedBufferAttribute;
  private sGeo: THREE.InstancedBufferGeometry;
  private lakePos: THREE.BufferAttribute;
  private lakeB: THREE.BufferAttribute;
  private m = new THREE.Matrix4();
  private max: number;

  constructor(n: number, lakeMax: number, detail: number) {
    this.max = n + 1;
    const geo = new THREE.IcosahedronGeometry(R, detail);
    this.color = new THREE.InstancedBufferAttribute(new Float32Array(this.max * 3), 3);
    this.color.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("aColor", this.color);
    this.mesh = new THREE.InstancedMesh(geo, marbleMaterial(), this.max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;

    // Streaks: a quad (x 0 head → 1 tail, y −1..1 across) per falling customer.
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0], 3));
    g.setIndex([0, 2, 1, 1, 2, 3]);
    this.sPos = new THREE.InstancedBufferAttribute(new Float32Array(this.max * 3), 3);
    this.sVel = new THREE.InstancedBufferAttribute(new Float32Array(this.max * 3), 3);
    this.sCol = new THREE.InstancedBufferAttribute(new Float32Array(this.max * 3), 3);
    [this.sPos, this.sVel, this.sCol].forEach((a) => a.setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aPos", this.sPos);
    g.setAttribute("aVel", this.sVel);
    g.setAttribute("aColor", this.sCol);
    g.instanceCount = 0;
    this.sGeo = g;
    this.streaks = new THREE.Mesh(g, streakMaterial());
    this.streaks.frustumCulled = false;
    this.streaks.renderOrder = 4;
    (this.streaks.material as THREE.ShaderMaterial).uniforms.uLen.value = 0.16;

    // The lake.
    const lg = new THREE.BufferGeometry();
    this.lakePos = new THREE.BufferAttribute(new Float32Array(lakeMax * 3), 3);
    this.lakeB = new THREE.BufferAttribute(new Float32Array(lakeMax), 1);
    this.lakePos.setUsage(THREE.DynamicDrawUsage);
    this.lakeB.setUsage(THREE.DynamicDrawUsage);
    lg.setAttribute("position", this.lakePos);
    lg.setAttribute("aB", this.lakeB);
    lg.setDrawRange(0, 0);
    this.lake = new THREE.Points(
      lg,
      new THREE.ShaderMaterial({
        uniforms: { uPx: { value: 230 } },
        vertexShader: /* glsl */ `
          attribute float aB; uniform float uPx; varying float vB;
          void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vB = aB; gl_PointSize = clamp(uPx / -mv.z, 2.5, 22.0); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */ `
          varying float vB;
          void main() { float r = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, r); float core = smoothstep(0.18, 0.0, r); gl_FragColor = vec4((vec3(1.4, 0.2, 0.07) * a * 0.6 + vec3(2.6, 0.7, 0.3) * core) * vB, 1.0); }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    this.lake.frustumCulled = false;
    this.lake.renderOrder = 3;
  }

  /** The program set, for compiling before the film shows. */
  objects() {
    return [this.mesh, this.streaks, this.lake];
  }

  update(sim: Sim, hero: HeroState, heroK: number) {
    const m = this.m;
    const col = this.color.array as Float32Array;
    let k = 0;
    let f = 0;
    const sp = this.sPos.array as Float32Array;
    const sv = this.sVel.array as Float32Array;
    const sc = this.sCol.array as Float32Array;
    for (let i = 0; i < sim.n; i++) {
      const mode = sim.mode[i];
      if (mode === M.FREE) continue;
      const o = i * 3;
      const s = sim.user[i] ? 1.12 : 1;
      m.makeScale(s, s, s);
      m.setPosition(sim.pos[o], sim.pos[o + 1], sim.pos[o + 2]);
      this.mesh.setMatrixAt(k, m);
      col[k * 3] = sim.col[o];
      col[k * 3 + 1] = sim.col[o + 1];
      col[k * 3 + 2] = sim.col[o + 2];
      k++;
      if (mode === M.FALL) {
        sp[f * 3] = sim.pos[o];
        sp[f * 3 + 1] = sim.pos[o + 1];
        sp[f * 3 + 2] = sim.pos[o + 2];
        sv[f * 3] = sim.vel[o];
        sv[f * 3 + 1] = sim.vel[o + 1];
        sv[f * 3 + 2] = sim.vel[o + 2];
        sc[f * 3] = sim.col[o] * 0.7;
        sc[f * 3 + 1] = sim.col[o + 1] * 0.7;
        sc[f * 3 + 2] = sim.col[o + 2] * 0.7;
        f++;
      }
    }
    if (hero.visible && heroK > 0.001) {
      const s = 1.18;
      m.makeScale(s, s, s);
      m.setPosition(hero.pos.x, hero.pos.y, hero.pos.z);
      this.mesh.setMatrixAt(k, m);
      col[k * 3] = hero.col.r * 1.2 * heroK;
      col[k * 3 + 1] = hero.col.g * 1.2 * heroK;
      col[k * 3 + 2] = hero.col.b * 1.2 * heroK;
      k++;
      if (hero.falling) {
        sp.set([hero.pos.x, hero.pos.y, hero.pos.z], f * 3);
        sv.set([hero.vel.x, hero.vel.y, hero.vel.z], f * 3);
        sc.set([hero.col.r, hero.col.g, hero.col.b], f * 3);
        f++;
      }
    }
    this.mesh.count = k;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.color.needsUpdate = true;
    this.sGeo.instanceCount = f;
    if (f) {
      this.sPos.needsUpdate = true;
      this.sVel.needsUpdate = true;
      this.sCol.needsUpdate = true;
    }
    // The lake, straight from the simulation's ring.
    const lp = this.lakePos.array as Float32Array;
    const lb = this.lakeB.array as Float32Array;
    for (let i = 0; i < sim.lakeN; i++) {
      lp[i * 3] = sim.lake[i * 4];
      lp[i * 3 + 1] = sim.lake[i * 4 + 1];
      lp[i * 3 + 2] = sim.lake[i * 4 + 2];
      lb[i] = sim.lake[i * 4 + 3];
    }
    this.lake.geometry.setDrawRange(0, sim.lakeN);
    if (sim.lakeN) {
      this.lakePos.needsUpdate = true;
      this.lakeB.needsUpdate = true;
    }
  }
}
