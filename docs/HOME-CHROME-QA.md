# Homepage side controls — 2026-10-01

The client requested removal of the numbered chapter rail and the lower-left
chapter card shown in their screenshot. Removed `ChapterIndex`, its phone
counter, and `SpecimenCard` from `components/chrome/Chrome.tsx`, together with
their exclusive CSS and animations. Navigation and phone-menu chapter jumps
remain. No film, shader, scroll, layout or chapter content was changed.

## Verification

- `npx eslint app components lib content`: passes.
- Plain `npm run build`, including TypeScript and the static export: passes.
- Pages `NEXT_PUBLIC_BASE_PATH=/baybymaybe npm run build`: passes.
- Independent source review and `git diff --check`: passes. A PostCSS AST
  comparison confirmed surviving CSS rules match the baseline exactly.
- Real-GPU homepage screenshots reviewed at 1440×900, 390×844, 375×667 and
  320×568. Both controls and the phone counter are absent; no horizontal
  overflow or browser errors. The known 320 px hero-copy crowding remains.
- Phone menu retains seven chapter jumps. Why and Free audit land correctly;
  links close the menu, Tab moves within the dialog, and Escape restores focus.
- A 60-stop desktop keyboard walk has no browser errors or removed-control
  focus stops. The existing finale audit-button entrance fade is still
  flagged at 450 ms: opacity 0.10 after removal versus 0.08 in the baseline.
  This is a pre-existing timing issue, outside this removal's scope.

## Film and scroll preservation

`domstills.mjs` captured before and after at film times 1.62, 3.72, 4.9, 5.45,
7.62, 9.3, 10.75 and 11.5, at 1440×900 with `render=1&freeze=1` and 9000 ms
settle. All sixteen screenshots were inspected. `pixdiff.mjs` reports maximum
channel difference 0–1/255 across all eight pairs (gate ≤2/255); capture errors:
none.

Matched warm wheel runs used the same cached Chrome profile, real D3D11 GPU,
DPR 1.5, intro completed plus 9000 ms lens settle, and 56 wheels of 60 px
at 40 ms intervals. Baseline: 522 frames; removal: 517 frames. Both recorded
zero frames over 50 ms and ended at S3.72. Earlier runs showed transient long
frames; these did not recur in the matched baseline/removal comparison.

Scratch images, scripts and raw measurements are outside the repository at
`C:/Users/amrae/AppData/Local/Temp/nerodyn-chrome-removal/`.
