import * as THREE from "three";

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
    shadow: new THREE.Vector3(0, 0, 0),
    high: new THREE.Vector3(0, 0, 0),
    split: 0,
    vignette: 0.35,
    grain: 0.05,
    aberration: 0.6,
    flash: 0,
    flashColor: new THREE.Vector3(1, 1, 1),
    black: 0,
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
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
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
  vec3 a = texture(tSrc, vUv + t * vec2(-2.0, 2.0)).rgb;
  vec3 b = texture(tSrc, vUv + t * vec2(0.0, 2.0)).rgb;
  vec3 c = texture(tSrc, vUv + t * vec2(2.0, 2.0)).rgb;
  vec3 d = texture(tSrc, vUv + t * vec2(-2.0, 0.0)).rgb;
  vec3 e = texture(tSrc, vUv).rgb;
  vec3 f = texture(tSrc, vUv + t * vec2(2.0, 0.0)).rgb;
  vec3 g = texture(tSrc, vUv + t * vec2(-2.0, -2.0)).rgb;
  vec3 h = texture(tSrc, vUv + t * vec2(0.0, -2.0)).rgb;
  vec3 i = texture(tSrc, vUv + t * vec2(2.0, -2.0)).rgb;
  vec3 j = texture(tSrc, vUv + t * vec2(-1.0, 1.0)).rgb;
  vec3 k = texture(tSrc, vUv + t * vec2(1.0, 1.0)).rgb;
  vec3 l = texture(tSrc, vUv + t * vec2(-1.0, -1.0)).rgb;
  vec3 m = texture(tSrc, vUv + t * vec2(1.0, -1.0)).rgb;
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
uniform vec3 uShadow;
uniform vec3 uHigh;
uniform float uSplit;
uniform float uVignette;
uniform float uGrain;
uniform float uAberration;
uniform float uFlash;
uniform vec3 uFlashColor;
uniform float uBlack;
uniform float uPaper;
in vec2 vUv;

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
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
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
  // A hair of lateral chromatic aberration, growing toward the edges.
  vec2 off = c * r2 * uAberration * 0.02;
  vec3 hdr;
  hdr.r = texture(tScene, uv - off).r;
  hdr.g = texture(tScene, uv).g;
  hdr.b = texture(tScene, uv + off).b;
  vec3 bloom = texture(tBloom, uv).rgb;
  vec3 col = (hdr + bloom * uBloom) * uExposure;
  col = aces(col);

  // The grade: lift / gamma / gain, saturation, split toning.
  col = clamp(col * uGain + uLift * (1.0 - col), 0.0, 1.0);
  col = pow(col, 1.0 / max(uGamma, vec3(0.01)));
  float l = luma(col);
  col = mix(vec3(l), col, uSat);
  float hi = smoothstep(0.25, 0.85, l);
  col += uSplit * (uShadow * (1.0 - hi) * (1.0 - l) + uHigh * hi * l) * 0.35;

  vec3 o = toSRGB(col);
  // A slow vignette, deeper in the corners.
  float v = smoothstep(0.85, 0.18, r2 * 2.2);
  o *= mix(1.0, v, uVignette);
  // The flash, then black, then paper.
  o = mix(o, uFlashColor, clamp(uFlash, 0.0, 1.0));
  o *= 1.0 - uBlack;
  vec3 paper = vec3(0.9647, 0.9608, 0.9490);
  o = mix(o, paper, clamp(uPaper, 0.0, 1.0));

  // Grain, strongest in the mid-tones; a little dither under it.
  float g = hash(uv * uRes + fract(uTime * 7.31) * 913.0) - 0.5;
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

  constructor(samples: number, levels: number) {
    this.levels = levels;
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
      uShadow: { value: new THREE.Vector3() },
      uHigh: { value: new THREE.Vector3() },
      uSplit: { value: 0 },
      uVignette: { value: 0.3 },
      uGrain: { value: 0.05 },
      uAberration: { value: 0.6 },
      uFlash: { value: 0 },
      uFlashColor: { value: new THREE.Vector3(1, 1, 1) },
      uBlack: { value: 0 },
      uPaper: { value: 0 },
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
  render(r: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, g: Grade, time: number) {
    const auto = r.autoClear;
    r.autoClear = true;
    r.setRenderTarget(this.scene);
    r.render(scene, camera);
    r.autoClear = false;

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

    const c = this.comp.uniforms;
    c.tBloom.value = this.mips[0].texture;
    c.uTime.value = time;
    c.uExposure.value = g.exposure;
    c.uBloom.value = g.bloom;
    (c.uLift.value as THREE.Vector3).copy(g.lift);
    (c.uGamma.value as THREE.Vector3).copy(g.gamma);
    (c.uGain.value as THREE.Vector3).copy(g.gain);
    c.uSat.value = g.sat;
    (c.uShadow.value as THREE.Vector3).copy(g.shadow);
    (c.uHigh.value as THREE.Vector3).copy(g.high);
    c.uSplit.value = g.split;
    c.uVignette.value = g.vignette;
    c.uGrain.value = g.grain;
    c.uAberration.value = g.aberration;
    c.uFlash.value = g.flash;
    (c.uFlashColor.value as THREE.Vector3).copy(g.flashColor);
    c.uBlack.value = g.black;
    c.uPaper.value = g.paper;
    this.blit(r, this.comp, null);
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
