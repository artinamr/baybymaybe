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
        Consider a chat assistant when the same questions keep arriving and you have current, written answers to
        them. It also needs someone responsible for checking it after launch. If the website is missing basic
        information, improve the pages first, then check whether visitors still need another way to find it.
      </p>

      <H2 id="what">What a chat assistant is</H2>
      <p>
        Ask a provider which kind they mean. A rules-based bot shows buttons (“Bookings”, “Prices”, “Talk to us”)
        and follows the paths someone has set up.
        The newer kind is a <Term id="chat-assistant">chat assistant</Term> built on a{" "}
        <Term id="generative-ai">generative AI</Term> model: it reads your own material (your pages, your price list,
        your policies) and drafts answers in sentences.
      </p>
      <p>
        There is also a line between answering and acting. Answering is what this article covers: a visitor asks, the
        assistant replies. Acting (taking a booking, changing an order, issuing a refund) is automation with much
        higher stakes, and it needs the checks in our article on{" "}
        <a href={`${PAGES.article("ai-automation-workflows")}#good-fit`}>what makes a task a good fit for AI</a>.
      </p>

      <H2 id="well">What one does well</H2>
      <p>
        Start with routine questions: opening hours, parking, a price range, the suburbs you cover or what a first
        visit involves. An assistant can help visitors find those answers outside office hours. It can also ask which
        service they need and point them to the relevant page or contact.
      </p>
      <p>
        Write the answers down before choosing the software. A new staff member should be able to follow the same
        material and know when to ask someone else. That gives you a useful starting point for testing the assistant,
        including the questions it should decline.
      </p>
      <p>
        For example, a visitor asks after hours whether your physio clinic takes ACC claims and what a first
        appointment involves. The assistant answers from your fees page and your first-visit page, links both, and
        offers the booking link. In a test, check that it keeps to those pages and hands over if the visitor asks for
        individual health advice.
      </p>

      <H2 id="disappoint">Where they disappoint</H2>
      <p>
        The failure to respect is the confident wrong answer. The Privacy Commissioner’s guidance on generative AI
        warns that these tools can produce confident factual errors and says their output needs checking.
        <Cite n={1} /> An invented price, promise or policy can mislead a customer. Test for these failure modes:
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
      <Callout title="Set the boundary before launch">
        <p>
          The assistant should stay within approved information and offer a person when it cannot help. Test that
          behaviour with awkward questions as well as straightforward ones.
        </p>
      </Callout>

      <H2 id="test">A test before you build</H2>
      <p>Use these four questions to check whether a small trial is worth planning.</p>
      <DecisionTree
        steps={[
          {
            q: "Do the same ten questions arrive every week?",
            no: {
              t: "Fix the pages first",
              b: "If every question needs a different answer, start by improving the pages and the route to a person.",
            },
          },
          {
            q: "Are those answers written down, true and current?",
            no: {
              t: "Write the sheet first",
              b: "Give the assistant a clear source to work from. Write and approve the routine answers before choosing a tool.",
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
        run: its principles cover collecting, storing, using and sharing personal information.
        <Cite n={2} /> Work through the Commissioner’s generative AI guidance before launch. These are some of the
        decisions it affects:
      </p>
      <Check
        items={[
          <>
            <strong>Answers only from approved material.</strong> Point the assistant at your written sheet and your
            pages, and instruct it to say “I don’t know” rather than improvise. Have a person review what it produces
            before an action is taken on it, as the Commissioner’s guidance recommends.
            <Cite n={1} />
          </>,
          <>
            <strong>Tell visitors plainly.</strong> Explain how and why the assistant is used, what information it
            handles and how you address the privacy risks, before collecting information.
            <Cite n={1} /> Put the explanation where visitors will see it, with a link to the fuller privacy notice.
          </>,
          <>
            <strong>Check what reaches the provider.</strong> The Commissioner says to keep personal or confidential
            information out unless you have explicitly confirmed it will not be retained or disclosed by the provider.
            <Cite n={1} /> Use a separate contact form for names and contact details.
          </>,
          <>
            <strong>A privacy impact assessment first.</strong> The Commissioner expects an assessment before use,
            covering the risks and how you will address them.
            <Cite n={1} />
          </>,
        ]}
      />

      <H2 id="costs">What it costs to run</H2>
      <p>
        Budget for both the build and the ongoing work. The build includes approved answers, any connections,
        testing and the privacy notice. Ask the provider how charges vary with use and what limits apply. Your team
        also needs time to review conversations and keep the answers current.
      </p>
      <p>
        Compare that with a clear FAQ page and a contact route your team can look after. If missing information is
        causing the enquiries, better pages may resolve the problem. An assistant is worth testing when routine
        questions keep arriving despite good pages, particularly after hours. Ask for a running-cost estimate based
        on your expected traffic before you commit.
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
        Our <a href={PAGES.service("ai-automation")}>AI automation work</a> starts with approved information, tests and
        a clear route to a person. You can see an example of human approval in our{" "}
        <a href={PAGES.project("enquiry-desk")}>Pellow demonstration</a>, where every drafted reply waits for a person
        before it goes anywhere. For the free audit, tell us which questions reach your team repeatedly. We’ll look at
        the pages first and suggest whether an assistant is worth investigating.
      </p>
    </>
  );
}
