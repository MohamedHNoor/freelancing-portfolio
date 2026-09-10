import { describe, expect, it } from "vitest";
import {
  assertContentInvariants,
  getAdjacentProjects,
  getFeaturedProjects,
  getPlaceholderProjects,
  getProfile,
  getProfileLinks,
  getProjectBySlug,
  getProjectSlugs,
  getProjects,
  getRoles,
  getServiceBySlug,
  getServices,
  getSkillGroups,
  getTechnologyMarks,
  sortRolesByStartDesc,
  type ContentInput,
  uniqueSkills,
} from "@/content";
import type {
  CaseStudySection,
  Project,
  Role,
  Service,
  SkillGroup,
} from "@/types/content";

/* Fixtures rather than seed content for anything order- or failure-related.
   The seeded projects are placeholders that will be replaced with real work, and
   assertions written against them would quietly change meaning when that
   happens. */

function role(id: string, start: string, end = "present"): Role {
  return {
    id,
    company: "Fixture",
    title: "Developer",
    start,
    end,
    summary: "",
    impact: [],
    stack: [],
  };
}

const CANONICAL_CASE_STUDY: readonly CaseStudySection[] = [
  { heading: "Problem", body: [] },
  { heading: "Approach", body: [] },
  { heading: "Architecture", body: [] },
  { heading: "Outcome", body: [] },
];

function project(overrides: Partial<Project> = {}): Project {
  return {
    slug: "fixture-project",
    title: "Fixture",
    summary: "",
    role: "",
    period: "",
    category: "figma-to-nextjs",
    stack: [],
    featured: false,
    isPlaceholder: true,
    links: {},
    metrics: [],
    cover: { src: "/projects/fixture.png", alt: "", width: 1200, height: 750 },
    caseStudy: CANONICAL_CASE_STUDY,
    ...overrides,
  };
}

function service(overrides: Partial<Service> = {}): Service {
  return {
    slug: "figma-to-nextjs",
    name: "Fixture",
    forWho: "",
    summary: "",
    deliverables: [],
    typicalTimeline: "",
    process: [],
    order: 1,
    ...overrides,
  };
}

function content(overrides: Partial<ContentInput> = {}): ContentInput {
  return {
    profile: {
      name: "Fixture",
      headline: "",
      specialisms: [],
      shortBio: "",
      closing: "",
      longBio: [],
      availability: { status: "available", detail: "" },
      location: "",
      links: { email: "", github: "", linkedin: "", cv: "" },
      proofPoints: [],
    },
    services: [service()],
    projects: [project()],
    roles: [role("a", "2024-01")],
    ...overrides,
  };
}

describe("getProjectBySlug", () => {
  it("returns the project for a seeded slug", () => {
    const [first] = getProjects();
    expect(getProjectBySlug(first.slug)).toBe(first);
  });

  it("returns undefined for an unknown slug without throwing", () => {
    expect(() => getProjectBySlug("no-such-project")).not.toThrow();
    expect(getProjectBySlug("no-such-project")).toBeUndefined();
  });
});

describe("getAdjacentProjects", () => {
  const slugs = getProjectSlugs();

  /* Position-based rather than a hand-picked middle entry. The previous version
     asserted the shipped list had at least three projects so index 1 had a
     neighbour on each side, which stopped being true when real work replaced the
     seeded three. This covers first, middle and last at any length. */
  it("matches array position for every shipped project", () => {
    expect(slugs.length).toBeGreaterThan(0);
    slugs.forEach((slug, index) => {
      const { previous, next } = getAdjacentProjects(slug);
      expect(previous?.slug).toBe(index === 0 ? undefined : slugs[index - 1]);
      expect(next?.slug).toBe(
        index === slugs.length - 1 ? undefined : slugs[index + 1],
      );
    });
  });

  it("has no previous at the first entry and does not wrap to the last", () => {
    const { previous, next } = getAdjacentProjects(slugs[0]);
    expect(previous).toBeUndefined();
    expect(next?.slug).toBe(slugs[1]);
  });

  it("has no next at the last entry and does not wrap to the first", () => {
    const { previous, next } = getAdjacentProjects(slugs[slugs.length - 1]);
    expect(next).toBeUndefined();
    expect(previous?.slug).toBe(slugs[slugs.length - 2]);
  });

  it("returns neither neighbour for an unknown slug without throwing", () => {
    expect(() => getAdjacentProjects("no-such-project")).not.toThrow();
    expect(getAdjacentProjects("no-such-project")).toEqual({});
  });
});

describe("sortRolesByStartDesc", () => {
  it("orders newest first", () => {
    const sorted = sortRolesByStartDesc([
      role("older", "2021-03"),
      role("newest", "2024-06"),
      role("middle", "2022-09"),
    ]);
    // Asserted as an explicit sequence, not re-derived with the same sort.
    expect(sorted.map((entry) => entry.id)).toEqual([
      "newest",
      "middle",
      "older",
    ]);
  });

  it("breaks an equal start month by array order", () => {
    const sorted = sortRolesByStartDesc([
      role("first-in-array", "2023-01"),
      role("second-in-array", "2023-01"),
      role("older", "2020-01"),
    ]);
    expect(sorted.map((entry) => entry.id)).toEqual([
      "first-in-array",
      "second-in-array",
      "older",
    ]);
  });

  it("does not mutate its input", () => {
    const input = [role("a", "2020-01"), role("b", "2024-01")];
    sortRolesByStartDesc(input);
    expect(input.map((entry) => entry.id)).toEqual(["a", "b"]);
  });
});

describe("getRoles", () => {
  it("returns the seeded roles newest first", () => {
    const starts = getRoles().map((entry) => entry.start);
    const descending = [...starts].sort().reverse();
    expect(starts).toEqual(descending);
  });
});

describe("getServices", () => {
  it("orders by the order field rather than array order", () => {
    // The seed file deliberately lists order 2 before order 1.
    expect(getServices().map((entry) => entry.order)).toEqual([1, 2]);
    expect(getServices()[0].slug).toBe("figma-to-nextjs");
  });
});

describe("getServiceBySlug", () => {
  it("returns the matching service", () => {
    expect(getServiceBySlug("saas-platforms")?.slug).toBe("saas-platforms");
  });

  it("returns undefined for an unknown slug without throwing", () => {
    expect(() => getServiceBySlug("nope")).not.toThrow();
    expect(getServiceBySlug("nope")).toBeUndefined();
  });
});

describe("getFeaturedProjects", () => {
  it("returns only featured projects, in the same relative order", () => {
    const featured = getFeaturedProjects();
    expect(featured.every((entry) => entry.featured)).toBe(true);
    const expected = getProjects()
      .filter((entry) => entry.featured)
      .map((entry) => entry.slug);
    expect(featured.map((entry) => entry.slug)).toEqual(expected);
  });
});

describe("getProfileLinks", () => {
  /* This asserted `[]` while every seeded link was an empty string, which made
     it a test of the placeholder content rather than of the function. Real
     links broke it. It now checks the contract: supplied links come back in a
     fixed order, unsupplied ones are dropped. */
  it("returns only the links that carry a value", () => {
    const links = getProfileLinks();
    for (const link of links) {
      expect(link.href).not.toBe("");
    }
  });

  it("keeps a stable order rather than object literal order", () => {
    const order = getProfileLinks().map((link) => link.key);
    const expected = ["email", "github", "linkedin", "cv"].filter((key) =>
      order.includes(key as (typeof order)[number]),
    );
    expect(order).toEqual(expected);
  });

  it("omits a key whose value is the empty string", () => {
    const keys = getProfileLinks().map((link) => link.key);
    const profile = getProfile();
    for (const key of ["email", "github", "linkedin", "cv"] as const) {
      if (profile.links[key] === "") {
        expect(keys).not.toContain(key);
      } else {
        expect(keys).toContain(key);
      }
    }
  });
});

describe("getPlaceholderProjects", () => {
  /* Asserts the helper's contract rather than a count, which is what the
     previous version did. A count only held while every shipped project was
     seeded, so it broke the moment real work landed. This holds either way. */
  it("returns exactly the projects flagged as seeded", () => {
    const flagged = getProjects().filter((project) => project.isPlaceholder);
    expect(getPlaceholderProjects()).toEqual(flagged);
  });
});

describe("assertContentInvariants", () => {
  it("accepts valid content", () => {
    expect(() => assertContentInvariants(content())).not.toThrow();
  });

  it("rejects a duplicate project slug and names it", () => {
    expect(() =>
      assertContentInvariants(
        content({ projects: [project({ slug: "twice" }), project({ slug: "twice" })] }),
      ),
    ).toThrow(/duplicate project slug "twice"/);
  });

  it("rejects a slug that is not lowercase kebab-case", () => {
    expect(() =>
      assertContentInvariants(content({ projects: [project({ slug: "Not Kebab" })] })),
    ).toThrow(/not lowercase kebab-case/);
  });

  it("rejects a category with no matching service", () => {
    expect(() =>
      assertContentInvariants(
        content({
          services: [service({ slug: "figma-to-nextjs" })],
          projects: [project({ category: "saas-platforms" })],
        }),
      ),
    ).toThrow(/no matching service/);
  });

  it("rejects case study headings in the wrong order", () => {
    expect(() =>
      assertContentInvariants(
        content({
          projects: [
            project({
              caseStudy: [
                { heading: "Approach", body: [] },
                { heading: "Problem", body: [] },
                { heading: "Architecture", body: [] },
                { heading: "Outcome", body: [] },
              ],
            }),
          ],
        }),
      ),
    ).toThrow(/in that order/);
  });

  it("rejects a missing case study heading", () => {
    expect(() =>
      assertContentInvariants(
        content({
          projects: [project({ caseStudy: [{ heading: "Problem", body: [] }] })],
        }),
      ),
    ).toThrow(/in that order/);
  });

  it("rejects a metric with no evidence", () => {
    expect(() =>
      assertContentInvariants(
        content({
          projects: [
            project({ metrics: [{ label: "Speed", value: "fast", evidence: "  " }] }),
          ],
        }),
      ),
    ).toThrow(/metric "Speed".*has no evidence/);
  });

  it("rejects a proof point with no evidence", () => {
    const base = content();
    expect(() =>
      assertContentInvariants({
        ...base,
        profile: {
          ...base.profile,
          proofPoints: [{ value: "100", label: "Score", evidence: "" }],
        },
      }),
    ).toThrow(/proof point "Score" has no evidence/);
  });

  it("rejects a duplicate service order", () => {
    expect(() =>
      assertContentInvariants(
        content({
          services: [
            service({ slug: "figma-to-nextjs", order: 1 }),
            service({ slug: "saas-platforms", order: 1 }),
          ],
        }),
      ),
    ).toThrow(/repeats order 1/);
  });

  it.each([
    ["2024-13", "a month out of range"],
    ["2024-1", "an unpadded month"],
    ["2024", "a year alone"],
    ["present", "the end sentinel used as a start"],
  ])("rejects role start %o (%s)", (start) => {
    expect(() =>
      assertContentInvariants(content({ roles: [role("bad", start)] })),
    ).toThrow(/expected YYYY-MM/);
  });

  it("accepts present as an end but not as anything else", () => {
    expect(() =>
      assertContentInvariants(content({ roles: [role("ok", "2024-01", "present")] })),
    ).not.toThrow();
    expect(() =>
      assertContentInvariants(content({ roles: [role("bad", "2024-01", "ongoing")] })),
    ).toThrow(/expected YYYY-MM or "present"/);
  });
});

function group(id: string, names: readonly string[]): SkillGroup {
  return {
    id,
    label: id,
    skills: names.map((name) => ({ name, context: "", icon: name.toLowerCase() })),
  };
}

describe("uniqueSkills", () => {
  it("deduplicates by name across groups, keeping first-appearance order", () => {
    const skills = uniqueSkills([
      group("a", ["React", "TypeScript"]),
      group("b", ["Node.js", "React"]),
      group("c", ["TypeScript", "Docker"]),
    ]);
    // Explicit expected sequence, not re-derived with the same logic.
    expect(skills.map((s) => s.name)).toEqual([
      "React",
      "TypeScript",
      "Node.js",
      "Docker",
    ]);
  });

  it("keeps the first occurrence when a name repeats", () => {
    const first = { name: "React", context: "first", icon: "react" };
    const second = { name: "React", context: "second", icon: "react" };
    const skills = uniqueSkills([
      { id: "a", label: "a", skills: [first] },
      { id: "b", label: "b", skills: [second] },
    ]);
    expect(skills).toHaveLength(1);
    expect(skills[0].context).toBe("first");
  });

  it("returns an empty list for no groups", () => {
    expect(uniqueSkills([])).toEqual([]);
  });
});

describe("getTechnologyMarks", () => {
  const marks = getTechnologyMarks();

  it("returns only skills that carry an icon", () => {
    expect(marks.length).toBeGreaterThan(0);
    for (const skill of marks) {
      expect(skill.icon).toBeTruthy();
    }
  });

  it("includes the branded technologies and excludes practices", () => {
    const names = marks.map((skill) => skill.name);
    expect(names).toContain("React");
    expect(names).toContain("Express.js");
    expect(names).toContain("PostgreSQL");
    expect(names).toContain("MongoDB");
    expect(names).toContain("Docker");
    // Capabilities have no logo, and practices are not technologies at all.
    expect(names).not.toContain("REST APIs");
    expect(names).not.toContain("Performance budgets");
  });

  it("contains no duplicate names", () => {
    const names = marks.map((skill) => skill.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("only lists skills a group actually declares", () => {
    const declared = new Set(
      getSkillGroups().flatMap((entry) => entry.skills.map((s) => s.name)),
    );
    for (const skill of marks) {
      expect(declared.has(skill.name)).toBe(true);
    }
  });

  it("truncates to the limit and keeps the leading order", () => {
    expect(getTechnologyMarks(4)).toEqual(marks.slice(0, 4));
  });
});
