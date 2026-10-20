import * as THREE from "three";

/**
 * THE ATMOSPHERE: one sky, read everywhere. The dome draws it; the fog of
 * every material fades into the colour of the horizon in the direction it
 * looks (so a far hill dissolves into the sky behind it, never into a flat
 * grey); the sea and the windows reflect it; the glass of the new way bends
 * it. The colours come from the time of day (sky.ts sets them each frame).
 *
 * The model, art-directed but shaped like the real thing: a gradient from
 * the horizon to the top, quick near the horizon; on the sun's side a warm
 * glow along the horizon, widest when the sun is low, and a halo round it;
 * opposite a low sun, the Belt of Venus (a pink band) over the blue of the
 * earth's shadow; at night, the town's own light low over the horizon.
 */

export const ATMOS = {
  aTop: { value: new THREE.Color(0.1, 0.2, 0.5) },
  aHor: { value: new THREE.Color(0.6, 0.6, 0.6) },
  aGlow: { value: new THREE.Color(1, 0.6, 0.3) },
  aSun: { value: new THREE.Vector3(0, 1, 0) },
  aBelt: { value: new THREE.Color(0.8, 0.5, 0.6) },
  aShadowC: { value: new THREE.Color(0.2, 0.25, 0.4) },
  aBeltK: { value: 0 },
  aTown: { value: new THREE.Color(0, 0, 0) },
  aSunVis: { value: 1 },
  /** The haze's height falloff (1/m): the fog lies low and thins with height. */
  fogFall: { value: 1 / 70 },
  /** 1 for every material the world hooked (the fog takes the sky's colour); 0 falls back to the fog's own colour. */
  fogAtmos: { value: 1 },
};

/** The atmosphere's uniforms and functions (GLSL): `atmosSky(d)`, `atmosHaze(d)`. */
export const ATMOS_GLSL = /* glsl */ `
uniform vec3 aTop;
uniform vec3 aHor;
uniform vec3 aGlow;
uniform vec3 aSun;
uniform vec3 aBelt;
uniform vec3 aShadowC;
uniform float aBeltK;
uniform vec3 aTown;
uniform float aSunVis;
vec3 atmosSky(vec3 d) {
  float y = d.y;
  float up = max(y, 0.0);
  vec3 col = mix(aHor, aTop, pow(up, 0.5));
  vec2 dh = d.xz / max(length(d.xz), 1e-4);
  vec2 sh = aSun.xz / max(length(aSun.xz), 1e-4);
  float az = dot(dh, sh);
  // The sun's side: a warm glow along the horizon, widest when the sun is low.
  float low = exp(-abs(aSun.y) * 5.0);
  float side = pow(max(0.5 + 0.5 * az, 0.0), 2.5);
  float band = exp(-up * (3.5 + 7.0 * (1.0 - low)));
  col += aGlow * side * band * low * 0.85;
  // The halo round the sun.
  float cs = max(dot(d, aSun), 0.0);
  col += aGlow * (pow(cs, 6.0) * 0.28 + pow(cs, 48.0) * 0.5) * aSunVis;
  // Opposite a low sun: the Belt of Venus over the earth's shadow.
  float anti = smoothstep(-0.1, 0.85, -az);
  float bz = (y - 0.115) / 0.085;
  float belt = exp(-bz * bz);
  float shade = smoothstep(0.08, 0.0, y);
  col = mix(col, aBelt, belt * anti * aBeltK * 0.4);
  col = mix(col, aShadowC, shade * anti * aBeltK * 0.35);
  // At night, the town's light low over the horizon.
  col += aTown * exp(-up * 9.0);
  return col;
}
// The haze looking along d: the horizon's own colour that way.
vec3 atmosHaze(vec3 d) {
  return atmosSky(normalize(vec3(d.x, 0.04, d.z)));
}
`;

/** Bind the atmosphere's uniforms into a shader's uniforms (same objects: one update reaches all). */
export function bindAtmos(u: Record<string, THREE.IUniform>) {
  Object.assign(u, ATMOS);
  return u;
}
