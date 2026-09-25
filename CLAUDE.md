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

One polished obsidian stone, shaped from the Nerodyn mark, carries the whole
scroll: hero (it stands in POTENTIAL) → the cut (thesis) → four lit floors
(infrastructure) → a constellation light walks through (AI) → a field of
standing stones (work) → it reforms (method) → from one camera angle it IS the
logo (contact). One material, one camera, never a new prop.

**Client verdicts so far (2026-09-25):** "the bg and animations are perfect for
now" — the 3D, the choreography and the intro are LOCKED; do not rework them
unasked. The first typography pass was called "kinda terrible" and was
replaced (see Typography). Their example video (`preview-card.mp4`) is kept
for MOTION ONLY — they said its colours and text positions are bad.

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
- Look-dev: `?freeze=1&yaw=<deg>` pins the stone's rotation; render a sweep of
  yaws and crop to the stone before judging the surface.

## Scroll moves (2026-09-25: "make the first-to-second bit more impressive, more 3D")

Hero → ch01 is now LOOK UP (camera below the girdle, lens widening, stone
rising off its reflection) → THE PASS (close, fov 44, the stone filling the
frame, veins waking) → settle into ch01. ch01 → ch02 dives INTO the burst so
fragments fly past the lens (fov 46), then pulls out to the floors. The stone
and camera always turn the same way relative to each other.

## Motion system (2026-09-26: "not smooth, not premium … like a wireframe")

- **No stop-and-go.** Camera keys are NOT eased one by one (that stopped the
  camera dead at every key). The camera is one Hermite spline through the
  keys (`lib/choreo.ts`, C1, holds only where a channel repeats), the
  corridor is one continuous path, and CameraRig damps with ω 3.2 (heavy).
- **Weight.** The Director runs its own damped scroll clock (ω 4.5 on top of
  Lenis), and every fragment follows its target on its own critically damped
  spring (ω 3.4–6), with a gentle float + rotational drift while suspended.
  The intact stone (F0/F5/F6 at rest) is blended back to RIGID — it must
  never wobble apart. `&freeze=1` snaps everything for screenshots.
- **Sculpture, not diagram.** Rejected as "wireframe": the ch02 grid lines,
  leader lines, flat floor plates and standing graph hairlines. ch02 is now
  a tower of four counter-rotating rings of blades; ch03 an armillary of two
  tilted orbits + three bridges; light between shards exists only as a
  fading trail. Cut faces point INWARD (black glass outside, light within).
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
- **The sculptures live on their own:** the Director integrates ring/orbit
  PHASES (`sceneState.sculpt`) instead of `speed × time`, so the active beat's
  orbit can speed up and a fast cursor sweep can "stir" them without any piece
  jumping; the whole sculpture leans toward the pointer; shards part around
  the cursor. Transitions between formations SPIRAL (`plan.swirl`).
- **Light streams** (`shaders/streams.ts`): ~2,600 GPU-positioned indigo
  points — rings of light inside the tower, morphing with the shards into the
  armillary's two orbits + a core; they part around the cursor. Normal
  premultiplied blending (additive vanishes on white).
- Vein lines and conchoidal ripples FADE when a pixel spans too much of their
  period (fwidth) — edge-on faces otherwise alias into zebra stripes.

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
- The stone is ONE draw call: 24 fragments merged, per-fragment transforms in
  a float DataTexture (`lib/fragTex.ts`), read by `shaders/obsidian.ts`.
- `lib/layout.ts` is the only place hero/chapter geometry is derived.
- Intro is PURE CSS keyed on `html[data-intro=wait|run|done]` (JS timelines
  are flaky under StrictMode).

## Verification

- **The in-app browser pane renders on the real GPU** (ANGLE/D3D11, AMD Radeon).
- **Headless Chrome ALSO uses the real GPU** with
  `--use-angle=d3d11 --ignore-gpu-blocklist --enable-gpu` — exact-size,
  real-material screenshots at any viewport. Use `?at=<chapter>:<s>&freeze=1`
  (lib/dev.ts) to land on a chapter with time frozen. SwiftShader is no longer
  the only headless option — don't fall back to it for material judgements.

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
