import { describe, expect, it } from "vitest";
import {
  filterProjects,
  getCategoryFacets,
  getStackFacets,
  toProjectCardData,
  type ProjectCardData,
} from "@/lib/projects";
import type { Project, Service, ServiceSlug } from "@/types/content";

/* Fixtures rather than seed content: every project in `src/content/projects.ts`
   is placeholder data the user is going to replace, so a test written against
   it would break for a content edit rather than for a logic change. */

const SERVICES: readonly Service[] = [
  {
    slug: "figma-to-nextjs",
    name: "Figma to production Next.js",
    forWho: "",
    summary: "",
    deliverables: [],
    typicalTimeline: "",
    process: [],
    order: 1,
  },
  {
    slug: "saas-platforms",
    name: "Healthcare and fintech platforms",
    forWho: "",
    summary: "",
    deliverables: [],
    typicalTimeline: "",
    process: [],
    order: 2,
  },
];

const BASE_PROJECT: Project = {
  slug: "base",
  title: "A title",
  summary: "A summary",
  role: "Sole developer",
  period: "2025",
  category: "figma-to-nextjs",
  stack: ["Next.js"],
  featured: true,
  isPlaceholder: false,
  links: {},
  metrics: [],
  cover: { src: "/cover.png", alt: "", width: 1200, height: 750 },
  caseStudy: [],
};

const BASE_CARD: ProjectCardData = {
  slug: "base",
  title: "A title",
  summary: "A summary",
  role: "Sole developer",
  period: "2025",
  category: "figma-to-nextjs",
  categoryLabel: "Figma to production Next.js",
  stack: ["Next.js"],
  isPlaceholder: false,
  cover: { src: "/cover.png", alt: "", width: 1200, height: 750 },
  metrics: [],
};

describe("toProjectCardData", () => {
  it("carries every field the card renders", () => {
    const project: Project = {
      ...BASE_PROJECT,
      slug: "records-platform",
      title: "Clinician-facing records platform",
      summary: "Role-aware interfaces.",
      role: "Front end and API",
      period: "2024 to 2025",
      category: "saas-platforms",
      stack: ["React", "PostgreSQL"],
      isPlaceholder: true,
      metrics: [{ label: "Audit coverage", value: "Every read", evidence: "Append-only log" }],
      cover: { src: "/projects/records.png", alt: "A screenshot", width: 1200, height: 750 },
    };

    expect(toProjectCardData(project, SERVICES)).toEqual({
      slug: "records-platform",
      title: "Clinician-facing records platform",
      summary: "Role-aware interfaces.",
      role: "Front end and API",
      period: "2024 to 2025",
      category: "saas-platforms",
      categoryLabel: "Healthcare and fintech platforms",
      stack: ["React", "PostgreSQL"],
      isPlaceholder: true,
      cover: { src: "/projects/records.png", alt: "A screenshot", width: 1200, height: 750 },
      metrics: [{ label: "Audit coverage", value: "Every read", evidence: "Append-only log" }],
    });
  });

  it("omits the case study and the links", () => {
    const project: Project = {
      ...BASE_PROJECT,
      links: { live: "https://example.com", repo: "https://example.com/repo" },
      caseStudy: [{ heading: "Problem", body: ["Something went wrong."] }],
    };

    const card = toProjectCardData(project, SERVICES);

    expect(card).not.toHaveProperty("caseStudy");
    expect(card).not.toHaveProperty("links");
  });

  it("resolves the category label from the matching service", () => {
    const card = toProjectCardData(
      { ...BASE_PROJECT, category: "figma-to-nextjs" },
      SERVICES,
    );

    expect(card.categoryLabel).toBe("Figma to production Next.js");
  });

  it("throws naming the project and the category when no service matches", () => {
    const project: Project = {
      ...BASE_PROJECT,
      slug: "orphan",
      category: "no-such-track" as ServiceSlug,
    };

    expect(() => toProjectCardData(project, SERVICES)).toThrow(RangeError);
    expect(() => toProjectCardData(project, SERVICES)).toThrow(/orphan/);
    expect(() => toProjectCardData(project, SERVICES)).toThrow(/no-such-track/);
  });
});

describe("getCategoryFacets", () => {
  it("returns a repeated category only once", () => {
    const facets = getCategoryFacets([
      { ...BASE_CARD, slug: "a", category: "saas-platforms", categoryLabel: "Platforms" },
      { ...BASE_CARD, slug: "b", category: "saas-platforms", categoryLabel: "Platforms" },
    ]);

    expect(facets).toEqual([{ slug: "saas-platforms", label: "Platforms" }]);
  });

  it("keeps first-appearance order rather than sorting", () => {
    const facets = getCategoryFacets([
      { ...BASE_CARD, slug: "a", category: "saas-platforms", categoryLabel: "Platforms" },
      { ...BASE_CARD, slug: "b", category: "figma-to-nextjs", categoryLabel: "Figma" },
      { ...BASE_CARD, slug: "c", category: "saas-platforms", categoryLabel: "Platforms" },
    ]);

    expect(facets).toEqual([
      { slug: "saas-platforms", label: "Platforms" },
      { slug: "figma-to-nextjs", label: "Figma" },
    ]);
  });

  it("returns an empty list for no cards", () => {
    expect(getCategoryFacets([])).toEqual([]);
  });
});

describe("getStackFacets", () => {
  it("deduplicates across projects", () => {
    const facets = getStackFacets([
      { ...BASE_CARD, slug: "a", stack: ["React", "Next.js"] },
      { ...BASE_CARD, slug: "b", stack: ["React", "Node.js"] },
    ]);

    expect(facets).toEqual(["Next.js", "Node.js", "React"]);
  });

  it("orders by code unit, not by locale", () => {
    /* `localeCompare` would put "eslint" before "Zod" and "Tailwind CSS" after
       "TypeScript" in most locales. Code unit order is the same everywhere,
       which is the whole point of not using Intl here. */
    const facets = getStackFacets([
      {
        ...BASE_CARD,
        slug: "a",
        stack: ["TypeScript", "eslint", "Tailwind CSS", "Zod"],
      },
    ]);

    expect(facets).toEqual(["Tailwind CSS", "TypeScript", "Zod", "eslint"]);
  });

  it("preserves the exact strings with no case folding", () => {
    const facets = getStackFacets([
      { ...BASE_CARD, slug: "a", stack: ["PostgreSQL", "postgresql"] },
    ]);

    expect(facets).toEqual(["PostgreSQL", "postgresql"]);
  });

  it("returns an empty list for no cards", () => {
    expect(getStackFacets([])).toEqual([]);
  });
});

describe("filterProjects", () => {
  const cards: readonly ProjectCardData[] = [
    { ...BASE_CARD, slug: "figma-site", category: "figma-to-nextjs", stack: ["Next.js", "Vercel"] },
    { ...BASE_CARD, slug: "health", category: "saas-platforms", stack: ["React", "PostgreSQL"] },
    { ...BASE_CARD, slug: "finance", category: "saas-platforms", stack: ["Node.js", "PostgreSQL"] },
  ];

  const slugs = (result: readonly ProjectCardData[]) =>
    result.map((card) => card.slug);

  it("returns everything in input order when no filter is set", () => {
    const result = filterProjects(cards, { category: null, stack: null });

    expect(slugs(result)).toEqual(["figma-site", "health", "finance"]);
  });

  it("filters by category alone", () => {
    const result = filterProjects(cards, { category: "saas-platforms", stack: null });

    expect(slugs(result)).toEqual(["health", "finance"]);
  });

  it("filters by stack entry alone", () => {
    const result = filterProjects(cards, { category: null, stack: "PostgreSQL" });

    expect(slugs(result)).toEqual(["health", "finance"]);
  });

  it("applies both filters together as an AND", () => {
    const result = filterProjects(cards, {
      category: "saas-platforms",
      stack: "Node.js",
    });

    expect(slugs(result)).toEqual(["finance"]);
  });

  it("returns an empty array for a combination nothing matches", () => {
    const result = filterProjects(cards, {
      category: "figma-to-nextjs",
      stack: "PostgreSQL",
    });

    expect(result).toEqual([]);
  });

  it("returns an empty array for an unknown category", () => {
    const result = filterProjects(cards, {
      category: "no-such-track" as ServiceSlug,
      stack: null,
    });

    expect(result).toEqual([]);
  });

  it("returns an empty array for an unknown stack entry", () => {
    const result = filterProjects(cards, { category: null, stack: "COBOL" });

    expect(result).toEqual([]);
  });

  it("does not mutate its input", () => {
    const before = JSON.stringify(cards);

    filterProjects(cards, { category: "saas-platforms", stack: "PostgreSQL" });

    expect(JSON.stringify(cards)).toBe(before);
  });
});
