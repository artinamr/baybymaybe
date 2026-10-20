import { H2, Callout, Steps, Compare, Figure, Cite } from "@/components/blog/Prose";
import { Flow } from "@/components/blog/Diagrams";
import { Term } from "@/components/blog/Term";
import { PAGES } from "@/lib/content";

export const toc = [
  { id: "good-fit", title: "What makes a task a good fit" },
  { id: "enquiries", title: "1. Sorting and drafting replies" },
  { id: "documents", title: "2. Reading documents" },
  { id: "calls", title: "3. Call notes into the CRM" },
  { id: "assistant", title: "4. A website assistant" },
  { id: "search", title: "5. Searching your own documents" },
  { id: "not-for", title: "What it shouldn’t do" },
  { id: "privacy", title: "The privacy part" },
  { id: "costs", title: "What it costs" },
  { id: "start", title: "How to start" },
];

function Parts({ does, person, wrong, need }: { does: string; person: string; wrong: string; need: string }) {
  return (
    <dl className="ar-parts">
      <div>
        <dt>What it does</dt>
        <dd>{does}</dd>
      </div>
      <div>
        <dt>Where a person stays in</dt>
        <dd>{person}</dd>
      </div>
      <div>
        <dt>What can go wrong</dt>
        <dd>{wrong}</dd>
      </div>
      <div>
        <dt>What you need to start</dt>
        <dd>{need}</dd>
      </div>
    </dl>
  );
}

export default function Body() {
  return (
    <>
      <p>
        Start with repetitive work your team can check: sorting enquiries, reading documents or drafting a reply.
        These five workflows show where AI can help, what can go wrong and where a person needs to stay involved.
        Judge the saving on your own work, including the time spent reviewing the output.
      </p>

      <H2 id="good-fit">What makes a task a good fit</H2>
      <p>Before choosing a tool, score the task. Four questions do most of the work:</p>
      <Compare
        caption="Scoring a task for automation"
        head={["Question", "Good fit", "Poor fit"]}
        rows={[
          ["How often does it happen?", "Many times a week", "A few times a year"],
          ["Does it follow rules you could write down?", "Mostly", "It’s judgement every time"],
          ["Can a person check the result quickly?", "In seconds", "Only by redoing the work"],
          ["What’s the harm if it’s wrong?", "Small, and caught before it matters", "Serious, or seen by a customer first"],
        ]}
      />
      <p>
        A task that scores well on all four is a candidate. A task where a mistake would be serious can still be
        automated, but only with a person approving every result, and sometimes that removes most of the saving.
      </p>
      <Figure caption="The pattern behind all five: the machine does the reading and the first draft; a person approves what matters.">
        <Flow
          steps={[
            { t: "Arrives", b: "An email, a document, a call, a question." },
            { t: "Read and sorted", b: "Key details pulled out; the kind of request named." },
            { t: "Checked against your rules", b: "What you allow, what needs a person.", alt: "Unsure or sensitive → straight to a person" },
            { t: "Drafted", b: "A reply, a record, an answer, in your words." },
            { t: "Approved", b: "A person reviews before anything goes out.", person: true },
          ]}
        />
      </Figure>

      <H2 id="enquiries">1. Sorting enquiries and drafting replies</H2>
      <Parts
        does="Reads each incoming enquiry, pulls out who it’s from and what they want, marks how urgent it is, and drafts a reply from your own approved answers, for example offering the next available times."
        person="Someone reads every draft before it’s sent, edits it if needed, and approves it. Anything outside the rules (a complaint, a sensitive situation) is handed straight to a person with no draft at all."
        wrong="A misread request gets a confident but wrong draft; an urgent message is marked routine. Both are why a person approves, and why the rules for 'hand this to a person' are written first."
        need="A set of real past enquiries to test on, your standard answers, and a clear list of what must always go to a person."
      />

      <H2 id="documents">2. Reading details out of documents</H2>
      <Parts
        does="Takes invoices, forms, applications or delivery notes and pulls out the details you need (names, dates, amounts, reference numbers) into your system."
        person="A person checks anything the system is unsure of, and spot-checks a sample of the rest. Totals are cross-checked automatically against the document."
        wrong="A smudged scan or an unusual layout produces a wrong number that looks right. Checks on totals and a review queue for low-confidence results catch most of these."
        need="A collection of real documents of each type, the fields you need, and where each should go."
      />

      <H2 id="calls">3. Call notes into the CRM</H2>
      <Parts
        does="Turns a call recording or rough notes into a tidy summary, the agreed next steps and follow-up dates, saved against the right contact."
        person="The person who took the call checks the summary while it’s fresh, before it’s saved."
        wrong="A summary drops a detail that mattered, or invents a commitment nobody made. Keeping the summary short and asking the caller to confirm it is the protection."
        need="Your CRM’s fields, a summary format your team likes, and, if calls are recorded, telling callers so at the start of the call."
      />

      <H2 id="assistant">4. A website assistant that answers from approved information</H2>
      <Parts
        does="Answers visitors’ questions on your website (opening hours, what’s included, how to prepare, how to book) using only information you have written and approved, and hands over to a person when it can’t."
        person="Your team writes and owns the approved information, reviews conversations regularly, and receives every hand-over."
        wrong="An assistant that answers beyond what it was given can state things that aren’t true. It should say plainly when it doesn’t know, never give advice it isn’t qualified to give, and always offer a person."
        need="The questions customers actually ask, your answers to them, and a decision on what it must never answer."
      />
      <Callout title="It should say it’s an assistant">
        <p>
          People should be able to tell they are talking to software, and how to reach a person. Where a generative AI
          tool is likely to affect customers and their personal information, the Privacy Commissioner expects them to be
          told how, when and why it is used, in plain language, before their information is collected.
          <Cite n={1} />
        </p>
      </Callout>
      <p>
        Deciding whether your website needs one at all, and what it must never say, has its own guide:{" "}
        <a href={PAGES.article("website-chat-assistant")}>should our website have a chat assistant?</a>
      </p>

      <H2 id="search">5. Searching your own documents</H2>
      <Parts
        does="Lets your team ask questions of your own policies, procedures, past proposals or product information in plain language, and get an answer that points to the document it came from."
        person="The person asking reads the source before relying on the answer."
        wrong="Out-of-date documents give out-of-date answers, and staff can see documents they shouldn’t if access isn’t carried across. Keep the collection current and respect each document’s permissions."
        need="A tidy, current set of documents, and a clear rule on who may see what."
      />

      <H2 id="not-for">What it shouldn’t do</H2>
      <p>
        Just as important as choosing the work to automate is deciding, in writing, what an automation must never do on
        its own. For most small and medium businesses that list includes:
      </p>
      <ul>
        <li>
          <strong>Decisions about people:</strong> hiring, credit, refunds outside policy, anything that changes how a
          customer or employee is treated.
        </li>
        <li>
          <strong>Advice that needs a qualified person:</strong> medical, legal, financial or safety advice, even when the
          question looks simple. The assistant’s job is to recognise the question and hand it over.
        </li>
        <li>
          <strong>Anything that can’t be undone</strong> (payments, deletions, messages to many people at once)
          without a person approving that specific action.
        </li>
        <li>
          <strong>Speaking for you on something new.</strong> An answer it hasn’t been given is an answer it should
          say it doesn’t have.
        </li>
      </ul>
      <p>
        Writing this list first makes the rest easier: the rules for handing over to a person come straight from it, and
        it is the first thing to test in a pilot.
      </p>

      <H2 id="privacy">The privacy part</H2>
      <p>
        The <Term id="privacy-act">Privacy Act 2020</Term> applies to AI tools as it does to everything else. The Office of the Privacy Commissioner has
        set out what it expects of businesses using generative AI:
        <Cite n={1} />
      </p>
      <Steps
        items={[
          { t: "Senior leadership approval", b: <p>Leadership has fully considered the risks and how they’re handled, and explicitly approved the tool’s use.</p> },
          { t: "Necessary and proportionate", b: <p>Review whether using a generative AI tool is necessary, or whether another approach would do.</p> },
          { t: "A privacy impact assessment", b: <p>Done before the tool is used, to find and reduce the risks.</p> },
          { t: "Transparency", b: <p>Where customers are affected, tell them how, when and why the tool is used, and how the privacy risks are handled.</p> },
          { t: "Engage with Māori", b: <p>About the tool’s potential impacts on their communities and taonga, including information.</p> },
          { t: "Accuracy and access", b: <p>Take reasonable steps to make sure personal information is accurate before it is used, and have a way to respond when people ask to see or correct theirs.</p> },
          { t: "Human review before acting", b: <p>A person reviews the output before the business acts on it.</p> },
          { t: "Nothing retained or disclosed", b: <p>Don’t put personal or confidential information into a tool unless it is explicitly confirmed the provider won’t keep or disclose it.</p> },
        ]}
      />
      <p>Two more points are easy to miss:</p>
      <ul>
        <li>
          <strong>Where the information goes.</strong> Many AI services process data outside New Zealand. Information
          privacy principle 12 limits disclosing personal information to someone overseas unless one of a set of
          conditions applies: for example, that the recipient is subject to comparable privacy safeguards, or that the
          person has authorised it after being told it may not be protected in the same way.
          <Cite n={2} /> But a provider that only stores or processes information for you isn’t receiving a disclosure:
          the law treats you as still holding the information, and you stay fully responsible for it. It can become a
          disclosure (one that principle 11 must allow, and principle 12 too if the provider is overseas) when the
          provider uses the information for its own purposes, such as training its AI.
          <Cite n={3} /> So ask each provider whether it uses your data for itself, where it processes and stores it,
          and what its terms say about keeping it, and take advice if you’re unsure which rules apply.
        </li>
        <li>
          <strong>If something goes wrong.</strong> If a privacy breach has caused, or might cause, serious harm, the
          Privacy Act requires you to notify the Commissioner, ideally within 72 hours of becoming aware of it, even while
          you are still investigating, and to tell the people affected as soon as you can, unless an exception applies.
          <Cite n={4} /> If your provider has the breach, the clock starts when the provider knows about it, not when it
          tells you.
          <Cite n={3} /> An automation that sends a reply to the wrong person is a breach like any other.
        </li>
      </ul>

      <H2 id="costs">What it costs</H2>
      <p>AI automation has two kinds of cost, and quotes should show both:</p>
      <ul>
        <li>
          <strong>Building it.</strong> Designing the workflow, writing the rules and the approved answers, connecting it
          to your systems, testing it on your real material, and training your team.
        </li>
        <li>
          <strong>Running it.</strong> Most AI services charge by how much they process, so the monthly cost rises and
          falls with your volume. A good build estimates it from your real numbers and sets limits and alerts so a busy
          month never becomes a surprise.
        </li>
      </ul>

      <H2 id="start">How to start</H2>
      <p>
        Pick one workflow that scored well, and run a pilot on past material before anything touches a customer. Take a
        few weeks of real enquiries or documents, run them through, and compare what the system produced with what your
        team actually did. Count how often it was right, how often it handed over correctly, and how long checking took.
        If the results hold up, run it live with a person approving everything; relax that only where the record shows
        it’s safe.
      </p>
      <p>
        You can see the shape of the first workflow in our{" "}
        <a href={PAGES.project("enquiry-desk")}>Pellow demonstration</a>: a fictional clinic’s inbox, where each
        email is read and organised, the diary checked, and a reply drafted in the clinic’s words and approved by a
        person. The message that mentions chest symptoms is handed straight to a person, with no draft at all. The
        clinic and its emails are invented, and nothing is sent.
      </p>
      <H2 id="yours">How we’d look at yours</H2>
      <p>
        Our <a href={PAGES.service("ai-automation")}>AI automation service</a> starts with a task and a way to test it
        on your own material. Tell us about the repeated work in your team for the free audit. We’ll suggest a
        workflow worth investigating, or explain why a simpler change would do more.
      </p>
    </>
  );
}
