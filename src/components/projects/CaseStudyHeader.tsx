import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, ArrowUpRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProjectLinks, type ProjectLinkKey } from "@/lib/projects";
import type { Project } from "@/types/content";

type CaseStudyHeaderProps = {
  project: Project;
  /** Resolved from the matching service by the page, so this component does
   *  not need the service list to render a label. */
  categoryLabel: string;
};

const LINK_LABELS: Record<ProjectLinkKey, string> = {
  live: "View the live site",
  repo: "View the repository",
};

export function CaseStudyHeader({
  project,
  categoryLabel,
}: CaseStudyHeaderProps) {
  const links = getProjectLinks(project);

  return (
    <header>
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        Back to projects
      </Link>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{categoryLabel}</Badge>
        {project.isPlaceholder ? (
          <Badge variant="outline">Example project</Badge>
        ) : null}
      </div>

      {/* This page owns the only `h1` on it. The case study section headings
          below are `h2`. */}
      <h1 className="mt-5 max-w-3xl text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        {project.title}
      </h1>

      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        {project.summary}
      </p>

      <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
        <div>
          <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Role
          </dt>
          <dd className="mt-1.5">{project.role}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Period
          </dt>
          <dd className="mt-1.5">{project.period}</dd>
        </div>
        {project.stack.length > 0 ? (
          <div className="min-w-0">
            <dt className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Stack
            </dt>
            <dd className="mt-1.5">
              <ul role="list" className="flex flex-wrap gap-2">
                {project.stack.map((entry) => (
                  <li key={entry}>
                    <Badge variant="secondary">{entry}</Badge>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
      </dl>

      {/* Driven by the flag, never hard coded. This page is where a fictional
          case study would be read in the most depth, so the marker sits above
          the body rather than only on the badge. */}
      {project.isPlaceholder ? (
        <p className="mt-8 max-w-2xl border-l-2 border-border pl-4 text-sm leading-relaxed text-muted-foreground">
          This is a seeded <span className="text-foreground">example project</span>,
          not client work. It is here so the structure of a case study is right
          from day one, and it is replaced before this site goes live.
        </p>
      ) : null}

      {/* `sizes` is the box width here, and deliberately not `ProjectCard`'s
          42rem. That value compensates for a cover crop in a column narrower
          than it is tall; this box is 1088 by 448, so its width governs and
          68rem is the honest number.

          `priority` because this is the Largest Contentful Paint element on a
          case study. Next.js reported the same image as LCP on `/projects`,
          where it sits below the fold; here it sits near the top. */}
      <Image
        src={project.cover.src}
        alt={project.cover.alt}
        width={project.cover.width}
        height={project.cover.height}
        priority
        sizes="(min-width: 1152px) 68rem, 100vw"
        /* Full content width, uncropped. This has now been three things: a
           681px-tall cover, then a height-capped crop that cut the bottom off,
           then a width-capped plate that kept the whole image but rendered it
           small with empty space either side. The cap existed because a cover
           this tall pushes the outcome numbers and the Problem section below
           the fold on a laptop, which is a real cost and is the reason to
           revisit this if the page starts feeling front-loaded.

           It loses to the simpler point: this is the page someone opens to
           study the product, and a screenshot they cannot read serves nobody.
           The title, summary and category all sit above it, so a reader has the
           pitch before the image arrives. */
        className="mt-10 w-full rounded-xl border border-border"
      />

      {project.metrics.length > 0 ? (
        <>
          {/* A `p`, not a heading: it labels the list rather than opening a
              section, and the document outline on this page belongs to the four
              case study headings. `ProjectCard` labels its metrics the same
              way. */}
          <p
            id="case-study-metrics"
            className="mt-12 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground"
          >
            Measured
          </p>
          {/* Evidence is body text under every number, matching the cards and
              the credibility strip. A number without its measurement is the
              kind of claim this site exists to avoid. */}
          <ul
            role="list"
            aria-labelledby="case-study-metrics"
            className="mt-5 grid gap-8 sm:grid-cols-3 sm:gap-x-10"
          >
            {project.metrics.map((metric) => (
              <li key={metric.label} className="min-w-0">
                <p className="font-heading text-2xl font-semibold tracking-tight text-brand">
                  {metric.value}
                </p>
                <p className="mt-1.5 text-sm font-medium">{metric.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {metric.evidence}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {links.length > 0 ? (
        <ul role="list" className="mt-10 flex flex-wrap gap-3">
          {links.map((link) => (
            <li key={link.key}>
              <Button
                asChild
                variant="outline"
                className="h-11 gap-2 px-5 text-[0.95rem]"
              >
                {/* Opens in a new tab so a visitor does not lose the case
                    study. The arrow carries that visually and the hidden text
                    carries it for a screen reader, because an unannounced new
                    window is disorienting. */}
                <a href={link.href} target="_blank" rel="noreferrer">
                  {LINK_LABELS[link.key]}
                  <ArrowUpRightIcon className="size-4" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
