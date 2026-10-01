# WHAT TO DO — finishing nerodyn.com

This is the complete, ordered plan for everything still to do. Follow it
top to bottom and the site ends up finished to the bar the client set:
igloo.inc / UXBERT Labs in feeling, The Web Guys NZ in good sense, and
nothing cheap anywhere.

Written 2026-10-01 at the end of the session that started round 17.
`docs/ROUND17.md` has the short hand-off; this is the long version.

---

## 0. Read this first

### 0.1 The ground rules (non-negotiable)

1. **Read `CLAUDE.md` and `AGENTS.md` before touching anything.** They hold
   the client's verdicts, everything that was rejected and must never come
   back, the motion system, the first-visit pipeline and the gotchas. The
   client is blunt, judges on feel, and remembers everything they rejected.
2. **The 3D film is the client's pride. Do not change how it looks or moves**
   unless a step below says exactly how. Any performance or structural change
   near it must be proven pixel-identical: `tools/qa/domstills.mjs` +
   `tools/qa/pixdiff.mjs` (max ≤ 2/255), and smooth: `tools/qa/scrollhitch.mjs`
   (no frame > 50 ms on a warm profile).
3. **Every finished increment: `npm run build` passes → Pages build passes →
   commit → push to `master` → check the live site.** The Pages build command
   in Git Bash is
   `MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/baybymaybe npm run build`.
   Pushing to `master` deploys (`.github/workflows/deploy.yml`). Never commit
   `out/`, `Gemini_Generated_Image_ibwjyuibwjyuibwj.png` or `new_logo.svg`
   (the client's files, leave them where they are). Commit messages end with
   the co-author line the session gives you.
4. **Never submit the real form** (it emails the client through FormSubmit).
   Test it with the mocked scripts in `tools/qa/`.
5. **No invented numbers, clients, testimonials or results — anywhere.** Work
   items are labelled "Studio demonstration" and their businesses are
   fictional and say so. Prices are never published until the client gives
   them. Copy is plain, specific and confident (see `CLAUDE.md` → Typography
   for the voice and what was rejected).
6. **Visual language is locked**: paper `#F6F5F2`, ink `#0A0B10`, indigo
   `#5B3DF0`, Bodoni Moda for display, Instrument Sans for text, mono only for
   tiny numerals. New pages reuse the `.sp*`, `.split`, `.items`, `.flow`,
   `.own-*`, `.closing` building blocks (in `app/globals.css`) and the
   `components/site/Page.tsx` shell. Don't invent a new style per page.
7. **Verify on the real GPU** (headless Chrome with the d3d11 flags — see
   `tools/qa/README.md`), at desktop (1440×900) and phone (390×844, 375×667,
   320×568) sizes, before calling anything done. Look at every screenshot you
   take; don't assume.

### 0.2 Where things stand

**Live (master):**
- Round 16: sub-pages (methodology, faq, privacy, terms, 404), the finale on
  the floor line, the working form (FormSubmit → artin@nerodyn.com, needs ONE
  activation by the client), instant jumps, the pixel-identical performance
  pass, loader handoff, keyboard/a11y fixes, icons, share card, sitemap, JSON-LD.
- Round 17 part 1 (commit `11b8131`): `/services/` + one page per discipline,
  `/studio/`, `/pricing/` (Investment), `/contact/`; one navigation everywhere;
  the shared phone menu (`components/chrome/MenuSheet.tsx`); `lib/meta.ts`
  (`pageMeta`: title, canonical, share card per page); breadcrumbs as data;
  the GitHub Pages preview is `noindex` until `NEXT_PUBLIC_SITE_URL` is set.
- Hand-off notes: `docs/ROUND17.md`. QA/image tools: `tools/qa/` (+ README).

**Written but NOT committed (in the working tree — do not discard):**
increment 2, Work.
- `components/demos/Frames.tsx` — `BrowserFrame` / `PhoneFrame` (size containers).
- `components/demos/practice/*` — Tarn & Wick, a fictional accounting
  practice's website (home, service page, working booking flow).
- `components/demos/portal/*` — Kerrow, a fictional maintenance company's
  portal (team board, job detail, client view; approving quote Q-1187 moves
  job J-2035 on the team board).
- `components/demos/enquiry/*` — Pellow, a fictional clinic's enquiry desk
  (3 sample emails; Arrives → Organised → Checked → Drafted → Approved; the
  chest-symptom email is handed to a person, never answered automatically).
- `components/work/Stories.tsx` (the live demo on top of each case study, and
  the paired desktop/phone views + the booking close-up), `components/work/WorkIndex.tsx`.
- `content/work.ts` (the registry), `app/work/page.tsx`, `app/work/[slug]/page.tsx`.
- `public/work/{practice-website,operations-portal,enquiry-desk}.webp` (16:10
  covers) and `operations-portal-tall.webp` (4:5, the home page's tall card).
- Modified: `app/globals.css` (frames, case study, index styles), `lib/nav.ts`
  (Work in the nav), `components/site/SiteFooter.tsx` (Work → /work/),
  `app/sitemap.ts`, `app/services/[slug]/page.tsx` ("See it working"),
  `components/chapters/Work.tsx` (home section reads the registry),
  `lib/content.ts` (the old placeholder `WORK` list removed).
- `npm run build` passes with it. It has NOT been reviewed visually in full,
  linted, Pages-built, committed or pushed.

---

## 1. Finish increment 2 — Work

### 1.1 Fix what the last review found

1. **The booking close-up numbers itself twice.** In `Stories.tsx` the pins
   (1, 2, 3, `.cs-pin`, hard-coded pixel positions) sit next to the booking
   widget's own green step circles (1, 2, 3). Fix it properly:
   - Give `Booking` (in `components/demos/practice/Practice.tsx`) an
     `annotate?: boolean` prop. When set, hide its own step circles
     (`.step b`) and render each pin inside the element it annotates (step 1's
     paragraph, the day row, the confirm button) — absolutely positioned
     (e.g. `left: -38px`) inside a `position: relative` wrapper — so the pins
     follow the layout at every width.
   - Delete the hard-coded `.cs-pin` positions in `Stories.tsx`.
   - On phones (`@media (max-width: 900px)`) put the pins at `left: -6px` /
     inside, or hide them and keep the numbered notes only.
   - Check: the three notes on the right still match pins 1, 2, 3.
2. **Hyphens and dashes in the display face.** In the downscaled shots,
   "owner-run" and the em dashes in the work index titles looked missing.
   Check at full size (crop the screenshot, don't downscale). If Bodoni
   Moda's hyphen/dash really is too thin at that size, set those glyphs in
   the title with `font-weight: 500` (wrap in a span) or write the titles
   without the punctuation (e.g. "Tarn & Wick: a website for…" is not the
   voice — prefer fixing the glyph weight). Same check on the case study h1s.
3. **Demo headings pollute the page outline.** The demos use `h3`/`h4` for
   their own fake page titles ("Know your numbers before the year is out").
   Screen-reader users then hear them as sections of the case study. Change
   every `h3`/`h4` inside `components/demos/**` to `p`/`div` with the same
   class (styles are on classes, so nothing looks different).
4. **Nested scrolling on touch.** Each `.dev-screen` scrolls inside the
   page. On a phone a 560 px scroll area inside the page traps the thumb.
   Keep the top demo (`.cs-stage`) scrollable (it's the one to try), and stop
   the illustrative frames scrolling on touch:
   `@media (pointer: coarse) { .cs-views .dev-screen { overflow: hidden; } }`.
   Add a one-line hint under the top demo on phones ("Scroll inside the frame
   to see more"). Test by swiping in a phone emulation.
5. **Reduced motion inside demos.** `portal.module.css` `.row[data-flash]`
   animates; add `@media (prefers-reduced-motion: reduce) { .row[data-flash] { animation: none; } }`.
   (The enquiry log already respects it.)
6. **Unused things.** Remove `public/work/cover-1.jpg`, `cover-2.jpg`,
   `cover-3.jpg` after `grep -r "cover-[123]" app components lib content`
   returns nothing. Remove Portal's unused `compact` prop (or use it). Remove
   the `.work-card[data-placeholder]` CSS if nothing sets it any more.

### 1.2 Review everything you haven't looked at yet

Build plain, serve `out/` on 3100, then:

- `MSYS_NO_PATHCONV=1 node tools/qa/pages.mjs http://127.0.0.1:3100 <tmp>/d 1440 900 "/work/,/work/practice-website/,/work/operations-portal/,/work/enquiry-desk/"`
- the same at `390 844`, and `/work/` at `768 1024`.
- Crop and read every shot at a readable size (`crop.py`, `sheet.py`). Check:
  the top demo frame is 700 px tall on desktop and readable; the
  "Studio demonstration · X is fictional" label; meta row (services link,
  type, year); the brief, scope, approach, "Up close", "What it demonstrates
  / What it doesn't", the next-project and service cards, the closing.
- **Click through each demo yourself** in headless Chrome (or the browser
  pane, visible): Tarn & Wick (Book a call → topic → day → time → name →
  Confirm → "You're booked"; Services → Tax & compliance; the burger menu at
  phone width), Kerrow (open a job → back; Client → Approve quote → the
  green "approved" state → Team → J-2035 now says Approved; Pay), Pellow (all
  three emails through every step; edit the draft; Hand to a person; Back).
- `node tools/qa/kbd.mjs http://127.0.0.1:3100/work/enquiry-desk/ 60` — every
  focus stop visible; the demo's buttons show the indigo focus ring.
- `node tools/qa/overflow.mjs http://127.0.0.1:3100` with the work pages
  added to its list — no sideways drag at 320/375/414/768.
- The home page: `homecheck.mjs` (no errors), then screenshots of the Work
  sheet at 1440 and 390 (`?at=work:0.3&freeze=1` lands on it): covers
  anchored top-left, the middle card shows the phone image on wide screens,
  the "Studio demonstration" badge fits, every name links to its case study,
  "All the work →" is there. Hover a cover: the white glint (`.work-shine`)
  still runs.
- `/services/websites/` etc.: the "See it working" card shows the right cover
  and opens the right case study.

### 1.3 Ship it

`npx tsc --noEmit -p .` → `npx eslint app components lib content` (0 errors)
→ `npm run build` → Pages build → `grep` the Pages build for
`<link rel="canonical"` in `out/work/practice-website/index.html` (must be the
github.io address) → commit (suggested title: "Round 17, part 2: Work — three
working studio demonstrations and their case studies") → push → wait for the
deploy → `node tools/qa/live.mjs` (add the work URLs to its list).

---

## 2. Increment 3 — Methodology, in five stages

Rebuild `app/methodology/page.tsx` around five stages, each saying **what
happens, what you bring, what we produce**, and when it typically happens.
Keep the page's existing editorial structure (hero, banner, stages against
film stills, principles, what is yours, more) — it was liked.

### 2.1 Content (replace `STAGES` in `lib/content.ts`; extend its type)

Type: `{ n, title, line, happens: string, bring: string[], produce: string[], when: string, image, imageAlt }`.

Draft copy (plain, consistent with the rest of the site — adjust lightly,
don't add promises):

1. **Discover** — *Understand the business before touching the website.*
   Happens: a thirty-minute call and the free audit: we look at what you have
   the way your customers do, how enquiries arrive today, and what's slowing
   you down. Bring: half an hour; access to the current site, analytics and
   the tools you use; a few real enquiries, good and bad. Produce: the audit
   write-up (what works, what costs you enquiries, what we would build), your
   goals and constraints, written down. When: day 1–2.
2. **Define** — *Agree exactly what's being built.* Happens: we turn it into
   a written scope — pages and screens, features, integrations, who supplies
   which content, how success is judged, the milestones — and a fixed quote
   and date. Bring: decisions on priorities; who signs off; any dates that
   can't move. Produce: the scope, the fixed quote and the launch date, a plan
   of who does what. When: within a few days of the call.
3. **Design** — *See it working before it's built.* Happens: the page plan,
   the words (written with you), and a clickable prototype with your real
   content. Bring: the facts only you know; feedback within the agreed
   windows; brand files. Produce: a page plan, the copy, a clickable
   prototype you approve. When (typical website): from day 3.
4. **Build** — *Engineered properly, connected to your tools.* Happens:
   production code, the editor your team will use, integrations and
   automations, testing on real devices, accessibility and speed checks, a
   review link you can click. Bring: access to the systems it connects to;
   test data; time to try it. Produce: the working site or platform on a
   review link, and its test results. When (typical website): to day 11.
5. **Launch and care** — *Live, handed over in your name, and looked after.*
   Happens: the launch checklist (old addresses redirected, analytics and
   search set up, backups on), handover and training, then care as agreed.
   Bring: domain and hosting access in your name; the people to train.
   Produce: the live site; every account, the code and the content in your
   name; plain notes on how it all works. When (typical website): day 14.

Under the stages, one plain line: *"These are typical for a website. A
platform or an automation is planned stage by stage in its own quote."* This
keeps the existing "about fourteen days" promise honest without making it
universal. **The fourteen-day promise itself is the client's to confirm**
(it's in the FAQ, the home Process sheet and the service FAQ) — don't change
it until they do.

### 2.2 Images

The page has four stage images (`public/method/{discover,design,build,live}.webp`,
4:5, film stills). Define needs a fifth. Render candidates with
`node tools/qa/still.mjs <base> <tmp> "2.6,3.1,3.3,1.62" 1440 900 1.667 9000`,
make a contact sheet, choose the frame that reads as "pieces finding their
places" (F ≈ 3.1, just before the exploded view snaps exact, is the likely
one), crop 4:5 on the subject like `svcimg.py` does, save as
`public/method/define.webp` (≤ 40 KB, quality ~82). Keep the 1.06 → 1
zoom-in reveal (`.ms-img`).

### 2.3 Also

- Per stage, render "Bring" and "Produce" as two short lists side by side
  (`.ms-points` style, two columns ≥ 900 px, stacked below).
- The home page's Process sheet (`components/chapters/Process.tsx`,
  `PROCESS` in `lib/content.ts`) is updated in increment 5 to match the five
  stage names — don't leave the home page and the methodology page saying
  different things for long (do 2 and 5.3 close together).
- `metadata` description: drop "in about fourteen days" from the meta
  description (keep it in the body) — search snippets shouldn't carry an
  unconfirmed promise.
- Acceptance: five stages, each with happens / bring / produce / when; five
  images; desktop + phone screenshots reviewed; methodology Q&A link works.

---

## 3. Increment 4 — the blog

### 3.1 Structure

- `content/blog/index.ts` — the registry: `ArticleMeta = { slug, title,
  description (≤ 155 chars, for search), short (the 2–3 sentence answer shown
  at the top), topic: "websites" | "platforms" | "automation", published
  (ISO date), updated? (only when genuinely revised), minutes, cover?,
  related: { services: slug[], work: slug[], articles: slug[] }, sources:
  { title, publisher, url, accessed }[], status: "published" | "draft" }`.
- `content/blog/<slug>.tsx` — each article: `export const toc = [{ id, title }]`
  and `export default function Body()` built from the shared components
  below. Typed TSX, no MDX (no new build dependency).
- Only `status: "published"` articles are built (`generateStaticParams`
  filters; `dynamicParams = false`) → drafts never reach the index, the
  sitemap or search.
- Routes: `app/blog/page.tsx` (index), `app/blog/[slug]/page.tsx` (article),
  optionally `app/blog/feed.xml/route.ts` (`dynamic = "force-static"`, RSS 2.0).
- Components (`components/blog/`): `ArticleLayout` (crumbs Home / Blog /
  title; topic; h1; the short answer in a quiet bordered box; byline
  "Nerodyn studio" linking to `/studio/`; published (and updated) dates in
  `<time>`; reading time; the contents list (sticky on wide screens, from
  `toc`); the body; sources; related services/work/articles; one contextual
  ask at the end — "Want a straight answer about your own site? Start with
  the free audit"), `H2` (id + anchor link), `Figure` (+ caption), `Callout`,
  `Steps`, `Compare` (a simple two-column table), `Sources`.
- Styles: a `.prose` block — 18 px Instrument Sans, line-height 1.7, max
  width ~68ch, h2 in Bodoni 400 at ~40 px, h3 Bodoni 500 at ~24 px, lists
  with indigo markers, tables with hairlines, figures with 20 px radius and
  the hairline border, captions 14 px muted. Phones: 17 px.
- `BlogPosting` JSON-LD per article matching what's visible: `headline`,
  `description`, `datePublished`, `dateModified` (= updated ?? published),
  `author: { "@type": "Organization", name: "Nerodyn", url: <studio> }`,
  `publisher: { "@id": "<site>/#org" }`, `image`, `mainEntityOfPage`. Plus
  breadcrumbs (`Page` does it). Add `pageMeta({ type: "article", published,
  modified })`.
- Index: hero; one featured article (newest, large, with its cover); topic
  filter (All / Websites / Platforms / Automation — client-side filter like
  `WorkIndex`, every card in the HTML); the rest as a dated list. With six
  articles there's no pagination; when there are more than ~12, add static
  `/blog/page/2/` routes (crawlable), never infinite scroll. No empty topic
  pages.
- Images: film stills (render new ones with `still.mjs`; each article gets
  a different frame) or simple diagrams drawn as inline SVG in the brand's
  ink/indigo (decision trees, field maps, before/after flows). No stock
  photos, no AI-generated pictures of people.
- Navigation: add **Blog** to `NAV` (`lib/nav.ts`). Six links + the pill won't
  fit the home nav at 1100–1280 px: make NAV `Services · Work · Methodology ·
  Blog · Contact` and move Studio to the footer only (it's already there).
  Check the nav at 1100, 1280 and 1440 widths on the home page and a sub-page.
- Footer: add Blog to the Studio column. Sitemap: blog index + articles
  (`lastModified` = updated ?? published).

### 3.2 The six launch articles

Each 1,600–2,200 words, written for owners of small and medium New Zealand
businesses, in the site's voice (plain, specific, no hype, no invented
statistics). Every factual claim either comes from experience-based
reasoning or is checked against a primary source fetched during writing and
listed under Sources (title, publisher, URL, date accessed). If a source
can't be fetched and confirmed, cut the claim. Each ends with related
services/work and one ask.

1. **Website redesign or targeted improvements: how to decide** (websites)
   - Short answer: rebuild when the foundations are wrong (what the site
     says, how it's structured, a platform you can't change, accessibility or
     speed you can't fix in place); improve in place when the foundations are
     sound and specific pages underperform.
   - Sections: the question behind the question · signs the foundations are
     sound · signs you need a rebuild · a one-week diagnosis you can do
     yourself (analytics journeys, top landing pages, a phone test, a speed
     check, search queries, walking your own enquiry path) · the targeted
     fixes that pay first (the first screen, service pages, the enquiry
     route, speed, titles and descriptions) · if you rebuild, protect what
     you've earned (content inventory, redirect map, analytics continuity) ·
     a decision table · how we'd look at yours (the free audit).
   - Diagram: a decision tree (SVG).
   - Verify: Core Web Vitals thresholds (web.dev), Google Search Central on
     site moves with URL changes and redirects, PageSpeed Insights.
2. **What a business website quote should include** (websites)
   - Short answer: the scope (pages, templates, features), who supplies the
     content, how design is approved, integrations, the accessibility and
     speed standard, launch tasks, ownership and handover, running costs,
     support, the payment schedule, and how changes are handled.
   - Sections: why quotes for "a website" differ so much · the lines a good
     quote has (checklist) · red flags (rented platforms, unclear ownership,
     "unlimited revisions", silence on content, no redirects, no running
     costs) · questions to ask before you sign · comparing two quotes fairly
     (table) · what ours includes (link `/pricing/`).
   - No legal advice. Don't state what consumer law requires unless a
     government source (e.g. consumerprotection.govt.nz) is fetched and quoted
     accurately — safer to leave law out.
3. **When your business needs a client portal** (platforms)
   - Short answer: when the same questions, documents and approvals pass
     between you and your clients often enough that email has become the
     bottleneck — and your clients would rather look things up themselves.
   - Sections: what a portal is (and isn't) · five signals (status questions,
     chasing documents, approvals by email, typing data twice, after-hours
     requests) · off-the-shelf or custom (honest: often off-the-shelf is
     right; a comparison table) · what the first version should do (the
     smallest useful version) · security and privacy basics (accounts, MFA,
     roles, an audit trail, NZ Privacy Act 2020 IPP 5 on storage and
     security) · judging whether it worked (measured after launch, by you) ·
     an example: the Kerrow demonstration (link).
   - Verify: Privacy Act 2020 information privacy principles (privacy.org.nz),
     MFA advice from NCSC NZ / Own Your Online.
4. **Connecting your website to your CRM and booking tools** (platforms)
   - Short answer: connect them so each piece of information is entered
     once — forms into the CRM, bookings into the calendar and the CRM,
     payments into accounting — using each tool's official integration,
     with a field map and alerts for when something fails.
   - Sections: what "connected" saves (double entry, lost leads) · the
     common connections · native integration vs a connector service vs a
     custom API integration (trade-offs table) · mapping the data (an example
     field map table) · consent and privacy (marketing consent and the
     Unsolicited Electronic Messages Act 2007; the Privacy Act) · what breaks
     and how you'll know (monitoring, retries, alerts) · a checklist.
   - Verify: UEM Act basics (dia.govt.nz), Privacy Act principles. Name no
     specific vendor's features unless checked in its own documentation.
5. **Five practical AI automation workflows for NZ businesses** (automation)
   - Short answer: start with work that is frequent, follows rules and can be
     checked — enquiry triage and drafting, reading details out of documents,
     notes from calls into the CRM, a website assistant that answers from
     approved information, and searching your own documents — with a person
     approving what matters.
   - Sections: what makes a task a good fit (a scoring table: frequency,
     rules, checkability, harm if wrong) · the five workflows, each with what
     it does, where a person stays in the loop, what can go wrong, what you
     need to start · the privacy part (what data goes where; offshore
     processing; the Privacy Commissioner's guidance on AI) · costs (build +
     usage-based running costs) · how to start (a pilot on past data, judged
     against real examples) · link the Pellow demonstration.
   - Verify: Office of the Privacy Commissioner guidance on generative AI and
     the IPPs (privacy.org.nz), IPP 12 (cross-border disclosure), the
     notifiable privacy breach rules. No productivity statistics.
6. **After launch: website ownership, hosting and support** (websites)
   - Short answer: own the domain, the code, the content and every account in
     your own name; know where it's hosted, how it's backed up and who fixes
     what; then choose how much ongoing care you want.
   - Sections: what owning your website really means (domain registrant, code
     repository, editor admin, analytics, email/DNS) · the handover checklist
     (table) · hosting in plain words · backups and updates · security basics
     (MFA, least privilege, updates) · support models (ongoing care vs help
     when needed) · leaving a provider without drama.
   - Verify: .nz registrant facts (InternetNZ / the Domain Name Commission),
     NCSC NZ security advice.

### 3.3 Acceptance

Six published articles, each: unique title/description/canonical, the short
answer at the top, byline + dates, contents list, ≥ 1 original figure, a
Sources list of fetched-and-checked pages, related links, one ask,
BlogPosting + breadcrumb JSON-LD validated (paste the built HTML into the
Schema Markup Validator / Rich Results Test in the browser pane). Index with
featured + filter; Blog in nav, footer, sitemap; RSS validates; desktop and
phone screenshots read comfortably (measure: ~65–72 characters per line).

---

## 4. Increment 5 — the home page, recomposed (the careful one)

Goal: a home page people finish, with the film untouched. The film's own
chapters are fixed at 14.5 screens (hero 100 vh + statement 180 + build 414
+ why 436 + finale 320); page sheets add the rest (~4.5–5 screens now). The
plan's "10–12 screens" target cannot be met without compressing the film,
which the client has rejected before ("too fast, not smooth"). **Realistic
target: ~17 screens before the footer at 1440×900** — measure before and
after (`document.documentElement.scrollHeight / innerHeight`).

### 4.1 Take the FAQ sheet off the home page

Everything that references it (as of this writing):
- `lib/chapters.ts`: the `faq` entry in `RAW` (num "06") and `"faq"` in the
  `ChapterId` union. Remove both. Renumber `audit` to `"06"` (numbers are
  read everywhere from `chapter(id).num`, so the rail, the markers, the menu,
  the counter "0x/06" and the footer marker follow automatically).
- `app/page.tsx`: remove `<Faq />` and its import.
- `components/chapters/Faq.tsx`: delete (the questions live at `/faq/`).
  `FAQ` in `lib/content.ts` is still used by `FAQ_ALL` (`QA` lookup) — keep it.
- CSS: `.faq-grid`, `.faq-head`, `.faq-ask` and their phone rules
  (`app/globals.css` ~3123, ~3462) — remove once nothing uses them.
- Nothing else refers to the faq chapter (checked: no `chapter("faq")`, no
  `#faq` links; `Here` in `lib/nav.ts` keeps `"faq"` for the /faq/ page).

What follows automatically (verify, don't assume): `holds` (the run of
sheets after Why becomes just Process), page S of the audit chapter, the
footer's `FOOT_S`, auto-framing anchors (REST_FILM is film time — unchanged;
page tops and hold ends are measured), `jumpS` for the rail. The film at any
given film time must be pixel-identical: `domstills` at
`F = 1.62, 3.72, 4.9, 5.45, 7.62, 9.3, 10.75, 11.5` before and after →
`pixdiff` max ≤ 2/255. Then record a real wheel scroll from Why through
Process into Let's talk (`scrollhitch.mjs`-style, and watch it) — the sheet
must still rise over the held colossus and leave cleanly into the finale.

### 4.2 Make Process compact

`components/chapters/Process.tsx` becomes one band: the five stage names
from the methodology (2.1) in a single row with their numbers and a
one-line each, the hairline that fills as you read (keep that — it was
liked), and "Read the methodology →". Target ≤ 1 screen at 1440×900 and ≤ 1.6
screens on a phone. It's a page sheet, so its height is measured — nothing
else to change. Check the film holds under it exactly as before.

### 4.3 Give the film chapters doors to the pages

- Build ("What we build"): each discipline's panel gets one link, "Explore
  websites →" / "Explore platforms →" / "Explore AI automation →", under its
  deliverables. Keep it in the text column (nothing crosses the 3D), small
  and quiet (`.text-link`). Links inside `.front` already get
  `pointer-events: auto`.
- Why: under the three claims, "How we're set up →" to `/studio/`.
- The finale and the footer form stay as they are (the client approved
  them in round 16).
- The hero stays: "Get a free audit" (primary) and "Enter the story" (ghost).
  The plan suggested "Discuss your project / Explore our work" — that changes
  the client's chosen offer; propose it to the client, don't do it unasked.

### 4.4 Accept

Page length measured and reported; `pixdiff` proof; scroll recording
reviewed; rail shows 00–06; menu "On this page" lists six chapters; keyboard
walk on home (`kbd.mjs`) clean; `qa3b.mjs` + `homecheck.mjs` clean at 1440
and 390; reduced motion (`reduced.mjs`) still works; `CLAUDE.md` updated
(site shape, chapter table, rest frames text "the film holds at 9.3 under How
we work").

---

## 5. Increment 6 — the quality pass (make it bulletproof)

### 5.1 Speed (targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1)

- Measure every page type (home, a service page, a case study, an article,
  contact) on the live Pages site with throttling like Lighthouse mobile:
  CDP `Network.emulateNetworkConditions` (latency 150 ms, ~1.6 Mbps down,
  ~750 kbps up) and `Emulation.setCPUThrottlingRate` 4. Read LCP and CLS from
  `PerformanceObserver` (`largest-contentful-paint`, `layout-shift`, buffered),
  INP from `event` entries after real clicks (menu, filter, form chip, demo
  buttons). Or run `npx lighthouse` (ask before installing anything). Record
  conditions and numbers in `docs/`.
- **The home page's LCP is the risk**: the loader covers the page until the
  3D compiles (~3.5 s on this machine first visit), and the hero's words are
  hidden until the intro runs. LCP does not account for being covered, but
  it ignores text at opacity 0. If LCP > 2.5 s, the fix with **no visible
  change** is to paint the hero headline (and its lines' final positions)
  at opacity 1 *under* the opaque loader so its first paint is early, while
  the intro animation still reveals it visually afterwards. Prove no visible
  change with pixdiff of the intro frames, and confirm the intro still looks
  identical in a screen recording. Do NOT shorten the loader or skip the
  shader warm-up — that's what made the first visit "absolutely perfect".
- Sub-pages: confirm no three.js / stage chunk / Lenis is downloaded (check
  the network list of `/blog/<slug>/`). Images: every `img` has width/height;
  below-the-fold images `loading="lazy"`; covers ≤ ~120 KB.
- Fonts: confirm only the weights/axes used are downloaded; `display: swap`
  is set; no layout shift from font swap on the sub-pages (CLS).

### 5.2 Accessibility (WCAG 2.2 AA)

- Run axe-core on every page type (add `axe-core` as a devDependency only
  with permission; inject `node_modules/axe-core/axe.min.js` with puppeteer's
  `addScriptTag({ path })`). Fix all violations.
- **Contrast**: muted small text set at ≤ 55 % ink on paper is about 4.2:1 —
  under the 4.5:1 AA minimum (e.g. `.sp-meta` 50 %, `.crumbs` 55 %,
  `.wk-kind`, `.cs-note`, `.ct-direct`, `.svc-line`-style captions). Raising
  them to ~62 % ink passes and is barely visible — but it is a visual change,
  so **ask the client first**, showing before/after crops. (The `--dusk`
  rule still applies: never hard-code rgba ink/paper — use `color-mix`.)
- Keyboard: `kbd.mjs` on every page type; focus never hidden behind the
  sticky header (`scroll-padding-top` is set); the demos' buttons all
  reachable; the phone menus trap focus and restore it (already true — keep).
- Reduced motion everywhere (`reduced.mjs`; sub-pages show content with no
  reveal transitions — `[data-rv]` rule exists). No-WebGL: launch Chrome with
  `--disable-webgl --disable-3d-apis` and confirm `html[data-nowebgl]` gives a
  complete, readable home page (POTENTIAL filled, no stage, no errors), and
  that every jump/link still works.
- Language: `lang="en"`; consider `en-NZ` (spelling is NZ/UK: "organise",
  "colour") — a one-line change in `app/layout.tsx`.

### 5.3 Phones and browsers

- Every page at 320×568, 360×640, 375×667, 390×844, 412×915, 430×932, and a
  768×1024 tablet: `overflow.mjs` (no sideways drag), `heroclash.mjs`, full
  screenshots read at a readable size.
- Known open item (the client said not to stress about it): on the smallest
  screens (320 px wide), the hero description's last line touches the hero
  buttons and the "00/0x" counter sits on the ghost button. If fixing:
  under `(max-width: 359px) and (max-height: 700px)`, lower the hero
  description's font by 1 px and move the counter up above the actions.
  Screenshots before/after; nothing above 360 px may change.
- Safari: the site can't be tested in Safari here. Ask the client (or anyone
  with an iPhone and a Mac) to open the live site and the three demos, and
  report anything odd. Things most likely to differ: `container` queries
  (Safari 16+ fine), `inert` (Safari 15.5+), `color-mix` (16.2+), WebGL
  compile time.

### 5.4 Forms and failure paths

With the endpoint mocked: success; validation (each field); project intent
needs a description; server error → the pre-written email link; timeout
(make the mock never answer → after 15 s the error state appears); retry
after an error; the honeypot (filled → "sent", nothing posted). Then the
client does ONE real submission and clicks FormSubmit's "Activate Form" email
— until then, real submissions wait.

---

## 6. Increment 7 — search and the move to nerodyn.com

Nothing here happens without the client's go-ahead and access.

1. **Before the move** (on the preview): every page has a unique title and
   description (`pageMeta`), canonical, share card; `sitemap.xml` lists every
   published page and nothing else; JSON-LD validates; the preview is
   `noindex` (keep it that way).
2. **Inventory the current nerodyn.com**: fetch its sitemap / crawl its
   links; list every URL; map each to its new page. Same path where
   possible. GitHub Pages cannot send 301 redirects. If more than a handful
   of URLs change, recommend hosting on Cloudflare Pages or Netlify (both
   free tiers serve a static export and support real 301s via `_redirects`);
   otherwise keep paths the same. Decision for the client.
3. **Switch**: set `NEXT_PUBLIC_SITE_URL=https://nerodyn.com` and an empty
   `NEXT_PUBLIC_BASE_PATH` in the deploy workflow; add `public/CNAME`
   containing `nerodyn.com` (GitHub Pages); point DNS as GitHub's docs say
   for an apex domain (check the current A/AAAA records in GitHub's docs at
   the time — don't copy old numbers); enforce HTTPS; check `robots.txt`,
   the sitemap, canonicals and share cards all say nerodyn.com; check the
   preview stays noindex or is retired.
4. **Search Console**: verify the domain (DNS TXT record), submit
   `https://nerodyn.com/sitemap.xml`, watch Coverage and Page Experience for
   two weeks, fix anything flagged. Add `verification` in `metadata` only if
   the meta-tag method is used.
5. **Analytics** (if the client wants it): a privacy-friendly, cookie-less
   option (e.g. Plausible, Fathom or Umami). Update `/privacy/` to say
   exactly what's collected *before* switching it on; don't count the
   preview.

---

## 7. Decisions only the client can make

Ask these together, with a recommendation each (don't send a menu):

1. Sign-off on all copy (home, services, studio, investment, contact, work,
   methodology, FAQ, articles) — especially "about fourteen days" and "we
   reply within two days".
2. The three real projects for Work (name, client's permission, what
   changed, real screenshots, real results if measured) — they replace or
   join the studio demonstrations using the same case-study layout
   (`kind: "client"`, and `limits` becomes `results`).
3. A testimonial or two (real, attributed, with permission).
4. Prices: stay unpublished (recommended) or a "projects usually start from"
   line.
5. Contrast fix for small muted text (5.2) — before/after crops.
6. The hero's actions — keep "Get a free audit / Enter the story"
   (recommended) or the plan's "Discuss your project / Explore our work".
7. Hosting for nerodyn.com (GitHub Pages vs a host with real redirects),
   DNS access, Search Console access.
8. Social links (`CONTACT.linkedin` / `instagram` in `lib/content.ts` — hidden
   until filled in), the brand font if different, a legal review of
   `/privacy/` and `/terms/` (written for New Zealand).
9. The one FormSubmit activation click.

---

## 8. Keep the documentation true

After each increment:
- `CLAUDE.md`: add a ROUND 17 section like ROUND 16's (pages, registries,
  demos, blog, home recomposition, verification tools in `tools/qa/`), and
  update SITE SHAPE (the chapter table without faq, nav, numbering) and
  "Still owed by the client".
- `docs/ROUND17.md`: mark increments done; then fold it into `CLAUDE.md` and
  delete it at the end.
- This file: tick items off; delete it when everything is done.
- Memory (`~/.claude/projects/.../memory/nerodyn-site-direction.md`): one
  line on round 17 and where the brief lives.

---

## 9. Definition of done ("perfect")

The site is finished when every line below is true and checked, not assumed.

**Film and feel**
- [ ] The home film is pixel-identical to round 16 at every rest frame, and
      scrolls with no frame over 50 ms (warm) — proven, not eyeballed.
- [ ] First visit: loader → mark handoff as now; no stall; LCP ≤ 2.5 s on
      the throttled profile (or the client has accepted the measured value).
- [ ] Reduced-motion and no-WebGL visitors get a complete, readable site.

**A sensible business site**
- [ ] Anyone can tell in five seconds what Nerodyn does and how to start.
- [ ] Every page reachable from the nav or footer; no dead link (crawl all
      internal links and check status 200); unknown URLs → the branded 404.
- [ ] Services ×3, Work (index + every case study with a working demo),
      Methodology (5 stages), Studio, Investment, Contact, Blog (6 articles),
      Questions, Privacy, Terms — each reviewed at desktop and phone size.
- [ ] Every "free audit" lands on the form; the form works, fails safely and
      has been activated.

**Craft**
- [ ] Same paper, ink, indigo, type and spacing on every page; no page looks
      templated or out of family; images are film stills, live demos or
      original diagrams — nothing stock.
- [ ] Copy signed off; no invented number, client, testimonial or result.

**Everyone can use it**
- [ ] axe: 0 violations on every page type; keyboard walk clean everywhere;
      contrast decision made and applied.
- [ ] No sideways drag at any width from 320 px; nothing clipped.

**Found and trusted**
- [ ] Unique titles/descriptions/canonicals; sitemap complete; JSON-LD valid
      (Organization, Service, FAQPage, BreadcrumbList, BlogPosting).
- [ ] On nerodyn.com: HTTPS, old URLs mapped, Search Console verified and the
      sitemap accepted; the preview noindex or retired.

**Kept true**
- [ ] `CLAUDE.md` describes the site as it is; this file deleted.

---

## 10. Gotchas that cost time (keep these in mind)

- Git Bash rewrites arguments starting with `/` into Windows paths: use
  `MSYS_NO_PATHCONV=1` for the Pages build and for any script given `/path/`
  arguments.
- Heredocs in Git Bash break when the content has an apostrophe; write files
  with the editor tool. Never run `python -` (hangs) — write a `.py` file.
- `out/` must be a plain build for local tests; the Pages build 404s locally.
- Turbopack dev can serve stale CSS (see `CLAUDE.md` gotcha 2); the static
  export is the reliable thing to test.
- Request interception (used to mock the form) makes the home page's 3D
  load crawl — test the home page without it.
- The desktop app's browser pane pauses animation when hidden.
- In the demo CSS modules, `.root button` resets padding/background with
  specificity (0,1,1); any button class must be written `.root .x` (or more
  specific) to win — the Kerrow job rows lost their padding to this once.
- The cover pipeline converts every PNG in its folder — keep only the three
  cover PNGs there (a stray `portal-phone.webp` ended up in `public/` once).
- The auto-mode safety check sometimes has outages ("no verdict"); retry
  once, do read-only work in between, and never leave the tree half-edited
  across a stop — finish or revert the edit you're in.
- Never push anything you haven't looked at in a screenshot.
