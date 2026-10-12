# The story (/story/): "The quiet leak"

Story mode is its own page at `/story/`. It follows one customer through a
business assembled from disconnected parts, shows the evening that keeps
those parts running, then rebuilds the same route. The final return belongs
to the customer. The final release belongs to the owner.

Keep the order of decisions: **the problem, the route, the words, then the
effects.** Each effect must explain a handover, a loss or a change. The
customer gives the camera a reason to move through the machine.

The words live in `content/story.ts`. The film, progress controls, part
labels and transcript all use it. `docs/BLOG-GUIDE.md` applies: plain New
Zealand English, no em dashes, facts checked and cited, no invented clients
or business results.

## The five acts

The five acts describe the film's arc. Chapter IDs remain stable because
the clock, camera, simulation and sound refer to them.

| Act | Chapters | The point |
|---|---|---|
| 00 One customer | open | Someone chose the business. Stay with that person. |
| 01 The cost | website, inbox, admin, followup, you | The customer waits, gets copied between systems, pays, then falls beyond the end of the relationship. The owner turns the crank at 11:47pm. |
| 02 The break | turn | The hand leaves the crank. Silence holds the whole machine in view before the old parts come apart. |
| 03 The rebuild | new-website, new-ai, new-platform, new-followup | The same customer repeats the route. The entrance opens, the enquiry has a response, details travel with the job, and the final track carries the person back. |
| 04 Your evening | new-you, end | At 6pm, the lamp goes out while the connected machine keeps carrying the work. The offer turns attention to the reader’s own business. |

The rebuilt chapters answer their old counterparts in the same physical
place. Avoid presenting a list of services without the person travelling
through them. The turn is a decision, and the closing image is a release.

## An illustrative story, with one research finding

The machine is a metaphor, not a client case study or a forecast. Its
customers, losses, timings and rebuilt outcome belong to the film. The
transcript says this, and the counters are labelled as film
counters. Do not imply that an actual business will keep every customer,
answer every enquiry immediately or let every owner leave at 6pm.

One research finding remains in the website chapter: Google’s 2016 global
data put likely abandonment at 53% when a mobile page took over three
seconds. It is historical context, not a current New Zealand benchmark or
a measurement of the reader’s website.

Source: Alex Shellhammer and Juliette Neel, "The need for mobile speed",
Google, 8 September 2016,
https://blog.google/products/admanager/the-need-for-mobile-speed/.
The page and its footnote for this finding were read on 12 October 2026.

The previous inbox line about sevenfold lead qualification was removed.
The public page of "The Short Life of Online Sales Leads" did not expose
that result when checked on 12 October 2026. The source record remains in
`SOURCES` for API compatibility; the transcript derives its source list
from chapter citations and does not publish unused records.

## What the effects mean

| Picture | Meaning |
|---|---|
| Warm lights, with one brighter customer | People who have chosen the business; the camera stays with one. |
| Heavy iron gate and loading gauge | The first door keeps people waiting. |
| Inbox tray under a sun and moon wheel | An enquiry waits while the night passes. Dimming is an expressive metaphor, not a measured probability. |
| Separate spreadsheet, quote and invoice trays; claws over open gaps | Someone must carry the same details between systems. |
| Gold stamp in the invoice tray | The job is paid. The relationship still has somewhere to go. |
| Track ending in open air; camera diving after the customer | The machine has no route for keeping the relationship going. |
| Red pit receiving lights from every floor | Losses accumulate beyond the owner’s view. |
| Tiny figure, desk lamp, crank and 11:47pm clock | The owner supplies the effort that the disconnected parts require. |
| Stopped crank and silence | Time to see the whole problem and choose to rebuild it. |
| Iron falling away; glass and indigo connections assembling | The handovers become one continuous route. |
| Open ring where the gate stood | A clear way to enquire. |
| Glass turbine under the moon | First questions and job details can be handled after hours, with judgement left to the team. |
| Continuous channel through quote, booking and invoice | The details travel with the job. |
| Gold spiral where the last rail ended | Follow-up gives the customer a clear way back when they need the business again. |
| Flywheel and desk lamp switching off at 6pm | In the rebuilt version of the story, the route keeps moving after the owner leaves. |
| Warm paper white | Return to the website and the free audit offer. |

## Reading and control

The film must make sense with sound off. The full words and scene
descriptions are server-rendered in `Transcript.tsx`, in the order they
appear in the film. The transcript
includes the ending and explains the illustrative counters and historical
source. Reduced motion and unavailable WebGL must still allow the reader
to reach this text.

Scrolling sets the film clock `P`, measured in screens. The timeline owns
chapter spans, card windows and composed rests. Play, arrow keys and direct
chapter selection use those same positions. The film is a function of
`P` plus real time for the crowd, so revisiting a chapter preserves its
meaning. Hover labels explain parts of the machine; dropping a customer
in demonstrates the route currently on screen.

Entering the film moves to its first composed shot, where the opening words
are visible. Chapter selection pauses playback before moving. Reading mode
destroys the film's scroll controller and mutes the score, so the transcript
scrolls and responds to keys normally. Returning to the film starts the
controller again without duplicating its listeners.

The camera moves from a distant ascent into intimate customer shots. The
inbox is seen from above, admin loses its horizon, and the rebuilt platform
is level. The return loop opens into a wider view. The customer has a musical
motif that starts unresolved and returns resolved; the old machine's pulse
becomes an ordered rhythm in the new one. Coloured highlights keep their
colour, and the new architectural light does not wash out the words.

Handover positions meet at the turbine, tray exits, claw grips and return
lane. Glass lights roll from their actual displacement and stay rigid at
contact. Rotors integrate angular velocity through start-up. Falling debris
keeps its size, lands above the pit floor and settles with damped motion. The camera
path clears the actual hall and machine geometry, including the nave floor,
bowl rim and columns. Resolution stays fixed during the film; scene MSAA
is chosen from supported half-float sample counts, with directional edge
antialiasing when MSAA is unavailable.

Look development uses `/story/?at=<P>&freeze=1&hud=0`. `q=low|high` can force
the quality tier. `window.__story` exposes `jump`, `frames`, `state`,
`bench`, `world` and `Score`. Check the opening, final fall, owner reveal,
turn, return loop and lamp going out on both desktop and phone layouts.
The copy must stay readable at every composed rest.
