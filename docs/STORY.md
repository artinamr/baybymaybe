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

## Set pieces (round 24)

- **One real dusk to open.** The clock starts at 6:33pm in golden light
  with long shadows across the town and runs, continuously, into the blue
  hour as the camera finds Sam's house; the windows come on one by one.
  By the time Sam is on the sofa it is 7:22pm, and the enquiry goes at 7:40.
- **The rewind.** After the black, the camera hangs high over the town and
  the whole old half runs backward (`world.ts`: world time `Pw` sweeps from
  the desk at 11:48pm back to the evening the enquiry was sent, over 0.4
  screens, eased) while the hours spin back through two days (the sun
  wheels backward, the windows blink through two nights, the inbox tower
  unbuilds, the vans reverse, the deck unweathers, the enquiry flies home).
  The lens strains (fringe and grain up), the clock on screen runs
  backward, a tone winds down under the riser. It lands on 7:37pm the first
  evening and the new route draws itself. The camera's cut from the desk to
  the sky happens inside the black.
- **A year as a time-lapse** (both halves, `script.ts` `lapseHours`): three
  days with their nights shortened (seven tenths of each turn is daylight),
  so the sun sweeps and the shadows wheel; the town's foliage turns amber,
  thins and greys for the winter, then comes back fresh (`world.ts`
  `seasons`, a tint on the one foliage material); the deck greys on the old
  route and stays sound on the new.
- **A wave of giving up.** The 53 phones that leave the slow site go as a
  wave across the town, the far side first and Sam's street last, each a
  little early or late (`crowd.ts`).
- **Depth of field** (`post.ts`; off on phones): a depth pass at half size,
  a gather, a mix by the circle of confusion. The focus is the shot's
  subject; the aperture is a channel on the camera keys (`dof`): the
  opening and the wide town shots have a model's shallow focus, the lifted
  screens are read nearly all-sharp, the route over the town is all sharp.
  About 1.2 to 1.9 ms a frame at 1080p on an integrated GPU.
- **A living camera.** Never quite still: a slow push toward the subject
  and back (a hair over a percent of its distance, a dozen seconds a
  cycle), a slow drift round it (under a degree), the breath beside them.
- **Life in the world** (on real time, so a held frame still lives): wind in
  every tree (`mats.ts` `foliageMat`: a sway per leaf by height and place,
  the garden's tree too); mist on the ground in the mornings (`MIST`: a
  height-fog patch on three's fog chunks, thickest about half past six, a
  breath at dusk and at night, none inside a room); four cars on the two
  cross streets (`world.ts` `drive`; the main street belongs to the story).
- **Light that belongs to someone.** The enquiry carries a light over the
  roofs it flies across (`mailLight`), the route's pulse lights the houses
  it passes (`pulseLight`), and every customer who gives up is a window
  gone dark across the town (`crowd.ts` `gone`, read by the window loop).
- **Weight.** Arrivals overshoot a little and settle (`ease.ts` `settle`):
  the lifted screens, the admin cards, the inbox strips, the deck's pieces,
  the route's parts. The vans' wheels turn with the road and the body rides
  on its springs (`roll`); an impact shakes the camera as the paper hits
  the floor and on landing after the rewind. The new deck's build is a slow
  arc round it as the pieces drop in; Sam starts when the reply lands.

## The new way: a system of light (round 25)

The half after the turn was rebuilt as sci-fi, not as the same town with a
line on it. Everything about it is in `system.ts`:

- **The loop.** One clean arc (`arcAt`) from Sam's roof over the town to the
  workshop, bowing south and rising to twenty metres, and a lower return arc
  bowing north: a closed curve. Five stations stand on the outbound arc
  (website at Sam's end, reply, booking, quote, invoice at the workshop);
  the follow-up on the return.
- **A station** is a ring of light on a hairline beam from the ground (a
  cylinder with a vertex-colour gradient, additive), a scanner segment that
  runs round the ring (faster while the station works), a ping ring that
  spreads as it starts, and a tag of dark glass under it (`nodeLabel` dark).
  Its work card hangs under the tag (`CARD_DROP`), a hologram.
- **The scan.** At 16.76 the ground shader draws a ring of indigo sweeping
  out from the workshop (`uScan` in `groundMat`, with a faint wake); each
  station rises when the ring reaches it (`rise`: beam, then ring, then
  tag), so the system reaches out from the business; then the line draws
  itself from the customer's house round the loop (`draw`).
- **The comet.** The customer on the loop is a bright head with a long tail
  the way it came (`uPulse`: u, on, direction, warmth: amber for the
  customer's own messages, indigo for the business's). Two more pulses
  (`uPulseB/C`) run the loop on their own after six o'clock.
- **Holograms** (`cards.ts`, `holo`): dark glass (opacity 0.8, roughness
  0.18), a band of light round the face (`edgeGeometry`), and the screen
  built top-down behind a line of light (`HOLO_FRAG`, `card.build`). The
  screens are drawn in a dark palette by swapping `C` for the call
  (`ui.ts` `holo()`; the four screens paint their background from
  `C.surface`).
- **Light, not paper.** In the new way the envelope is a spark (`Envelope`
  `spark`: no face, a wider core, a longer trail). "Typed once, used
  everywhere" is shown: Sam's three answers fly as three bars of light
  (`Fields`) from the website station along the loop and drop into the
  quote's lines as it builds.
- The camera holds at stations are relative to them (`station(i, dx, dy,
  dz)` in camera.ts): move a station and the shot follows.

## Reading and control

**You steer, it keeps its pace** (`clock.ts`, `timeline.ts` `capAt`): the
film runs no faster than about 2.6 times its own playing pace whatever the
wheel does (the rewind slower still), and the page is held no more than a
screen ahead of the film, so a hard flick runs it briskly, never past what
can be seen, and when you stop it coasts for a moment and settles on a
composed frame. A full flick-through takes about seventy seconds. Measured
with a synthetic wheel: a hard flick that used to carry 1.8 screens at 1.5
screens a second now runs at 0.5 and lands on the next rest.

**The render scale adapts** (`Film.tsx`): the ceiling is the screen's own
ratio up to 1.5; frame gaps are watched in windows of a second and a half,
a slow median (past 19 ms) steps the scale down by 15% (to 0.7 at the
least), a fast one for six seconds steps it back up. The scene pass alone is
about 12 ms at 1080p on an integrated GPU (shadows, the environment and the
MSAA each about 2 ms of it; nothing dominates), so the scale is the lever.


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
