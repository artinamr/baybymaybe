@AGENTS.md

# FIRST, EVERY SESSION: make sure you have the latest version

Several sessions work on this repo (local and cloud). Before you change ANY
file, run `git fetch origin` and `git status -sb` and compare with
`origin/master`:

- Up to date: carry on.
- Behind (or diverged from) `origin/master`: STOP. Tell the user how many
  commits behind you are and what they are (`git log --oneline HEAD..origin/master`),
  and ASK whether to pull first or to continue on the older version. Do not
  pull, merge, reset or edit anything until they answer.
- Fetch fails (offline): say so and ask before continuing.

Check again before you commit and push; if `origin/master` moved while you
worked, ask before merging or pushing.


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

**SITE SHAPE (round 15, 2026-09-27 — "compared to UXBERT and igloo it isn't
that special … also be a SENSIBLE website … not just a stupid animation";
The Web Guys NZ as the "classic, well established and clean" reference; and
"don't lose this 3D world … don't skip the animations we built").**
- **Home = the film's five scenes with the page's plain sections between
  them** (`lib/chapters.ts`): potential (hero) · statement · build ("What we
  build" — what each discipline delivers, and a quiet "Explore … →" to its
  service page) · **work** (page: selected work, the three concept
  websites, round 21) · why (+ "How we're set up →" to /studio/) · **process**
  (page: how we work — the methodology's five stages on one line, one sheet)
  · audit ("Let's talk." + the audit FORM) · then the **site footer** (the
  page's last sheet: a closing line, the address, every link, the name signed
  across the bottom). The questions sheet left the home page in round 17
  (they live on /faq/); "Let's talk" is chapter 06. ~18 screens before the
  footer at 1440×900 (measured 17.98; was 19.63).
- **TWO CLOCKS.** Page S = scrollY / vh; FILM TIME F runs the 3D (every key in
  lib/choreo.ts is film time and did not move). Film chapters run F 1:1 with
  the scroll; a PAGE section is a sheet of paper (z 5, opaque; a real card
  edge — rounded corners, hairline, soft shadow on the scene — never a fade
  to white, which reads as the rejected white-out) that scrolls up OVER the
  film, and the film HOLDS from the last
  screen of the scene before it to the end of the run of sheets (`holds`,
  `filmS(S)` with softened corners; `pageS(F)` is its exact inverse by
  bisection). Page sections flow with their content, so their size and every
  page S0 after them are MEASURED from the DOM (`measureChapters`, on resize).
  While sheets cover the whole viewport the canvas is not drawn at all
  (`sceneState.covered`). Everything that reads the film uses film time
  (`sceneState.S`, `filmS`); the chrome and reveals use page S.
- Auto-framing rests are in film time (`REST_FILM`, + every page section's
  top, + each hold's end, + the footer's top — nothing past it) and never
  pull a reader who stopped inside a page section or the footer.
- **Homepage controls (client request, 2026-10-01):** the numbered chapter
  rail, its phone counter, and the lower-left chapter card are removed.
  Keep them removed. The phone menu's "On this page" chapter jumps remain.
- **Content lives in `lib/content.ts`** (STAGES — the methodology page and
  the home Process sheet read the same five — FAQ, contact),
  `content/services.ts` (disciplines) and `content/work.ts` (projects).
  Work covers are captures of the working demonstrations, with a portrait
  phone view for the middle home card. The audit form (round 16) lives at the top of the footer
  (`#contact`) and posts JSON to FormSubmit → `artin@nerodyn.com`
  (`FORM_ENDPOINT`; `NEXT_PUBLIC_FORM_ENDPOINT` overrides); if the post fails
  it offers the same message as a pre-written email (mailto).
- The hero's primary action is the free audit; "Enter the story" is the
  ghost button. Shared page nav: Services · Work · Methodology · Blog ·
  Contact + Free audit (Studio lives in the footer — six links and the pill
  don't fit at 1100–1280 px). The home menu also lists the chapters on this page.
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

**ROUND 16 (2026-09-29/30 — "other pages … fix the let's talk … the form
isn't functional … jump, don't animate … optimise with ZERO visual change …
better loading … make the whole website perfect").**
- **Pages:** `/methodology` (editorial: hero, film-still banner, four stages
  with images from `public/method/*.webp`, principles, "what is yours on day
  fourteen"), `/faq` (FAQ_ALL, grouped, topics alongside), `/privacy`,
  `/terms` (NZ law assumed — needs the client's/lawyer's review), a branded
  404. They share `SubHeader` (its `audit` prop points the Free-audit link
  off-page on the 404), `SiteFooter`, `SubReveal`, `LegalPage`.
- **The footer is the audit's home** (`SiteFooter`, also on every sub-page):
  `#contact` (title, three points, "Rather write?" copy-email, the form) →
  link columns → the signature (`.sf-mark`, `pointer-events: none` — its
  line box sits over the last row of links). Every "free audit" action calls
  `jumpToAudit()` (lands `#contact` right under the nav).
- **The finale** ("Let's talk.", `Audit.tsx`): the two words stand ON the
  floor line (`--floorline`, projected in lib/project.ts for S > 9.25), one
  each side of the colossus; below, one line, the audit pill and the email.
- **Jumps are instant:** nav, menu, footer links call `jumpToS` →
  `scroll.cutFrames = 2`; the Director and CameraRig SNAP on `scroll.cut`
  (clock, springs, rigid, camera) and suppress glints/cracks, so the film
  lands on the new frame in one frame. Only the reader's own scroll animates.
- **Auto-framing and the footer:** the footer's top (`FOOT_S`, measured) is
  the last rest; inside the footer nothing glides (it used to pull readers
  up to 900 px to the page end, taking the form away mid-read). Past
  `FOOT_S` the canvas is not drawn (`covered`).
- **Keyboard / a11y:** skip link; the phone menu is a real dialog (inert when
  closed, focus in, Tab kept inside, Escape, focus back) and carries Free
  audit; Tab into a film chapter whose
  words wait for their frame lands on that frame (`focusin`, keyboard only);
  `html { scroll-padding-top }` keeps focus/anchors clear of the nav.
  Section markers read their numbers from `chapter(id).num`.
- **Head:** share card `public/og.jpg` (+ OG/Twitter tags, `SITE_URL` —
  set `NEXT_PUBLIC_SITE_URL` when the domain moves), `sitemap.xml`,
  `robots.txt`, the stone-mark icons (`app/icon.svg` flips to paper on dark
  browser themes, `favicon.ico`, `apple-icon.png`; the template's triangle
  was still there), JSON-LD (`components/site/JsonLd.tsx`: organisation +
  offers on home, FAQPage on /faq).
- **Loader:** the veil, the mark assembling with a glint sweep, a hairline
  with a bright head; when the page is ready the mark FLIPs into the nav's
  mark (`data-handoff`, `--fx/--fy/--fs`).
- **Performance with identical pixels** (verified by pixel diffs, max 1–2/255):
  a depth-only pre-pass for the glass (colour passes `depthWrite: false`,
  `invariant gl_Position`), an early `discard` through the shared `obsAlpha()`
  (the mirror at F 7.62: 5.5 → 0.3 ms), a dilated CoC tile map for the Lens,
  no per-frame custom properties on containers (they restyle the whole
  subtree — write transforms straight onto the element, only when changed),
  invisible CSS animations paused. Style recalc per frame 91 → 2 elements;
  scroll-hitch test 0 frames > 50 ms (was 14–19). Measure with `?perf=1`
  (GPU timer queries per pass, `window.__perf` toggles) and `?dpr=`.

**ROUND 17 (2026-09-30 / 2026-10-01 — a complete business site around the film).**
- Part 1: Services (+ websites, platforms and AI automation), Studio,
  Investment (no published prices), Contact, shared Page shell and navigation,
  breadcrumbs and `pageMeta`. The GitHub Pages preview remains `noindex`.
- Part 2: `/work/` and three case studies from `content/work.ts`: Tarn & Wick
  (website and booking), Kerrow (team/client portal, quote approval and sample
  payment), Pellow (enquiry organisation, editable drafts and human handover).
  All businesses/data are fictional and labelled; actions run locally and
  send nothing. Proposed live scope is distinguished from demonstrated features.
- Demos in `components/demos/` use size containers for browser/phone layouts.
  Their own titles are paragraphs, and Portal has no nested main landmark.
  The booking close-up owns its styles and layout-following annotations;
  phones keep the numbered notes. Illustrative frames are clipped on touch;
  the top frame remains scrollable with a phone hint. Reduced motion is honoured.
- Work is linked from the home, services, nav and footer, and included in the
  sitemap. Covers are WebP captures of the current demos; old film placeholders
  are removed. Metadata image paths are relative to metadataBase so the Pages
  prefix is applied once. Fine display punctuation is strengthened individually.
- Verification: `tools/qa/work.mjs` exercises the demos, filters, touch and
  reduced motion, blocking network mutations. Expanded `overflow.mjs` and
  `live.mjs` fail on route/metadata/overflow errors. Details: `docs/WORK-QA.md`.
  No film, stage, shader, scroll-clock or choreography code changed in part 2.
- Part 3 (2026-10-04): Methodology in five stages (Discover, Define, Design,
  Build, Launch and care — happens / you bring / we produce / when; `STAGES`
  in lib/content.ts, also read by the home Process sheet); the home page
  recomposed (see SITE SHAPE); the BLOG: `/blog/` (newest set large, the rest
  by date, topic filter) and six researched articles. Registry
  `content/blog/index.ts` (title, ≤155-char description, the short answer,
  topic, dates, minutes, cover, related, sources; `status: "draft"` keeps one
  out of everything); bodies are typed TSX in `content/blog/<slug>.tsx`
  (`toc` + `Body`), mapped in `content/blog/bodies.ts`; parts in
  `components/blog/` (Article layout, Prose: H2/Figure/Callout/Steps/Compare/
  Check/Cite, Diagrams: DecisionTree/Flow/Routes/Layers — HTML, not images,
  reflowing by container query). BlogPosting + breadcrumb JSON-LD, RSS at
  `/blog/feed.xml`, covers are film stills (`public/blog/*.webp`, 2400×1100).
  Every factual claim is cited to a page fetched and checked on 2026-10-04;
  citations are numbered in reading order. The full-site check is in
  `docs/CHECK-2026-10-04.md`.
- Quality pass (2026-10-04): axe clean except muted-text contrast (the
  client's call); no-WebGL hydration fixed (`NoStage`); the <360 px hero;
  `lang="en-NZ"`; form failure paths (`tools/qa/formpaths.mjs`). Speed:
  sub-pages' first-screen `[data-rv]` reveal no longer waits for React — an
  inline script at the end of `<body>` (app/layout.tsx) marks what is in
  view two frames after parse (one frame earlier and the transition never
  plays); the hero is `visibility: hidden` while `data-intro="wait"` (under
  the opaque loader its lines' placement counted as layout shift); the
  unused Bodoni italic was dropped (Bodoni itself left with the switch to Inter). Measure with
  `tools/qa/vitals.mjs` (Lighthouse-like mobile throttling, cold cache).
  Home LCP is the loader by design and its remaining CLS is the intro
  frame animating `top/left` — both left for the client (WHAT-TO-DO §7).
- Remaining work is ordered in `WHAT-TO-DO.md`: the client's decisions and
  the domain move.

**ROUND 18 (2026-10-04, pre-launch: "the best website in New Zealand … SEO,
GEO … the blog is where we get most of the customers … avoid m-dashes …
images from outside, strictly not copyrighted, no watermarks … nicer, more
interactive footer … don't do the work on the home page and the works page").**
- **WRITING RULES ARE ENFORCED.** `docs/BLOG-GUIDE.md` is binding for all
  copy (AGENTS.md points to it): no em dashes anywhere a reader or crawler
  sees, no spaced en dashes, plain NZ English, banned stock phrases, every
  fact cited with sources at the end. `scripts/copy-guard.mjs` runs inside
  `npm run build` (so every deploy) and FAILS the build on an em dash, a
  banned phrase or US spelling in an article, a missing source list or photo
  credit, or an image without alt. Every em dash on the site was rewritten
  (not swapped for commas); only code comments and GLSL still have them.
- **PHOTOGRAPHS, NOT FILM STILLS, on the blog, methodology and services**
  (the client: "not the stupid images of our own shader animations"). All
  CC0 from StockSnap (found through the Openverse API; Unsplash is NOT
  allowed: not CC0, and it blocks automated access), each with its licence
  page, photographer and check date in `content/images.ts` (the one
  registry; `components/site/Photo.tsx` renders it with srcset). Graded so
  they sit together: saturation 0.62, a mild S-curve, black→RGB 14,15,21,
  white→the paper. Two sizes each (`x.webp` + `x-<half>.webp`). The film
  stills remain only in the home film itself and `public/og.jpg`.
- **SEO/GEO.** Titles "Page | Nerodyn" with search-shaped titles
  (`seoTitle` on services), descriptions ≤ 160, `en_NZ` Open Graph, large
  image previews allowed once indexable, per-page share cards
  (`public/og/*.jpg`, made by `tools/qa/ogcards.mjs` in the site's own
  Inter), an entity graph on every page (`SiteLd`: ProfessionalService in
  Auckland, NZ, areaServed NZ, contact point, knowsAbout; WebSite), page
  types (AboutPage, ContactPage, CollectionPage), HowTo for the method,
  FAQPage wherever questions show, BlogPosting with citations, keywords and
  image licence data, Blog on the index. `sitemap.xml` with image entries,
  `manifest.webmanifest`, `/llms.txt` (the site in Markdown for AI
  assistants, from the registries), RSS with covers. nerodyn.com says
  "Engineered in Auckland": the site now says Auckland (`PLACE` in
  lib/content.ts; client to confirm). Old nerodyn.com URLs: `/audit/` is now
  a real landing page (free audit + form + questions), `/cookies/` forwards
  to `/privacy/` (noindex, canonical, meta refresh).
- **The blog** looks like a publication now: photo cards with a topic filter
  (CSS-driven, every card in the HTML), a reading-progress hairline
  (scroll-driven CSS, no JS), contents that mark where you are (`Toc`),
  three "Questions people ask" per article (registry `faq`, FAQPage), the
  sources and the photo credit at the end, Copy link / LinkedIn / Email
  (`Share`, plain links), photo cards for "where to go next". Service pages
  list "From the blog".
- **Methodology**: the shared `Page` shell (breadcrumb data), a five-stage
  map at the top (anchors to each stage), real photos, a questions block.
  Fixed a phone bug: every second ("flipped") stage was squeezed into two
  columns because `.ms-stage[data-flip]` outranked the phone rule.
- **THE SIGNATURE** (`components/site/Signature.tsx`): the mark and the name
  edge to edge across the foot of every page (sized from the column with
  container units, `--sig-k` = mark + gap + word in em, measured 4.17 in
  Inter 600). Letters rise in on view; then each letter paints its share of
  one indigo light that follows the pointer (`--mx/--my`, per-letter `--x`,
  background-clip: text; the letter's box is padded to cover the y's tail or
  the light clips it) and a narrow white glint (`--gx`, a registered
  property) on arrival, on pointer enter and every ~9 s in view. The mark
  leans toward the pointer, parts and fills indigo on hover (like the nav),
  bursts on click and goes back to the top. Above it, a bar: ©, "Designed
  and engineered in Auckland, New Zealand", the live Auckland time
  (`NzTime`), back to the top.
- **Accessibility**: muted small text raised to 62% ink (64% on the form
  card) so axe reports 0 violations on every sub-page (only the work demos'
  fictional brand colours remain); keyboard focus reveals a `[data-rv]`
  element at once (`SubReveal` focusin); the form says what happens to your
  details, with a link to the privacy policy.
- **Speed** (live, slow-4G profile): services 2.6 s, article 3.0 s, contact 2.1 s
  LCP, CLS 0. `[data-rv]` STARTS AT OPACITY 0.01, NOT 0: Chrome ignores text
  at opacity 0 for LCP, so a title rising from 0 was timed at the end of its
  1.1 s rise. Never set it back to 0. Banners load eager but at normal
  priority (`<Photo eager>`); `priority` (high) only for a picture that is
  itself the largest thing in the first screen. Numbers in
  docs/CHECK-2026-10-04.md.
- Home and work pages: text-only edits (em dashes), the new footer, head
  data. The 3D stage chunk is byte-identical (`1duwm8q1dv2sg.js`).

**ROUND 19 (2026-10-05 — "make the methodology page better, make the services
page better … don't touch the home page … the blog is really really
important … above and beyond perfection … genuinely useful and attracting").**
- **The blog is a publication.** Home (`app/blog/page.tsx`): figures
  (articles, sources checked, terms explained, last checked), "What are you
  deciding?" (`situation` per article, the reader's own words; on a wide
  screen the hovered row brings its photo and short answer into a panel,
  `components/blog/Situations.tsx`), every article with SEARCH and topics
  (`BlogIndex`: one CSS rule hides non-matches, every card stays in the HTML;
  it matches titles, answers, FAQ answers, sections and the glossary terms an
  article explains; "/" focuses it; a miss offers to take the question), the
  TOOLKIT (each article's `tools`, linked to their sections), the glossary and
  how we write, "Got a question we haven’t answered?" (mailto).
- **Articles:** `audience` ("Who it’s for" / "Not for you if") beside the
  short answer; the byline says when the sources were checked
  (`checkedOn`); the contents show time left and Copy link / Print, and on a
  phone become a sticky bar under the nav naming the section you're in
  (`Toc`); glossary terms linked once each with `<Term id>` (definition on
  hover/focus, `aria-describedby`); "About this article" (corrections by
  email); a print stylesheet (the site around the article is left out).
- **New pages:** `/blog/glossary/` (`content/blog/glossary.ts`: 34 terms in
  five groups, facts cited and checked 2026-10-05, a find field,
  DefinedTermSet data; the Privacy Act now includes IPP 3A from 1 May 2026)
  and `/blog/how-we-write/` (the blog's public standards, linked as
  `publishingPrinciples` in the organisation and article data). **Keep that
  page and docs/BLOG-GUIDE.md in step: the page promises what the guide
  requires.**
- **docs/BLOG-GUIDE.md rewritten**: the registry fields (situation, audience,
  tools), article types with skeletons, readability, the glossary, linking
  and upkeep, a quality bar (publish at 4+ on every line), candidate
  questions to write next.
- **copy-guard** now also checks every internal link and `#section` (it
  found the quote article's two `id="questions"`), duplicate ids, and the
  short answer and audience on every article; banned phrases and US spelling
  on every blog page. Home `#chapters` are film places, not ids: skipped.
- **Services:** cards list what each delivers; "Which do you need?"; one
  enquiry's journey through all three (`components/site/Journey.tsx`; on a
  service page, `focus` brings its own steps forward, the others step back
  but stay readable); the three demos; how it starts; questions; one
  article per discipline. Each service page: at a glance beside the title
  (`timeline` in the registry), what shapes the price (`price`), where it fits.
- **Methodology:** the stages read beside ONE sticky photograph that changes
  with the stage (`StageSpy` writes `data-active`; CSS cross-fades; a rail of
  the five under it; phones keep a photo per stage); "Your part" (three
  decisions, what to have ready); "Good to know".
- **Work covers recaptured** (`tools/qa/covers.mjs` pipeline): the old images
  still had em dashes in them. Text inside images counts.
- **Speed:** the round's CSS (+33 KB) had slowed EVERY page's first paint by
  ~0.5 s (A/B under mobile throttling). Fixed by route stylesheets (gotcha
  15) and a search index fetched on first use (`/blog/search.json`); now
  faster than before the round on every page but the much richer blog home
  (+0.27 s locally, uncompressed). The shared sheet is 20 KB gzipped.
- QA: `tools/qa/blog.mjs` (search, topics, panel, term tip, time left, phone
  bar, glossary filter). axe 0 violations on every sub-page; overflow clean.
  `tools/qa/qa2.mjs` is stale since round 17 (it looks for the old home nav
  labels); the home page itself was not touched this round.

**ROUND 20 (2026-10-06 — "the images aren't really premium neither are they
really related … kind of old … make the images better on the whole website
and on the blogs and make sure the blog md also stays super images").**
- **All 15 photographs replaced** (blog covers, methodology banner and
  stages, service banners and cards). StockSnap's library is mostly
  2014–2018 (old MacBooks, iPads): out. New set from ISO Republic (CC0),
  Wikimedia Commons (CC0, incl. photographs first published on Unsplash
  BEFORE 5 June 2017, each date proved from the Unsplash image address
  `photo-<ms since 1970>`) and Flickr (Public Domain Mark: Jefferson Lab).
  Each chosen for an obvious link to its subject: scaffolding and cranes
  (rebuild or improve), a hand ticking a checklist (quotes), letterboxes at
  Muriwai, Auckland (a box for each client: portals), a suspension bridge
  (connecting systems), a robotic arm (AI automation), house keys handed
  over (ownership); white stairs, a telescope, a compass, wireframes, a
  spiral stair and a lighthouse for the five stages; a laptop, a transport
  hall and a clean-room robot for the services.
- **Clean at 100% zoom**: rejected on the way for small print a reader could
  read: a crane's maker and a firm's web address (cropped out), a maker's
  stamp on a key, a paint brand on a swatch, a pen nib's brand, a 3M logo,
  personal handwriting. Check every crop at full size.
- **Grade v2** (`tools/qa/photos/grade.py`): saturation 0.86, full tonal
  range, gentle curve, only the top tones lean to the paper; plus a light
  sharpen after resizing and a size budget (~220 KB large, ~90 KB half) in
  `mkimages.py`. v1 (0.62, squeezed between ink and paper) read as faded.
- `content/images.ts`: `source`, `licence` (CC0 1.0 | Public Domain Mark
  1.0), `via` (Unsplash first publication), `org`, `position` (object-
  position for narrower crops, applied by `Photo`; replaced the blanket
  `.svc-banner img { object-position: 64% }`). The article's credit line and
  the ImageObject licence follow the record. New search tools:
  `isosearch.py`, `cmsearch.py`, `wpsearch.py`; `ovsearch.py` widened.
- docs/BLOG-GUIDE.md section 6 rewritten: the allowed sources and how to
  search each, the bar (modern, premium, obviously related, clean at 100%,
  no clichés, once, together), checking and recording, the files and grade.

**ROUND 21 (2026-10-06 — "three test [sites] … put them in the website …
complete the works pages, services pages … a page for each explaining it
fully … make the home page and methodology page much better … smoother,
nicer, better performance … the transitions … the thing moves from the
bottom of the stack to the top, like a DNA strand … make them a bit nicer").**
- **THE CONCEPT WEBSITES.** Three complete static sites the client made for
  fictional businesses (Butter Days, a Kelburn bakery; Blackridge, an
  architecture studio; Outbound, an adventure company) are SERVED as they are
  from `public/sites/<slug>/` (import: `tools/showcase/import.py` from the
  client's Downloads folders; it drops tools/work/backups/raw photos, unused
  images, recompresses oversized photos, marks every page `noindex`, drops
  canonical/robots/sitemap, and rewrites the few visible em dashes and spaced
  en dashes so copy-guard passes; never hand-edit public/sites, re-run the
  import). ESLint ignores public/sites. ~70 MB in the repo.
- **Work registry**: `kind: "site" | "demo" | "client"` with `KIND_LABEL`
  ("Concept website", "Studio demonstration"); the sites' copy, pages,
  features, phones, palette, type, measured facts and checked craft live in
  `content/sites.ts` (`SiteBuild`). `WORK_ITEMS` = the three sites, then the
  demos; `HOME_WORK` = the three sites (home sheet); `FEATURED` = one per
  discipline (services index).
- **The concept website's case study** (`components/work/SiteStudy.tsx`,
  styles in the route sheet `app/work/work.css` via `app/work/layout.tsx`):
  the site LIVE in a browser frame (`LiveSite`: a poster until "Try the live
  site here" swaps in an iframe; the phone view on small screens; "Open in a
  new tab" always), the brief and the site's three jobs, every page (first
  screens linking into the live site), the decisions, "the parts that do a
  job" (features in use, alternating), phones, the look (palette chips,
  typefaces), "Measured, not claimed" (figures measured on the hosted copy on
  2026-10-06; Blackridge: 0 axe failures on all 13 pages, 0 third-party
  requests), scope, what's real and what isn't (fictional; Unsplash-licensed
  stock photos; Outbound's few low-contrast labels admitted).
- **Pictures**: `tools/showcase/shots.mjs` (real interactions: a filled
  pastry box, the planner at 45 guests, the study's three states, the
  matcher answered, the map on a route, a print-stylesheet capture) →
  `tools/showcase/webp.py` (covers in the same browser frame as the demos',
  a phone-frame tall cover, page thumbnails, phone views, feature images
  with half-size copies) → `public/work/<slug>/` and `public/work/<slug>.webp`.
- **Services, explained fully**: each service page adds "Everything that's
  included" (`includes`, five groups + a dark "Yours, all of it" card), "How
  it runs" (`runs`, five steps on a line; days for websites), "How it's
  built" (`built`), the work as a grid (websites: the three sites + Tarn &
  Wick), "After launch" (`care`), six questions each.
- **Methodology**: the stage strip became THE PLAN (`app/methodology/Plan.tsx`):
  a typical website's fourteen days as bars (Discover 1–2, Define 3, Design
  3–6, Build 7–11, Launch 12–14) with the decisions pinned beneath (sign the
  scope day 3, approve the prototype day 6, try it day 11, live day 14);
  each stage now shows what you receive, drawn as the thing itself
  (`Artefact.tsx`: the audit, the scope with a signature line, the
  prototype, the review checklist, the keys "in your name").
- **The film, framed and faster** (recorded in motion before and after):
  the AI's camera now looks down the well from ABOVE the whole stair (its
  aim following the core halfway, dist 29–35) instead of riding just over
  the core, where the steps above filled the lens; the stone climbs into a
  slightly wider frame (exploded view and first steps no longer touch the
  frame's edges); the gather is drawn back (dist 58–66) so the stair is seen
  winding into the open colossus; the camera LEAVES the colossus before it
  closes (`CLOSE` 8.68–9.26, keys 8.86/9.08/9.3 at 32/47/49), so it is seen
  whole as it seals; the lens fades to nothing for the finale (the hero's
  crisp look, and its cost); the core is 1.2× in the well. GPU per frame at
  1.5× (median): AI 6.2 → 3.8 ms, inside the colossus 9.5 → 7.1, the close
  13.3 → 6.9, the finale 6.0 → 1.6. 4× → 2× MSAA on the lens target was
  tried: no reliable gain, dropped.

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
| 4.84–5.0 | the camera cranes up over the top and looks DOWN the whole spiral to the light at its foot (a far side view read as a line of chips) |
| 4.97–5.92 | AI AUTOMATION: F2 at `plan.ai` — the core climbs the well; every step it passes turns a quarter on its own length (tread → blade, `easeLock`, a glint) and swings 30° on — the stair becomes a turbine and keeps running (the Director's time-integrated `turbine`). The camera looks DOWN the well from above the whole stair (el 56–63°, round 21), its aim following the core halfway: a vortex of blades, the light rising toward the lens |
| 5.98–7.34 | THE GATHER: F2 → F7 — the core drops back down the well and the stair winds itself (`plan.swirl` 1.5) into the OPEN colossus, point first, growing ×3; the camera draws right back at once so the whole stair is seen winding in, then circles down |
| 7.05–9.3 | WHY: F7 — the open colossus (a wide hollow round the core, the glass toward the camera standing aside); the camera flies in and round the core, and out BEFORE it closes (round 21), so the closing is seen whole, the crown seating last |
| 9.3– | LET'S TALK: down at the floor's own level, the colossus and its reflection; "Let's talk." stands on the horizon |

Rest frames (auto-framing, `lib/scroll.ts`, FILM time): 0 · 1.62 · 3.72 · 4.9 · 5.45 · 5.94 · 7.62 · 8.2 · 9.3 · 10.75 · 11.5 — the film holds at 5.94 under Work and at 9.3 under How we work.
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
- **The room the glass sees after the break** (`PlaceEnv.tsx`, round 14): a
  DARK studio (the hero's kind) opened up for pieces — a luminous HORIZON ring
  all round (grazing faces reflect it, so every shard gets a bright edge while
  faces toward the lens stay black), the hero's crisp strips, softboxes with a
  real light's falloff (a uniform panel caught whole reads as a grey card),
  the bright paper floor and one deep indigo trace far back. The round-13
  PALE room turned every face mid-grey — "plasticky". Broken pieces are
  polished harder (`uCrisp`: crisper reflections, glossier cuts). At the end
  (S ≥ 9.62) the whole stone takes the hero's own room back, held round with
  the camera — the film ends on the look it began with.
- **Never let the glass programs recompile mid-film.** three keys every
  program on its output target and on the env's PMREM size: the first time
  the Lens drew into its target, every obsidian program recompiled — a 2.5 s
  FREEZE at the shatter (live in round 13). Stone compiles the whole scene for
  the lens's target at load (`ready.lens`) and the Lens stays SHUT until it is
  ready (then opens over 0.9 s); its targets are allocated up front
  (`initRenderTarget` — allocating them at the shatter was a hitch); every
  baked room uses the hero room's PMREM size (512). After touching any of it,
  record a real wheel scroll through 2.2–2.5 and check the longest frame gap
  (scratchpad `scrollhitch.mjs`-style: a fresh profile, fast AND warm).
- **The white-room rim** (`uRim`, obsidian.ts) is down to a hint (0.1): the
  horizon ring does it physically.
- **Motion curves** (`lib/ease.ts`): `easeBurst` (explosive, long tail) for the
  shatter; `easeLock` (a hair of anticipation, ~1.7 % overshoot, settle) for
  every seat and flip; in flight a piece tumbles about the axis across its
  path, most at mid-flight, and arrives square.
- **Glints, not washes**: an event (a seat, a flip, a lock, the colossus's
  wave, the cursor sweeping over glass) is a narrow band of WHITE light
  sweeping once across the piece (`vFx.y` → `obsGlint`). Past the hero the
  cursor's light inside the glass is faint (0.28) and a lifted shard barely
  lights — full strength filled nearby shards with flat indigo. The glow that
  fills the stone before the shatter is gone before the pieces part.
- **The core** has a HEART: a tight, hot light deep inside (obsGlowField
  `full`), so it reads as light within the glass, not tinted glass.
- **Veins** carry an occasional travelling pulse (a sharp head, a fading
  tail, each vein on its own beat — a cheap per-vein hash, never extra noise
  per pixel: that cost the colossus close-ups 10 fps).
- **Interactivity past the hero:** the camera drifts a degree toward the
  pointer (CameraRig parallax, from S 0.95; the hero is untouched); glass
  catches a glint as the cursor sweeps over it; the open colossus drifts and
  turns on each piece's own beat, as if weightless; at "Let's talk." the
  hero's ridge thread runs down the colossus.
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
still cheap and unimpressive and non premium." Round 13 answered it: the
studio is the only place; the tower became the stair; the lens, the glints
and the new motion curves. → round 13 verdict (2026-09-27): "we are in the
right direction … the overall shape and stuff are good", but some animations
"too plasticky … too generic rather than polished Apple level" — work on the
transitions, textures, interactivity, colour, veins; "don't worsen it …
more premium, more polished, more majestic". Round 14 is that polish pass
(the dark studio room, the freeze fix, the core's heart, vein pulses,
parallax and glints, the reveal from above, the gather framed whole, the
weightless colossus, the hero's room at the end). Awaiting the verdict.
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
  `REST_FILM` (+ page-section tops, hold ends and the footer's top — see
  round 16). ~0.9 s after the last
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

- **ONE FAMILY: Inter** (`--font-inter`, self-hosted by next/font, `opsz`
  axis on auto — the way Apple sets SF Pro: the Display cut at headline
  sizes, the Text cut at reading sizes, from one file). Every title, the
  hero line and the statement are Inter at **500** (`--display`); body text
  is Inter at 400 with `letter-spacing: -0.011em` on `body`. Mono (Geist
  Mono) only for tiny numerals. Client, 2026-10-04: Bodoni Moda was "trying
  to be classy … not readable, not nice" — wanted "Apple, but even better …
  practical but still classy". **Never bring back a Didone or any
  hairline display face.** Compared side by side on the real pages: Inter,
  Geist, Mona Sans, Onest; Inter won on reading comfort and its Display cut.
  The share card (`public/og.jpg`) is set in Inter too (scratchpad
  `ogcard.mjs`-style: render the card in the local site so the font is real).
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
- Photographs on the site's own pages are outside CC0 / public-domain photos
  in the site's grade (v2), recorded in `content/images.ts` (docs/BLOG-GUIDE.md,
  section 6: modern, premium, obviously related, clean at 100% zoom). Never
  film stills or renders there; never stock clichés, watermarks, logos or
  brand names; never dated devices.
- No em dashes in any copy (the build checks: `scripts/copy-guard.mjs`).
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
- **First visit (round 15, "absolute perfect").** On Windows the D3D compiler
  (FXC, via ANGLE) takes ~2 s for the lite glass and ~5 s for the full glass
  (PMREM's GGX convolution ~1.3 s); Chrome caches them for later visits. The
  pipeline (flags in `lib/stores.ts` `ready`, marks `nd:*` in the Performance
  panel):
  1. `#loader` (the mark assembling, a hairline filling) is the first paint.
  2. PlaceEnv warms ONE PMREM generator's programs off the main thread and
     puts a key-only stand-in (`CubeUVReflectionMapping`, height 2048) on
     `scene.environment` (`envKey`) — so the first programs compile
     alongside; when warm it converts drei's hero cube + bakes the open
     studio (only draws now) → `env`. Nothing draws before `env`.
  3. StageCanvas compiles the scene as it first draws — the stone in its
     LITE glass, whose program the mirror SHARES (`uMirror`) → `compiled`;
     the loader gives way (~3.5 s here).
  4. Stone compiles the FULL glass alongside (parallel: ANGLE compiles side
     by side) and swaps it in, veins/inner light fading up (`uFullIn`) →
     `full`; then the scene for the lens's target → `lens`.
  5. PerformanceMonitor starts only after `lens` (judged during compile it
     took the machine for a slow one and softened the hero).
  6. `scripts/preload-stage.mjs` (runs after `next build`) preloads the
     stage's chunk from the home page's <head>: as a client-only dynamic
     import it was only requested after hydration (~0.7 s late on the live
     site). It finds the chunk by the glass's GLSL (`obsNoise`) — keep the
     marker in step if that name ever changes.
  All compiles go through `components/stage/compile.ts` `compileFor` (waits
  on exactly the programs made; three's compileAsync re-reads the current
  program). Measure with a FRESH profile and interleaved A/B runs — other
  projects' dev servers on this machine skew absolute times by 2×.

## Verification

- **The in-app browser pane renders on the real GPU** (ANGLE/D3D11, AMD Radeon).
- **Headless Chrome ALSO uses the real GPU** with
  `--use-angle=d3d11 --ignore-gpu-blocklist --enable-gpu` — exact-size,
  real-material screenshots at any viewport. Use `?at=<F>&freeze=1`
  (lib/dev.ts) to land on a point of the film with time frozen — F is FILM
  time: it lands where the film shows that frame (`?at=why:0.5` is page
  S0(why) + 0.5 instead); drop `freeze` to see time-based life, e.g. the flow.
  `?story=<P>&freeze=1` lands on a point of the story film; `?render=1` hides
  the DOM for stills of the film alone (the work covers). SwiftShader is no
  longer the only headless option — don't fall back to it for material
  judgements. For pixel diffs between builds let a frozen still SETTLE ~10 s
  (at 3 s the hero was not settled, and a changed load order read as a
  "difference" that was not there).
- **Local tests run on the static export** (`npm run build`, serve `out/`).
  A Pages build (`NEXT_PUBLIC_BASE_PATH=/baybymaybe`) left in `out/` 404s
  every asset locally — rebuild plain before measuring anything.
- **The browser pane pauses rAF when it is hidden** (`visibilityState`
  hidden): the intro sits at `wait` there. Use headless Chrome for timings.
- **Never submit the live form in tests** — mock `formsubmit.co` with
  request interception (it emails the client).

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
8. **A phone's first load widens to the widest thing on the page.** Before
   the layout script runs, anything wider than the screen (the hero's desktop
   fallback sizes: POTENTIAL ≈ 1350 px) makes Chrome widen the layout viewport
   — the hero was then laid out for 1356 px and shrank back over ~2.5 s, and
   `?at=` landed ×3 too far on phones. `.hero-h1 { overflow: clip }` fixed it
   (round 17). Check with a phone-emulated trace of `innerWidth` from the
   first frame after touching anything in the hero.
9. **JSX text loses its leading space after an element when the text holds
   an HTML entity and wraps.** `<strong>Roles.</strong> The NCSC&rsquo;s
   principle…` (wrapped onto a second line) rendered "Roles.The NCSC’s" in
   this toolchain. Write ’ “ ” literally in JSX text (the blog does), and
   grep the export for `</strong>[A-Za-z]` after writing long copy.
10. **Parallel sub-agent builds hit the account's session limit** within ~15 min
   (each agent re-reads the ~100KB of spec). Build sequentially in the main
   session when usage is tight; if agents are used, make them write files early.
11. **Unsplash blocks scripted access** (an Anubis proof-of-work page) and its
   licence since 5 June 2017 isn't CC0: never take a photo from Unsplash
   itself. Its earlier photos are on Wikimedia Commons as CC0
   (`tools/qa/photos/cmsearch.py`), but Commons' bot uploaded them in
   August–September 2017, so the upload date proves nothing: prove each one
   from the Unsplash image address on its Commons page (`photo-<13 digits>`
   is milliseconds since 1970). Openverse's Flickr and WordPress records
   carry preview sizes (1024/2048 px), not the original's; Openverse's own
   thumbnails fail for Commons (use `Special:FilePath?width=`). A removed
   StockSnap photo redirects to the home page.
12. **`background-clip: text` paints only inside the element's box.** With a
   tight line-height a glyph's ascender or descender sticks out of its box
   and vanishes when the text is transparent (the footer signature's y lost
   its tail). Pad the box to cover the glyph and cancel it with a negative
   margin.
13. **A rule like `.x[data-flip]` (0,2,0) beats `.x` (0,1,0) inside a media
   query.** List both selectors in the phone rule (methodology stages).
14. **Puppeteer `screenshot({ clip })` is in document coordinates**: add
   `scrollY` to a `getBoundingClientRect()` top. A DOMRect returned from
   `page.evaluate` arrives empty: copy x/y/width/height into a plain object.
15. **Every rule in `app/globals.css` costs every page its first paint.**
   Page-specific styles live in route stylesheets: `app/blog/blog.css`
   (imported by `app/blog/layout.tsx`), `app/services/services.css`
   (`app/services/layout.tsx`), `app/methodology/methodology.css` (its
   page). Shared parts stay global (the article cards other pages show,
   `.sr-only`, `.own`, `.pr-grid`). Route sheets load AFTER the global one,
   so a rule there beats a later global rule of equal specificity: keep a
   page's `@media`/`@container` overrides in the same sheet as the rules they
   override (the diagrams' phone layout broke when only the base rules
   moved). After moving CSS, prove it with full-page pixel diffs of every
   affected page at two widths (round 19: 17 pages × 1440/390, identical).
16. **Measure speed A/B, never against yesterday's live numbers.** Live
   timings drift by a second from one day to the next (an unchanged page
   went from 2.1 s to 3.1 s). Build the old commit (`git switch --detach`,
   build, copy `out/` aside, switch back), serve both, and run
   `tools/qa/vitals.mjs` against them alternately. `python -m http.server`
   doesn't gzip, so local differences in bytes look bigger than live ones.
   A git worktree with a junctioned `node_modules` does NOT build
   (Turbopack refuses a symlink outside the project root).

## Still owed by the client

Real client projects for Selected work (the work today is three concept
websites and three studio demonstrations, all fictional businesses and
labelled so — a client project needs its name, permission, what changed, real
screenshots and measured results if available; `content/work.ts`), a decision
on Outbound's and Butter Days' few low-contrast labels (flagged by axe; their
own sites, so not changed here), a
testimonial or two if they have them, ONE activation of the form (the first
submission makes FormSubmit email an "Activate Form" link to
artin@nerodyn.com — until it is clicked, submissions wait), the social links
(`CONTACT.linkedin` / `instagram` — hidden until filled in), a legal review of
/privacy and /terms (written for New Zealand), sign-off on the copy
(including the FAQ answers and the "about fourteen days" promise), the brand
font if different, and the real domain (`NEXT_PUBLIC_SITE_URL`). From round
18: confirm "Auckland" (`PLACE`, taken from nerodyn.com's "Engineered in
Auckland"), sign off the /audit/ page's copy and the three questions under
each article, and name an author (a person with a short bio would help search
and AI answers more than "the Nerodyn studio").
