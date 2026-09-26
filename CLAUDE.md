@AGENTS.md

# Nerodyn — Project Brief & Working Context

> Read this before touching the site. It is the accumulated, hard-won context
> from building nerodyn.com with the client. Honour it.

## Who this is for

**Nerodyn** (nerodyn.com) is a premium agency selling **digital infrastructure**
(websites / web platforms) and **AI automation** (AI in websites and in internal
workspaces). The client has strong, specific taste, is blunt, and judges on
*feel*. Build → show → refine. Give a recommendation, not a menu.

## The bar

Award-level (igloo.inc, uxbert labs, Lusion). Premium, mature, mythic, confident.
Not busy, not template, not "AI-generated-looking". If a thing is not clearly
impressive it is worse than not having it.

## Current direction — "One Stone" (2026-09-23 →)

The client asked for a FULL-SITE rebuild: white theme, a sharp obsidian stone in
3D, many other 3D elements, and a 3D scroll "at the level of igloo.inc".
The full art-direction spec is **`docs/SPEC.md`**; module boundaries and
interfaces are **`docs/CONTRACTS.md`**. Read both before changing the 3D.

**SITE SHAPE (round 9, 2026-09-26 — "the page is too long … like UXBERT
Labs, a story mode … four sections … go above and beyond").**
- **Home = four sections** (`lib/chapters.ts`, page 920vh, S_MAX 8.2):
  potential (hero) · build ("What we build": Design / Infrastructure / AI
  automation) · why ("Why Nerodyn": 14 days · 100% · 0 retainers · 48 hours)
  · audit ("Let's talk." + footer). Everything else lives on other pages.
- **Story mode** (`lib/story.ts`, `lib/storyFilm.ts`,
  `components/story/StoryMode.tsx`): clicking the hero stone (or "Enter the
  story", the nav's "The story", `/#story`) opens a UXBERT-style story of why
  Nerodyn exists — six chapters (Potential · The first meeting · Seconds · The
  cut · The light inside · Yours) on its own clock P with its own camera
  spline over the same stone; decoding titles, typed copy, a chapter rail,
  click-and-hold / wheel / arrows / Escape. Lenis stops while it's open;
  closing rewinds the film to the hero. Story copy sits on a soft paper veil
  (never ink on black glass).
- **Methodology** is its own page (`app/methodology/`): editorial timeline
  (Day 01 → 14), typical agency vs Nerodyn, principles, audit CTA.

**THE HOME FILM (round 9).** One polished obsidian stone, shaped from the
Nerodyn mark, fractured into 40 SHARDS (the mark's cuts + an anisotropic
Voronoi — `lib/geo/crystal.ts`) plus the CORE: a small whole copy of the
stone that lives inside it, full of light (fragment 40, code `CORE`). What
igloo.inc does: objects ASSEMBLE, SHATTER, RESHAPE; each section is a
different PLACE. So:

| S | place (`Places.tsx`, `sceneState.env`) | formation (lib/formations.ts) |
|---|-------|------------------------------|
| 0–0.7 | the studio (paper, mirror floor) | F0 the stone; look up, the pass, seams light |
| 0.7–1.3 | → the SKY (a cloud sea below, puffs) | F1 it SHATTERS; the camera dives through the burst — no type yet |
| 1.3–2.05 | the sky | F1→F0 the shards re-form the stone (DESIGN; type reveals at 1.46) |
| 2.05–3.0 | the sky | F2 the MONUMENT: the stone rebuilt at 2.25×, course by course, open joints, core glowing (INFRASTRUCTURE) |
| 3.0–3.64 | the sky | F3 the FLOW (AI AUTOMATION): leads sweep in from the distance, circle the core on a tilted ring, are decided at its front — the qualified LIGHT (full of light, like the core) and file into a rising column on the right; the noise goes dark and drops into the clouds |
| 3.64–4.4 | down THROUGH the cloud (haze) to the LAKE | the shards rain down |
| 4.4–6.8 | the LAKE (still water, a far range + its reflection, camera low over the water) | F5 the BUILD column, one group seated per number of "Why" |
| 6.8– | the lake | F6 the mark ("Let's talk.") |

Rest frames (auto-framing): 0 · 1.85 · 2.95 · 3.5 · 5.35 · 7.55 · the end.

**Client verdicts:** 2026-09-25 "bg and animations perfect for now" (round 5)
→ round 6 (armillary, light streams, standing-stone field) REJECTED: ch02–03
"meaningless", the particle hover "crap", the field "literally coffins", ch05
"just shattered … so quick nobody will catch it", flat purple cut faces "a
1990s game", "a few stuff changing into each other". → round 7 (eight clean
pieces, open-book night chapter) REJECTED as "terrible … so plain … just
rotating around the stupid shape", and it had removed the SHATTER — "the only
good animation". Wanted: igloo-like story with CHANGING ENVIRONMENTS, "shatter,
reshape, stacks" — "not just going to black or three pieces and back to one".
"Crazy doesn't mean a ton of particles — the few you have must be very
polished." → round 9: page too long; wanted a story mode (UXBERT Labs), four
home sections, methodology on its own page, and transitions / environments
that are creative and never sloppy. Typography is still owed a pass.
`preview-card.mp4` is MOTION ONLY.

## The stone's surface (2026-09-25: "shape great, texture really bad at some angles")

- Flat mirror facets + a mostly-dark studio made the stone a pure-black
  CUT-OUT at most angles. Fixed by (a) a very low-frequency facet UNDULATION in
  `shaders/obsidian.ts` (knapped-then-polished glass: strips become flowing
  sheens), (b) broad dim softboxes all round in `StudioEnv.tsx`, including a
  high FRONT gradient for the crown (its facets tilt ~27° up and reflect the
  sky behind the camera) built as graded bands + one crisp line — one wide
  panel reads as grey plastic — and a graded floor bounce for the pavilion.
- Veins (client asked for "a bit more veins on some faces"): a few long
  meandering lines of indigo light from a slanted coordinate bent by
  LOW-frequency noise, masked to some regions, fixed pixel width via fwidth,
  plus a softer copy sampled INTO the glass along the view ray (parallax =
  light inside the stone). Never speckle, never cells — both were rejected.
- **The light inside** (round 7, "the inside looks like a 90s game"): every
  pixel looks INTO the glass — the view ray refracts at the surface and runs
  to the piece's exact exit (the stone's hull planes + the piece's mark-cut
  bounds, uniforms), gathering (a) veins at four depths, deeper = softer and
  dimmer (defocus), carrying signal pulses, and (b) a soft glow ray-marched
  through a small inner glow, the CORE's light (fragTex texel 7 `w`) and the
  CURSOR's light (per fragment, in its own frame — `sceneState.u.cursorPiece`).
  Cut faces are sawn and POLISHED sections (optically flat, half their env
  reflection — else a flat grey card), windows onto that depth; outer faces
  show it faintly. Flat emissive cut faces are banned.
- Look-dev: `?freeze=1&yaw=<deg>` pins the stone's rotation; render a sweep of
  yaws and crop to the stone before judging the surface. The cursor needs a
  live (unfrozen) frame: `?at=6.2&mx=0.25&my=0.6` in shots.mjs.

## Scroll moves (2026-09-25: "make the first-to-second bit more impressive, more 3D")

Hero → ch01 is LOOK UP (camera below the girdle, lens widening, stone rising
off its reflection) → THE PASS (close, fov 44, the stone filling the frame,
veins waking) → settle into ch01 → a hairline of light, then it SHATTERS and
the camera dives through the burst. The stone and camera always turn the same
way relative to each other.

## Motion system (2026-09-26: "not smooth, not premium … like a wireframe")

- **No stop-and-go.** Camera keys are NOT eased one by one (that stopped the
  camera dead at every key). The camera is one Hermite spline through the
  keys (`lib/choreo.ts`, C1) with MONOTONE (Fritsch–Butland) tangents — a
  channel never overshoots a key (plain finite differences sank the camera
  two units past the lake after the dive and cropped the column) — and
  CameraRig damps with ω 3.2 (heavy).
- **Keep the 3D off the type.** Nothing crosses a chapter's text column: the
  burst plays before the build type reveals; the flow lives right of it; no
  lead ever travels screen-left through the headline.
- **Weight.** The Director runs its own damped scroll clock (ω 4.5 on top of
  Lenis), and every shard follows its target on its own critically damped
  spring (ω 3.6–6), with a gentle float + rotational drift while suspended.
  Transitions are staggered per shard (crack distance, course, random, spec),
  ride Bézier arcs and SPIRAL about the form's centre (`plan.swirl`). The
  intact stone is blended back to RIGID. `&freeze=1` snaps everything.
- **Rejected, never revive:** grid lines, leader lines, floor plates, graph
  hairlines ("wireframe"); light-stream particles and cursor-parting
  ("crap"); the standing-stone field ("coffins"); flakes; flat emissive cut
  faces; the round-7 eight-piece rig and the dark night chapter ("plain",
  "just going to black"); the round-8 plain / void / floods / halo /
  specimens (removed in round 9). Tiling shards onto a giant surface read as
  a lumpy clump — the monument is the stone at scale with open joints instead.
- **Billboards** (cloud puffs) fade to zero well inside their card — a card
  edge in the sky reads as a straight line.
- **A piece "full of light"** (texel 7 `w`) glows about its OWN rest centroid
  (carried in the normal-matrix texels' `w`), so any shard can be lit, not
  only ones near the stone's middle.
- **Type moves with the stone:** reveals are 1.3–1.4 s expo-out with a
  blur-to-sharp focus pull and 110 ms stagger; exits are quicker and upward.
- The chapter card is a hero-only beat; it bows out once you scroll.

## Auto-framing + interactivity (2026-09-26: "auto framing like igloo", "AI one more impressive")

- **Auto-framing** (`lib/scroll.ts`): composed frames are listed in
  `REST_STATIC` (+ measured work rows + the page end). ~0.9 s after the last
  wheel/touch/key input, with the scroll at rest, the page glides to the
  nearest frame, biased toward the direction of travel (past 20 % of the gap
  → onward). Any input cancels a glide; nav jumps suppress it until they land;
  never before the intro is done or the user has touched the scroll. Chapter
  `jumpS` values sit ON anchors — keep them in sync when moving keys.
- **Interactivity:** the light inside the glass follows the cursor (hero → the
  void; the veins near it wake); shards near the cursor LIFT OUT of the
  monument / halo / specimens and glow (pull a stone from the wall); the
  sculpture leans toward the pointer; a fast sweep STIRS the halo's orbits;
  the beat's orbit runs faster.
- **Places** (`components/stage/Places.tsx`, `shaders/env.ts`,
  `sceneState.env`): the sky (cloud-sea plane + puff billboards + a `--sky`
  DOM tint), inside the cloud (haze), the lake (hills + mirrored copy + water
  plane). Everything is premultiplied alpha over the paper DOM (fog as
  alpha), so the page stays white where nothing is drawn. The `--dusk` CSS
  machinery (colours derived from `--paper`/`--ink`) is dormant (dusk 0) —
  never hard-code rgba ink/paper in globals.css.
- Vein lines FADE when a pixel spans too much of their period (fwidth) —
  edge-on faces otherwise alias into zebra stripes.

## Typography (after the "texts are terrible" note)

- **Display: Bodoni Moda** (`--font-bodoni`, opsz axis) for the hero line, every
  chapter title, the statement and small display labels (weight 500 below
  ~30px — Didone hairlines vanish at small sizes). Its hairlines echo the
  stone's edge highlights. **Text: Instrument Sans**. Mono only for tiny numerals.
- Rejected in the first pass: the "sans line + serif-italic line" couplet on
  every chapter, bracketed mono caps eyebrows ("(01) THE CUT"), a camera
  AZ/EL readout, poetic AI-sounding taglines. Keep copy plain, confident and
  specific; one voice per title, no italic second lines.
- Hero lines are positioned from `lib/layout.ts` numbers using the display
  face's MEASURED metrics (`--dA/--dD/--dCap`, written by `lib/scroll.ts`) —
  never hand-tuned offsets.

## Locked visual rules

- Warm paper `#F6F5F2`, ink `#0A0B10`, Electric Indigo `#5B3DF0` (never
  periwinkle; nothing indigo lighter than `#6B4BFF`).
- The canvas is TRANSPARENT and there is no post-processing (bloom greys a
  light page). Type set in a chapter's `.back` layer sits UNDER the canvas and
  is genuinely occluded by the stone; `.front` sits over it.
- The page is white. Places change by fog, haze and ground — never by going
  dark (rejected).
- Liked micro-interactions: nav hover-swap to indigo, the indigo pill's shine
  sweep, the ghost pill fill.
- Never revive: periwinkle backgrounds, speckle/worley/Voronoi vein textures on
  outer faces, floating small props, full-screen liquid backgrounds, the heart
  model, the rock texture, text dead-centre.

## Architecture (see docs/CONTRACTS.md)

- One rAF loop (`components/experience/Experience.tsx`): Lenis → `updateScroll`
  → intro clock → R3F `advance(t / 1000)` with `frameloop="never"`.
  **`advance` takes SECONDS** — R3F derives delta from `timestamp − elapsedTime`.
- Scroll coordinate `S = scrollY / vh`; chapter table in `lib/chapters.ts`.
  `lib/choreo.ts` is a pure function of S; the Director adds time-based life.
- The stone is ONE draw call: 40 shards + the core merged, per-fragment transforms in
  a float DataTexture (`lib/fragTex.ts`), read by `shaders/obsidian.ts`.
- `lib/layout.ts` is the only place hero/chapter geometry is derived.
- Intro is PURE CSS keyed on `html[data-intro=wait|run|done]` (JS timelines
  are flaky under StrictMode).

## Verification

- **The in-app browser pane renders on the real GPU** (ANGLE/D3D11, AMD Radeon).
- **Headless Chrome ALSO uses the real GPU** with
  `--use-angle=d3d11 --ignore-gpu-blocklist --enable-gpu` — exact-size,
  real-material screenshots at any viewport. Use `?at=<S>&freeze=1`
  (lib/dev.ts) to land on a point of the film with time frozen (drop
  `freeze` to see time-based life, e.g. the flow), and `?story=<P>&freeze=1`
  for a point of the story film. SwiftShader is no longer the only headless
  option — don't fall back to it for material judgements.

## Gotchas (each cost real time)

1. **Tailwind v4 + next/font:** never name a next/font `variable` the same as an
   `@theme --font-*` token — it silently breaks globals.css and Turbopack serves
   stale CSS.
2. **Turbopack serves STALE CSS on this machine** — after scripted writes, and
   sometimes even after normal edits (it logs "Compiled" and still serves the
   old chunk). Before judging any visual, curl the served CSS chunk and grep
   for the new rule; if it's missing, stop the dev server, `rm -rf .next`,
   restart. Don't debug a "bug" you can't see in the served CSS.
3. **Git Bash mangles `/baybymaybe`** into a Windows path: run the Pages build as
   `MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/baybymaybe npm run build`.
4. **React Compiler lint rules** (`react-hooks/immutability`, `globals`,
   `use-memo`) are off for `components/stage/**` only — mutating memoized
   three.js objects in `useFrame` is the allocation-free R3F pattern.
5. **Reusing a `CanvasTexture` across a size change** throws
   `glCopySubTextureCHROMIUM: Offset overflows` — create a fresh one.
6. **Next 16 dev can crash-loop and OOM.** If "Zone Allocation failed": kill the
   `.next\dev\build` node procs, `rm -rf .next`, restart. Never run two
   `next dev` instances.
7. **SVG `<polyline points>` / `<path d>` do not accept `%` units.**
8. **Parallel sub-agent builds hit the account's session limit** within ~15 min
   (each agent re-reads the ~100KB of spec). Build sequentially in the main
   session when usage is tight; if agents are used, make them write files early.

## Still owed by the client

Real case studies (ch04 rows are labelled placeholders), the real contact email
(`hello@nerodyn.com` is a placeholder) and social links, final copy sign-off,
the brand font if different.
