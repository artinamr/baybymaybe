import { PAGES } from "@/lib/content";
import { H2, H3, Callout, Check, Figure, Steps, Cite } from "@/components/blog/Prose";
import { DecisionTree } from "@/components/blog/Diagrams";
import { Term } from "@/components/blog/Term";

export const toc = [
  { id: "what-it-is", title: "What SEO is" },
  { id: "how-google-decides", title: "How Google chooses what to show" },
  { id: "what-google-rewards", title: "What Google rewards" },
  { id: "diagnose", title: "Where is your site stuck?" },
  { id: "five-jobs", title: "Five jobs worth doing first" },
  { id: "page-check", title: "A page, checked before it goes live" },
  { id: "how-long", title: "How long it takes, and how to judge it" },
  { id: "paying-someone", title: "Paying someone: what to ask" },
  { id: "not-the-problem", title: "When SEO isn’t the answer" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        Getting found on Google starts with plain work on your own website and, if you meet customers face to face, a
        free Google listing. Before you pay anyone, find where your site is stuck, fix that first, and judge the result
        over weeks, not days.
      </p>

      <H2 id="what-it-is">What SEO is</H2>
      <p>
        When someone searches Google for “heat pump service Hamilton”, the results come from pages Google has already
        found and stored, ranked by how well each seems to answer the search.{" "}
        <Term id="seo">Search engine optimisation</Term> (SEO) is the work of getting your pages onto that list: found,
        understood and chosen for the searches that bring you work.
      </p>
      <p>
        It sits beside advertising. A search ad starts once it passes Google’s review (most are reviewed within one
        business day) and runs while you pay.
        <Cite n={1} /> Search work is slower, but what it builds doesn’t switch off when you stop paying.
        Business.govt.nz counts both, with email and social media, among the online marketing that generally gives the
        most return.
        <Cite n={2} />
      </p>
      <Callout title="Appearing in Google is free">
        <p>
          Google never takes money to include or rank a site, and advertising with Google has no effect on where you
          appear.
          <Cite n={3} /> What people sell is the work.
        </p>
      </Callout>

      <H2 id="how-google-decides">How Google chooses what to show</H2>
      <p>
        Google’s automated crawlers download the pages it finds, its index stores what each page contains, and when
        someone searches it returns the results it judges relevant. That can depend on the searcher’s location, language
        and device.
        <Cite n={4} />
      </p>
      <p>
        You rarely need to ask to be included: Google says the vast majority of sites in its results are added
        automatically as it crawls the web.
        <Cite n={5} /> It doesn’t guarantee to show any page, though, even one that follows Google Search Essentials,
        its basic rules for sites.
        <Cite n={4} />
      </p>
      <p>
        Sites that break Google’s spam policies may rank lower or not appear at all.
        <Cite n={6} /> Three of those policies catch small businesses out:
      </p>
      <ul>
        <li>
          <strong>Keyword stuffing:</strong> filling a page with keywords or numbers to manipulate rankings.
        </li>
        <li>
          <strong>Buying links:</strong> paying for links to rank higher.
        </li>
        <li>
          <strong>Doorway pages:</strong> Google’s examples include many pages aimed at particular regions or cities
          that all funnel people to one page.
          <Cite n={6} />
        </li>
      </ul>
      <p>
        Twenty near-identical “Plumber in [town]” pages, each sending people to the same contact page, fit that last
        description. One page listing the areas you cover doesn’t.
      </p>
      <p>
        AI answers rest on the same work. Google says AI Overviews and AI Mode have no extra requirements and need no
        special optimisation: a page shown as a link must be indexed and eligible to appear with a snippet. Keep
        important content in text, and make sure any <Term id="structured-data">structured data</Term> matches what
        visitors see.
        <Cite n={7} />
      </p>

      <H2 id="what-google-rewards">What Google rewards</H2>
      <p>
        Google’s core advice is to make helpful, reliable content for people.
        <Cite n={8} /> Its self-check asks, among other things, whether a page offers original information or
        analysis, adds real value compared with the other results, and leaves a reader knowing enough to reach their
        goal.
        <Cite n={9} /> For a business site, that means:
      </p>
      <ul>
        <li>
          <strong>One clear page for each thing you sell,</strong> with the words people would search with in
          prominent places: the page title, the main heading, image alt text and link text.
          <Cite n={8} />
        </li>
        <li>
          <strong>A distinct title on every page:</strong> unique, clear, concise and accurate. The snippet under it
          comes mostly from the page itself and only occasionally from your{" "}
          <Term id="title-and-description">meta description</Term>, so the top of the page should say plainly what it
          offers.
          <Cite n={5} />
        </li>
        <li>
          <strong>Your own words.</strong> Don’t copy others’ content, in part or in full.
          <Cite n={5} />
        </li>
        <li>
          <strong>A page that’s easy to use.</strong> Google’s ranking systems use{" "}
          <Term id="core-web-vitals">Core Web Vitals</Term>, and Google asks whether pages avoid intrusive pop-ups and
          too many distracting ads. Relevance still comes first: Google aims to show the most relevant page even if its
          experience is poor.
          <Cite n={10} />
        </li>
      </ul>
      <p>
        Google also has no preferred word count, and it lists writing to one as a warning sign.
        <Cite n={9} />
      </p>

      <H2 id="diagnose">Where is your site stuck?</H2>
      <p>
        Answer these in order. Questions two and three need{" "}
        <Term id="search-console">Google Search Console</Term>, the first of the five jobs below.
      </p>
      <Figure caption="Where your site is stuck: the first “no” is where to start.">
        <DecisionTree
          steps={[
            {
              q: "Does Google have your important pages?",
              no: {
                t: "Start with being found",
                b: "Search Google for site:yourbusiness.co.nz, using your own address. If a service page is missing, check it with Search Console’s URL Inspection tool, fix what it reports and request indexing.",
              },
            },
            {
              q: "Do your pages appear for the searches that bring you work?",
              no: {
                t: "Start with your pages and words",
                b: "Give each service its own page in your customers’ words. If you meet customers face to face, claim your Business Profile.",
              },
            },
            {
              q: "When you appear, do people click?",
              no: {
                t: "Start with titles and openings",
                b: "If a page appears often but is rarely clicked, give it a title and an opening that say plainly what it offers, and where.",
              },
            },
            {
              q: "When people arrive, do they get in touch?",
              no: {
                t: "Start with the page itself",
                b: "More visitors won’t help a page that loses them. Put the next step on the first screen and fix slow pages.",
              },
            },
          ]}
          end={{
            t: "Search isn’t what’s holding you back",
            b: "If every answer is yes, the limit is demand or competition. Advertising, referrals or a new service may help more than further SEO.",
          }}
        />
      </Figure>
      <p>
        A site: search lists pages Google has indexed, though not always every one.
        <Cite n={11} /> URL Inspection shows Google’s indexed version of a page and lets you request indexing, though a
        request isn’t a guarantee.
        <Cite n={12} /> The Performance report counts clicks and impressions (how often you appeared in results).
        <Cite n={13} />
      </p>

      <H2 id="five-jobs">Five jobs worth doing first</H2>
      <p>
        Most small businesses should do these five first, in this order. The first gives you the figures for the check
        above.
      </p>
      <Steps
        items={[
          {
            t: "Set up Search Console",
            b: (
              <>
                <p>
                  It’s free. You don’t need it to appear in Google, but it shows the searches you appear in, how often
                  people click, which sites link to you and any problems Google finds.
                  <Cite n={14} />
                </p>
                <p>
                  Add your site as a Domain property, which covers every version of your address (www or not, http or
                  https), and verify it with a <Term id="dns">DNS</Term> record at your domain provider. Figures
                  should appear within a few days.
                  <Cite n={15} />
                </p>
              </>
            ),
          },
          {
            t: "Claim your Business Profile, if you meet customers",
            b: (
              <p>
                Your <Term id="google-business-profile">Google Business Profile</Term> is the free listing that shows
                your business on Search and Maps. Only businesses that meet customers face to face are eligible.
                <Cite n={16} /> Our guide covers{" "}
                <a href={`${PAGES.article("google-business-profile")}#add-or-claim`}>adding or claiming one</a>.
              </p>
            ),
          },
          {
            t: "Give each service its own page, in your customers’ words",
            b: (
              <p>
                Give each thing you sell its own page, or one page for a tight group. If callers say “leaking roof”,
                don’t only write “roof remediation”: use their words in the title, the main heading and the first
                screen.
                <Cite n={8} /> Link each page from your menu. Google mainly finds pages through links, and a{" "}
                <Term id="sitemap">sitemap</Term> can help but isn’t required.
                <Cite n={5} />
              </p>
            ),
          },
          {
            t: "Write a title and description for each page",
            b: (
              <p>
                Put the service and the place in the title where they belong: “Heat pump servicing in Hamilton | Your
                business name”. Make each title unique to its page.
                <Cite n={5} /> Write the description as a one-sentence answer to “why this page?”.
              </p>
            ),
          },
          {
            t: "Make every page quick and readable on a phone",
            b: (
              <p>
                Compress photos, remove pop-ups that cover the page, and test your main pages in{" "}
                <Term id="pagespeed-insights">PageSpeed Insights</Term>. Google’s targets: the main content within 2.5
                seconds, a response to a tap within 200 milliseconds, and a layout that barely moves (a shift score of
                0.1 or less), for at least three in four page loads.
                <Cite n={17} />
              </p>
            ),
          },
        ]}
      />
      <H3>An example: a heat pump installer in Hamilton</H3>
      <p>
        An illustration, not a client. A two-person firm installs and services heat pumps around Hamilton. Its site has
        a home page and one “Services” page covering installation, servicing, repairs and ducted systems.
      </p>
      <ul>
        <li>
          <strong>The check.</strong> Search Console shows the site appearing for its own name and for “heat pumps
          Hamilton”, but hardly at all for “heat pump servicing” or “ducted heat pump”. It is stuck at question two.
        </li>
        <li>
          <strong>The changes.</strong> The owners split the services page into four, each with its own title and an
          opening that says what’s included and how to book. One page lists the towns they cover, instead of a page
          per town. They claim their Business Profile and put a booking button on every first screen.
        </li>
        <li>
          <strong>Measuring it.</strong> They note the date of each change. Six to eight weeks later they compare
          clicks and impressions for those searches with the weeks before and, as their work is seasonal, with the
          same weeks last year. Then they count the enquiries.
        </li>
      </ul>

      <H2 id="page-check">A page, checked before it goes live</H2>
      <p>Run any page through this before you publish or change it.</p>
      <Check
        items={[
          <>
            <strong>One subject.</strong> The page answers one question completely, and its main heading names it
            plainly.
          </>,
          <>
            <strong>Your customers’ words</strong> in the title, the main heading and the first screen, written
            naturally.
            <Cite n={8} />
          </>,
          <>
            <strong>A title written for this page:</strong> unique, clear, concise and accurate.
            <Cite n={5} /> And a description that says what the page offers.
          </>,
          <>
            <strong>Alt text on every image:</strong> a short description of how the picture relates to the page.
            <Cite n={5} />
          </>,
          <>
            <strong>Quick on a phone:</strong> photos compressed, and nothing covering the page when it opens.
            <Cite n={10} />
          </>,
          <>
            <strong>A next step</strong> (call, book or enquire) on the first screen and again at the end.
          </>,
          <>
            <strong>Linked both ways:</strong> reached from your menu or a related page, and linking on to the pages it
            mentions.
            <Cite n={5} />
          </>,
          <>
            <strong>Clearly local:</strong> the areas you serve, a New Zealand phone number and, if customers visit,
            your address. Google says a country domain such as .nz is a strong signal of who a site is for, and local
            addresses and phone numbers are signals too.
            <Cite n={18} />
          </>,
        ]}
      />

      <H2 id="how-long">How long it takes, and how to judge it</H2>
      <p>What to expect, and when:</p>
      <ul>
        <li>
          <strong>Within a few days</strong> of adding your site, figures appear in Search Console.
          <Cite n={15} />
        </li>
        <li>
          <strong>Within a day or so</strong> of asking, a new or changed page is usually indexed, though it can take
          much longer.
          <Cite n={12} />
        </li>
        <li>
          <strong>From a few hours to several months</strong> is how long Google says a change can take to have an
          effect. It suggests waiting a few weeks before judging whether it helped.
          <Cite n={5} />
        </li>
      </ul>
      <p>Then judge it monthly, the same way each time:</p>
      <ul>
        <li>
          <strong>Compare like with like.</strong> The Performance report shows the past three months unless you
          change it.
          <Cite n={13} /> Compare clicks and impressions for the searches you care about with the period before the
          change, and with last year’s if your work is seasonal.
        </li>
        <li>
          <strong>Keep a change log</strong> with the date of each change, so a rise or a fall can be matched to its
          cause.
        </li>
        <li>
          <strong>Count enquiries.</strong> More clicks matter only if they bring work.
        </li>
      </ul>
      <p>It never quite finishes: improve a page a month, and recheck your facts each year.</p>

      <H2 id="paying-someone">Paying someone: what to ask</H2>
      <p>
        You can do all of this yourself; hiring buys time and technical depth. Google lists useful work such as content
        reviews, technical advice, keyword research, training and optimising for generative AI. It says a good time to
        hire is when you’re considering a redesign or planning a new site: the earlier, the better.
        <Cite n={3} />
      </p>
      <p>
        Google suggests asking these before you hire.
        <Cite n={3} />
      </p>
      <Check
        items={[
          <>Can you show us examples of your previous work, and some success stories?</>,
          <>Do you follow Google Search Essentials?</>,
          <>What results do you expect, in what time, and how do you measure success?</>,
          <>What’s your experience in our industry, and in New Zealand or our city?</>,
          <>How long have you been in business?</>,
          <>Will you tell us about every change you make to our site?</>,
        ]}
      />
      <p>
        We’d add: what exactly do we get each month, and who will own the pages, accounts and reports you produce? At
        first, give them read access to Search Console only, not write access.
        <Cite n={3} /> Walk away from:
      </p>
      <ul>
        <li>
          <strong>A guaranteed ranking.</strong> Google is blunt: “No one can guarantee a #1 ranking on Google.”
          <Cite n={3} />
        </li>
        <li>
          <strong>Secrecy.</strong> Be careful of anyone who won’t clearly explain what they intend to do.
          <Cite n={3} />
        </li>
        <li>
          <strong>Cold emails.</strong> Be wary of SEO firms and agencies that email you out of the blue.
          <Cite n={3} />
        </li>
        <li>
          <strong>Link schemes.</strong> Avoid anyone selling schemes to get you more links, or to submit your site to
          thousands of search engines.
          <Cite n={3} /> Buying links breaks Google’s spam policies,
          <Cite n={6} /> and you are responsible for what any firm you hire does.
          <Cite n={3} />
        </li>
        <li>
          <strong>A paid place in a ranking that looks independent.</strong> In October 2026 the Commerce Commission
          asked the High Court to stop two websites that, it alleges, presented rankings businesses had paid for as
          independent; the court had not ruled when we checked. You can report an approach to the Commission on 0800 943 600.
          <Cite n={19} />
        </li>
      </ul>

      <H2 id="not-the-problem">When SEO isn’t the answer</H2>
      <p>
        Search work makes existing demand findable. It doesn’t create demand, and it can’t rescue an offer people don’t
        want at your price. If few people search for what you do, advertising, referrals or being where your customers
        already are may pay first. If you need enquiries this month, an ad is faster.
      </p>
      <p>
        If the site itself is confusing, slow or out of date, fix those pages first: there’s no point bringing more
        people to a page that loses them. Start with{" "}
        <a href={`${PAGES.article("redesign-or-improve")}#fixes`}>the fixes that pay first</a>.
      </p>

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        For the free audit, send us your site and the three services you most want found. We’ll work through the four
        questions (with read access to Search Console, if you can give it) and tell you which jobs to do first, for you
        or whoever runs your site. If the pages need rebuilding, our{" "}
        <a href={PAGES.service("websites")}>websites service</a> starts from that list.
      </p>
    </>
  );
}
