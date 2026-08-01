/**
 * The world the artifact floats in — painted entirely in fragment math
 * (no textures, no env maps), so it survives headless SwiftShader and
 * looks identical on the client's GPU.
 *
 * Composition (uv space, y-up):
 *   - night-sky gradient with an indigo-cold breath at the top
 *   - a "moon" glow + volumetric light shaft descending onto the artifact
 *   - three mountain ridge layers dissolving into drifting mist
 *   - a still, black mirror zone at the base (the water) with a soft
 *     sheen where the artifact's light touches it
 *   - stars, vignette, and blue-noise dither to kill banding
 */

export const atmosphereVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const atmosphereFragment = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uRes;
  uniform vec2  uPointer;   // smoothed, ~[-1,1]
  uniform float uReveal;    // 0 → 1 intro
  uniform float uAwaken;    // 0 → 1 story-mode crescendo

  // ---- hash / noise ----------------------------------------------------
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
      mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm2(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise2(p);
      p = p * 2.03 + vec2(11.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  // ---- palette ---------------------------------------------------------
  const vec3 INK_TOP   = vec3(0.008, 0.010, 0.020);
  const vec3 INK_MID   = vec3(0.030, 0.038, 0.078);
  const vec3 HORIZON   = vec3(0.055, 0.068, 0.128);
  const vec3 WATER     = vec3(0.006, 0.008, 0.016);
  const vec3 ICE       = vec3(0.545, 0.761, 1.000);
  const vec3 INDIGO    = vec3(0.357, 0.239, 0.941);

  // one ridge line of mountains; returns the ridge height (uv y) at x
  float ridge(float x, float seed, float freq, float amp, float base) {
    float n = fbm2(vec2(x * freq + seed, seed * 1.7));
    float n2 = noise2(vec2(x * freq * 2.7 + seed * 3.1, seed));
    return base + (n * 0.75 + n2 * 0.25) * amp;
  }

  void main() {
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 uv = vUv;
    // work in an aspect-corrected space for circular glows
    vec2 suv = vec2(uv.x * aspect, uv.y);
    float t = uTime;

    // ----------------------------------------------------------------------
    // 1. sky
    float skyMix = smoothstep(0.18, 0.95, uv.y);
    vec3 col = mix(INK_MID, INK_TOP, skyMix);

    // cold indigo breath high in the frame
    float halo = exp(-pow(distance(suv, vec2(0.5 * aspect, 1.18)) * 1.35, 2.0));
    col += INDIGO * halo * 0.34;
    col += ICE * halo * 0.10;

    // horizon glow — the last light the mountains stand against
    float horizonGlow = exp(-pow((uv.y - 0.335) * 5.2, 2.0));
    col += HORIZON * horizonGlow * 1.15;
    col += INDIGO * exp(-pow((uv.y - 0.33) * 7.5, 2.0)) * 0.30;

    // ----------------------------------------------------------------------
    // 2. volumetric shaft descending onto the artifact (screen-center-ish)
    vec2 shaftPos = vec2(0.5 * aspect + uPointer.x * 0.012, uv.y);
    float shaftWidth = mix(0.30, 0.065, smoothstep(0.15, 1.05, uv.y));
    float shaftCore = 1.0 - smoothstep(0.0, shaftWidth, abs(shaftPos.x - 0.5 * aspect));
    float streaks = 0.55 + 0.45 * fbm2(vec2(uv.x * 26.0, uv.y * 2.2 - t * 0.05));
    float shaft = shaftCore * shaftCore * streaks;
    shaft *= smoothstep(0.16, 0.62, uv.y);          // fade near the water
    shaft *= 0.5 + 0.5 * smoothstep(0.5, 1.0, uv.y); // stronger up high
    col += ICE * shaft * 0.045;
    col += INDIGO * shaft * 0.05 * (1.0 + uAwaken * 1.6);

    // ----------------------------------------------------------------------
    // 3. mountains — three ridges, parallaxed, sinking into mist
    float px = uPointer.x;
    // far ridge
    float r1 = ridge(uv.x + px * 0.008, 3.7, 2.1, 0.115, 0.295);
    // mid ridge
    float r2 = ridge(uv.x + 0.31 + px * 0.018, 8.2, 3.0, 0.095, 0.255);
    // near ridge
    float r3 = ridge(uv.x + 0.67 + px * 0.034, 14.9, 4.2, 0.075, 0.205);

    float m1 = 1.0 - smoothstep(r1 - 0.002, r1 + 0.002, uv.y);
    float m2 = 1.0 - smoothstep(r2 - 0.002, r2 + 0.002, uv.y);
    float m3 = 1.0 - smoothstep(r3 - 0.002, r3 + 0.002, uv.y);

    vec3 mCol1 = vec3(0.020, 0.026, 0.052);
    vec3 mCol2 = vec3(0.012, 0.016, 0.034);
    vec3 mCol3 = vec3(0.006, 0.008, 0.018);

    col = mix(col, mCol1, m1 * 0.92);
    // faint sky-light kissing the far ridge line
    col += ICE * (1.0 - smoothstep(0.0, 0.012, abs(uv.y - r1))) * 0.05;
    col = mix(col, mCol2, m2 * 0.95);
    col = mix(col, mCol3, m3);

    // mist: thick bands drifting between the ridges and over the water
    float mist1 = fbm2(vec2(uv.x * 3.4 + t * 0.016, uv.y * 9.0));
    float mist2 = fbm2(vec2(uv.x * 5.1 - t * 0.011, uv.y * 14.0 + 4.0));
    float mistBand = exp(-pow((uv.y - 0.30) * 4.6, 2.0));
    float lowBand = smoothstep(0.34, 0.05, uv.y);
    float mist = (mist1 * 0.65 + mist2 * 0.35) * (mistBand * 0.6 + lowBand * 0.55);
    col += vec3(0.10, 0.13, 0.22) * mist * 0.30;
    col += INDIGO * mist * 0.05;

    // ----------------------------------------------------------------------
    // 4. the black mirror (water) — bottom of frame
    float waterZone = smoothstep(0.30, 0.10, uv.y);
    col = mix(col, WATER, waterZone * 0.85);

    // sheen where the artifact's light touches the surface
    vec2 sheenPos = vec2(0.5 * aspect + px * 0.01, 0.16);
    float sheen = exp(-pow((suv.x - sheenPos.x) * 2.6, 2.0))
                * exp(-pow((suv.y - sheenPos.y) * 5.0, 2.0));
    // ripple shimmer inside the sheen
    float ripple = noise2(vec2(uv.x * 60.0, uv.y * 240.0 + t * 0.35));
    sheen *= 0.75 + 0.25 * ripple;
    col += INDIGO * sheen * (0.16 + uAwaken * 0.30);
    col += ICE * sheen * 0.075;

    // long, thin horizontal shimmer lines on the water
    float lines = smoothstep(0.985, 1.0, noise2(vec2(uv.x * 14.0, uv.y * 320.0 + t * 0.22)));
    col += ICE * lines * waterZone * 0.05;

    // ----------------------------------------------------------------------
    // 5. stars — only in open sky, gently twinkling
    float starMask = smoothstep(r1 + 0.03, r1 + 0.16, uv.y) * (1.0 - m1);
    vec2 starGrid = suv * vec2(90.0, 160.0);
    vec2 cell = floor(starGrid);
    float starRnd = hash12(cell);
    vec2 starPos = fract(starGrid) - 0.5;
    float star = smoothstep(0.08, 0.0, length(starPos))
               * step(0.982, starRnd);
    float twinkle = 0.55 + 0.45 * sin(t * (1.2 + starRnd * 2.4) + starRnd * 41.0);
    col += vec3(0.75, 0.82, 1.0) * star * twinkle * starMask * 0.5;

    // ----------------------------------------------------------------------
    // 6. vignette + dither
    float vig = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(aspect * 0.82, 1.15)));
    col *= mix(0.55, 1.0, vig);

    col += (hash12(uv * uRes + fract(t) * 7.0) - 0.5) * 0.012;

    // intro reveal + awaken lift
    col *= uReveal;
    col += INDIGO * uAwaken * 0.02;

    gl_FragColor = vec4(col, 1.0);
  }
`;
