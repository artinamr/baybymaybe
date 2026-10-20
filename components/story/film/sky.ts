import * as THREE from "three";
import { clamp01, lerp, smooth } from "./ease";
import { ATMOS, ATMOS_GLSL, bindAtmos } from "./atmos";

/**
 * THE TIME OF DAY. The film's clock is the town's clock: one table of hours
 * gives the sky (top, horizon, the glow round the sun, the Belt of Venus
 * opposite a low sun, the town's glow at night, the clouds' light and
 * shade), the key light (the sun by day, the moon by night: the swap
 * happens in the blue hour, when neither throws a shadow worth seeing), the
 * fog, and how many windows and streetlights are on. North is -Z, east +X:
 * the sun rises at +X, crosses the north at noon (this is New Zealand) and
 * sets at -X.
 *
 * The sky is also the world's light: it is captured (no sun disc, which the
 * key light carries) into a small cube a few times a second while it
 * changes, and that cube, convolved, lights and is reflected by every
 * material (`scene.environment`). So a white wall is blue on its shadow
 * side under a blue sky and warm toward the sunset, as it would be.
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
  /** The Belt of Venus and the earth's shadow under it, and how much they show. */
  belt: number;
  shad: number;
  beltK: number;
  /** The town's light low over the horizon (night). */
  town: number;
  /** The clouds' lit and shaded colours, and how much of the sky they cover. */
  cLit: number;
  cShade: number;
  cK: number;
  /** The sky's light on the world (environment intensity) and the haze's density at the ground. */
  envI: number;
  fogD: number;
};

const ROWS: Row[] = [
  { h: 0, el: -40, az: 0, top: 0x03060f, hor: 0x0e1528, glow: 0x0e1528, key: 0x9fb4ff, keyI: 0.9, ambTop: 0x1e2c4a, ambBot: 0x0a0b10, ambI: 0.3, fog: 0x0e1528, lights: 0.55, stars: 1, belt: 0, shad: 0, beltK: 0, town: 0x2a1a10, cLit: 0x2a3248, cShade: 0x0b0e18, cK: 0.35, envI: 1.7, fogD: 0.0012 },
  { h: 4.5, el: -20, az: 70, top: 0x03060f, hor: 0x0f1629, glow: 0x121c36, key: 0x9fb4ff, keyI: 0.85, ambTop: 0x1e2c4a, ambBot: 0x0a0b10, ambI: 0.3, fog: 0x0f1629, lights: 0.4, stars: 1, belt: 0, shad: 0, beltK: 0, town: 0x24170e, cLit: 0x283048, cShade: 0x0b0e18, cK: 0.35, envI: 1.7, fogD: 0.0014 },
  { h: 6.0, el: -6, az: 80, top: 0x10204a, hor: 0x5a4a68, glow: 0xd88a6a, key: 0x9fb4ff, keyI: 0.06, ambTop: 0x3a4a72, ambBot: 0x16151a, ambI: 0.55, fog: 0x30324a, lights: 0.55, stars: 0.35, belt: 0xb08aa0, shad: 0x3a4468, beltK: 0.6, town: 0x1a120c, cLit: 0xe0a090, cShade: 0x403a58, cK: 0.4, envI: 1.4, fogD: 0.0022 },
  { h: 7.0, el: 4, az: 82, top: 0x3e66a6, hor: 0xf0c4a2, glow: 0xffb27a, key: 0xffc59a, keyI: 1.6, ambTop: 0x8aa3c9, ambBot: 0x3b322c, ambI: 0.7, fog: 0xb9a9a6, lights: 0.2, stars: 0, belt: 0xf0b8c0, shad: 0x8a98c0, beltK: 0.45, town: 0, cLit: 0xfff0e0, cShade: 0x9a9cb8, cK: 0.45, envI: 1, fogD: 0.002 },
  { h: 9.0, el: 24, az: 70, top: 0x4c84cc, hor: 0xd8e2ec, glow: 0xffe8cc, key: 0xffe6c8, keyI: 3.3, ambTop: 0xa9c2e6, ambBot: 0x5a5148, ambI: 0.7, fog: 0xc9d3dd, lights: 0, stars: 0, belt: 0, shad: 0, beltK: 0, town: 0, cLit: 0xffffff, cShade: 0xb8c4d8, cK: 0.42, envI: 0.85, fogD: 0.0011 },
  { h: 13, el: 58, az: 0, top: 0x4a82cc, hor: 0xdde6ee, glow: 0xffffff, key: 0xffeedb, keyI: 3.7, ambTop: 0xb5cbea, ambBot: 0x605850, ambI: 0.76, fog: 0xd3dbe2, lights: 0, stars: 0, belt: 0, shad: 0, beltK: 0, town: 0, cLit: 0xffffff, cShade: 0xc0cadc, cK: 0.4, envI: 0.8, fogD: 0.001 },
  { h: 16.5, el: 32, az: -60, top: 0x4c80c4, hor: 0xe0e2e2, glow: 0xffecd0, key: 0xffe2bf, keyI: 3.4, ambTop: 0xadc3e4, ambBot: 0x5d544b, ambI: 0.73, fog: 0xcfd6de, lights: 0, stars: 0, belt: 0, shad: 0, beltK: 0, town: 0, cLit: 0xfffaf0, cShade: 0xbcc4d4, cK: 0.42, envI: 0.85, fogD: 0.001 },
  { h: 18.4, el: 9, az: -78, top: 0x3a64a6, hor: 0xf2cc9e, glow: 0xffb46e, key: 0xffc690, keyI: 2.4, ambTop: 0x93a7c8, ambBot: 0x4a3a30, ambI: 0.82, fog: 0xc8b6a4, lights: 0.15, stars: 0, belt: 0xe8b4b0, shad: 0x7a88b0, beltK: 0.2, town: 0, cLit: 0xffe0b8, cShade: 0x8a8aa8, cK: 0.45, envI: 0.9, fogD: 0.001 },
  { h: 19.3, el: 0.5, az: -84, top: 0x22407c, hor: 0xf2a070, glow: 0xff9654, key: 0xffa772, keyI: 0.9, ambTop: 0x5d6a92, ambBot: 0x2a2224, ambI: 0.66, fog: 0x8a7c84, lights: 0.55, stars: 0, belt: 0xe6a2b2, shad: 0x56679a, beltK: 0.95, town: 0, cLit: 0xffa878, cShade: 0x6a5274, cK: 0.5, envI: 1.05, fogD: 0.0014 },
  { h: 19.75, el: -4, az: -88, top: 0x142a5c, hor: 0x4c5f8c, glow: 0xd2785a, key: 0x9fb4ff, keyI: 0.05, ambTop: 0x3b4a74, ambBot: 0x18161a, ambI: 0.58, fog: 0x3a3a54, lights: 0.85, stars: 0.15, belt: 0x8e86aa, shad: 0x26386a, beltK: 0.6, town: 0x120a06, cLit: 0xd08070, cShade: 0x2e3450, cK: 0.5, envI: 1.35, fogD: 0.0014 },
  { h: 20.6, el: -12, az: -95, top: 0x060d22, hor: 0x1c2644, glow: 0x2c2a4c, key: 0x9fb4ff, keyI: 0.7, ambTop: 0x2a3a60, ambBot: 0x0e0e13, ambI: 0.36, fog: 0x141b30, lights: 1, stars: 0.7, belt: 0x000000, shad: 0x10162a, beltK: 0.1, town: 0x24160e, cLit: 0x222c48, cShade: 0x0e1220, cK: 0.4, envI: 1.6, fogD: 0.0013 },
  { h: 22.5, el: -28, az: -120, top: 0x03060f, hor: 0x0f162a, glow: 0x0f162a, key: 0x9fb4ff, keyI: 0.95, ambTop: 0x1f2d4a, ambBot: 0x0c0d12, ambI: 0.32, fog: 0x0f162a, lights: 0.85, stars: 1, belt: 0, shad: 0, beltK: 0, town: 0x2c1c12, cLit: 0x283048, cShade: 0x0b0e18, cK: 0.35, envI: 1.7, fogD: 0.0012 },
  { h: 24, el: -40, az: -180, top: 0x03060f, hor: 0x0e1528, glow: 0x0e1528, key: 0x9fb4ff, keyI: 0.9, ambTop: 0x1e2c4a, ambBot: 0x0a0b10, ambI: 0.3, fog: 0x0e1528, lights: 0.55, stars: 1, belt: 0, shad: 0, beltK: 0, town: 0x2a1a10, cLit: 0x2a3248, cShade: 0x0b0e18, cK: 0.35, envI: 1.7, fogD: 0.0012 },
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
${ATMOS_GLSL}
uniform vec3 uMoon;
uniform float uMoonOn;
uniform float uStars;
uniform float uTime;
uniform float uSunOn;
uniform vec3 uCLit;
uniform vec3 uCShade;
uniform float uCK;
uniform float uEnvPass;
varying vec3 vDir;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float hash2(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * vnoise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return s;
}
// A layer of broken cloud: the view ray onto a high plane, warped noise for
// the shapes, lit by the sun's side (a bright rim where they face it) and
// darker where they are thick; thinner toward the horizon.
vec4 clouds(vec3 d, float t) {
  if (d.y < 0.012) return vec4(0.0);
  vec2 p = d.xz / (d.y + 0.06) * 0.55 + vec2(t * 0.0022, t * 0.0009);
  vec2 w = vec2(fbm(p * 0.5 + 3.1), fbm(p * 0.5 + 7.7));
  float n = fbm(p * 1.15 + w * 1.6);
  float cov = smoothstep(0.62 - uCK * 0.22, 0.86 - uCK * 0.12, n);
  float thick = smoothstep(0.6, 0.98, n);
  cov *= smoothstep(0.012, 0.14, d.y);
  float cs = max(dot(d, aSun), 0.0);
  vec3 col = mix(uCLit, uCShade, thick * 0.75);
  col += aGlow * pow(cs, 5.0) * 0.5 * (1.0 - thick) * aSunVis;
  // Underlit by the town's glow at night.
  col += aTown * 1.6 * (1.0 - thick);
  return vec4(col, cov);
}
void main() {
  vec3 d = normalize(vDir);
  vec3 col = atmosSky(vec3(d.x, max(d.y, 0.0), d.z));
  // Below the horizon the haze carries on (the land and the sea meet it).
  col = mix(col, atmosHaze(d) * 0.94, smoothstep(0.0, -0.08, d.y));
  vec4 cl = clouds(d, uTime);
  // The stars and the moon sit behind the clouds.
  vec3 back = vec3(0.0);
  if (uEnvPass < 0.5) {
    float cm = max(dot(d, normalize(uMoon)), 0.0);
    back += vec3(0.78, 0.84, 1.0) * (smoothstep(0.99955, 0.99975, cm) * 2.6 + pow(cm, 280.0) * 0.18 + pow(cm, 24.0) * 0.03) * uMoonOn;
    vec3 sd = d * 420.0;
    vec3 cell = floor(sd);
    float h = hash(cell);
    if (h > 0.9965 && uStars > 0.0) {
      vec3 f = fract(sd) - 0.5;
      float dot2 = dot(f, f);
      float tw = 0.65 + 0.35 * sin(uTime * (1.0 + h * 3.0) + h * 40.0);
      back += vec3(0.85, 0.9, 1.0) * smoothstep(0.08, 0.0, dot2) * (h - 0.9965) * 420.0 * tw * uStars * smoothstep(0.02, 0.25, d.y);
    }
    // The sun's disc (the key light carries its light; the environment leaves it out).
    float cs = max(dot(d, aSun), 0.0);
    back += aGlow * smoothstep(0.9993, 0.9997, cs) * 14.0 * uSunOn;
  }
  col += back * (1.0 - cl.a);
  col = mix(col, cl.rgb, cl.a);
  if (uEnvPass > 0.5) col = mix(vec3(dot(col, vec3(0.2126, 0.7152, 0.0722))), col, 0.6);
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
  /** The sky's light on the world. */
  envI: number;
};

export class Sky {
  readonly dome: THREE.Mesh;
  readonly key: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  readonly fog: THREE.FogExp2;
  private u: Record<string, THREE.IUniform>;
  readonly out: SkyOut = { hours: 19, lights: 1, night: 1, sunDir: new THREE.Vector3(), keyDir: new THREE.Vector3(), envI: 1.6 };
  /** The shadow's focus, smoothed (the camera's subject and how wide around it). */
  private focus = new THREE.Vector3();
  private focusR = 20;
  private first = true;
  // The environment: the sky captured into a cube, convolved (PMREM).
  private envScene = new THREE.Scene();
  private cube = new THREE.WebGLCubeRenderTarget(128, { type: THREE.HalfFloatType, generateMipmaps: false });
  private cubeCam: THREE.CubeCamera;
  private pmrem: THREE.PMREMGenerator | null = null;
  private envRT: THREE.WebGLRenderTarget | null = null;
  private envGround: THREE.MeshBasicMaterial;
  private envKey = "";
  private envAt = -1e9;

  constructor(scene: THREE.Scene, shadowSize: number) {
    this.u = bindAtmos({
      uMoon: { value: MOON.clone() },
      uMoonOn: { value: 1 },
      uStars: { value: 1 },
      uTime: { value: 0 },
      uSunOn: { value: 0 },
      uCLit: { value: new THREE.Color() },
      uCShade: { value: new THREE.Color() },
      uCK: { value: 0.4 },
      uEnvPass: { value: 0 },
    });
    const geo = new THREE.SphereGeometry(1, 64, 32);
    const mat = new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: this.u, side: THREE.BackSide, depthWrite: false, fog: false });
    this.dome = new THREE.Mesh(geo, mat);
    this.dome.scale.setScalar(1500);
    this.dome.frustumCulled = false;
    this.dome.renderOrder = -10;
    scene.add(this.dome);

    // The environment's own little world: the same sky, and the land under it as one colour.
    const envDome = new THREE.Mesh(geo, mat);
    envDome.scale.setScalar(1500);
    envDome.frustumCulled = false;
    this.envScene.add(envDome);
    this.envGround = new THREE.MeshBasicMaterial({ color: 0x223322, side: THREE.DoubleSide, fog: false });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(1400, 48), this.envGround);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -6;
    this.envScene.add(ground);
    this.cubeCam = new THREE.CubeCamera(1, 4000, this.cube);
    this.cubeCam.position.set(0, 24, 0);

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

    // A little fill from the ground's bounce (the sky's own light comes from the environment).
    this.hemi = new THREE.HemisphereLight(0x223355, 0x0c0d12, 0.5);
    scene.add(this.hemi);
    this.fog = new THREE.FogExp2(0x0b1120, 0.0016);
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
    mixHex(a.top, b.top, k, ATMOS.aTop.value);
    mixHex(a.hor, b.hor, k, ATMOS.aHor.value);
    mixHex(a.glow, b.glow, k, ATMOS.aGlow.value);
    mixHex(a.belt, b.belt, k, ATMOS.aBelt.value);
    mixHex(a.shad, b.shad, k, ATMOS.aShadowC.value);
    mixHex(a.town, b.town, k, ATMOS.aTown.value);
    ATMOS.aBeltK.value = lerp(a.beltK, b.beltK, k);
    mixHex(a.cLit, b.cLit, k, u.uCLit.value as THREE.Color);
    mixHex(a.cShade, b.cShade, k, u.uCShade.value as THREE.Color);
    u.uCK.value = lerp(a.cK, b.cK, k);
    // The sun's direction (azimuth and elevation, through the shortest turn).
    let daz = b.az - a.az;
    if (daz > 180) daz -= 360;
    if (daz < -180) daz += 360;
    const az = THREE.MathUtils.degToRad(a.az + daz * k);
    const el = THREE.MathUtils.degToRad(lerp(a.el, b.el, k));
    const sun = this.out.sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
    ATMOS.aSun.value.copy(sun);
    ATMOS.aSunVis.value = smooth(clamp01((Math.sin(el) + 0.1) / 0.14));
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
    // The sky's light now comes from the environment; the hemisphere is a quarter of what it was (the ground's bounce).
    this.hemi.intensity = lerp(a.ambI, b.ambI, k) * 0.28;
    mixHex(a.fog, b.fog, k, this.fog.color);
    this.out.hours = hours;
    this.out.lights = lerp(a.lights, b.lights, k);
    this.out.night = nightK;
    this.out.envI = lerp(a.envI, b.envI, k);
    // The land under the environment's sky: lit by the key and the sky, a dark mix of lawn, road and roof.
    {
      const kc = this.key.color;
      const lit = Math.max(0, keyDir.y) * this.key.intensity * (useSun ? 1 : 0.25);
      const hor = ATMOS.aHor.value;
      this.envGround.color.setRGB(0.09 * kc.r * lit + hor.r * 0.12, 0.1 * kc.g * lit + hor.g * 0.13, 0.08 * kc.b * lit + hor.b * 0.12);
    }

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
    // The haze: denser low down, a touch thinner when we look across the town from high.
    this.fog.density = lerp(a.fogD, b.fogD, k) * fogScale;
    return this.out;
  }

  /**
   * The environment (the sky as light), captured again when the sky has
   * changed enough to see: every few frames while the hours run fast (a
   * time-lapse, the rewind), seldom when they crawl.
   */
  env(r: THREE.WebGLRenderer, time: number): THREE.Texture | null {
    const hor = ATMOS.aHor.value;
    const s = ATMOS.aSun.value;
    const key = [hor.r, hor.g, hor.b, s.x, s.y, s.z, ATMOS.aTop.value.b].map((v) => Math.round(v * 60)).join(",");
    // (Real time, not the film's: a frozen look-dev frame still gets its own sky.)
    const now = performance.now() / 1000;
    void time;
    if (this.envRT && (key === this.envKey || now - this.envAt < 0.05)) return this.envRT.texture;
    this.envKey = key;
    this.envAt = now;
    this.u.uEnvPass.value = 1;
    this.cubeCam.update(r, this.envScene);
    this.u.uEnvPass.value = 0;
    this.pmrem ??= new THREE.PMREMGenerator(r);
    this.envRT = this.pmrem.fromCubemap(this.cube.texture, this.envRT);
    return this.envRT.texture;
  }

  /** The moon's direction. */
  get keyDir() {
    return MOON;
  }

  /** The sky's colour toward the horizon (for things that fade into it). */
  horizon(out: THREE.Color) {
    return out.copy(ATMOS.aHor.value);
  }
}

export const SKY_ROWS = ROWS;
export { C as hexColor };
