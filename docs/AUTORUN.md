# Overnight runs (2026-10-20 20:00 → 2026-10-21 06:50 NZDT)

The owner asked for the rest of this week's usage to go into the site
overnight. A scheduled task in the desktop app ("nerodyn-overnight", every
20 minutes, plus one-off starts just after each usage reset) starts a
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
3. **The lock** (`.autorun/lock.json`, git-ignored, never committed). If it
   exists and its `heartbeat` is less than 40 minutes old, another session
   is working: stop at once and change nothing. Also stop if any source file
   changed in the last 15 minutes:
   `find app components content docs lib tools scripts shaders -type f -mmin -15 2>/dev/null | head -1`
   prints anything. Otherwise create `.autorun/` if needed and write
   `{"holder": "<short id>", "heartbeat": "<now, ISO UTC>"}`. Rewrite the
   heartbeat after every step, before and after every build, and at least
   every 20 minutes.
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
