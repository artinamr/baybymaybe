import type { ReactNode } from "react";
import { H2, H3, Steps, Compare, Check, Cite } from "@/components/blog/Prose";
import { Term } from "@/components/blog/Term";
import { PAGES } from "@/lib/content";

export const toc = [
  { id: "good-fit", title: "Is this task worth automating?" },
  { id: "team-tools", title: "The AI your team already uses" },
  { id: "workflows", title: "Five workflows that often pass" },
  { id: "enquiries", title: "1. Enquiries and replies" },
  { id: "documents", title: "2. Reading documents" },
  { id: "calls", title: "3. Call notes into your CRM" },
  { id: "assistant", title: "4. A website assistant" },
  { id: "search", title: "5. Searching your own documents" },
  { id: "not-for", title: "What stays with a person" },
  { id: "privacy", title: "The privacy part" },
  { id: "costs", title: "What it costs, and whether it pays" },
  { id: "start", title: "How to start: a four-week pilot" },
];

type PartsProps = { does: ReactNode; person: ReactNode; wrong: ReactNode; need: ReactNode };

function Parts({ does, person, wrong, need }: PartsProps) {
  return (
    <dl className="ar-parts">
      <div>
        <dt>What it does</dt>
        <dd>{does}</dd>
      </div>
      <div>
        <dt>Who checks</dt>
        <dd>{person}</dd>
      </div>
      <div>
        <dt>What can go wrong</dt>
        <dd>{wrong}</dd>
      </div>
      <div>
        <dt>What you need</dt>
        <dd>{need}</dd>
      </div>
    </dl>
  );
}

/** One workflow: a heading that keeps the address other pages link to (#enquiries, #assistant and the rest), then its four parts. */
function Workflow({ id, title, ...parts }: { id: string; title: string } & PartsProps) {
  return (
    <>
      <h3 id={id} className="ar-h3">
        {title}
      </h3>
      <Parts {...parts} />
    </>
  );
}

export default function Body() {
  return (
    <>
      <p>
        Start with one job your team does many times a week, that follows rules you could write down and that a person
        can check in seconds, such as sorting enquiries and drafting replies. Put your team on business AI accounts, keep
        a person approving anything a customer sees, and test on past work first. If the saving is small once checking
        is counted, a template may do more.
      </p>

      <H2 id="good-fit">Is this task worth automating?</H2>
      <p>Score the task before you choose a tool.</p>
      <Compare
        caption="The fit test"
        head={["Question", "Good fit", "Poor fit"]}
        rows={[
          ["How often does it happen?", "Many times a week", "A few times a month"],
          ["Could a new starter follow written rules?", "Mostly", "It’s judgement every time"],
          ["Can a person check it quickly?", "In seconds, against the original", "Only by redoing it"],
          ["What if it’s wrong?", "Little harm, caught in time", "Money, health or rights at stake, or a customer sees it first"],
          ["What information does it use?", "Little that’s personal", "Health, financial or other sensitive details"],
        ]}
      />
      <p>
        A good fit on all five is worth testing. A poor fit on any means a person keeps the job, or at least the
        decision, and software does no more than prepare it (sorting, a first draft). The Ministry of Business,
        Innovation and Employment (MBIE)
        draws the same line: where AI helps with big decisions about money, health or the law, “a person should always
        be involved”.
        <Cite n={1} />
      </p>

      <H2 id="team-tools">The AI your team already uses</H2>
      <p>
        Find out what your team already does with AI. The Privacy Commissioner calls that critical to understand, and
        warns that staff “may be unknowingly putting people’s privacy at risk”.
        <Cite n={2} />
      </p>
      <p>
        The account matters more than the brand. OpenAI may train its models on content from its personal plans (Free,
        Plus and Pro) unless the user turns off “Improve the model for everyone”.
        <Cite n={3} /> Business accounts differ:
      </p>
      <Compare
        caption="What the providers say"
        head={["Provider", "Business accounts"]}
        rows={[
          [
            "OpenAI",
            <>
              ChatGPT Business, Enterprise, Edu and the <Term id="api">API</Term>: not used to improve its models, by
              default.
              <Cite n={3} />
            </>,
          ],
          [
            "Anthropic",
            <>
              Claude for Work, the API and other commercial products: not used for training, by default.
              <Cite n={4} />
            </>,
          ],
          [
            "Google",
            <>
              Workspace data, prompts included: not used for training without the customer’s permission or instruction.
              <Cite n={5} />
            </>,
          ],
          [
            "Microsoft",
            <>
              Copilot prompts, responses and data reached through Microsoft Graph: not used to train foundation models.
              <Cite n={6} />
            </>,
          ],
        ]}
      />
      <H3>A one-page staff rule</H3>
      <p>
        The National Cyber Security Centre (NCSC) recommends an AI use policy that says what data can’t be uploaded.
        <Cite n={7} /> Yours can fit on a page:
      </p>
      <Check
        items={[
          <>
            <strong>Our tools,</strong> by name, on business accounts only.
          </>,
          <>
            <strong>What stays out:</strong> personal or confidential information, unless the provider has explicitly
            confirmed it won’t keep or disclose it.
            <Cite n={8} />
          </>,
          <>
            <strong>No thumbs up or down</strong> on customer work: feedback can hand over the whole conversation
            (Anthropic keeps it for up to five years).
            <Cite n={4} />
          </>,
          <>
            <strong>What always gets checked:</strong> names, numbers, dates, prices and promises.
          </>,
          <>
            <strong>Who approves a new tool:</strong> the owner, with our privacy officer (every business must appoint
            one).
            <Cite n={9} />
          </>,
          <>
            <strong>Who to tell, the same day,</strong> if something goes wrong.
          </>,
        ]}
      />

      <H2 id="workflows">Five workflows that often pass</H2>
      <Workflow
        id="enquiries"
        title="1. Sorting enquiries and drafting replies"
        does="Flags urgent enquiries and drafts replies in your approved wording, such as offering the next free times."
        person="Someone checks each draft against the original. Complaints and anything urgent or sensitive go straight to a person."
        wrong={
          <>
            A confident, wrong reply, or a promise you can’t keep. The Fair Trading Act forbids misleading conduct in
            trade,
            <Cite n={10} /> and MBIE lists it among the laws that apply to AI output.
            <Cite n={1} /> An email can even be written to trick the AI (prompt injection),
            <Cite n={7} /> so let it draft, never send.
          </>
        }
        need="Past enquiries to test on, your standard answers, and a handover list."
      />
      <Workflow
        id="documents"
        title="2. Reading details out of documents"
        does="Pulls names, dates, amounts and reference numbers out of invoices or forms and into your system."
        person="A person checks anything marked unsure, plus a sample of the rest."
        wrong={
          <>
            A smudged scan gives a wrong number that looks right. Keep the originals: Inland Revenue says to keep
            records for at least seven tax years, and storing them offshore, including in the cloud, needs its approval.
            <Cite n={11} />
          </>
        }
        need="Sample documents, and where each detail goes."
      />
      <Workflow
        id="calls"
        title="3. Call notes into your CRM"
        does={
          <>
            Turns a recording or rough notes into a summary with next steps, saved against the right customer in your{" "}
            <Term id="crm">CRM</Term>.
          </>
        }
        person="Whoever took the call, while it’s fresh."
        wrong={
          <>
            It drops a detail or invents a promise. Even a wrong summary is personal information once saved, and the
            customer can ask to see and correct it.
            <Cite n={2} />
          </>
        }
        need={
          <>
            Your CRM’s fields (see{" "}
            <a href={`${PAGES.article("connect-website-crm-booking")}#field-map`}>mapping the data</a>), and callers
            told at the start that the call is recorded, and why.
            <Cite n={12} />
          </>
        }
      />
      <Workflow
        id="assistant"
        title="4. A website assistant"
        does="Answers routine questions from approved information, links its sources, and hands over when it can’t help."
        person="Your team owns the answers, reads the conversations weekly and picks up every handover."
        wrong={
          <>
            It states something untrue with confidence (a <Term id="hallucination">hallucination</Term>), or traps a
            visitor who wanted a person. <a href={PAGES.article("website-chat-assistant")}>Our chat assistant guide</a>{" "}
            goes further.
          </>
        }
        need="Real customer questions, approved answers, what it must never answer, and a line saying it’s software."
      />
      <Workflow
        id="search"
        title="5. Searching your own documents"
        does="Answers your team’s questions from your own policies and past work, naming the source document."
        person="The person asking reads the source before relying on it."
        wrong={
          <>
            Old documents give old answers, and loose sharing gets exposed: Microsoft says Copilot surfaces only what
            each user can already view,
            <Cite n={6} /> so a folder shared too widely becomes easy to find.
          </>
        }
        need="Current documents, tidy sharing, and a rule on who sees what."
      />

      <H2 id="not-for">What stays with a person</H2>
      <p>Write down what the automation must never do on its own:</p>
      <ul>
        <li>
          <strong>Decide about people:</strong> hiring, credit, refunds outside policy, anything that changes how
          someone is treated.
        </li>
        <li>
          <strong>Give advice that needs a qualified person:</strong> medical, legal, financial or safety. The NCSC says
          a qualified person should review a chatbot’s legal, medical or financial answers before anyone acts on them.
          <Cite n={7} />
        </li>
        <li>
          <strong>Do anything that can’t be undone,</strong> such as payments, deletions or bulk messages, without a
          person approving it.
        </li>
        <li>
          <strong>Answer what it hasn’t been given.</strong> It should say it doesn’t know.
        </li>
      </ul>
      <H3>Make the check real</H3>
      <p>
        Approval only protects you if the person really looks. The Privacy Commissioner warns that people overseeing
        computer systems “can find it hard to notice errors and mistakes”, so a{" "}
        <Term id="human-in-the-loop">human in the loop</Term> may not be enough on its own.
        <Cite n={2} /> MBIE calls accepting output without checking it automation bias, and notes that a generated email
        one click from sending is less likely to be reviewed.
        <Cite n={1} />
      </p>
      <ul>
        <li>Show the draft beside the original, and make approving a separate step from sending.</li>
        <li>
          Check what it turned away. In one of MBIE’s scenarios, a person reviewed every application a screening tool
          shortlisted, yet some women’s applications it rejected were at least as deserving.
          <Cite n={1} />
        </li>
        <li>Count how often drafts get changed. If never, check someone is reading.</li>
      </ul>

      <H2 id="privacy">The privacy part</H2>
      <p>
        The <Term id="privacy-act">Privacy Act 2020</Term> applies to AI tools as to everything else.
        <Cite n={2} /> Six steps cover what the Privacy Commissioner expects and what the law says:
      </p>
      <Steps
        items={[
          {
            t: "Keep personal information out",
            b: (
              <p>
                Don’t put personal or confidential information into a tool unless the provider has explicitly confirmed
                it won’t keep or disclose it.
                <Cite n={8} /> If you’re not sure, keep it out altogether.
                <Cite n={2} />
              </p>
            ),
          },
          {
            t: "Tell people",
            b: (
              <p>
                Where customers and their personal information are likely to be affected, tell them how, when and why the
                tool is used, in plain language, before you collect their information.
                <Cite n={8} />
              </p>
            ),
          },
          {
            t: "Assess it and sign it off",
            b: (
              <p>
                The Commissioner expects a privacy impact assessment first, a check that the tool is necessary and
                proportionate, explicit approval from leadership, and engagement with Māori about its potential impacts
                on their communities and taonga.
                <Cite n={8} /> Its brief privacy analysis template helps you decide if you need a full one.
                <Cite n={13} />
              </p>
            ),
          },
          {
            t: "Know where the information goes",
            b: (
              <p>
                A provider, here or overseas, that only stores or processes information for you isn’t receiving a
                disclosure: you still hold it in law, and stay fully responsible for it.
                <Cite n={14} />
                <Cite n={9} /> If it uses the information for its own purposes, such as training its AI, that can be a
                disclosure, which principle 11 must allow, and principle 12 too if the provider is overseas.
                <Cite n={14} /> Principle 12 needs a condition to apply, such as comparable privacy safeguards, or the
                person’s permission after being told it may not be protected in the same way.
                <Cite n={15} /> So ask each provider whether it uses your data for itself, where it stores and processes
                it and how long it keeps it, and take advice if you’re unsure which rules apply.
              </p>
            ),
          },
          {
            t: "Check output, and keep it correctable",
            b: (
              <p>
                Have a person review output before you act on it.
                <Cite n={8} /> Take reasonable steps to check personal information is accurate before you use it
                (principle 8), and be ready to show people what you hold and correct it (principles 6 and 7).
                <Cite n={2} />
              </p>
            ),
          },
          {
            t: "Plan for a mistake",
            b: (
              <p>
                If a <Term id="privacy-breach">privacy breach</Term> has caused, or might cause, serious harm, the
                Privacy Act requires you to notify the Commissioner, ideally within 72 hours of becoming aware of it,
                even while you’re still investigating, and to tell the people affected as soon as you can, unless an
                exception applies.
                <Cite n={16} /> If your provider has the breach, the clock starts when the provider knows, not when it
                tells you, so agree how fast it must tell you.
                <Cite n={14} />
              </p>
            ),
          },
        ]}
      />

      <H2 id="costs">What it costs, and whether it pays</H2>
      <p>
        Quotes should show the build and the running fees. MBIE warns that AI charges may not be fully transparent:
        know the total cost, the effect of heavy use, the cost of ongoing support, and whether you can change provider
        and take your data.
        <Cite n={1} /> Then add the cost a quote won’t show: your team’s checking time. It decides whether the
        automation pays.
      </p>
      <H3>Does it pay?</H3>
      <Steps
        items={[
          { t: "Count and time it", b: <p>How many a week, from last month’s records, not memory. Time five done by hand.</p> },
          { t: "Time the check", b: <p>In the pilot, time how long checking a draft takes, and count the drafts redone from scratch.</p> },
          { t: "Do the sum", b: <p>Minutes saved a week = (good drafts × minutes by hand) minus (all drafts × minutes to check).</p> },
          { t: "Weigh it", b: <p>Set the hours saved against the fees and the build cost spread over a year.</p> },
        ]}
      />
      <H3>Worked example: a plumber’s inbox</H3>
      <p>
        <em>The firm and its numbers are invented, to show the method.</em>
      </p>
      <p>
        A Hamilton plumbing firm has an office manager and six plumbers on the road. Website enquiries top the fit test:
        frequent, mostly the same questions, quick to check. Renovation quotes stay human, and overdue-invoice reminders
        only need a rule in the accounts software, not AI. The rules come first: a burst pipe, flooding or a gas smell
        goes straight to the on-call plumber, and drafts never quote a price.
      </p>
      <p>
        Six weeks of past enquiries go through it. Say 40 a week take 8 minutes each by hand, a draft takes 2 to check,
        and 10 in 40 are redone: (30 × 8) minus (40 × 2) is 160 minutes, under three hours a week. If every urgent
        message was caught and
        the fees are small, it goes live with the manager approving each reply; if not, a reply template may be the
        better buy.
      </p>

      <H2 id="start">How to start: a four-week pilot</H2>
      <p>
        MBIE suggests starting small and trialling a system before you commit.
        <Cite n={17} />
      </p>
      <Steps
        items={[
          {
            t: "Week 1: choose and write the rules",
            b: <p>Pick one task with the fit test. Write down what goes to a person and what it must never do.</p>,
          },
          {
            t: "Week 1: set up safely",
            b: (
              <p>
                Business accounts, the privacy steps, and a one-page record: what it reads, where the data goes, who
                checks it, how to switch it off. MBIE says each AI system should be on an organisation-wide inventory.
                <Cite n={1} />
              </p>
            ),
          },
          {
            t: "Weeks 2 and 3: test on past work",
            b: <p>Run past material through it and compare with what your team did: right, wrong, handed over correctly, minutes to check.</p>,
          },
          { t: "Week 4: decide", b: <p>Do the sum. If it pays, go live with a person approving everything.</p> },
          {
            t: "After that: read a sample every week",
            b: (
              <p>
                And test again after any change: MBIE notes that AI models can change over time.
                <Cite n={1} />
              </p>
            ),
          },
        ]}
      />
      <p>
        Set stop rules before you start: a missed urgent message, a wrong price or promise reaching a customer, or
        checking that takes nearly as long as the job. MBIE’s quickstart asks what you’ll do if something goes wrong or
        you want to stop.
        <Cite n={17} /> The answer should be a switch your team knows how to use.
      </p>
      <p>
        Our <a href={PAGES.project("enquiry-desk")}>Pellow demonstration</a> shows the first workflow on a fictional
        clinic’s inbox: each draft waits for a person, and a message about chest symptoms goes straight to one.
      </p>

      <H2 id="yours">How we’d look at yours</H2>
      <p>
        Our <a href={PAGES.service("ai-automation")}>AI automation service</a> starts with one task and a way to test it
        on your own material. For the free audit, tell us what your team repeats every week. We’ll suggest one workflow
        worth piloting, or say plainly if a simpler change would do more.
      </p>
    </>
  );
}
