# The story (/story/): "The quiet leak"

Story mode, rebuilt from nothing in October 2026. It replaced the old story
(the glass-shard stone telling "why we exist" over the home page), which is
gone: `lib/story.ts`, `lib/storyFilm.ts` and the old `components/story/` were
deleted, and every way in now opens its own page, `/story/`.

It was built in this order, and any change to it should keep the order:
**the problem, then the flow, then the words, and only then the effects.**
Every effect below says what it means. An effect that means nothing comes out.

The words live in one place, `content/story.ts`: the film's type, the hover
labels and the transcript under the film all read it. Writing rules are
docs/BLOG-GUIDE.md's (no em dashes, NZ English, nothing invented, facts cited).

---

## 1. The problem, in plain words

Businesses quietly lose customers and money to old, patched-together digital
infrastructure, and they never see it happen.

- A slow, unclear website that people leave.
- An enquiry form that lands in an inbox nobody answers until tomorrow.
- The same details retyped across spreadsheets, quotes and invoices.
- No follow-up, so customers never come back.
- An owner working nights to hold it all together.

Two facts, and only two, are used. Both are cited on screen and in the
transcript:

| Fact | Source |
|---|---|
| 53% of mobile visits are likely to be abandoned if a page takes longer than 3 seconds to load. | Google, "The need for mobile speed", Alex Shellhammer and Juliette Neel, 8 September 2016. https://blog.google/products/admanager/the-need-for-mobile-speed/ (checked 10 October 2026) |
| Firms that answered within an hour were nearly seven times as likely to qualify the lead. | Harvard Business Review, "The Short Life of Online Sales Leads", James B. Oldroyd, Kristina McElheran and David Elkington, March 2011. https://hbr.org/2011/03/the-short-life-of-online-sales-leads (paywalled; the line was checked by the client) |

Nothing else is a claim. The film's counters count the film's own customers
("lost while you watched"), and say so.

## 2. The flow

One customer's journey through a business, where it leaks, the turn, the
rebuild, the result, the offer.

| # | Beat | Where it leaks / what changes |
|---|---|---|
| 0 | Your business | A machine built up over years. Every light is a customer. Follow one. |
| 1 | Your website | Slow and unclear: more than half give up at the gate (53%). |
| 2 | Your inbox | The form lands at 7:40pm; nobody answers till morning; they cool and go elsewhere (nearly seven times). |
| 3 | Your admin | Retyped tray to tray: spreadsheet, quote, invoice. Some are dropped. |
| 4 | Your follow-up | They paid, then nothing. We chase the one we followed down the last track; the track just ends; it goes over, and falls away from us into the pit. |
| 5 | You | It all runs on you at 11:47pm. You never see them go. The count. |
| T | The turn | Everything stops. "Stop patching it." The old machine comes apart; a new one assembles. |
| 6 | Website | They're straight in. |
| 7 | AI automation | Answered in seconds, even at 3am. |
| 8 | Platform | Typed once, used everywhere. |
| 9 | Follow-up | They paid, then they came back: the same chase down the same last track, but where it ended it now curves up into the loop, and the flow compounds. |
| 10 | You | You go home at six. The count, kept. |
| E | Find your leaks | Free audit in two days. |

Every rebuilt line answers an old one, in the same place in the machine.

## 3. The story

The words are in `content/story.ts` (the source of truth). The shape: a
short kicker, one title that lands, one plain line, and where it belongs a
cited fact or a closing beat. Second person. It must make sense with the
sound off, so every leak is said in words as well as shown.

## 4. The craft, and what each effect means

**The world.** The business is a machine the size of a cathedral, standing
in the dark: an iron tower in a nave of pointed arches. It runs top to
bottom, one level per leak, so the pull-back shows the whole business at
once, each level in its own light.

| Effect | Meaning |
|---|---|
| Warm glowing marbles | Customers. One is ours: we ride with it. |
| The door of light at the top | How they find you (search, ads, word of mouth). |
| The portcullis rising slowly, the load gauge past 3 s, marbles giving up and leaping off | A slow website: 53% leave. Exactly 53 of every 100 film customers leap. |
| Amber dusk through the rose window | Waiting. |
| The dish, the 24-hour wheel of sun and moon turning overhead, the clock 7:40pm to 9:12am, the marbles dimming | The unanswered inbox. Brightness is the chance of winning them: after the first hour it falls to a seventh. |
| Cold midnight blue | Nobody's there. |
| The claws carrying marbles tray to tray, stencilled SPREADSHEET, QUOTE, INVOICE, dropping some; paper drifting down | Retyping the same details; things fall between systems. |
| Sick, flickering fluorescent green | Admin. |
| The marble stamped gold in the invoice tray | The sale. |
| A track that runs out over a drop and ends; the camera chasing our customer down it, stopping at the edge, then diving after it as it falls away | No follow-up: the sale was the end of the relationship, and you can't follow them once they've gone. |
| Blood red, from the pit below | The loss. |
| Rivers of light falling into a pit; a dim red lake at the bottom | Every customer lost. The count ("lost while you watched") is the number of film customers that fell, by leak. |
| One desk lamp, a hand crank, a tiny figure turning it, 11:47pm | The owner, working nights to keep it running. |
| Freeze, silence, black, one line | The turn. |
| Rust flaking, gears tumbling past the lens, the tower falling into the pit in slow motion | Taking the patched system apart. |
| White flash; glass and indigo pieces flying in and locking round the camera, each with a click | The rebuild, built properly, as one system. |
| A ring of light where the gate was, pulsing as each one passes | A fast, clear website. |
| A turbine where the inbox was, spinning under the moon | AI automation: answered the moment they ask, at any hour. |
| One glass channel through three lit nodes | A platform: entered once, used everywhere. |
| The end of the track curving up into a gold spiral back to the top, shot as the same chase as before (a rhyme) | Follow-up: customers return, and the flow compounds. |
| The crank replaced by a flywheel that turns itself; the lamp clicks off at 6:00pm | The owner gets their evenings back. |
| Warm paper white | Back to the website, and the offer. |

**Light and grade.** Bloom on the light only; a grade per chapter (amber,
midnight, fluorescent green, red, black, white, indigo, teal, gold, paper);
film grain; a slow vignette. The camera flies on one spline and never stops
dead; at rest it breathes and leans toward the pointer.

**Sound** (Web Audio, generated live: no files, nothing licensed). A cathedral
reverb made in code; a pad that changes key per chapter; the rolling marble,
pitched by its speed; a falling tone for every customer lost; the inbox's
clock ticking; typewriter clatter and a carriage bell in admin; groans and
clangs as it comes apart; a riser and a sub-bass hit at the turn; a click as
each new piece locks; a bell for every customer kept. The door offers sound
or silence; a mute toggle is always on screen.

**Interaction, with a purpose.** Drop your own customers in (the button or a
click on the machine): the old machine loses them, the new one keeps them,
and you hear both. Hover a part to see what it is in your business (only
the part you move onto: parts the film slides under a resting pointer stay
quiet, so nothing pops up over the words while you read). Scroll, drag, use
the arrow keys, or press play and watch it as a film. Let go and it settles
on the nearest composed frame, onward once you are a fifth of the way there.

## 5. Engineering notes

- Length: 27.4 screens of scroll (`components/story/timeline.ts`), about
  four minutes when played (autoplay holds 3.4 s on each composed frame).
- Its own route, its own R3F canvas, loaded lazily behind the door (the door
  also hides shader compilation). Nothing of it loads on the home page.
- One loop: the scroll gives the film clock P (screens of scroll); the film is
  a function of P (camera, machine, the ride) plus real time (the crowd).
- Every moving or breaking part of a machine is a "piece": one merged draw
  per material, each piece's transform in a float texture.
- Phones: fewer lanes and marbles, lower resolution, lighter bloom, the text
  as a bottom sheet. Nothing plays on its own for anyone (play is a choice).
  Reduced motion: the camera holds each chapter's composed frame and fades
  between them; no breathing, pointer lean, shake or gears past the lens; the
  grain holds still; no flicker. No WebGL: the transcript.
- The full story, with scene descriptions and sources, is in the HTML as the
  transcript under the film.
- Look-dev: `/story/?at=<P>&freeze=1&hud=0` lands on a frame (P in screens,
  `hud=0` hides the words and controls, `q=low|high` forces the quality
  tier); `window.__story` has `jump`, `frames`, `state`, `bench`, `world` and
  `Score` (the score can be rendered offline into an OfflineAudioContext).
- The camera: keys are fixed, ride with our customer, or chase it along its
  heading (`hero.dir`, a secant a few metres ahead, so the chase leans into a
  bend instead of snapping round it). The fall is an explicit override (the
  dive): mixing moving and fixed keys in one spline overshot the customer.
- Verified in the cloud on SwiftShader only: the stills, the phone layout,
  reduced motion, no WebGL, the controls and the score (rendered offline: the
  turn's silence is digital silence). Still to judge on a real GPU: frame
  time, compile time on Windows, the light, and the whole of it in motion.
