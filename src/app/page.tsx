import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { About } from "@/components/sections/About";
import { Audiences } from "@/components/sections/Audiences";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { Location } from "@/components/sections/Location";
import { Process } from "@/components/sections/Process";
import { Projects } from "@/components/sections/Projects";
import { Reasons } from "@/components/sections/Reasons";
import { Services } from "@/components/sections/Services";
import { Skills } from "@/components/sections/Skills";
import { ValuePoints } from "@/components/sections/ValuePoints";
import { getProfile, getProfileLinks, getServices } from "@/content";
import { toContactLink } from "@/lib/links";
import { routeMetadata } from "@/lib/seo";
import { SITE, SITE_URL } from "@/lib/site";
import { buildPersonJsonLd } from "@/lib/structured-data";

/* The title and description come from the root layout. The social card is
   declared here because `routeMetadata` gives the page its own `openGraph`,
   which replaces the layout's instead of merging into it: without these two
   fields the card would fall back to the search title. */
const route = routeMetadata("/", { ownImage: true });

export const metadata: Metadata = {
  ...route,
  openGraph: {
    ...route.openGraph,
    title: `${getProfile().name} | ${getProfile().role}`,
    description: SITE.shareDescription,
  },
};

/* Order follows the conversion path: what is on offer and for whom, then the
   work that proves it, then why and how, and one call to action at the end.
   Work sits above technology on purpose, because proof of delivery outranks a
   technology list for a buyer with no reviews to read. Each section is a
   summary that links to its own page. */
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
       fragment of sections gave it a candidate per section: arriving from
       `/projects` it settled on the credibility strip and smoothly scrolled
       past the hero, which is the one thing a first-time visitor must see.
       `/projects` never had the bug because it already returned a single root. */
    <div>
      {/* Describes the person this site is about. It sits on the home page
          because that is the page a search engine treats as the site's own. */}
      <JsonLd data={person} />
      <Hero />
      <ValuePoints />
      <Services />
      <Audiences />
      <Projects />
      <Reasons />
      <Process />
      <Skills />
      <About />
      <Location />
      <FinalCta />
    </div>
  );
}
