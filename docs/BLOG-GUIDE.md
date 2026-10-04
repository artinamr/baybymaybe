# Writing for the Nerodyn blog

This guide is binding for every agent and every person who writes, edits or
adds an article. Read all of it before you start, and again before you
publish. The hard rules in section 2 are enforced: `npm run build` runs
`scripts/copy-guard.mjs`, and the build (and so the deploy) fails if one is
broken.

The blog is where most of Nerodyn's customers first meet us. Treat every
article as the best answer to its question available anywhere in New Zealand.

---

## 1. What the blog is for

**Who reads it.** Owners and managers of small and medium businesses in New
Zealand who are deciding something about their website, their systems or AI:
whether to rebuild, what a quote should say, whether they need a portal, how to
connect their tools, where AI is worth it. They are busy, sensible and wary of
being sold to. Many read on a phone, often in the evening.

**What every article must do.** Answer one real question completely and
honestly, so the reader can decide for themselves, even if they never hire us.
Useful first. The sale comes from being trusted, not from asking.

**How it brings in customers.** People find the article in search or in an AI
assistant's answer, see that it is plain, specific and checked, and start to
trust the people who wrote it. Each article ends with one quiet offer: the free
audit. Nothing pushier than that.

---

## 2. The hard rules (the build fails if you break them)

1. **No em dashes. Ever.** Not in titles, descriptions, the short answer, body
   text, captions, alt text, table cells, questions and answers, or source
   titles (rewrite a source's title with a colon if it has one). Not as
   `&mdash;` either. Use a full stop, a comma, a colon or brackets instead, and
   usually the sentence improves.
   - No spaced en dashes ( – ) used as dashes either. They read the same.
   - An en dash is only allowed closed up inside a range in a list or table
     (days 1–2, 2024–2026). In running text, write "to": "two to four weeks".
2. **No stock phrases.** The phrases in section 11 mark writing as generated or
   padded. The build rejects them in articles.
3. **New Zealand English spelling** (section 4). The build rejects common
   American spellings in articles.
4. **Sources at the end.** Every article has a Sources section with at least
   two sources, each fetched and checked on the date shown (section 5).
5. **The cover photograph is credited** at the end, from `content/images.ts`
   (section 6). Never our own site's imagery.
6. **Every image has alt text.**

Check before you commit:

```bash
npm run build
```

or, against an existing build, `npm run check:copy`.

---

## 3. Voice: sound like a person

Write the way an experienced, honest practitioner talks to a client across a
table. Plain, direct, warm and specific.

- **Short sentences, mostly.** Let the length vary naturally. One idea per
  sentence, one point per paragraph.
- **Active voice.** "We redirect every old address", not "Every old address is
  redirected".
- **"We" is Nerodyn, "you" is the reader.** Contractions are fine (it's,
  you'll, don't). They are how people talk.
- **Concrete nouns and real examples.** A booking for a physio, a quote for a
  builder, GST, the Privacy Act 2020, a .nz domain, New Zealand time.
- **Admit trade-offs.** Say when something isn't worth doing, when an
  off-the-shelf tool is the better answer, and when the answer isn't us.
- **Start with the answer.** No warm-up paragraph about "today's digital
  world". The first sentence should already be useful.
- **No hype.** No exclamation marks, no emojis, no superlatives you can't
  prove, no "revolutionary", no fear-selling.

Patterns that make writing sound machine-made. Don't use them:

- "It's not X, it's Y" and "not just X, but Y" contrasts.
- Everything in threes. Lists of three adjectives. Three-beat sentences in a row.
- A one-line "zinger" closing every paragraph.
- "Whether you're a … or a …".
- Opening with a question, a dictionary definition or "Imagine…".
- "In this article we will…", "Let's dive in", "Here's the thing",
  "The bottom line", "At the end of the day".
- A summary at the end that repeats every section.
- Stacked hedges: "may potentially help to somewhat reduce".
- Words from section 11.

**Test:** read it aloud. If you wouldn't say it to a client, rewrite it.

---

## 4. Spelling, punctuation and style

**Spelling: New Zealand English.**

| Write | Not |
|---|---|
| organise, organisation, prioritise, optimise, recognise, realise, customise, summarise, minimise | organize, prioritize, optimize, … |
| colour, behaviour, favourite, honour | color, behavior, favorite |
| centre, metre | center, meter (a measuring device is a meter) |
| analyse, catalogue, grey, defence, fulfil, enrol, enrolment | analyze, catalog, gray, defense, fulfill, enroll |
| travelled, cancelled, labelled, modelling | traveled, canceled, labeled, modeling |
| licence (noun), license (verb); practice (noun), practise (verb) | |
| programme (a plan of events); program (software) | |
| judgement, ageing | judgment, aging |

**Punctuation and numbers.**

- Dates: 4 October 2026 (no ordinals, no commas). Times: 9am, 4:30pm.
- Money: $1,200 (NZD unless stated; write NZ$ when it could be confused).
- Numbers: one to nine in words, 10 and over in figures; always figures for
  money, percentages (12%), measurements and dates.
- Curly quotes and apostrophes (“ ” ’). In JSX text write them as characters,
  never as `&rsquo;` (CLAUDE.md gotcha 9: an entity plus a line wrap drops a
  space after an element).
- Headings in sentence case. A heading can be the question the reader would ask.
- Spell out an abbreviation the first time unless everyone knows it:
  "customer relationship management (CRM) system", then "CRM".
- Te reo Māori with macrons where it is natural and correct: Māori, kia ora,
  Tāmaki Makaurau. Don't decorate with it.

---

## 5. Accuracy and sources

- **No invented anything.** No made-up numbers, clients, quotes, results,
  case studies or "studies show". No productivity statistics unless they come
  from a primary source and genuinely matter to the reader.
- **Every fact that isn't our own experience is cited** with `<Cite n={…} />`
  to a source you fetched and read on the day you wrote it. If you can't fetch
  and confirm it, cut the claim.
- **Primary sources first.** New Zealand: legislation.govt.nz, privacy.org.nz,
  ird.govt.nz, business.govt.nz, ncsc.govt.nz and ownyouronline.govt.nz,
  dia.govt.nz, consumerprotection.govt.nz, comcom.govt.nz, dnc.org.nz,
  stats.govt.nz. The web: W3C and WAI, Google Search Central, web.dev, MDN. A
  product's own documentation for facts about that product.
- **Never cite:** Wikipedia as the source, other agencies' blogs, AI chat
  output, content farms, undated pages, or anything you couldn't read in full.
- **The law.** Say what a regulator or the Act says, link it, and don't give
  legal advice. "The Privacy Commissioner expects…" is accurate; "you are
  legally required to…" usually isn't unless you are quoting the Act. Point
  readers to a lawyer for their contract.
- **Numbering.** Sources are numbered in the order the article first cites
  them. Each has a title, publisher, URL and the date checked (`accessed`).
- **Updating.** When you revise an article, re-check every source and set
  `updated` (only for a genuine revision, not a typo).

---

## 6. Images (strict)

**Never use Nerodyn's own site imagery in a blog post.** No film stills, no
renders of the stone, no screenshots of our pages, nothing from the shaders.
Diagrams built with `components/blog/Diagrams.tsx` are figures, not photos,
and are welcome.

**Photographs come from outside and must be free of copyright
restrictions: public domain or CC0 only.**

- **Use:** StockSnap.io (every photo is CC0), found through the Openverse
  search API (`https://api.openverse.org/v1/images/?q=…&license=cc0,pdm&source=stocksnap`).
  Wikimedia Commons files marked CC0 or Public Domain. NASA and other United
  States government works (public domain).
- **Don't use:** Unsplash (its licence is not CC0, and its site blocks
  automated access), Unsplash+, Pexels or Pixabay (their own licences),
  anything CC BY, BY-SA, NC or ND, Getty, iStock, Shutterstock, Adobe Stock,
  Google Images results, anything "free" without a clear licence page, and
  AI-generated images.

**Before you use a photo:**

1. Open its page. Confirm the licence (StockSnap says "CC0 license. No
   attribution required.") and that the page is live. A removed StockSnap
   photo redirects to the home page; don't use it.
2. Look at it at full size. Reject it if it has a watermark, a visible logo or
   brand name, legible third-party product screens, text, or a recognisable
   person as the subject.
3. Record it in `content/images.ts`: the photo's title, photographer,
   photographer's page, the photo page, the licence and the date checked. The
   article's credit line is generated from this record.

**Relevance and quality.** The photo must clearly be about the article's
subject, or an apt and obvious metaphor (keys for ownership, a calendar for
bookings). It must look premium: well lit, calm, uncluttered, sharp at
2400 px wide. No posed "business people", no clichés (handshakes, light bulbs,
robots, glowing brains, padlocks on keyboards, people pointing at screens). No
photo appears twice anywhere on the site.

**Preparing the files.** Crop to 24:11 and save two sizes, 2400×1100 as
`public/blog/<slug>.webp` and 1200×550 as `public/blog/<slug>-1200.webp`,
WebP at about quality 78, with no metadata, ideally under 150 KB. Grade every
photo the same way so they sit together on the page: colour muted to about 60%
saturation, whites taken to the paper (#F6F5F2) and blacks to the ink, with a
gentle contrast curve. (The grade used for the current set: reduce
saturation to 0.62, apply a mild S-curve of strength 0.12, then map black to
RGB 14,15,21 and white to RGB 246,245,242, channel by channel.) The tools that
search, download, record, grade and crop are in `tools/qa/photos/` (see its
README).

**Alt text.** Describe what is in the picture, plainly: "A set of keys hanging
from the lock of an open door." Not "image of", not keywords.

---

## 7. The shape of an article

| Part | What it is |
|---|---|
| Title | The question or task in plain words. Sentence case. 60 characters or fewer where possible. |
| Description | 155 characters or fewer: what the reader will get. For search results. |
| The short answer | Two or three sentences that answer the question completely on their own. Search engines and AI assistants quote this, so make it true and self-contained. |
| Cover | One outside photograph (section 6). |
| Body | 1,200 to 2,200 words in eight to ten sections (`H2`), one idea each. Headings read like the questions people ask. |
| A practical tool | At least one: a checklist (`Check`), a comparison table (`Compare`), steps (`Steps`), a decision tree or flow (`Diagrams`), a worked example. |
| Who it's for | Somewhere, say who this applies to and when it isn't worth doing. |
| How we'd look at yours | The last section: one paragraph, one soft ask (the free audit). |
| Questions people ask | Three questions with answers of two to four sentences, true to the article (`faq` in the registry). |
| Sources and credit | Added by the template at the end, from the registry. |

**Internal links.** Link the relevant service page and one or two related
articles in the text, where they genuinely help, and set `related` in the
registry.

**Components** (`components/blog/Prose.tsx`): `H2` (with an `id` for the
contents), `H3`, `Figure` (with a caption), `Callout`, `Steps`, `Compare`,
`Check`, `Cite`. Diagrams (`components/blog/Diagrams.tsx`): `DecisionTree`,
`Flow`, `Routes`, `Layers`. Copy the shape of an existing article in
`content/blog/`.

---

## 8. Search and AI answers (SEO and GEO)

For each article:

- [ ] One clear question. The title, the short answer and the first paragraph
      all answer it.
- [ ] Title 60 characters or fewer, description 155 or fewer, slug short and
      in kebab-case (no dates).
- [ ] The short answer stands on its own.
- [ ] Headings are questions or plain statements, never keyword lists.
- [ ] Facts cited to primary sources, checked on the day.
- [ ] `keywords`: four to six phrases people actually type.
- [ ] `faq`: three questions.
- [ ] Cover photo with alt text and a credit record.
- [ ] Related service and articles set, and linked in the text.
- [ ] New Zealand context wherever it matters: the law, the agencies, the
      spelling, the currency.

The template does the rest: BlogPosting, FAQPage and BreadcrumbList
structured data (with the sources as citations), the canonical address, Open
Graph and Twitter tags, the RSS feed, the sitemap entry with its image, and the
article's line in `/llms.txt`.

---

## 9. Adding an article, step by step

1. **Pick the question.** One a real buyer asks. Check the blog doesn't
   already answer it.
2. **Research.** Fetch and read the primary sources. Note what each one
   actually supports.
3. **Find the photograph** (section 6). Add it to `content/images.ts` (a
   `cover-…` entry) and produce both files in `public/blog/`.
4. **Write the body** in `content/blog/<slug>.tsx`: `export const toc` and
   `export default function Body()`.
5. **Add the registry entry** in `content/blog/index.ts` with
   `status: "draft"` while you work.
6. **Map the body** in `content/blog/bodies.ts`.
7. **Make the share card.** Add a line to `tools/qa/ogcards.mjs`, build
   (`npm run build`), serve `out/` (`python -m http.server 3100 --bind 127.0.0.1 --directory out`)
   and run `node tools/qa/ogcards.mjs http://127.0.0.1:3100`. Check the card.
8. **Publish locally.** Set `status: "published"`, run `npm run build` (the
   copy guard runs), and read the page at desktop and phone width.
9. **Read it aloud**, then go through section 10.
10. **Commit and push** to `master` (it deploys).

---

## 10. Before you publish

- [ ] No em dashes, no spaced en dashes (the build checks).
- [ ] No phrase from section 11 (the build checks the worst; read for the rest).
- [ ] NZ spelling throughout (the build checks the common ones).
- [ ] Every claim either our experience or cited; every source opened today.
- [ ] No invented numbers, clients, quotes or results.
- [ ] The short answer works on its own.
- [ ] At least one practical tool, and an honest "when it isn't worth it".
- [ ] Cover photo: CC0 or public domain, live licence page, no watermark, no
      logo, relevant, premium, recorded in `content/images.ts`, alt text written.
- [ ] Title ≤ 60, description ≤ 155, keywords and three questions filled in.
- [ ] Internal links to the service page and related articles.
- [ ] Read on a phone: no table or figure breaks the page.
- [ ] Read aloud once more.

---

## 11. Words and phrases

**Never (the build fails on these in articles):** delve, tapestry, testament
to, embark, unleash, game-changer, cutting-edge, revolutionise, seamless,
synergy, fast-paced world, ever-evolving, ever-changing landscape, it's worth
noting, it's important to note, in conclusion, unlock the power, unlock the
potential, look no further, elevate your, supercharge, next-level,
world-class, state-of-the-art, best-in-class, in today's digital, navigating
the, dive into, deep dive, a myriad of, plethora, harness the power.

**Sparingly (the build warns when one appears twice):** robust, leverage,
crucial, pivotal, landscape, journey, empower, streamline, holistic,
comprehensive, furthermore, moreover, additionally, ensure.

**Plainer words:**

| Instead of | Write |
|---|---|
| utilise, leverage | use |
| facilitate | help |
| commence | start |
| in order to | to |
| prior to | before |
| a number of | some, several |
| at this point in time | now |
| ensure | make sure |
| robust | reliable, strong |
| seamless | smooth (or say what actually happens) |
| solution | name the thing: a booking page, a portal |
| stakeholders | the people involved (name them) |

---

## 12. Before and after

> **Before:** In today's fast-paced digital landscape, it's crucial for
> businesses to leverage robust AI solutions — and the benefits are
> game-changing.
>
> **After:** AI can take some repetitive work off your team. Here is where it
> helps in a small business, and where it doesn't.

> **Before:** A website redesign isn't just a new look — it's a strategic
> journey that can elevate your brand.
>
> **After:** Most business owners who ask for a new website don't need one.
> Often a handful of pages are doing the damage.

> **Before:** It's worth noting that ownership is a crucial consideration.
>
> **After:** Make sure the domain is registered in your business's name. If
> it isn't, fix that first.

---

*Questions about this guide, or a rule that gets in the way of a good
article? Raise it with the client rather than working around it.*
