# Overnight runs (2026-10-20 20:00 → 2026-10-21 06:50 NZDT)

The owner asked for the rest of this week's usage to go into the site
overnight. A scheduled task in the desktop app ("nerodyn-overnight", every
10 minutes, plus one-off starts just after each usage reset) starts a
fresh, unattended session; this file is its brief. **Nobody is awake to
answer questions.** Work carefully and well; never leave the live site
broken (every push to master deploys it to GitHub Pages).

Stop for good at **2026-10-20T17:50:00Z** (06:50 NZDT, just before the
weekly limit resets). After that time a session does nothing at all.

Backups: tags `pre-round26` (before 2026-10-20's story rebuild) and
`autorun-start-2026-10-20` on origin. Never move or delete them.

## The protocol (every session, in this order)

1. **Time.** `date -u +%Y-%m-%dT%H:%M:%SZ`. At or past the stop time: if
   the tool is there, disable the task (`mcp__scheduled-tasks__update_scheduled_task`,
   taskId `nerodyn-overnight`, enabled false), then stop.
2. **Usage.** `mcp__ccd_session_mgmt__get_usage`. Stop if "Weekly · all
   models" is 99% or more, or the "5-hour limit" is 96% or more. Check again
   after every commit and every half hour; past those marks, wind down (step 8).
   From 90% of the 5-hour window, start only steps that can be finished and
   shipped in a few minutes. Hitting a limit mid-step is survivable (the next
   session finishes or stashes it), but a clean stop is better. The task
   retries every 10 minutes, so after a reset a new session picks up within
   about ten minutes.
3. **The lock** (`.autorun/lock.json`, git-ignored, never committed). If it
   exists and its `heartbeat` is less than 25 minutes old, another session
   is working: stop at once and change nothing. Otherwise create `.autorun/`
   if needed and write `{"holder": "<short id>", "heartbeat": "<now, ISO UTC>"}`.
   Rewrite the heartbeat at least every 10 minutes, and right before and
   after every build or other long command (a stale lock is how the next
   session knows you are gone).
4. **Git.** `git fetch origin`, `git status -sb`.
   - Uncommitted changes (a session that hit its limit mid-step): read
     `git diff --stat`, the diff and the log below. If they are a finished,
     coherent change, run its checks (step 6) and commit and push if they
     pass. If not, `git stash push -m "autorun: unfinished <time>"`
     (tracked files only; never discard work) and note it in the log.
   - Behind origin with a clean tree: `git pull --ff-only`. Diverged: write
     it in `.autorun/notes.md` and stop.
5. **Choose** the first backlog item below that the log does not mark done
   (an item may take several sessions; the log says how far it got). Read
   what the item points to first. CLAUDE.md is the project's memory and its
   rules are binding; docs/BLOG-GUIDE.md binds all copy.
6. **Work in small, finished steps; check each one before it ships:**
   - `npm run build` must pass (it runs the copy guard: no em dashes, no
     banned phrases, links, sources, alt text).
   - Serve the build: `node tools/qa/serve-out.mjs 3100` (in the
     background; reuse it if it already answers on 3100). Then the page
     checks that cover what you changed (`tools/qa/`: `overflow.mjs`,
     `blog.mjs`, `work.mjs`, `live.mjs`, `vitals.mjs`, axe via the scripts
     that have it; `story.mjs`, `story-camera.mjs`, `story-overlap.mjs` for
     /story/). Read a script's header before running it.
   - **Look before you push**: a before and after still of what changed
     (headless Chrome with `--use-angle=d3d11 --ignore-gpu-blocklist --enable-gpu`;
     `tools/qa/story-stills.mjs` and `tools/qa/sheet.py` show how), desktop
     1440x900 and phone 390x844. One contact sheet per change, kept in a
     temp folder, never in the repo. If it is not clearly better, do not
     ship it.
   - The home film (`components/stage`, `lib/choreo.ts`, `shaders/`): judge
     motion in motion (a scroll recorded with a CDP screencast), and after
     any change run a real wheel scroll through the whole page and check the
     longest frame gap (CLAUDE.md "Never let the glass programs recompile
     mid-film").
7. **Ship** each finished step: stage files by name, commit (what and why,
   plain words, ending with
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`), add a line to
   the log below in the same commit, `git push origin master`. Before
   pushing, `git fetch` again: if origin moved, `git pull --ff-only` and
   rebuild; if that fails, stop (note it). Then check usage (step 2).
8. **Wind down** (usage marks, the stop time, or your context running out):
   leave the tree clean (committed, or stashed with a note), add a log line,
   delete `.autorun/lock.json`, stop.

## Never

- `git reset --hard`, `git clean`, `git push --force`, rebasing or
  rewriting history, deleting or moving tags or branches, `git add -A` or
  `git add .` at the root; `rm -rf` of anything but `out/` and `.next/`.
- Touch the owner's untracked files: `Gemini_Generated_Image_*.png`,
  `blog-shots/`, `new_logo.svg`, `photos-before-after.jpg`,
  `claude-usage(for CLAUDE ONLY).js`, `tools/qa/photos/cand/`,
  `tools/qa/photos/orig/`, `tools/qa/photos/__pycache__/`.
- Install or upgrade packages, change system, app or permission settings,
  touch anything outside this repository (temp folders excepted), send email
  or messages, submit the live form (mock formsubmit.co), publish anywhere
  but this repository's master.
- Make the preview indexable: the GitHub Pages copy stays `noindex` until
  the domain moves (CLAUDE.md).
- Invent facts, clients, results, numbers, quotes or testimonials; use a
  photo that is not CC0 or public domain and recorded in `content/images.ts`
  (docs/BLOG-GUIDE.md section 6); write an em dash anywhere a reader sees.
- Revive anything CLAUDE.md lists as rejected (the home film's rejected
  list; in story mode, never a line, wire or rings in the air).
- Change the home film's concept: the stone, its shatter, the stair, the
  turbine, the colossus, the white studio, the paper sheets. Iterate inside
  it (framing, timing, smoothness, finish), never replace it.

## The backlog (in the owner's order)

1. **The home hero** (`components/home/Hero.tsx` and the hero's framing in
   `lib/layout.ts` / `lib/choreo.ts` at S 0): make the stone a bit bigger
   and further to the right (the hero's words must stay clear of it, on
   phones too). Make the hover far more impressive and unmistakably say there
   is a story mode behind the stone: today the pointer carries a frosted
   "The story" lens (`StoneCursor`) and a thread of light runs down a ridge
   every ~7.5 s. Make it a moment: for example the lens grows into a clear
   invitation ("Watch the story", a play glyph, the film's length), the
   stone's inner light and veins wake under the pointer, a fine ring of light
   traces the stone's edge; a gentle hint at rest so people find it on touch
   screens too (where there is no hover). Premium and calm; no clutter.
2. **SEO and GEO** across the site: every page's title and description, Open
   Graph and share cards, structured data (validate the JSON-LD), headings in
   order, image alt text, internal links between related pages and articles,
   `sitemap.xml`, `/llms.txt` (the site for AI assistants, from the
   registries), RSS, FAQPage where questions show. Run a Lighthouse-style
   check (`tools/qa/vitals.mjs` for speed; an SEO and accessibility audit of
   every page type) and fix what it finds. The preview stays noindex.
3. **The blog, world class.** The owner: today's articles are "sloppy,
   useless, too cramped". Aim: about ten articles, every one of them perfect.
   Read docs/BLOG-GUIDE.md first (binding). Then: give the article page room
   (a comfortable reading measure, generous spacing and type, strong section
   rhythm, figures and diagrams that breathe); review every article for
   usefulness and depth (the reader's real decision, concrete steps,
   examples, a clear short answer); rewrite or cut weak ones; write new ones
   only with real sources fetched and checked tonight and cited at the end,
   each with its CC0 or public-domain cover recorded in `content/images.ts`.
   The blog home must feel like a world-class publication. Check every
   article with `tools/qa/blog.mjs` and the build.
4. **The other pages** (work and its case studies, services, methodology,
   studio, contact, audit, FAQ): more premium, more impressive, still clean
   and sensible (CLAUDE.md site shape). Before and after stills of each.
5. **The home page's scroll animations**, "improved by heaps": smoother,
   richer transitions between the film's scenes and the paper sheets, the
   sheets' entrances, the type's reveals, the stone's moves; inside the
   existing concept. Recorded in motion before and after.
6. **Speed with zero visual change**: pixel diffs before and after (CLAUDE.md
   round 16), frame time, bundle size, Lighthouse performance on mobile
   (`tools/qa/vitals.mjs`, A/B against the previous build, gotcha 16).
7. **Micro-interactions and finish** across the site: hovers, focus,
   transitions, small delights that make it feel world class; consistent and
   restrained.
8. **Story mode polish** (`/story/`, docs/STORY.md): the new half in motion
   (the drop's departures, arrivals, chases; `tools/qa/story-drop.mjs`), the
   town at every rest, desktop and phone.

## Log (one line per finished step: time UTC, what, commit)

- 2026-10-20 07:00Z: story round 26 shipped (the drop; the town on its bay), c6e844d. Backups tagged.
- 2026-10-20 08:05Z (71f0665): home hero, step 1: the stone a little bigger on desktop (culet 0.88 to 0.91 H) and standing IN the last A of POTENTIAL (axis about 0.81 W at 1440, was 0.60; the A's legs frame the pavilion, the L keeps its stem); the look-up key sets off from there. Phones unchanged (the A cannot hold the stone at that width).
- 2026-10-20 08:54Z (1980d88): home hero, step 2 (the owner, live: "bigger but cover some of the text", "more similar to the one before but better"): the stone about 13% taller than the original (desktop culet 0.95 H, the apex 10 px under the nav; phones 0.29 to 0.74 H) and as far right as it can stand while still hiding part of a letter, the L keeping its stem and no more than about two letters hidden: over the A at 1440x900 (0.80 W) and 16:9 (0.72), over the L's foot on a 2:1 window (0.76 to 0.79), over the T and I on phones (0.66). Look-dev ?heroaxis=. Sheet .autorun/sheets/0854-hero-bigger.jpg.
- 2026-10-20 09:09Z (568c7ea): home hero, step 3 (the invitation): hover opens the lens into a play disc, "Watch the story" and "A five-minute film" (computed from the story's own autoplay: 288 s) within 0.2 s; the stone answers at once (inner light, ridge thread, ONE white glint climbing the stone along its edges in the stone's own space); click or tap on the stone opens /story/ (tap raycast, touch works now); phones show the invitation on the stone as a link; the keyboard reaches it and the stone wakes. Hitch clean (worst 33 ms). Sheet .autorun/sheets/0909-hero-invitation.jpg.
- 2026-10-20 09:21Z (733e098): the nav over scrolled content (director's note): every sub-page's nav is frosted paper over its whole height with a hairline that draws in over the first 64 px of scroll (CSS scroll timeline); the home nav takes the same bar only over its paper sheets and the footer (data-reading), keeping its veil over the film. Words no longer run under the links. Sheet .autorun/sheets/0921-nav-frosted.jpg.
- 2026-10-20 09:31Z (ad2847f): work covers (director's note: a cover still blank 1.6 s after scrolling into view): a 1200 px copy of each cover with srcset/sizes on /work/, the home work sheet and the services pages, and a tiny blurred preview behind each /work/ card (tools/qa/coverprev.py, content/coverPreviews.ts). Cover bytes on /work/: 720 KB to 277 KB at 1440, 546 KB to 215 KB at 390 (-62%); loaded look identical. Sheet .autorun/sheets/0931-work-covers.jpg.
- 2026-10-20 09:33Z: SEO/GEO, step 1: a new /llms-full.txt (every article's short answer, audience, sections and tools with their addresses, questions and numbered sources with check dates, in Markdown, from the registries; 38 KB), linked from /llms.txt; /llms.txt's film length now computed (it said four minutes; the autoplay runs 4.8).
- 2026-10-20 09:40Z: blog accuracy pass (3b first step), two articles, corrections from the research memos checked against their quoted sources (the new one fetched tonight): website-hacked (a misquote of Own Your Online replaced; office-ransomware "unplug the router" advice kept only as a separate office-computers case; a cut-off ransom quote made whole; NotifyUs and the self-assessment named as the two things they are; backup wording no longer quoted from a video), ai-automation-workflows (s 11: a provider that only processes for you is not a disclosure, principles 11 and 12 when it uses data for itself, new source OPC third-party guidance; breach: a legal duty, ideally 72 hours, tell the people affected; call recording is telling, not consent; the Commissioner's openness expectation keeps its condition). Source titles corrected in three articles.
- 2026-10-20 09:42Z: blog accuracy pass, what-is-seo: a claim not on Google's page cut ("checking advice against Google's documentation"); "you are responsible for the firm you hire" re-cited to Google's Do you need an SEO? page; the keyword guidance re-cited to Search Essentials in its own terms (title, main heading, alt and link text); the snippet emphasis corrected (mostly from the page, occasionally the description); spam examples now cited to Google's Spam policies page (new source, fetched tonight).
- 2026-10-20 09:44Z: blog accuracy pass, google-business-profile (part 1, no new sources needed): the short answer now says popularity, as Google's sentence does (the body and questions already did); "within a few days" for review replies had no source, now "in good time" cited to Tips to get more reviews; the account and two-step advice marked as ours. STILL OPEN for the next pass (each needs a new Google help page fetched and cited): the ownership request process (answer 4566671), one primary owner (answer 3403100), the video-verification requirements (answer 14271705).
- 2026-10-20 09:46Z: blog accuracy pass, google-business-profile (part 2): three claims re-cited to the Google help pages that make them, each fetched tonight: asking for ownership (the owner has three days to respond, then you may be able to claim), video verification (what to record, and one live unedited recording of at least 30 s on a mobile device, no ID numbers or other people's faces), one primary owner and each person on their own Google Account. Citations renumbered (10 sources).
- 2026-10-20 09:48Z: blog accuracy pass, redesign-or-improve: "nobody is sure who owns it" no longer gives a domain or hosting in someone else's name as a reason to rebuild (both can be moved into your name; links to the ownership guide); only a site locked to its provider's platform is. STILL OPEN: the domain facts from the 2014 DNC PDF (UDAI now the authorisation code) in the glossary, diy-website-or-hire and after-launch-ownership (memo: diy section 2, source 4; replacement DNC pages listed in its section 3C).
- 2026-10-20 09:49Z: blog accuracy pass, quick fixes + dates: website-quote-checklist (Google's "generally" at least a year for redirects), when-you-need-a-client-portal (breach: a legal duty, ideally 72 hours; Principle 5's real title in two articles); the seven articles revised tonight now say updated 2026-10-20 (dateModified, sitemap, RSS follow), as the SEO audit (.autorun/research/seo.md) flagged.
- 2026-10-20 09:50Z: SEO/GEO, step 2 (from the audit, .autorun/research/seo.md): the three meta descriptions outside 120 to 160 characters fixed (privacy 119 to 140, terms 111 to 142, Butter Days 161 to 156), each still true to its page.
- 2026-10-20 09:53Z: SEO/GEO, step 3 (audit: internal links): each service page's "From the blog" now shows up to six articles (was three, newest only), the buying guides first (articles mainly about the service, those answering a buyer's starting point ahead): /services/websites/ now links the quote checklist, rebuild-or-improve and DIY-or-hire it used to drop.
- 2026-10-20 09:54Z: SEO/GEO, step 4 (audit: internal links): ai-automation-workflows now links the chat-assistant article from its website-assistant workflow.
- 2026-10-20 10:01Z: SEO/GEO, step 5 (audit: no case study linked any article): every case study now ends with "From the blog: Before you build.", three articles (those that name the project, or the buying guides for its services), the same global cards as the service pages (components/work/Reading.tsx).
- 2026-10-20 10:02Z: SEO/GEO, step 6 (audit: one promise, two starting points): /services/websites/ counted "about fourteen days" from the agreed scope, while its own plan, the methodology and llms.txt count from the first call; the FAQ and the plan's lede now say from the first call, when the content is ready on time. FOR THE OWNER: this is the promise awaiting sign-off; one starting point everywhere now.
- 2026-10-20 10:03Z: SEO/GEO, step 7 (audit: glyphs glued to headings for crawlers): every article heading's anchor "#" is drawn by CSS now, so heading text reads "The first hour", not "The first hour#"; pixel-identical at 1440 and 390 (max diff 0, heading hovered).
- 2026-10-20 10:07Z: SEO/GEO, step 8 (audit: numbers glued to headings): the question lists (QaList, on the FAQ, services, audit and more) draw their 01, 02 from data-n in CSS; the question text reads clean for search engines, assistants and screen readers (its accessible name no longer starts "01"); pixel-identical at 1440 and 390 (max diff 0).
- 2026-10-20 10:48Z: SEO/GEO, step 9 (audit: numbers glued to headings, the rest): all 18 mono list numbers across 13 pages and components draw from data-n in CSS (.mono[data-n]::before) and are hidden from the accessibility tree; headings read "Getting started", not "01Getting started"; 12 pages x 2 widths pixel-identical.
- 2026-10-20 10:53Z: blog accuracy pass, domain facts: the 2014 Domain Name Commission PDF is gone from the site. after-launch-ownership (5 of its citations) now cites the .nz Rules 3.2 and the Commission's current guides (manage, change of holder, complaints, transfer), all fetched and read tonight; the UDAI is "the authorisation code (it used to be called the UDAI)", free on request, not to be withheld; complaints go to the provider first, then the Commission; diy-website-or-hire likewise (plus the business.govt.nz quote introduced as its own comparison, "whichever way you go" gone); the glossary's domain name, registrar (two unconfirmed claims dropped) and authorisation code entries. Both articles dated 2026-10-20.
- 2026-10-20 10:55Z: blog accuracy pass, CRM and chat assistant: connect-website-crm-booking (principle 3's "whether providing it is required" applies only where a law requires the collection: dropped; principle 5 worded as it reads, including 5(b) for service providers; two source titles corrected); website-chat-assistant (a live assistant's answers reach visitors unchecked, so the checklist says what stands in for review: approved wording, handover topics, a weekly read, a switch; personal details: ask visitors not to share them, use a form, a provider that doesn't keep conversations; the same in its questions). Both dated 2026-10-20.
- 2026-10-20 10:56Z: blog accuracy pass, done (last item): diy-website-or-hire no longer rests on a Squarespace FAQ about switching templates in version 7.0; leaving a builder is now cited to Wix's "Exporting or Embedding Your Wix Site Elsewhere" (a Wix site must run on Wix's servers) and Squarespace's "Export your site content" (only some content exports), both fetched tonight. The accuracy pass covers all eleven memos' corrections except website-quote-checklist's missing NZ law, which belongs in its rewrite.
- 2026-10-20 11:07Z: blog 3a, reading layout (step 1, the article): body 20px/1.65 on a 33em measure (measured 72 characters a line, was 92 at 18px); phones 18px (was 17); paragraphs spaced by the type; section headings with more air above than below; figures and tables on the full column, callouts and parts lists a step wider than the text, steps and checklists near the text. blog.mjs 17/17 (its UDAI check updated for the authorisation code); overflow clean. Sheet .autorun/sheets/1107-article-reading.jpg.
- 2026-10-20 11:16Z: blog 3a, step 2 (the blog home): the first screen leads like a publication: under the title, one article set large (LEAD in app/blog/page.tsx, now "Should you rebuild your website or improve it?") with its photograph, topic and time, title, short answer and a link; the intro line and the figures follow. blog.mjs 17/17, overflow clean. Sheet .autorun/sheets/1116-blog-lead.jpg. FOR THE OWNER: the lead is an editorial choice, one constant.
- 2026-10-20 11:20Z: SEO/GEO, step 10 (audit leftovers): no title over 60 characters (an optional seoTitle on four articles; the glossary's shortened); structured data on /work/ (CollectionPage), every case study (WebPage) and /privacy/ and /terms/ (WebPage; they had none), all parsing; the sitemap dates every page 2026-10-20 (all changed tonight; was one 2026-10-05 constant that dated case studies before they existed).
- 2026-10-20 11:21Z: SEO/GEO, step 11 (audit: FAQPage on 2 to 5 pages per question): a question that /faq/ shows is marked up there only; other pages still show it but mark up only their own questions. Now 65 questions, each marked up once (was 11 duplicated, 2 with differing answers).
- 2026-10-20 11:24Z: SEO/GEO, step 12 (audit: the home h1 read "Maximise your digital potentialMaximiseyour digitalPOTENTIALPOTENTIAL"): the hero's visible words are drawn from data-t in CSS; the h1 reads "Maximise your digital potential"; the hero's DOM pixel-identical at 1440 and 390 (canvas hidden, intro and fill done). The SEO audit's list is now done.
- 2026-10-20 11:26Z: hero invitation, second pass (director's 09:25Z note): a slightly more confident invitation: play disc 34 to 40 px, title 15 px, meta 12.5 px, a touch more padding; same calm reveal.
- 2026-10-20 11:39Z: item 4, /work/ first screen: the three concept sites as phones fanned beside the headline (from 1200 px wide; cut out of the tall covers by tools/qa/phonecut.py, ~45 KB each), each opening its study and lifting on hover; the "A closer look" row removed and the hero shortened so the filters and the first group follow at once. Clearance measured at 1280 to 1920 (35 to 96 px). Sheet .autorun/sheets/1139-work-first-screen.jpg.
- 2026-10-20 11:42Z: item 4, /services/ first screen: the hero shortened (bottom 8vh to 3vh) so the first service's photograph and its first points come into view at 1440x900.
- 2026-10-20 11:46Z: blog 3b, rewrite 1: website-quote-checklist (drafted by a subagent from the research memo, reviewed and integrated here): 2,165 words, 17 sources (was 3) all read 2026-10-20; new "What New Zealand law does and doesn't do" (quote vs estimate, the CGA's business-use limit and contracting out under s 43, unfair contract terms, the Copyright Act s 21 default for commissioned work), each with "what it means for you", not legal advice said once; a worked comparison of two quotes; a one-page brief template; every old section id kept. Build, copy-guard and blog.mjs 17/17 pass. FOR THE OWNER: the four law points deserve a lawyer's look.
- 2026-10-20 12:00Z: blog 3b, rewrite 2: website-chat-assistant (drafted by a subagent from the memo, reviewed and integrated here): 10 sections, ~2,190 words, 16 sources; new "You answer for what it says" (the Air Canada tribunal, quoted; Fair Trading Act ss 9 and 13; MBIE's chatbot scenario), a decision path, two labelled invented examples, an options and costs table, a notice template, a test script and a first-month plan; tonight's safety corrections kept. Removed in review: one Air Canada detail that rested on the memo's summary, and an inferred claim that the Health Information Privacy Code covers a physio clinic (its source dropped, citations renumbered). Glossary "chat assistant" no longer credits the Commissioner with advice its page doesn't give. blog.mjs 17/17.
- 2026-10-20 12:02Z: blog 3b, rewrite 3: website-hacked (drafted by a subagent from the memo, each claim with its source sentence in its notes; reviewed and integrated here): an incident plan (first hour, day, week: keep evidence before cleaning, close the way in before restoring, remove rogue admins and Search Console owners, get Google's warning lifted), a triage table, the Privacy Act test with a decision tree, the NCSC line, who else to call, a worked example (a cafe's website), when cleaning isn't worth it; ~2,165 words, 21 sources, every old id kept. Build, copy-guard, blog.mjs 17/17.
- 2026-10-20 12:05Z: blog 3b, rewrite 4: ai-automation-workflows (drafted by a subagent from the memo, reviewed and integrated here): the fit test, "the AI your team already uses" (what OpenAI, Anthropic, Google and Microsoft each say about business accounts and training, each cited to its own statement; a one-page staff rule), five workflows (shortened; the assistant one links the chat guide), what stays with a person and making the check real, six privacy steps (tonight's corrections kept), costs with a worked example, a four-week pilot with stop rules; ~2,170 words, 17 sources. Build, copy-guard, blog.mjs 17/17. NOTE: the providers' statements change often; re-check them at each review.
- 2026-10-20 12:08Z: the 72-hour line (director's 11:55Z note): the AI, portal and hacked articles now keep the legal duty (notify, tell the people affected) apart from the Commissioner's guidance, quoted exactly from NotifyUs ("Ideally you'll do that within 72 hours after you're aware that you have a notifiable breach, even if you're still investigating it."); the hacked article's citation moved after the quote. index.ts and the glossary already say "as soon as practicable" with the 72 hours as guidance.
- 2026-10-20 12:33Z: blog 3b, rewrite 5: google-business-profile (drafted by a subagent from the memo, reviewed and integrated here): who qualifies, adding or claiming, verification, what to fill in (name, category and phone rules, special hours, the 750-character description, photos), how local ranking works, reviews (asking, replying, what's not allowed, the Commerce Commission line), when it goes wrong (ownership, suspension, scam calls, review extortion, leavers), a checklist for today, a worked example (an illustrative Lower Hutt dog groomer); ~2,150 words, 29 sources read 2026-10-20; tonight's fixes kept. Build, copy-guard, blog.mjs 17/17.
- 2026-10-20 12:39Z: blog 3b, rewrite 6: redesign-or-improve, the blog home's lead (drafted by a subagent from the memo, reviewed and integrated here): four foundations (message, control, support, performance) through every section, a one-week diagnosis with named reports, software support dates, the launch checks, pricing a rebuild against the fixes, a decision table and path, a worked example; the ownership fix kept; ~2,170 words, 16 sources read 2026-10-20. Build, copy-guard, blog.mjs 17/17.
