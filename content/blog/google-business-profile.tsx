import { PAGES } from "@/lib/content";
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
        nothing. Check that your business is eligible, claim or add the profile, then work through verification and
        the details customers need.
      </p>

      <H2 id="what-it-is">What a Business Profile is</H2>
      <p>
        A Business Profile lets you manage information about your business on Google Search and Maps: your name,
        hours, address or service area, phone, web address, photos and services. It also brings customer reviews
        together. Managing a profile is free, though Google can use other sources to update its information.
        <Cite n={1} />
      </p>
      <p>
        Not every business can have one. Eligible businesses generally meet customers in person: a shop, a clinic,
        a workshop customers visit, or a trade that travels to them.
        <Cite n={1} /> A business that sells only online, with no premises and no visits, doesn’t qualify; its place
        is earned in the ordinary search results instead (see <a href={PAGES.article("what-is-seo")}>what SEO involves</a>).
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
                A profile needs a Google Account.
                <Cite n={1} /> Our advice: use one tied to your business email rather than a personal account only
                one person can reach, and turn on two-step verification while you are there.
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
                Add your hours, services, photos and a link to your site. Complete, accurate information helps
                Google understand the business and helps customers decide whether to visit.
                <Cite n={3} />
              </p>
            ),
          },
        ]}
      />
      <p>
        Two rules catch people out. There should be only one profile per business, so don’t create a second because
        the first one is in an old staff member’s name.
        <Cite n={4} /> Ask for ownership instead: Google sends your request to the current owner, who has three days
        to respond; if they don’t, you may be able to claim the profile.
        <Cite n={5} /> And if you work from home and travel to customers, set the profile up as a service-area
        business rather than showing your street address.
        <Cite n={4} />
      </p>

      <H2 id="verification">Getting verified</H2>
      <p>
        Verification proves to Google that you speak for the business. The method is chosen by Google and can’t be
        swapped: depending on the business it may be a video, a code by phone, text or email, or a postcard.
        <Cite n={6} />
      </p>
      <ul>
        <li>
          <strong>Video, when offered.</strong> Google recommends this option when it is available.
          <Cite n={6} /> You record where the business is (street signs, nearby landmarks), that it exists (the sign,
          the van, the tools or equipment) and that you run it, such as opening the till or reaching areas only staff
          can. It must be one live, unedited recording of at least 30 seconds, made and uploaded on a mobile device,
          with no bank, tax or ID numbers and no other people’s faces in it.
          <Cite n={7} />
        </li>
        <li>
          <strong>A postcard, if it comes to that.</strong> Most codes arrive within 14 days, and the code expires
          after 30 days.
          <Cite n={6} />
        </li>
        <li>
          <strong>Waiting for a postcard code.</strong> Don’t change the business name, address or category while
          waiting for it: those changes invalidate the code. Requesting a second code invalidates the first.
          <Cite n={6} />
        </li>
        <li>
          <strong>Then a review.</strong> After you apply, Google says review takes up to five business days, and a
          confirmation email arrives when it is done.
          <Cite n={6} />
        </li>
      </ul>

      <H2 id="fill-in">What to fill in first</H2>
      <p>
        Google says complete and accurate information makes a business more likely to appear in local results.
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
          vehicles. Use clear, recent photographs that show customers what to expect.
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
        Google says local results depend mainly on relevance, distance and popularity.
        <Cite n={3} /> Relevance is how well the profile matches the search, which clear business details can help.
        Distance is how far the business is from the person searching.
        Popularity is how well known the business is, and Google counts the reviews it has and the websites that link
        to it.
      </p>
      <p>
        You cannot pay Google for a better local ranking.
        <Cite n={3} /> If someone promises a particular map position, ask what work they will do and how they can
        support that promise.
      </p>

      <H2 id="reviews">Reviews: asking and replying</H2>
      <p>
        Make asking for a review part of finishing a job. Google lets you share a review link or a QR code
        customers can scan.
        <Cite n={8} /> Asking everyone is fine. Paying, discounting or gifting in exchange for reviews is not:
        Google prohibits offering incentives for posting or changing a review, or removing a negative one.
        <Cite n={8} />
      </p>
      <p>
        Replying matters too. Google encourages helpful replies, and reviews contribute to how well known it
        considers a business.
        <Cite n={3} /> For a critical review, address the issue calmly and offer a way to resolve it privately.
      </p>

      <H2 id="keep-it-working">Keeping it working</H2>
      <p>Once the profile is live, use this list for a regular check:</p>
      <Check
        items={[
          <>
            <strong>Hours checked each term,</strong> and after any change to openings, staffing or holidays. Update
            the profile the day something changes.
          </>,
          <>
            <strong>One primary owner.</strong> A profile can have several owners but only one primary owner, and
            each person needs their own Google Account.
            <Cite n={9} /> Keep primary ownership with an account the business controls, so access does not depend on
            one person’s phone.
          </>,
          <>
            <strong>Access cleaned up</strong> when a staff member or contractor leaves: remove their access the same
            day.
          </>,
          <>
            <strong>Two-step verification on the account</strong> that owns the profile. Own Your Online recommends
            authenticator apps or keys over codes by text.
            <Cite n={10} />
          </>,
          <>
            <strong>Photos refreshed</strong> a few times a year, so the front of the business still matches the
            front door.
          </>,
          <>
            <strong>Every review answered,</strong> good or bad, in good time.
            <Cite n={8} />
          </>,
          <>
            <strong>The web address tested monthly:</strong> the button still leads somewhere that works, on a phone.
          </>,
        ]}
      />

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        Your profile and your website should agree on hours, services and contact details. Send us your web address
        for the free audit and we’ll look at the two together, including the pages visitors reach from the profile.
        If those pages need work, that falls within our{" "}
        <a href={PAGES.service("websites")}>websites service</a>.
      </p>
    </>
  );
}
