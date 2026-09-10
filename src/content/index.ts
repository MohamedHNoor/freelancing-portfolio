import {
  CASE_STUDY_HEADINGS,
  type Profile,
  type ProfileLinks,
  type Project,
  type Role,
  type Service,
  type ServiceSlug,
  type Skill,
  type SkillGroup,
} from "@/types/content";
import { assertDeployable } from "@/lib/deploy-readiness";
import { roles } from "./experience";
import { profile } from "./profile";
import { projects } from "./projects";
import { services } from "./services";
import { skillGroups } from "./skills";

export type ProfileLinkKey = keyof ProfileLinks;

export type ProfileLink = {
  key: ProfileLinkKey;
  href: string;
};

export type AdjacentProjects = {
  previous?: Project;
  next?: Project;
};

/** What the invariant check reads. Taken as a parameter rather than closed over
 *  so the failure cases are testable with deliberately broken content. */
export type ContentInput = {
  profile: Profile;
  services: readonly Service[];
  projects: readonly Project[];
  roles: readonly Role[];
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Explicit rather than derived from Object.keys, so the render order of the
 *  links is stable and does not depend on object literal order. */
const PROFILE_LINK_KEYS = [
  "email",
  "github",
  "linkedin",
  "cv",
] as const satisfies readonly ProfileLinkKey[];

/** Newest first. Equal start months keep their array order, which a stable sort
 *  guarantees. Compared as strings because `YYYY-MM` sorts correctly that way
 *  and parsing to Date would introduce a timezone. */
export function sortRolesByStartDesc(input: readonly Role[]): readonly Role[] {
  return [...input].sort((a, b) => {
    if (a.start < b.start) return 1;
    if (a.start > b.start) return -1;
    return 0;
  });
}

/** Throws on any content error. Called at module scope below, so a violation
 *  fails `npm run build` during static generation rather than rendering wrong. */
export function assertContentInvariants(content: ContentInput): void {
  const seenOrders = new Set<number>();
  for (const service of content.services) {
    if (seenOrders.has(service.order)) {
      throw new Error(
        `Content: service "${service.slug}" repeats order ${service.order}`,
      );
    }
    seenOrders.add(service.order);
  }

  const serviceSlugs = new Set<ServiceSlug>(
    content.services.map((service) => service.slug),
  );

  const seenSlugs = new Set<string>();
  for (const project of content.projects) {
    if (!SLUG_PATTERN.test(project.slug)) {
      throw new Error(
        `Content: project slug "${project.slug}" is not lowercase kebab-case`,
      );
    }
    if (seenSlugs.has(project.slug)) {
      throw new Error(`Content: duplicate project slug "${project.slug}"`);
    }
    seenSlugs.add(project.slug);

    if (!serviceSlugs.has(project.category)) {
      throw new Error(
        `Content: project "${project.slug}" has category "${project.category}" with no matching service`,
      );
    }

    const headings = project.caseStudy.map((section) => section.heading);
    const matchesCanonicalOrder =
      headings.length === CASE_STUDY_HEADINGS.length &&
      headings.every((heading, index) => heading === CASE_STUDY_HEADINGS[index]);
    if (!matchesCanonicalOrder) {
      throw new Error(
        `Content: project "${project.slug}" must carry the case study headings ${CASE_STUDY_HEADINGS.join(", ")} in that order, but has ${headings.join(", ") || "none"}`,
      );
    }

    for (const metric of project.metrics) {
      if (metric.evidence.trim() === "") {
        throw new Error(
          `Content: metric "${metric.label}" on project "${project.slug}" has no evidence`,
        );
      }
    }
  }

  for (const point of content.profile.proofPoints) {
    if (point.evidence.trim() === "") {
      throw new Error(`Content: proof point "${point.label}" has no evidence`);
    }
  }

  for (const role of content.roles) {
    if (!YEAR_MONTH_PATTERN.test(role.start)) {
      throw new Error(
        `Content: role "${role.id}" has start "${role.start}", expected YYYY-MM`,
      );
    }
    if (role.end !== "present" && !YEAR_MONTH_PATTERN.test(role.end)) {
      throw new Error(
        `Content: role "${role.id}" has end "${role.end}", expected YYYY-MM or "present"`,
      );
    }
  }
}

assertContentInvariants({ profile, services, projects, roles });

/* The production deploy gate, beside the content invariants because it is the
   same kind of rule: content that must never reach a build. This one is scoped
   to `VERCEL_ENV === "production"`, so local builds and Vercel previews are
   untouched and only a real deploy is refused. Run `npm run preflight` to ask
   the same question locally. */
assertDeployable({ projects, env: { VERCEL_ENV: process.env.VERCEL_ENV } });

const orderedServices: readonly Service[] = [...services].sort(
  (a, b) => a.order - b.order,
);
const orderedRoles = sortRolesByStartDesc(roles);

export function getProfile(): Profile {
  return profile;
}

/** Only the links actually supplied. An empty string means "not supplied", so
 *  consumers render nothing rather than a link that goes nowhere. */
export function getProfileLinks(): readonly ProfileLink[] {
  return PROFILE_LINK_KEYS.filter((key) => profile.links[key] !== "").map(
    (key) => ({ key, href: profile.links[key] }),
  );
}

export function getServices(): readonly Service[] {
  return orderedServices;
}

export function getServiceBySlug(slug: string): Service | undefined {
  return orderedServices.find((service) => service.slug === slug);
}

export function getSkillGroups(): readonly SkillGroup[] {
  return skillGroups;
}

export function getRoles(): readonly Role[] {
  return orderedRoles;
}

export function getProjects(): readonly Project[] {
  return projects;
}

export function getFeaturedProjects(): readonly Project[] {
  return projects.filter((project) => project.featured);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getProjectSlugs(): readonly string[] {
  return projects.map((project) => project.slug);
}

/** No wraparound: the ends genuinely have no neighbour. An unknown slug yields
 *  neither, so a caller can treat it the same as a missing project. */
export function getAdjacentProjects(slug: string): AdjacentProjects {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) {
    return {};
  }
  return {
    previous: index > 0 ? projects[index - 1] : undefined,
    next: index < projects.length - 1 ? projects[index + 1] : undefined,
  };
}

/* Groups whose skills are technologies someone scans a stack row for.
   Practices belong in the skills section, not in a row read in two seconds. */
const TECHNOLOGY_GROUP_IDS: readonly string[] = [
  "front-end",
  "back-end",
  "data",
  "tooling",
];

/** Deduplicated skills by name, first occurrence wins, in first-appearance
 *  order. Split out so the ordering and dedup rules are testable against
 *  fixtures rather than against seed content that will be replaced. */
export function uniqueSkills(groups: readonly SkillGroup[]): readonly Skill[] {
  const byName = new Map<string, Skill>();
  for (const group of groups) {
    for (const skill of group.skills) {
      if (!byName.has(skill.name)) {
        byName.set(skill.name, skill);
      }
    }
  }
  return [...byName.values()];
}

/** Branded technologies for the hero row, in content order. Entries without an
 *  `icon` are capabilities such as "REST APIs" rather than products with a
 *  logo; they belong in the skills section, not in a row of marks. */
export function getTechnologyMarks(limit?: number): readonly Skill[] {
  const all = uniqueSkills(
    skillGroups.filter((group) => TECHNOLOGY_GROUP_IDS.includes(group.id)),
  ).filter((skill) => skill.icon !== undefined);
  return typeof limit === "number" ? all.slice(0, limit) : all;
}

/** What feature 12's honesty gate asserts on before deploying. */
export function getPlaceholderProjects(): readonly Project[] {
  return projects.filter((project) => project.isPlaceholder);
}
