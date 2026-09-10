import type { ContactLink } from "@/lib/links";
import type { Profile, Project, Service } from "@/types/content";
import { joinSiteUrl } from "@/lib/site";

/** A JSON-LD document, loose on purpose: schema.org vocabularies are open and
 *  each builder below decides its own shape. */
export type JsonLd = Record<string, unknown>;

const SCHEMA_CONTEXT = "https://schema.org";

/** Serializes a JSON-LD document for embedding in a `<script>` element.
 *
 *  The `<` escape is the whole point and is not optional. Without it any string
 *  that reached this document containing `</script>` would close the element
 *  early and everything after it would be parsed as markup. The content here is
 *  authored in this repository rather than submitted by a visitor, but the rule
 *  is about the sink, not the source: this is the one place the site injects
 *  strings into a script element, and the day someone pastes a client quote into
 *  `projects.ts` the escaping has to already be there. `<` is what the
 *  Next.js docs prescribe, and it is still valid JSON. */
export function serializeJsonLd(value: JsonLd): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export type PersonInput = {
  profile: Profile;
  /** Already normalized through `toContactLink`, so each href carries a scheme
   *  and every unsupplied link has been dropped. */
  links: readonly ContactLink[];
  services: readonly Service[];
  origin: string;
};

/** Who this site is about.
 *
 *  Only facts the site already states in public. `sameAs` is limited to profiles
 *  on other services, which is what the property means; `cv` is a file and
 *  `email` has its own property. */
export function buildPersonJsonLd({
  profile,
  links,
  services,
  origin,
}: PersonInput): JsonLd {
  const sameAs = links
    .filter((link) => link.key === "github" || link.key === "linkedin")
    .map((link) => link.href);

  const email = links.find((link) => link.key === "email");

  const person: JsonLd = {
    "@context": SCHEMA_CONTEXT,
    "@type": "Person",
    name: profile.name,
    url: joinSiteUrl(origin, "/"),
    description: profile.shortBio,
    knowsAbout: services.map((service) => service.name),
  };

  /* Omitted rather than emitted empty. An empty `sameAs` array is a claim that
     there are no other profiles, which is different from not saying. */
  if (sameAs.length > 0) {
    person.sameAs = sameAs;
  }

  /* The bare address, not the `mailto:` href: `label` is what `toContactLink`
     strips the scheme from, and schema.org expects the address itself. */
  if (email !== undefined) {
    person.email = email.label;
  }

  return person;
}

export type CaseStudyInput = {
  project: Project;
  /** The matching service's name, resolved by the caller. */
  categoryLabel: string;
  origin: string;
};

/** The case study as a described work, or nothing when the project is seeded.
 *
 *  A placeholder project is fictional. The page says so in prose and carries the
 *  marker in its header, but structured data has no vocabulary for "this example
 *  is not real" that any consumer honours, so emitting a `CreativeWork` here
 *  would put a machine-readable claim of delivered work behind a page that
 *  spends a paragraph saying the opposite. Silence is the only honest option
 *  until the real projects land. */
export function buildCreativeWorkJsonLd({
  project,
  categoryLabel,
  origin,
}: CaseStudyInput): JsonLd | undefined {
  if (project.isPlaceholder) {
    return undefined;
  }

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    url: joinSiteUrl(origin, `/projects/${project.slug}`),
    about: categoryLabel,
    keywords: [...project.stack],
  };
}

export type BreadcrumbInput = {
  project: Project;
  origin: string;
};

/** Where the case study sits in the site.
 *
 *  Emitted for every project, placeholder or not: the path from the home page
 *  to this page is true whatever the page contains. */
export function buildBreadcrumbJsonLd({
  project,
  origin,
}: BreadcrumbInput): JsonLd {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Projects", path: "/projects" },
    { name: project.title, path: `/projects/${project.slug}` },
  ];

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: joinSiteUrl(origin, crumb.path),
    })),
  };
}
