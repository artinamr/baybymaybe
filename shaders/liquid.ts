// The headline as a window into flowing liquid: domain-warped value-noise in
// indigo/violet, a travelling light-sweep sheen, and a cursor bloom — all
// confined to the text via a mask texture. Outside the letters: transparent.

export const liquidVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0); // fullscreen quad
}
`;

export const liquidFragment = /* glsl */ `
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform vec2  uMouse;  // -1..1
uniform vec2  uRes;    // px
uniform float uDive;   // 0..1 "hear the story" ramp
uniform float uReveal; // 0..1 entrance
uniform sampler2D uMask;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec4 mtex = texture2D(uMask, vUv);
  float mask = mtex.a;
  if (mask < 0.004) discard;

  // Left-to-right wipe-in (shared by both word styles).
  float rev = clamp(uReveal * 1.5 - vUv.x * 0.45, 0.0, 1.0);
  float a = mask * smoothstep(0.0, 0.28, rev);

  // GREEN channel = solid black words ("Your" / "Digital").
  if (mtex.g > mtex.r) {
    gl_FragColor = vec4(vec3(0.039, 0.043, 0.063), a);
    return;
  }

  float aspect = uRes.x / uRes.y;
  vec2 p = vUv;
  p.x *= aspect;

  vec2 m = uMouse * 0.5 + 0.5;
  m.x *= aspect;

  float t = uTime * 0.05;

  // Pull + domain warp for organic flow.
  float md = distance(p, m);
  vec2 pull = (m - p) * smoothstep(0.8, 0.0, md) * 0.14;
  vec2 pw = p * 2.0 + pull;

  vec2 q = vec2(fbm(pw + vec2(0.0, t)), fbm(pw + vec2(5.2, 1.3 - t)));
  vec2 r = vec2(
    fbm(pw + 3.2 * q + vec2(1.7, 9.2) + 0.15 * t),
    fbm(pw + 3.2 * q + vec2(8.3, 2.8) - 0.12 * t)
  );
  float f = fbm(pw + 3.2 * r);
  f = clamp(f + uDive * 0.2, 0.0, 1.3);

  // Dark, legible palette — letters stay clearly darker than the off-white page.
  vec3 ink    = vec3(0.090, 0.055, 0.230);
  vec3 indigo = vec3(0.357, 0.239, 0.941);
  vec3 violet = vec3(0.640, 0.560, 1.000);

  vec3 col = ink;
  col = mix(col, indigo, smoothstep(0.30, 0.72, f));
  col = mix(col, violet, smoothstep(0.62, 0.98, f) * 0.85);

  // Cursor bloom.
  float glow = smoothstep(0.6, 0.0, md);
  col = mix(col, violet, glow * 0.45);

  // Travelling diagonal light sweep — premium sheen across the type.
  float band = fract(uTime * 0.11);
  float diag = vUv.x * 0.62 + (1.0 - vUv.y) * 0.38;
  float sweep = smoothstep(0.05, 0.0, abs(diag - band));
  col += sweep * (0.45 + 0.4 * uDive);

  gl_FragColor = vec4(col, a);
}
`;
