/**
 * Motes — the air around the artifact is not empty.
 * A sparse field of dust/embers rising slowly through the light shaft,
 * each twinkling as it crosses the beam. Fully procedural from a seed
 * attribute — no buffers updated per frame.
 */

export const particlesVertex = /* glsl */ `
  attribute float aSeed;

  uniform float uTime;
  uniform float uReveal;
  uniform float uAwaken;
  uniform float uPixelRatio;

  varying float vTwinkle;
  varying float vSeed;

  void main() {
    float seed = aSeed;
    vSeed = seed;

    // deterministic pseudo-randoms from the seed
    float r1 = fract(sin(seed * 12.9898) * 43758.5453);
    float r2 = fract(sin(seed * 78.2330) * 12543.8765);
    float r3 = fract(sin(seed * 39.4250) * 24634.6345);

    // cylindrical home around the artifact, hollow center
    float angle = r1 * 6.28318;
    float radius = 0.55 + r2 * 2.6;
    float speed = 0.055 + r3 * 0.075;

    // rise and wrap within a tall column
    float y = mod(r3 * 6.0 + uTime * speed, 6.0) - 2.1;

    // slow orbital drift
    float drift = uTime * (0.02 + r2 * 0.03) * (r1 > 0.5 ? 1.0 : -1.0);
    vec3 pos = vec3(cos(angle + drift) * radius, y, sin(angle + drift) * radius * 0.8);

    // twinkle as motes cross the central beam
    float beam = 1.0 - smoothstep(0.0, 1.6, length(pos.xz));
    vTwinkle = (0.35 + 0.65 * beam) * (0.6 + 0.4 * sin(uTime * (0.8 + r1 * 1.6) + seed * 20.0));

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = (1.4 + r2 * 2.6) * uPixelRatio * (1.0 + uAwaken * 0.6);
    gl_PointSize = size * (7.0 / -mv.z);
  }
`;

export const particlesFragment = /* glsl */ `
  precision highp float;

  uniform float uReveal;
  uniform float uAwaken;

  varying float vTwinkle;
  varying float vSeed;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.06, d) * vTwinkle * uReveal;
    // ice-blue to indigo across the field
    vec3 col = mix(vec3(0.62, 0.78, 1.0), vec3(0.48, 0.36, 1.0), fract(vSeed * 7.31));
    gl_FragColor = vec4(col * (0.5 + uAwaken * 0.8), alpha * 0.5);
  }
`;
