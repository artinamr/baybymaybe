## Scoring

| Proposal | a Impact | b Restraint | c Narrative | d White theme | e Feasibility | f Motion | Total |
|---|---|---|---|---|---|---|---|
| **one-stone** | 8 | 6 | 9 | 8 | 6 | 9 | **46, winner** |
| journey | 8 | 4 | 6 | 9 | 4 | 9 | 40 |
| type-and-matter | 8 | 5 | 7 | 7 | 5 | 9 | 41 |

- **one-stone.** It has one object, one material and one continuous camera. Its sequence of breaking the stone, ordering the pieces, running light through them, rebuilding it and ending on the logo describes the business. I checked its logo maths against `public/new-logo.svg` and it is right: the rhombus measures 1116.6 × 607.0 px, so elevation = asin(607/1117) = 32.9°. The point drops 1286.8 px below the rhombus centre, so depth = 2.745 × the girdle half-diagonal = 1.94 × the girdle side. It scores low on restraint for five reasons:
  - The glowing Voronoi veins on the outer faces are the rejected worley crack look under a new name.
  - The pre-drawn node graph is the stock "AI network" picture.
  - The corridor of 24 fragments is sparse.
  - The manifesto uses a word-by-word opacity scrub.
  - Its low crown (18% of the height) moves away from the client's own reference (about 40%).
- **journey.** It has the best white-world engineering: paper-coloured fog, a light thread that fills POTENTIAL, the cursor acting as the light, and a text inversion clipped exactly to the stone's outline. The weakness is that it builds six unrelated sculptures, which reads as a pile of effects:
  - The orbiting satellites are small floating props, which the client rejected.
  - A colonnade of obelisks for "infrastructure" is a Greek-temple cliché.
  - Mirror slabs full of placeholder tiles show nothing.
  - A CSS3D headline risks soft type and sync problems.
  - It adds a magnetic button, which breaks its own restraint rule.
- **type-and-matter.** It has the sharpest type-and-object thinking:
  - one technique per chapter
  - the rule that occlusion must cut across glyphs, never hide one centred glyph
  - the closing "cut"
  - a rounded-bevel hull
  - a light matte for the intro window
  
  But it stacks tricks (X-ray outline, the headline reflected in the facets, difference blending, a noise dissolve, a refraction shader). It brings back the matte `rock.jpg` with a stock dissolve and uses two mist cuts. Its logo fit is also wrong. One orthographic view of the SVG only fixes b·sin(e) and d·cos(e). With a square girdle that gives 32.9° and d = 2.745a; its 46.8° and 4.417 do not reproduce the mark.

**Cut outright:**
- Glowing Voronoi seams on outer faces.
- Satellites.
- Colonnade.
- Placeholder mirror slabs.
- CSS3D type.
- X-ray outline.
- Headline reflected in the facets.
- Difference blending.
- Rock shell plus noise dissolve.
- Refracting flakes.
- Magnetic buttons.
- Drag-to-spin.
- Iridescence.
- Opacity-scrubbed words.
- Mist teleports.

**Grafted onto one-stone:**
- From journey:
  - the light thread that runs down the stone and fills POTENTIAL
  - the cursor as the light source
  - the inversion clipped to the stone's projected outline
  - stones rising out of a mirror floor in the flythrough, applied here to a field of obsidian shards
  - a specimen card with a live readout
  - reveals that arrive with ceremony and leave quietly
- From type-and-matter:
  - the closing crown cut, which lets the hero keep the reference's short-cap proportion
  - the rounded-bevel hull
  - the glyph-straddling occlusion rule
  - the intro fast-forwarding on the first scroll
  - "Cut, not cast."

---

# FINAL SPEC: "One Stone", nerodyn.com homepage rebuild

## 0. The idea in one paragraph

The whole homepage is one piece of polished black obsidian, shaped from the Nerodyn mark, on warm white paper. Its only colour is Electric Indigo light.

The hero stands the stone inside a giant indigo word, and a thread of light runs down the stone and fills that word. Scrolling then shows what the studio does to the stone:
1. It passes under the thesis like a reading lens and cracks along the mark's own cuts.
2. It bursts into 24 splinters that settle into four lit floors (infrastructure).
3. The splinters become a network that light relays through (AI).
4. They stream into a misty field of standing obsidian (work).
5. They reassemble from the point up (method).
6. The last cut removes the cap. From one exact camera angle the stone *is* the Nerodyn mark, its seams drawn in indigo light (contact).

It keeps one material and one camera, and never cuts away to a new prop.

## 1. World and constants (`lib/geo/crystal.ts`, `lib/chapters.ts`)

- **Units.** Girdle side s = 1. Y points up. Camera azimuth 0 means the camera sits on +Z looking toward −Z. Right-handed.
- **Stone in object space.** The girdle is a square in diamond orientation, with corners at (±0.70711, 0, 0) and (0, 0, ±0.70711).
  - Girdle band: a vertical slab from y = 0 to y = 0.012.
  - Crown apex: (0.030, 1.012, −0.020). The small offset gives life; the crown is cut away in the finale, so it never affects the mark.
  - Culet (the bottom point): (0, −1.940, 0).
  - Stone height Hs = 2.952. The crown is 34% of the height, close to the client's reference.
  - Bounding-box centre y = −0.464.
- **Logo constants** (asserted by `scripts/mark-fit.mjs` against the SVG):
  - MARK_EL = 32.91°
  - pavilion depth / half-diagonal = 2.745
  - MARK_SPLIT = 0.0134: each blade moves ±x (inner edges sit at 1013.4 and 1034.7 px on a 790 px side)
  - MARK_LIFT = 0.028: the band plate lifts so that the gap below it matches the SVG's 18.8 px front-corner gap
- **Homes.**
  - HOME_A = (0, 0, 0), for chapters 00–03.
  - HOME_B = (0, 0, −52), for chapters 05–06.
  - FLOOR_Y = −1.975, which leaves the culet hovering 0.035 above the floor.
- **Scroll coordinate.** S = scrollY / innerHeight, measured in screens. Each chapter has top S₀, and local s = S − S₀; it runs −1 → 0 while the chapter enters. Sticky chapters hold their layers while s goes from 0 to vh/100 − 1.

| # | id | Index label | Section vh | S₀ | Sticky s | Index-jump target S |
|---|---|---|---|---|---|---|
| 00 | potential | Potential | 100 | 0.0 | flows | 0.00 |
| 01 | cut | The cut | 200 | 1.0 | 0 → 1.0 | 1.10 |
| 02 | order | Infrastructure | 260 | 3.0 | 0 → 1.6 | 3.40 |
| 03 | current | Intelligence | 260 | 5.6 | 0 → 1.6 | 5.95 |
| 04 | field | Work | 220 | 8.2 | list flows | 8.30 |
| 05 | method | Method | 220 | 10.4 | 0 → 1.2 | 10.60 |
| 06 | mark | Contact | 220 | 12.6 | 0 → 1.2, footer inside | 13.25 |

The page totals 1480vh, so S_max = 13.8.

## 2. Hero composition (reference frame 1440×900; all values solved in `lib/layout.ts`)

- **Gutter and nav.** Gutter G = clamp(20px, 4vw, 72px). The nav band is 76px (0.084H). At rest, no 3D may enter nav bottom + 24px; this is asserted.
- **The stone** (canvas, whole, never cropped):
  - Its axis sits at x ≈ 0.62W. The exact x is solved as `wordLeft + 0.63·wordWidth` of POTENTIAL, clamped to 0.55–0.66W, then nudged by the occlusion rule below.
  - Apex at 0.12H, culet at 0.88H, so it is 0.76H tall (684px).
  - The girdle sits at 0.38H. At the rest yaw of 20° it is about 0.21W wide.
  - A faint mirrored reflection runs from 0.89H to 0.93H, with an ink contact shadow under the culet.
  - A thin paper-coloured ground mist lies only below POTENTIAL's baseline.
- **Headline:** a real `<h1>` in the back layer (z1), under the transparent canvas, so the stone physically hides it. It uses three textures.
  - Eyebrow: x = G, top 0.155H. A 40px indigo rule, then Geist Mono 11px caps, tracking 0.12em, ink at 62%: `NERODYN — DIGITAL INFRASTRUCTURE & AI AUTOMATION`.
  - **L1 "Maximise"**: Instrument Sans (wdth 100, wght 600), min(8.2vw, 13.1vh) ≈ 118px, tracking −0.045em, ink. x = G − 0.03em (optical alignment), cap top 0.20H.
  - **L2 "your digital"**: Instrument Serif italic at 1.06 × L1, tracking −0.015em, ink, baseline 0.43H. Indent = min(0.07W, the stone's left flank at that height − 0.025W − the line's width). The indent shrinks first and the size only after; L2 never touches the stone.
  - **L3 "POTENTIAL"**: Instrument Sans (wdth 75, wght 700) caps, tracking −0.01em, line-height 0.80.
    - Size is fitted by `measureText` after `fonts.ready`, so the advance width is exactly W − 2G (≈254px). Cap height is capped at 0.21H; on ultrawide screens it stops short and stays left-aligned at G.
    - Baseline 0.80H, cap top ≈ 0.60H.
    - Rest state: an indigo outline, `-webkit-text-stroke: max(1.5px, .016em) #5B3DF0`, transparent fill. The intro light fills it solid #5B3DF0.
    - The pavilion cuts a tapering wedge through it, 0.12W wide at cap top and 0.03W at the baseline.
    - **Occlusion rule:** no glyph may have more than 55% of its ink box hidden, and the stem of I is never fully hidden. The layout solves this; `?debug=safe` draws it.
- **Bottom band** (front layer, z4):
  - Description: x = G, top 0.845H, max-width 0.26W, Instrument Sans 16px/1.5, ink at 70%.
  - CTAs: from x = 0.31W at 0.845H, 12px apart, ending at or before 0.53W. First "Hear the story" (indigo gradient pill, 48px), then "Start a project ↗" (ghost pill).
- **Specimen card** (chrome, z30): right = G, from 0.835H to 0.955H, 264px wide.
- **Chapter index** (chrome, z30): right 22px, centred on 0.42H, clear of POTENTIAL.
- **Why this is not a template:** two ink lines hold the top left, a full-width indigo word crosses the frame, and a black monument stands *in* that word and cuts it. There is no boxed zone and no centred text.

## 3. Intro timeline (ms from t0)

**Gate.** The intro waits for all of these: `document.fonts.ready`, the stone and its fracture built, the env cubemap rendered once, `renderer.compileAsync(scene, camera)` run with every group visible, and the first frame presented.
- Then set `html[data-intro=run]` and `intro.t0` on the same frame.
- Hard fallback: start at 1500ms regardless.
- If the gate takes longer than 300ms, the nav mark draws its three pieces (stroke-dashoffset, 600ms, ink at 30%) as the only loader.
- DOM parts are pure CSS keyframes keyed on that attribute. Canvas parts read t0. There is no GSAP timeline.
- **Any wheel or touch before `done`** jumps every intro animation to its end over 300ms. Scroll is never blocked.

| t (ms) | Beat |
|---|---|
| 0 | `#stage` (canvas) and `#field-card` (tint #ECEAE5) are clipped to `inset(13% 4% 11% 40% round 28px)`. `#stage-frame` draws a 1px rgba(10,11,16,.10) hairline and the shadow `0 40px 90px -40px rgba(10,11,16,.22)`. Camera distance ×1.28 with principal point (0.68, 0.51); the stone is whole inside the window, yawed 38°. |
| 0–260 | The card fades in, opacity 0 → 1. |
| 0–1100 | The inset goes to 0 and the radius from 28 to 0, `cubic-bezier(.16,1,.3,1)`. The tint fades to transparent (120–1100). The frame's hairline and shadow fade out (700–1100). At 1100 the clip-path style is **removed**. |
| 0–1500 | Same ease: camera distance ×1.28 → ×1.00, principal point → (0.62, 0.50), stone yaw 38° → 20°. The product shot becomes a monument. |
| 380 | The nav mark and wordmark rise (y 10 → 0px, opacity, 600ms, expo-out). Links follow every 50ms from 440; the ghost pill comes in at 680. |
| 460 / 540 | The eyebrow rule draws 0 → 40px (600ms), then its text fades in (500ms). |
| 560 / 660 / 760 | L1, L2 and L3 rise through line masks: translateY(108%) skewY(3deg) → 0. Masks use `overflow: clip` with `overflow-clip-margin: .12em` so italics and descenders survive. `cubic-bezier(.19,1,.22,1)`, 900ms (L3 takes 1000ms, in its outline state). |
| 1100 / 1180 / 1260 | Description, then pill 1, then pill 2 (y 16 → 0, opacity, 700ms). |
| 1250 | The specimen card slides up (y 40 → 0, 800ms, expo-out). Its rows reveal through masks 60ms apart, and the AZ readout starts. |
| 1300–1650 | The index ticks in: 7 rows at a 50ms stagger, each a hairline scaleX 0 → 1 (400ms) then its numeral fades in. |
| 1500 → | Continuous motion starts: Ken-Burns dolly 1.00 → 0.965 over 24s (easeOutSine), then a ±0.4% breathing sine with a 14s period. Idle yaw and ground mist drift begin. |
| 1900 | **The thread.** An indigo pulse leaves the apex and runs down the front-left crown ridge to the girdle (520ms), then down the pavilion ridge to the culet (760ms), easeInOutSine. |
| ≈2400 | As the pulse head crosses POTENTIAL's projected cap top, the Director emits `thread:potential`. POTENTIAL's solid fill layer wipes open from the stone's projected x outward in both directions: `clip-path inset(0 R 0 L) → inset(0)`, 900ms, `cubic-bezier(.65,0,.35,1)`. Fallback trigger at 3200. |
| 3400 | `data-intro=done`. Glints now repeat every 9–13s (seeded). |

## 4. Centerpiece recipe

### 4.1 Geometry (`lib/geo/hull.ts`, `roundedHull.ts`, `crystal.ts`)
- Build the convex hull of the 10 defining points: 4 corners at y = 0, 4 at y = 0.012, the apex and the culet.
- **Rounded bevel**, r = 0.010:
  - Directions: every face normal, 3 slerps between the two normals of each edge, and for each vertex the normalised sum of its incident normals plus 4 samples inside its normal cone.
  - Hull of {p + r·d}. Facet triangles keep flat face normals; bevel triangles use their d as vertex normals.
  - This gives real 2–3px round-overs that make crisp moving edge highlights, with no edge shader. About 450 triangles.
- Attributes on the whole stone:
  - `aKind`: 0 facet, 1 bevel, 2 cut face (cut faces appear only after the fracture)
  - `aRidge`: 0–7 for the 4 crown and 4 pavilion ridges, −1 otherwise
  - `aRidgeT`: 0–1 along apex → girdle → culet, used for the thread

### 4.2 Fracture (`lib/geo/fracture.ts`, pure TS, deterministic, runs in node)
- Clip the convex polyhedron by planes, Sutherland–Hodgman per face plus a cap polygon, and record which plane created each edge.
- **Primary cuts (the mark's cuts):**
  - y = 0.012 splits the crown from the band
  - y = 0 splits the band from the pavilion
  - x = 0 splits the pavilion only
  
  That makes 4 pieces: crown, band plate, left blade, right blade.
- **Voronoi inside the pieces:** crown 5 seeds, each blade 9, band none. That gives **24 fragments**.
  - Seeds: `mulberry32(0x5B3DF0)` rejection sampling, 3 Lloyd iterations.
  - Anisotropic metric M = diag(1, 0.55, 1); the bisector plane normal is M²(sⱼ − sᵢ). Cells elongate along Y, so obsidian splinters rather than crumbling.
  - Re-roll any cell smaller than 0.4 × the mean volume.
- **Output:** one merged, non-indexed BufferGeometry of at most 2.5k triangles. Per-vertex attributes:
  - `position` (relative to the fragment centroid), `normal`
  - `aFrag` (0–23), `aKind`, `aRidge`, `aRidgeT`
  - `aBary` (vec3); `aCrack` (vec3, the type of the triangle edge opposite each vertex: 0 none, 1 Voronoi, 2 primary)
  - `aObj` (whole-stone position)
  - `aFaceC`, `aFaceR` (cut-face centroid and radius); `aRipO` (a conchoidal origin on the cut face's boundary)
- **`FragInfo[]`** per fragment: `{centroid, volume, piece, cutNormal c (largest cut face), outward d, longAxis, tier 0–3 (by volume, largest = 0), group 0–3 (method order from the culet up), cluster 'P' or 'W'}`.
- `scripts/fracture-check.mjs` asserts: the volumes sum to the hull volume within 0.5%; the minimum cell is at least 0.4 × the mean; the triangle count is at most 2.5k; the output hash is stable.
- `lib/geo/shards.ts` exposes `makeShard({sides, crown, pavilion, jitter, seed})` for the field variants and the flakes. `lib/geo/mark.ts` holds the constants from section 1 and the SVG overlay helper.

### 4.3 Per-fragment transforms
- The fragment transforms live in `fragTex`, an RGBA32F DataTexture of 8 × 24 texels, not a uniform array (a uniform array could overflow the vertex uniform limit on an iGPU). Per fragment row:
  - texels 0–3: the model mat4 columns
  - texels 4–6: the normal mat3, needed because formations use non-uniform scale
  - texel 7: (glow, flash, fade, spare)
- The Director writes it every frame. The patched `begin_vertex` and `beginnormal_vertex` read it with `texelFetch`, and glow, flash and fade are passed to the fragment shader as varyings.
- The whole stone is **one draw call**.

### 4.4 Material (`shaders/obsidian.ts`, `createObsidian({variant: 'solid' | 'reflection' | 'instanced', clip?})`)
- MeshPhysicalMaterial. Runtime changes go through uniforms only; defines are fixed at creation. `customProgramCacheKey` is set per variant.
- **Facets:**

  | Property | Value |
  |---|---|
  | color | #07080C |
  | metalness | 0 |
  | roughness | 0.085 |
  | ior | 1.49 |
  | specularIntensity | 1 |
  | clearcoat | 0.40 |
  | clearcoatRoughness | 0.018 |
  | envMapIntensity | 1.30 |
  | iridescence, sheen, transmission | 0 |
  | maps | none |
  | side | FrontSide |

- **Bevel** (`aKind` 1): roughness 0.035, overridden at `<roughnessmap_fragment>`.
- **Flow banding:** add `(valueNoise(vObj*vec3(.8,.8,6.)) − .5)·0.03` to roughness. It must be visible only as a wobble inside strip reflections, never as a texture. There is a kill switch.
- **Cut faces** (`aKind` 2):
  - color #06050C, roughness 0.16, clearcoat forced to 0 after `lights_physical_fragment`.
  - Conchoidal ripple: normal += 0.05·cos(36·|p − aRipO|) along the radial direction in the face plane. It reads only at specular angles.
  - Emissive: `uIndigoLin·glow·(0.15 + 0.85·smoothstep(.55, 1, |p − aFaceC|/aFaceR))·(1 + .15·ripple) + uIndigoLin·flash·0.6`.
- **Mark seams:** only `aCrack == 2` edges glow on outer faces.
  - Edge distance in pixels: dPx = aBaryₖ / fwidth(aBaryₖ). vein = 1 − smoothstep(0.6, 1.8, dPx).
  - Intensity: `uSeam·(0.35 + pulse)`, where the pulse is a travelling Gaussian with exp(−|aObj − uPulsePos|²/0.0036).
  - **Voronoi edges (type 1) never glow on the outside.** They show only as physical gaps.
- **Thread:**
  - `head = (aKind == 1)·[aRidge == uThreadRidge]·exp(−((aRidgeT − uThreadHead)/0.035)²)`
  - tail = 0.25 over the 0.22 behind the head
  - emissive += uIndigoLin·(3.0·head + tail)
- **Emissive clamp:** every indigo emissive is limited so its maximum channel is at most 0.9 (hue survives tone mapping). Constants: uIndigoLin = (0.1047, 0.0466, 0.8720). The brightest core colour used anywhere is #6B4BFF.
- **Fog as alpha** (end of the fragment shader):
  - `f = max(smoothstep(uFogNear, uFogFar, viewDepth), fade)`
  - `gl_FragColor = vec4(rgb·(1 − f), 1 − f)`, written premultiplied in the **opaque** pipeline.
  - The browser compositor blends the canvas over the real DOM. Fogged objects melt into whatever is behind them (paper, gradient or back-layer type) with no paper-coloured ghosts and no transparency sorting.
- **Reflection variant:**
  - `alpha = 0.16·(1 − smoothstep(0, 1.1, FLOOR_Y − worldY))·uReflect`, rgb × 0.85.
  - transparent, depthWrite false, renderOrder −1, mirrored about FLOOR_Y, winding flipped.
  - Floating fragments therefore reflect faintly without any extra logic.

### 4.5 Light
- **Environment:** `<Environment frames={1} resolution={256} background={false}>` with env background #0B0B0F. A dark studio keeps the faces black. Lightformers, all rects looking at the origin:

  | Lightformer | Size | Position | Intensity | Colour |
  |---|---|---|---|---|
  | key strip | 0.16 × 9 | (−3.2, 1.2, 3.4) | 9 | white |
  | rim strip | 0.12 × 8 | (3.6, 0.6, −2.6) | 7 | white |
  | top bar | 7 × 0.14 | (0, 5.5, 1) | 4 | white |
  | horizon line | 14 × 0.08 | (0, −0.4, 6) | 2.5 | white |
  | top soft panel | 6 × 6, facing down | (0, 8, 0) | 0.6 | #EFEEE9 |
  | floor bounce | 14 × 14, facing up | (0, −6, 0) | 0.5 | #F6F5F2 |
  | indigo kicker | 0.2 × 5 | (−4, −1.5, −3.5) | 2.2 | #5B3DF0 |

- **Cursor light:** one RectAreaLight, 0.14 × 7, intensity 8, white (`RectAreaLightUniformsLib.init()`).
  - Position: active home + (x_c, 0.8, 6.5), relative to the camera's azimuth frame, aimed at the stone centre.
  - x_c = lerp(−4.5, 4.5, pointer.nx), damped with λ = 3.5.
  - With no pointer (touch, idle) it sweeps: 3.5·sin(2πt/18s).
  - There are no other lights and no shadow maps.
- **Renderer:**
  - `NeutralToneMapping`, exposure 1.0, sRGB output
  - `alpha: true`, `premultipliedAlpha: true`, `antialias: true`
  - `localClippingEnabled: true`
  - **No EffectComposer**

### 4.6 Around the stone
- **GroundFx:** a quad just above the floor under the stone.
  - Ink radial core, r 0.16 at alpha 0.18, plus a broad 1.2 × 0.45 ellipse at alpha 0.07.
  - An indigo spill ellipse (alpha ≤ 0.10, normal blending) only while the cut faces glow.
- **Ground mist:** 2 billboards (front z +0.9 and back −0.9 relative to the stone), 3.2 × 0.6, hugging the floor.
  - 3-octave fbm at 0.9/unit, drifting +x at 0.015 u/s, paper colour.
  - Alpha at most 0.10 front and 0.14 back.
  - Hard screen-space cutoff `uMistClipY` = POTENTIAL baseline + 0.01H: **no semi-transparent canvas pixel ever sits over indigo type.**
- **Flakes:** 48 instances of a rounded 6-point chip, scale 0.03–0.12, instanced obsidian. They exist only from S 1.95 to 11.5 and never in the pristine hero.

### 4.7 Idle and pointer (hero)
- Yaw = 20° + 18°·sin(2πt/38s) + 4°·pointer.nx (critically damped spring, ω = 4.5).
- Pitch = 0.8°·sin(2πt/51s) + 2°·pointer.ny.
- Bob ±0.004 units (9s).
- Principal-point parallax ±0.004W.
- The back-layer `<h1>` counter-parallaxes ±4px: a transform on the h1 element, never on the section.
- Hovering the stone (raycast only when the pointer moves; the canvas stays `pointer-events: none`) fires a thread (3s cooldown) and ramps the cursor light from 8 to 12 over 400ms.
- **No drag.**

## 5. Chapters

Every chapter has one 3D move, one display line and one small copy block. Reveals are data-state driven (`before | active | after`, written on change): lines rise through masks on `active` and exit quietly (translateY −30%, opacity 0, 450ms, no stagger) on `after` or `before`. They are reversible on scroll-up. No word-by-word opacity scrubs.

### 00 · Potential (hero), S 0–1
- **Copy.**
  - Eyebrow: as in section 2.
  - H1: sr-only text "Maximise your digital potential", shown as "Maximise / your digital / POTENTIAL".
  - Description: "We engineer the websites and platforms companies run on — and the AI that works inside them."
  - Pills: "Hear the story" (Lenis to S 1.10 over 2.4s, easeInOutCubic) and "Start a project ↗" (to S 13.25).
  - Specimen card: "Nº 00 — Specimen" with a live "AZ 020.0°" (aria-hidden) / Instrument Serif italic 22px "Obsidian" / 13px "Volcanic glass, cooled too fast to crystallise." / mono "SCROLL TO OPEN ↓" beside a 24px hairline with a travelling indigo dot (2.4s loop).
- **Layout.** A normal-flow 100svh section with `.back` (z1) and `.front` (z4). The hero DOM scrolls away natively while the stone stays fixed, so POTENTIAL slides up behind it.
- **3D.** Whole stone. From S 0 to 1: camera distance ×1.00 → ×0.97, and the idle yaw blends out between S 0.2 and 0.8.

### 01 · The cut (thesis), S 1–3
- **Copy.**
  - Eyebrow: "(01) The cut".
  - Statement: "Everything we make starts as *one piece.* We open it up, put it in order, and teach it to think." "one piece." is set in Instrument Serif italic in indigo.
  - Body: "Nerodyn is one studio for two disciplines: the digital infrastructure a company runs on, and the AI that runs through it — designed, engineered and maintained by the same team."
  - Mono caption, bottom right: "One stone · three cuts · 24 fragments".
- **Layout.** The front sticky layer holds everything.
  - Statement: Instrument Sans (wght 450) at min(4.4vw, 7vh), line-height 1.04, tracking −0.03em, from x = G to 0.86W, y 0.26–0.62H, 4 lines, ragged right.
  - Body: x = G, 0.80–0.92H, 38ch.
  - **Inversion:** an aria-hidden, `user-select: none` duplicate of the statement in paper #F6F5F2 (the indigo word too) is overlaid exactly. Its `clip-path: polygon()` is the 2D convex hull (monotone chain) of the stone's 10 projected defining points, written every frame by the bridge.
  - Letters flip ink → paper exactly where the black stone passes behind them. No blend modes are used.
  - The statement rises at S 0.6 and exits at S 1.85.
- **3D (global S).**
  - 1.00–1.70 traverse: the camera pivot moves so the stone crosses from 0.62W to 0.36W under the statement, while the stone's yaw is scrubbed from 20° to 200° (easeInOutSine).
  - 1.70–1.82: the mark seams light, uSeam 0 → 1. A seam pulse runs around the girdle and down the vertical seam (time-based, 1100ms, fired on crossing and re-armed on reversal).
  - 1.82–2.00: the gap opens from 0 to 0.004, as a push along each fragment's d. uCutGlow goes 0 → 0.4. The Voronoi seams appear only as dark hairline gaps with slivers of lit cut face.
  - The crack origin is the girdle corner nearest the camera at S 1.70, precomputed.

### 02 · The order (digital infrastructure), S 3–5.6
- **Copy.**
  - Eyebrow: "(02) Digital infrastructure".
  - H2: "Built in layers," / *"engineered to hold."*
  - Body: "Websites and web platforms designed as systems, not pages — fast, secure, and ready for whatever you ask of them next."
  - Layers, top to bottom:
    - "04 Interface — Brand-grade front ends. Motion, 3D and accessibility built in from day one."
    - "03 Platform — Headless CMS, commerce, customer portals and the integrations between them."
    - "02 Data — Structured content, analytics and clean pipelines you can trust."
    - "01 Foundation — Hosting, performance, security and uptime. The part nobody sees."
  - Link: "Discuss a platform →".
- **Layout.** Front column from G to 0.40W:
  - Eyebrow 0.16H; H2 0.20–0.36H; body 0.39–0.47H at 17px/1.55, max 38ch.
  - Layer list 0.54–0.86H: 4 rows of 0.08H each. A mono numeral, the name in Instrument Sans 500 22px, and a 15px line. The focused row is ink; the others are at 40%.
  - **Leader lines** (fixed SVG, pixel coordinates): from each row's right end (0.405W) to the projected left anchor of its tier, ending in a 4px dot. Ink at 30%; the focused row is indigo.
  - **Back layer:** a 12-column hairline grid (11 lines, rgba(10,11,16,.06)) draws in scaleY 0 → 1 with a 35ms stagger at S 3.0 and retracts at S 4.6. This is the only grid on the site.
- **3D.**
  - 2.00–3.00 **explode (F1):**
    - target = centroid + d·(1.0 + 1.5·rand), with a rotation of at most 12° about a seeded axis.
    - The primary pieces part first: crown +Y 0.6, blades ±X 0.5.
    - Stagger 0–0.30 by distance from the crack origin.
    - Quadratic Bézier arcs, with the control point pushed along d by 0.6 × the displacement.
    - The flakes shed from the gaps.
  - 3.00–3.40 **tiers (F2):**
    - tier y = −1.45 + 0.95·tier (tier 0 at the bottom); lattice x ∈ {−0.72, 0, 0.72}, z ∈ {−0.31, 0.31}
    - rotation takes c → +Y, then a yaw aligns the long axis to X; scale (1.1, 0.55, 1.1), so the fragments read as black glass floor plates with indigo tops
    - tier delays 0 / 0.08 / 0.16 / 0.24; flakes settle into a sediment ring
  - 3.40–4.35: focus cycles from bottom to top, 0.2375 S per tier. The focused tier glows at 1.0 (others 0.25) and slides +0.15 along X like a drawer.
  - 4.35–4.60: all tiers glow at 0.5.

### 03 · The current (AI automation), S 5.6–8.2
- **Copy.**
  - Eyebrow: "(03) AI automation".
  - H2: "Intelligence," / *"woven in."*
  - Intro: "Not a chatbot in the corner. AI built into the way your product and your team already work."
  - **A, "In your product":** "Assistants, search and support that understand your customers — part of the site, not bolted on." Items: Conversational support · Semantic search · Personalised journeys.
  - **B, "In your workspace":** "Agents that take repetitive work off your team's plate, connected to the tools you already use." Items: Inbox & document triage · Internal knowledge assistants · Cross-tool workflow automation.
  - Anchored mono labels: "PRODUCT" and "WORKSPACE".
- **Layout.** **Mirrored.** The copy column runs from 0.60W to W − G − 40px, with the same type scale as 02. A and B share the slot 0.52–0.84H and crossfade at S 6.55 (outgoing −12px and fade over 300ms; incoming +24px). The graph occupies 0.05–0.57W; nodes never pass under the copy.
- **3D.**
  - 4.60–5.60 release: the tiers release top-down into **F3**:
    - two Poisson-disk clusters: P at (−1.3, 0, 0) with 11 nodes and W at (1.3, 0, 0) with 10, inside ellipsoids (1.0, 0.8, 0.8)
    - 3 bridge nodes near x = 0
    - fragment scale 1.25, cut faces pointing outward, each tumbling at 4°/s
  - 5.60–5.90: about 40 k-NN (k = 3) edges grow from their source nodes. They are drawn as **one** instanced screen-space ribbon draw: 1.0px, ink at 8%, depth-tested.
  - **Walkers:**
    - at most 10, spawning at 2/s, moving at 1.6 u/s
    - drawn by the same ribbon shader as a 2.2px #5B3DF0 core with a head of 0.10 × edge length and a 0.25 fading tail that stains the edge indigo as it passes
    - normal blending, never additive
    - on arrival: flash = 1 (τ 450ms, lights the cut face and seams), 20% fork chance, death after 6–9 hops
  - Beat A (5.90–6.55): walkers enter cluster P and head toward the bridge.
  - Beat B (6.55–7.20): loops inside cluster W.
  - Flakes act as tiny unlinked nodes.

### 04 · The field (work, by sector), S 8.2–10.4 (list flows natively; not sticky)
- **Copy.**
  - Eyebrow: "(04) Selected engagements".
  - H2: "Work," / *"by sector."*
  - Note (13px, muted): "Full case studies are in preparation — references on request."
  - Rows (Nº, sector, scope, disciplines, chip "In preparation"):
    - "01 Hospitality — Direct-booking platform with a guest concierge assistant — Infrastructure · AI"
    - "02 Healthcare — Patient portal with automated intake and triage — Infrastructure · AI"
    - "03 Logistics — Operations dashboard with document-processing agents — AI"
    - "04 Professional services — Brand platform with an internal knowledge assistant — Infrastructure · AI"
  - **Launch flag:** replace these rows with real engagements or delete the section.
- **Layout.**
  - Header at the top (20vh padding).
  - 4 row blocks, each 42vh tall, with content in their top 0.16H and a hairline top border.
  - Sector in Instrument Sans 500, min(3.2vw, 5.2vh). Scope in 16px. Chips in Geist Mono 10.5px.
  - The column runs from G to 0.58W; the right 42% is the 3D window.
- **3D.**
  - 7.20–8.20 **stream (F4):**
    - edges and walkers fade out (7.20–7.40)
    - the fragments fly ahead along −Z into a compact exploded cluster at HOME_B (centroid + d·0.45, assembly yaw 45°), with a stagger of 0–0.4 and lateral arcs
    - they lead the camera into the mist
    - fog: near 60 → 6, far 90 → 26
  - **Field:**
    - 72 standing obsidian shards in 3 `makeShard` variants: 4-sided tall, 5-sided irregular, low-crown gem (30/24/18 instances)
    - 3 instanced draws plus 3 mirrored reflection draws
    - Poisson-disk placement at x ∈ ±[1.8, 10], z ∈ [−8, −42], leaving a clear aisle at |x| < 1.8 and nothing within 8 units of HOME_B
    - heights 0.8–5.0 (log-normal), tilt at most 14°, with 15–35% of the pavilion buried below the floor (clipping plane above; the reflection copy is clipped below)
    - **Rise:** rise = easeOutExpo(smoothstep(16, 7, camZ − zᵢ)), y offset = −(hᵢ + 0.3)·(1 − rise). Stones and their reflections emerge as if from still water.
    - 4 **station** stones (height 4.2) at (2.4, ·, −14), (3.0, ·, −22), (2.4, ·, −30), (3.0, ·, −38).
    - The field is visible only from S 7.2 to 11.0.

### 05 · The reforming (method), S 10.4–12.6
- **Copy.**
  - Eyebrow: "(05) Method".
  - H2: "From first cut" / *"to finished form."*
  - Steps:
    - "01 Discover — We map the business, the people and the systems before we design anything."
    - "02 Architect — Structure, stack and data model, decided deliberately and documented plainly."
    - "03 Build — Design and engineering as one team, shipped in increments you can use."
    - "04 Automate — AI layered in where it removes real work — and we stay on to run it."
- **Layout.** Front column from G to 0.42W.
  - H2 0.16–0.32H.
  - Steps 0.42–0.86H. The numeral is Instrument Sans (wdth 75, wght 700) at min(5.5vw, 9vh). Inactive numerals are an ink outline (0.016em); the active one wipes to solid indigo (clip, 500ms).
  - Titles 22px, bodies 15px. Inactive steps at 35%.
  - A 1px vertical hairline on the column's left edge fills indigo with local s.
- **3D.**
  - 10.10–10.60: arrival at HOME_B.
  - 10.60–11.50: groups G1 to G4 (from the culet up; G4 is the band plus the crown) each spring home over 0.225 S. As each group seats, its seams flash (time-based 700ms, re-armed on reversal), then heal: veins → 0 and cut glow → 0. The flakes fly to the nearest seating fragment and scale to 0.
  - 11.50–11.60: whole and pristine.
  - Fog stays near 10, far 34, so the field is a misty backdrop.

### 06 · The mark (contact and footer), S 12.6–13.8
- **Copy.**
  - Eyebrow: "(06) Start a project".
  - Back-layer display:
    - L1 "Let's build": Instrument Sans (wght 600) at the h1 size, cap top 0.16H, ending at or before 0.50W.
    - L2 *"what's next."*: Instrument Serif italic, solid indigo, min(13vw, 21vh), x = 0.10W, baseline 0.56H. The blades pass over "next".
  - Body: "Tell us what you're building, or what's slowing you down. We'll reply personally."
  - A "Start a project →" indigo pill (56px) and the email "hello@nerodyn.com" (placeholder; the client must confirm) in Instrument Serif italic at min(3.2vw, 5vh), with a drawn underline and click-to-copy.
  - Footer: NERODYN wordmark · "Digital infrastructure & AI automation" · email · LinkedIn and Instagram (placeholders) · "© 2026 Nerodyn · Cut, not cast." · "Back to the stone ↑".
- **Layout.**
  - Front: body at 0.59H, CTA and email row at 0.65H. Everything must end at or before 0.71H.
  - The footer lives **inside** the front sticky layer. It rises translateY(100%) → 0 over s 0.95–1.20 into the bottom 0.28H: 4 columns on the 12-column grid, a hairline top border, mono 11px headings, 15px links.
- **3D (local s).**
  - Throughout 11.60–12.60 the stone yaw locks by spring to 90° or 270° (whichever is nearer), so the x = 0 seam faces the camera.
  - s 0–0.20: camera elevation 20° → 26°, fov 30 → 24. The framing fits the **whole stone** (so the crown never enters the nav band).
  - s 0.20: an indigo line draws around the band's top edge (time-based 900ms).
  - s 0.22–0.36: **the last cut.** The crown fragments lift +0.10 as one and their `fade` goes 0 → 1, so they melt into the paper through the alpha fog. Assert: the crown's projected box never overlaps a back-layer glyph box.
  - s 0.36–0.55: elevation → 32.91°. **Dolly-zoom** fov 24 → 16, with distance re-solved every frame so that height holds, flattening the view toward the logo's parallel projection. The framing retargets to the mark height 0.56H.
  - s 0.50–0.62: the band plate lifts MARK_LIFT and the blades move ±MARK_SPLIT. At the 0.52 crossing, light runs from the culet up the vertical gap and around the band gap (1200ms). A standing glow of 0.35 stays on the primary cut faces, so the logo's white gaps become **lines of indigo light**.
  - s 0.60: the contact copy rises.
  - s 0.90–1.20, **bookend:**
    - the stage clip contracts, scrubbed, to `inset(9% 4% 30% 46% round 28px)`
    - the tint and the frame's hairline return
    - the mark recentres in the card at 0.40H tall
  - Pointer tilt is limited to ±1.5° so the lock breathes but never breaks. Email hover doubles the gaps (spring, 500ms).
  - "Back to the stone ↑": Lenis `scrollTo(0)`, 2.6s, easeInOutCubic. Every state is a function of S, so the whole film rewinds.

## 6. Camera keyframes (world coordinates; orbit rig)

The rig: `pos = pivot + D·(sin az·cos el, sin el, cos az·cos el)`, look at the pivot. The principal point pp = (sx, sy) is applied with `setViewOffset(W, H, (0.5 − sx)·W, (0.5 − sy)·H, W, H)`, never by aiming off-centre. D is solved by `layout.fit(heightFraction, fov)`; the values below are for 16:10.
- Between keys: azimuth takes the stated direction; D lerps in log space; fov and pp lerp with the segment ease.
- A critically damped spring (ω = 5.5) sits on top, for inertia on fast scroll.

| Key | S | Pivot | az | el | D | fov | pp | ≈ Position |
|---|---|---|---|---|---|---|---|---|
| K0-intro | t = 0 | (0, −0.464, 0) | 0 | 4° | 9.28 | 30 | (.68, .51) | (0, 0.18, 9.26) |
| K0 | 0.0 | (0, −0.464, 0) | 0 | 4° | 7.25 | 30 | (.62, .50) | (0, 0.04, 7.23) |
| K0x | 1.0 | same | 0 | 4° | 7.03 | 30 | (.62, .50) | (0, 0.03, 7.01) |
| K1 | 1.70 | (1.80, −0.464, 0) | −12° | 8° | 8.0 | 30 | (.62, .50) | (0.15, 0.65, 7.75) |
| K2a | 3.40 | (0, −0.10, 0) | 24° | 13° | 11.0 | 28 | (.66, .52) | (4.36, 2.37, 9.79) |
| K2b | 4.60 | same | 40° | 22° | 11.0 | 28 | (.66, .52 ± .05 crane) | (6.56, 4.02, 7.81) |
| K3a | 5.90 | (0, 0, 0) | −70° (swing −110°) | 7° | 10.7 | 30 | (.31, .50) | (−9.98, 1.30, 3.63) |
| K3b | 7.20 | same | 0° | 7° | 10.7 | 30 | (.31, .50) | (0, 1.30, 10.62) |
| K4 path | 8.2–10.1 | position-driven | — | — | — | 34 | (.70, .48) | z 4.0 → −41, y 1.30 → 0.40, x = 0.25·sin(0.18z); target = pos + (0.8, −0.30, −10) |
| K5a | 10.60 | (0, −0.464, −52) | 10° | 9° | 7.7 | 30 | (.66, .52) | (1.32, 0.74, −44.51) |
| K5b | 11.60 | same | 90° | 15° | 7.3 | 30 | (.66, .52) | (7.05, 1.43, −52) |
| K6a | 12.60 | same | 90° | 20° | fit whole 0.62H | 30 | (.66, .50) | (6.86, 2.03, −52) |
| K6b | 13.15 (s .55) | (0, −0.741, −52) | 90° | 32.91° | 12.79 | 16 | (.66, .46) | (10.74, 6.21, −52) |
| K6c | 13.80 | same | 90° | 32.91° | 17.9 | 16 | (.71, .395) | (15.03, 8.99, −52) |

**Corridor sync.** For each row, the bridge measures `rowS_i`, the S at which the row's centre crosses the viewport centre. The camera z is keyed to station_z + 7 at `rowS_i`, piecewise-linear between rows. The active row's station stone glints.

**Formation space.** Stone-relative formations (F0, F1, F5, F6) compose `T(home)·R_y(stoneYaw)·f`. Layout formations (F2, F3, F4) compose `T(home)·f`. Blends lerp position and slerp rotation between the two world results.

## 7. Persistent chrome

- **Nav** (fixed, z50, 76px; 60px on mobile; no background):
  - Left: the 3-piece mark SVG (22px; separate paths so the pieces can move) and "Nerodyn" in Instrument Sans 600 17px, tracking −0.02em.
  - Right, ending at W − G: Infrastructure · Intelligence · Work · Method (Instrument Sans 500 13px, ink at 72%, 34px gap), then a 40px ghost pill "Start a project".
  - When the finale seams light, the nav mark's pieces part 1px and fill indigo for 600ms (60ms apart).
- **Chapter index** (fixed right 22px, centred on 0.42H, z30):
  - 7 rows, 22px apart: a Geist Mono 10.5px numeral and a 16px hairline tick.
  - The active row's tick grows to 32px and fills indigo with local progress; its label reveals leftward (clip, 300ms).
  - Hover reveals a label. Click runs Lenis `scrollTo` to the jump target, duration clamp(1.2, 0.35·|ΔS|, 2.8)s, easeInOutQuart.
- **Specimen card** (fixed bottom-right, z30, ≥1100px wide only):
  - Surface: rgba(246,245,242,.72), backdrop blur 14px, a 1px hairline at ink 8%, radius 14px, padding 16px 18px.
  - Rows: "Nº 0X — name", a one-line caption, and a live mono readout "AZ 040.0° · EL 22.0°" (real camera data).
  - Captions by chapter:
    - Obsidian / "Volcanic glass, cooled too fast to crystallise."
    - The cut / "Three planes, taken from the mark itself."
    - Order / "Twenty-four fragments, four floors."
    - Current / "Signal passes shard to shard."
    - The field / "Seventy-two standing stones. None is decoration."
    - Reforming / "Seated from the point up."
    - The mark / "From one angle only, the stone is the mark."
  - Content changes with a 500ms mask roll. The card is hidden while the footer is in.
- **Stage clip:** CSS custom properties registered with `@property` (`--ci-t/r/b/l`, `--ci-rad`) drive the clip-path on `#stage` and `#field-card` and the geometry of `#stage-frame`. The style is **removed** outside the intro and the bookend.
- **Field:** `#field` is fixed at z0: #F6F5F2, a radial lift (#FBFAF8, a 38vw × 48vh ellipse at `--stone-x`/`--stone-y`, written each frame), and a 2% corner vignette. Alpha fog makes this safe.
- **Grain:** z60, opacity 0.03, overlay blend.
- **Cursor:** native; `cursor: grab` never appears (there is no drag).
- **Focus:** a 2px indigo ring with 3px offset. Selection is an indigo background with white text.

## 8. Typography and colour

- **Fonts** (next/font/google, self-hosted):
  - **Instrument Sans**, variable (wght 400–700, `axes:['wdth']` 75–100), for display, body and UI.
  - **Instrument Serif**, 400 and italic.
  - **Geist Mono**, for labels.
  - Variables `--font-isans`, `--font-iserif`, `--font-gmono` map to the @theme tokens `--font-display`/`--font-sans`, `--font-serif` and `--font-mono`. A variable is never named the same as a token (gotcha #2).
  - Space Grotesk is retired. The real brand font is still owed by the client.

| Token | Face | Size | LH | Tracking |
|---|---|---|---|---|
| h1-sans | Sans wdth 100 / 600 | min(8.2vw, 13.1vh) | 0.90 | −0.045em |
| h1-serif | Serif italic | 1.06 × h1 | 0.90 | −0.015em |
| pot | Sans wdth 75 / 700 caps | fitted; cap ≤ 0.21H | 0.80 | −0.01em |
| finale-serif | Serif italic, indigo | min(13vw, 21vh) | 0.90 | −0.02em |
| statement | Sans 450 | min(4.4vw, 7vh) | 1.04 | −0.03em (serif words ×1.08) |
| h2 line 1 / 2 | Sans 500 / Serif italic ×1.08 | min(4.6vw, 7.4vh) | 0.95 | −0.04em / −0.015em |
| numeral | Sans wdth 75 / 700 | min(5.5vw, 9vh) | 0.90 | −0.02em |
| sector | Sans 500 | min(3.2vw, 5.2vh) | 1.0 | −0.03em |
| body-l / body / small | Sans 400 | 17 / 15 / 13px | 1.55 / 1.55 / 1.45 | −0.005em, max 38ch |
| ui | Sans 500 | 13px | — | 0.01em |
| mono | Geist Mono caps | 10.5–11px | — | 0.12em, tabular |

- **Three-texture rule:** each display moment is solid sans ink, serif italic, and exactly one indigo element (a fill or an outline state). One weight across all lines is never used.
- **Colours:**
  - paper #F6F5F2, paper-2 #ECEAE5
  - ink #0A0B10; muted = ink at 62–70% alpha, never a grey hue
  - hairlines: ink at 6–12%
  - **indigo #5B3DF0**; pill gradient `120deg, #6B4BFF → #5B3DF0 55% → #4B2FDB`
  - #8B76FF is retired. Nothing indigo is ever lighter than #6B4BFF.
- **Indigo type** is always 100% opacity and revealed by clip or mask only. It never sits under a blend mode, a filter, or a semi-transparent canvas pixel.

## 9. Micro-interactions

1. **Nav hover-swap:** port the existing, liked implementation unchanged (the label rolls up and its indigo twin rolls in).
2. **"Hear the story" pill:** existing shine sweep (a 120° white band at 35%, 850ms). The arrow slides out right while a clone slides in (300ms). Press scale 0.98.
3. **Ghost pills:** existing ink fill, now grown as a circle clip from the pointer's entry point (450ms, expo-out). Text turns paper. The fill retracts toward the exit point.
4. **The cursor is the light:** a thin highlight slides across every obsidian facet on the page.
5. **Stone hover:** fires a thread down a ridge (3s cooldown). When the thread crosses POTENTIAL, one 900ms sheen (a white band at 22%) sweeps across the word from the stone outward. It fires on hover only.
6. **Leader lines** (ch02): the focused row turns indigo. Hovering a row focuses its tier at any scroll position.
7. **Constellation:** hovering a node (raycast against bounding spheres, throttled to 250ms) fires a walker from it.
8. **Work rows:** an indigo underline draws (scaleX, 420ms), the sector shifts +12px, and the matching station stone glints.
9. **Method:** the numeral wipes from outline to solid, and the seams flash as each group seats.
10. **Email:** the underline draws from the left (300ms) and retracts to the right. The mark's gaps breathe. Click copies, and the label rolls to "Copied" (mono) for 1.6s.
11. **Index:** hover reveals the label; click flies the camera there.
12. **Back to the stone:** the full rewind.

**Not done:** magnetic buttons, custom cursors, text scramble, tilt cards, particle backgrounds, drag-to-rotate, snapping.

## 10. Architecture

**Layers** (root stacking context, bottom to top):

| z | Layer |
|---|---|
| 0 | `#field`, `#field-card` |
| 1 | section `.back` |
| 2 | `#stage` (fixed canvas, `pointer-events: none`, aria-hidden) |
| 3 | `#stage-frame` |
| 4 | section `.front` |
| 5 | `#leaders` (SVG) |
| 30 | index and specimen card |
| 50 | nav |
| 60 | grain |

- Each chapter `<section>` is `position: relative; display: grid` and carries **no** z-index, transform, opacity, filter, will-change, isolation or contain.
- `.back` and `.front` are **sibling** `position: sticky; top: 0; height: 100svh` elements in `grid-area: 1/1`. The front layer is `pointer-events: none` with interactive children set to `auto`.
- No ScrollTrigger pin.

**One loop.** `gsap.ticker.add(t => { lenis.raf(t*1000); scroll.update(); advance(t*1000) })`, `lagSmoothing(0)`, and `<Canvas frameloop="never">`. DOM, scroll and 3D share one frame, so occlusion, inversion clips and leader lines never lag. Lenis settings: lerp 0.085, wheelMultiplier 0.9, smoothWheel on, syncTouch off.

**Stores** (plain mutable singletons, never React state per frame):

```ts
scroll  = { y, S, v, vw, vh, chapters: { id, top, height, s, state }[] }
pointer = { x, y, nx, ny, has, moved }
ui      = { focusTier: -1, focusRow: -1, hoverNode: -1, hoverEmail: false, hoverStone: false }
intro   = { state: 'wait' | 'run' | 'done', t0 }
bus     // discrete events: 'intro:run', 'thread:potential', 'chapter', 'seat', 'mark:lock'
SceneState = choreo.evaluate(S, t, layout)   // cam {pivot, az, el, dist, fov, pp, roll};
                                             // formation {a, b, mix, staggerSeed};
                                             // stoneYaw; uniforms {seam, gap, cutGlow, fogNear, fogFar, reflect, mistClipY};
                                             // graph {grow, beat}; fieldVisible; stage clip insets
```

`scroll.update()` also writes `--s` and data-state on every section, so all DOM scrubs are CSS `calc()`. `useSyncExternalStore` is used only for the active chapter.

**Files and owners** (5 parallel engineers; the contracts are merged first, on day 1):

| Owner | Files |
|---|---|
| E1 Geometry | `lib/geo/{hull, roundedHull, crystal, fracture, shards, mark}.ts`, `scripts/{fracture-check, mark-fit}.mjs` |
| E2 Look | `shaders/{obsidian, ribbon-material hooks, haze, ground}.ts`, `components/stage/{StudioEnv, CursorLight, Stone, StoneReflection, GroundFx, Mist, Flakes}.tsx`, renderer config, material verification |
| E3 Motion | `lib/{choreo, formations, springs, rng}.ts`, `components/stage/{Director, CameraRig, Graph, Field}.tsx` |
| E4 Page | `app/layout.tsx` (fonts), `app/globals.css` (tokens, intro keyframes), `components/chapters/*` (Hero, Cut, Order, Current, Work, Method, Mark with Footer), `components/chrome/{Nav, ChapterIndex, SpecimenCard, StageClip, LeaderLines, Grain, MobileMenu}` |
| E5 Platform | `lib/{chapters, scroll, layout, bus, project}.ts`, `components/experience/Experience.tsx` (intro gate, next/dynamic `ssr:false` inside a client component), `components/stage/StageCanvas.tsx`, dev tools, PerformanceMonitor tiers, static export and basePath, cleanup |

- `lib/layout.ts` replaces `heroLayout.ts` as **the only** place hero or chapter geometry exists. It holds: the fit solver, principal points, the POTENTIAL fit and occlusion solve, the L2 indent, CSS vars (`--g`, `--stone-x/y`, `--pot-size`, `--nav-h`), safe rects and the portrait branch.
- `lib/project.ts` is the DOM↔3D bridge. Once per frame, after the camera, it writes: the inversion hull clip, the POTENTIAL fill origin, leader-line endpoints, label anchors, `rowS` measurement, `--stone-x/y`, and the specimen readout.
- **Dev tools:**
  - `?at=order:0.6` jumps Lenis to that state.
  - `&freeze=1` stops time for deterministic screenshots.
  - `?overlay=mark` superimposes new-logo.svg at 30% over the finale.
  - `?debug=safe` draws safe rects and glyph boxes and shows the `renderer.info` draw calls.
- **Cleanup:**
  - Delete `components/hero/*`, `shaders/liquid.ts`, `lib/headlineMask.ts`, `lib/heroLayout.ts`, `public/heart.glb`, `public/rock.jpg`, `scripts/compose.mjs`, `scripts/strip-glb.mjs`.
  - The untracked prior-pass files (`app/lab/`, `components/stage/Stage.tsx` and `Studio.tsx`, `components/ui/`, `lib/{crystal, obsidian, stage, reveal}.ts`) are **not** authoritative. Mine them for code, then replace or delete them. `components/ui/Scramble.tsx` is banned.
  - Update CLAUDE.md with this direction once M1 lands.

## 11. Performance budget (60fps, AMD Radeon iGPU at 1920×1080)

- **Draw calls by chapter:**

  | Chapter | Draws |
  |---|---|
  | 00–01 | 5: stone, reflection, ground, 2 mist planes |
  | 02 | 4 |
  | 03 | 5 (adds the graph) |
  | 04 | 9: fragments, reflection, flakes, 3 field, 3 field reflections |
  | 05–06 | 5 |

  Dev assert: at most 16.
- **Triangles:** stone ≤ 2.5k (×2 with the reflection); field ≈ 300 × 72 ×2 ≈ 44k; flakes about 1.4k. Under 60k in total.
- **Shading:** one physical material with clearcoat and one RectAreaLight. The stone covers ≤ 20% of pixels; the field peak is about 35%. Target GPU time ≤ 10ms.
- **Excluded:** no post-processing, no shadow maps, no transmission, no reflector passes.
- **DPR and tiers:** start at min(dpr, 1.5). drei `PerformanceMonitor` (bounds 50–58) steps through 1.75 / 1.5 / 1.25 / 1.0. On decline, in order:
  1. RectAreaLight → sweep of `scene.environmentRotation`
  2. reflections off
  3. mist off
  4. field 72 → 40, flakes 48 → 24
- **CPU:** under 2ms per frame, zero allocations, `fragTex` uploads 192 texels per frame, and no React updates in the loop.
- **Boot:** geometry and fracture build in under 15ms. The env cubemap is baked once. `compileAsync` runs with every group visible, so there is no mid-scroll shader hitch.
- **DOM:** clip-path only during the intro and bookend. backdrop-filter only on the specimen card and the mobile menu. Scrubs animate transform, opacity and clip-path only. 3 font families, latin subset, display face preloaded. Rendering pauses while the tab is hidden.

## 12. Reduced motion, mobile, no-WebGL

- **Reduced motion:**
  - no Lenis (native scroll); no intro clip or dolly (everything fades in over 300ms)
  - POTENTIAL is filled from the start
  - no idle loops, threads, walkers, Ken Burns or flights
  - `choreo` evaluates each chapter's rest keyframe only, with changes made by a 400ms canvas opacity dip
- **Mobile (≤767px portrait; tablet 768–1099px uses stone 0.70H at 0.64W and type ×0.9):**
  - Nav 60px with a "Menu" button, which opens a full-screen paper sheet of links in Instrument Sans at 10vw that rise through masks.
  - **Hero:** eyebrow 0.10H; L1 at 15vw, top 0.13H; L2 at 16vw, baseline 0.28H. The stone is **whole**, axis 0.64W, apex 0.31H, culet 0.71H. POTENTIAL is a single line fitted to W − 2G, cap band 0.56–0.62H, behind the pavilion. Description at 0.77H in 15px; two 44px pills side by side at 0.88H. No reflection, no mist.
  - **Chapters:** 3D in a top band (pp y 0.30, fit ×0.55) with copy from 0.52 to 0.94H. Inversion only where overlap occurs naturally. No leader lines or anchored labels. Field 36 instances, 6 walkers, DPR 1.5, env-rotation sweep instead of the cursor light.
  - The specimen card is hidden. The index becomes a mono "02/06" counter bottom-right plus a 2px indigo progress rail.
- **No WebGL:** a static hero poster (captured on the real GPU with `scripts/shot.mjs`). All DOM stays complete and readable, with POTENTIAL filled.

## 13. Verification and milestones

- **M0:** contracts merged (stores, SceneState, fragTex layout, uniform names, CHAPTERS).
- **M1:** the hero, intro and material on the **real-GPU browser**, plus a screen recording shown to the client. This is the direction gate: no further chapter polish until they react.
- **M2:** ch01–02. **M3:** ch03–04. **M4:** ch05–06, with `?overlay=mark` silhouette IoU ≥ 0.95. **M5:** mobile, reduced motion and profiling on an actual Radeon iGPU.
- **Screenshot matrix:** each chapter's rest S, with `&freeze=1`, at 1440×900, 1920×1080, 2560×1080 and 390×844.
- **Material targets:** facet L* < 12 except within 3px of edges; edge highlights 2–3px wide; indigo type sampled within ±2 of #5B3DF0 everywhere.
- **Asserts:**
  - apex ≥ nav bottom + 24px at rest
  - the stone overlaps at least one display glyph box in 00, 01 and 06
  - the occlusion rule holds
  - no semi-transparent canvas pixel over indigo type
  - the crown never overlaps a back-layer glyph while fading
  - draw calls ≤ 16
- **Ship:** `npm run build` must be green; then commit and push to `master` (AGENTS.md).

## 14. Guardrails: do not

1. Add bloom, an EffectComposer, DOF, SSAO or additive glows.
2. Give obsidian metalness > 0, iridescence, sheen, transmission or clearcoat > 0.5. Use light sources wider than 0.3.
3. Light Voronoi seams on outer faces, or use any noise-based veins; speckle and worley are banned. Only the three mark seams and the ridge thread glow on the surface.
4. Use indigo lighter than #6B4BFF, or show indigo text below 100% opacity, under blend modes or filters, or under semi-transparent canvas pixels.
5. Add an opaque in-canvas backdrop, or paper-coloured opaque fog. Fog is alpha.
6. Put transforms or stacking properties on sections, merge back and front into one sticky wrapper, or use a ScrollTrigger pin.
7. Hijack or snap scroll, enable syncTouch, or block scroll during the intro.
8. Drive the intro with a JS/GSAP timeline.
9. Centre text dead-centre, or box "headline left, prop right". Let 3D into the nav band at rest.
10. Add magnetic buttons, custom cursors, text scramble, tilt cards, particle atmospheres or drag-to-rotate.
11. Use per-frame React state, allocate in the frame loop, toggle defines at runtime, branch on `material.name`, or reuse a CanvasTexture across resizes.
12. Hardcode layout geometry outside `lib/layout.ts`.
13. Invent client names, metrics, awards or testimonials. Placeholders stay labelled "In preparation".
14. Write Next.js framework code without first reading `node_modules/next/dist/docs/`, or break the static export and basePath.
15. Revive any rejected direction: the heart, the rock texture, the liquid full-screen background, the pastel palette, the dark curtain intro, the floating small props.

**Recommendation:** build M1 first and put the hero in front of the client on a real GPU before any chapter polish. This direction is the client's own reference crystal made into their own mark. If they reject M1, stop and get a reaction to the direction; do not tune a sixth guess.

**Relevant paths:**
- `C:\Nerodyn\baybymaybe\public\new-logo.svg`: the source of the verified constants.
- `C:\Nerodyn\baybymaybe\CLAUDE.md`: needs updating after M1.
- Untracked prior-pass files to reconcile:
  - `C:\Nerodyn\baybymaybe\lib\stage.ts`
  - `C:\Nerodyn\baybymaybe\lib\crystal.ts`
  - `C:\Nerodyn\baybymaybe\lib\obsidian.ts`
  - `C:\Nerodyn\baybymaybe\lib\reveal.ts`
  - `C:\Nerodyn\baybymaybe\components\stage\`
  - `C:\Nerodyn\baybymaybe\components\ui\`
  - `C:\Nerodyn\baybymaybe\app\lab\`