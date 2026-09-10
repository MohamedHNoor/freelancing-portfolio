import type { Metadata } from "next";
import { DownloadIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getFeaturedProjects,
  getProfile,
  getProfileLinks,
  getRoles,
  getSkillGroups,
} from "@/content";
import { PRESENT, formatRoleEnd, formatYearMonth } from "@/lib/dates";
import { PrintButton } from "@/components/resume/PrintButton";
import { toContactLink } from "@/lib/links";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "Experience, stack and selected work for a freelance developer building Figma to Next.js sites and React and Node platforms.",
  ...routeMetadata("/resume"),
};

export default function ResumePage() {
  const profile = getProfile();
  const roles = getRoles();
  const skillGroups = getSkillGroups();
  const projects = getFeaturedProjects();

  /* `cv` drives the download rather than the contact line, so it is filtered
     out here. `getProfileLinks()` has already dropped anything unsupplied, so
     this carries whatever is set: email, GitHub and LinkedIn today, with `cv`
     still empty until a PDF exists in `public/`. */
  const profileLinks = getProfileLinks();
  const contactLinks = profileLinks
    .filter((link) => link.key !== "cv")
    .map(toContactLink);
  const cv = profileLinks.find((link) => link.key === "cv");

  return (
    <div className="py-12 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Narrower than the container it sits in. This is a document rather
            than a page of sections, and a resume read at the full 1152px would
            run well past a comfortable measure. */}
        <article className="mx-auto w-full max-w-4xl">
          <header>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {profile.name}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              {profile.headline}
            </p>

            <ul
              role="list"
              className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground"
            >
              <li>{profile.location}</li>
              {contactLinks.map((link) => (
                <li key={link.key}>
                  {/* The address is the link text, not a word like "GitHub".
                      Printed on paper the href is invisible, so a label would
                      leave the reader nothing to type. */}
                  <a
                    href={link.href}
                    className="rounded-sm underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            {/* Two routes to a PDF. The print button always works; the
                download appears only once a CV file is actually supplied,
                which is the same content-driven rule the project live and
                repository links follow. */}
            <div
              data-print-hidden=""
              className="mt-8 flex flex-wrap gap-3"
            >
              <PrintButton />
              {cv !== undefined ? (
                <Button
                  asChild
                  variant="outline"
                  className="h-11 gap-2 px-5 text-[0.95rem]"
                >
                  <a href={cv.href} download>
                    <DownloadIcon className="size-4" aria-hidden="true" />
                    Download CV
                  </a>
                </Button>
              ) : null}
            </div>
          </header>

          <p className="mt-8 text-base leading-relaxed text-muted-foreground">
            {profile.shortBio}
          </p>

          {roles.length > 0 ? (
            <section aria-labelledby="resume-experience" className="mt-12">
              <h2
                id="resume-experience"
                className="border-b border-border pb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
              >
                Experience
              </h2>

              {/* `getRoles()` is already sorted newest first by the content
                  layer, and dates come from `src/lib/dates.ts`, which exists so
                  there is exactly one date format on this site. Do not re-sort
                  and do not format them any other way here. */}
              <ol role="list" className="mt-6 space-y-8">
                {roles.map((role) => (
                  <li key={role.id} className="break-inside-avoid">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <h3 className="font-heading text-base font-semibold tracking-tight">
                        {role.title}
                        <span className="text-muted-foreground"> at </span>
                        {role.company}
                      </h3>
                      <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        <time dateTime={role.start}>
                          {formatYearMonth(role.start)}
                        </time>
                        {" - "}
                        {role.end === PRESENT ? (
                          "Present"
                        ) : (
                          <time dateTime={role.end}>
                            {formatRoleEnd(role.end)}
                          </time>
                        )}
                      </p>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {role.summary}
                    </p>

                    {role.impact.length > 0 ? (
                      <ul
                        role="list"
                        className="mt-3 list-outside list-disc space-y-1.5 pl-5 marker:text-brand"
                      >
                        {role.impact.map((point) => (
                          <li
                            key={point}
                            className="pl-1 text-sm leading-relaxed text-muted-foreground"
                          >
                            {point}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {role.stack.length > 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Stack:{" "}
                        </span>
                        {role.stack.join(", ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {skillGroups.length > 0 ? (
            <section aria-labelledby="resume-skills" className="mt-12">
              <h2
                id="resume-skills"
                className="border-b border-border pb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
              >
                Skills
              </h2>

              {/* Names only. The usage context under each technology is the
                  entire point of the Skills section on the site, and it is
                  wrong here: a resume is scanned for a match in seconds, and
                  thirty context lines would bury the names doing that work.
                  This is deliberate, not an omission. */}
              <dl className="mt-6 space-y-4">
                {skillGroups.map((group) => (
                  <div
                    key={group.id}
                    className="break-inside-avoid gap-x-4 sm:grid sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]"
                  >
                    <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground sm:pt-0.5">
                      {group.label}
                    </dt>
                    <dd className="mt-1 text-sm leading-relaxed sm:mt-0">
                      {group.skills.map((skill) => skill.name).join(", ")}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {projects.length > 0 ? (
            <section aria-labelledby="resume-projects" className="mt-12">
              <h2
                id="resume-projects"
                className="border-b border-border pb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
              >
                Selected work
              </h2>

              <ul role="list" className="mt-6 space-y-6">
                {projects.map((project) => (
                  <li key={project.slug} className="break-inside-avoid">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="font-heading text-base font-semibold tracking-tight">
                        {project.title}
                      </h3>
                      {/* Driven by the flag, exactly as on the cards and the
                          case studies. A resume is the artifact people forward
                          and check, so an unmarked example would do the most
                          damage here. */}
                      {project.isPlaceholder ? (
                        <Badge variant="outline">Example project</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {project.summary}
                    </p>
                    {project.stack.length > 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Stack:{" "}
                        </span>
                        {project.stack.join(", ")}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      </div>
    </div>
  );
}
