# Round 17 — from a cinematic home page to a complete business site

Started 2026-09-30 from a plan the user pasted ("don't solely rely on this,
but if you like bits of it, let's start"). This file is the hand-off: what was
decided, what is live, what is in progress, what is next.

**The full, step-by-step plan for everything left is `WHAT-TO-DO.md` (repo
root). The QA and image tools are in `tools/qa/` (see its README).**

## Decided

**Adopted from the plan:** a family of pages — Services (+ one per
discipline), Work (index + a full case study per project, labelled "Studio
demonstration", no invented clients or results), Studio, Investment (no
prices), Contact (the shared form with two asks), a Blog (six researched
articles); Methodology rebuilt as five stages (Discover, Define, Design,
Build, Launch and care) with "what you bring / what we produce"; one content
registry per kind (`content/*.ts`); static routes with `dynamicParams =
false` (unknown slugs 404); SEO basics (canonical, breadcrumbs, JSON-LD,
noindex on the GitHub Pages preview until `NEXT_PUBLIC_SITE_URL` is set); the
FAQ off the home page and Process shortened; the 3D kept to the home page.

**Not adopted (and why):** removing auto-framing (the client asked for it;
it already leaves readers alone in sheets and the footer); compressing the
film to 10–12 screens (the client called faster motion "too fast, not
smooth" — shorten the page around the film instead); Instrument Sans for
headings and removing the hero card (liked parts of the look); MDX (typed TSX
content modules instead — no new build dependency). The "about fourteen
days" promise stays until the client signs the copy off.

## Increment 1 — LIVE (commit 11b8131)

- `/services/`, `/services/[slug]/` (websites, platforms, ai-automation),
  `/studio/`, `/pricing/` (Investment), `/contact/`.
- Content: `content/services.ts`; images `public/services/*.webp` are film
  stills rendered with `?at=F&freeze=1&render=1` (F 3.72 exploded view, 4.9
  the stair from above, 5.45 the turbine) — wide 2400×1100 banners and 4:5
  card crops (scratchpad `still.mjs` + `svcimg.py` did it).
- Shared: `components/site/Page.tsx` (Page shell, Crumbs, Kicker, Title,
  Closing), `lib/meta.ts` (`pageMeta` — every page states its own title,
  canonical and card), `lib/nav.ts` (NAV), `components/chrome/MenuSheet.tsx`
  (the phone menu dialog, shared by home and sub-pages), `SubMenu.tsx`.
- Nav everywhere: Services · Methodology · Studio · Contact + Free audit.
  "Work" and "Blog" join NAV when their pages exist.
- The form (`AuditForm`) takes `intent`: "audit" | "project" | "choose".
  Project requires a description; subjects "Free audit — …" / "New project — …".
- The footer loads `lib/scroll`/`lib/story` only on click (sub-pages no longer
  ship Lenis); `form={false}` on the contact page (its own form is #contact).

## Increment 2 — COMPLETE (2026-10-01)

Work: three studio demonstrations as LIVE components in device frames (a size
container — the same component is the desktop and the phone view):

- `components/demos/Frames.tsx` — BrowserFrame (url bar, `.example` domain),
  PhoneFrame. Global CSS is in place (`.dev-browser`, `.dev-bar`,
  `.dev-dots`, `.dev-url`, `.dev-screen` with `container-type: inline-size`,
  a fixed height and `overflow: auto`, `.dev-phone`, `.dev-phone-screen`).
- `components/demos/practice/` — "Tarn & Wick", a fictional accounting
  practice's website: home, a service page, a working booking flow
  (`Booking` exported for a close-up).
- `components/demos/portal/` — "Kerrow", a fictional maintenance company's
  portal: team view (stats, jobs, job detail with timeline) and client view
  (approve quote Q-1187 — moves job J-2035 on the team board; pay an invoice).
- `components/demos/enquiry/` — "Pellow", a fictional clinic's enquiry desk:
  three sample emails, stepped Arrives → Organised → Checked → Drafted →
  Approved, a log; the "chest tightness" email is never answered
  automatically (handed to a person, marked urgent). Sends nothing.

All routes and links are complete. The demonstrations were checked through
their full interactions, and pages reviewed on desktop, tablet and phones.
The booking close-up has one set of responsive annotations, demo titles do
not pollute the heading outline, touch illustration frames are clipped, and
Portal respects reduced motion. Removed inactive buttons, nested main and
unused placeholder covers. Corrected misleading demonstration claims and the
Pages share-image prefix. Covers were refreshed after the demo fixes.
See `docs/WORK-QA.md` for validation. The next unfinished increment is 3.

Completed list for increment 2:
1. Frame CSS in globals.css (above).
2. `content/work.ts` — records: slug (`practice-website`,
   `operations-portal`, `enquiry-desk` — already referenced by
   content/services.ts `work`), kind "demo", title, fictional client name,
   summary, services, cover, context, scope, approach, what it demonstrates,
   limitations.
3. `/work/` (filter: All / Websites / Platforms / AI automation) and
   `/work/[slug]/` (opening, context, scope, approach, the visual story —
   browser + phone views and an annotated close-up —, the live demo, what it
   demonstrates and its limits, related service, next project, CTA).
4. Covers: capture each case study's hero frame to `public/work/<slug>.webp`
   (puppeteer element screenshot); wire the home Work section
   (`components/chapters/Work.tsx`, `lib/content.ts` WORK) to the registry so
   each card links to its case study.
5. NAV: add Work; footer Work → /work/; sitemap; service pages show their
   related case study.
6. QA (desktop + phone, keyboard), `npm run build`, Pages build, commit, push.

## Next increments

3. Methodology: five stages with what the client brings / what we produce;
   milestones described as typical, not universal.
4. Blog: `/blog/` (featured, three topic filters, list) and six researched
   articles (BlogPosting JSON-LD, byline "Nerodyn studio" → /studio/, dates,
   contents list, sources, related services/work). NAV gets Blog.
5. Home: remove the FAQ sheet (link to /faq/), shorten Process, service and
   work links from the film chapters; check reduced-motion and no-WebGL paths.
6. Final QA and CLAUDE.md update.
