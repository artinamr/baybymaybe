# tools/qa — headless-Chrome QA and image tools

Dev-only scripts used to verify the site and to make its images. Not site
code: excluded from ESLint (`eslint.config.mjs` → `tools/**`), never imported
by the app, never deployed.

They drive the machine's real Chrome on the real GPU
(`--use-angle=d3d11 --ignore-gpu-blocklist --enable-gpu`) through
`node_modules/puppeteer-core`, imported by absolute path
(`file:///C:/Nerodyn/baybymaybe/...`). Chrome is expected at
`C:/Program Files/Google/Chrome/Application/chrome.exe`.

## Before running anything

1. Build the PLAIN static export: `npm run build` (no base path). A Pages build
   (`NEXT_PUBLIC_BASE_PATH=/baybymaybe`) left in `out/` 404s every asset locally.
2. Serve it: `python -m http.server 3100 --bind 127.0.0.1 --directory out`
   (run it in the background). Base URL: `http://127.0.0.1:3100`.
3. In Git Bash, any argument that starts with `/` (paths like `/work/`) must be
   run with `MSYS_NO_PATHCONV=1` or Git Bash rewrites it into a Windows path.
4. Write outputs to a scratch folder, not the repo (except image tools that
   are meant to write into `public/`).
5. **Never let a script reach the real form endpoint.** The form scripts mock
   `formsubmit.co` with request interception. Request interception makes the
   home page's 3D load very slowly (the intro may never finish in 90 s), so
   only use it on the pages whose form you test; check the home page without it.

## Verification

| Script | What it checks | Usage |
|---|---|---|
| `homecheck.mjs` | Home page loads, intro reaches `done`, `nd:*` marks, console errors and 4xx/5xx | `node homecheck.mjs <url> [width]` (`390` = phone emulation) |
| `pages.mjs` | Full-page screenshots of sub-pages with every reveal forced on; page height in screens; errors | `node pages.mjs <base> <outDir> <w> <h> "/a/,/b/"` |
| `kbd.mjs` | Keyboard walk: Tabs through a page, flags focus stops that are invisible, off-screen or covered | `node kbd.mjs <url> [tabs] [w] [h] [shotDir]` |
| `overflow.mjs` | Can any page be dragged sideways at 320 / 375 / 414 / 768? | `node overflow.mjs <base>` (edit its page list) |
| `heroclash.mjs` | Hero on phones: description × actions × counter collisions at 8 phone sizes | `node heroclash.mjs <base> [WxH,WxH]` |
| `ctafit.mjs` | Hero actions fit on narrow phones; document width equals viewport | `node ctafit.mjs <base>` |
| `menu.mjs` | Home phone menu: inert when closed, focus in, Tab wrap, Escape, focus back | `node menu.mjs <base>/` |
| `qa3.mjs` | Sub-page phone menu; contact form (project needs a description, subjects, success); MOCKED endpoint | `node qa3.mjs <base>` (its third block hits the home page with interception — see note 5; `qa3b.mjs` does that part without it) |
| `qa3b.mjs` | Home phone menu items, "On this page" jump, desktop nav hrefs | `node qa3b.mjs <base>` |
| `qa2.mjs` | Round-16 home QA: audit jumps, validation, success, error + mailto; MOCKED endpoint. Its nav section predates the round-17 nav (page links) — update the labels before relying on it | `node qa2.mjs <base> <outDir>` |
| `reduced.mjs` | `prefers-reduced-motion: reduce`: intro, jumps, wheel scroll, errors, screenshots | `node reduced.mjs <base>/` |
| `footglide.mjs` | Auto-framing near/inside the footer leaves a reader alone | `node footglide.mjs <base>/` |
| `auditland.mjs` | "Free audit" lands `#contact` exactly under the nav (desktop, phone, tablet) | `node auditland.mjs <base>/` |
| `anchor.mjs` | In-page anchor landings (FAQ topics, legal sections) | `node anchor.mjs "<url>|<id>" ...` |
| `hitcheck.mjs` | Footer links actually receive clicks (nothing overlaps them) | `node hitcheck.mjs <base>/` |
| `live.mjs` | The deployed site: every page's status, 404, head tags, home load, markers, errors (read-only) | `node live.mjs` |

## Film, performance and pixel identity

| Script | Purpose | Usage |
|---|---|---|
| `domstills.mjs` | Frozen stills of the film from any build (`?at=F&freeze=1`), for pixel diffs | `node domstills.mjs <base> <outDir> "F,F" [W] [H] [extraQuery] [settleMs]` — settle ≥ 9000 |
| `pixdiff.mjs` | Pixel diff of two still sets (mean, % > 8/255, max) + heat maps | `node pixdiff.mjs <dirA> <dirB> [heatDir]` |
| `scrollhitch.mjs` | A real wheel scroll through the shatter on a fresh profile; counts long frames | `node scrollhitch.mjs <url> <fast\|warm> [steps] [dy] [stepMs]` |
| `perfab.mjs` | In-page A/B of GPU ms/frame per pass (`?perf=1` timer queries) | `node perfab.mjs <base> "F,F" <flagA\|base> <flagB> [rounds] [dpr]` |

"Nothing visual changed" is proven with `domstills` + `pixdiff` between the
previous build (copy `out/` aside first) and the new one: max ≤ 2/255.

## Images

| Script | Makes | Usage |
|---|---|---|
| `still.mjs` | Film stills: the film alone (`render=1`), frozen at film time F, settled | `node still.mjs <base> <outDir> "3.72,4.9" [W] [H] [dpr] [settleMs]` — 1440×900 @1.667 → 2400×1500; 1680×770 @1.4286 → 2400×1100 (24:11 banners) |
| `svcimg.py` | The service images: wide banners + 4:5 crops centred on the subject | `python svcimg.py <stillsDir> [outDir]` (expects `stillsDir/stills_wide/F*.png` and `stillsDir/stills_svc/F*.png`) |
| `covers.mjs` | Work covers: each case study's live demo in its browser frame at exactly 16:10 (the enquiry desk advanced one step) | `node covers.mjs <base> <outDir>` |
| `coverwebp.py` | Converts every PNG in a folder to a 2400×1500 WebP — **only keep the three cover PNGs in that folder** (it converts everything it finds) | `python coverwebp.py <pngDir> public/work` |
| `tallcover.mjs` + `tallwebp.py` | The 4:5 phone-frame cover for the home page's tall work card | `node tallcover.mjs <base> operations-portal <out.png>` then `python tallwebp.py <out.png> public/work/operations-portal-tall.webp` |
| `sheet.py`, `crop.py` | Contact sheets and crops of screenshots, for reviewing at a readable size | `python sheet.py out.png <cols> <thumbW> a.png b.png ...` / `python crop.py in.png out.png <y0> <y1>` |

Order for covers: build → serve → `covers.mjs` → `coverwebp.py` → `tallcover.mjs`
→ `tallwebp.py` → rebuild (the images are copied into `out/` at build time).

## Shell gotchas on this machine

- Never run `python -` (reading a script from stdin hangs). Write the script to
  a file and run `python file.py`.
- Heredocs in Git Bash break on apostrophes inside the content: write files
  with the editor tool instead of `cat <<EOF`.
- The browser pane in the desktop app pauses `requestAnimationFrame` while it
  is hidden — the intro stays at `wait` there. Time things in headless Chrome.
