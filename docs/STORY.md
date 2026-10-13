# The story (/story/): "The quiet leak"

Story mode is its own page at `/story/`. It follows one customer, Sam, from
the first search to the finished job and a year beyond it, through a small
business that loses customers at every step without seeing it happen. Then
the same evening plays again, with a better route. The last image belongs
to the owner: the laptop closed at six.

Keep the order of decisions: **the problem, the route, the words, then the
effects.** Every effect must show a handover, a loss or a change, in things
a small-business owner already knows: a phone, a website, an inbox, a
spreadsheet, a quote, an invoice, a calendar, a van at the kerb. No
metaphors that need explaining (the client, round 23: "too far of a
metaphor and too complicated for the target audience").

The words live in `content/story.ts`. The film, the progress controls, the
part labels and the transcript all use it. `docs/BLOG-GUIDE.md` applies:
plain New Zealand English, no em dashes, facts checked and cited, no
invented clients or business results. Text drawn inside the film's screens
(`components/story/film/ui.ts`) follows the same rules: the business is
"Your Business", the customer is Sam, other customers have first names only,
email addresses use the reserved example domains, and no phone numbers.

## The problem

Customers leak out of a small business in four quiet places: a slow
website, an enquiry that waits, details copied by hand between tools, and
no follow-up after the job. The owner pays for each leak in evenings.

## The route (the story, in thirteen chapters)

Chapter IDs are stable (the clock, the camera, the score and the overlay
refer to them). Timings: `components/story/timeline.ts` (chapter spans,
card windows, composed rests) and `components/story/film/script.ts` (every
beat, and the clock).

| Chapter | P | What happens |
|---|---|---|
| open | 0–2.4 | A town at dusk. Down to one lit living room: Sam on the sofa, a phone, an old grey deck outside. Sam searches and taps your business. |
| website | 2.4–5.0 | The phone's screen lifts into the air: a blank page, a spinner, a timer. Over the town, a hundred phones load the same page; past three seconds 53 give up. Sam waits, gets past a pop-up, finds a small contact link, fills in a long form. |
| inbox | 5.0–7.8 | The form folds into an envelope and flies across the town to your workshop. It lands at the bottom of an inbox that grows into a pile all night; other customers' enquiries go cold and slide off. 9:13am: you find Sam's message and reply. |
| admin | 7.8–10.6 | At the desk: the spreadsheet, the quote (typed at night), the invoice. Each is a card lifted off the laptop, each holds the same details typed again. Other jobs go cold: a quote never sent, a mistyped email. Sam says yes; the invoice is stamped paid. |
| followup | 10.6–12.8 | Across the town to Sam's new deck as its last boards drop in. A year passes in seconds; the deck greys. Sam searches for someone to oil it, taps the first result, and another company's van pulls up. |
| you | 12.8–15.0 | 11:47pm. You at the desk under a lamp, typing, crowded by the jobs still waiting. Out over the sleeping town: one lit window and the pile beside it. |
| turn | 15.0–18.0 | Hands off the keyboard. Silence. The cards fall like paper into the dark. The clock runs back to 7:38pm, the town lights up, and a line of indigo light draws itself over it with six parts locking on: website, instant reply, booking, quote, invoice, follow-up. |
| new-website | 18.0–19.8 | Sam again, the same evening. The page is there at once, one clear button. Almost every phone over the town stays lit. Three questions and a photo, sent. |
| new-ai | 19.8–21.8 | The enquiry runs along the line to the instant reply and an answer comes straight back: times for a free measure-up. Sam picks one and it lands in your calendar. 3am: another enquiry answered; one question the assistant can't answer is handed to you for the morning. |
| new-platform | 21.8–23.8 | The quote fills itself in from the enquiry; you add the price. It flies to Sam, who accepts. The deck goes in board by board. The invoice comes from the quote and Sam pays it online. |
| new-followup | 23.8–25.8 | How did we do: five stars. A year passes. A reminder: time to oil the deck. Sam books, and your van pulls up. |
| new-you | 25.8–28.0 | Six o'clock. A card shows the day: nothing waiting on you. You close the laptop, switch off the lamp and drive home while a new enquiry gets its answer. |
| end | 28.0–29.6 | Up over the town at dusk; the light fills it; paper. "Find your leaks." and the free audit. |

The new chapters answer the old ones in the same places (the same sofa,
the same desk, the same deck, the same kerb). The turn is a decision, and
the closing image is a release.

## An illustrative story, with one research finding

The town, the business, its customers, timings and outcomes belong to the
film. The transcript says so and the counters are labelled as film
counters. Do not imply that a real business will keep every customer,
answer every enquiry immediately or let every owner leave at six.

One research finding is used, in the website chapter: Google's 2016 global
data put likely abandonment at 53% when a mobile page took over three
seconds. The film shows it literally (53 of 100 phones give up). It is
historical context, not a current New Zealand benchmark or a measurement of
the reader's website.

Source: Alex Shellhammer and Juliette Neel, "The need for mobile speed",
Google, 8 September 2016,
https://blog.google/products/admanager/the-need-for-mobile-speed/.
The page and its footnote for this finding were read on 12 October 2026.

The HBR record stays in `SOURCES` for compatibility; the transcript lists
only sources a chapter cites.

## What the effects mean

| Picture | Meaning |
|---|---|
| A model town at dusk, its windows lit | The people who might need you. |
| White, blank figures (no face, no hair) | Anyone: the customer could be any customer, the owner any owner. |
| A phone's screen lifting into the air | What the customer actually sees, large enough to read. |
| A hundred phones over the town, 53 tipping over red | Google's 2016 finding, literally. |
| An envelope of light over the town | A message travelling. Warm going out, indigo coming back. |
| A pile of emails growing beside the workshop | The inbox overnight; the oldest (Sam's) at the bottom. |
| Strips going grey, "Went elsewhere", sliding off | Customers who gave up waiting. |
| Three cards with the same details | Typing the same job into the spreadsheet, the quote, the invoice. |
| A red PAID stamp | Paid, by hand. |
| The deck greying through a year | Time passing with no contact. |
| Another company's van | The repeat job that went elsewhere. |
| Cards crowding the desk at 11:47pm | The work still waiting on one person. |
| Cards falling like paper; the clock running back | Letting go of the old way; the same evening again. |
| One line of indigo light with six parts on it | The new route: website, instant reply, booking, quote, invoice, follow-up. |
| A pulse running along the line | The customer moving through it without anyone copying anything. |
| A card under a part of the line | That part working (the calendar, the handover, the quote). |
| The lamp switched off at six | The evening given back. |
| Warm paper white | Back to the website and the free audit offer. |

## The look

An architect's model at full size: warm white walls, charcoal roofs, muted
green trees and lawns, grey roads; light is the only other colour (windows,
lamps, screens, the customer's amber and the new route's indigo). A sky that
follows the film's clock (`sky.ts`: dusk, night under a moon, morning, day,
golden hour), soft shadows from the sun or moon focused on what the camera
sees, baked occlusion, streetlight pools baked into the ground, bloom on the
lights only. Screens are drawn at the same brightness whatever the
exposure (`uiScale`), so white stays white and text stays crisp. By day the
fill is low and the sun warm, so form reads by light and colour (a white
model front-lit reads as a grey card), with a gentle S-curve on the
display values; the route's labels mark their work by their light, never by
burning their own faces out.

## Three rules the film keeps

- **The words come first.** No card in the air sits behind a title or a
  line at a rest: the compositions keep them apart (the route's parts are
  framed whole on the right, 13 m off), and a card the camera swings past
  fades while it is behind the words (`world.ts` `keepClear`, with the
  words' place measured from the page by `dom.ts`), eased in time so it
  dips rather than blinks.
- **Nothing appears or vanishes in view.** People walk in and out (the
  owner along the footpath at dawn and into the van behind its door; Sam
  through the sliders and the doorway behind the sofa), the van drives out
  of frame; anything that must switch does so out of shot or in the turn's
  black. Walks are scrubbed by the scroll with planted feet; most run inside
  a time-lapse, where speed reads as time passing.
- **A phone is framed, not cropped.** On a portrait screen the subject
  rises into the upper part, the lens widens, and the camera backs away by a
  distance worked out ahead for the whole film from a height field of the
  town (houses, trees, cars, fences, the route's cards), smoothed so it never
  jumps and stopping short of a roof under the lens; the route's labels are
  smaller.

## Reading and control

The film must make sense with sound off. The full words and scene
descriptions are server-rendered in `Transcript.tsx`, in the order they
appear in the film. Reduced motion and unavailable WebGL still reach the
text.

Scrolling sets the film clock `P`, in screens. The timeline owns chapter
spans, card windows and composed rests; play, the arrow keys and chapter
selection use the same positions. The film is a pure function of `P` plus
real time for breath and small life, so revisiting any moment shows the
same thing. Hover a part to read what it is in a business; "Send an
enquiry" sends one of your own from a house in the town (lost more often
than not the old way, answered the new way).

## The parts (components/story/film)

`world.ts` plays the script: the sky, the two places, the people, the
screens, the cards, the envelopes, the inbox pile, the town's phones, the
new route, the camera and the grade. `town.ts` (the suburb, chunked for
culling), `places.ts` (the customer's house, the workshop), `figure.ts` (the
blank figure: forward kinematics for the body, two-bone IK for the limbs),
`people.ts` (poses as data, blended: sitting with a phone, typing, standing,
walking with planted feet), `ui.ts` (every screen), `cards.ts` (screens,
cards, the inbox strips), `mail.ts` (envelopes), `crowd.ts` (the town's
phones), `system.ts` (the new route), `camera.ts` (the shot list: Hermite
keys, holds at every rest, Gaussian smoothing), `script.ts` (beats and the
clock), `sky.ts`, `mats.ts`, `model.ts`, `post.ts`, `audio.ts`, `dom.ts`.

## Checking it

- Look-dev: `/story/?at=<P>&freeze=1&hud=0`; `q=low|high`; `?cam=x,y,z,ax,ay,az,fov`;
  `window.__story` exposes `jump`, `frames`, `state`, `bench`, `world`.
- `node tools/qa/story-camera.mjs [step] [--phone]` flies the film's camera
  through the built world and fails on any surface within 0.2 m of the lens,
  a card in the air within 0.25 m, or a van or a person within 0.25 m.
- `node tools/qa/story-overlap.mjs <base> [W H]` fails on a card over a
  title or a line; `story-pops.mjs <base>` lists anything that turns on or
  off, or jumps, in frame (check each in stills: occlusion is not known);
  `story-flow.mjs` lists where the picture moves fastest or changes speed
  abruptly (no browser).
- `node tools/qa/story.mjs <base>` uses the page: the door, scroll, rests,
  keys, sending an enquiry, hover labels, play, the end, no WebGL, reading.
- GPU per pass: `?perf=1`. Keep the scene pass under ~12 ms at 1080p on an
  integrated GPU. Two traps found the hard way: three shades every point
  light at every pixel (the light cull in `mats.ts` skips dark ones), and
  uploading a canvas texture with `flipY` stalls the frame (live screens
  draw upside down and upload unflipped: `Screen`).
- Judge motion in motion (recordings), not only from stills.
