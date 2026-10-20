import { PAGES } from "@/lib/content";
import { H2, Callout, Compare, Cite } from "@/components/blog/Prose";
import { DecisionTree } from "@/components/blog/Diagrams";
import { Term } from "@/components/blog/Term";

export const toc = [
  { id: "the-question", title: "The question behind the question" },
  { id: "diy", title: "When building it yourself makes sense" },
  { id: "hire", title: "When hiring earns its cost" },
  { id: "costs", title: "What each path really costs" },
  { id: "deciding", title: "A short decision path" },
  { id: "if-you-build", title: "If you build it, protect these" },
  { id: "if-you-hire", title: "If you hire, protect these" },
  { id: "changing", title: "Changing paths later" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        Build your own site if a suitable template covers the job and someone has the time to write, set up and
        maintain it. Hire help when the design or the systems need more than you can manage, or when that time is
        better spent elsewhere. Compare the work each path asks of you, including after launch.
      </p>

      <H2 id="the-question">The question behind the question</H2>
      <p>
        “Should I build my own website?” is rarely the real question. The real one is: whose hours does this cost, and
        who is responsible when it needs changing? Building it yourself trades money for time and learning. Hiring
        trades money for speed and for someone else carrying the craft. Neither trade is wrong; what matters is
        picking the one that matches your week and your plans.
      </p>
      <p>
        Comparing your own website with selling through a marketplace, Business.govt.nz puts the trade plainly:
        “setting up a website costs money, and maintaining it takes time and skill”.
        <Cite n={1} /> The skill in that sentence is the part owners discover late: the launch is the start of the
        looking-after, not the end of the work.
      </p>

      <H2 id="diy">When building it yourself makes sense</H2>
      <p>
        Choose the do-it-yourself path when most of these are true. The site’s job is to show what you do and take
        enquiries; a handful of pages will cover it. The words and photos already exist, or writing them is work you
        want to do. Someone in the business genuinely enjoys the tools. And the website isn’t the main engine of the
        business yet, so it can grow as you learn.
      </p>
      <p>
        A <Term id="website-builder">site builder</Term> is the usual tool for this: ready-made templates, an editor
        in the browser, and the hosting handled for one subscription. The catch is that the site lives on the
        builder: Wix, for example, says a Wix site must run on its own servers, though you can keep the domain with
        another provider.
        <Cite n={2} />
      </p>
      <p>
        For a simple site, being found is not the barrier it is made out to be. Google’s starter guide is calm about
        it: most sites are found automatically, and “you usually don’t need to do anything except publish your site on
        the web”.
        <Cite n={3} /> Getting found well, for the searches you actually want, is more work (that is the territory of{" "}
        <a href={PAGES.article("what-is-seo")}>SEO</a>), but a small, clear site starts on the right side of it.
      </p>
      <Callout title="Selling things? Consider a marketplace first">
        <p>
          If the aim is to sell a few products rather than build a shop, business.govt.nz describes marketplaces as
          “quick and low-cost”, with less room for your own branding.
          <Cite n={1} /> Your own website is worth it when you want to control the whole experience and keep the
          customer relationship.
        </p>
      </Callout>

      <H2 id="hire">When hiring earns its cost</H2>
      <p>
        Hire when the available tools do not cover your process, or when you need help with the words, design or
        technical work. Check any booking, payment or CRM connection against what the business actually needs.
        If a suitable tool covers it, you may only need help setting it up. A custom build makes sense when the
        limits of those tools would leave your team doing extra work.
      </p>
      <p>
        A professional build buys judgement as much as labour: what to leave out, what the pages must say, what the
        site has to connect to, and how to check the result before launch. Agree ownership and handover in the
        contract; the <a href={`${PAGES.article("website-quote-checklist")}#the-lines`}>website quote checklist</a> covers
        what to put in writing.
      </p>

      <H2 id="costs">What each path really costs</H2>
      <p>
        Prices vary too much for this article to quote them, and any figure would date the moment it was written. What
        holds steady is the shape of each path’s cost:
      </p>
      <Compare
        caption="The two paths compared"
        head={["", "Building it yourself", "Hiring someone"]}
        rows={[
          ["Money to start", "The builder’s subscription, the domain, your time", "A quoted build; writing and photography if you buy them"],
          ["Money to keep going", "Subscription and domain renewal, rising as you add features", "Hosting and domain, plus updates and support on whatever arrangement you agree"],
          ["Your hours", "Setup and recurring content, changes and renewals", "Decisions, content and review, with the build handled for you"],
          ["Skills you supply", "Writing, pictures, patience with tools", "Knowing your business and saying what you want"],
          ["Suits", "A site within the chosen tool’s features, with someone to maintain it", "A distinct design, unusual processes or work you need someone else to handle"],
          ["The catch", "Everything depends on you staying on it", "You live with the quote, so it has to be a good one"],
        ]}
      />

      <H2 id="deciding">A short decision path</H2>
      <p>Four questions about the work, the content and the time you can give it.</p>
      <DecisionTree
        steps={[
          {
            q: "Does a builder or specialist tool cover the job without workarounds?",
            no: {
              t: "Scope the work it cannot handle",
              b: "Write down the missing features or connections, then ask someone to price them before committing to a tool.",
            },
          },
          {
            q: "Do the words and photos already exist, and sound like you?",
            no: {
              t: "Budget for content either way",
              b: "Writing and photography decide how the site reads. Find them before you choose who builds it.",
            },
          },
          {
            q: "Will someone in the business enjoy tending it after launch?",
            no: {
              t: "Plan for help from the start",
              b: "A site nobody tends dates within a year. Hire, or agree a small regular arrangement with whoever builds it.",
            },
          },
          {
            q: "Are you happy to learn a tool and own its upkeep?",
            no: {
              t: "Hire, and keep the keys",
              b: "Pay for the build and the craft, and make sure the domain, code and accounts end up in your name.",
            },
          },
        ]}
        end={{
          t: "Build it yourself",
          b: "A site builder is a good answer. Start with three pages, keep everything in your business’s name, and take the next step when the site earns it.",
        }}
      />

      <H2 id="if-you-build">If you build it, protect these</H2>
      <ul>
        <li>
          <strong>The domain in your business’s name.</strong> For a .nz name, the Domain Name Commission’s advice is
          to make sure your business is listed as the registrant, and to have your registrar transfer it if your web
          developer or provider is listed instead. A search on its website shows who the registrant is.
          <Cite n={4} />
        </li>
        <li>
          <strong>Every account on your card and your email.</strong> Use a business email you control, with two-step
          sign-in, so the site doesn’t live in a freelancer’s or a former employee’s account.
        </li>
        <li>
          <strong>An exit you have actually asked about.</strong> Before you start, ask the tool how you would take
          your content away. Squarespace, for one, exports only some of a site, to a file meant for WordPress, and
          says plainly that “some content doesn’t export”.
          <Cite n={5} /> Export copies of your words and photos somewhere separate as you go.
        </li>
        <li>
          <strong>The basics that make pages good:</strong> fast photos, honest titles, one clear page per service.
          The <a href={`${PAGES.article("what-is-seo")}#page-check`}>page checklist</a> is short and applies to a builder site as
          much as a custom one.
        </li>
      </ul>

      <H2 id="if-you-hire">If you hire, protect these</H2>
      <ul>
        <li>
          <strong>Ownership in writing before work starts:</strong> the domain, the code, the content and every
          account in your business’s name. The <a href={`${PAGES.article("website-quote-checklist")}#the-lines`}>quote checklist</a>{" "}
          lists the lines to ask for.
        </li>
        <li>
          <strong>A handover, not just a launch.</strong> Your own logins, a copy of everything, and plain notes on
          how it works; the <a href={`${PAGES.article("after-launch-ownership")}#handover`}>handover checklist</a> is the one to
          send.
        </li>
        <li>
          <strong>A scope that says what isn’t included.</strong> Most blow-outs come from assumptions nobody wrote
          down.
        </li>
        <li>
          <strong>Work you can judge.</strong> Ask for sites they have built that you can visit, and talk to one
          other client if you can.
        </li>
      </ul>

      <H2 id="changing">Changing paths later</H2>
      <p>
        Neither choice locks the door. Businesses move in both directions, and moving is ordinary work rather than a
        crisis, as long as the basics in the two lists above are in place.
      </p>
      <ul>
        <li>
          <strong>From DIY to hired.</strong> What carries over: the domain. A .nz name moves with its authorisation
          code (it used to be called the UDAI), which your provider must give you on request and free of charge
          <Cite n={6} /> and which expires after 30 days.
          <Cite n={7} /> The words and photos carry over if you have kept copies out of the tool. What doesn’t: the
          pages themselves usually need rebuilding, because a builder’s pages depend on its own platform. In
          Squarespace’s words, “many features rely on our platform’s JavaScript and CSS”.
          <Cite n={5} />
        </li>
        <li>
          <strong>From hired to in-house.</strong> If everything is in your name with your own logins, this is an
          practical handover. The <a href={`${PAGES.article("after-launch-ownership")}#handover`}>handover checklist</a> lists
          the access, notes and training to arrange before you start.
        </li>
        <li>
          <strong>A middle path.</strong> Have someone set the site up properly, then run it yourselves: your team
          edits the words and photos, and the developer handles the bigger changes. It suits businesses that want a
          professional start without a heavy ongoing arrangement.
        </li>
      </ul>

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        For a straightforward site and an owner with time to spend on it, a site builder can be a good choice. Our{" "}
        <a href={PAGES.service("websites")}>website work</a> suits businesses that need a more considered design, connected
        systems or someone to carry the build. Send us your current site or your plans for the free audit. We’ll
        explain which path we would take and why.
      </p>
    </>
  );
}
