@AGENTS.md

# Nerodyn — Project Brief & Working Context

> Read this in full before touching the hero. It is the accumulated, hard-won
> context from building this site with the client. Honour it.

## Who this is for

**Nerodyn** (nerodyn.com) is a premium agency selling two things:
**digital infrastructure** (websites/web platforms) and **AI automation**
(AI woven into websites *and* into internal workspaces). The client has strong,
specific visual taste, is blunt when something is bad, and judges on *feel* — not
on how clever the implementation is. They will provide any asset on request
(logo, copy, fonts, HDRIs, sound, 3D). They want to be shown working visuals and
to iterate, not to be lectured. Build → show → refine.

## The bar

The homepage must feel **award-level** — in the league of igloo.inc,
noomoagency.com, uxbert.com, aircenter.space. "Premium, mature, mysterious,
mythic, confident." Not busy, not cluttered, not "AI-generated-looking." A few
deliberate, masterful moves beat a pile of effects. If a thing is not clearly
*impressive*, it is worse than not having it — the client has said exactly this
more than once. When in doubt, make it more restrained and more crafted, not more.

## Current scope: THE HERO ONLY

Everything below the fold, "Story Mode," the dark theme, the scroll experience,
and all business sections are **explicitly deferred**. Do not build them. The
entire job right now is to make **one screen** breathtaking.

## Locked creative direction

- **Light editorial page.** Warm off-white base `#F6F5F2`, ink `#0A0B10`. This is
  the default and permanent look — do NOT pivot to a dark page for the hero.
- **Signature color: Electric Indigo `#5B3DF0`.** (Periwinkle/pastel was rejected
  as a Noomo copy — never reintroduce it.)
- **Headline:** "Maximise Your Digital Potential", asymmetric editorial layout
  filling the left. "Maximise" + "Potential" are **liquid-filled electric indigo**;
  "Your" + "Digital" are **solid near-black**. The *treatment must stay exactly as
  designed* — only its size/placement may change. It must read as **strong,
  saturated indigo, never greyed/washed out**. (Greying is a recurring regression —
  guard against it.) Set as **one word per line**, cascading left→right toward the
  monument (`LINES` in `lib/heroLayout.ts`). The old three-line setting put YOUR
  and DIGITAL on one line, and *their combined width* — not the frame — was what
  capped the type size; one word per line made it ~20% bigger and bound only by
  the height it may occupy.
- **A defined 3D zone on the right** holding ONE centerpiece object. The left is
  type, the right is the object. Mouse interaction is isolated to the 3D zone; the
  left text stays selectable and scroll is never hijacked.
- Premium, crafted micro-interactions everywhere (nav hover-swap to indigo,
  button shine sweep, ghost pill that fills on hover, eyebrow rule, accent bars).
  These are done and liked — keep them.

## The 3D centerpiece — the unsolved problem

Intent (client's words): the **Nerodyn logo, extruded to 3D, clad in obsidian,
with a few mythic veins of electric indigo that shine — light that randomly runs
through them.** Mysterious, mythic, polished. Reference for the obsidian surface:
a sleek, **glossy/polished black faceted crystal with sharp edge highlights**
(client shared a Gemini-generated image of exactly this). Veins are an *accent*,
not the whole texture.

**This is NOT yet right and the client is unhappy with it.** What has been tried
and what we've learned:

- Source mesh: `public/new-logo.svg` (the client's real mark — an angular
  A/arrow/kite form), built via `SVGLoader` → `ExtrudeGeometry` per path →
  `mergeGeometries`. (`logo-mark.svg` was an earlier mark; `new-logo.svg` is the
  current correct one. `fill="currentColor"` throws harmless `THREE.Color: Unknown
  color currentColor` warnings — ignore them.)
- **REJECTED — all-over speckle veins.** A high-frequency fbm level-set put tiny
  glowing dots across the whole surface. Looked like noise/grain. Killed.
- **REJECTED — worley/cellular crack veins** (cell-edge fractures, traveling pulse,
  molten core, fresnel rim, 3/4-angle tilt). Cleaner than speckle but the client
  still called it "terrible" — the cracked-stone look reads busy and the object
  still doesn't feel like the premium mythic monolith they want.
- **REJECTED — floating bipyramid crystal** (volumetric, chamfered, fine vein
  seams). Client: "small… alien object… stupid… no obsidian texture" — a
  floating prop, however crafted, has no presence on this page. Lesson: the
  centerpiece needs MASS and GROUNDING, not more facet/vein finesse.
- **REJECTED — the grounded obsidian MONOLITH (real 3D slab).** Client:
  "I do not like nor appreciate any of the things you made… wayyy worse than a
  template website… flip the table." Lesson learned the hard way: the failing
  pattern was the *paradigm itself* — "big headline left + premium 3D object
  boxed on the right" IS the agency template. And every 3D version bet the hero
  on PBR material quality that is **unverifiable headlessly** (SwiftShader mutes
  it), so each pass shipped blind to the client's GPU.
- **SUPERSEDED — full-bleed 2D liquid-obsidian mark.** A table-flip pass (the
  mark as a masked 2D flow shader, no 3D object). Built and ran, but the client
  then supplied igloo.inc references and chose a real 3D direction, so this was
  replaced before a verdict. (Deleted: `ObsidianMark.tsx`, `shaders/obsidian.ts`.)
- **RESOLVED — client-supplied obsidian crystal GLB.** The client provided
  `crystal.glb` (Sketchfab export: obsidian shard, dark baseColor with pale
  veins, violet emissive nebula, ~1K verts). It is the hero centerpiece, loaded
  in `components/hero/Crystal.tsx` via `useGLTF` from `public/crystal.glb`
  (textures resized to 1K + re-encoded as JPEG: 4.1MB → 0.5MB; the original 4MB
  stays at the repo root, gitignored). Material fixes applied on load: the
  Sketchfab `emissiveFactor 1.0` (which flattens all lighting) is pulled down to
  `emissiveIntensity 0.12`, roughness multiplier 0.32, envMapIntensity 1.5,
  flat (unused) normal map dropped, `flatShading` on for crisp facets. Same
  behaviour rig as before (slow 3/4 sway + float + cursor parallax) at
  `position [1.7, 0, 0] scale 1.3` — clears the nav and the bottom copy block.
  Lighting: tall Lightformer env strips + a white key and a faint indigo rim
  (`directionalLight`s in HeroCanvas). Grounding: a canvas radial-gradient
  `GroundShadow` plane under the shard (drei `ContactShadows` silently rendered
  nothing here — don't reintroduce it; the ellipse is cheaper and cleaner).
- **CURRENT — the shard framed as a MONUMENT (2026-08-01).** Client: *"I like the
  stone, but not its size."* It was 18% of frame width — a thin sliver floating
  mid-frame with an ellipse shadow, i.e. a product shot of a prop. Now: scale
  2.15, tip just under the nav, base running **off the bottom edge of the frame**.
  The crop is the whole point — it is what gives the shard mass and grounding,
  and it made the `GroundShadow` ellipse obsolete (deleted; replaced by a broad
  soft occlusion in the `Backdrop` shader, tracking the shard's column). ~30% of
  frame width, 87% of height, right edge landing on the 4vw gutter so it aligns
  optically with the nav's right edge. Float/parallax amplitudes were cut (at
  this mass, visible bobbing reads as weightless).
- **Hard constraints learned about placement:** the object must NOT overlap the top
  nav, and must NOT collide with the description text. It should feel
  big and confident but contained in its zone. Earlier versions bled into the menu —
  that is unacceptable.
- **`lib/heroLayout.ts` is now the single layout authority.** The headline mask,
  the crystal transform, and the DOM footer width all derive from it, so the type
  zone always ends exactly where the monument begins. Before this they were
  independently hardcoded (`right = 0.6 * w` vs `position={[1.7,0,0]}`), which
  held at exactly one aspect ratio and collided at others. **Do not reintroduce
  hardcoded hero geometry** — add it there instead. It also owns the small-screen
  branch, where a single column can't host a cropped monument without sitting on
  the copy: there the shard is shown *whole*, in its own band between the
  headline and the copy block.

**Open creative question for next session:** EVERY discrete-3D-object direction
has now been rejected (speckle, worley cracks, floating crystal, grounded
monolith). The current pass abandons the object entirely for a full-bleed liquid
treatment of the mark. If the client also rejects this: **do not build a sixth
guess** — get them to react to a *direction* first. The strongest remaining
levers are (a) the client providing a reference SITE they love (so we match a
proven art-direction, not guess) or a finished GLB; (b) doubling down on
verifiable 2D craft (kinetic type, shader composition, motion choreography)
since 3D PBR quality is unjudgeable headlessly and keeps missing on their GPU.
Whatever is built, prefer **verifiable mediums** (2D shaders / CSS / canvas)
over PBR bets we can't see until it's on their screen.

## What is working and liked (do not break)

- The editorial headline layout, the two-tone word treatment, and the saturated
  indigo liquid fill (after the latest palette fix in `shaders/liquid.ts`).
- The premium nav, CTAs ("Hear the story" indigo gradient pill, "Start a project"
  ghost pill), eyebrow, and description styling.
- The near-white, whisper-quiet background (a louder background was rejected).
- The deterministic, race-free intro.

## Things explicitly rejected over the project (do not revive unasked)

Centered glass icosahedron + particle "substrate"; pastel/periwinkle Noomo-clone
background; matte voxel/pixel blocks; glass blocks + cinematic dark-curtain intro;
full-screen liquid background ("too much"); the fanned ribbon sculpture ("makes my
website garbage"); the transmission glass bipyramid crystal; all-over speckle veins;
worley crack veins (latest). Text-in-the-dead-center "AI look" is forbidden.

## Stack & key technical notes

- **Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind v4.**
  THIS IS NOT THE NEXT.JS IN YOUR TRAINING DATA — read `node_modules/next/dist/docs/`
  before writing framework code (see AGENTS.md).
- **R3F + @react-three/drei + @react-three/postprocessing + three 0.184.**
- **GSAP + @gsap/react + Lenis** (smooth scroll).
- Headline is a **GPU mask**: `lib/headlineMask.ts` draws the type to an offscreen
  canvas, channel-coded (RED = liquid words, GREEN = solid-black words, alpha = AA),
  consumed by `shaders/liquid.ts` as a fullscreen masked quad in `HeroCanvas.tsx`
  (`renderOrder 999`, `depthTest:false`). Real `<h1>` kept `sr-only` for a11y/SEO.
- **Bloom must not grey the light page.** Solution in place: an opaque in-canvas
  `Backdrop` gradient quad + threshold Bloom (`luminanceThreshold ≈ 1.0`) + the
  liquid text clamped ≤ 1.0, so ONLY the emissive veins exceed threshold and glow.
  Keep this discipline for any new emissive work.
- Obsidian material is `meshPhysicalMaterial` patched via `onBeforeCompile`
  (inject `vObj`, `uTime`, `uVein`; emissive added at `<emissivemap_fragment>`,
  where `normal` and `vViewPosition` are available for fresnel).
- **`crystal.glb`'s own maps are good — don't fight them.** Extracted and checked:
  baseColor is real black obsidian with pale crack veins (exactly the brief),
  emissive is a violet nebula. If the shard ever looks pale/washed, it is **not**
  the textures — it is **environment reflection**. `metalness` is the lever:
  obsidian is a **dielectric, so metalness must be ~0**. At 0.55 the tall white
  Lightformer strips came back as broad pale mirror panels that read as a glass
  prop; at 0 the env survives only as tight specular edge highlights, which is
  the reference. `clearcoat` and `iridescence` also reflect the env on top of
  that regardless of metalness — stacking all three high re-creates the wash.
- **"Alien" (client ask, 2026-08-01) = thin-film iridescence**, not a new texture:
  `iridescence 0.6 / IOR 1.9 / thicknessRange [140,780]` so neighbouring facets
  land on different fringes and the shard shifts violet→cyan→magenta as it turns,
  plus **two broad slow emissive bands** travelling through object space (the
  client's original "light that runs through the veins"). Deliberately LOW
  frequency — the rejected speckle and worley passes both failed because
  high-frequency noise reads as grain. The same cyan↔magenta interference is
  echoed on the liquid headline's crest so type and shard share one material world.

## CRITICAL GOTCHAS (each cost real time)

1. **Headless verification lies about 3D.** Screenshots use SwiftShader, which
   mutes gloss, transmission, and bloom — the object always looks worse/flatter
   than on the client's GPU. Use headless ONLY to catch crashes / shader-compile
   errors / silhouette & placement. **Never judge material or glow quality from a
   headless shot, and never tell the client it looks good based on one.** Scripts:
   `scripts/shot.mjs` (args: url out w h waitMs waitUntil); it emulates
   `prefers-reduced-motion: no-preference` so intros run.
   For **geometry** questions (size, placement, collisions, crops) prefer
   `scripts/compose.mjs <out.png> [w] [h]` — a software rasterizer that projects
   the real `crystal.glb` through the real camera using `lib/heroLayout.ts`, and
   overlays the headline blocks. No browser, no GPU, ~1s per viewport, and it is
   *exact* about geometry in a way SwiftShader shots are not. It prints the
   type→stone gap, which must stay positive on desktop.
2. **Tailwind v4 + next/font circular var:** never name a next/font `variable` the
   same as a `@theme --font-*` token — it silently breaks globals.css compile and
   Turbopack serves stale CSS. (Font is `--font-grotesk` → theme `--font-display`.)
3. **GSAP selector-scoped timelines are flaky under React StrictMode** double-invoke
   — the intro is intentionally **pure-CSS keyframes** + a canvas-clock-driven
   reveal. Don't reintroduce a JS-timeline intro. GSAP is fine for user-triggered
   clicks (`startDive()`).
4. **Reusing a `CanvasTexture` across a size change** throws
   `glCopySubTextureCHROMIUM: Offset overflows` — create a FRESH texture per mask
   rebuild (on resize + `document.fonts.ready`).
5. **`scripts/shot.mjs` "Failed to launch… Code: 0" — SOLVED (2026-08-01).**
   This was blamed on the Edge profile handoff and written off as environmental;
   it was mostly the code. Two real causes, both now fixed: puppeteer-core ≥ 23
   **removed `headless: "new"`** (passing it yields a browser that exits
   instantly), and the default DevTools **pipe** transport breaks the handshake
   here — the script now uses `headless: true` + `pipe: false`. Headless **Edge
   is genuinely wedged on this machine** but **Chrome works**, so the script
   probes for an installed browser and `SHOT_BROWSER=<path>` overrides it. If a
   launch ever fails again, first run the browser by hand with `--dump-dom` to
   see the real error before assuming it's the environment.
6. **Next 16 dev can crash-loop its `.next/dev/build/<hash>.js` workers and spawn
   hundreds of node procs → OOM.** If the dev server dies with "Zone Allocation
   failed", kill the `.next\dev\build` node processes, `rm -rf .next`, restart
   with `NODE_OPTIONS=--max-old-space-size=4096`. Never leave multiple `next dev`
   instances running.
7. **SVG `<polyline points>` / `<path d>` do NOT accept `%` units** — only
   `<line>`/`<circle>`/`<rect>` accept `%` on their geometry attrs. Use those for
   the HUD constellation, or a viewBox with `vector-effect="non-scaling-stroke"`.

## File map (hero)

- `lib/heroLayout.ts` — **the layout authority** (camera constants, crystal
  transform, headline geometry, `--hero-right`). Read this first.
- `scripts/compose.mjs` — GPU-free composition proof (see gotcha #1).
- `components/hero/Hero.tsx` — layout shell, nav, CTAs, eyebrow, description, fade.
  Publishes `--hero-right` so the footer ends where the monument begins; the
  scroll cue lives in that channel, right-aligned to the headline's edge.
- `components/hero/HeroCanvas.tsx` — R3F Canvas: Backdrop (page gradient +
  the monument's contact shadow), key+rim lights, `Crystal`, `Environment`
  (Lightformer strips), `LiquidText`.
- `components/hero/Crystal.tsx` — the centerpiece: loads `public/crystal.glb`
  (client's obsidian shard), fixes the Sketchfab material (emissive 0.12,
  roughness 0.32, flatShading) + drift/parallax rig, framed by `heroLayout`.
  `GroundShadow` (in HeroCanvas), `FrozenCrystal.tsx`,
  `Artifact.tsx`, `shaders/artifact.ts`, `shaders/atmosphere.ts`,
  `shaders/particles.ts`, `Monolith.tsx`, `LogoMark3D.tsx`, `ObsidianMark.tsx`,
  `shaders/obsidian.ts` were all deleted.
- `components/hero/HearTheStory.tsx` — the indigo "Hear the story" pill.
- `shaders/liquid.ts` — masked liquid-headline fragment shader.
- `lib/headlineMask.ts` — channel-coded headline mask drawing.
- `lib/usePointer.ts`, `lib/heroAnim.ts` — pointer state + reveal/dive state.
- `app/globals.css` — tokens (`--paper` #F6F5F2, `--ink` #0A0B10, `--muted`,
  `--accent`), film grain, button shine, CSS-keyframe intro, reduced-motion
  overrides. Body is ink-on-paper; `text-ink`/`text-muted`/`text-accent` are
  real theme colors — keep them defined (an earlier dark token set left them
  undefined and every DOM text rendered invisible white).

## Still owed (when the hero is signed off)

Real brand font (Space Grotesk is a stand-in), final copy, working mobile menu
(currently a stub), reduced-motion poster fallback — then the deferred Story Mode /
dark theme / below-the-fold sections.

## How to work with this client

Show, don't explain. Give a recommendation, not a menu of options. When a
direction has failed several times (the 3D object), stop tuning parameters and
propose a genuinely different approach — and get a reaction before building it.
Be honest when something only looks right on their GPU. Don't claim "done" or
"impressive" on faith; they will see through it immediately.
