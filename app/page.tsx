import { Experience } from "@/components/experience/Experience";
import { Chrome } from "@/components/chrome/Chrome";
import { Hero } from "@/components/chapters/Hero";
import { Statement } from "@/components/chapters/Statement";
import { Build } from "@/components/chapters/Build";
import { Work } from "@/components/chapters/Work";
import { Why } from "@/components/chapters/Why";
import { Process } from "@/components/chapters/Process";
import { Faq } from "@/components/chapters/Faq";
import { Audit, SiteFooter } from "@/components/chapters/Audit";
import { PageReveal } from "@/components/chapters/PageReveal";
import { StoryMode } from "@/components/story/StoryMode";

/**
 * The home page: the film's scenes (hero, statement, what we build, why,
 * let's talk) with the page's plain sections (work, how we work, questions)
 * sliding over it between them — lib/chapters.ts.
 */
export default function Home() {
  return (
    <Experience>
      <Chrome />
      <main id="main">
        <Hero />
        <Statement />
        <Build />
        <Work />
        <Why />
        <Process />
        <Faq />
        <Audit />
      </main>
      <SiteFooter />
      <PageReveal />
      <StoryMode />
    </Experience>
  );
}
