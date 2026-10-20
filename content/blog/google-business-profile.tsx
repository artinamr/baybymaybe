import { PAGES } from "@/lib/content";
import { H2, Callout, Check, Steps, Cite } from "@/components/blog/Prose";
import { Term } from "@/components/blog/Term";

export const toc = [
  { id: "what-it-is", title: "What it is, and who can have one" },
  { id: "add-or-claim", title: "Add or claim yours" },
  { id: "verification", title: "Getting verified" },
  { id: "fill-in", title: "What to fill in first" },
  { id: "local-ranking", title: "How local ranking works" },
  { id: "reviews", title: "Reviews: asking, replying and the rules" },
  { id: "problems", title: "When it goes wrong" },
  { id: "example", title: "An example: a mobile dog groomer" },
  { id: "keep-it-working", title: "Keeping it right: a checklist for today" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        To get your business on Google Search and Maps, set up its free{" "}
        <Term id="google-business-profile">Google Business Profile</Term>: the listing Google shows on the map and
        beside its results when someone nearby searches for a plumber, a physio or a café. Check you qualify, claim or
        add the profile, get it verified, then keep its details true, because customers act on them.
      </p>

      <H2 id="what-it-is">What it is, and who can have one</H2>
      <p>
        A Business Profile lets you manage how your business shows up on Google Search and Maps: your name, hours,
        address or service area, phone, website, photos and services, and the reviews customers leave. It’s free, and
        Google also updates profiles from other sources, such as user reports, so check yours even if you set it up
        years ago.
        <Cite n={1} />
      </p>
      <p>
        Only businesses that make face-to-face contact with customers are eligible: a shop, a clinic, a workshop
        customers visit, or a trade that travels to them.
        <Cite n={1} /> Virtual offices and rented mailing addresses aren’t eligible.
        <Cite n={2} /> If you sell only online, you can’t have a profile; your place is earned in the ordinary search
        results instead (see <a href={PAGES.article("what-is-seo")}>what SEO involves</a>).
      </p>
      <Callout title="Yours may already exist">
        <p>
          Google Maps users can add missing places to the map, and a place shows publicly once it’s added.
          <Cite n={3} /> So a listing for your business may be there already, with details you didn’t write. Google
          warns that unclaimed locations make a business more vulnerable to hijacking.
          <Cite n={4} /> Claiming and verifying it puts it in your hands.
        </p>
      </Callout>

      <H2 id="add-or-claim">Add or claim yours</H2>
      <Steps
        items={[
          {
            t: "Search Google Maps for your business’s name and town",
            b: (
              <p>
                If a listing appears, choose “Claim this business”, then “Manage now”.
                <Cite n={5} /> If someone else already controls it, see <a href="#problems">when it goes wrong</a>.
              </p>
            ),
          },
          {
            t: "If nothing appears, add your business",
            b: (
              <p>
                Go to business.google.com/add and choose “Add your business to Google”. It asks for the name, the
                address or service area, the category and contact details.
                <Cite n={5} />
              </p>
            ),
          },
          {
            t: "Sign in with an account the business controls",
            b: (
              <p>
                You need a Google Account.
                <Cite n={1} /> Our advice: use one tied to your business email, not a personal account only one person
                can reach. Turn on <Term id="two-factor">two-step verification</Term>, as Google suggests.
                <Cite n={4} /> Own Your Online recommends an authenticator app, token or physical key, as codes sent by
                text or email can be intercepted.
                <Cite n={6} />
              </p>
            ),
          },
          {
            t: "Verify it",
            b: (
              <p>
                It can take days or weeks (see <a href="#verification">getting verified</a>), so start before you need
                the profile.
              </p>
            ),
          },
          {
            t: "Fill it in, then keep it true",
            b: (
              <p>
                Google says businesses with complete and accurate information are more likely to show up in local
                search results.
                <Cite n={7} />
              </p>
            ),
          },
        ]}
      />
      <p>
        Two rules catch people out. Keep to one profile per business: Google says there should be only one, as more
        than one can cause problems with how your information shows on Maps and Search.
        <Cite n={2} /> And if you work from home and travel to customers, set a service area and remove your home
        address from the profile.
        <Cite n={8} />
      </p>

      <H2 id="verification">Getting verified</H2>
      <p>
        Verification is how Google checks that you really run the business. Google chooses the method, and you can’t
        change it: depending on the business, it may be a video, a code by phone, text or email, or a postcard.
        <Cite n={9} />
      </p>
      <ul>
        <li>
          <strong>Video, when it’s offered.</strong> Google recommends it.
          <Cite n={9} /> It must be one live, unedited recording of at least 30 seconds with no breaks, made and
          uploaded on a mobile device through your Business Profile. Keep bank, tax and ID numbers, and other people’s
          faces, out of shot.
          <Cite n={10} />
        </li>
        <li>
          <strong>What to film.</strong> Where the business is (street signs or nearby landmarks), that it exists (its
          name on a permanent sign or, if you travel to customers, your tools and equipment) and that you run it
          (opening the till, an area only staff can reach, or unlocking your branded van).
          <Cite n={10} />
        </li>
        <li>
          <strong>A postcard.</strong> Most codes arrive within 14 days, and codes expire after 30 days. While you wait,
          Google asks you not to edit the business name, address or category, and not to request a new code.
          <Cite n={9} />
        </li>
        <li>
          <strong>Then a review.</strong> Verification reviews take up to five business days, and Google emails you
          when your business is verified.
          <Cite n={9} />
        </li>
      </ul>
      <p>
        Changing the business name after verification might mean verifying again, and moving to a new address means
        you must.
        <Cite n={11} />
      </p>

      <H2 id="fill-in">What to fill in first</H2>
      <p>Work through these before you polish anything else.</p>
      <ul>
        <li>
          <strong>The name on your sign.</strong> Google asks for your business’s real-world name, and says including
          unnecessary information in it isn’t permitted and could get the profile suspended.
          <Cite n={2} /> So “Smith Plumbing”, not “Smith Plumbing Emergency Plumber Auckland”.
        </li>
        <li>
          <strong>As few categories as possible.</strong> Google asks for as few as you need to describe your core
          business.
          <Cite n={2} /> Pick the one that says what you are, then list your services.
        </li>
        <li>
          <strong>Hours, including the odd ones.</strong> Set your regular hours, then special hours for public
          holidays and closures of up to six days in a row. Google suggests confirming holiday hours even when they
          match your usual ones, and marking the business temporarily closed for seven days or more.
          <Cite n={12} />
        </li>
        <li>
          <strong>A description in your own words.</strong> Up to 750 characters, about the business rather than
          promotions, prices or sales, and with no web addresses.
          <Cite n={11} />
        </li>
        <li>
          <strong>Photos that look like today.</strong> At least three each of the outside, the inside, your work and
          your team, in focus and well lit, without heavy filters or AI changes.
          <Cite n={13} />
        </li>
        <li>
          <strong>A phone number and website that reach you.</strong> Give a number that connects to your business,
          and no number or web address that redirects people elsewhere.
          <Cite n={2} /> Link the page that helps next, usually booking or contact.
        </li>
      </ul>
      <Callout title="Dates to set special hours for">
        <p>
          Labour Day is Monday 26 October 2026, Christmas Day Friday 25 December 2026 and Matariki Friday 25 June 2027.
          Each region also has its own anniversary day: Canterbury’s is Friday 13 November 2026, Wellington’s Monday 25
          January 2027 and Auckland’s Monday 1 February 2027. Employment New Zealand lists them all, and suggests
          checking regional dates with your local council.
          <Cite n={14} />
        </p>
      </Callout>

      <H2 id="local-ranking">How local ranking works</H2>
      <p>
        Google says local results are mainly based on relevance, distance and popularity.
        <Cite n={7} /> Relevance is how well your profile matches the search, so complete, detailed information helps.
        Distance is how far you are from the person searching.
      </p>
      <p>
        Popularity, which Google’s own heading calls prominence, is how well known the business is. Google points to how
        many websites link to it and how many reviews it has, and says more reviews and positive ratings can help.
        <Cite n={7} />
      </p>
      <p>
        You can’t buy a better place: Google says there’s no way to request or pay for a better local ranking.
        <Cite n={7} /> You can’t change distance either, which is why a business across town can outrank you for
        someone searching near it. If someone promises you a map position, ask what work they’ll do and how they
        could know.
      </p>

      <H2 id="reviews">Reviews: asking, replying and the rules</H2>
      <p>
        Ask every customer, as part of finishing the job. You can ask customers to visit a Google link or scan a QR
        code, and they must be signed in to a Google Account to leave a review.
        <Cite n={15} />
      </p>
      <p>Google’s rules are strict:</p>
      <ul>
        <li>
          <strong>No incentives.</strong> Offering free or discounted goods or services in exchange for reviews is
          strictly prohibited,
          <Cite n={15} /> and so is any incentive to change or remove a negative review.
          <Cite n={16} />
        </li>
        <li>
          <strong>Ask everyone, not only the happy ones.</strong> Google’s policy bans discouraging negative reviews or
          selectively asking for positive ones, asking staff to collect a set number of reviews, and requiring or
          pressuring customers to review while they’re on the premises.
          <Cite n={16} />
        </li>
        <li>
          <strong>No conflicts of interest.</strong> That rules out reviews from staff, past staff, contractors,
          competitors and family: Google’s policy counts each as a possible conflict of interest.
          <Cite n={16} />
        </li>
      </ul>
      <p>
        New Zealand law backs this up. The Commerce Commission says reviews must be genuine and presented in a way that
        doesn’t mislead the reader about the overall message the reviewer intended.
        <Cite n={17} />
      </p>
      <p>
        In December 2025 the District Court found The TV Shop guilty on Fair Trading Act charges; among other things,
        its staff had written positive “customer” reviews.
        <Cite n={18} /> In 2026 it was ordered to pay $1,104,000 for conduct that included those reviews and holding
        back reviews of three stars or fewer unless the customer answered a follow-up email.
        <Cite n={19} />
      </p>
      <p>
        Reply to every review, good or bad. The reviewer is notified when you reply, and an approved reply is posted
        publicly under their review.
        <Cite n={20} /> Google’s tips: be direct and honest, address the reviewer by name, acknowledge their specific
        feedback, and respond to criticism in good time.
        <Cite n={15} />
      </p>
      <p>
        Report a review only if it breaks Google’s rules, not because you disagree with it. Evaluation typically takes
        several days, and if the review isn’t removed you can appeal once.
        <Cite n={21} />
      </p>

      <H2 id="problems">When it goes wrong</H2>
      <p>Google’s own advice, problem by problem:</p>
      <ul>
        <li>
          <strong>Someone else controls the profile:</strong> a former staff member, an old agency or a stranger.
          Don’t create a second profile. At business.google.com/add, find the business, choose “Request Access” and
          fill in the form. The current owner has three days to respond; if they don’t, you may be able to claim the
          profile, though that option isn’t always available.
          <Cite n={22} />
        </li>
        <li>
          <strong>It has been suspended.</strong> Google may suspend or disable a profile that breaks its guidelines;
          its owners and managers then can’t act on it. Fix what’s wrong, then appeal. You get one appeal, so attach
          documents showing the profile’s name and address, such as a business registration, licence, tax certificate
          or utility bill. Don’t create a new profile.
          <Cite n={23} />
        </li>
        <li>
          <strong>Someone asks for money.</strong> Google says it will never try to convince you to pay to maintain,
          verify or reinstate your profile, and never asks for a one-time password or PIN.
          <Cite n={4} /> Nor will it ask for payment information by phone or guarantee a special spot. Hang up, and
          don’t press any buttons, even if a recording tells you to.
          <Cite n={24} />
        </li>
        <li>
          <strong>A sudden run of one- and two-star reviews, then a demand.</strong> That’s extortion. Don’t engage
          with the people behind it or pay them: paying doesn’t guarantee the reviews come down. Gather evidence and
          report it on Google’s extortion report form.
          <Cite n={25} />
        </li>
        <li>
          <strong>Someone who left still has access.</strong> Remove them under “People and access”,
          <Cite n={26} /> and don’t approve access requests unless you know the person asking.
          <Cite n={4} />
        </li>
      </ul>
      <p>
        For one location, all of this is work an owner can do, and the profile costs nothing. Paying someone makes most
        sense when you have many locations, or a problem here that won’t shift.
      </p>

      <H2 id="example">An example: a mobile dog groomer</H2>
      <p>
        An illustration, not a client. A one-person business grooms dogs in customers’ driveways from a signwritten
        van, and keeps the van at home in Lower Hutt.
      </p>
      <ul>
        <li>
          <strong>Eligible?</strong> Yes: it goes to its customers. It doesn’t serve them at home, so the home address
          comes off the public profile.
          <Cite n={8} />
        </li>
        <li>
          <strong>Name and category.</strong> The name on the van and the invoices, with nothing added,
          <Cite n={2} /> and the one category that says what it is.
        </li>
        <li>
          <strong>Service area.</strong> Lower Hutt, Upper Hutt, Wellington and Porirua, entered as named areas
          rather than a radius, and well within about two hours’ drive of base, which Google says the area
          shouldn’t exceed.
          <Cite n={8} />
        </li>
        <li>
          <strong>Verification.</strong> If video is offered: a street sign near home, the clippers and the grooming
          table, then unlocking the van.
          <Cite n={10} />
        </li>
        <li>
          <strong>Hours.</strong> Regular hours, then special hours for Labour Day, Christmas, New Year and Wellington
          Anniversary Day.
          <Cite n={14} />
        </li>
        <li>
          <strong>Reviews.</strong> A card with the review QR code, left with every dog, with nothing offered in
          return.
          <Cite n={15} />
        </li>
        <li>
          <strong>The website button.</strong> Straight to the booking page.
        </li>
        <li>
          <strong>Measuring.</strong> Each month the owner reads the profile’s performance figures: calls, website
          clicks and the searches people used to find it.
          <Cite n={27} />
        </li>
      </ul>

      <H2 id="keep-it-working">Keeping it right: a checklist for today</H2>
      <p>Go through this list today, then again once a month.</p>
      <Check
        items={[
          <>
            <strong>Hours checked</strong> before every public holiday and after any change to opening times or
            staffing. Update the profile the day something changes.
          </>,
          <>
            <strong>The business holds primary ownership.</strong> A profile can have several owners but only one
            primary owner, and each person needs their own Google Account.
            <Cite n={26} /> Keep primary ownership with an account the business controls, the same rule as for your{" "}
            <a href={`${PAGES.article("after-launch-ownership")}#owning`}>domain and hosting</a>.
          </>,
          <>
            <strong>A second owner, added early.</strong> New owners and managers wait seven days before they can
            manage some features,
            <Cite n={26} /> so add one well before anyone leaves.
          </>,
          <>
            <strong>Access removed</strong> the day someone leaves the business.
            <Cite n={4} />
          </>,
          <>
            <strong>Two-step verification</strong> on every account with access.
            <Cite n={4} />
            <Cite n={6} />
          </>,
          <>
            <strong>Photos refreshed</strong> a few times a year, so the front of the business still matches the front
            door.
          </>,
          <>
            <strong>Every review answered,</strong> good or bad, in good time.
            <Cite n={15} />
          </>,
          <>
            <strong>The website button tested</strong> on a phone.
          </>,
          <>
            <strong>The numbers read:</strong> calls, website clicks, direction requests and the searches that found
            you. They’re there for verified profiles only, and the searches update at the start of each month.
            <Cite n={27} />
          </>,
          <>
            <strong>Apple Maps too.</strong> Apple’s free Apple Business service lets you customise your Apple Maps
            place card with photos, hours and location details, and Apple lists brand and location management for New
            Zealand.
            <Cite n={28} />
            <Cite n={29} />
          </>,
        ]}
      />

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        Your profile and your website should agree on the name, hours, services and contact details. Send us your web
        address for the free audit and we’ll check the two together, including the page the profile’s website button
        opens and whether it makes the next step easy. If that page needs work, it falls within our{" "}
        <a href={PAGES.service("websites")}>websites service</a>.
      </p>
    </>
  );
}
