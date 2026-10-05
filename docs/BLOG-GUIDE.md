# Writing for the Nerodyn blog

This guide is binding for every agent and every person who writes, edits or
adds an article, a glossary term or any other copy on the site. Read all of
it before you start, and again before you publish. The hard rules in section
2 are enforced: `npm run build` runs `scripts/copy-guard.mjs`, and the build
(and so the deploy) fails if one is broken.

The blog is where most of Nerodyn's customers first meet us. Treat every
article as the best answer to its question available anywhere in New Zealand.
The public promise we make about it is the page /blog/how-we-write/
(`app/blog/how-we-write/page.tsx`). Everything that page says must stay true,
so this guide and that page change together.

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

**What the blog is made of.**

| Part | Where it lives | What it is |
|---|---|---|
| Articles | `content/blog/index.ts` (registry) + `content/blog/<slug>.tsx` (words) | One question each, answered properly |
| The glossary | `content/blog/glossary.ts`, shown at /blog/glossary/ | Every term a reader might not know, in one to three sentences |
| How we write | `app/blog/how-we-write/page.tsx` | Our public standards (who writes, how we check, what we won't do, corrections) |
| The blog's home | `app/blog/page.tsx` | "What are you deciding?" (situations), every article with search and topics, the toolkit, the glossary, how we write, an open door for questions |
| Photographs | `content/images.ts` | Every outside photo, with its licence record |

---

## 2. The hard rules (the build fails if you break them)

1. **No em dashes. Ever.** Not in titles, descriptions, the short answer, body
   text, captions, alt text, table cells, questions and answers, glossary
   definitions or source titles (rewrite a source's title with a colon if it
   has one). Not as `&mdash;` either. Use a full stop, a comma, a colon or
   brackets instead, and usually the sentence improves.
   - No spaced en dashes ( – ) used as dashes either. They read the same.
   - An en dash is only allowed closed up inside a range in a list or table
     (days 1–2, 2024–2026). In running text, write "to": "two to four weeks".
   - This applies to the whole site, and to text inside images too (a
     screenshot or cover with a dash in it counts; the build can't see those,
     so you must).
2. **No stock phrases.** The phrases in section 14 mark writing as generated or
   padded. The build rejects them on every blog page.
3. **New Zealand English spelling** (section 4). The build rejects common
   American spellings on every blog page.
4. **Sources at the end.** Every article has a Sources section with at least
   two sources, each fetched and checked on the date shown (section 5).
5. **The cover photograph is credited** at the end, from `content/images.ts`
   (section 6). Never our own site's imagery.
6. **Every article has its short answer and says who it's for** (`short` and
   `audience` in the registry).
7. **Every image has alt text.**
8. **Every link inside the site goes somewhere real.** The build follows every
   internal link and every `#section` and fails on one that doesn't exist.
9. **No id is used twice on a page.** In practice: link a glossary term with
   `<Term>` once per article, on its first use.

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
- Words from section 14.

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
- **JSX spaces around elements.** A line that ends with an element
  (`</Term>`, `</strong>`, `<Cite />`) and a next line that starts with a word
  lose the space between them. End such a line with `{" "}`, or keep the
  element mid-line. After writing, grep the built HTML for `</a>[A-Za-z]`.
- Headings in sentence case. A heading can be the question the reader would ask.
- Spell out an abbreviation the first time unless everyone knows it:
  "customer relationship management (CRM) system", then "CRM". If the
  glossary has it, link it with `<Term>` there.
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
  digital.govt.nz, stats.govt.nz. The web: W3C and WAI, Google Search Central,
  web.dev, MDN. A product's own documentation for facts about that product.
- **Never cite:** Wikipedia as the source, other agencies' blogs, AI chat
  output, content farms, undated pages, or anything you couldn't read in full.
- **PDFs.** If a fetch can't read a PDF, download it and extract the text
  (Python `pypdf`), then quote what it actually says.
- **The law.** Say what a regulator or the Act says, link it, and don't give
  legal advice. "The Privacy Commissioner expects…" is accurate; "you are
  legally required to…" usually isn't unless you are quoting the Act. Point
  readers to a lawyer for their contract.
- **Laws change.** Check the current state on the day you write. (Example: the
  Privacy Act's principle 3A came into force on 1 May 2026; an article written
  from older notes would have missed it.)
- **Numbering.** Sources are numbered in the order the article first cites
  them. Each has a title, publisher, URL and the date checked (`accessed`).

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
photo appears twice anywhere on the site. Look at the blog's home after
adding one: the photo also appears in the "What are you deciding?" panel and
on the article's card, beside the others, so it has to sit well with them.

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

**On the page, in order** (the template, `components/blog/Article.tsx`, builds
everything in bold from the registry; you write the body):

1. **Topic, title, byline** (who, published, minutes, how many sources and the
   date they were checked).
2. **The short answer**, with **who it's for** and **not for you if** beside it.
3. **The cover photograph.**
4. The body, with the **contents** alongside (on a phone, a bar that names the
   section you're in).
5. **Questions people ask** (three).
6. **Sources**, the **photo credit**, **about this article** (with how to
   report a correction), **share and print**.
7. **Keep reading**: two related articles, the service, a demonstration.

**The registry entry** (`content/blog/index.ts`):

| Field | What it is |
|---|---|
| `title` | The question or task in plain words. Sentence case. 60 characters or fewer where possible. |
| `description` | 155 characters or fewer: what the reader will get. For search results. |
| `short` | Two or three sentences that answer the question completely on their own. Search engines and AI assistants quote this, so make it true and self-contained. |
| `situation` | Optional. Where the reader is when this is the article they need, in their own words, first person: "We’re comparing quotes for a new website." It becomes the article's line on the blog's "What are you deciding?" list. Give one only when the article answers a buyer's *starting point*, and keep that list to six to eight; one situation per article, never two articles for one situation. |
| `audience.for` | One sentence: who this is for. "Anyone about to ask for, or choose between, quotes for a business website." |
| `audience.skip` | One or two sentences that follow "Not for you if": "You don’t have a website yet. Start with what a website quote should include instead." Be honest; it builds trust. |
| `tools` | The practical tools inside, each `{ title, kind, id }`: `kind` is Checklist, Steps, Decision path, Comparison, Template or Test; `id` is the section's id from `toc`. They are listed in the blog's toolkit and linked straight to the section, so each tool must make sense on its own when someone lands on it. |
| `topic`, `keywords` | One topic; four to six phrases people actually type. |
| `published`, `updated` | ISO dates. `updated` only for a genuine revision (section 11). |
| `minutes` | Reading time at about 230 words a minute, rounded. The contents panel counts down from it. |
| `cover` | An entry from `content/images.ts` (section 6). |
| `faq` | Three questions with answers of two to four sentences, true to the article. The blog's search reads the answers too. |
| `related` | Services, work and articles it should lead to. |
| `sources` | Numbered in order of first citation (section 5). |
| `status` | `"draft"` keeps it out of everything until it's ready. |

**The body** (`content/blog/<slug>.tsx`): 1,200 to 2,200 words in seven to
ten sections (`H2`), one idea each, with at least one practical tool. The
last section is "How we’d look at yours": one paragraph, one soft ask (the
free audit). Say somewhere in the body when it isn't worth doing.

**Components** (`components/blog/Prose.tsx`): `H2` (with an `id` for the
contents), `H3`, `Figure` (with a caption), `Callout`, `Steps`, `Compare`,
`Check`, `Cite`. Diagrams (`components/blog/Diagrams.tsx`): `DecisionTree`,
`Flow`, `Routes`, `Layers`. Terms: `Term` (`components/blog/Term.tsx`,
section 9). Copy the shape of an existing article in `content/blog/`.

---

## 8. Article types (pick one, then follow its skeleton)

Every article is one of these. The skeleton is a starting point; the
headings should be the questions *this* reader asks.

| Type | Title shape | Skeleton (H2s) | Its tool | Example |
|---|---|---|---|---|
| **Decision guide** | "X or Y: how to decide" | The question behind the question · Signs it's X · Signs it's Y · How to find out (a short diagnosis) · What to do first · If you choose Y, protect what matters · Deciding · How we'd look at yours | A decision path and a comparison table | redesign-or-improve |
| **Checklist** | "What a X should include" | Why they differ · The lines a good one has · Red flags · Questions to ask · Comparing two fairly · How the price works · What to send · What ours includes | A checklist, and questions to ask | website-quote-checklist |
| **When you need it** | "When your business needs X" | What it is (and isn't) · The signals · Off the shelf or custom · What the first version should do · What it takes to keep running · The risks and basics · Judging whether it worked · An example | A comparison and steps | when-you-need-a-client-portal |
| **How to** | "Connecting / setting up X" | What it saves · The common ways · The options compared · Planning it (a template) · The details that trip people up · The law · When it breaks · Start small · A checklist | A template and a checklist | connect-website-crm-booking |
| **Practical list** | "N practical X for NZ businesses" | What makes a good fit · One section per item (what it does, where a person stays in, what can go wrong, what you need) · What it shouldn't do · The law · Costs · How to start | A fit test and steps | ai-automation-workflows |
| **After the build** | "After launch: X" | What owning it means · The handover · The parts in plain words · Keeping it safe · Support options · If you're not sure what you have · Leaving without drama | Checklists and steps | after-launch-ownership |

---

## 9. Making it easy to read (and to find your way around)

- **The first screen answers it.** Title, short answer and who it's for are
  all a reader sees before the photo. If they stop there, they should still
  leave with the answer.
- **Paragraphs:** one idea, at most about 60 words (four or five lines on a
  phone).
- **Headings:** one every 150 to 300 words. Each one should make sense in the
  contents list on its own (it's also the phone's "you are here" bar), so
  keep them under about 45 characters where you can.
- **Lists** for three or more parallel items. Bold lead-ins ("**Red flag.**")
  only when every item has one.
- **Tables:** at most four columns (they scroll sideways on a phone beyond
  that). The first column names the row.
- **Tools stand alone.** The toolkit links straight to them, so a reader may
  land on a checklist without the paragraphs above it. Give each tool a
  heading and one sentence of context.
- **The glossary.** When you use a term an owner might not know (DNS, UDAI,
  API, webhook, two-factor), link it with `<Term id="…">` on its **first use
  only**. On a computer the definition shows on hover; everywhere it links to
  /blog/glossary/. If the term isn't there yet, add it (next section).
- **Print.** Every article prints cleanly (the site around it is left out,
  and source addresses are printed). Check a long table or diagram in the
  print preview.

---

## 10. The glossary

`content/blog/glossary.ts` holds every term. Add one when an article uses a
word an owner might not know.

- **One to three sentences** that stand on their own: AI assistants quote a
  definition whole. Plain words; no em dashes; NZ spelling.
- **A definition is our words; a fact is cited.** "DNS is the internet’s
  address book" needs no source. "A UDAI is valid for 30 days" does: add the
  source to `GLOSSARY_SOURCES` (checked that day) and its key to `cite`.
- **`see`** points at the article section that goes further (slug and a
  section id from its `toc`). The build checks the link.
- **`also`** is another name or what the letters stand for ("Unique Domain
  Authentication ID").
- Put it in the right group (`TERM_GROUPS`), in a sensible order within it.
- Re-check the glossary's sources when you change it, and keep `CHECKED`
  (the date) true.

---

## 11. Linking, and keeping articles current

**Linking.**

- Link the relevant service page and one or two related articles in the
  text, where they genuinely help, and set `related` in the registry.
- When you publish an article, add it to the `related` of one or two older
  articles it belongs with, and link to it from their text where it helps.
- Link to a section with its `#id` (`/blog/website-quote-checklist/#the-lines`).
  Never change a published section's `id`: other articles, the toolkit, the
  glossary and other people's links point at it.
- Never change a published article's slug. If you must, keep the old address
  working and tell the client (search engines and saved links depend on it).

**Keeping articles current.** /blog/how-we-write/ promises that when
something an article relies on changes, we update it and say so.

- Review every article at least every six months: open every source again,
  check what it says now, fix what changed.
- A genuine revision (a fact, a law, a recommendation changed) sets `updated`
  and each re-checked source's `accessed`. A typo or a link fix doesn't.
- A correction from a reader is a revision. Fix it, set `updated`, and reply
  to them.

---

## 12. Search and AI answers (SEO and GEO)

For each article:

- [ ] One clear question. The title, the short answer and the first paragraph
      all answer it.
- [ ] Title 60 characters or fewer, description 155 or fewer, slug short and
      in kebab-case (no dates).
- [ ] The short answer stands on its own.
- [ ] `audience` filled in, honestly.
- [ ] Headings are questions or plain statements, never keyword lists.
- [ ] Facts cited to primary sources, checked on the day.
- [ ] `keywords`: four to six phrases people actually type.
- [ ] `faq`: three questions, answered as a person would.
- [ ] `tools` listed, each pointing at a real section.
- [ ] Terms an owner might not know linked to the glossary (first use only).
- [ ] Cover photo with alt text and a credit record.
- [ ] Related service and articles set, and linked in the text.
- [ ] New Zealand context wherever it matters: the law, the agencies, the
      spelling, the currency.

The template does the rest: BlogPosting (with the sources as citations, the
audience and our publishing principles), FAQPage and BreadcrumbList
structured data, the canonical address, Open Graph and Twitter tags, the RSS
feed, the sitemap entry with its image, the article's line in `/llms.txt`,
the toolkit and search on the blog's home.

---

## 13. Adding an article, step by step

1. **Pick the question.** One a real buyer asks (section 16 has candidates).
   Check the blog doesn't already answer it, and that no other article has
   the same `situation`.
2. **Pick the type** (section 8) and sketch the headings as the reader's
   questions.
3. **Research.** Fetch and read the primary sources. Note what each one
   actually supports, and the date.
4. **Find the photograph** (section 6). Add it to `content/images.ts` (a
   `cover-…` entry) and produce both files in `public/blog/`.
5. **Write the body** in `content/blog/<slug>.tsx`: `export const toc` and
   `export default function Body()`. Link terms with `<Term>`, cite with
   `<Cite>`.
6. **Add the registry entry** in `content/blog/index.ts` with
   `status: "draft"` while you work: short answer, audience, tools,
   situation (if it earns one), faq, sources.
7. **Map the body** in `content/blog/bodies.ts`.
8. **Add any new glossary terms** (section 10).
9. **Make the share card.** Add a line to `tools/qa/ogcards.mjs`, build
   (`npm run build`), serve `out/` (`python -m http.server 3100 --bind 127.0.0.1 --directory out`)
   and run `ONLY=blog-<slug> node tools/qa/ogcards.mjs http://127.0.0.1:3100`
   (only that card is redrawn). Look at it.
10. **Publish locally.** Set `status: "published"`, run `npm run build` (the
    copy guard runs), and read the page at desktop and phone width: the
    contents bar, the toolkit links on the blog's home, a term's hover, the
    print preview.
11. **Read it aloud**, score it (section 15), then go through section 17.
12. **Link it from older articles** (section 11), rebuild, commit and push to
    `master` (it deploys).

---

## 14. Words and phrases

**Never (the build fails on these on any blog page):** delve, tapestry,
testament to, embark, unleash, game-changer, cutting-edge, revolutionise,
seamless, synergy, fast-paced world, ever-evolving, ever-changing landscape,
it's worth noting, it's important to note, in conclusion, unlock the power,
unlock the potential, look no further, elevate your, supercharge, next-level,
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

**Before and after.**

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

(The "Before" lines are the only em dashes allowed anywhere in the project's
copy, and only because they show what not to do. This file is not published.)

---

## 15. The quality bar

Score the draft from 1 to 5 on each line. Publish only when every line is 4
or more; if one isn't, fix that before anything else.

| | 1 | 5 |
|---|---|---|
| **Answers it** | The answer is somewhere in the middle | The title, short answer and first paragraph answer it; a reader who stops there has it |
| **Useful** | General advice | A tool they can use today, and a clear next step even if they never call us |
| **Specific** | Could be about anywhere | New Zealand law, agencies, examples and spelling where they matter |
| **Evidence** | Claims without sources | Every fact cited to a primary source, checked today |
| **Honest** | Every road leads to us | Says when it isn't worth it, when off the shelf is better, who can skip it |
| **Readable** | Long paragraphs, vague headings | Short paragraphs, headings that work as a contents list, read aloud without stumbling |
| **Looks right** | A cliché photo, a table that breaks on a phone | A calm, relevant photo that sits with the others; every figure works at 390 px |

---

## 16. What to write next (candidates)

Questions owners ask that the blog doesn't answer yet. Each is a candidate,
not a brief: confirm people ask it, read the sources on the day, and check it
doesn't overlap an existing article. Facts in an article come from the
sources you fetch, never from this list.

| Question | Type | Topic | For | Sources to start from |
|---|---|---|---|---|
| How do we write a website brief that gets useful quotes? | Checklist | Websites | Anyone about to ask for quotes | Our own process; link the quote checklist |
| Will our emails reach the inbox? SPF, DKIM and DMARC in plain words | How to | Websites | Anyone sending email from their own domain | ownyouronline.govt.nz and ncsc.govt.nz guidance on email security; the email provider's own documentation |
| What does website accessibility ask of a small business? | When you need it | Websites | Owners planning a new site | w3.org/WAI (WCAG 2.2); digital.govt.nz on the government standard (and whom it applies to) |
| What should our website's privacy statement say? | Checklist | Websites | Anyone collecting enquiries | privacy.org.nz (principles 3 and 3A, the Privacy Statement Generator) |
| Moving off Wix or Squarespace without losing search traffic | How to | Websites | Owners who have outgrown a site builder | Google Search Central (site moves); the builder's own export documentation |
| A simple monthly check: is the website working? | Checklist | Websites | Owners after launch | Search Console Help; web.dev (Core Web Vitals) |
| Choosing an online booking system for a clinic or salon | Decision guide | Platforms | Appointment businesses | Each product's own documentation; privacy.org.nz for health information (Health Information Privacy Code) |
| Taking deposits and payments online: what to set up | How to | Platforms | Businesses taking bookings | consumerprotection.govt.nz; the payment provider's own documentation |
| When a business outgrows its spreadsheets | When you need it | Platforms | Teams running jobs in Excel | Our experience; ncsc.govt.nz on access control |
| Should our website have a chat assistant? | Decision guide | Automation | Owners hearing about AI chat | privacy.org.nz (generative AI); the provider's documentation |
| Using AI with customer data: a plain checklist | Checklist | Automation | Anyone trying AI tools at work | privacy.org.nz (generative AI, principles 5 and 12) |
| What to do if your website is hacked | How to | Websites | Any owner, before it happens | ncsc.govt.nz and ownyouronline.govt.nz (reporting, recovery); privacy.org.nz (notifiable breaches) |

When one is published, delete its row here.

---

## 17. Before you publish

- [ ] No em dashes, no spaced en dashes, in the text or in any image (the
      build checks the text).
- [ ] No phrase from section 14 (the build checks the worst; read for the rest).
- [ ] NZ spelling throughout (the build checks the common ones).
- [ ] Every claim either our experience or cited; every source opened today.
- [ ] No invented numbers, clients, quotes or results.
- [ ] The short answer works on its own; `audience` is honest.
- [ ] At least one practical tool, listed in `tools`, and an honest "when it
      isn't worth it".
- [ ] Glossary terms linked on first use; new terms added.
- [ ] Cover photo: CC0 or public domain, live licence page, no watermark, no
      logo, relevant, premium, recorded in `content/images.ts`, alt text written.
- [ ] Title ≤ 60, description ≤ 155, keywords and three questions filled in.
- [ ] Internal links to the service page and related articles; older articles
      link back.
- [ ] Read on a phone: the contents bar names each section sensibly; no table
      or figure breaks the page.
- [ ] Print preview looks like a clean document.
- [ ] Scored 4 or more on every line of section 15.
- [ ] Read aloud once more.

---

*Questions about this guide, or a rule that gets in the way of a good
article? Raise it with the client rather than working around it.*
