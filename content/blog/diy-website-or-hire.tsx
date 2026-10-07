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
        Nearly every business starts here, and the honest answer is that both paths work. A website you build yourself
        with a site builder is a fine answer for plenty of businesses. So is engaging someone. What decides it is what
        the site has to do, who has the hours, and what each path will ask of you after launch. Here is how to tell
        which one you are.
      </p>

      <H2 id="the-question">The question behind the question</H2>
      <p>
        “Should I build my own website?” is rarely the real question. The real one is: whose hours does this cost, and
        who is responsible when it needs changing? Building it yourself trades money for time and learning. Hiring
        trades money for speed and for someone else carrying the craft. Neither trade is wrong; what matters is
        picking the one that matches your week and your plans.
      </p>
      <p>
        Business.govt.nz puts the trade plainly: “setting up a website costs money, and maintaining it takes time and
        skill”, whichever way you go.
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
        in the browser, and the hosting handled for one subscription. The templates come with the subscription
        (Squarespace’s help puts it that way: “The ability to try multiple templates is included with your
        Squarespace site subscription”).
        <Cite n={2} />
      </p>
      <p>
        For a simple site, being found is not the barrier it is made out to be. Google’s starter guide is calm about
        it: most sites are found automatically, and “you usually don’t need to do anything except publish your site on
        the web”.
        <Cite n={3} /> Getting found well, for the searches you actually want, is more work (that is the territory of{" "}
        <a href="/blog/what-is-seo/">SEO</a>), but a small, clear site starts on the right side of it.
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
        Hire when the site has to do things a template can’t, or when the hours aren’t there. The honest signals: it
        must take bookings or payments, or connect to your CRM, calendar or accounting. The brand carries the
        business, so the words and the design have to be right, and writing them is not your strength. Nobody in the
        business wants to own the tooling. Or you have outgrown a builder and its limits are costing you work.
      </p>
      <p>
        A professional build buys judgement as much as labour: what to leave out, what the pages must say, what the
        site has to connect to, and what it means for the site to be genuinely finished. It also buys speed. What it
        doesn’t buy automatically is ownership; that is a matter of the contract, and there is a whole article on what
        a good <a href="/blog/website-quote-checklist/#the-lines">website quote should include</a>.
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
          ["Your hours", "Large at the start, and recurring: content, changes, renewals", "Small: decisions, content, review"],
          ["Skills you supply", "Writing, pictures, patience with tools", "Knowing your business and saying what you want"],
          ["Suits", "A handful of information pages, enquiries by email or phone", "Bookings, payments, connections to your systems, a brand that carries weight"],
          ["The catch", "Everything depends on you staying on it", "You live with the quote, so it has to be a good one"],
        ]}
      />

      <H2 id="deciding">A short decision path</H2>
      <p>Four questions, in order. Answer honestly; the questions are about your week, not your ambition.</p>
      <DecisionTree
        steps={[
          {
            q: "Is the site’s whole job to show what you do and take enquiries?",
            no: {
              t: "It has to book, sell or connect",
              b: "That is platform work. Engage someone, or run a specialist product behind the site; a template editor won’t carry it.",
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
          <strong>The domain in your business’s name.</strong> For .nz names the rule is explicit: if you ask someone
          to register on your behalf, “they must register it in your name, not theirs”. You can check with a WHOIS
          search on the Domain Name Commission’s website.
          <Cite n={4} />
        </li>
        <li>
          <strong>Every account on your card and your email.</strong> Use a business email you control, with two-step
          sign-in, so the site doesn’t live in a freelancer’s or a former employee’s account.
        </li>
        <li>
          <strong>An exit you have actually asked about.</strong> Before you start, ask the tool how you would take
          your content away. Moving to a fresh trial means recreating everything by hand (Squarespace’s help says a
          new trial starts empty: “you’ll have to recreate all your site’s existing content”).
          <Cite n={2} /> Export copies of your words and photos somewhere separate as you go.
        </li>
        <li>
          <strong>The basics that make pages good:</strong> fast photos, honest titles, one clear page per service.
          The <a href="/blog/what-is-seo/#page-check">page checklist</a> is short and applies to a builder site as
          much as a custom one.
        </li>
      </ul>

      <H2 id="if-you-hire">If you hire, protect these</H2>
      <ul>
        <li>
          <strong>Ownership in writing before work starts:</strong> the domain, the code, the content and every
          account in your business’s name. The <a href="/blog/website-quote-checklist/#the-lines">quote checklist</a>{" "}
          lists the lines to ask for.
        </li>
        <li>
          <strong>A handover, not just a launch.</strong> Your own logins, a copy of everything, and plain notes on
          how it works; the <a href="/blog/after-launch-ownership/#handover">handover checklist</a> is the one to
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
          <strong>From DIY to hired.</strong> What carries over: the domain (a .nz name moves with its UDAI, which
          your registrar must give you promptly and at no cost, and which is valid for 30 days).
          <Cite n={4} /> The words and photos carry over if you have kept copies out of the tool. What doesn’t: the
          pages themselves. Moving to a fresh site means starting the design again (Squarespace’s help is explicit
          that a new site means “you’ll have to recreate all your site’s existing content”).
          <Cite n={2} />
        </li>
        <li>
          <strong>From hired to in-house.</strong> If everything is in your name with your own logins, this is an
          afternoon’s work, and the <a href="/blog/after-launch-ownership/#handover">handover checklist</a> lists
          what to have in hand before you start.
        </li>
        <li>
          <strong>A middle path.</strong> Have someone set the site up properly, then run it yourselves: your team
          edits the words and photos, and the developer handles the bigger changes. It suits businesses that want a
          professional start without a heavy ongoing arrangement.
        </li>
      </ul>

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        We build websites, so you would expect us to say “hire someone”. The honest version: for a simple site and a
        willing owner, a builder is the better deal, and this article tells you how to start well. Where we earn our
        place is the rest: sites that must book, sell or connect, and businesses that would rather spend their hours
        on the work. The free audit is a good first step either way: send us your web address, or your plan for one,
        and we’ll tell you plainly which path we’d take and why.
      </p>
    </>
  );
}
