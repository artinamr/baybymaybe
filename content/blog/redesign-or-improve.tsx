import { PAGES } from "@/lib/content";
import { H2, Callout, Steps, Compare, Figure, Check, Cite } from "@/components/blog/Prose";
import { DecisionTree } from "@/components/blog/Diagrams";
import { Term } from "@/components/blog/Term";

export const toc = [
  { id: "the-question", title: "The question behind the question" },
  { id: "sound", title: "Signs the foundations are sound" },
  { id: "rebuild", title: "Signs you need a rebuild" },
  { id: "diagnosis", title: "A one-week diagnosis you can do yourself" },
  { id: "fixes", title: "The fixes that pay first" },
  { id: "protect", title: "If you rebuild, protect what you’ve earned" },
  { id: "deciding", title: "Deciding, and pricing both" },
  { id: "example", title: "An example: an accounting practice" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        Most websites that disappoint don’t need replacing. A few pages, or the route an enquiry takes, do most of the
        damage, and those can be fixed without starting again. A rebuild earns its cost when the problem sits under
        every page: what the site says, the software it runs on or the way it’s built.
      </p>
      <p>You can find out which you have in a week, before anyone quotes you for anything.</p>

      <H2 id="the-question">The question behind the question</H2>
      <p>
        “Should we redesign?” mixes up two things. The look (colours, type, photographs) is what people notice first
        and what most redesigns change. The foundations decide whether the site works. There are four:
      </p>
      <ul>
        <li>
          <strong>The message.</strong> Does the site describe the business you run today, to the customers you want,
          in pages organised the way they think?
        </li>
        <li>
          <strong>Control.</strong> Can your team change it, and are the domain, hosting and logins in your business’s
          name?
        </li>
        <li>
          <strong>Support.</strong> Does the software it runs on still get security updates?
        </li>
        <li>
          <strong>Performance.</strong> Is it quick and easy to use on a phone, for everyone?
        </li>
      </ul>
      <p>
        A tired look on sound foundations needs a refresh. In our experience, one broken foundation can usually be
        repaired in place. A rebuild makes sense when the repair means replacing what the site is built on, or when two
        or more are broken at once.
      </p>

      <H2 id="sound">Signs the foundations are sound</H2>
      <ul>
        <li>
          A stranger can tell within seconds, on a phone, what you do and how to start. (Ask an outsider to try it
          while you watch.)
        </li>
        <li>There’s a page for each service people search for, not one long page listing everything.</li>
        <li>
          Your team can edit and publish pages without waiting on a developer, the accounts are in your business’s name,
          and someone keeps the software updated.
        </li>
        <li>
          Its problems sit in particular places, such as an oversized image or a slow plug-in, rather than everywhere.
        </li>
        <li>It brings in enquiries, just not enough, or not enough of the right ones.</li>
      </ul>
      <p>If most of these are true, keep the site and make particular pages work harder.</p>

      <H2 id="rebuild">Signs you need a rebuild</H2>
      <ul>
        <li>
          <strong>The business has changed, or the structure fights you.</strong> New services, new customers, or
          everything on a few long pages under a menu that mirrors your departments. Fixing that means rewriting every
          page and reorganising the menu: a rebuild, whatever anyone calls it.
        </li>
        <li>
          <strong>The software is past its support.</strong> The platform, theme or plug-ins no longer get security
          updates, or can’t be updated without breaking the site.
        </li>
        <li>
          <strong>The problems are built in.</strong> The theme loads heavy scripts on every page, important words are
          set inside images or menus can’t be used with a keyboard, and fixing it means replacing the theme.
        </li>
        <li>
          <strong>The site can’t leave its provider.</strong> A domain or hosting account in someone else’s name isn’t
          a reason to rebuild on its own: ask for them to be moved into your business’s name (the{" "}
          <a href={`${PAGES.article("after-launch-ownership")}#today`}>ownership guide</a> shows how to find out what you
          own). But if the site itself is locked to a provider’s platform, a rebuild in your own name may be the
          cleanest way out.
        </li>
      </ul>
      <p>
        Support is easy to miss: nothing looks wrong. WordPress runs on a server language called PHP, and each PHP
        version is supported for a limited time. In October 2026, php.net listed 8.2 as the oldest supported
        version, with security fixes until 31 December 2026, and told anyone on an unsupported version to upgrade as
        soon as possible.<Cite n={1} /> WordPress recommends 8.3 or greater.<Cite n={2} />
      </p>
      <p>
        If the theme or plug-ins can’t run on a supported version, updating means replacing them: most of a rebuild.
        Own Your Online, from the National Cyber Security Centre, says keeping a website’s software updated and
        patched, plug-ins and web server included, is the business owner’s responsibility.<Cite n={3} />
      </p>
      <Callout title="If your old web designer holds the domain">
        <p>
          That alone isn’t a reason for a new website. For a .nz name, the Domain Name Commission says your business
          should be the registrant, and if your web developer is listed instead, to contact your{" "}
          <Term id="registrar">registrar</Term> to have it transferred to the business.<Cite n={4} /> If the holder
          won’t transfer a name you believe is yours, the Commission has a dispute resolution service.<Cite n={5} />
        </p>
      </Callout>

      <H2 id="diagnosis">A one-week diagnosis you can do yourself</H2>
      <p>
        Before you talk to anyone who sells websites, spend a week finding out what’s happening. None of it needs
        technical skill. Note each problem and the page it’s on.
      </p>
      <Steps
        items={[
          {
            t: "Find the pages that do the work (day 1)",
            b: (
              <p>
                If you use <Term id="analytics">Google Analytics</Term>, open Engagement, then Landing page: it shows
                the first page people land on and how many land on each.<Cite n={6} /> List the top 10. If enquiries
                aren’t counted yet, have form submissions recorded as a key event (Google’s term for an action that’s
                particularly important to your business), so you have a baseline.<Cite n={7} />
              </p>
            ),
          },
          {
            t: "Try them on a phone (day 2)",
            b: (
              <p>
                On your own phone, on mobile data, open each one. Can you tell what you’d get and how to start,
                without zooming, waiting or hunting? Note every moment of friction. The mobile version is also the one
                Google uses for indexing and ranking.<Cite n={8} />
              </p>
            ),
          },
          {
            t: "Check the speed (day 3)",
            b: (
              <>
                <p>
                  Put the same pages through Google’s <Term id="pagespeed-insights">PageSpeed Insights</Term>. Where a
                  page has enough visitors, it shows what real users experienced over the previous 28 days.
                  <Cite n={9} />{" "}
                  Google’s <Term id="core-web-vitals">Core Web Vitals</Term> count a page as good when, for
                  three-quarters of visits, the main content appears within 2.5 seconds, a tap gets a response within
                  200 milliseconds and the layout shifts by 0.1 or less.<Cite n={10} />
                </p>
                <p>
                  Small sites often lack the visitors, so the report falls back to the whole site or shows no real-user
                  data. Google says its lab test is useful for debugging.<Cite n={9} /> If the lab test blames the same
                  thing on every page, suspect the theme.
                </p>
              </>
            ),
          },
          {
            t: "Run a first accessibility check (day 4)",
            b: (
              <p>
                Try the Easy Checks from the W3C, the web’s standards body, on your three busiest pages: titles,
                headings, image descriptions, colour contrast, keyboard focus, zoom and form labels, among others. The
                W3C warns that they cover only a few issues, and a page can seem to pass yet still have significant
                barriers.<Cite n={11} /> What they catch is still worth fixing.
              </p>
            ),
          },
          {
            t: "Look at what people search for (day 5)",
            b: (
              <p>
                If you have <Term id="search-console">Google Search Console</Term>, its Performance report shows the
                searches your site appears for, how often it appeared and how often people clicked.<Cite n={12} />{" "}
                Searches where you appear often but are rarely clicked usually point to a weak{" "}
                <Term id="title-and-description">title or description</Term>. Searches you’d expect to appear for, and
                don’t, point to a missing page.
              </p>
            ),
          },
          {
            t: "Walk your own enquiry path (day 6)",
            b: (
              <p>
                Fill in your own form, book your own appointment, call the number on the site. Time each one, then see
                where the enquiry lands and how long a reply takes. A surprising number of “website problems” live here.
              </p>
            ),
          },
          {
            t: "Check the foundations (day 7)",
            b: (
              <p>
                Who is the domain registered to? For a .nz name, the Domain Name Commission says you can find out by
                searching the domain name.<Cite n={4} /> Whose name are the hosting and admin logins in? Do the
                platform, theme and plug-ins still get updates? On WordPress, ask your host which PHP version the site
                runs and compare it with php.net’s list.<Cite n={1} /> When did the last{" "}
                <Term id="backup">backup</Term> run, and has anyone restored one? Own Your Online recommends automatic
                backups, with copies kept in different places.<Cite n={3} />
              </p>
            ),
          },
        ]}
      />
      <p>
        By the end of the week you have specific problems on specific pages, and an answer for each foundation.
        That’s all you need to <a href="#deciding">decide</a>.
      </p>

      <H2 id="fixes">The fixes that pay first</H2>
      <p>When the foundations are sound, these do the most for the least.</p>
      <ul>
        <li>
          <strong>The first screen.</strong> On the home page and each service page, the first thing people see says
          what you do, for whom, and the one next step, rather than a slogan or a slideshow.
        </li>
        <li>
          <strong>One page per service.</strong> Each answers what buyers ask: what it includes, who it’s for, how it
          works, how pricing works and how to start.
        </li>
        <li>
          <strong>The enquiry route.</strong> Fewer form fields, a clear promise of what happens next and when, and a
          confirmation that says it worked. If people book, let them pick a time.
        </li>
        <li>
          <strong>Speed.</strong> Usually images far larger than they’re shown, scripts from tools you no longer use,
          and third-party widgets. Fixing those can take a page from failing to passing without touching the design.
        </li>
        <li>
          <strong>Titles and descriptions.</strong> Google asks for a title on every page and warns against vague ones
          such as “Home”.<Cite n={13} /> Identical descriptions on every page don’t help either, it says.
          <Cite n={14} /> These are what people read before they click.
        </li>
      </ul>
      <p>Change one thing at a time and note the date, so you can see what each change did.</p>

      <H2 id="protect">If you rebuild, protect what you’ve earned</H2>
      <p>
        A new site can lose much of what the old one earned in search, and break saved links, if its addresses change
        carelessly. Google warns that rankings may fluctuate while it recrawls and reindexes a changed site.
        <Cite n={15} /> These keep the damage small:
      </p>
      <Check
        items={[
          <>
            <strong>A content inventory.</strong> List every page with its visits and what links to it, and decide for
            each: keep, merge, rewrite or retire.
          </>,
          <>
            <strong>A redirect map.</strong> Send each old address that changes to its closest new page. Google
            recommends <Term id="redirect">permanent redirects</Term> (301 or 308), kept for as long as possible,
            generally at least a year, and warns against sending many to one irrelevant page, such as the home page.
            <Cite n={15} />
          </>,
          <>
            <strong>Links and the sitemap.</strong> Point the new site’s own links at the new addresses, and submit the
            new <Term id="sitemap">sitemap</Term> in Search Console.<Cite n={15} />
          </>,
          <>
            <strong>Nothing left blocked.</strong> Some owners hide a new site from search engines while it’s built,
            with a robots.txt rule or a noindex tag. Google says to remove any such block when you’re ready to move.
            <Cite n={16} /> Check on launch day.
          </>,
          <>
            <strong>The same analytics.</strong> Keep the same analytics property and note the launch date, to
            compare like with like.
          </>,
        ]}
      />
      <p>
        Then give it time. Google says a small to medium-sized site can take a few weeks for most pages to move.
        <Cite n={15} />
      </p>
      <Callout title="Keep the addresses that work">
        <p>
          If a page already ranks and brings in enquiries, the safest redirect is none at all: give its replacement the
          same address on the new site.
        </p>
      </Callout>

      <H2 id="deciding">Deciding, and pricing both</H2>
      <p>Count the broken foundations (message, control, support, performance), then follow the path below.</p>
      <Compare
        caption="What to do, by how many foundations are broken"
        head={["Broken", "What to do"]}
        rows={[
          ["None", "Improve in place, starting with the fixes above."],
          ["One", "Repair it, then improve. If only a new theme or platform can repair it, price a rebuild too."],
          [
            "Two or more",
            "Get a rebuild priced alongside the list of fixes, and compare both over the next two or three years.",
          ],
        ]}
      />
      <p>Patching a site on unsupported software still leaves it unsupported.</p>
      <Figure caption="Where to start: answer down the left, and the first “no” is your first job.">
        <DecisionTree
          steps={[
            {
              q: "Does the site still describe the business you run today?",
              no: { t: "Rewrite the message first", b: "If most pages change, plan a rebuild." },
            },
            {
              q: "Are the domain and accounts in your name, and can your team edit the site?",
              no: {
                t: "Fix control first",
                b: "Move them into your name. Rebuild only if the site is locked to its provider’s platform.",
              },
            },
            {
              q: "Is the software still supported, and can it be updated?",
              no: { t: "Rebuild on supported software", b: "Keep the content and the addresses that already work." },
            },
            {
              q: "Are the speed and accessibility problems limited to a few pages?",
              no: {
                t: "Rebuild the foundations",
                b: "Problems built into a theme cost less to replace than to keep patching.",
              },
            },
          ]}
          end={{ t: "Improve in place", b: "Fix what your week found, one change at a time, and measure each." }}
        />
      </Figure>

      <H2 id="example">An example: an accounting practice</H2>
      <p>
        An illustration, not a real client. A two-partner accounting practice in Tauranga has a site built eight years
        ago. The partners want a new one: it looks dated. Their week finds:
      </p>
      <ul>
        <li>
          <strong>Day 1:</strong> the home page and two service pages bring most visits, which mostly end on the
          contact page.
        </li>
        <li>
          <strong>Day 3:</strong> there’s no real-user data, and the lab test blames a large slideshow on every page.
        </li>
        <li>
          <strong>Day 5:</strong> the site appears for “GST returns Tauranga” but is rarely clicked. That page’s title
          is “Services”.
        </li>
        <li>
          <strong>Day 6:</strong> the contact form still sends to a former employee’s inbox.
        </li>
        <li>
          <strong>Day 7:</strong> the agency that built the site holds the domain, the site runs on a PHP version
          php.net no longer lists as supported, and the theme’s maker stopped updating it years ago.
        </li>
      </ul>
      <p>
        The message is fine, but control and support are broken, and moving to a supported PHP version means replacing
        the theme: most of a rebuild. They get both priced and choose the rebuild, moving the domain into the practice’s
        name first and keeping the addresses of the pages that bring visits.
      </p>
      <p>
        Had the software been current, fixing the domain, the slideshow, the title and the form would have done the job
        without a rebuild.
      </p>

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        Send us your site for the free audit, with your week’s notes if you have them. Within two days we’ll reply
        with the changes we would make first. If a rebuild is warranted, our{" "}
        <a href={PAGES.service("websites")}>websites service</a> covers the plan through to handover; if a few changes
        will do, take the list to whoever looks after your site.
      </p>
    </>
  );
}
