/**
 * The Artifact — Nerodyn's kite-mark reborn as an alien obsidian crystal.
 *
 * Custom lighting (no env maps, no PBR) so the look is identical on every
 * GPU: glossy near-black facets with crisp edge highlights, a cold fresnel
 * rim, a faint inner heart of indigo, and a few sparse mythic veins that
 * light randomly runs through.
 *
 * uReflect = 1 renders the mirrored water-ghost (same geometry, flipped):
 * dimmed, ripple-distorted, fading with depth — composited additively.
 */

export const artifactVertex = /* glsl */ `
  varying vec3 vObjPos;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;

  void main() {
    vObjPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const artifactFragment = /* glsl */ `
  precision highp float;

  varying vec3 vObjPos;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;

  uniform float uTime;
  uniform float uReveal;   // 0 → 1 intro
  uniform float uAwaken;   // 0 → 1 story-mode crescendo
  uniform float uHover;    // 0 → 1 pointer over the artifact
  uniform float uReflect;  // 0 = the artifact, 1 = its water ghost
  uniform float uWaterY;   // world-space waterline

  // ---- hash / 3D value noise ------------------------------------------
  float hash13(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash13(i), hash13(i + vec3(1, 0, 0)), u.x),
        mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), u.x),
        u.y
      ),
      mix(
        mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), u.x),
        mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), u.x),
        u.y
      ),
      u.z
    );
  }
  float fbm3(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise3(p);
      p = p * 2.07 + vec3(13.1, 7.7, 5.3);
      a *= 0.5;
    }
    return v;
  }

  const vec3 OBSIDIAN = vec3(0.010, 0.012, 0.020);
  const vec3 ICE      = vec3(0.545, 0.761, 1.000);
  const vec3 INDIGO   = vec3(0.357, 0.239, 0.941);
  const vec3 VEIN     = vec3(0.480, 0.360, 1.000);

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vWorldPos);
    float t = uTime;

    // the ghost in the water shimmers — distort its shading position
    vec3 p = vObjPos;
    if (uReflect > 0.5) {
      float depth = clamp((uWaterY - vWorldPos.y) * 0.8, 0.0, 1.0);
      p.x += sin(vWorldPos.y * 9.0 + t * 1.4) * 0.03 * depth;
      p.z += cos(vWorldPos.y * 7.0 - t * 1.1) * 0.02 * depth;
    }

    // ------------------------------------------------------------------
    // lighting: a cold key from above-left, an indigo kiss from the right,
    // and the water's glow breathing up from below
    vec3 L1 = normalize(vec3(-0.55, 0.95, 0.55));
    vec3 L2 = normalize(vec3(0.80, 0.10, 0.35));
    vec3 L3 = normalize(vec3(0.05, -0.85, 0.45));

    float d1 = max(dot(N, L1), 0.0);
    float d2 = max(dot(N, L2), 0.0);
    float d3 = max(dot(N, L3), 0.0);

    // crisp facet highlights (the Gemini reference's sharp ridge light)
    float s1 = pow(max(dot(reflect(-L1, N), V), 0.0), 90.0);
    float s2 = pow(max(dot(reflect(-L2, N), V), 0.0), 55.0);

    vec3 col = OBSIDIAN;
    col += vec3(0.030, 0.036, 0.060) * d1;          // cold diffuse
    col += INDIGO * d2 * 0.045;                     // indigo flank
    col += ICE * d3 * 0.030 * (1.0 + uAwaken);      // underlight
    col += vec3(0.9, 0.95, 1.0) * s1 * 0.85;        // key sparkle
    col += INDIGO * s2 * 0.40;

    // fresnel rim — the edges catch the world's light
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    col += mix(ICE, INDIGO, 0.45) * fres * (0.22 + uHover * 0.10 + uAwaken * 0.85);

    // ------------------------------------------------------------------
    // mythic veins — sparse ridged-noise seams with light running through
    float field = fbm3(p * 2.1);
    float ridged = abs(field * 2.0 - 1.0);
    float veinLine = smoothstep(0.085, 0.012, ridged);
    // only a few regions of the stone are veined — an accent, not a texture
    float sparse = smoothstep(0.58, 0.72, fbm3(p * 0.85 + vec3(7.3, 2.1, 4.9)));
    // light knots travelling along the veins
    float phase = p.y * 0.55 + fbm3(p * 1.4) * 1.7 - t * 0.22;
    float knot = pow(0.5 + 0.5 * sin(phase * 6.28318), 10.0);
    float veinGlow = veinLine * sparse * (0.22 + knot * 2.1);
    veinGlow *= 0.5 + uHover * 0.25 + uAwaken * 2.6;
    col += VEIN * veinGlow * 1.35;

    // the heart — a slow indigo pulse deep inside the stone
    float core = smoothstep(0.85, 0.0, length(p.xz) + abs(p.y) * 0.35);
    float heartbeat = 0.5 + 0.5 * sin(t * 0.9);
    col += INDIGO * core * (0.05 + heartbeat * 0.035 + uAwaken * 0.55);

    // dither against banding
    col += (hash13(p * 913.7 + fract(t)) - 0.5) * 0.008;

    col *= uReveal;

    // ------------------------------------------------------------------
    if (uReflect > 0.5) {
      // the water ghost: dimmed, and swallowed by depth
      float fade = smoothstep(0.0, 1.15, uWaterY - vWorldPos.y);
      float a = (1.0 - fade) * 0.42 * uReveal;
      gl_FragColor = vec4(col * a, 1.0); // additive — caller sets blending
    } else {
      gl_FragColor = vec4(col, 1.0);
    }
  }
`;
