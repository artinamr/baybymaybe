import { H2, Callout, Check, Steps, Cite } from "@/components/blog/Prose";
import { Term } from "@/components/blog/Term";

export const toc = [
  { id: "what-it-is", title: "What a Business Profile is" },
  { id: "add-or-claim", title: "Add or claim yours" },
  { id: "verification", title: "Getting verified" },
  { id: "fill-in", title: "What to fill in first" },
  { id: "local-ranking", title: "How local ranking works" },
  { id: "reviews", title: "Reviews: asking and replying" },
  { id: "keep-it-working", title: "Keeping it working" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        When someone searches for a plumber, a physio or a café “near me”, the map and the business cards beside the
        results come from <Term id="google-business-profile">Google Business Profile</Term>. Setting one up costs
        nothing and takes an afternoon; the verification wait is the longest part. Here is what it is, how to get it,
        and what to fill in so it earns its place.
      </p>

      <H2 id="what-it-is">What a Business Profile is</H2>
      <p>
        A Business Profile is the listing you control that decides how your business appears on Google Search and
        Maps: your name, hours, address or service area, phone, web address, photos, services and reviews. Google’s
        own description is blunt about the price: “you can manage how your business shows up on Maps and Search at no
        charge.”
        <Cite n={1} />
      </p>
      <p>
        Not every business can have one. Google’s rule is that the profile is for businesses that “make face-to-face
        contact with customers”: a shop, a clinic, a workshop customers visit, or a trade that travels to them.
        <Cite n={1} /> A business that sells only online, with no premises and no visits, doesn’t qualify; its place
        is earned in the ordinary search results instead (see <a href="/blog/what-is-seo/">what SEO involves</a>).
      </p>
      <Callout title="It is not an ad, and it is not automatic">
        <p>
          A profile can exist for your business before you ever touch it, because anyone can add a place to Google’s
          map. Until you claim and verify it, you don’t control what it says. Claiming it is what puts it in your
          hands.
        </p>
      </Callout>

      <H2 id="add-or-claim">Add or claim yours</H2>
      <Steps
        items={[
          {
            t: "Search Google Maps for your business’s name and city",
            b: (
              <p>
                If a listing appears, it already exists in some form, and your job is to claim it: choose “Claim this
                business”, then “Manage now”.
                <Cite n={2} />
              </p>
            ),
          },
          {
            t: "If nothing appears, add your business",
            b: (
              <p>
                Google’s page for that is business.google.com/add, where “Add your business to Google” starts the
                same flow: name, address or service area, category, and contact details.
                <Cite n={2} />
              </p>
            ),
          },
          {
            t: "Sign in with an account the business owns",
            b: (
              <p>
                A profile needs a Google Account. Use one tied to your business email rather than a personal account
                only one person can reach, and turn on two-step verification while you are there.
                <Cite n={1} />
              </p>
            ),
          },
          {
            t: "Verify (next section)",
            b: (
              <p>
                Until the profile is verified, you can’t edit what the public sees. This is the step that takes days
                or weeks, so start it before you need the profile.
              </p>
            ),
          },
          {
            t: "Fill in everything, then keep it true",
            b: (
              <p>
                Hours, services, photos, a link to your site. Google ranks complete profiles better, and customers
                use them to decide whether to visit.
                <Cite n={3} />
              </p>
            ),
          },
        ]}
      />
      <p>
        Two rules catch people out. There should be only one profile per business, so don’t create a second because
        the first one is in an old staff member’s name: request ownership instead, which starts with the current
        owner adding you.
        <Cite n={4} /> And if you work from home and travel to customers, set the profile up as a service-area
        business rather than showing your street address.
        <Cite n={2} />
      </p>

      <H2 id="verification">Getting verified</H2>
      <p>
        Verification proves to Google that you speak for the business. The method is chosen by Google and can’t be
        swapped: depending on the business it may be a video, a code by phone, text or email, or a postcard.
        <Cite n={5} />
      </p>
      <ul>
        <li>
          <strong>Video is the common one now.</strong> Google recommends it where it is offered. You record the
          outside of the premises, anything that shows the business is what it claims (the sign, the van, the
          equipment), and proof that you run it, such as access to areas only staff reach.
          <Cite n={5} />
        </li>
        <li>
          <strong>A postcard, if it comes to that.</strong> Most codes arrive within 14 days, and the code expires
          after 30 days.
          <Cite n={5} />
        </li>
        <li>
          <strong>Touch nothing while you wait.</strong> Editing the business name, address or category during
          verification invalidates the code. Requesting a second code invalidates the first.
          <Cite n={5} />
        </li>
        <li>
          <strong>Then a review.</strong> After you apply, Google says review takes up to five business days, and a
          confirmation email arrives when it is done.
          <Cite n={5} />
        </li>
      </ul>

      <H2 id="fill-in">What to fill in first</H2>
      <p>
        An empty profile is a missed one. Google’s advice on local ranking says to “provide complete and detailed
        business info”, and it states the reward plainly: “Businesses with complete and accurate info are more likely
        to show up in local search results.”
        <Cite n={3} /> Work through these before you polish anything else:
      </p>
      <ul>
        <li>
          <strong>Hours, including the odd ones.</strong> Public holidays, the Saturday you close early, the season
          you shut. Wrong hours are the fastest way to send a customer to a closed door.
        </li>
        <li>
          <strong>The right category, then the services.</strong> The one category that says what the business is,
          then the list of services or products with prices where you can.
        </li>
        <li>
          <strong>Photographs that look like today.</strong> The front of the premises, the team at work, the
          vehicles. Ten real photos beat one polished render.
        </li>
        <li>
          <strong>A link to the page that helps next,</strong> usually your booking or contact page, and a phone
          number a human answers.
        </li>
        <li>
          <strong>A description in your own words,</strong> written for a customer skimming on a phone.
        </li>
      </ul>

      <H2 id="local-ranking">How local ranking works</H2>
      <p>
        Google sums up its local ranking in three words: “Local results are mainly based on relevance, distance, and
        popularity.”
        <Cite n={3} /> Relevance is how well the profile matches the search, which is what the details above fix.
        Distance is how far the business sits from the person searching, which you can’t change and don’t need to.
        Popularity is how well known the business is, and Google counts the reviews it has and the websites that link
        to it.
      </p>
      <p>
        One thing is off the table: “There’s no way to request or pay for a better local ranking on Google.”
        <Cite n={3} /> Anyone selling a better map position is selling something Google doesn’t sell.
      </p>

      <H2 id="reviews">Reviews: asking and replying</H2>
      <p>
        Reviews are the part of a profile most owners leave to chance, and the part customers read first. Google’s
        guidance is to ask: share the review link, or a code customers can scan, while the job is still fresh.
        <Cite n={6} /> Asking everyone is fine. Paying, discounting or gifting in exchange for reviews is not:
        “Offering incentives, like free or discounted goods or services, in exchange for customers to post reviews,
        change reviews, or remove negative reviews is considered fake &amp; misleading content and is strictly
        prohibited.”
        <Cite n={6} />
      </p>
      <p>
        Replying is the other half. Google says “Positive reviews and helpful replies can help your business stand
        out”, and it counts reviews towards prominence as well.
        <Cite n={3} /> A calm, specific reply to a critical review does more for the next customer than the review
        itself did.
      </p>

      <H2 id="keep-it-working">Keeping it working</H2>
      <p>Once the profile is live, this is the whole maintenance list:</p>
      <Check
        items={[
          <>
            <strong>Hours checked each term,</strong> and after any change to openings, staffing or holidays. Update
            the profile the day something changes.
          </>,
          <>
            <strong>One profile, one owner.</strong> The profile sits in an account the business owns, with managers
            added under it, so nothing depends on one person’s phone.
            <Cite n={4} />
          </>,
          <>
            <strong>Access cleaned up</strong> when a staff member or contractor leaves: remove their access the same
            day.
          </>,
          <>
            <strong>Two-step verification on the account</strong> that owns the profile. Own Your Online recommends
            authenticator apps or keys over codes by text.
            <Cite n={7} />
          </>,
          <>
            <strong>Photos refreshed</strong> a few times a year, so the front of the business still matches the
            front door.
          </>,
          <>
            <strong>Every review answered,</strong> good or bad, within a few days.
            <Cite n={3} />
          </>,
          <>
            <strong>The web address tested monthly:</strong> the button still leads somewhere that works, on a phone.
          </>,
        ]}
      />

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        A profile is a small system, and it is at its best when it agrees with your website: the same hours, the same
        services, the same words. In the free audit we look at the pair together, the profile and the pages it points
        to, and tell you plainly what is helping and what is missing. Send us your web address and we’ll include it.
        Where the website itself is the weaker half, fixing it is our{" "}
        <a href="/services/websites/">websites service</a>.
      </p>
    </>
  );
}
