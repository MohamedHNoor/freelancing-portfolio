import type { Metadata } from "next";
import { Fragment } from "react";
import { DotList } from "@/components/resume/DotList";
import { ResumeItem } from "@/components/resume/ResumeItem";
import { ResumeSection } from "@/components/resume/ResumeSection";
import { ResumeToolbar } from "@/components/resume/ResumeToolbar";
import { Badge } from "@/components/ui/badge";
import {
  type DatedResumeEntry,
  getProfile,
  getProfileLinks,
  getResume,
  getResumeDevelopment,
  getResumeExperience,
  getResumeProjects,
  getResumeSkillGroups,
} from "@/content";
import { PRESENT, formatRoleEnd, formatYearMonth } from "@/lib/dates";
import { displayUrl, toContactLink } from "@/lib/links";
import { routeMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `${getResume().title} Resume`,
  description:
    "Resume of Mohamed Noor, a full-stack software engineer in Wellington, New Zealand, working in React, Next.js, TypeScript, Node.js, Ruby on Rails and PostgreSQL: experience, technical skills and selected projects.",
  ...routeMetadata("/resume"),
};

/* Dates come from `src/lib/dates.ts`, which exists so there is exactly one date
   format on this site. A hyphen rather than a dash, per the writing rules. */
function DateRange({ start, end }: Pick<DatedResumeEntry, "start" | "end">) {
  return (
    <>
      <time dateTime={start}>{formatYearMonth(start)}</time>
      {" - "}
      {end === PRESENT ? (
        "Present"
      ) : (
        <time dateTime={end}>{formatRoleEnd(end)}</time>
      )}
    </>
  );
}

function RoleItem({ entry }: { entry: DatedResumeEntry }) {
  return (
    <ResumeItem
      heading={entry.title}
      aside={<DateRange start={entry.start} end={entry.end} />}
      meta={`${entry.organisation} · ${entry.location}`}
      highlights={entry.highlights}
      technologies={entry.technologies}
    />
  );
}

/* A standalone document: no site header or footer. This route sits outside
   the `(site)` group for exactly that reason, so it supplies its own header and
   the `<main>` the skip link targets. The same markup prints; the print rules
   in `globals.css` turn it into a white A4 sheet whatever the theme. */
export default function ResumePage() {
  const profile = getProfile();
  const resume = getResume();
  const experience = getResumeExperience();
  const development = getResumeDevelopment();
  const projects = getResumeProjects();
  const skillGroups = getResumeSkillGroups();

  /* `getProfileLinks()` has already dropped anything unsupplied. The CV drives
     a download rather than the contact line, and the portfolio goes after the
     email, which is the order a recruiter reaches for them. */
  const profileLinks = getProfileLinks();
  const cv = profileLinks.find((link) => link.key === "cv");
  const [email, ...profiles] = profileLinks
    .filter((link) => link.key !== "cv")
    .map(toContactLink);
  const contacts = [
    ...(email === undefined ? [] : [{ key: "email", href: email.href }]),
    { key: "portfolio", href: SITE_URL },
    ...profiles.map(({ key, href }) => ({ key, href })),
  ];

  return (
    <>
      <ResumeToolbar name={profile.name} cvHref={cv?.href} />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 focus:outline-none"
      >
        <article
          data-resume=""
          className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-12 print:max-w-none print:p-0"
        >
          <header>
            <h1 className="font-heading text-[2rem] font-semibold leading-tight tracking-tight sm:text-[2.5rem] print:text-[22pt]">
              {profile.name}
            </h1>
            <p className="mt-1 font-heading text-lg font-medium text-brand sm:text-xl print:text-[13pt]">
              {resume.title}
            </p>

            <p className="mt-3 text-sm text-muted-foreground print:mt-1.5 print:text-[9.5pt]">
              {profile.location}
            </p>
            {/* Every address is its own link text, because on paper the href
                is invisible. Each dot trails the item before it, so a wrapped
                line never opens with one, and it is real text so a PDF's text
                layer keeps the items apart. Stacked on a phone it is dropped. */}
            <ul
              role="list"
              className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-0 print:text-[9.5pt]"
            >
              {contacts.map((contact, index) => (
                <li key={contact.key}>
                  <a
                    href={contact.href}
                    className="rounded-sm underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {displayUrl(contact.href)}
                  </a>
                  {index < contacts.length - 1 ? (
                    <span aria-hidden="true" className="hidden px-2 sm:inline">
                      ·
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </header>

          <ResumeSection id="summary" title="Professional Summary">
            <p className="text-sm leading-relaxed sm:text-[0.9375rem] print:text-[10pt] print:leading-snug">
              {resume.summary}
            </p>
          </ResumeSection>

          {skillGroups.length > 0 ? (
            <ResumeSection id="skills" title="Technical Skills">
              <dl className="space-y-2.5 print:space-y-1">
                {skillGroups.map((group) => (
                  <div
                    key={group.id}
                    className="break-inside-avoid sm:grid sm:grid-cols-[12.5rem_minmax(0,1fr)] sm:gap-x-4"
                  >
                    <dt className="text-sm font-semibold print:text-[9.5pt]">
                      {group.label}
                    </dt>
                    <dd className="text-sm leading-relaxed text-muted-foreground print:text-[9.5pt] print:leading-snug">
                      <DotList items={group.skills.map((skill) => skill.name)} />
                    </dd>
                  </div>
                ))}
              </dl>
            </ResumeSection>
          ) : null}

          {experience.length > 0 ? (
            <ResumeSection id="experience" title="Professional Experience">
              <ul role="list" className="space-y-6 print:space-y-3">
                {experience.map((entry) => (
                  <li key={entry.roleId}>
                    <RoleItem entry={entry} />
                  </li>
                ))}
              </ul>
            </ResumeSection>
          ) : null}

          {projects.length > 0 ? (
            <ResumeSection id="projects" title="Selected Projects">
              <ul role="list" className="space-y-6 print:space-y-3">
                {projects.map((project) => {
                  const caseStudy = new URL(project.path, SITE_URL).href;
                  return (
                    <li key={project.slug}>
                      <ResumeItem
                        heading={
                          <>
                            {project.name}
                            <span className="font-normal text-muted-foreground">
                              {" · "}
                              {project.subtitle}
                            </span>
                            {/* Driven by the flag, as on the cards and case
                                studies. A resume is the artifact people forward
                                and check, so an unmarked example would do the
                                most damage here. */}
                            {project.isPlaceholder ? (
                              <Fragment>
                                {" "}
                                <Badge variant="outline">Example project</Badge>
                              </Fragment>
                            ) : null}
                          </>
                        }
                        aside={project.period}
                        meta={project.role}
                        description={project.description}
                        highlights={project.highlights}
                        technologies={project.stack}
                        footer={
                          <p className="mt-2 text-sm text-muted-foreground print:mt-1 print:text-[9.5pt]">
                            Case study:{" "}
                            <a
                              href={caseStudy}
                              className="rounded-sm underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {displayUrl(caseStudy)}
                            </a>
                          </p>
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </ResumeSection>
          ) : null}

          {development.length > 0 ? (
            <ResumeSection id="development" title="Professional Development">
              <ul role="list" className="space-y-6 print:space-y-3">
                {development.map((entry) => (
                  <li key={entry.roleId}>
                    <RoleItem entry={entry} />
                  </li>
                ))}
              </ul>
            </ResumeSection>
          ) : null}
        </article>
      </main>
    </>
  );
}
