import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { between, gothicArch, place, unitBox } from "./geo";
import { FLOOR_Y, PIT_R, PIT_Y } from "./layout";
import { dustMaterial, haloMaterial, shaftMaterial, stoneMaterial, windowMaterial } from "./materials";

/**
 * THE HALL: the business's machine stands in a cathedral, so its scale reads
 * at once. Clustered piers march away into the fog, pointed arcades and vault
 * ribs overhead, tall windows and a rose at the far end lit in the chapter's
 * colour, light falling through them onto dust, and in the floor the round
 * pit the machine stands in, its bottom glowing with every customer lost.
 * All static: three merged draws for the stone, one for the glass.
 */

const COL = (r: number, g: number, b: number) => new THREE.Color(r, g, b);

function tint(g: THREE.BufferGeometry, c: THREE.Color) {
  const n = g.getAttribute("position").count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return g;
}

function bake(g: THREE.BufferGeometry, m: THREE.Matrix4, c: THREE.Color) {
  const h = g.index ? g.toNonIndexed() : g.clone();
  h.deleteAttribute("uv");
  h.applyMatrix4(m);
  return tint(h, c);
}

export function buildHall(phone: boolean) {
  const group = new THREE.Group();
  const stone: THREE.BufferGeometry[] = [];
  const S = COL(0.07, 0.065, 0.06);
  const S2 = COL(0.05, 0.047, 0.045);
  const FLOOR = COL(0.06, 0.055, 0.05);

  // The floor of the nave, with the pit cut out of it.
  const floor = new THREE.RingGeometry(PIT_R, 170, 96, 4);
  stone.push(bake(floor, place(0, FLOOR_Y, 0, -Math.PI / 2, 0, 0), FLOOR));
  // The curb round the pit.
  stone.push(bake(new THREE.TorusGeometry(PIT_R + 0.2, 0.3, 6, 96), place(0, FLOOR_Y + 0.1, 0, Math.PI / 2, 0, 0), S));
  // A railing round the pit: posts and a rail, at human height (it gives the scale).
  const rail: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 72; k++) {
    const a = (k / 72) * Math.PI * 2;
    if (Math.abs(a - 0.25) < 0.12) continue;
    const x = Math.cos(a) * (PIT_R + 0.45);
    const z = Math.sin(a) * (PIT_R + 0.45);
    rail.push(bake(unitBox, place(x, FLOOR_Y + 0.55, z, 0, -a, 0, 0.05, 1.1, 0.05), COL(0.04, 0.04, 0.042)));
  }
  rail.push(bake(new THREE.TorusGeometry(PIT_R + 0.45, 0.03, 4, 120), place(0, FLOOR_Y + 1.1, 0, Math.PI / 2, 0, 0), COL(0.06, 0.055, 0.05)));
  stone.push(...rail);
  // The pit's wall, banded, down into the dark.
  const wall = new THREE.CylinderGeometry(PIT_R, PIT_R, FLOOR_Y - PIT_Y, 72, 8, true);
  const wm = place(0, (FLOOR_Y + PIT_Y) / 2, 0);
  const wg = bake(wall, wm, S2);
  // Face inward.
  const nrm = wg.getAttribute("normal") as THREE.BufferAttribute;
  for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, -nrm.getX(i), -nrm.getY(i), -nrm.getZ(i));
  const pos = wg.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i += 3) {
    const ax = pos.getX(i + 1);
    pos.setX(i + 1, pos.getX(i + 2));
    pos.setX(i + 2, ax);
    const ay = pos.getY(i + 1);
    pos.setY(i + 1, pos.getY(i + 2));
    pos.setY(i + 2, ay);
    const az = pos.getZ(i + 1);
    pos.setZ(i + 1, pos.getZ(i + 2));
    pos.setZ(i + 2, az);
    const nx = nrm.getX(i + 1);
    nrm.setX(i + 1, nrm.getX(i + 2));
    nrm.setX(i + 2, nx);
    const ny = nrm.getY(i + 1);
    nrm.setY(i + 1, nrm.getY(i + 2));
    nrm.setY(i + 2, ny);
    const nz = nrm.getZ(i + 1);
    nrm.setZ(i + 1, nrm.getZ(i + 2));
    nrm.setZ(i + 2, nz);
  }
  stone.push(wg);
  for (let k = 1; k < 5; k++) stone.push(bake(new THREE.TorusGeometry(PIT_R - 0.15, 0.22, 4, 96), place(0, FLOOR_Y - k * 8, 0, Math.PI / 2, 0, 0), S));
  // The pit's floor.
  stone.push(bake(new THREE.CircleGeometry(PIT_R, 72), place(0, PIT_Y, 0, -Math.PI / 2, 0, 0), COL(0.012, 0.009, 0.008)));

  // Piers: a column with four shafts round it, a capital, rising into the vaults.
  const xs = [-34, 34];
  const zs: number[] = [];
  for (let z = 64; z >= -116; z -= 15) zs.push(z);
  const top = 74;
  for (const x of xs)
    for (const z of zs) {
      stone.push(bake(new THREE.CylinderGeometry(1.5, 1.7, top - FLOOR_Y, 12, 1), place(x, (top + FLOOR_Y) / 2, z), S));
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        stone.push(bake(new THREE.CylinderGeometry(0.45, 0.5, top - FLOOR_Y + 4, 8, 1), place(x + Math.cos(a) * 1.6, (top + FLOOR_Y + 4) / 2, z + Math.sin(a) * 1.6), S));
      }
      stone.push(bake(new THREE.CylinderGeometry(2.4, 1.9, 1.4, 12, 1), place(x, 49.3, z), S));
      stone.push(bake(new THREE.CylinderGeometry(2.5, 2.6, 1.2, 12, 1), place(x, FLOOR_Y + 0.6, z), S2));
    }
  // Arcades between the piers (along the nave), and the walls of the aisles behind them.
  for (const x of xs)
    for (let i = 0; i < zs.length - 1; i++) {
      const zc = (zs[i] + zs[i + 1]) / 2;
      stone.push(bake(gothicArch(15 - 3.2, 9, 1.0, 1.6, 10), place(x, 50, zc, 0, Math.PI / 2, 0), S));
      stone.push(bake(unitBox, place(x, 63, zc, 0, 0, 0, 1.2, 8, 12), S2));
    }
  // Vault ribs across the nave at every pair of piers.
  for (const z of zs) {
    stone.push(bake(gothicArch(68, 26, 1.1, 1.3, 18), place(0, top, z), S));
  }
  // The ridge.
  stone.push(bake(unitBox, place(0, top + 25.6, -26, 0, 0, 0, 1.2, 1.2, 190), S));

  const stoneGeo = mergeGeometries(stone, false)!;
  stone.forEach((g) => g.dispose());
  const stoneMesh = new THREE.Mesh(stoneGeo, stoneMaterial());
  stoneMesh.frustumCulled = false;
  group.add(stoneMesh);

  // The windows: lancets high in the aisles, the rose at the far end.
  const wins: THREE.BufferGeometry[] = [];
  const addWin = (m: THREE.Matrix4, kind: number) => {
    const g = new THREE.PlaneGeometry(1, 1);
    g.applyMatrix4(m);
    const k = new Float32Array(4).fill(kind);
    g.setAttribute("aKind", new THREE.BufferAttribute(k, 1));
    wins.push(g);
  };
  for (const x of xs)
    for (let i = 0; i < zs.length - 1; i++) {
      const zc = (zs[i] + zs[i + 1]) / 2;
      const face = x < 0 ? Math.PI / 2 : -Math.PI / 2;
      addWin(place(x * 1.22, 62, zc, 0, face, 0, 5.5, 18, 1), 0);
      if (i % 2 === 0) addWin(place(x * 1.22, 32, zc, 0, face, 0, 3.6, 12, 1), 0);
    }
  // The rose, high at the far end: the tower stands under it.
  addWin(place(0, 70, -124, 0, 0, 0, 30, 30, 1), 1);
  const winGeo = mergeGeometries(wins, false)!;
  const winMesh = new THREE.Mesh(winGeo, windowMaterial());
  winMesh.frustumCulled = false;
  group.add(winMesh);

  // Light through the high windows on the left, falling toward the tower.
  const shafts: THREE.BufferGeometry[] = [];
  const shaftSpec: [number, number, number][] = [
    [-41, 63, 4],
    [-41, 63, -11],
    [-41, 63, -26],
    [41, 62, -18],
  ];
  for (const [x, y, z] of shaftSpec) {
    const from = new THREE.Vector3(x, y, z);
    const to = new THREE.Vector3(x < 0 ? 4 : -6, 8, z + 6);
    for (const roll of [0, Math.PI / 2]) {
      const g = new THREE.PlaneGeometry(1, 1);
      g.translate(0, 0.5, 0);
      const m = between(from, to, [7.5, 1], roll);
      // between() centres the unit along Y; the plane was shifted up by half: undo.
      m.multiply(new THREE.Matrix4().makeTranslation(0, -0.5, 0));
      g.applyMatrix4(m);
      shafts.push(g);
    }
  }
  const shaftMesh = new THREE.Mesh(mergeGeometries(shafts, false)!, shaftMaterial());
  shaftMesh.frustumCulled = false;
  shaftMesh.renderOrder = 2;
  if (!phone) group.add(shaftMesh);

  // Dust.
  const n = phone ? 900 : 2600;
  const dp = new Float32Array(n * 3);
  const ds = new Float32Array(n);
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < n; i++) {
    dp.set([(r() - 0.5) * 60, FLOOR_Y - 20 + r() * 70, (r() - 0.5) * 50 + 2], i * 3);
    ds[i] = r();
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  dg.setAttribute("aSeed", new THREE.BufferAttribute(ds, 1));
  const dust = new THREE.Points(dg, dustMaterial(phone ? 60 : 90));
  dust.frustumCulled = false;
  dust.renderOrder = 3;
  group.add(dust);

  // The pit's light, rising out of the floor: a red haze down the well, brightest at the bottom.
  const haze = new THREE.Mesh(
    new THREE.CylinderGeometry(PIT_R - 0.6, PIT_R - 0.6, FLOOR_Y - PIT_Y + 8, 64, 1, true),
    new THREE.ShaderMaterial({
      uniforms: { uK: { value: 1 } },
      vertexShader: /* glsl */ `
        varying float vY; varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vY = w.y;
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - w.xyz);
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uK;
        varying float vY; varying vec3 vN; varying vec3 vV;
        void main() {
          float h = clamp((vY - ${PIT_Y.toFixed(1)}) / ${(FLOOR_Y - PIT_Y + 8).toFixed(1)}, 0.0, 1.0);
          float a = pow(1.0 - h, 2.2) * 0.22 + smoothstep(0.62, 0.8, h) * (1.0 - smoothstep(0.8, 1.0, h)) * 0.05;
          float edge = 0.35 + 0.65 * pow(1.0 - abs(dot(vN, vV)), 1.5);
          gl_FragColor = vec4(vec3(1.0, 0.12, 0.04) * a * edge * uK, 1.0);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  );
  haze.position.set(0, (FLOOR_Y + 8 + PIT_Y) / 2, 0);
  haze.renderOrder = 2;
  haze.frustumCulled = false;
  group.add(haze);

  // The pit's glow, under everything that fell.
  const pitGlow = new THREE.Mesh(new THREE.PlaneGeometry(52, 52), haloMaterial(new THREE.Color(0.55, 0.06, 0.02), 1));
  pitGlow.rotation.x = -Math.PI / 2;
  pitGlow.position.set(0, PIT_Y + 0.3, 0);
  pitGlow.renderOrder = 1;
  group.add(pitGlow);

  return { group, stoneMesh, winMesh, shaftMesh, dust, pitGlow, haze };
}
