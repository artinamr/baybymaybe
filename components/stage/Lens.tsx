"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { sceneState } from "@/lib/sceneState";
import { perf } from "@/lib/stores";

/**
 * THE LENS — depth of field, the one thing that makes a real-time render read
 * as photographed glass rather than geometry. It never greys the page (the
 * reason there is no bloom): the scene is rendered, still TRANSPARENT and
 * premultiplied, into an MSAA half-float target with depth; one gather pass
 * blurs it by circle of confusion (a spiral of taps; each sample counts only if
 * its OWN blur reaches this pixel — so an out-of-focus shard in front spreads
 * softly over what is behind it, and a sharp subject never smears into the
 * background); then it is tone-mapped exactly as the direct render would be,
 * and written premultiplied — alpha blurs too, so a defocused shard melts into
 * the paper at its edges.
 *
 * Cheap where nothing is soft: a tiny pass first finds the largest blur in
 * every 16 px tile (glass only — empty paper spreads nothing), and the gather
 * takes only as many taps as its neighbourhood needs — none at all over the
 * sharp subject and the bare paper, which is most of the frame. Every texture
 * read in a loop names its LOD, so the loops compile as loops (ANGLE's HLSL
 * compiler unrolls anything that needs derivatives — seconds of stall).
 *
 * `sceneState.cam.aperture` (px of blur for something far behind the focus)
 * comes from the film; at 0 — the hero, the statement — the scene is rendered
 * straight to the canvas exactly as before, at no cost.
 */

const TILE = 16;

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const COMMON = /* glsl */ `
uniform float uNear;
uniform float uFar;
uniform float uFocus;
uniform float uAperture;
uniform float uMaxBlur;
float linDepth(float d) {
  float z = d * 2.0 - 1.0;
  return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
}
// Circle of confusion (px): nothing at the focus, growing in front (stronger)
// and behind it.
float coc(float z) {
  float c = uAperture * (z - uFocus) / max(z, 1e-3);
  c = c < 0.0 ? -c * 1.6 : c;
  return clamp(c, 0.0, uMaxBlur);
}
`;

/* The largest blur of any glass in a tile (sampled every 4 px — the shards are
   never thinner than that). */
const TILE_FRAG = /* glsl */ `
uniform sampler2D tDepth;
uniform vec2 uTexel;
varying vec2 vUv;
${COMMON}
void main() {
  float m = 0.0;
  for (int y = 0; y < 4; y++) {
    for (int x = 0; x < 4; x++) {
      vec2 off = (vec2(float(x), float(y)) - 1.5) * 4.0 * uTexel;
      float d = textureLod(tDepth, vUv + off, 0.0).r;
      if (d < 0.99999) m = max(m, coc(linDepth(d)));
    }
  }
  gl_FragColor = vec4(m, 0.0, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform sampler2D tTile;
uniform vec2 uTexel;
uniform vec2 uTileTexel;
varying vec2 vUv;
${COMMON}

void main() {
  vec4 center = textureLod(tColor, vUv, 0.0);
  // The widest blur that can reach this pixel: its tile and the eight round it.
  float r = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      r = max(r, textureLod(tTile, vUv + vec2(float(x), float(y)) * uTileTexel, 0.0).r);
    }
  }
  vec4 col = center;
  if (r > 0.6) {
    float zc = linDepth(textureLod(tDepth, vUv, 0.0).r);
    float cc = coc(zc);
    float tot = 1.0;
    // A golden-angle spiral out to that blur, as many taps as its area needs,
    // turned per pixel by interleaved gradient noise (fine and even, never a
    // speckle) so the taps never line up into a pattern.
    float k = r / max(uMaxBlur, 1e-3);
    int n = int(clamp(ceil(48.0 * k * k), 12.0, 48.0));
    float fn = float(n);
    float ang = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2831853;
    for (int i = 0; i < 48; i++) {
      if (i >= n) break;
      float rr = r * sqrt((float(i) + 0.5) / fn);
      vec2 tc = vUv + vec2(cos(ang), sin(ang)) * uTexel * rr;
      ang += 2.39996323;
      vec4 sc = textureLod(tColor, tc, 0.0);
      float zs = linDepth(textureLod(tDepth, tc, 0.0).r);
      float ss = coc(zs);
      // What lies behind a sharper pixel may not blur over it.
      if (zs > zc) ss = min(ss, cc * 2.0);
      float m = smoothstep(rr - 0.75, rr + 0.75, ss);
      col += mix(col / tot, sc, m);
      tot += 1.0;
    }
    col /= tot;
  }
  // Tone-map as the direct render does (on the un-premultiplied colour), then
  // premultiply again for the transparent canvas.
  float a = clamp(col.a, 0.0, 1.0);
  vec3 rgb = a > 1e-4 ? col.rgb / a : vec3(0.0);
  gl_FragColor = vec4(rgb, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
}
`;

function fullScreen(mat: THREE.ShaderMaterial) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  const s = new THREE.Scene();
  s.add(mesh);
  return s;
}

const lensUniforms = () => ({
  uNear: { value: 0.1 },
  uFar: { value: 100 },
  uFocus: { value: 10 },
  uAperture: { value: 0 },
  uMaxBlur: { value: 12 },
});

export function Lens() {
  const { gl, scene, camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const dpr = gl.getPixelRatio();

  const rts = useMemo(() => {
    const w = Math.max(1, Math.round(size.width * dpr));
    const h = Math.max(1, Math.round(size.height * dpr));
    const depth = new THREE.DepthTexture(w, h);
    depth.type = THREE.UnsignedIntType;
    const main = new THREE.WebGLRenderTarget(w, h, {
      samples: 4,
      type: THREE.HalfFloatType,
      depthTexture: depth,
      depthBuffer: true,
    });
    main.texture.colorSpace = THREE.LinearSRGBColorSpace;
    const tile = new THREE.WebGLRenderTarget(Math.ceil(w / TILE), Math.ceil(h / TILE), {
      type: THREE.HalfFloatType,
      depthBuffer: false,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
    return { main, tile };
  }, [size.width, size.height, dpr]);
  useEffect(
    () => () => {
      rts.main.dispose();
      rts.tile.dispose();
    },
    [rts]
  );

  const pass = useMemo(() => {
    const tileMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: TILE_FRAG,
      uniforms: { tDepth: { value: null }, uTexel: { value: new THREE.Vector2() }, ...lensUniforms() },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        tColor: { value: null },
        tDepth: { value: null },
        tTile: { value: null },
        uTexel: { value: new THREE.Vector2() },
        uTileTexel: { value: new THREE.Vector2() },
        ...lensUniforms(),
      },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
      toneMapped: true,
    });
    return { tileMat, mat, tileScene: fullScreen(tileMat), scene: fullScreen(mat), cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
  }, []);

  // Compile both programs up front (in parallel where the driver can), never
  // on the first frame that needs them.
  useEffect(() => {
    gl.compileAsync(pass.tileScene, pass.cam).catch(() => undefined);
    gl.compileAsync(pass.scene, pass.cam).catch(() => undefined);
  }, [gl, pass]);

  useFrame(() => {
    const c = sceneState.cam;
    // The lowest performance tier gives the lens up first.
    const A = perf.tier >= 3 ? 0 : c.aperture;
    if (A < 0.05) {
      gl.setRenderTarget(null);
      gl.render(scene, camera);
      return;
    }
    const { main, tile } = rts;
    gl.setRenderTarget(main);
    gl.clear();
    gl.render(scene, camera);

    const focus = cam.position.distanceTo(c.target);
    const maxBlur = Math.min(16, (4 + A * 1.2) * dpr);
    for (const U of [pass.tileMat.uniforms, pass.mat.uniforms]) {
      U.tDepth.value = main.depthTexture;
      (U.uTexel.value as THREE.Vector2).set(1 / main.width, 1 / main.height);
      U.uNear.value = cam.near;
      U.uFar.value = cam.far;
      U.uFocus.value = focus;
      U.uAperture.value = A * dpr;
      U.uMaxBlur.value = maxBlur;
    }
    gl.setRenderTarget(tile);
    gl.render(pass.tileScene, pass.cam);

    const U = pass.mat.uniforms;
    U.tColor.value = main.texture;
    U.tTile.value = tile.texture;
    (U.uTileTexel.value as THREE.Vector2).set(1 / tile.width, 1 / tile.height);
    gl.setRenderTarget(null);
    gl.render(pass.scene, pass.cam);
  }, 1);

  return null;
}
