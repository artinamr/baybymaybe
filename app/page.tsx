import { Experience } from "@/components/experience/Experience";
import { Chrome } from "@/components/chrome/Chrome";
import { Hero } from "@/components/chapters/Hero";
import { Build } from "@/components/chapters/Build";
import { Why } from "@/components/chapters/Why";
import { Audit } from "@/components/chapters/Audit";
import { StoryMode } from "@/components/story/StoryMode";

export default function Home() {
  return (
    <Experience>
      <Chrome />
      <main id="main">
        <Hero />
        <Build />
        <Why />
        <Audit />
      </main>
      <StoryMode />
    </Experience>
  );
}
