import {
  CASE_STUDY_HEADINGS,
  type Point,
  type Profile,
  type ProfileLinks,
  type Project,
  type Resume,
  type ResumeEntry,
  type ResumeProject,
  type Role,
  type Service,
  type ServiceSlug,
  type Skill,
  type SkillGroup,
} from "@/types/content";
import { assertDeployable } from "@/lib/deploy-readiness";
import {
  audiences,
  milestones,
  processSteps,
  reasons,
  valuePoints,
} from "./approach";
import { roles } from "./experience";
import { profile } from "./profile";
import { projects } from "./projects";
import { resume } from "./resume";
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

/** A resume entry with the dates of the role it names. */
export type DatedResumeEntry = ResumeEntry & {
  start: string;
  end: string;
};

/** A resume project joined to its project: the name to print, the stack, and
 *  the case study path. */
export type ResumeProjectEntry = Omit<ResumeProject, "name"> & {
  name: string;
  stack: readonly string[];
  role: string;
  period: string;
  path: string;
  isPlaceholder: boolean;
};

/** What the invariant check reads. Taken as a parameter rather than closed over
 *  so the failure cases are testable with deliberately broken content. */
export type ContentInput = {
  profile: Profile;
  services: readonly Service[];
  projects: readonly Project[];
  roles: readonly Role[];
  skillGroups: readonly SkillGroup[];
  resume: Resume;
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
  const { headline, headlineEmphasis } = content.profile;
  if (headlineEmphasis !== "" && !headline.includes(headlineEmphasis)) {
    throw new Error(
      `Content: headline emphasis "${headlineEmphasis}" does not appear in the headline`,
    );
  }

  const seenOrders = new Set<number>();
  for (const service of content.services) {
    if (seenOrders.has(service.order)) {
      throw new Error(
        `Content: service "${service.slug}" repeats order ${service.order}`,
      );
    }
    seenOrders.add(service.order);

    const listed = service.lists.some((list) => list.items.length > 0);
    if (!listed) {
      throw new Error(
        `Content: service "${service.slug}" lists nothing it includes`,
      );
    }
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

  assertResumeReferences(content);
}

/* The resume restates the rest of the content layer for another reader, so
   every reference has to land: a role for the dates, a project for the stack,
   and a `skills.ts` entry for each technology, which is what stops the resume
   naming one the site has no evidence for. */
function assertResumeReferences(content: ContentInput): void {
  const roleIds = new Set(content.roles.map((role) => role.id));
  const projectSlugs = new Set(content.projects.map((project) => project.slug));
  const skillNames = new Set(
    content.skillGroups.flatMap((group) =>
      group.skills.map((skill) => skill.name),
    ),
  );

  for (const entry of [
    ...content.resume.experience,
    ...content.resume.development,
  ]) {
    if (!roleIds.has(entry.roleId)) {
      throw new Error(
        `Content: resume entry "${entry.title}" names role "${entry.roleId}", which does not exist`,
      );
    }
    for (const technology of entry.technologies) {
      if (!skillNames.has(technology)) {
        throw new Error(
          `Content: resume entry "${entry.title}" lists "${technology}", which is not in skills.ts`,
        );
      }
    }
  }

  for (const item of content.resume.projects) {
    if (!projectSlugs.has(item.slug)) {
      throw new Error(
        `Content: resume project "${item.slug}" does not exist`,
      );
    }
  }
}

assertContentInvariants({
  profile,
  services,
  projects,
  roles,
  skillGroups,
  resume,
});

/* The production deploy gate, beside the content invariants because it is the
   same kind of rule: content that must never reach a build. This one is scoped
   to `VERCEL_ENV === "production"`, so local builds and Vercel previews are
   untouched and only a real deploy is refused. Run `npm run preflight` to ask
   the same question locally. */
assertDeployable({ projects, env: { VERCEL_ENV: process.env.VERCEL_ENV } });

/** Services by their `order` field, never array order. Takes its input so the
 *  rule is testable against an out-of-order fixture. */
export function orderServices(input: readonly Service[]): readonly Service[] {
  return [...input].sort((a, b) => a.order - b.order);
}

const orderedServices = orderServices(services);
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
  "frontend",
  "backend",
  "database",
  "orm",
  "auth",
  "payments",
  "infrastructure",
  "mobile",
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

/** Each group cut down to the skills `keep` accepts, with groups left empty
 *  dropped. Takes its input so the rule is testable against fixtures. */
export function pickSkills(
  groups: readonly SkillGroup[],
  keep: (skill: Skill) => boolean,
): readonly SkillGroup[] {
  return groups
    .map((group) => ({ ...group, skills: group.skills.filter(keep) }))
    .filter((group) => group.skills.length > 0);
}

/** The home page's technology summary. `/skills` reads the full groups
 *  through `getSkillGroups()`. */
export function getFeaturedSkillGroups(): readonly SkillGroup[] {
  return pickSkills(skillGroups, (skill) => skill.featured === true);
}

export function getResume(): Resume {
  return resume;
}

export function getResumeSkillGroups(): readonly SkillGroup[] {
  return pickSkills(skillGroups, (skill) => skill.resume === true);
}

/** The invariants guarantee the role exists; this narrows the type. */
function roleFor(entry: ResumeEntry): Role {
  const match = roles.find((role) => role.id === entry.roleId);
  if (match === undefined) {
    throw new Error(`Content: no role "${entry.roleId}"`);
  }
  return match;
}

function dated(entries: readonly ResumeEntry[]): readonly DatedResumeEntry[] {
  return entries.map((entry) => {
    const { start, end } = roleFor(entry);
    return { ...entry, start, end };
  });
}

export function getResumeExperience(): readonly DatedResumeEntry[] {
  return dated(resume.experience);
}

export function getResumeDevelopment(): readonly DatedResumeEntry[] {
  return dated(resume.development);
}

export function getResumeProjects(): readonly ResumeProjectEntry[] {
  return resume.projects.map((item: ResumeProject) => {
    const project = projects.find((entry) => entry.slug === item.slug);
    if (project === undefined) {
      throw new Error(`Content: no project "${item.slug}"`);
    }
    return {
      ...item,
      name: item.name ?? project.name,
      stack: project.stack,
      role: project.role,
      period: project.period,
      path: `/projects/${project.slug}`,
      isPlaceholder: project.isPlaceholder,
    };
  });
}

export function getValuePoints(): readonly Point[] {
  return valuePoints;
}

export function getAudiences(): readonly Point[] {
  return audiences;
}

export function getReasons(): readonly Point[] {
  return reasons;
}

export function getProcessSteps(): readonly Point[] {
  return processSteps;
}

export function getMilestones(): readonly Point[] {
  return milestones;
}

/** What feature 12's honesty gate asserts on before deploying. */
export function getPlaceholderProjects(): readonly Project[] {
  return projects.filter((project) => project.isPlaceholder);
}
