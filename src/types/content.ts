export type ServiceSlug = "figma-to-nextjs" | "saas-platforms";

export type AvailabilityStatus = "available" | "limited" | "unavailable";

/** A number never ships without something a visitor could check. */
export type ProofPoint = {
  value: string;
  label: string;
  evidence: string;
};

/** An empty string means "not supplied". Consumers must read these through
 *  `getProfileLinks()` so an unsupplied link renders as nothing rather than as
 *  a dead link. */
export type ProfileLinks = {
  email: string;
  github: string;
  linkedin: string;
  cv: string;
};

export type Availability = {
  status: AvailabilityStatus;
  detail: string;
};

export type Profile = {
  name: string;
  headline: string;
  specialisms: readonly ServiceSlug[];
  shortBio: string;
  longBio: readonly string[];
  availability: Availability;
  location: string;
  links: ProfileLinks;
  proofPoints: readonly ProofPoint[];
};

export type ProcessStep = {
  title: string;
  detail: string;
};

export type Service = {
  slug: ServiceSlug;
  name: string;
  forWho: string;
  summary: string;
  deliverables: readonly string[];
  /** Duration only. No prices anywhere on this site. */
  typicalTimeline: string;
  process: readonly ProcessStep[];
  order: number;
};

/** No proficiency value of any kind, by design. Where a technology was actually
 *  used says more than a self-assigned percentage. */
export type Skill = {
  name: string;
  context: string;
  /** Key into `src/components/icons/`. Feature 5 owns the registry. */
  icon?: string;
};

export type SkillGroup = {
  id: string;
  label: string;
  skills: readonly Skill[];
};

export type Role = {
  id: string;
  company: string;
  title: string;
  /** `YYYY-MM`. Strings, never Date, so there is no timezone drift. */
  start: string;
  /** `YYYY-MM`, or the sentinel `"present"`. */
  end: string;
  summary: string;
  impact: readonly string[];
  stack: readonly string[];
};

export type Metric = {
  label: string;
  value: string;
  evidence: string;
};

export const CASE_STUDY_HEADINGS = [
  "Problem",
  "Approach",
  "Architecture",
  "Outcome",
] as const;

export type CaseStudyHeading = (typeof CASE_STUDY_HEADINGS)[number];

export type CaseStudySection = {
  heading: CaseStudyHeading;
  body: readonly string[];
  bullets?: readonly string[];
};

export type ProjectCover = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ProjectLinks = {
  live?: string;
  repo?: string;
};

export type Project = {
  /** Route segment for `/projects/[slug]`. Unique, lowercase kebab-case. */
  slug: string;
  title: string;
  summary: string;
  role: string;
  period: string;
  category: ServiceSlug;
  stack: readonly string[];
  featured: boolean;
  /** Seeded example content. Feature 13 blocks the deploy while any is true. */
  isPlaceholder: boolean;
  links: ProjectLinks;
  metrics: readonly Metric[];
  cover: ProjectCover;
  caseStudy: readonly CaseStudySection[];
};
