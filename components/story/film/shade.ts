import * as THREE from "three";

/**
 * CONTACT SHADOWS. Nothing in the film casts a shadow map (the machine moves
 * piece by piece, and a shadow pass over all of it would cost a frame), so
 * things stood on the floor looked pasted on. Each grounded thing gets a soft
 * dark pool under it instead: a gaussian on a flat quad just above the floor,
 * drawn over the stone before anything transparent. Feet, the chair and the
 * desk move their pools with them; the windlass's go as it is torn away.
 *
 * One instanced draw. Per instance: position (x, z), size (sx, sz), turn about
 * y, and how dark (0..1).
 */
export class ContactShade {
  readonly mesh: THREE.InstancedMesh;
  private dark: THREE.InstancedBufferAttribute;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private s = new THREE.Vector3();
  private p = new THREE.Vector3();
  private n = 0;

  constructor(
    max: number,
    private y: number
  ) {
    const g = new THREE.PlaneGeometry(1, 1);
    g.rotateX(-Math.PI / 2);
    this.dark = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
    this.dark.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("aDark", this.dark);
    const mat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        attribute float aDark;
        varying vec2 vUv; varying float vDark;
        void main() {
          vUv = uv * 2.0 - 1.0;
          vDark = aDark;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying vec2 vUv; varying float vDark;
        void main() {
          float r2 = dot(vUv, vUv);
          // A soft core and a long, faint tail, as light occluded near the floor falls off.
          float a = (exp(-r2 * 5.0) * 0.75 + exp(-r2 * 1.6) * 0.25) * (1.0 - smoothstep(0.82, 1.0, r2));
          gl_FragColor = vec4(0.0, 0.0, 0.0, a * vDark);
        }`,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.mesh = new THREE.InstancedMesh(g, mat, max);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.mesh.count = 0;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }

  /** Start a frame's pools. */
  begin() {
    this.n = 0;
  }

  /** A pool at (x, z) on the floor, sx by sz, turned by `yaw`, `dark` deep. */
  add(x: number, z: number, sx: number, sz: number, yaw: number, dark: number, y = this.y) {
    if (dark <= 0.002 || this.n >= this.dark.count) return;
    this.q.setFromAxisAngle(_Y, yaw);
    this.m.compose(this.p.set(x, y + 0.004, z), this.q, this.s.set(sx, 1, sz));
    this.mesh.setMatrixAt(this.n, this.m);
    (this.dark.array as Float32Array)[this.n] = Math.min(1, dark);
    this.n++;
  }

  end() {
    this.mesh.count = this.n;
    if (this.n) {
      this.mesh.instanceMatrix.needsUpdate = true;
      this.dark.needsUpdate = true;
    }
  }
}

const _Y = new THREE.Vector3(0, 1, 0);
