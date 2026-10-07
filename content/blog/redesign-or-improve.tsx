import { H2, Callout, Steps, Compare, Figure, Cite } from "@/components/blog/Prose";
import { DecisionTree } from "@/components/blog/Diagrams";
import { Term } from "@/components/blog/Term";

export const toc = [
  { id: "the-question", title: "The question behind the question" },
  { id: "sound", title: "Signs the foundations are sound" },
  { id: "rebuild", title: "Signs you need a rebuild" },
  { id: "diagnosis", title: "A one-week diagnosis" },
  { id: "fixes", title: "The fixes that pay first" },
  { id: "protect", title: "If you rebuild, protect what you’ve earned" },
  { id: "deciding", title: "Deciding" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        Most business owners who ask for a new website don’t really want a new website. They want more of the right
        enquiries, a site they’re happy to send people to, and less time spent working around it. Sometimes a rebuild
        is the honest way to get there. Often it isn’t: the site underneath is sound, and a handful of pages are doing
        the damage.
      </p>
      <p>This is how to tell the difference before you spend anything.</p>

      <H2 id="the-question">The question behind the question</H2>
      <p>“Should we redesign?” usually hides three different questions:</p>
      <ul>
        <li>
          <strong>Is the site saying the right thing to the right people?</strong> That is the message and the structure.
        </li>
        <li>
          <strong>Can we change it ourselves when the business changes?</strong> That is the platform, and who owns it.
        </li>
        <li>
          <strong>Does it work for the people using it</strong>, on a phone, quickly, for everyone? That is speed and
          accessibility.
        </li>
      </ul>
      <p>
        A redesign answers all three at once, at the price of starting again. A targeted improvement answers one of them,
        on one part of the site, and keeps everything else. Which is right depends on which of the three is actually
        broken, and how deep it goes.
      </p>
      <p>
        It helps to separate the look from the foundations. The look (colours, type, photography) is what people notice
        first, and what most redesigns change. The foundations are what decide whether a site works: what it says, how its
        pages are organised, what it is built on, and how it performs. A tired look on sound foundations needs a refresh. A
        fresh look on broken foundations is a rebuild that hasn’t been admitted yet.
      </p>

      <H2 id="sound">Signs the foundations are sound</H2>
      <ul>
        <li>
          Someone landing on the home page or a service page can tell within a few seconds what you do, who it’s for
          and how to start. (Ask someone outside the business to try it on their phone, and watch without helping.)
        </li>
        <li>
          The pages follow the way customers think about what you sell: a page for each service they’d search for,
          not one long page listing everything.
        </li>
        <li>You, or someone on your team, can change the words, add a page and publish without waiting on a developer.</li>
        <li>
          It works on a phone, or its problems sit in particular places (oversized images, a slow plug-in, a chat widget)
          rather than everywhere.
        </li>
        <li>It brings in enquiries, just not enough of them, or not enough of the right ones.</li>
      </ul>
      <p>
        If most of these are true, you probably don’t need a new website. You need particular pages to work harder.
      </p>

      <H2 id="rebuild">Signs you need a rebuild</H2>
      <ul>
        <li>
          <strong>The business has changed and the site describes the old one.</strong> Different services, different
          customers, a different way of working. Rewriting every page and reorganising the menu is a rebuild whether or not
          anyone calls it one.
        </li>
        <li>
          <strong>The structure fights you.</strong> Everything lives on a few long pages, or the menu mirrors your internal
          departments instead of what customers are looking for.
        </li>
        <li>
          <strong>You can’t change it.</strong> The platform is tied to one provider, the theme breaks when you edit
          it, or small changes cost money and take weeks.
        </li>
        <li>
          <strong>The slowness is built in.</strong> The theme loads heavy scripts on every page, important words are set
          inside images, menus can’t be used with a keyboard, and fixing it means replacing the theme anyway.
        </li>
        <li>
          <strong>Nobody is sure who owns it.</strong> If the domain, the hosting or the code sit in someone else’s
          name and can’t be moved, a rebuild in your own name may be the cleanest way out.
        </li>
      </ul>
      <p>
        One of these on its own can sometimes be fixed in place. Two or three together usually mean you would spend most
        of a rebuild’s cost on patches, and still have the old site underneath.
      </p>

      <H2 id="diagnosis">A one-week diagnosis you can do yourself</H2>
      <p>
        Before you talk to anyone who sells websites, spend a week finding out what is actually happening. None of this
        needs technical skill, and the answers are worth more than any opinion of how the site looks.
      </p>
      <Steps
        items={[
          {
            t: "Follow the journeys (day 1)",
            b: (
              <p>
                In your analytics, find the pages people arrive on, where they go next and where they leave. Most sites
                have a handful of pages doing most of the work, and one or two where most people give up.
              </p>
            ),
          },
          {
            t: "List the top ten arrival pages (day 1)",
            b: (
              <p>
                These matter most. A redesign that changes them without care puts at risk the visits they already bring
                in.
              </p>
            ),
          },
          {
            t: "Do the phone test (day 2)",
            b: (
              <p>
                On your own phone, on mobile data, open each of those ten pages. Can you tell what you’d get and how
                to get it without zooming, waiting or hunting? Write down every moment of friction.
              </p>
            ),
          },
          {
            t: "Check the speed (day 3)",
            b: (
              <p>
                Put the same pages through Google’s <Term id="pagespeed-insights">PageSpeed Insights</Term>. It reports two kinds of result. Field data is
                what real Chrome users experienced over the previous 28 days, where the site has enough visitors. Lab
                data is a controlled test, most useful for finding causes.
                <Cite n={1} /> Google calls a page good when, for three-quarters of visits, the main content appears within
                2.5 seconds, the page responds to a tap or click within 200 milliseconds, and the layout barely jumps
                (a layout-shift score of 0.1 or less).
                <Cite n={2} /> Note which pages fail, and what the report blames.
              </p>
            ),
          },
          {
            t: "Look at what people search for (day 4)",
            b: (
              <p>
                If you have <Term id="search-console">Google Search Console</Term>, it shows the searches your pages appear for. Searches where you appear
                but are rarely chosen usually point to a weak title or description. Searches you’d expect to appear
                for, and don’t, usually point to a page that doesn’t exist.
              </p>
            ),
          },
          {
            t: "Walk your own enquiry path (day 5)",
            b: (
              <p>
                Fill in your own form, book your own appointment, call your own number from the site. Time it. Then see
                where the enquiry lands and how long it takes for someone to reply. A surprising number of
                “website problems” turn out to live here.
              </p>
            ),
          },
        ]}
      />
      <p>
        At the end of the week you have a short list of specific problems, attached to specific pages. That list decides
        between a rebuild and targeted work far more reliably than how the site looks.
      </p>

      <H2 id="fixes">The targeted fixes that pay first</H2>
      <p>When the foundations are sound, these usually do the most for the least:</p>
      <ul>
        <li>
          <strong>The first screen.</strong> On the home page and every service page, the first thing people see should say
          what you do, for whom, and the one next step. Underperforming pages often bury this under a slogan or a slideshow.
        </li>
        <li>
          <strong>The service pages.</strong> One page for each service people actually look for, each answering what
          buyers ask: what it includes, who it’s for, how it works, how pricing works, and how to start.
        </li>
        <li>
          <strong>The enquiry route.</strong> Fewer form fields, a clear promise of what happens next and when, and a
          confirmation that says it worked. If people book, let them book a time rather than request one.
        </li>
        <li>
          <strong>Speed.</strong> Usually images far larger than they’re shown, scripts from tools you no longer use,
          and third-party widgets. Fixing those can take a page from failing to passing without touching the design.
        </li>
        <li>
          <strong>Titles and descriptions.</strong> Google’s own guidance is that every page should have its own
          descriptive title, not a vague one like “Home”, and that identical descriptions on every page
          don’t help anyone choosing between results.
          <Cite n={3} />
          <Cite n={4} /> They are small edits with a large effect on whether people click.
        </li>
      </ul>
      <p>
        Where you can, change one thing at a time and write down the date, so you can see what each change did.
      </p>

      <H2 id="protect">If you rebuild, protect what you’ve earned</H2>
      <p>
        A new site can lose much of what the old one had earned in search, and break every link people have saved, if
        its addresses change carelessly. Three things prevent most of the damage:
      </p>
      <ul>
        <li>
          <strong>A content inventory.</strong> List every page on the current site, with its visits and what links to it.
          Decide for each one: keep, merge, rewrite or retire.
        </li>
        <li>
          <strong>A redirect map.</strong> Every old address that changes should send people (and search engines) to its
          closest new page with a <Term id="redirect">permanent redirect</Term>. Google recommends server-side permanent redirects (301 or 308),
          keeping them for as long as possible and generally at least a year, and warns that rankings can fluctuate while
          it recrawls the site; on a medium-sized site it can take a few weeks or more before the new addresses replace
          the old ones in results.
          <Cite n={5} />
        </li>
        <li>
          <strong>Continuity in your analytics.</strong> Keep the same analytics property and note the launch date, so you
          can compare like with like afterwards.
        </li>
      </ul>
      <Callout title="Keep the addresses that work">
        <p>
          If a page already ranks and brings in enquiries, the safest redirect is none at all: give its replacement the
          same address on the new site.
        </p>
      </Callout>

      <H2 id="deciding">Deciding</H2>
      <p>Put what your week found against these. Most findings point one way clearly.</p>
      <Compare
        caption="What the diagnosis found, and what it usually means"
        head={["What you found", "Usually means", "Why"]}
        rows={[
          ["A few pages say the wrong thing", "Improve in place", "Rewrite those pages; the rest is working."],
          ["The whole business has changed", "Rebuild", "Every page and the menu change anyway."],
          ["A few pages are slow", "Improve in place", "Images, scripts and widgets can be fixed page by page."],
          ["Every page is slow, whatever you remove", "Rebuild", "The weight is in the theme or platform."],
          ["You can’t edit it, or don’t own it", "Rebuild (or move it first)", "A site you can’t change can’t keep up."],
          ["Enquiries get lost after the form", "Improve in place", "Fix the route; the pages may be fine."],
          ["Search visits are falling on particular pages", "Improve in place", "Work on those pages’ content, titles and speed."],
        ]}
      />
      <Figure caption="The same decision as a path: answer down the left; the first “no” is your answer.">
        <DecisionTree
          steps={[
            {
              q: "Does the site still describe the business you run today?",
              no: { t: "Rebuild the message first", b: "Rewrite what you offer and for whom. If most pages change, plan a rebuild." },
            },
            {
              q: "Can your team change it, and is it in your name?",
              no: { t: "Rebuild on something you control", b: "Or move it into your name first, if the platform itself is sound." },
            },
            {
              q: "Are the speed and accessibility problems limited to particular pages?",
              no: { t: "Rebuild the foundations", b: "Problems built into a theme cost less to replace than to keep patching." },
            },
          ]}
          end={{ t: "Improve in place", b: "Fix the pages your week pointed to, one at a time, and measure each change." }}
        />
      </Figure>

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        This is what our free audit is for. We look at your site the way your customers do (on a phone, on a laptop, in
        search) and within two days you get a short, plain write-up: what is working, what is costing you enquiries, and
        what we would build instead. Sometimes the answer is “change three pages”. If it is, we’ll say
        so. If it says rebuild, that is our <a href="/services/websites/">websites service</a>: the plan, the pages and
        the handover, everything in your name. If it says improve, you can hand the list to whoever looks after your
        site, us included.
      </p>
    </>
  );
}
