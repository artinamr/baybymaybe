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

**SITE SHAPE (round 10, 2026-09-26 — "flip the table, step up the game").**
- **Home = five sections** (`lib/chapters.ts`, page 1250vh, S_MAX 11.5):
  potential (hero) · statement ("The studio" — the long statement, restored:
  the client asked for it back verbatim) · build ("What we build": Websites /
  Platforms / AI automation) · why ("Why Nerodyn": No hand-offs / Nothing off
  the shelf / Nothing rented) · audit ("Let's talk." + footer).
- **Copy is ours, not nerodyn.com's** (the client: "nerodyn.com isn't a good
  website to copy"). Plain, specific, no invented numbers. Awaiting sign-off.
- **The hero's door to the story** is the stone itself: over it the pointer
  carries a frosted "The story" lens (`StoneCursor` in Hero.tsx), and at rest
  a thread of light runs down a ridge every ~7.5 s. The rotating ring of words
  was rejected ("should be removed … a nicer more elegant premium thing").
- **Story mode** (`lib/story.ts`, `lib/storyFilm.ts`,
  `components/story/StoryMode.tsx`) — the client called it "bad for now; worry
  about that later", and in round 12 "forget about the story mode and other
  pages". Untouched; it still works (click the stone) — it uses only F0/F1, so
  keep those two formations' behaviour stable.
- **Methodology** is its own page (`app/methodology/`).

**THE HOME FILM (round 13, 2026-09-27 — "I don't like the water and the cloud
thingy … the animations are still cheap and unimpressive and non premium").**
One polished obsidian stone, shaped from the Nerodyn mark, fractured into 40
SHARDS (the mark's cuts + an anisotropic Voronoi — `lib/geo/crystal.ts`) plus
the CORE: a small whole copy of the stone that lives inside it, full of light
(fragment 40, code `CORE`) — the film's protagonist (the intelligence) in every
chapter. **The stone is WHOLE only at the two ends**; in between it is always a
new form, and it bursts exactly once. One unbroken shot in ONE place — the
white studio (paper, the hero's mirror floor); the only background is in
#field (CSS) and barely there: a faint cove where floor meets backdrop (keyed
to `--horizon`), a soft pool of light behind the subject (`--subject-x/y`) and
a slow cool haze (`#field::after`) — the client: "vague abstract background but
nothing too visible". No cuts, no white-outs:

| S | formation (lib/formations.ts) |
|---|------------------------------|
| 0–1 | F0 the stone; look up, the pass |
| 1–2.25 | F0 behind the statement (letters invert where it passes — lib/project.ts clip) |
| 2.25–2.85 | F1 THE SHATTER — explosive (`easeBurst`) and never frozen (every piece keeps drifting and tumbling, `plan.burstT`); the camera DIVES INTO it (the Lens softening the pieces that slide past), the core sharp at the centre |
| 2.85–3.9 | WEBSITES: F4 EXPLODED VIEW — loose, then snapping EXACT per piece from the heart out, a white glint as each locks; held, it sways on its own (a turntable, never a still) |
| 3.9–4.84 | PLATFORMS: F2 THE STAIR — the exploded stone lifts off its heart (the core drops to the floor) and CLIMBS, turning like a drill, laying a splinter as each step as it passes that step's height (`plan.front`): 39 treads (every shard but the girdle plate), all the same length, rise and turn, round an open well, ordered by where each will seat in the colossus; the camera rises with it; each tread glints as it seats, and a glint runs up the stair when the last is laid ("builds up into a bigger one") |
| 4.84–5.0 | the whole stair from a little above, on its mirror |
| 4.97–5.92 | AI AUTOMATION: F2 at `plan.ai` — the core climbs the well; every step it passes turns a quarter on its own length (tread → blade, `easeLock`, a glint) and swings 30° on — the stair becomes a turbine and keeps running (the Director's time-integrated `turbine`). The camera climbs OVER it and looks DOWN (el 44–66°): a vortex of blades, the light rising through it |
| 5.98–7.34 | THE GATHER: F2 → F7 — the core drops back down the well and the stair winds itself (`plan.swirl` 1.5) into the OPEN colossus, point first, growing ×3; the camera draws back and down, circling |
| 7.05–9.3 | WHY: F7 — the open colossus (a wide hollow round the core, the glass toward the camera standing aside); the camera flies in and round the core, and out as it closes, the crown seating last |
| 9.3– | LET'S TALK: down at the floor's own level, the colossus and its reflection; "Let's talk." stands on the horizon |

Rest frames (auto-framing, `lib/scroll.ts`): 0 · 1.62 · 3.72 · 4.9 · 5.45 · 5.94 · 7.62 · 8.2 · 9.3 · 10.75 · the end.
The lighting TURNS with the scroll past the statement (`scene.environmentRotation`,
PlaceEnv.tsx). The camera BANKS into its turns (a `roll` channel on the keys).

**Round-13 techniques worth keeping:**
- **The Lens** (`components/stage/Lens.tsx`): depth of field — the scene into
  an MSAA half-float target with depth, one gather pass by circle of confusion,
  tone-mapped in the quad and written premultiplied, so the page never greys.
  Off (aperture 0) in the hero and the statement; `sceneState.cam.aperture`
  comes from the film. A 16 px tile max-CoC prepass (glass only — bare paper
  spreads nothing) lets most pixels take ZERO taps. Every texture read inside a
  loop is `textureLod`: ANGLE's HLSL compiler unrolls loops that need
  derivatives, and the first version stalled ~5.7 s on first use. Both
  programs are precompiled (`compileAsync`). Measured at 60 fps, 1.3× DPR.
- **The white studio the glass sees** (`PlaceEnv.tsx`): from the break on, a
  PMREM-baked pale cove with bold BLACK FLAGS and two strip lights — glossy
  black on white needs dark reflections to stay glass. NO coloured light in it:
  an indigo strip filled whole flat faces with solid indigo.
- **The white-room rim** (`uRim`, obsidian.ts): Fresnel white at grazing
  angles after the break (0 in the hero) — without it small pieces read as
  black cut-outs on the white page.
- **Motion curves** (`lib/ease.ts`): `easeBurst` (explosive, long tail) for the
  shatter; `easeLock` (a hair of anticipation, ~1.7 % overshoot, settle) for
  every seat and flip; in flight a piece tumbles about the axis across its
  path, most at mid-flight, and arrives square.
- **Glints, not washes**: an event (a seat, a flip, a lock) is a narrow band of
  WHITE light sweeping once across the piece (`vFx.y` → `obsGlint`). Past the
  hero the cursor's light inside the glass is faint (0.28) and a lifted shard
  barely lights — full strength filled nearby shards with flat indigo.
- **The Why words invert** (ink → paper) wherever ANY piece passes behind them:
  a paper copy (`[data-inv-why]`) clipped each frame to the union of every
  piece's projected hull (`lib/project.ts`). This replaced the frosted card.
- **Emissive soft knee** (`shaders/obsidian.ts`): above 0.72 light compresses
  toward 0.9 instead of hard-clamping — lit faces keep their gradients.
- Reflection passes skip the interior march; their depth pre-pass is
  depth-only (`depthOnly`).
- Judge motion IN MOTION (a real wheel scroll recorded with a CDP screencast),
  never only from frozen stills — the stills snap springs.

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
that are creative and never sloppy. → round 9 verdict: hero "good" (lose the
ring); build "not too bad" but wants more detail and a fuller frame; why
"absolute shit" (texts, placement, background, the lake column) — rebuild it
"super crazy"; audit "not bad" but framing; the lake backgrounds disliked
("less viewable but not plain white"); transitions "terrible … out of frame …
not smooth"; bring back the long statement; "it's just a black shard with
repetitive shit — flip the table". → round 10 verdict: hero→statement and
the statement "okay/fine"; build has potential, likes "when it gets bigger and
builds up into a bigger one", but not smooth enough and the AI flow "too fast,
not smooth"; the build→why white-flood cut "absolute crap"; why's fly-in/out
liked but wants more; the finale needs better, crazier framing; everything
more "Apple level, igloo.inc level". Typography is still owed a pass.
→ round 11 verdict (2026-09-27): "on the correct path", but the animations
and effects not good enough, transitions not world class (UXBERT Labs,
igloo.inc), "a bit meaningless/repetitive"; the hero's stone and shape are
liked — "for everything else step up the game … super meaningful and perfect".
Round 12 answered it with the sky / tower / fall / salt-flat film. → round 12
verdict (2026-09-27): "I don't like the water and the cloud thingy. You can
add vague abstract background but nothing too visible, and the animations are
still cheap and unimpressive and non premium." Round 13 answers it (above):
the clouds, the deck, the salt flat and the fall are gone — the studio is the
only place; the tower became the stair; the lens, the white room, the glints
and the new motion curves. Awaiting the verdict.
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
  lead ever travels screen-left through the headline. Where the glass must
  pass behind words (the Why section) the words INVERT to paper over it
  (never a frosted card — it read as UI).
- **Never lose the subject.** Every transition keeps its subject framed (the
  camera dives INTO the burst; rises with the stone that lays the stair; the
  colossus opens toward the camera so the camera always looks at its core) —
  never a cut or a white-out (the round-10 flood was "absolute crap").
- **Smoothness is frame time first.** Judge motion at a real DPR
  (`hitch.mjs`-style: 1.5× display, vsync, count frames > 20 ms). The canvas
  renders at ≤ 1.3× (type is DOM); the glass march is 7 steps with optional
  terms skipped when off. The Lens is the heaviest pass: measure S 2.7 / 4.35 /
  5.45 / 7.62 after touching it.
- **No flat indigo washes.** Light "events" (waves, scans, lit leads) go
  INSIDE the glass via the per-piece core boost (texel 7 w, centred on each
  piece's centroid) — never through `flash` on cut faces over whole pieces.
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
  specimens (removed in round 9); the round-9 lake, its mountains and the
  build column ("absolute shit"); the round-10 white flood out of the core and
  the time-driven lead flow ("too fast"); the rotating ring of words by the hero
  stone; distant obsidian "peaks" in the sky (tried in round 10 — they read
  as grey slabs, i.e. coffins). Tiling shards onto a giant surface read as
  a lumpy clump. Round 11's monument / sort / re-forming stone and the
  frosted claim card were replaced in round 12 (repetitive; UI-looking).
  Round 12's sky (the cloud sea, the deck and its hole), the salt-flat water
  and the fall through them ("I don't like the water and the cloud thingy");
  its tower of window panels (floating rocks) and any crown shown large and
  whole in the white studio (it reads as a plain black pyramid).
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
  void; the veins near it wake; faint past the hero); shards near the cursor
  LIFT OUT of the exploded view and the stair (pull a stone from the wall);
  the sculpture leans toward the pointer (the tall stair only sways); a fast
  sweep hurries the core's turn.
- **The place** is the studio only (round 13). Everything is premultiplied
  alpha over the paper DOM (fog as alpha), so the page stays white where
  nothing is drawn. **Never draw a full-screen or sky-dome layer in the
  canvas:** it veils the `.back` type (the "Let's talk." display went
  lavender) — put backgrounds in #field instead. The `--dusk` CSS machinery is
  dormant (dusk 0) — never hard-code rgba ink/paper in globals.css.
- **What the glass sees** (`PlaceEnv.tsx`): the hero and statement keep
  StudioEnv (dark strips and softboxes — the liked black silhouette); from the
  break on the white studio (above). Evenly bright rooms turn the obsidian into
  flat grey plastic; black glass needs contrast to reflect.
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
- The canvas is TRANSPARENT and there is no bloom (it greys a light page); the
  only post pass is the Lens (depth of field), which keeps the page white.
  Type set in a chapter's `.back` layer sits UNDER the canvas and is genuinely
  occluded by the stone; `.front` sits over it.
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
