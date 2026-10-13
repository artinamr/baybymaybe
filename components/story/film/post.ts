import * as THREE from "three";
import type { GpuTimer } from "@/components/stage/gpuTimer";

/**
 * THE FILM'S LOOK: the scene is drawn in linear HDR into a multisampled
 * half-float target; bloom spreads only what is brighter than the paper
 * (a mip chain: 13-tap downsamples, tent upsamples added back up, the
 * Call of Duty / Jimenez method); one last pass does everything else:
 * exposure, the filmic curve, the chapter's grade, a slow vignette, a hair of
 * chromatic aberration at the edges, grain, the flash, black and paper.
 *
 * Cost at 1600x900: the scene, 6 small downsamples, 5 upsamples, 1 composite.
 */

export type Grade = {
  exposure: number;
  bloom: number;
  /** Lift / gamma / gain (ASC-CDL style), per channel. */
  lift: THREE.Vector3;
  gamma: THREE.Vector3;
  gain: THREE.Vector3;
  sat: number;
  /** 0..1 a gentle S-curve on the display values (mid-tones apart, ends kept). */
  contrast: number;
  /** Split toning: the shadows' and the highlights' tint, and how far. */
  shadow: THREE.Vector3;
  high: THREE.Vector3;
  split: number;
  vignette: number;
  grain: number;
  aberration: number;
  /** 0..1 a flash of light (its colour), black, and the paper the film ends on. */
  flash: number;
  flashColor: THREE.Vector3;
  black: number;
  /** 0..1 the end: light filling the frame from its bright parts outward. */
  fill: number;
  paper: number;
  /** The bloom's threshold in linear light. */
  threshold: number;
};

export function makeGrade(): Grade {
  return {
    exposure: 1,
    bloom: 0.9,
    lift: new THREE.Vector3(0, 0, 0),
    gamma: new THREE.Vector3(1, 1, 1),
    gain: new THREE.Vector3(1, 1, 1),
    sat: 1,
    contrast: 0,
    shadow: new THREE.Vector3(0, 0, 0),
    high: new THREE.Vector3(0, 0, 0),
    split: 0,
    vignette: 0.35,
    grain: 0.05,
    aberration: 0.6,
    flash: 0,
    flashColor: new THREE.Vector3(1, 1, 1),
    black: 0,
    fill: 0,
    paper: 0,
    threshold: 0.9,
  };
}

const VERT = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

// 13 taps (Jimenez 2014, "Next generation post processing in Call of Duty"),
// the first pass with a soft threshold and the Karis average (no fireflies).
const DOWN = /* glsl */ `
precision highp float;
uniform sampler2D tSrc;
uniform vec2 uTexel;
uniform float uPrefilter;
uniform float uThreshold;
in vec2 vUv;
// Any NaN or infinity a shader lets slip (a stray pixel) becomes black, and
// nothing is brighter than 64: one bad pixel can never bloom across the frame.
// (Bit test, not isnan(): D3D's compiler may optimise isnan away.)
vec3 fin(vec3 c) {
  bvec3 bad = equal(floatBitsToUint(c) & uvec3(0x7f800000u), uvec3(0x7f800000u));
  return clamp(mix(c, vec3(0.0), bad), 0.0, 64.0);
}
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 tap(vec2 uv) { return fin(texture(tSrc, uv).rgb); }
vec3 pre(vec3 c) {
  // soft knee: everything above the threshold, eased in over a knee
  float l = luma(c);
  float knee = uThreshold * 0.6;
  float soft = clamp(l - uThreshold + knee, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 1e-4);
  float w = max(soft, l - uThreshold) / max(l, 1e-4);
  return c * w;
}
vec3 karis(vec3 a, vec3 b, vec3 c, vec3 d) {
  float wa = 1.0 / (1.0 + luma(a));
  float wb = 1.0 / (1.0 + luma(b));
  float wc = 1.0 / (1.0 + luma(c));
  float wd = 1.0 / (1.0 + luma(d));
  return (a * wa + b * wb + c * wc + d * wd) / (wa + wb + wc + wd);
}
void main() {
  vec2 t = uTexel;
  vec3 a = tap(vUv + t * vec2(-2.0, 2.0));
  vec3 b = tap(vUv + t * vec2(0.0, 2.0));
  vec3 c = tap(vUv + t * vec2(2.0, 2.0));
  vec3 d = tap(vUv + t * vec2(-2.0, 0.0));
  vec3 e = tap(vUv);
  vec3 f = tap(vUv + t * vec2(2.0, 0.0));
  vec3 g = tap(vUv + t * vec2(-2.0, -2.0));
  vec3 h = tap(vUv + t * vec2(0.0, -2.0));
  vec3 i = tap(vUv + t * vec2(2.0, -2.0));
  vec3 j = tap(vUv + t * vec2(-1.0, 1.0));
  vec3 k = tap(vUv + t * vec2(1.0, 1.0));
  vec3 l = tap(vUv + t * vec2(-1.0, -1.0));
  vec3 m = tap(vUv + t * vec2(1.0, -1.0));
  vec3 o;
  if (uPrefilter > 0.5) {
    o = karis(j, k, l, m) * 0.5 + karis(a, b, d, e) * 0.125 + karis(b, c, e, f) * 0.125 + karis(d, e, g, h) * 0.125 + karis(e, f, h, i) * 0.125;
    o = pre(min(o, vec3(64.0)));
  } else {
    o = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  }
  gl_FragColor = vec4(o, 1.0);
}`;

const UP = /* glsl */ `
precision highp float;
uniform sampler2D tSrc;
uniform vec2 uTexel;
uniform float uWeight;
in vec2 vUv;
void main() {
  vec2 t = uTexel;
  vec3 s = texture(tSrc, vUv).rgb * 4.0;
  s += (texture(tSrc, vUv + vec2(-t.x, 0.0)).rgb + texture(tSrc, vUv + vec2(t.x, 0.0)).rgb + texture(tSrc, vUv + vec2(0.0, -t.y)).rgb + texture(tSrc, vUv + vec2(0.0, t.y)).rgb) * 2.0;
  s += texture(tSrc, vUv + vec2(-t.x, -t.y)).rgb + texture(tSrc, vUv + vec2(t.x, -t.y)).rgb + texture(tSrc, vUv + vec2(-t.x, t.y)).rgb + texture(tSrc, vUv + vec2(t.x, t.y)).rgb;
  gl_FragColor = vec4(s * (uWeight / 16.0), 1.0);
}`;

const COMPOSITE = /* glsl */ `
precision highp float;
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform vec2 uRes;
uniform float uTime;
uniform float uExposure;
uniform float uBloom;
uniform vec3 uLift;
uniform vec3 uGamma;
uniform vec3 uGain;
uniform float uSat;
uniform float uContrast;
uniform vec3 uShadow;
uniform vec3 uHigh;
uniform float uSplit;
uniform float uVignette;
uniform float uGrain;
uniform float uAberration;
uniform float uFlash;
uniform vec3 uFlashColor;
uniform float uBlack;
uniform float uFill;
uniform float uPaper;
uniform float uFXAA;
in vec2 vUv;

// Khronos PBR Neutral: linear through the mid-tones (screens and paper keep
// their true colour and white), a soft shoulder above.
vec3 neutral(vec3 color) {
  const float startCompression = 0.8 - 0.04;
  const float desaturation = 0.15;
  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) return color;
  const float d = 1.0 - startCompression;
  float newPeak = 1.0 - d * d / (peak + d - startCompression);
  color *= newPeak / peak;
  float g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
  return mix(color, newPeak * vec3(1.0), g);
}
vec3 RRTAndODTFit(vec3 v) {
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return a / b;
}
vec3 aces(vec3 color) {
  const mat3 ACESInputMat = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 ACESOutputMat = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  color = ACESInputMat * (color / 0.6);
  color = RRTAndODTFit(color);
  return clamp(ACESOutputMat * color, 0.0, 1.0);
}
// Any NaN or infinity a shader lets slip (a stray pixel) becomes black, and
// nothing is brighter than 64: one bad pixel can never bloom across the frame.
// (Bit test, not isnan(): D3D's compiler may optimise isnan away.)
vec3 fin(vec3 c) {
  bvec3 bad = equal(floatBitsToUint(c) & uvec3(0x7f800000u), uvec3(0x7f800000u));
  return clamp(mix(c, vec3(0.0), bad), 0.0, 64.0);
}
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
// Used only when this GPU cannot multisample the half-float scene target.
// It follows the local edge direction; flat regions remain untouched.
vec3 sceneSample(vec2 uv) {
  vec3 centre = fin(texture(tScene, uv).rgb);
  if (uFXAA < 0.5) return centre;
  vec2 px = 1.0 / max(uRes, vec2(1.0));
  vec3 nw = fin(texture(tScene, uv + px * vec2(-1.0, 1.0)).rgb);
  vec3 ne = fin(texture(tScene, uv + px * vec2(1.0, 1.0)).rgb);
  vec3 sw = fin(texture(tScene, uv + px * vec2(-1.0, -1.0)).rgb);
  vec3 se = fin(texture(tScene, uv + px * vec2(1.0, -1.0)).rgb);
  float m = luma(centre), a = luma(nw), b = luma(ne), c = luma(sw), d = luma(se);
  float lo = min(m, min(min(a, b), min(c, d)));
  float hi = max(m, max(max(a, b), max(c, d)));
  if (hi - lo < max(0.035, hi * 0.125)) return centre;
  vec2 dir = vec2(-((a + b) - (c + d)), (a + c) - (b + d));
  float reduce = max((a + b + c + d) * 0.03125, 0.0078125);
  dir = clamp(dir / (min(abs(dir.x), abs(dir.y)) + reduce), vec2(-8.0), vec2(8.0)) * px;
  vec3 along = 0.5 * (fin(texture(tScene, uv - dir / 6.0).rgb) + fin(texture(tScene, uv + dir / 6.0).rgb));
  vec3 wider = along * 0.5 + 0.25 * (fin(texture(tScene, uv - dir * 0.5).rgb) + fin(texture(tScene, uv + dir * 0.5).rgb));
  float wl = luma(wider);
  return wl < lo || wl > hi ? along : wider;
}
vec3 toSRGB(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = vUv;
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);
  // A subtle lens dispersion at the periphery, measured in pixels. The
  // previous UV-scaled offset smeared fine rails more on larger displays.
  float periphery = smoothstep(0.08, 0.38, r2);
  vec2 radial = c / max(length(c), 0.001);
  vec2 off = radial * periphery * uAberration * 1.6 / max(uRes, vec2(1.0));
  vec3 hdr;
  hdr.r = sceneSample(uv - off).r;
  hdr.g = sceneSample(uv).g;
  hdr.b = sceneSample(uv + off).b;
  hdr = fin(hdr);
  vec3 bloom = fin(texture(tBloom, uv).rgb);
  // Give luminous customers a short lens trail. It comes from the light
  // itself, follows its colour, and never adds a white veil over the room.
  vec3 trail = vec3(0.0);
  for (int i = 1; i <= 3; i++) {
    float d = float(i) * 0.0025;
    float weight = 0.055 / float(i);
    trail += (fin(texture(tBloom, uv + vec2(d, 0.0)).rgb) + fin(texture(tBloom, uv - vec2(d, 0.0)).rgb)) * weight;
  }
  bloom += trail;
  bloom /= 1.0 + luma(bloom) * 0.12;
  vec3 lit = (hdr + bloom * uBloom) * uExposure;
  vec3 col = clamp(neutral(lit), 0.0, 1.0);
  // Keep amber, indigo and gold in bright lights instead of letting every
  // chapter's brightest detail converge to the same flat white.
  float peak = max(max(lit.r, lit.g), lit.b);
  float low = min(min(lit.r, lit.g), lit.b);
  float colourLight = smoothstep(1.5, 6.0, peak) * smoothstep(0.12, 0.6, (peak - low) / max(peak, 0.001));
  vec3 hue = lit / max(peak, 0.001);
  col = mix(col, col * mix(vec3(1.0), hue, 0.28), colourLight);

  // The grade: lift / gamma / gain, saturation, split toning.
  // (The lift is a breath, not a wash: blacks stay black.)
  col = clamp(col * uGain + uLift * 0.12 * (1.0 - col), 0.0, 1.0);
  col = pow(col, 1.0 / max(uGamma, vec3(0.01)));
  float l = luma(col);
  col = mix(vec3(l), col, uSat);
  float hi = smoothstep(0.25, 0.85, l);
  col += uSplit * (uShadow * (1.0 - hi) * smoothstep(0.0, 0.12, l) * (1.0 - l) + uHigh * hi * l) * 0.35;

  vec3 o = toSRGB(col);
  o = mix(o, o * o * (3.0 - 2.0 * o), uContrast);
  // A slow vignette, deeper in the corners.
  float v = 1.0 - smoothstep(0.18, 0.85, r2 * 2.2);
  o *= mix(1.0, v, uVignette);
  // The flash, then black, then paper.
  o = mix(o, uFlashColor, clamp(uFlash, 0.0, 1.0));
  // The end's light comes out of the brights first (the machine, the windows),
  // then takes the rest: a bloom-out, not a veil.
  o = mix(o, uFlashColor, clamp(uFill * (0.35 + 1.8 * luma(o)), 0.0, 1.0));
  float keep = smoothstep(0.45, 0.9, luma(o));
  o *= 1.0 - uBlack * (1.0 - 0.8 * keep);
  vec3 paper = vec3(0.9647, 0.9608, 0.9490);
  o = mix(o, paper, clamp(uPaper, 0.0, 1.0));

  // Grain, strongest in the mid-tones; a little dither under it.
  float grainFrame = floor(uTime * 24.0);
  float g = hash(uv * uRes + fract(grainFrame * 0.731) * 913.0) - 0.5;
  float gl = luma(o);
  o += g * uGrain * (0.45 + 1.4 * gl * (1.0 - gl)) * (1.0 - uPaper * 0.85);
  o += (hash(uv * uRes * 1.37 + 17.0) - 0.5) / 255.0;
  gl_FragColor = vec4(o, 1.0);
}`;

function fullscreenTriangle(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  return g;
}

function pass(frag: string, uniforms: Record<string, THREE.IUniform>, blending: THREE.Blending = THREE.NoBlending) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: frag,
    uniforms,
    depthTest: false,
    depthWrite: false,
    blending,
    toneMapped: false,
  });
}

export class Post {
  readonly scene: THREE.WebGLRenderTarget;
  private mips: THREE.WebGLRenderTarget[] = [];
  private quad: THREE.Mesh;
  private cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private down: THREE.ShaderMaterial;
  private up: THREE.ShaderMaterial;
  private comp: THREE.ShaderMaterial;
  private levels: number;
  private w = 1;
  private h = 1;
  private aaReady = false;
  private requestedSamples: number;
  /** Look-dev (`?perf=1`): the GPU time of each pass. */
  timer: GpuTimer | null = null;

  constructor(samples: number, levels: number) {
    this.levels = levels;
    // Thin rails need real coverage samples on phones as well as desktops.
    this.requestedSamples = Math.max(4, samples);
    this.scene = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.LinearSRGBColorSpace,
      samples,
      depthBuffer: true,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
    });
    // Only the colour is read after the scene. Resolving a multisampled depth
    // buffer has no fast path on D3D (ANGLE draws it with a shader): it cost
    // a fifth of the scene pass on an integrated GPU, for nothing.
    this.scene.resolveDepthBuffer = false;
    for (let i = 0; i < levels; i++) {
      this.mips.push(
        new THREE.WebGLRenderTarget(1, 1, {
          type: THREE.HalfFloatType,
          format: THREE.RGBAFormat,
          depthBuffer: false,
          stencilBuffer: false,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          generateMipmaps: false,
        })
      );
    }
    this.down = pass(DOWN, {
      tSrc: { value: null },
      uTexel: { value: new THREE.Vector2() },
      uPrefilter: { value: 0 },
      uThreshold: { value: 0.9 },
    });
    this.up = pass(UP, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uWeight: { value: 1 } }, THREE.AdditiveBlending);
    // Additive: ONE, ONE (the material's premultiplied flag stays off).
    this.up.blending = THREE.CustomBlending;
    this.up.blendEquation = THREE.AddEquation;
    this.up.blendSrc = THREE.OneFactor;
    this.up.blendDst = THREE.OneFactor;
    this.comp = pass(COMPOSITE, {
      tScene: { value: this.scene.texture },
      tBloom: { value: null },
      uRes: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uExposure: { value: 1 },
      uBloom: { value: 1 },
      uLift: { value: new THREE.Vector3() },
      uGamma: { value: new THREE.Vector3(1, 1, 1) },
      uGain: { value: new THREE.Vector3(1, 1, 1) },
      uSat: { value: 1 },
      uContrast: { value: 0 },
      uShadow: { value: new THREE.Vector3() },
      uHigh: { value: new THREE.Vector3() },
      uSplit: { value: 0 },
      uVignette: { value: 0.3 },
      uGrain: { value: 0.05 },
      uAberration: { value: 0.6 },
      uFlash: { value: 0 },
      uFlashColor: { value: new THREE.Vector3(1, 1, 1) },
      uBlack: { value: 0 },
      uFill: { value: 0 },
      uPaper: { value: 0 },
      uFXAA: { value: 0 },
    });
    this.quad = new THREE.Mesh(fullscreenTriangle(), this.comp);
    this.quad.frustumCulled = false;
  }

  /** The programs, compiled before the film is shown. */
  materials(): THREE.Material[] {
    return [this.down, this.up, this.comp];
  }

  setSize(w: number, h: number) {
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.scene.setSize(w, h);
    let mw = w;
    let mh = h;
    for (const m of this.mips) {
      mw = Math.max(1, Math.round(mw / 2));
      mh = Math.max(1, Math.round(mh / 2));
      m.setSize(mw, mh);
    }
    (this.comp.uniforms.uRes.value as THREE.Vector2).set(w, h);
  }

  private blit(r: THREE.WebGLRenderer, mat: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) {
    this.quad.material = mat;
    r.setRenderTarget(target);
    r.render(this.quad, this.cam);
  }

  /** Draw a frame: the scene into HDR, the bloom, the composite to the screen. */
  render(r: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, g: Grade, time: number, pre?: THREE.Scene) {
    if (!this.aaReady) {
      const gl = r.getContext() as WebGL2RenderingContext;
      const depth = Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, gl.SAMPLES) as Int32Array);
      const pick = (format: number) => {
        const colour = Array.from((gl.getInternalformatParameter(gl.RENDERBUFFER, format, gl.SAMPLES) as Int32Array | null) ?? []);
        const allowed = colour.filter((n) => n <= this.requestedSamples && n <= r.capabilities.maxSamples && depth.includes(n));
        return allowed.length ? Math.max(...allowed) : 0;
      };
      // The scene's HDR in 32 bits (R11G11B10F) where it can be drawn to and
      // multisampled as well as RGBA16F: half the bandwidth of a 4x target,
      // which an integrated GPU spends most of its frame on. The picture is
      // the same (measured: mean 0.2/255); the alpha was never read.
      const wide = pick(gl.RGBA16F);
      const compact = r.extensions.has("EXT_color_buffer_float") ? pick(gl.R11F_G11F_B10F) : 0;
      const samples = compact >= wide && compact > 0 ? compact : wide;
      this.scene.dispose();
      if (compact >= wide && compact > 0) {
        this.scene.texture.format = THREE.RGBFormat;
        this.scene.texture.type = THREE.UnsignedInt101111Type;
      }
      this.scene.samples = samples;
      this.comp.uniforms.uFXAA.value = samples > 0 ? 0 : 1;
      this.aaReady = true;
    }
    const auto = r.autoClear;
    r.autoClear = true;
    const T = this.timer;
    T?.poll();
    T?.begin("scene");
    r.setRenderTarget(this.scene);
    if (pre) {
      // Depth first (it clears to the scene's background), then the scene
      // shades only the nearest surface. A Color background would clear the
      // depth again, so the scene draws without it.
      pre.background = scene.background;
      r.render(pre, camera);
      r.autoClear = false;
      const bg = scene.background;
      scene.background = null;
      r.render(scene, camera);
      scene.background = bg;
    } else r.render(scene, camera);
    T?.end();
    r.autoClear = false;
    T?.begin("bloom");

    // Bloom: down the chain…
    const d = this.down.uniforms;
    d.uThreshold.value = g.threshold;
    let src: THREE.Texture = this.scene.texture;
    let sw = this.w;
    let sh = this.h;
    for (let i = 0; i < this.levels; i++) {
      d.tSrc.value = src;
      (d.uTexel.value as THREE.Vector2).set(1 / sw, 1 / sh);
      d.uPrefilter.value = i === 0 ? 1 : 0;
      this.blit(r, this.down, this.mips[i]);
      src = this.mips[i].texture;
      sw = this.mips[i].width;
      sh = this.mips[i].height;
    }
    // …and back up, each level added onto the one above it.
    const u = this.up.uniforms;
    for (let i = this.levels - 1; i > 0; i--) {
      const m = this.mips[i];
      u.tSrc.value = m.texture;
      (u.uTexel.value as THREE.Vector2).set(1 / m.width, 1 / m.height);
      u.uWeight.value = 0.82;
      this.blit(r, this.up, this.mips[i - 1]);
    }

    T?.end();
    const c = this.comp.uniforms;
    c.tBloom.value = this.mips[0].texture;
    c.uTime.value = time;
    c.uExposure.value = g.exposure;
    c.uBloom.value = g.bloom;
    (c.uLift.value as THREE.Vector3).copy(g.lift);
    (c.uGamma.value as THREE.Vector3).copy(g.gamma);
    (c.uGain.value as THREE.Vector3).copy(g.gain);
    c.uSat.value = g.sat;
    c.uContrast.value = g.contrast;
    (c.uShadow.value as THREE.Vector3).copy(g.shadow);
    (c.uHigh.value as THREE.Vector3).copy(g.high);
    c.uSplit.value = g.split;
    c.uVignette.value = g.vignette;
    c.uGrain.value = g.grain;
    c.uAberration.value = g.aberration;
    c.uFlash.value = g.flash;
    (c.uFlashColor.value as THREE.Vector3).copy(g.flashColor);
    c.uBlack.value = g.black;
    c.uFill.value = g.fill;
    c.uPaper.value = g.paper;
    T?.begin("composite");
    this.blit(r, this.comp, null);
    T?.end();
    r.autoClear = auto;
  }

  dispose() {
    this.scene.dispose();
    this.mips.forEach((m) => m.dispose());
    this.down.dispose();
    this.up.dispose();
    this.comp.dispose();
    this.quad.geometry.dispose();
  }
}
