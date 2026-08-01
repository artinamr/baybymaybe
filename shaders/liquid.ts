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

  // Wipe-in, biased top-to-bottom so the four cascading lines arrive in
  // sequence rather than all at once, with a slight left-to-right lean.
  float rev = clamp(uReveal * 1.9 - (1.0 - vUv.y) * 0.55 - vUv.x * 0.16, 0.0, 1.0);
  float a = mask * smoothstep(0.0, 0.26, rev);

  // GREEN channel = solid ink words ("Your" / "Digital"). Near-black, but not
  // dead flat: a faint cool lift down the glyph so they sit in the same light
  // as the liquid words instead of reading as pasted-on vector shapes.
  if (mtex.g > mtex.r) {
    vec3 ink = mix(vec3(0.055, 0.058, 0.086), vec3(0.027, 0.029, 0.043), vUv.y);
    gl_FragColor = vec4(ink, a);
    return;
  }

  float aspect = uRes.x / uRes.y;
  vec2 p = vUv;
  p.x *= aspect;

  vec2 m = uMouse * 0.5 + 0.5;
  m.x *= aspect;

  float t = uTime * 0.045;

  // Pull + domain warp for organic flow. Lower frequency than before: at the
  // larger type size, fine detail read as grain — broad slow currents read as
  // molten volume.
  float md = distance(p, m);
  vec2 pull = (m - p) * smoothstep(0.8, 0.0, md) * 0.14;
  vec2 pw = p * 1.3 + pull;

  vec2 q = vec2(fbm(pw + vec2(0.0, t)), fbm(pw + vec2(5.2, 1.3 - t)));
  vec2 r = vec2(
    fbm(pw + 3.2 * q + vec2(1.7, 9.2) + 0.15 * t),
    fbm(pw + 3.2 * q + vec2(8.3, 2.8) - 0.12 * t)
  );
  float f = fbm(pw + 3.2 * r);
  f = clamp(f + uDive * 0.2, 0.0, 1.3);

  // FULLY-SATURATED electric-indigo fill — never greyed. The letters read as a
  // solid, rich #5B3DF0 with a darker indigo shadow and only a thin bright crest.
  vec3 deep = vec3(0.140, 0.080, 0.520);  // deep indigo shadow
  vec3 mid  = vec3(0.357, 0.239, 0.941);  // electric indigo #5B3DF0
  vec3 hi   = vec3(0.560, 0.470, 1.000);  // bright crest (used sparingly)

  vec3 col = mix(deep, mid, smoothstep(0.05, 0.65, f));
  col = mix(col, hi, smoothstep(0.78, 1.00, f) * 0.40);

  // Thin-film shimmer on the crest only — the same alien interference that runs
  // through the shard, so type and monument read as one material world. Both
  // poles are fully saturated (cyan-blue ↔ magenta), never a grey midpoint, so
  // this can't wash the fill out.
  vec3 irid = mix(vec3(0.26, 0.55, 1.00), vec3(0.82, 0.34, 1.00),
                  0.5 + 0.5 * sin(f * 6.5 + uTime * 0.28));
  col = mix(col, irid, smoothstep(0.74, 1.0, f) * 0.34);

  // Cursor bloom — a gentle brightening that follows the pointer.
  float glow = smoothstep(0.55, 0.0, md);
  col = mix(col, hi, glow * 0.22);

  // Thin travelling sheen — a crest of light, kept tight so it never washes flat.
  float band = fract(uTime * 0.09);
  float diag = vUv.x * 0.62 + (1.0 - vUv.y) * 0.38;
  float sweep = smoothstep(0.025, 0.0, abs(diag - band));
  col += sweep * vec3(0.10, 0.09, 0.18) * (1.0 + uDive);

  // Clamp so the type never trips the bloom threshold (only the veins glow).
  gl_FragColor = vec4(min(col, vec3(1.0)), a);
}
`;
