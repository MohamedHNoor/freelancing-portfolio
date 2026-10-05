import type { ProjectType } from "@/lib/validation/contact";

export type ServiceSlug =
  | "business-websites"
  | "web-applications"
  | "saas-development"
  | "figma-to-production";

export type AvailabilityStatus = "available" | "limited" | "unavailable";

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

/** The intrinsic size lets `next/image` reserve the box before the file loads. */
export type ImageAsset = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type Profile = {
  name: string;
  /** The job title, as a search result or a resume would print it. */
  role: string;
  headline: string;
  /** A phrase inside `headline` that the hero sets in the highlight
   *  gradient. Empty means nothing is emphasised. */
  headlineEmphasis: string;
  /** The canonical one-line description. Read by the hero, the resume and the
   *  `Person` structured data, so it has to stand alone in all three. */
  shortBio: string;
  /** The technologies named under the hero's buttons, in reading order. */
  primaryStack: readonly string[];
  longBio: readonly string[];
  availability: Availability;
  location: string;
  /** Where clients can be, not where clients have been. */
  serviceArea: readonly string[];
  /** The About section and `/about`. */
  portrait: ImageAsset;
  /** The hero's right-hand visual. */
  heroShowcase: ImageAsset;
  links: ProfileLinks;
};

/** A titled point with a sentence of detail. Value points, audiences, reasons
 *  to hire, process steps and payment milestones all share this shape. */
export type Point = {
  title: string;
  detail: string;
};

export type ServiceList = {
  label: string;
  items: readonly string[];
};

export type Service = {
  slug: ServiceSlug;
  name: string;
  summary: string;
  /** One or two labelled lists: who it suits, examples, or what it can include. */
  lists: readonly ServiceList[];
  /** The service's own call to action. It opens the contact form with this
   *  service's project type already chosen, which is what earns it a label of
   *  its own rather than a fifth "Start a Project". */
  cta: string;
  /** The contact form's project type this service preselects. */
  enquiryType: ProjectType;
  /** Duration only, and only where one has been promised before. No prices. */
  typicalTimeline?: string;
  order: number;
};

/** No proficiency value of any kind, by design. Where a technology was actually
 *  used says more than a self-assigned percentage. */
export type Skill = {
  name: string;
  context: string;
  /** Key into `src/components/icons/`. Feature 5 owns the registry. */
  icon?: string;
  /** Listed in the home page's technology summary. The rest appear on
   *  `/skills` only. */
  featured?: boolean;
  /** Listed on `/resume`, which keeps to the technologies that sharpen the
   *  positioning rather than every one in this file. */
  resume?: boolean;
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
  "Overview",
  "The Problem",
  "The Solution",
  "Key Features",
  "Architecture",
  "Engineering Challenges",
  "Testing",
  "Technology",
  "My Role",
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
  /** The product or client name, shown above the title. */
  name: string;
  /** What was built, in a few words. */
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

/** A role as the resume tells it, for an employer rather than a client. The
 *  dates are not repeated here: they come from the matching `Role`. */
export type ResumeEntry = {
  /** A `Role.id` in `experience.ts`. */
  roleId: string;
  title: string;
  organisation: string;
  location: string;
  highlights: readonly string[];
  /** Skill names from `skills.ts`. Empty prints no technology line. */
  technologies: readonly string[];
};

/** A project as the resume tells it: engineering evidence, not a sales pitch.
 *  The name, stack, role and period come from the matching `Project`. */
export type ResumeProject = {
  /** A `Project.slug` in `projects.ts`. */
  slug: string;
  /** Replaces the project's own name where the resume needs another form. */
  name?: string;
  subtitle: string;
  description: string;
  highlights: readonly string[];
};

export type Resume = {
  /** The title a recruiter searches for. `Profile.role` is the client-facing
   *  one the rest of the site uses. */
  title: string;
  summary: string;
  experience: readonly ResumeEntry[];
  /** Training, kept apart from employment so it never reads as a job. */
  development: readonly ResumeEntry[];
  projects: readonly ResumeProject[];
};
