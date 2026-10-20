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
| turn | 15.0–18.0 | Hands off the keyboard. Silence. The jobs round the desk burn to light from their edges; the sparks run together over the keys into a drop of liquid glass. It rises out through the window and up over the town while the night runs back to 7:37pm, then dives across the roofs into Sam's garden. |
| new-website | 18.0–19.8 | Sam again, the same evening. The drop goes to Sam's phone and opens into the page, there at once, one clear button. Almost every phone over the town stays lit. Three answers, each an amber point in the glass; sent. |
| new-ai | 19.8–21.8 | The drop turns into the reply: times for a free measure-up. Sam picks Wednesday; the drop crosses the town and opens into your calendar. 3am: a window lights up; the drop answers Aroha; her consent question waits over your desk for the morning. |
| new-platform | 21.8–23.8 | Morning: the question waiting. After the measure-up the drop opens into the quote and Sam's three amber points flow into its lines; you add the price. It crosses to Sam, who accepts. The deck goes in board by board; the drop becomes the invoice and Sam pays. |
| new-followup | 23.8–25.8 | How did we do: five stars. A year passes with the drop resting as dew on the deck's edge. It wakes into the reminder; Sam books, and your van pulls up. |
| new-you | 25.8–28.0 | The drop flies home with the late sun. Six o'clock: it shows the day, nothing waiting on you. You close the laptop; it settles beside it. As you drive home it goes out to answer a new enquiry. |
| end | 28.0–29.6 | Up over the town in the evening light; the drop rises to the lens until its light is the picture; paper. "Find your leaks." and the free audit. |

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
| The cards burning to light and running together into one drop | The old way's paperwork becoming the new way: one system that does the work. |
| The clock running back while the drop climbs | The same evening again. |
| A drop of liquid glass with light inside | The new way: website, assistant, booking, quote, invoice, follow-up, as one thing. |
| The drop opening into a screen | That part working: the page, the reply, the calendar, the quote, the invoice, the review, the reminder, the day. |
| Three amber points inside the drop | Sam's details, typed once and carried everywhere; they flow into the quote's lines. |
| A window lighting up across the dark town | Another customer asking, answered at any hour. |
| The drop as a drop of dew through a year | Ready and waiting until it is time to get in touch again. |
| The lamp switched off at six | The evening given back. |
| Warm paper white | Back to the website and the free audit offer. |

## The look

A real New Zealand suburb at the head of a bay (round 26, after "the
background and the houses are still terrible"): its northern street is the
beach road (a verge under pohutukawa, a low sea wall, sand, the harbour, a
volcanic island under dark bush, the far shore); paddocks with shelter belts
rising to hills on the other three sides (`land.ts`). Houses in their own
colours (warm whites, creams, greys, sage, a few dark modern ones), steel
roofs in Colorsteel greys and charcoals with a few red and green, white
fascia and gutters, weatherboards drawn in the shader (`mats.ts`
`houseMat`). Every window is glass with a room behind it (`glass.ts`:
interior mapping, a lamp, furniture, curtains; the sky reflected). Trees are
leaf cards lit as crowns, with wind and light through them (`trees.ts`);
hedges too. Lawns are mown, the tar grained, the footpaths jointed, the
kerbs real.

The sky follows the film's clock (`sky.ts`, `atmos.ts`: golden hour,
sunset with the Belt of Venus opposite, the blue hour, night under a moon
with the town's glow on the horizon, morning, day, broken cloud lit by the
sun's side). The sky is the world's light: captured into a cube as it
changes and convolved (`scene.environment`). The haze lies low and thins
with height and takes the horizon's colour in the direction looked, so the
hills stand in layers and the sea's horizon dissolves; a morning mist on the
lawns. Soft shadows from the sun or moon focused on what the camera sees,
baked occlusion, streetlight pools baked into the ground, bloom on the
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
- **The rewind.** The camera follows the new drop out of the office and up
  over the town while the whole old half runs backward (`world.ts`: world time `Pw` sweeps from
  the desk at 11:48pm back to the evening the enquiry was sent, over 0.4
  screens, eased) while the hours spin back through two days (the sun
  wheels backward, the windows blink through two nights, the inbox tower
  unbuilds, the vans reverse, the deck unweathers, the enquiry flies home).
  The lens strains (fringe and grain up), the clock on screen runs
  backward, a tone winds down under the riser. It lands on 7:37pm the first
  evening, the drop hanging over the town at dusk.
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

## The new way: the drop (round 26)

Round 25's loop of light with stations on it was rejected ("the wire in the
air ... and just added ring to it"). The new way is now one thing: a drop of
liquid glass with light inside it. It is born at the turn from the owner's
paperwork, and from then on it carries the job: it becomes each piece of
software the job needs and travels between them.

- **The drop** (`drop.ts`): one finely divided sphere whose vertices are
  placed by a shape blended in the vertex shader, a drop (stretched along its
  way when it moves fast, trembling after a stop) or a panel (a slab with
  round edges and soft corners). It is drawn after the scene over a copy of
  it (`post.ts` overlay), so it bends what is behind it (most at the rim,
  the colours split there), reflects the sky (`atmos.ts`), and holds its
  light: an indigo heart, white at the middle, measured along each view ray;
  the rim lit from inside. As a panel its face shows a screen (`ui.ts`).
  It has its own soft light in the world and its own depth for the depth of
  field.
- **Its journey** (`journey.ts`): where it is at every P (keys joined by a
  shape-preserving Hermite curve, like the camera's), what it is
  (`PANELS`: when it opens into which screen, its size, which way it faces),
  its size and light (resting small on the desk, a drop of dew through the
  year, growing to fill the lens at the end), and Sam's three amber points
  (from the form until they flow into the quote's lines).
- **The turn** (`gather.ts`, `cards.ts` `burn`): the jobs' cards hold
  still, then burn away from their edges with a hot rim; what they were made
  of goes off them as sparks that curl round the owner and run together over
  the keys, where the drop forms. The inbox pile outside goes with them.
- **The camera** rides with it (`camera.ts` `dr`, `chase`, `ahead`): out
  through the office glass and up over the town during the rewind, the dive
  along the main street to Sam's garden, after it across the town with the
  booking, to Aroha's window at 3am, with the quote to Sam, home in the late
  sun; and a macro on the dew. While it chases, the camera smooths over a
  narrower window (`CHASES`): the drop's own path is smooth, and a wide
  window averaged the camera across a flight shorter than itself and lost it.
- **Who calls it**: at 3am and at six, a house's window lights up across the
  town (`world.ts` `callers`, the nearest real houses) before the drop goes.

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
drop, the camera and the grade. `town.ts` (the suburb, chunked for
culling), `places.ts` (the customer's house, the workshop), `figure.ts` (the
blank figure: forward kinematics for the body, two-bone IK for the limbs),
`people.ts` (poses as data, blended: sitting with a phone, typing, standing,
walking with planted feet), `ui.ts` (every screen), `cards.ts` (screens,
cards, the inbox strips), `mail.ts` (envelopes), `crowd.ts` (the town's phones), `drop.ts` and `journey.ts` (the new way), `gather.ts` (the turn's sparks),
`land.ts` (the land, the bay, the sea), `atmos.ts` (the sky's colours, read everywhere), `glass.ts` (the
windows' rooms), `trees.ts` (leaf trees and hedges), `camera.ts` (the shot list: Hermite
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
