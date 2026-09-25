# Build contracts — "One Stone" (read with docs/SPEC.md)

`docs/SPEC.md` is the art direction and the numbers. This file is **how the
modules plug together**. Where they disagree about an interface, THIS file wins;
where they disagree about a look/number, SPEC wins. Contract modules already in
the repo (do not change their shape without the integrator): `lib/chapters.ts`,
`lib/stores.ts`, `lib/sceneState.ts`, `lib/fragTex.ts`, `lib/geo/types.ts`,
`lib/layout.ts` (types).

Prior-pass files you may MINE for code (not authoritative, will be deleted):
`lib/crystal.ts` (Minkowski rounded hull with exact bevel normals — works, verified
on GPU), `lib/obsidian.ts` (onBeforeCompile patterns), `components/stage/Studio.tsx`,
`components/stage/Stage.tsx`, `lib/stage.ts`, `lib/reveal.ts`, `app/lab/*`.
`components/ui/Scramble.tsx` is BANNED (SPEC §9 "not done").

## 0. Global rules for every engineer

- Stay inside the files you own (table below). If you need something from
  another module that isn't in a contract, code against the interface written
  here and note the assumption in your final report — do not edit their files.
- TypeScript strict, no `any` unless unavoidable. Client components start with
  `"use client"`. three 0.184 — addons import as `three/addons/...`.
- **Do NOT start a dev server or open a browser.** One dev server already runs
  on :3000 for the integrator. You may run `npx tsc --noEmit -p .` (ignore errors
  in files you don't own — others are being written concurrently) and node
  scripts (`node file.ts` works on Node 24 for pure TS with relative imports).
- Frame loop: zero allocations per frame (preallocate vectors/matrices), no
  React state per frame, never branch on `material.name`, never toggle
  `#define`s at runtime (uniforms only; `customProgramCacheKey` per variant).
- Base path: static assets must be prefixed with `process.env.NEXT_PUBLIC_BASE_PATH ?? ""`.
- Colours: paper `#F6F5F2`, ink `#0A0B10`, indigo `#5B3DF0`; nothing indigo lighter
  than `#6B4BFF`; indigo linear `(0.1047, 0.0466, 0.8720)`; emissive max channel ≤ 0.9.
- Honour SPEC §14 guardrails. No bloom/EffectComposer. No text scramble.

## 1. Owners

| Engineer | Owns (create/modify only these) |
|---|---|
| **E1 Geometry** | `lib/geo/hull.ts`, `lib/geo/roundedHull.ts`, `lib/geo/crystal.ts`, `lib/geo/fracture.ts`, `lib/geo/shards.ts`, `lib/geo/mark.ts`, `scripts/fracture-check.mjs`, `scripts/mark-fit.mjs` |
| **E2 Look** | `shaders/obsidian.ts`, `shaders/ground.ts`, `shaders/haze.ts`, `components/stage/StudioEnv.tsx`, `components/stage/CursorLight.tsx`, `components/stage/Stone.tsx`, `components/stage/GroundFx.tsx`, `components/stage/Mist.tsx` |
| **E3a Motion** | `lib/choreo.ts`, `lib/formations.ts`, `lib/springs.ts`, `lib/ease.ts`, `components/stage/Director.tsx`, `components/stage/CameraRig.tsx` |
| **E3b Worlds** | `components/stage/Graph.tsx`, `shaders/ribbon.ts`, `components/stage/Field.tsx`, `components/stage/Flakes.tsx`, `lib/graph.ts` (node/edge layout) |
| **E4 Page** | `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `components/chapters/*`, `components/chrome/*` |
| **E5 Platform** | `lib/scroll.ts`, `lib/layout.ts` (implementation), `lib/project.ts`, `lib/dev.ts`, `components/experience/Experience.tsx`, `components/stage/StageCanvas.tsx`, `components/stage/Scene.tsx` |

## 2. Shared singletons (already written)

- `lib/chapters.ts` — `CHAPTERS` (id, num, label, vh, S0, sticky, holdEnd, jumpS, specimen), `S_MAX`, `chapter(id)`.
- `lib/stores.ts` — `scroll`, `pointer`, `ui`, `intro`, `bus`, `ready`, `measured`.
- `lib/sceneState.ts` — `sceneState` (the per-frame film description) + `PRIORITY`.
- `lib/fragTex.ts` — `fragTex.texture` (RGBA32F 8×24), `writeFrag(i, model, glow, flash, fade)`, `writeDone()`, CPU mirrors `fragWorld[]`, `fragPos[]`, `fragFx`.
- `lib/geo/types.ts` — `STONE`, `MARK`, `HOME_A/B`, `FRAG_COUNT`, `FragInfo`, `ATTR`, `StoneBuild`.
- `lib/layout.ts` — `Layout` type, `computeLayout(vw, vh)`, `layout.current`.

## 3. Module interfaces

### E1 — `lib/geo/crystal.ts`
```ts
export function getStone(): StoneBuild;          // memoized; builds once (< 15 ms)
export function stoneHullGeometry(): THREE.BufferGeometry; // intact rounded hull (for a hover proxy), memoized
```
`lib/geo/shards.ts`:
```ts
export function makeShard(o: { sides: number; crown: number; pavilion: number; radius?: number; jitter: number; seed: number; bevel?: number }): THREE.BufferGeometry; // origin at the girdle centre, +Y up (like the stone); boundingBox computed so Field can scale/bury it
export function makeFlake(seed?: number): THREE.BufferGeometry; // rounded 6-point chip, ~unit size
export const FIELD_VARIANTS: { key: "tall4" | "irregular5" | "gem"; count: number; geometry: () => THREE.BufferGeometry; height: number }[];
```
All shard/flake geometries: non-indexed, `position` + `normal`, bevel normals like the stone, attribute `aKind` (0 facet / 1 bevel). Heights documented so Field can scale.
`lib/geo/mark.ts`: MARK helpers — `markOverlayPath()` (SVG path d of new-logo.svg), and the camera/stone pose that projects to the mark: `markPose(): { az: number; el: number; stoneYaw: number }` (radians).

### E2 — `shaders/obsidian.ts`
```ts
export type ObsidianOpts = { frag?: boolean; reflection?: boolean; instanced?: boolean; clip?: "above-floor" | "below-floor" | null };
export function createObsidian(o: ObsidianOpts): THREE.MeshPhysicalMaterial; // shares the module uniforms below
export const obsidianUniforms: {
  uTime, uFragTex, uSeam, uPulsePos, uPulseAmp, uThreadRidge, uThreadHead, uThreadAmp,
  uCutGlow, uFogNear, uFogFar, uReflect, uFloorY, uIndigoLin
}; // THREE.IUniform objects
export function syncObsidianUniforms(): void; // copies sceneState.u / time into obsidianUniforms (call once per frame, PRIORITY.scene)
```
- `frag: true` → vertex reads `uFragTex` rows by `aFrag` (see lib/fragTex.ts), per-fragment glow/flash/fade to varyings. Requires the stone attributes.
- `instanced: true` → standard InstancedMesh; optional per-instance attribute `aInstFx` (vec2: glint 0..1, fade 0..1) — if absent, defaults (0,0).
- `reflection: true` → transparent, depthWrite false, alpha `0.16·(1 − smoothstep(0,1.1, floorY − worldY))·uReflect`, rgb×0.85. The caller mirrors the mesh about `floorY` with its own matrix (negative determinant is fine; three flips winding).
- `clip` → a clipping plane at `uFloorY` (field stones buried in the floor; reflection clipped the other way). Renderer has `localClippingEnabled`.
- Fog-as-alpha on every variant (SPEC §4.4): premultiplied, opaque pipeline.
- Obsidian is the ONLY material for stone, fragments, field stones and flakes.

`components/stage/Stone.tsx` — mounts the merged stone (`getStone().geometry`, `createObsidian({frag:true})`, identity matrix, `frustumCulled=false`) + its reflection (`reflection:true, frag:true`, mirrored about floorY) + an invisible hover proxy (the intact hull transformed by `sceneState.stone.matrix`). Hover: raycast the proxy only when `pointer.moved`; set `ui.hoverStone`, emit `stone:hover`. Calls `syncObsidianUniforms()` each frame. Sets `ready.stone = true` once built.
`StudioEnv.tsx` — SPEC §4.5 Lightformers, frames=1; sets `ready.env = true` after the first bake.
`CursorLight.tsx` — SPEC §4.5 RectAreaLight (calls `RectAreaLightUniformsLib.init()` once), follows `pointer`, intensity `sceneState.u.cursorLight`, positioned relative to `sceneState.stone.home` + camera azimuth frame.
`GroundFx.tsx`, `Mist.tsx` — SPEC §4.6, read `sceneState` (home, floorY, spill, mistClipY, mistAlpha).

### E3a — Motion
```ts
// lib/choreo.ts
export function evaluate(S: number, timeSec: number, L: Layout, out: SceneState): void; // pure: fills cam, stone, u.*, tiers.focus, graph, field, flakes, clip, mark, formation
// lib/formations.ts
export function fragTarget(f: Formation, frag: FragInfo, ctx: FormationCtx, outPos: Vector3, outQuat: Quaternion, outScale: Vector3): void;
```
`components/stage/Director.tsx` — useFrame(PRIORITY.director): sets `sceneState.S = scroll.S`, `time`, calls `evaluate`, handles TIME-based events (intro thread at intro.ms≈1900 → `u.threadRidge/Head/Amp`; emits `thread:potential` when the head crosses POTENTIAL's cap line (project the head with the camera); seam pulses on crossing S keys, re-armed on reversal; seat flashes; hover threads when `ui.hoverStone` with 3 s cooldown), blends formations per fragment (stagger, Bézier arcs), composes world matrices and calls `fragTex.writeFrag` for all 24 then `writeDone()`. Also writes `sceneState.tiers.anchors`.
`components/stage/CameraRig.tsx` — useFrame(PRIORITY.camera): applies `sceneState.cam` (orbit or path) with a critically damped spring (ω 5.5) per channel, sets fov, and `camera.setViewOffset(W, H, (0.5−ppx)·W, (0.5−ppy)·H, W, H)` (sign: positive offset shifts the image left — verify: the pivot must land at (ppx, ppy)). Updates projection matrix only when fov/pp/size change.
Intro (SPEC §3) is read from `intro.ms` / `intro.state`: camera ×1.28 → ×1.00 and yaw 38°→20° over 1500 ms after `run`.

### E3b — Worlds
`Graph.tsx` (ch03): nodes = fragment world positions (`fragTex.fragPos`), k-NN edges from `lib/graph.ts`, ONE instanced screen-space ribbon draw (`shaders/ribbon.ts`) for edges + walkers, visibility/grow/beat from `sceneState.graph`. Walkers set per-fragment `flash` — expose `graphFlash: Float32Array(24)` that the Director multiplies in (export it from `lib/graph.ts`).
`Field.tsx` (ch04): 72 standing stones (3 InstancedMesh variants + 3 mirrored reflection InstancedMesh), Poisson placement, rise-from-floor by camera z, station stones glint on `ui.focusRow`. Visible only while `sceneState.field.visible`.
`Flakes.tsx`: 48 instanced chips, visible while `sceneState.flakes.visible`, positions derived from fragment positions per SPEC.

### E4 — Page (DOM)
`app/page.tsx`:
```tsx
<Experience>            {/* E5: fixed layers, canvas, loop, gate, dev tools */}
  <Chrome />            {/* E4: Nav, ChapterIndex, SpecimenCard, LeaderLines, Grain, MobileMenu */}
  <main>{7 chapters}</main>
</Experience>
```
Each chapter: `<section data-chapter={id} className="chapter" style={{height: `calc(var(--vh) * ${vh})`}}>` containing sibling `.back` and `.front` layers (SPEC §10: sticky, grid-area 1/1, no z-index/transform on the section). Non-sticky chapters flow.
DOM hooks the bridge (E5) writes to — E4 must render these:
- `[data-inversion]` — ch01 duplicate statement (paper colour, aria-hidden, user-select none); bridge sets `style.clipPath`.
- `[data-pot-fill]` over `[data-pot-outline]` — POTENTIAL layers. E4 listens to `bus.on("thread:potential", {x})` and runs the fill wipe with CSS var `--pot-origin` = x (px). Reduced motion or `intro.skipped` → filled immediately. Fallback at intro.ms 3200.
- `#leaders` SVG with `path[data-leader="0..3"]` and `circle[data-leader-dot="0..3"]` — bridge sets `d`, `cx`, `cy`, and `data-on`.
- `[data-readout]` — specimen live text, bridge writes textContent (≤10 Hz).
- `[data-row]` on each ch04 work row (bridge measures `measured.rowS`).
CSS vars E5 writes on `:root` each resize/frame: `--vh` (px), `--g`, `--nav-h`, `--pot-size`, `--pot-left`, `--pot-baseline`, `--pot-cap`, `--l2-indent`, `--stone-x`, `--stone-y` (px), plus per-section `--s` and `data-state` (`before|active|after`).
`html[data-intro="wait|run|done"]` and `html[data-intro-skip]` set by E5 — E4's CSS intro keyframes (SPEC §3) key off them. The fixed layers E5 renders (`#field`, `#field-card`, `#stage`, `#stage-frame`) are styled in E4's globals.css.
Interactions: set `ui.focusTier` / `ui.focusRow` / `ui.hoverEmail` on hover; index/nav clicks call `scrollToS(jumpS)` / `scrollToChapter(id)` from `lib/scroll.ts`. Active chapter: `useActiveChapter()` from `lib/scroll.ts`.
Fonts (SPEC §8): Instrument Sans (variable, `axes:['wdth']`) `--font-isans`, Instrument Serif `--font-iserif`, Geist Mono `--font-gmono` → @theme `--font-sans`/`--font-display`, `--font-serif`, `--font-mono`.

### E5 — Platform
```ts
// lib/scroll.ts
export function initScroll(): () => void;   // Lenis (off under reduced motion), measure, --vh, listeners, pointer listeners
export function updateScroll(): void;       // once per frame after lenis.raf: scroll.y/S/v/active, per-section --s + data-state, bus 'chapter'
export function scrollToS(S: number, durationSec?: number): void;
export function scrollToChapter(id: ChapterId): void;
export function getLenis(): Lenis | null;
export function useActiveChapter(): number;  // useSyncExternalStore on scroll.active
// lib/project.ts
export function runBridge(camera: THREE.PerspectiveCamera): void; // PRIORITY.bridge: inversion clip, leaders, readout, --stone-x/y, bookend clip vars
// lib/dev.ts
export const dev: { at: string | null; freeze: boolean; overlay: string | null; debugSafe: boolean }; // parsed from URL once
```
`Experience.tsx`: renders fixed layers `#field`, `#field-card`, `<div id="stage">` (StageCanvas via next/dynamic ssr:false), `#stage-frame`; runs THE ONE LOOP: rAF → `lenis.raf(t)` → `updateScroll()` → intro clock (`intro.ms`) → R3F `advance(t)` (Canvas `frameloop="never"`). Intro gate: `ready.*` all true (or 1500 ms fallback) → `html[data-intro=run]`, `intro.state='run'`, `intro.t0`, `bus.emit('intro:run')`; 3400 ms → `done`. First wheel/touch before done → `intro.skipped=true`, `html[data-intro-skip]`. Dev: `?at=order:0.6` → scroll to that S; `&freeze=1` → time frozen, intro done instantly.
`StageCanvas.tsx`: `<Canvas frameloop="never" gl={{alpha:true, premultipliedAlpha:true, antialias:true}} dpr=[1,1.5]>`, `toneMapping NeutralToneMapping`, `localClippingEnabled`, clear alpha 0, PerformanceMonitor tiers (SPEC §11), `compileAsync` before setting `ready.compiled`. Mounts `<Scene/>`.
`Scene.tsx`: `<StudioEnv/> <CursorLight/> <Director/> <CameraRig/> <Stone/> <GroundFx/> <Mist/> <Flakes/> <Graph/> <Field/>` + bridge useFrame.
`layout.ts`: implement SPEC §2 + §12 fully (POTENTIAL measureText fit after fonts, occlusion rule, L2 indent, tablet/mobile branches) keeping the `Layout` type.

## 4. Frame order (one rAF)

1. `lenis.raf(t)` → 2. `updateScroll()` → 3. intro clock → 4. `advance(t)`:
   Director (−50) → CameraRig (−40) → scene readers incl. `syncObsidianUniforms` (−30) → bridge (−10) → R3F render.
