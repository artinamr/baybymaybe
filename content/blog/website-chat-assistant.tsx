import { H2, H3, Callout, Steps, Compare, Check, Cite } from "@/components/blog/Prose";
import { DecisionTree } from "@/components/blog/Diagrams";
import { Term } from "@/components/blog/Term";
import { PAGES } from "@/lib/content";

export const toc = [
  { id: "what", title: "What a chat assistant is" },
  { id: "well", title: "What it’s good for" },
  { id: "disappoint", title: "Where they go wrong" },
  { id: "responsible", title: "You answer for what it says" },
  { id: "test", title: "A test before you build" },
  { id: "harm", title: "Keeping it safe in practice" },
  { id: "privacy", title: "The privacy part" },
  { id: "costs", title: "Your options, and what they cost" },
  { id: "live", title: "Test it, then start small" },
  { id: "yours", title: "How we’d look at yours" },
];

export default function Body() {
  return (
    <>
      <p>
        Add a <Term id="chat-assistant">chat assistant</Term> only if the same questions keep arriving, you have written
        answers you would stand behind, and someone will read its conversations every week. Whatever it tells a visitor,
        your business has said. Keep it to approved answers, word for word on prices and refunds, and hand questions about a
        particular booking, health or the law to a person.
      </p>
      <p>
        If the questions come from information missing on your website, fix the pages first: that costs less and helps
        every visitor.
      </p>

      <H2 id="what">What a chat assistant is</H2>
      <p>
        There are two kinds. A rules-based bot shows buttons (“Bookings”, “Prices”, “Talk to us”) and
        follows paths someone set up, so it can only say what you wrote. A chat assistant built on{" "}
        <Term id="generative-ai">generative AI</Term> reads your pages, price list and policies and writes its answers in
        sentences, so it can also write things you didn’t.
      </p>
      <p>Then decide how far it goes. Each step needs more care:</p>
      <ul>
        <li>
          <strong>Answering:</strong> it replies from your approved information.
        </li>
        <li>
          <strong>Collecting:</strong> it gathers names, contact details or job details for your team, best through a
          form it links to. That’s personal information, so <a href="#privacy">the privacy part</a> applies in full.
        </li>
        <li>
          <strong>Acting:</strong> it books, changes an order or issues a refund. Let it offer, but have the visitor
          confirm in your booking or order system. Acting needs the checks in our article on{" "}
          <a href={`${PAGES.article("ai-automation-workflows")}#good-fit`}>what makes a task a good fit for AI</a>.
        </li>
      </ul>

      <H2 id="well">What it’s good for</H2>
      <p>
        Routine questions: opening hours, parking, a price range, the suburbs you cover, what a first visit involves. It
        can answer those after hours and point people to the right page or person.
      </p>
      <p>
        Write the answers down first, clearly enough for a new staff member to follow. That sheet becomes the
        assistant’s source and your test.
      </p>
      <p>
        It isn’t worth it when few questions arrive, when most need judgement, or when the website simply doesn’t say.
        A clear page and a quick reply do more.
      </p>
      <H3>What it must never do</H3>
      <ul>
        <li>Make up a price, a promise or a policy.</li>
        <li>Give health, legal or financial advice.</li>
        <li>Confirm a booking, refund or discount your systems haven’t.</li>
        <li>Ask for health or payment details, or take other personal details in the chat itself.</li>
        <li>Pretend to be a person, or be the only way to reach you.</li>
      </ul>

      <H2 id="disappoint">Where they go wrong</H2>
      <p>
        The failure to plan for is the confident wrong answer. The Privacy Commissioner warns that generative AI tools
        “often produce very confident errors of fact or logic”.
        <Cite n={1} /> The Ministry of Business, Innovation and Employment (MBIE) adds that the same question is likely
        to get different answers.
        <Cite n={2} /> Test for these:
      </p>
      <ul>
        <li>
          <strong>Improvising</strong> where it has no material, instead of saying “I don’t know; here’s who does”.
        </li>
        <li>
          <strong>Being talked into things.</strong> Visitors can type instructions meant to trick it, which the National
          Cyber Security Centre (NCSC) calls prompt injection: inputs disguised as legitimate requests, designed to get
          “sensitive, wrong or unsafe answers”.
          <Cite n={3} />
        </li>
        <li>
          <strong>Trapping people who wanted a person.</strong> Not everyone likes chatbots, the Privacy Commissioner’s
          guidance points out, so a website, an online form and a phone number may still matter.
          <Cite n={4} />
        </li>
        <li>
          <strong>Getting in the way.</strong> An open chat window can cover the link a keyboard user has moved to. The
          guidance on <Term id="wcag">WCAG</Term> 2.2 uses that very example, and the page passes because pressing
          Escape closes the window and brings the link back.
          <Cite n={5} />
        </li>
        <li>
          <strong>Going stale.</strong> Prices change, a service is dropped, and it keeps answering from the old sheet
          for months.
        </li>
      </ul>

      <H2 id="responsible">You answer for what it says</H2>
      <p>This is general information, not legal advice.</p>
      <p>
        In February 2024, a tribunal in British Columbia, Canada, decided a customer’s claim against Air Canada over
        what its website chatbot told them about bereavement fares. Air Canada argued it couldn’t be held liable for
        information from its agents or representatives, including a chatbot.
      </p>
      <p>
        The tribunal called that “a remarkable submission”: a chatbot “is still just a part of Air Canada’s website”,
        and the airline is responsible for all the information on it. “It makes no difference whether the information
        comes from a static page or a chatbot.”
        <Cite n={6} />
      </p>
      <p>
        The tribunal found Air Canada hadn’t taken reasonable care to make sure its chatbot was accurate, said it hadn’t explained why customers should
        have to double-check one part of its website against another, and ordered it to pay damages.
        <Cite n={6} />
      </p>
      <p>
        That decision is Canadian. In New Zealand, the Fair Trading Act 1986 makes it illegal for businesses to mislead
        or deceive consumers.
        <Cite n={7} /> Section 9 prohibits misleading or deceptive conduct in trade, and conduct likely to mislead or
        deceive. Section 13 prohibits false or misleading representations about prices, and about guarantees, rights and
        remedies, including those under the Consumer Guarantees Act.
        <Cite n={8} />
      </p>
      <p>
        In one of MBIE’s scenarios, a fictional skincare shop’s AI tools posted fake reviews and false stock claims, and
        its chatbot gave customers incorrect refund information, with no option to speak to a human. The shop fixed all
        of it, retraining the chatbot and adding a way to reach a person; otherwise, MBIE says, it risked breaching the
        Fair Trading Act for misleading consumers.
        <Cite n={2} />
      </p>
      <H3>What this means for you</H3>
      <p>Treat every answer as if you had published it on a page:</p>
      <ul>
        <li>Prices, refunds, guarantees and cancellations: your approved wording, word for word, or a person.</li>
        <li>Don’t count on a link to the right page to rescue a wrong answer.</li>
        <li>If it mentions prices or terms at all, have your lawyer read the approved wording.</li>
      </ul>

      <H2 id="test">A test before you build</H2>
      <p>The first “no” is your answer.</p>
      <DecisionTree
        steps={[
          {
            q: "Do the same questions arrive every week?",
            no: {
              t: "Fix the pages first",
              b: "If questions are few, or each one differs, improve the pages and the route to a person.",
            },
          },
          {
            q: "Are the answers written down, true and current?",
            no: {
              t: "Write the answers first",
              b: "Write and approve the routine answers, each linked to its page, before choosing a tool.",
            },
          },
          {
            q: "Can most be answered without a person’s judgement?",
            no: {
              t: "Keep a person answering",
              b: "If most are about a particular booking, a refund, health or the law, it would hand nearly everything over.",
            },
          },
          {
            q: "Will someone own it after launch?",
            no: {
              t: "Name the owner first",
              b: "Decide who reads its conversations weekly, who updates the answers, and who can switch it off.",
            },
          },
        ]}
        end={{
          t: "Try it small",
          b: "Answer routine questions from approved wording, hand over the moment it’s unsure, and measure for a month.",
        }}
      />
      <p>
        Question 3 keeps the risky topics with a person. Where legal, medical or financial advice is involved, the NCSC
        says a qualified person should review a chatbot’s responses before any action is taken.
        <Cite n={3} />
      </p>
      <H3>Two invented examples</H3>
      <p>
        <strong>A campervan hire firm in Christchurch.</strong> Overseas visitors ask the same things after hours: pick-up
        times, the bond, insurance, one-way fees. The assistant gives the approved wording from the terms, with a link,
        and hands any particular booking, refund or damage claim to the reservations manager, who reads the
        conversations every Monday. Worth a small trial.
      </p>
      <p>
        <strong>A physiotherapy clinic in Tauranga.</strong> Its booking page answers the booking questions; what’s left
        is mostly symptoms, for a physiotherapist to answer. It fails question 3: clearer pages and at most a button menu (Book, Fees, ACC, Talk to us) will
        do more.
      </p>

      <H2 id="harm">Keeping it safe in practice</H2>
      <p>A live assistant answers before anyone can check it. These stand in for that check, each with an owner.</p>
      <Check
        items={[
          <>
            <strong>Approved material only.</strong> It answers from your written answers and pages, and says “I don’t
            know” rather than improvise.
          </>,
          <>
            <strong>Topics it always hands over:</strong> a particular booking, refund requests, complaints, health, legal
            and financial questions, and anyone upset. It says when a person will reply.
          </>,
          <>
            <strong>“Talk to a person” is one tap away,</strong> and offered whenever it’s unsure.
          </>,
          <>
            <strong>A weekly read:</strong> someone reads the conversations, corrects wrong answers and fills the gaps.
          </>,
          <>
            <strong>A switch</strong> that turns it off at once, in one place.
          </>,
          <>
            <strong>Keep personal details out:</strong> ask visitors not to share them in the chat, take contact details
            through a form instead, and use a provider you have confirmed keeps the conversations only for you, for the
            period you set, and doesn’t disclose them or use them to train its AI.
            <Cite n={1} /> The NCSC’s advice for chatbots is to collect only what is essential.
            <Cite n={3} />
          </>,
          <>
            <strong>A person before any action.</strong> Where your business acts on what it produces, the Commissioner
            suggests a person reviews it first.
            <Cite n={1} />
          </>,
        ]}
      />

      <H2 id="privacy">The privacy part</H2>
      <p>
        The <Term id="privacy-act">Privacy Act 2020</Term> applies to an assistant as to everything else: its principles
        govern how businesses collect, store, use and share personal information.
        <Cite n={9} />
      </p>
      <ul>
        <li>
          <strong>Tell people first.</strong> Where customers and their personal information are likely to be affected,
          the Commissioner expects them to be told how, when and why generative AI is used, in plain language, before any
          of their information is collected.
          <Cite n={1} /> Principle 3 asks that people know why their information is collected and who will receive it.
          <Cite n={10} />
        </li>
        <li>
          <strong>What the provider does with conversations.</strong> If it only stores or processes them for you,
          you remain fully responsible. If it uses them for its own purposes, such as training its AI, that could be a
          disclosure principle 11 must allow, and principle 12 may apply if it’s overseas.
          <Cite n={11} /> The NCSC says contracts should include clear clauses on data protection and breach
          notification.
          <Cite n={3} />
        </li>
        <li>
          <strong>Set a retention period.</strong> Principle 9 says not to keep personal information longer than its
          lawful purposes require.
          <Cite n={12} /> Check you can delete conversations yourself.
          <Cite n={11} />
        </li>
        <li>
          <strong>Assess it first.</strong> The Commissioner says to use a generative AI tool only after a privacy impact
          assessment.
          <Cite n={1} /> If you’re unsure you need a full one, its brief privacy analysis template helps you decide.
          <Cite n={13} /> Every business must have at least one privacy officer.
          <Cite n={14} /> The Commissioner also expects senior leadership to approve the tool’s use explicitly, having
          weighed its risks.
          <Cite n={1} />
        </li>
      </ul>
      <H3>A notice for the chat box</H3>
      <p>
        A privacy notice is a short disclosure where you collect information, giving the key points and linking to your
        privacy statement.
        <Cite n={15} /> Adapt this one and have your privacy officer check it.
      </p>
      <Callout title="Notice to adapt">
        <p>
          You’re chatting with an automated assistant. It answers from our own information and can get things wrong.
          Please don’t share health, payment or other personal details here. To reach a person, ask here or call
          [number]. [Provider] keeps these conversations for [period]. How we handle your information: [link to privacy
          statement].
        </p>
      </Callout>

      <H2 id="costs">Your options, and what they cost</H2>
      <p>The cheapest option is often enough.</p>
      <Compare
        caption="Four ways to answer visitors’ questions"
        head={["Option", "Good when", "Watch for", "Ongoing work"]}
        rows={[
          ["Better pages and a contact route", "Questions come from missing information", "Nothing new to go wrong", "Keeping pages current"],
          ["A button menu", "A few routes cover most visitors", "It only says what you wrote", "Updating the paths"],
          ["An AI agent in a help-desk product", "Answers in sentences, with no build", "How conversations are billed", "Reading conversations, updating its material"],
          ["A custom assistant", "It must follow your exact rules or use your systems", "Build cost; fees rise with use", "All that, plus the build’s upkeep"],
        ]}
      />
      <p>
        Running costs have three parts: the provider’s fees, any plan or seats, and your team’s time. Read how fees are
        counted.
      </p>
      <p>
        Intercom, for example, prices Fin, its AI agent, at US$0.99 per “outcome”: a customer confirms their
        issue is resolved, doesn’t ask for more help after Fin responds, or Fin completes a workflow, including a
        handover. It charges once per conversation at most.
        <Cite n={16} /> So a visitor who reads an answer and simply leaves counts. Ask any provider exactly what it bills
        for.
      </p>
      <p>
        Then do the sum: expected chats a month, times the share billed, times the price, plus the plan and your team’s
        hours. Ask for an estimate and a monthly cap before you commit.
      </p>

      <H2 id="live">Test it, then start small</H2>
      <p>Run this test before launch, and again after any change to your prices, policies or the tool.</p>
      <H3>Test it like a difficult customer</H3>
      <Steps
        items={[
          {
            t: "Twenty real questions",
            b: <p>In customers’ own words, typos included, from your inbox and phone notes. Include three answers you changed recently.</p>,
          },
          {
            t: "Each one three times",
            b: (
              <p>
                The same question can get different answers.
                <Cite n={2} /> Every version must be right.
              </p>
            ),
          },
          {
            t: "Every price, refund and cancellation question",
            b: (
              <p>
                Word for word against your approved wording: section 13 of the Fair Trading Act covers misleading
                representations about prices, rights and remedies.
                <Cite n={8} />
              </p>
            ),
          },
          {
            t: "Six it must hand over",
            b: (
              <p>
                A health or legal question, a particular booking, a refund request, a complaint, an angry message, and an
                after-hours request for a person (it should say when to expect a reply).
              </p>
            ),
          },
          {
            t: "Three attempts to trick it",
            b: (
              <p>
                Ask it to ignore its instructions, give a discount or promise something: the prompt injection the NCSC
                warns about.
                <Cite n={3} />
              </p>
            ),
          },
          {
            t: "Keyboard and phone",
            b: (
              <p>
                Open it, then tab away from it, keyboard only. If the open window covers what you’ve moved to, pressing
                Escape should close it and bring that back into view.
                <Cite n={5} /> On a phone, check it doesn’t cover your main button.
              </p>
            ),
          },
        ]}
      />
      <p>
        Pass mark: no wrong answer on prices, refunds, health or legal matters, and every handover works.
      </p>
      <H3>The first month</H3>
      <p>
        Start with the routine questions only. Each week, note how many conversations it handled without handing over,
        whether each handover was right, and any wrong or out-of-date answer (on prices, refunds and health, the
        target is none). Each question it couldn’t answer is a page to improve or an answer to write. After a month, keep
        it, narrow it or switch it off.
      </p>

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        Our <a href={PAGES.service("ai-automation")}>AI automation work</a> starts with approved information, tests and a
        clear route to a person. Our <a href={PAGES.project("enquiry-desk")}>Pellow demonstration</a> shows human
        approval at work: every drafted reply waits for a person. For the free audit, tell us which questions your team
        answers again and again. We’ll look at your pages first and say whether an assistant is worth trying, or a
        better page would do.
      </p>
    </>
  );
}
