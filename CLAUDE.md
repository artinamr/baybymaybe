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

**THE FILM (round 7, 2026-09-26) — "one stone, seven places".** One polished
obsidian stone, shaped from the Nerodyn mark, with an ANATOMY of eight pieces
(crown, band, and two blades each cut into three levels — `lib/geo/crystal.ts`,
every cut deliberate, no random fracture). The same pieces, never a new prop;
what changes from chapter to chapter is the PLACE and the camera (igloo.inc's
lesson: environments change, the theme and shapes stay):

| ch | place | gesture (lib/formations.ts rig) |
|----|-------|------------------------------|
| 00 | the stone on its mirror (paper studio) | — |
| 01 | look up, the pass, then the mark's cut OPENS (crown up, blades part) | `open` |
| 02 | the STACK: four layers part and turn like dials; the camera cranes down them as the rows are read; the focused layer slides out | `layerY/Spin/Out` |
| 03 | NIGHT: the page goes dark (a circle of night spreads out of the stone); the blades swing open on their spine like a BOOK — two pages of light, the mark's V; product page first, then workspace | `bookL/R` |
| 04 | the long mirror: the layers lift off, wait above the frame, and each swoops in as its row comes up, travels with the camera while it is read, then flies on ahead | `station` |
| 05 | they GATHER into a column over the mirror and BUILD the stone, one layer per step (0.45 S each, auto-framed), tips first, each seat a flash | `column/seat` |
| 06 | from one angle it IS the logo | `crown/band/split` |

The rig is ONE parametric pose function; the film (`lib/choreo.ts`) eases its
degrees of freedom as smooth functions of S, so every transition is a single
continuous gesture — never "formation A morphs into formation B".

**Client verdicts:** 2026-09-25 "bg and animations perfect for now" (the
round-5 film) → 2026-09-26 round 6 (armillary, light streams, standing-stone
field) was REJECTED: ch02–03 "meaningless", the particle hover "crap", the
field stones "literally coffins", ch05 "just shattered and comes to screen …
so quick nobody will catch it", the flat purple cut faces "a 1990s game", and
overall "a few stuff changing into each other" instead of igloo's flow.
"Crazy doesn't mean a ton of particles — the few you have must be very
polished; shapes, placing, position, animation all accounted for." Hence the
film above. Typography is still owed a pass (the client: "we don't care about
them now"). Their example video (`preview-card.mp4`) is kept for MOTION ONLY.

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
  to the piece's exact exit (the stone's hull planes + the piece's own cut
  bounds, uniforms), gathering (a) veins at five depths, deeper = softer and
  dimmer (defocus), carrying signal pulses that run faster at night, and (b) a
  soft glow ray-marched through a small heart and the CURSOR's light (per-piece,
  in the piece's own frame — `sceneState.u.cursorPiece`). Cut faces are sawn
  and POLISHED sections (optically flat, half their env reflection — else a
  flat grey card), windows onto that depth; outer faces show it faintly.
  Flat emissive cut faces are banned.
- Look-dev: `?freeze=1&yaw=<deg>` pins the stone's rotation; render a sweep of
  yaws and crop to the stone before judging the surface. The cursor needs a
  live (unfrozen) frame: `?at=6.2&mx=0.25&my=0.6` in shots.mjs.

## Scroll moves (2026-09-25: "make the first-to-second bit more impressive, more 3D")

Hero → ch01 is LOOK UP (camera below the girdle, lens widening, stone rising
off its reflection) → THE PASS (close, fov 44, the stone filling the frame,
veins waking) → settle into ch01 → the cut opens (a hairline of light first).
The stone and camera always turn the same way relative to each other.

## Motion system (2026-09-26: "not smooth, not premium … like a wireframe")

- **No stop-and-go.** Camera keys are NOT eased one by one (that stopped the
  camera dead at every key). The camera is one Hermite spline through the
  keys (`lib/choreo.ts`, C1, holds only where a channel repeats), the
  corridor is one continuous path, and CameraRig damps with ω 3.2 (heavy).
- **Weight.** The Director runs its own damped scroll clock (ω 4.5 on top of
  Lenis), and every piece follows its target on a critically damped spring,
  with a gentle float + rotational drift while suspended. Springs, float and
  drift are per MOVING UNIT — a layer (stack, specimens, build) or a whole
  blade (cut, book) — and drift turns about that unit's centre, so a layer's
  halves or a blade's levels never come apart. The intact stone is blended
  back to RIGID (`film.whole`). `&freeze=1` snaps everything for screenshots.
- **Rejected, never revive:** grid lines, leader lines, floor plates, graph
  hairlines ("wireframe"); the ring tower, the armillary, light-stream
  particles and cursor-parting ("meaningless", "crap"); the standing-stone
  field ("coffins"); flakes; the 24-shard explosion; flat emissive cut faces.
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
- **Interactivity:** the light inside the glass follows the cursor (hero →
  ch03, strongest at night; the veins near it wake); the stack, the book and
  the build lean toward the pointer; hovering a ch02 layer row slides that
  layer out; the stack's dials drift on bounded oscillations (they never
  unwind).
- **Night (ch03):** `u.dusk` → `--dusk` (the #field's circle of night spreads
  from `--stone-x/y`), `--dusk-ui` (type + chrome, switched as the circle
  passes them), `--dusk-aura`. Every colour in globals.css derives from
  `--paper` / `--ink`, so the page follows; never hard-code rgba ink/paper.
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
- The page is white; ch03 is the ONE night chapter (the stone becomes the
  light), entered and left by the circle of night, never a hard cut.
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
- The stone is ONE draw call: its 8 pieces merged, per-piece transforms in
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
