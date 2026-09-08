import { About } from "@/components/sections/About";
import { CredibilityStrip } from "@/components/sections/CredibilityStrip";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Services } from "@/components/sections/Services";
import { Skills } from "@/components/sections/Skills";

/* Order is fixed by the overview: hero, credibility strip, about, services,
   projects, skills, experience, contact. Projects sits above skills on purpose,
   because proof of delivery outranks a technology list for a buyer with no
   reviews to read. Contact arrives with feature 9. */
export default function Home() {
  return (
    <>
      <Hero />
      <CredibilityStrip />
      <About />
      <Services />
      <Projects />
      <Skills />
      <Experience />
    </>
  );
}
