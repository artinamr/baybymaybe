import { H2, Callout, Check, Steps, Cite } from "@/components/blog/Prose";
import { Term } from "@/components/blog/Term";

export const toc = [
  { id: "what-it-is", title: "What SEO is" },
  { id: "how-google-decides", title: "How Google decides" },
  { id: "what-google-rewards", title: "What Google rewards" },
  { id: "five-jobs", title: "Five jobs worth doing first" },
  { id: "page-check", title: "A page, checked before it goes live" },
  { id: "how-long", title: "How long it takes" },
  { id: "paying-someone", title: "Paying someone to do it" },
  { id: "not-the-problem", title: "When SEO isn’t the problem" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        <Term id="seo">Search engine optimisation</Term> (SEO) is the work of making your website easy for search
        engines to find, understand and recommend when someone searches for what you do. It is mostly plain work on
        your pages, and much of it you can start this week.
      </p>

      <H2 id="what-it-is">What SEO is</H2>
      <p>
        When someone types “accountant Wellington” or “dashcam installation” into Google, the results it shows are
        chosen from pages it has found and filed, ranked by how well it judges each one answers the search. SEO is the
        work of putting your pages in that running: so Google finds them, understands them, and prefers them for the
        searches that matter to your business.
      </p>
      <p>
        It sits beside advertising, and the two do different jobs. A search ad appears the day you pay for it and
        disappears when you stop. Search work builds slowly and keeps working. Business.govt.nz, the government’s
        business advice site, puts making content easy to find (including search engine optimisation) among the few
        kinds of online marketing that generally give the most return for the effort.
        <Cite n={1} />
      </p>
      <Callout title="It is free to appear in the results">
        <p>
          Google does not charge to include a site in its results, and its own guidance says paying an agency does not
          influence them either: “Google never accepts money to include or rank sites in our search results.”
          <Cite n={2} /> What people sell is the work, not the placement.
        </p>
      </Callout>

      <H2 id="how-google-decides">How Google decides</H2>
      <p>
        Google runs automated programs that read pages across the web and file them in an index. Its starter guide is
        reassuring on the first step: most sites are found on their own, and “you usually don’t need to do anything
        except publish your site on the web”. Links from other sites are how new pages are discovered, and a{" "}
        <Term id="sitemap">sitemap</Term> can help, though Google says submitting one isn’t required.
        <Cite n={3} />
      </p>
      <p>
        Ranking then weighs much more, and Google is direct about what matters most: content that is helpful,
        reliable and written for people. The same guidance is firm about the other side. Google publishes spam
        policies (stuffing pages with keywords, buying links, publishing pages made only to catch searches), and a
        site that breaks them can rank lower or be left out of the results altogether.
        <Cite n={4} />
      </p>

      <H2 id="what-google-rewards">What Google rewards</H2>
      <p>
        Google’s advice on content comes down to one idea: write for the reader, and let the search engine see the
        same thing the reader sees. Its self-check questions include whether the page shows first-hand knowledge,
        whether it adds something the other results don’t, and whether someone reading it would leave feeling they
        learned enough to reach their goal.
        <Cite n={5} />
      </p>
      <p>
        In practice, for a business site, that looks like:
      </p>
      <ul>
        <li>
          <strong>One clear page per thing you do,</strong> described in the words a customer would use. Google
          recommends anticipating the words people type and using them where they count: in the page’s title, its
          headings and its text.
          <Cite n={3} />
        </li>
        <li>
          <strong>An honest title and description for every page.</strong> A page’s title should be “unique to the
          page, clear and concise”.
          <Cite n={3} /> The description is your one line under the headline in the results.
        </li>
        <li>
          <strong>Originality.</strong> Don’t copy what competitors or suppliers have written, in part or whole.
          <Cite n={3} /> A page only earns its place if it adds something.
        </li>
        <li>
          <strong>A fast, steady page.</strong> Content that is easy to read, well organised with headings, and not
          buried under pop-ups. There is no preferred word count; Google says chasing one is a warning sign.
          <Cite n={5} />
        </li>
      </ul>

      <H2 id="five-jobs">Five jobs worth doing first</H2>
      <p>
        If you do nothing else, do these five. They are in order, and each one makes the next easier.
      </p>
      <Steps
        items={[
          {
            t: "Sort your pages: one per service",
            b: (
              <p>
                List what you actually sell, and give each thing a page of its own (or one page for a tight group).
                A page that answers “do you do X, and what does it involve?” beats a home page that mentions
                everything once.
              </p>
            ),
          },
          {
            t: "Write the title and description for each page",
            b: (
              <p>
                Put the service and the place in the title if they belong there (“Heat pumps, install and service,
                Hamilton”). Write the description as a one-sentence answer to “why this page?”.
                <Cite n={3} />
              </p>
            ),
          },
          {
            t: "Say it the way customers say it",
            b: (
              <p>
                If callers say “leaking roof”, don’t only write “roof remediation”. Use the customer’s words in the
                headings and the first screen, then be precise underneath.
                <Cite n={4} />
              </p>
            ),
          },
          {
            t: "Make the page quick and pleasant on a phone",
            b: (
              <p>
                Compress the photos, clear the pop-ups, and check the page on the cheapest phone you own. Google’s
                measures of page experience (<Term id="core-web-vitals">Core Web Vitals</Term>) are the ones to
                ask a developer about.
              </p>
            ),
          },
          {
            t: "Set up Search Console, then leave it alone for a month",
            b: (
              <p>
                <Term id="search-console">Google Search Console</Term> is free. It shows which searches your pages
                appear in, which ones get clicked, and any problems Google hit while reading the site.
                <Cite n={6} /> It is also how you submit a sitemap and ask for a page to be re-read.
              </p>
            ),
          },
        ]}
      />

      <H2 id="page-check">A page, checked before it goes live</H2>
      <p>Run any page, new or old, past this list. It takes ten minutes and catches most of what matters.</p>
      <Check
        items={[
          <>
            <strong>One subject.</strong> The page answers one question completely, and the heading says what it is
            in plain words.
          </>,
          <>
            <strong>The customer’s words appear.</strong> The phrases people actually type are in the title, the
            first screen and the headings, naturally.
          </>,
          <>
            <strong>A title and description written on purpose,</strong> unique to this page, accurate, and free of
            exaggeration.
            <Cite n={3} />
          </>,
          <>
            <strong>Images with alt text</strong> that describe the picture, so the page makes sense without them.
            <Cite n={3} />
          </>,
          <>
            <strong>Fast on a phone.</strong> Photos compressed, nothing launching on load, and the first screen
            readable without scrolling sideways.
          </>,
          <>
            <strong>A next step.</strong> The way to call, book or enquire is on the first screen and at the end.
          </>,
          <>
            <strong>Linked in both directions:</strong> the page is reached from your menu or a related page, and it
            links on to the pages it mentions.
            <Cite n={3} />
          </>,
        ]}
      />

      <H2 id="how-long">How long it takes</H2>
      <p>
        Longer than anyone wants, and Google says so plainly: “Some changes might take effect in a few hours, others
        could take several months.”
        <Cite n={3} /> Judge a change over weeks, not days. Search Console shows whether the pages are being read and
        which searches they appear in, and a fair test is a month or two, not a fortnight.
        <Cite n={6} />
      </p>
      <p>
        It also never quite finishes. Pages date, services change, competitors publish. The businesses that do well
        treat it as a habit (a page improved each month, dates checked each year) rather than a project with an end.
      </p>

      <H2 id="paying-someone">Paying someone to do it</H2>
      <p>
        You can do everything in this article yourself. Hiring someone buys speed and technical depth, and Google’s
        advice on choosing help is worth reading before you sign anything. Its list of useful services includes
        reviewing your content and structure, technical advice, help developing content, keyword research, and
        training your own team.
        <Cite n={2} />
      </p>
      <p>Its warnings are just as specific:</p>
      <ul>
        <li>
          <strong>“No one can guarantee a #1 ranking on Google.”</strong> Walk away from anyone who promises one.
          <Cite n={2} />
        </li>
        <li>
          <strong>Be wary of secrecy.</strong> A good consultant explains what they intend to do in words you can
          follow.
          <Cite n={2} />
        </li>
        <li>
          <strong>Link schemes backfire.</strong> Buying links, or swapping them in bulk, breaks Google’s spam
          policies and can cost the site its place in the results. You are responsible for what a firm you hire does
          to your site.
          <Cite n={4} />
        </li>
        <li>
          <strong>Start with read-only access.</strong> For an audit, Google suggests granting access to Search
          Console first, and checking advice against Google’s own documentation.
          <Cite n={2} />
        </li>
      </ul>

      <H2 id="not-the-problem">When SEO isn’t the problem</H2>
      <p>
        Search work makes an existing demand findable. It doesn’t create demand, and it can’t rescue an offer nobody
        wants at the price you need. Before spending on it, be sure the enquiry actually exists: if people already
        find you by word of mouth once they hear the business’s name, but nobody searches for the service by name,
        the work is naming and explaining, which is slower. Advertising, or being where your customers already are,
        may pay first.
      </p>
      <p>
        And if the site itself is confusing, slow or out of date, fixing those pages comes before any search work.
        There is no point bringing more people to a page that loses them. If you’re deciding between fixing and
        rebuilding, that decision has its own article: <a href="/blog/redesign-or-improve/#fixes">the fixes that pay
        first</a>.
      </p>

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        When we audit a site we start where this article does: can Google read it, does each page answer one thing in
        the customer’s words, and does the page give a searcher a reason to stop. The free audit covers that in plain
        language, with the five jobs above marked done, half-done or missing. Send us your web address and we’ll walk
        you through it, whether or not you ever hire us.
      </p>
    </>
  );
}
