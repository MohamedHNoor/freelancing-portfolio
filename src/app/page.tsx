import { About } from "@/components/sections/About";
import { CredibilityStrip } from "@/components/sections/CredibilityStrip";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Skills } from "@/components/sections/Skills";

/* Order is fixed by the overview: hero, credibility strip, about, services,
   projects, skills, experience, contact. Projects does not exist yet, so feature
   6 inserts it between Services and Skills rather than appending it. Contact
   arrives with feature 9. */
export default function Home() {
  return (
    <>
      <Hero />
      <CredibilityStrip />
      <About />
      <Services />
      <Skills />
      <Experience />
    </>
  );
}
