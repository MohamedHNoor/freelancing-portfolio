import { About } from "@/components/sections/About";
import { CredibilityStrip } from "@/components/sections/CredibilityStrip";
import { Hero } from "@/components/sections/Hero";

/* Order is fixed by the overview: hero, credibility strip, about. Sections for
   services, projects, skills, experience, and contact arrive with features 4
   to 9 and slot in below. */
export default function Home() {
  return (
    <>
      <Hero />
      <CredibilityStrip />
      <About />
    </>
  );
}
