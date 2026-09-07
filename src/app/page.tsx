import { About } from "@/components/sections/About";
import { CredibilityStrip } from "@/components/sections/CredibilityStrip";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";

/* Order is fixed by the overview: hero, credibility strip, about, services.
   Sections for projects, skills, experience, and contact arrive with features 5
   to 9 and slot in below. */
export default function Home() {
  return (
    <>
      <Hero />
      <CredibilityStrip />
      <About />
      <Services />
    </>
  );
}
