import { Hero } from "@/components/hero/Hero";

export default function Home() {
  return (
    <main>
      <Hero />
      {/* Below-the-fold sections and the full "story" experience land in later passes. */}
    </main>
  );
}
