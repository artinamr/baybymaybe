# Round 17, part 2 — Work verification

Reviewed 2026-10-01 against the plain production export, using installed Chrome
and `--use-angle=d3d11 --ignore-gpu-blocklist --enable-gpu`. No new dependency
was installed. No real form, email or payment request was submitted.

## Changes checked

- Work index and three case studies; registry shared by home and services.
- Fictional business labels, proposed scope and honest demonstration limits.
- Standalone booking styling and responsive internal annotations: one set of
  numbers on desktop, numbered notes on phones.
- Demo titles removed from the page heading outline; one main landmark.
- Touch clipping of illustrative frames with a scrollable top demo and hint.
- Reduced motion for portal status and enquiry log; unused controls/assets removed.
- Fine title hyphens/dashes strengthened without changing the rest of the face.
- Refreshed 16:10 covers and portrait portal cover (all below 120 KB).
- Work nav/footer/service links, sitemap, metadata and Pages image-path fix.

## Local results

`npx tsc --noEmit -p .`, `npx eslint app components lib content` and
`npm run build` pass. All four Work routes are included in the static export.

`tools/qa/work.mjs`: **10/10 scenarios pass**, with no browser/network errors
or network mutations. Desktop 1440×900 and touch phone 390×844:

- Practice: service page, topic/day/time/name booking, confirmation/reset, phone menu.
- Portal: job detail/back, quote approval updates J-2035 on the team board,
  simulated invoice payment.
- Enquiry: all three samples, step progression, edited drafts, approval,
  human handover and Back. Urgent symptoms produce no draft.
- Work filters: All / Websites / Platforms / AI automation.
- CDP touch swipes: top demo scrolls, illustrative screens remain clipped.
- Reduced motion: portal flash and enquiry log have no animation.

All 21 final interaction screenshots were inspected. Full-page desktop and
390×844 case-study screenshots were cropped into readable strips and reviewed
through the footer. Work index reviewed at desktop, 390×844 and 768×1024.
Targeted heroes, top demos and booking close-up reviewed at 375×667 and 320×568.
Home Work and each service's case-study card reviewed at desktop and phone.
Element captures can composite fixed site chrome over the target when Chrome
expands the viewport; standalone captures omit that chrome for inspection.

`tools/qa/kbd.mjs` on the enquiry case study: 60 stops, none hidden/offscreen
or covered, no console errors. Indigo focus outlines remain visible.
Overflow checks on Work and all three service pages pass at 320/375/414/768.
The overflow tool was also tested against an intentional wide fixture and
correctly failed with a nonzero exit code.

Home smoke checks at 1440 and 390 reach intro `done`, all compile marks present,
no browser errors. Home covers use top-left positioning and the portrait portal
image at wide sizes. The hover glint and all project/service links are checked.
Film/stage/shader/choreography/scroll-clock code was not changed in this increment.

An overloaded Python test server refused initial asset connections during
parallel browser starts. The affected index/overflow/home checks were repeated
against a quiet Node static server; the reruns passed. This was a local serving
failure, not a site fix.

## Deployment

The local Pages build with `NEXT_PUBLIC_BASE_PATH=/baybymaybe` passed. Built
case canonicals and OG/Twitter images use exactly one Pages prefix; the preview
retains `noindex`, and the sitemap includes every Work route.

Code commit `e1e9aff` was pushed to master. [Pages workflow 36844393927](https://github.com/artinamr/baybymaybe/actions/runs/36844393927)
completed successfully (build and deploy). `node tools/qa/live.mjs` passed:
all 16 page routes return 200, the unknown route returns the branded 404,
Work metadata and sitemap assertions pass, and home reaches intro `done`
with no errors. The audit jump remains at 76 px below the header after the
auto-framing window. Its screenshot was inspected. No form was submitted.

## Remaining in the overall plan

Five-stage Methodology is next. Blog, home recomposition, the wider quality
pass and the domain move remain in `WHAT-TO-DO.md`. The client's copy/contrast,
real-project and domain decisions remain open; no such decisions were inferred
from this increment.
