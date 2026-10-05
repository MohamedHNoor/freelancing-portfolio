import { describe, expect, it } from "vitest";
import {
  assertContentInvariants,
  getAdjacentProjects,
  getFeaturedProjects,
  getFeaturedSkillGroups,
  getPlaceholderProjects,
  getProfile,
  getProfileLinks,
  getProjectBySlug,
  getProjectSlugs,
  getProjects,
  getResumeDevelopment,
  getResumeExperience,
  getResumeProjects,
  getResumeSkillGroups,
  getRoles,
  getServiceBySlug,
  getServices,
  getSkillGroups,
  orderServices,
  getTechnologyMarks,
  pickSkills,
  sortRolesByStartDesc,
  type ContentInput,
  uniqueSkills,
} from "@/content";
import {
  CASE_STUDY_HEADINGS,
  type CaseStudySection,
  type Project,
  type Resume,
  type ResumeEntry,
  type Role,
  type Service,
  type SkillGroup,
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

const CANONICAL_CASE_STUDY: readonly CaseStudySection[] =
  CASE_STUDY_HEADINGS.map((heading) => ({ heading, body: [] }));

function project(overrides: Partial<Project> = {}): Project {
  return {
    slug: "fixture-project",
    name: "Fixture Co",
    title: "Fixture",
    summary: "",
    role: "",
    period: "",
    category: "figma-to-production",
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
    slug: "figma-to-production",
    name: "Fixture",
    summary: "",
    lists: [{ label: "Includes", items: ["A thing"] }],
    cta: "Start",
    enquiryType: "figma-to-nextjs",
    order: 1,
    ...overrides,
  };
}

function content(overrides: Partial<ContentInput> = {}): ContentInput {
  return {
    profile: {
      name: "Fixture",
      role: "",
      headline: "",
      headlineEmphasis: "",
      shortBio: "",
      primaryStack: [],
      longBio: [],
      availability: { status: "available", detail: "" },
      location: "",
      serviceArea: [],
      portrait: { src: "", alt: "", width: 1, height: 1 },
      heroShowcase: { src: "", alt: "", width: 1, height: 1 },
      links: { email: "", github: "", linkedin: "", cv: "" },
    },
    services: [service()],
    projects: [project()],
    roles: [role("a", "2024-01")],
    skillGroups: [
      {
        id: "frontend",
        label: "Frontend",
        skills: [{ name: "React", context: "" }],
      },
    ],
    resume: resume(),
    ...overrides,
  };
}

function resume(overrides: Partial<Resume> = {}): Resume {
  return {
    title: "",
    summary: "",
    experience: [],
    development: [],
    projects: [],
    ...overrides,
  };
}

function resumeEntry(overrides: Partial<ResumeEntry> = {}): ResumeEntry {
  return {
    roleId: "a",
    title: "Engineer",
    organisation: "Fixture",
    location: "",
    highlights: [],
    technologies: [],
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

describe("orderServices", () => {
  it("orders by the order field rather than array order", () => {
    const sorted = orderServices([
      service({ slug: "saas-development", order: 3 }),
      service({ slug: "business-websites", order: 1 }),
      service({ slug: "web-applications", order: 2 }),
    ]);
    // Explicit expected sequence, not re-derived with the same sort.
    expect(sorted.map((entry) => entry.slug)).toEqual([
      "business-websites",
      "web-applications",
      "saas-development",
    ]);
  });

  it("does not mutate its input", () => {
    const input = [
      service({ slug: "saas-development", order: 2 }),
      service({ slug: "business-websites", order: 1 }),
    ];
    orderServices(input);
    expect(input.map((entry) => entry.slug)).toEqual([
      "saas-development",
      "business-websites",
    ]);
  });
});

describe("getServices", () => {
  it("returns the shipped services in order", () => {
    expect(getServices()[0].slug).toBe("business-websites");
  });
});

describe("getServiceBySlug", () => {
  it("returns the matching service", () => {
    expect(getServiceBySlug("saas-development")?.slug).toBe("saas-development");
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

  it("accepts a headline emphasis that appears in the headline", () => {
    const base = content();
    expect(() =>
      assertContentInvariants({
        ...base,
        profile: { ...base.profile, headline: "Built for You", headlineEmphasis: "for You" },
      }),
    ).not.toThrow();
  });

  /* A phrase edited in one place and not the other would otherwise just stop
     being highlighted, with nothing to say why. */
  it("rejects a headline emphasis missing from the headline and names it", () => {
    const base = content();
    expect(() =>
      assertContentInvariants({
        ...base,
        profile: { ...base.profile, headline: "Built for You", headlineEmphasis: "for Them" },
      }),
    ).toThrow(/headline emphasis "for Them" does not appear/);
  });

  it("accepts a resume whose role, technology and project all resolve", () => {
    expect(() =>
      assertContentInvariants(
        content({
          resume: resume({
            experience: [resumeEntry({ technologies: ["React"] })],
            development: [resumeEntry()],
            projects: [
              {
                slug: "fixture-project",
                subtitle: "",
                description: "",
                highlights: [],
              },
            ],
          }),
        }),
      ),
    ).not.toThrow();
  });

  it("rejects a resume entry naming a role that does not exist", () => {
    expect(() =>
      assertContentInvariants(
        content({
          resume: resume({ development: [resumeEntry({ roleId: "ghost" })] }),
        }),
      ),
    ).toThrow(/names role "ghost", which does not exist/);
  });

  /* The rule that keeps the resume honest: it may only name a technology the
     site already has evidence for in skills.ts. */
  it("rejects a resume technology that is not in skills.ts", () => {
    expect(() =>
      assertContentInvariants(
        content({
          resume: resume({
            experience: [resumeEntry({ technologies: ["Kubernetes"] })],
          }),
        }),
      ),
    ).toThrow(/lists "Kubernetes", which is not in skills\.ts/);
  });

  it("rejects a resume project that does not exist", () => {
    expect(() =>
      assertContentInvariants(
        content({
          resume: resume({
            projects: [
              { slug: "missing", subtitle: "", description: "", highlights: [] },
            ],
          }),
        }),
      ),
    ).toThrow(/resume project "missing" does not exist/);
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
          services: [service({ slug: "figma-to-production" })],
          projects: [project({ category: "saas-development" })],
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
                { heading: "The Problem", body: [] },
                { heading: "Overview", body: [] },
                ...CANONICAL_CASE_STUDY.slice(2),
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
          projects: [project({ caseStudy: CANONICAL_CASE_STUDY.slice(0, 9) })],
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

  it("rejects a service that lists nothing it includes", () => {
    expect(() =>
      assertContentInvariants(
        content({
          services: [service({ lists: [{ label: "Includes", items: [] }] })],
        }),
      ),
    ).toThrow(/lists nothing it includes/);
  });

  it("rejects a duplicate service order", () => {
    expect(() =>
      assertContentInvariants(
        content({
          services: [
            service({ slug: "figma-to-production", order: 1 }),
            service({ slug: "saas-development", order: 1 }),
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
    // The mobile group is a technology group too, so its marks join the row.
    expect(names).toContain("React Native");
    expect(names).toContain("Expo");
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

describe("getFeaturedSkillGroups", () => {
  it("keeps only featured entries and drops groups left empty", () => {
    const groups = getFeaturedSkillGroups();
    expect(groups.length).toBeGreaterThan(0);
    for (const entry of groups) {
      expect(entry.skills.length).toBeGreaterThan(0);
      for (const skill of entry.skills) {
        expect("featured" in skill && skill.featured).toBe(true);
      }
    }
  });

  it("never features a practice, which is not a technology", () => {
    expect(getFeaturedSkillGroups().map((entry) => entry.id)).not.toContain(
      "practices",
    );
  });
});

describe("pickSkills", () => {
  const groups = [
    {
      id: "a",
      label: "A",
      skills: [
        { name: "Kept", context: "", resume: true },
        { name: "Dropped", context: "" },
      ],
    },
    { id: "b", label: "B", skills: [{ name: "Also dropped", context: "" }] },
  ];

  it("keeps only the skills the predicate accepts, in order", () => {
    expect(
      pickSkills(groups, (skill) => skill.resume === true)[0].skills.map(
        (skill) => skill.name,
      ),
    ).toEqual(["Kept"]);
  });

  it("drops a group the predicate leaves empty", () => {
    expect(
      pickSkills(groups, (skill) => skill.resume === true).map((group) => group.id),
    ).toEqual(["a"]);
  });
});

describe("getResumeSkillGroups", () => {
  it("keeps only resume entries and drops groups left empty", () => {
    const groups = getResumeSkillGroups();
    expect(groups.length).toBeGreaterThan(0);
    for (const entry of groups) {
      expect(entry.skills.length).toBeGreaterThan(0);
      for (const skill of entry.skills) {
        expect("resume" in skill && skill.resume).toBe(true);
      }
    }
  });

  it("leaves supporting tools off the resume", () => {
    const names = getResumeSkillGroups().flatMap((group) =>
      group.skills.map((skill) => skill.name),
    );
    for (const name of ["Webpack", "Vite", "Figma", "styled-components"]) {
      expect(names).not.toContain(name);
    }
  });
});

describe("resume entries", () => {
  it("takes each entry's dates from the role it names", () => {
    for (const entry of [...getResumeExperience(), ...getResumeDevelopment()]) {
      const role = getRoles().find((candidate) => candidate.id === entry.roleId);
      expect(role).toBeDefined();
      expect(entry.start).toBe(role?.start);
      expect(entry.end).toBe(role?.end);
    }
  });

  it("keeps training out of the experience list", () => {
    expect(getResumeExperience().map((entry) => entry.roleId)).not.toContain(
      "microverse",
    );
  });
});

describe("getResumeProjects", () => {
  it("joins each project's stack and case study path", () => {
    for (const entry of getResumeProjects()) {
      const project = getProjectBySlug(entry.slug);
      expect(project).toBeDefined();
      expect(entry.stack).toEqual(project?.stack);
      expect(entry.path).toBe(`/projects/${entry.slug}`);
    }
  });

  it("prints a name override when one is set, and the project's name otherwise", () => {
    const [travel, site] = getResumeProjects();
    expect(travel.name).toBe(getProjectBySlug("travelgrid-africa")?.name);
    expect(site.name).toBe("MohamedHNoor.com");
  });
});
