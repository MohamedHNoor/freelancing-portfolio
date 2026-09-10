import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { CredibilityStrip } from "@/components/sections/CredibilityStrip";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Services } from "@/components/sections/Services";
import { Skills } from "@/components/sections/Skills";
import { getProfile, getProfileLinks, getServices } from "@/content";
import { toContactLink } from "@/lib/links";
import { routeMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { buildPersonJsonLd } from "@/lib/structured-data";

/* Canonical and `og:url` only. The title, description and Open Graph defaults
   on the root layout already describe this page, so restating them here would
   be two places to keep in step. */
export const metadata: Metadata = {
  ...routeMetadata("/"),
};

/* Order is fixed by the overview: hero, credibility strip, about, services,
   projects, skills, experience, contact. Projects sits above skills on purpose,
   because proof of delivery outranks a technology list for a buyer with no
   reviews to read. */
export default function Home() {
  const person = buildPersonJsonLd({
    profile: getProfile(),
    links: getProfileLinks().map(toContactLink),
    services: getServices(),
    origin: SITE_URL,
  });

  return (
    /* One root element, not a fragment. On a client navigation Next picks the
       first DOM node of the changed segment as its scroll target, and a
       fragment of seven sections gave it seven candidates: arriving from
       `/projects` it settled on the credibility strip and smoothly scrolled
       past the hero, which is the one thing a first-time visitor must see.
       `/projects` never had the bug because it already returned a single root. */
    <div>
      {/* Describes the person this site is about. It sits on the home page
          because that is the page a search engine treats as the site's own. */}
      <JsonLd data={person} />
      <Hero />
      <CredibilityStrip />
      <About />
      <Services />
      <Projects />
      <Skills />
      <Experience />
      <Contact />
    </div>
  );
}
