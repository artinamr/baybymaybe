import { Experience } from "@/components/experience/Experience";
import { Chrome } from "@/components/chrome/Chrome";
import { Hero } from "@/components/chapters/Hero";
import { Cut } from "@/components/chapters/Cut";
import { Order } from "@/components/chapters/Order";
import { Current } from "@/components/chapters/Current";
import { Work } from "@/components/chapters/Work";
import { Method } from "@/components/chapters/Method";
import { Mark } from "@/components/chapters/Mark";

export default function Home() {
  return (
    <Experience>
      <Chrome />
      <main id="main">
        <Hero />
        <Cut />
        <Order />
        <Current />
        <Work />
        <Method />
        <Mark />
      </main>
    </Experience>
  );
}
