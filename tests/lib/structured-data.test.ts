import { describe, expect, it } from "vitest";
import type { ContactLink } from "@/lib/links";
import type { Profile, Project, Service } from "@/types/content";
import {
  buildBreadcrumbJsonLd,
  buildCreativeWorkJsonLd,
  buildPersonJsonLd,
  serializeJsonLd,
} from "@/lib/structured-data";

const ORIGIN = "https://example.com";

const profile = {
  name: "Ada Lovelace",
  role: "Full-Stack Web Developer",
  shortBio: "Builds things.",
} as unknown as Profile;

const services = [
  { slug: "figma-to-production", name: "Figma to Production" },
  { slug: "saas-development", name: "SaaS Development" },
] as unknown as readonly Service[];

const links: readonly ContactLink[] = [
  { key: "email", href: "mailto:ada@example.com", label: "ada@example.com" },
  { key: "github", href: "https://github.com/ada", label: "github.com/ada" },
  { key: "linkedin", href: "https://linkedin.com/in/ada", label: "linkedin.com/in/ada" },
];

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    slug: "records-platform",
    name: "Acme Health",
    title: "Records platform",
    summary: "A platform.",
    category: "saas-development",
    stack: ["Next.js", "Postgres"],
    isPlaceholder: false,
    ...overrides,
  } as unknown as Project;
}

describe("serializeJsonLd", () => {
  it("escapes every < so a string can never close the script element", () => {
    const output = serializeJsonLd({ name: "</script><img src=x onerror=alert(1)>" });
    expect(output).not.toContain("<");
    expect(output).toContain("\\u003c");
  });

  it("stays valid JSON after escaping", () => {
    const value = { name: "a < b", nested: { items: ["</script>"] } };
    expect(JSON.parse(serializeJsonLd(value))).toEqual(value);
  });
});

describe("buildPersonJsonLd", () => {
  const person = buildPersonJsonLd({ profile, links, services, origin: ORIGIN });

  it("describes the person at the site origin", () => {
    expect(person).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Ada Lovelace",
      url: "https://example.com",
      jobTitle: "Full-Stack Web Developer",
      description: "Builds things.",
    });
  });

  /* Locality and country only: what a local search matches on, and nothing a
     visitor could not already read on the page. */
  it("places the person in Wellington without a street address", () => {
    expect(person.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Wellington",
      addressCountry: "NZ",
    });
  });

  it("lists the services as knowsAbout", () => {
    expect(person.knowsAbout).toEqual(["Figma to Production", "SaaS Development"]);
  });

  it("puts only other-service profiles in sameAs", () => {
    expect(person.sameAs).toEqual([
      "https://github.com/ada",
      "https://linkedin.com/in/ada",
    ]);
  });

  it("emits the bare email address, not the mailto href", () => {
    expect(person.email).toBe("ada@example.com");
  });

  it("omits sameAs and email entirely when no link is supplied", () => {
    const bare = buildPersonJsonLd({ profile, links: [], services, origin: ORIGIN });
    expect(bare).not.toHaveProperty("sameAs");
    expect(bare).not.toHaveProperty("email");
  });

  it("drops a link the profile does not supply", () => {
    const onlyGithub = buildPersonJsonLd({
      profile,
      links: links.filter((link) => link.key === "github"),
      services,
      origin: ORIGIN,
    });
    expect(onlyGithub.sameAs).toEqual(["https://github.com/ada"]);
  });
});

describe("buildCreativeWorkJsonLd", () => {
  it("describes a real project at its own URL", () => {
    expect(
      buildCreativeWorkJsonLd({
        project: makeProject(),
        categoryLabel: "SaaS Development",
        origin: ORIGIN,
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: "Acme Health: Records platform",
      description: "A platform.",
      url: "https://example.com/projects/records-platform",
      about: "SaaS Development",
      keywords: ["Next.js", "Postgres"],
    });
  });

  /* The honesty rule. A seeded project is fictional, and schema.org has no way
     to say so that a consumer respects. */
  it("emits nothing for a placeholder project", () => {
    expect(
      buildCreativeWorkJsonLd({
        project: makeProject({ isPlaceholder: true }),
        categoryLabel: "SaaS Development",
        origin: ORIGIN,
      }),
    ).toBeUndefined();
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("walks home, work, then the case study", () => {
    expect(
      buildBreadcrumbJsonLd({ project: makeProject(), origin: ORIGIN }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://example.com" },
        {
          "@type": "ListItem",
          position: 2,
          name: "Work",
          item: "https://example.com/projects",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Acme Health: Records platform",
          item: "https://example.com/projects/records-platform",
        },
      ],
    });
  });

  /* The path to the page is true whatever the page says about itself. */
  it("still describes the path for a placeholder project", () => {
    const crumbs = buildBreadcrumbJsonLd({
      project: makeProject({ isPlaceholder: true }),
      origin: ORIGIN,
    });
    expect(crumbs.itemListElement).toHaveLength(3);
  });
});
