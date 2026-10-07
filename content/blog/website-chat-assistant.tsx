import { H2, Callout, Check, Cite } from "@/components/blog/Prose";
import { DecisionTree } from "@/components/blog/Diagrams";
import { Term } from "@/components/blog/Term";
import { PAGES } from "@/lib/content";

export const toc = [
  { id: "what", title: "What a chat assistant is" },
  { id: "well", title: "What one does well" },
  { id: "disappoint", title: "Where they disappoint" },
  { id: "test", title: "A test before you build" },
  { id: "harm", title: "Doing it without harm" },
  { id: "costs", title: "What it costs to run" },
  { id: "live", title: "Before it goes live" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        Put a chat assistant on the website, or not? The honest answer is that for some businesses one earns its place
        within weeks, and for most it would sit between the customer and the person they wanted to reach. The
        difference is not the technology; it is whether the same questions arrive every week and whether the answers
        are written down. Here is how to tell which business you are, what one should and shouldn’t do, and what New
        Zealand’s privacy regulator expects if you build one.
      </p>

      <H2 id="what">What a chat assistant is</H2>
      <p>
        There are two kinds, and it pays to know which one you are being sold. The older kind is a menu with a
        personality: it shows buttons (“Bookings”, “Prices”, “Talk to us”) and can only walk the paths someone drew.
        The newer kind is a <Term id="chat-assistant">chat assistant</Term> built on a{" "}
        <Term id="generative-ai">generative AI</Term> model: it reads your own material (your pages, your price list,
        your policies) and drafts answers in sentences.
      </p>
      <p>
        There is also a line between answering and acting. Answering is what this article covers: a visitor asks, the
        assistant replies. Acting (taking a booking, changing an order, issuing a refund) is automation with much
        higher stakes, and it needs the checks in our article on{" "}
        <a href="/blog/ai-automation-workflows/#good-fit">what makes a task a good fit for AI</a>.
      </p>

      <H2 id="well">What one does well</H2>
      <p>
        A good assistant is a receptionist for the ten questions that arrive every week: the hours, the parking, the
        price range, whether you cover a suburb, what a first visit involves. It does this at 11pm, in parallel with
        everything else, and it never sighs. It can also do the errand work: ask which service a visitor needs, and
        hand the answer to the right page or the right person on Monday.
      </p>
      <p>
        The test for whether yours has real material to work with is simple: if a new staff member could learn the
        answers in one afternoon from a written sheet, an assistant can learn them too. If the answers live in one
        person’s head, that person is the assistant, and the software will make things up instead.
      </p>
      <p>
        A small example. It is 10:40pm. A visitor asks whether your physio clinic takes ACC claims and what a first
        appointment involves. The assistant answers from your fees page and your first-visit page, links both, and
        offers the booking link. Nobody stayed up, and the customer got further than a form would have carried them.
        Multiply that by a week and the case makes itself.
      </p>

      <H2 id="disappoint">Where they disappoint</H2>
      <p>
        The failure to respect is the confident wrong answer. The Privacy Commissioner’s guidance on generative AI
        warns that these tools “often produce very confident errors of fact or logic”, and that nobody should rely on
        the output “without first taking appropriate steps to fact check”.
        <Cite n={1} /> An assistant that invents a price, a promise or a policy has just made a commitment your
        business never made. The common failure modes, from watching these go live:
      </p>
      <ul>
        <li>
          <strong>Improvising</strong> where it has no material, instead of saying “I don’t know, here’s the person who
          does”.
        </li>
        <li>
          <strong>Repeating the website,</strong> badly, to someone who had just read the website. If that is all it
          has to say, the pages are the thing to fix.
        </li>
        <li>
          <strong>Catching people who wanted a person.</strong> Some visitors arrive knowing exactly what they want to
          ask a human. Every assistant needs a visible, one-tap way out.
        </li>
        <li>
          <strong>Going stale.</strong> Prices change, a service is dropped, and the assistant keeps answering from the
          old sheet for months.
        </li>
      </ul>
      <Callout title="The honest rule">
        <p>
          An assistant should either answer from words you approved, or hand over to a person. Everything else is a
          gamble with your own reputation, at two in the morning, without you.
        </p>
      </Callout>

      <H2 id="test">A test before you build</H2>
      <p>Four questions, in order. They take five minutes and they are the whole decision.</p>
      <DecisionTree
        steps={[
          {
            q: "Do the same ten questions arrive every week?",
            no: {
              t: "Fix the pages first",
              b: "Varied questions with no written answers mean an assistant would improvise. Better pages are cheaper and help every visitor, not just the chatty ones.",
            },
          },
          {
            q: "Are those answers written down, true and current?",
            no: {
              t: "Write the sheet first",
              b: "The writing is the real work; the assistant is only how it reaches people. Ten good answers beat a hundred vague ones.",
            },
          },
          {
            q: "Could a person check what it says before it reaches a customer?",
            no: {
              t: "Keep a human answering",
              b: "Where a wrong answer costs money or safety (prices you must honour, health, legal), the reply stays human, or the assistant hands over every time.",
            },
          },
          {
            q: "Will someone own it after launch?",
            no: {
              t: "Name the owner first",
              b: "An assistant nobody tends goes stale quietly. Decide who reviews it, how often, and what happens when the business changes.",
            },
          },
        ]}
        end={{
          t: "Build it small",
          b: "Answer the ten questions, link to the pages behind them, hand over to a person the moment it is unsure, and measure for a month before widening it.",
        }}
      />

      <H2 id="harm">Doing it without harm</H2>
      <p>
        The <Term id="privacy-act">Privacy Act 2020</Term> applies to an assistant as it does to everything else you
        run: the Privacy Commissioner describes its principles as governing “how agencies (organisations and businesses)
        can collect, store, use and share personal information”.
        <Cite n={2} /> Its specific guidance on generative AI is practical, and every line of it maps to a design
        choice you can make before launch:
      </p>
      <Check
        items={[
          <>
            <strong>Answers only from approved material.</strong> Point the assistant at your written sheet and your
            pages, and instruct it to say “I don’t know” rather than improvise. Have a person review what it produces
            before an action is taken on it: the Commissioner’s guidance says to “ensure human review prior to acting”.
            <Cite n={1} />
          </>,
          <>
            <strong>Tell visitors plainly.</strong> Where a tool affects people’s information, they “must be told how,
            when, and why the generative AI tool is being used”, in plain language.
            <Cite n={1} /> One line above the chat box is enough; hiding it is what damages trust.
          </>,
          <>
            <strong>Keep personal information out of the prompts.</strong> The Commissioner says not to “input into a
            generative AI tool personal or confidential information, unless it has been explicitly confirmed that
            inputted information is not retained or disclosed”.
            <Cite n={1} /> Design the assistant to take a name and a way to reply, and nothing else it doesn’t need.
          </>,
          <>
            <strong>A privacy impact assessment first.</strong> The Commissioner’s advice is to “only use a generative
            AI tool after conducting a Privacy Impact Assessment”, which is mostly a careful hour with this checklist
            for a small business.
            <Cite n={1} />
          </>,
        ]}
      />

      <H2 id="costs">What it costs to run</H2>
      <p>
        Two costs, and the second one is the one people forget. Building it is the writing (the approved answers), the
        connections (your pages, your calendar), the testing, and the transparency notice. Running it is the per-use
        charge most services make, which rises and falls with your traffic, plus the monthly hour someone spends
        reading what visitors actually asked and correcting the sheet.
      </p>
      <p>
        And the honest alternative: a contact page with a person who replies the same day, next to a page that answers
        the ten questions in the first place, costs almost nothing and never improvises. If the questions are arriving
        because the pages are thin, fix the pages. An assistant is the answer when the questions keep coming despite
        good pages, or after hours, or at a volume a small team can’t clear. Ask any provider for the expected run rate
        at your real traffic before you sign; a good one will estimate it from your numbers rather than guess.
      </p>

      <H2 id="live">Before it goes live</H2>
      <Check
        items={[
          <>
            <strong>The sheet is approved and dated.</strong> Ten answers, each one true today, each one linked to the
            page behind it.
          </>,
          <>
            <strong>“Talk to a person” is always one tap away,</strong> and the assistant offers it whenever it is
            unsure rather than guessing.
          </>,
          <>
            <strong>The notice is written:</strong> visitors know they are talking to an assistant, and where their
            details go.
          </>,
          <>
            <strong>Nothing personal goes into the prompts:</strong> no health details, no payment information, no
            scanned documents.
            <Cite n={1} />
          </>,
          <>
            <strong>Someone reads the log weekly,</strong> corrects the sheet, and can switch the assistant off in one
            place.
          </>,
        ]}
      />

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        This is our AI automation work, and we hold it to the standard in this article: an assistant that answers only
        from your approved words, hands over to a person the moment it is unsure, tells visitors what it is, and gets
        reviewed by a human. You can see the shape in our{" "}
        <a href={PAGES.project("enquiry-desk")}>Pellow demonstration</a>, where every drafted reply waits for a person
        before it goes anywhere. The free audit picks the ten questions worth answering first, and if the honest answer
        is that a chat assistant isn’t worth it for you yet, we’ll say that instead.
      </p>
    </>
  );
}
