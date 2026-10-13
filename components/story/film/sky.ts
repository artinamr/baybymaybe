import * as THREE from "three";
import { clamp01, lerp, smooth } from "./ease";

/**
 * THE TIME OF DAY. The film's clock is the town's clock: one table of hours
 * gives the sky (top, horizon, the glow round the sun), the key light (the
 * sun by day, the moon by night: the swap happens in the blue hour, when
 * neither throws a shadow worth seeing), the sky's fill, the fog, and how
 * many windows and streetlights are on. North is -Z, east +X: the sun rises
 * at +X, crosses the north at noon (this is New Zealand) and sets at -X.
 */

type Row = {
  h: number;
  /** Sun elevation and azimuth (degrees; azimuth 0 north, 90 east). */
  el: number;
  az: number;
  top: number;
  hor: number;
  glow: number;
  key: number;
  keyI: number;
  ambTop: number;
  ambBot: number;
  ambI: number;
  fog: number;
  /** 0..1: windows lit, streetlights on. */
  lights: number;
  stars: number;
};

const ROWS: Row[] = [
  { h: 0, el: -40, az: 0, top: 0x03050b, hor: 0x0b1222, glow: 0x0b1222, key: 0x8fa7ff, keyI: 0.95, ambTop: 0x22314f, ambBot: 0x0c0d12, ambI: 0.32, fog: 0x0b1120, lights: 0.55, stars: 1 },
  { h: 4.5, el: -20, az: 70, top: 0x03050b, hor: 0x0c1324, glow: 0x101a33, key: 0x8fa7ff, keyI: 0.9, ambTop: 0x22314f, ambBot: 0x0c0d12, ambI: 0.31, fog: 0x0c1222, lights: 0.4, stars: 1 },
  { h: 6.0, el: -6, az: 80, top: 0x0b1530, hor: 0x3a3c58, glow: 0xa8665a, key: 0x8fa7ff, keyI: 0.05, ambTop: 0x3a4a72, ambBot: 0x16151a, ambI: 0.55, fog: 0x272c45, lights: 0.55, stars: 0.4 },
  { h: 7.0, el: 4, az: 82, top: 0x3a5f97, hor: 0xe7b394, glow: 0xffb27a, key: 0xffc59a, keyI: 1.6, ambTop: 0x8aa3c9, ambBot: 0x3b322c, ambI: 0.7, fog: 0xb9a9a6, lights: 0.2, stars: 0 },
  { h: 9.0, el: 24, az: 70, top: 0x5e8ccc, hor: 0xd7dde4, glow: 0xffe1bd, key: 0xfff0dc, keyI: 3.0, ambTop: 0xa9c2e6, ambBot: 0x5a5148, ambI: 0.95, fog: 0xc9d3dd, lights: 0, stars: 0 },
  { h: 13, el: 58, az: 0, top: 0x5f8fd0, hor: 0xdde4ea, glow: 0xffffff, key: 0xfff6ea, keyI: 3.4, ambTop: 0xb5cbea, ambBot: 0x605850, ambI: 1.05, fog: 0xd3dbe2, lights: 0, stars: 0 },
  { h: 16.5, el: 32, az: -60, top: 0x5a88c8, hor: 0xdcdcdc, glow: 0xffe8c8, key: 0xfff0dc, keyI: 3.1, ambTop: 0xadc3e4, ambBot: 0x5d544b, ambI: 1.0, fog: 0xcfd6de, lights: 0, stars: 0 },
  { h: 18.4, el: 9, az: -78, top: 0x4b6fa8, hor: 0xf0c08e, glow: 0xffb46e, key: 0xffc58c, keyI: 2.3, ambTop: 0x93a7c8, ambBot: 0x4a3a30, ambI: 0.82, fog: 0xc8b6a4, lights: 0.15, stars: 0 },
  { h: 19.3, el: 0.5, az: -84, top: 0x2b3f6e, hor: 0xd88f68, glow: 0xff9a58, key: 0xffa772, keyI: 0.9, ambTop: 0x5d6a92, ambBot: 0x2a2224, ambI: 0.66, fog: 0x8a7c84, lights: 0.55, stars: 0 },
  { h: 19.75, el: -4, az: -88, top: 0x16244a, hor: 0x6a5568, glow: 0xc4705a, key: 0x8fa7ff, keyI: 0.04, ambTop: 0x3b4a74, ambBot: 0x18161a, ambI: 0.58, fog: 0x3a3a54, lights: 0.85, stars: 0.15 },
  { h: 20.6, el: -12, az: -95, top: 0x070d1f, hor: 0x1e2742, glow: 0x3a3456, key: 0x8fa7ff, keyI: 0.7, ambTop: 0x2a3a60, ambBot: 0x0e0e13, ambI: 0.36, fog: 0x141b30, lights: 1, stars: 0.7 },
  { h: 22.5, el: -28, az: -120, top: 0x04060d, hor: 0x0e1527, glow: 0x0e1527, key: 0x8fa7ff, keyI: 0.95, ambTop: 0x23324f, ambBot: 0x0c0d12, ambI: 0.32, fog: 0x0c1222, lights: 0.85, stars: 1 },
  { h: 24, el: -40, az: -180, top: 0x03050b, hor: 0x0b1222, glow: 0x0b1222, key: 0x8fa7ff, keyI: 0.95, ambTop: 0x22314f, ambBot: 0x0c0d12, ambI: 0.32, fog: 0x0b1120, lights: 0.55, stars: 1 },
];

const C = (hex: number) => new THREE.Color(hex);
const cA = new THREE.Color();
const cB = new THREE.Color();
function mixHex(a: number, b: number, k: number, out: THREE.Color) {
  return out.copy(cA.set(a)).lerp(cB.set(b), k);
}

/** The moon's place (fixed: high in the north-west, where it reads behind the town). */
const MOON = new THREE.Vector3(-0.45, 0.72, -0.53).normalize();

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;

const SKY_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uTop;
uniform vec3 uHor;
uniform vec3 uGlow;
uniform vec3 uSun;
uniform vec3 uMoon;
uniform float uMoonOn;
uniform float uStars;
uniform float uTime;
uniform float uSunOn;
varying vec3 vDir;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
void main() {
  vec3 d = normalize(vDir);
  float up = clamp(d.y, -0.2, 1.0);
  // The gradient: horizon to top, quick near the horizon, slow above.
  float k = pow(clamp(up, 0.0, 1.0), 0.42);
  vec3 col = mix(uHor, uTop, k);
  // Below the horizon: the haze carries on (the hills' fog meets it).
  col = mix(col, uHor * 0.92, smoothstep(0.0, -0.12, d.y));
  // The glow round the sun, wide along the horizon.
  vec3 s = normalize(uSun);
  float cs = max(dot(d, s), 0.0);
  float band = exp(-abs(d.y - max(s.y, -0.05)) * 6.0);
  float g = pow(cs, 6.0) * 0.55 + pow(cs, 48.0) * 0.6;
  col += uGlow * (g + band * pow(cs, 2.0) * 0.35);
  // The sun's disc (when it is up).
  col += uGlow * smoothstep(0.9993, 0.9997, cs) * 14.0 * uSunOn;
  // The moon: a soft disc with its own halo.
  float cm = max(dot(d, normalize(uMoon)), 0.0);
  col += vec3(0.78, 0.84, 1.0) * (smoothstep(0.99955, 0.99975, cm) * 2.6 + pow(cm, 280.0) * 0.18 + pow(cm, 24.0) * 0.03) * uMoonOn;
  // Stars: sparse, still, a slow twinkle; fewer near the horizon.
  vec3 sd = d * 420.0;
  vec3 cell = floor(sd);
  float h = hash(cell);
  if (h > 0.9965 && uStars > 0.0) {
    vec3 f = fract(sd) - 0.5;
    float dot2 = dot(f, f);
    float tw = 0.65 + 0.35 * sin(uTime * (1.0 + h * 3.0) + h * 40.0);
    col += vec3(0.85, 0.9, 1.0) * smoothstep(0.08, 0.0, dot2) * (h - 0.9965) * 420.0 * tw * uStars * smoothstep(0.02, 0.25, d.y);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export type SkyOut = {
  hours: number;
  /** 0..1 how many windows are on, and the streetlights. */
  lights: number;
  /** 0 day … 1 night. */
  night: number;
  sunDir: THREE.Vector3;
  keyDir: THREE.Vector3;
};

export class Sky {
  readonly dome: THREE.Mesh;
  readonly key: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly fog: THREE.FogExp2;
  private u: Record<string, THREE.IUniform>;
  readonly out: SkyOut = { hours: 19, lights: 1, night: 1, sunDir: new THREE.Vector3(), keyDir: new THREE.Vector3() };
  /** The shadow's focus, smoothed (the camera's subject and how wide around it). */
  private focus = new THREE.Vector3();
  private focusR = 20;
  private first = true;

  constructor(scene: THREE.Scene, shadowSize: number) {
    this.u = {
      uTop: { value: new THREE.Color() },
      uHor: { value: new THREE.Color() },
      uGlow: { value: new THREE.Color() },
      uSun: { value: new THREE.Vector3(0, 1, 0) },
      uMoon: { value: MOON.clone() },
      uMoonOn: { value: 1 },
      uStars: { value: 1 },
      uTime: { value: 0 },
      uSunOn: { value: 0 },
    };
    const geo = new THREE.SphereGeometry(1, 48, 24);
    const mat = new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: this.u, side: THREE.BackSide, depthWrite: false, fog: false });
    this.dome = new THREE.Mesh(geo, mat);
    this.dome.scale.setScalar(1500);
    this.dome.frustumCulled = false;
    this.dome.renderOrder = -10;
    scene.add(this.dome);

    this.key = new THREE.DirectionalLight(0xffffff, 1);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(shadowSize, shadowSize);
    this.key.shadow.bias = -0.0004;
    this.key.shadow.normalBias = 0.03;
    this.key.shadow.radius = 2.2;
    const sc = this.key.shadow.camera as THREE.OrthographicCamera;
    sc.near = 1;
    sc.far = 600;
    scene.add(this.key);
    scene.add(this.key.target);

    this.hemi = new THREE.HemisphereLight(0x223355, 0x0c0d12, 0.5);
    scene.add(this.hemi);
    this.fog = new THREE.FogExp2(0x0b1120, 0.006);
    scene.fog = this.fog;
  }

  /** The table at an hour of the day (any number of days on). */
  private row(hours: number) {
    const h = ((hours % 24) + 24) % 24;
    let i = 0;
    while (i < ROWS.length - 2 && h >= ROWS[i + 1].h) i++;
    const a = ROWS[i];
    const b = ROWS[i + 1];
    const k = smooth(clamp01((h - a.h) / (b.h - a.h)));
    return { a, b, k };
  }

  /**
   * Set the sky for an hour. `focus` and `radius`: what the camera is looking
   * at and how much of it is in frame (the shadow map is spent only there).
   */
  update(hours: number, time: number, focus: THREE.Vector3, radius: number, fogScale = 1) {
    const { a, b, k } = this.row(hours);
    const u = this.u;
    mixHex(a.top, b.top, k, u.uTop.value as THREE.Color);
    mixHex(a.hor, b.hor, k, u.uHor.value as THREE.Color);
    mixHex(a.glow, b.glow, k, u.uGlow.value as THREE.Color);
    // The sun's direction (azimuth and elevation, through the shortest turn).
    let daz = b.az - a.az;
    if (daz > 180) daz -= 360;
    if (daz < -180) daz += 360;
    const az = THREE.MathUtils.degToRad(a.az + daz * k);
    const el = THREE.MathUtils.degToRad(lerp(a.el, b.el, k));
    const sun = this.out.sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    (u.uSun.value as THREE.Vector3).copy(sun);
    u.uSunOn.value = smooth(clamp01((Math.sin(el) + 0.02) / 0.04));
    const nightK = clamp01((-Math.sin(el) - 0.03) / 0.12);
    u.uMoonOn.value = nightK;
    u.uStars.value = lerp(a.stars, b.stars, k);
    u.uTime.value = time;
    // The key: the sun while it is up, the moon after the blue hour.
    const useSun = el > THREE.MathUtils.degToRad(-3);
    const keyDir = this.out.keyDir.copy(useSun ? sun : MOON);
    if (useSun && keyDir.y < 0.06) keyDir.y = 0.06;
    keyDir.normalize();
    mixHex(a.key, b.key, k, this.key.color);
    this.key.intensity = lerp(a.keyI, b.keyI, k);
    mixHex(a.ambTop, b.ambTop, k, this.hemi.color);
    mixHex(a.ambBot, b.ambBot, k, this.hemi.groundColor);
    this.hemi.intensity = lerp(a.ambI, b.ambI, k);
    mixHex(a.fog, b.fog, k, this.fog.color);
    this.out.hours = hours;
    this.out.lights = lerp(a.lights, b.lights, k);
    this.out.night = nightK;

    // Shadows only where we look: the map follows the subject, its size the
    // frame's, both smoothed, and the centre snapped to the map's texels so
    // still shadows never crawl.
    if (this.first) {
      this.focus.copy(focus);
      this.focusR = radius;
      this.first = false;
    } else {
      this.focus.lerp(focus, 0.2);
      this.focusR += (radius - this.focusR) * 0.2;
    }
    const R = Math.max(2.5, this.focusR);
    const sc = this.key.shadow.camera as THREE.OrthographicCamera;
    sc.left = -R;
    sc.right = R;
    sc.top = R;
    sc.bottom = -R;
    sc.updateProjectionMatrix();
    const texel = (2 * R) / this.key.shadow.mapSize.x;
    // Snap in the light's own frame.
    const lz = keyDir.clone().negate();
    const lx = new THREE.Vector3(0, 1, 0).cross(lz).normalize();
    const ly = lz.clone().cross(lx);
    const fx = Math.round(this.focus.dot(lx) / texel) * texel;
    const fy = Math.round(this.focus.dot(ly) / texel) * texel;
    const fz = this.focus.dot(lz);
    const c = lx.multiplyScalar(fx).add(ly.multiplyScalar(fy)).add(lz.multiplyScalar(fz));
    this.key.target.position.copy(c);
    this.key.position.copy(c).addScaledVector(keyDir, 250);
    this.key.target.updateMatrixWorld();
    this.key.shadow.bias = -0.00025 - 0.000004 * R;
    this.key.shadow.normalBias = 0.012 + R * 0.0012;
    // Fog: thinner when we look across the town, thicker in close.
    this.fog.density = 0.0042 * fogScale;
    return this.out;
  }

  /** The sky's colour toward the horizon (for things that fade into it). */
  horizon(out: THREE.Color) {
    return out.copy(this.u.uHor.value as THREE.Color);
  }
}

export const SKY_ROWS = ROWS;
export { C as hexColor };
