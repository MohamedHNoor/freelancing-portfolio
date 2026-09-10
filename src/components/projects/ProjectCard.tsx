import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectCardData } from "@/lib/projects";

type ProjectCardProps = {
  project: ProjectCardData;
  /** `h3` under the section heading on the home page, `h2` under the page
   *  heading on `/projects`. Passed in rather than fixed so neither surface
   *  skips a heading level. */
  titleAs: "h2" | "h3";
  /** Opt in for the one card that is the Largest Contentful Paint element,
   *  which is the first on `/projects`. Never on the home page, where the
   *  section sits far below the fold and preloading it would compete with the
   *  hero for bandwidth. */
  priority?: boolean;
};

/* No `"use client"`: this renders on the server inside the home section and
   inside the client filter on `/projects`. It has no state and no handlers, so
   both work, and the projection it takes carries no case study text into the
   browser.

   The whole card opens the case study, but only the title is a link. The link's
   `::after` is stretched over the card, which keeps the accessible name to the
   project title instead of the several hundred characters an anchor wrapped
   around the entire card would announce. Nothing else inside the card is
   interactive, so nothing is trapped underneath the overlay. The trade is that
   text selection across the card is largely lost, which is the right trade for
   a card whose purpose is to be opened. */
export function ProjectCard({
  project,
  titleAs,
  priority = false,
}: ProjectCardProps) {
  const Title = titleAs;
  const metricsLabelId = `${project.slug}-metrics`;

  return (
    <Card
      /* `relative` anchors the stretched link below. The focus ring is on the
         card rather than the title, so keyboard focus outlines the thing that
         is actually clickable. */
      className="relative transition-shadow [--card-spacing:--spacing(6)] hover:ring-foreground/25 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring sm:[--card-spacing:--spacing(8)]"
    >
      {/* A direct first child of Card, which is what makes the cover bleed to
          the card edges: the primitive drops its top padding and rounds the top
          corners for `img:first-child`. The cover used to sit inside a padded
          CardContent with its own border, so a bordered screenshot floated
          inside a bordered card ringed by dead space, and gave up about 64px of
          width for the privilege.

          Never cropped. It was `object-cover` against the text column's height,
          which was harmless while covers were gradient panels and wrong once
          they were real screenshots, where the removed part is the product. */}
      <Image
        src={project.cover.src}
        alt={project.cover.alt}
        width={project.cover.width}
        height={project.cover.height}
        /* Cards sit two up from `lg`, so the box is about half the content
           width; below that a card is full width. */
        sizes="(min-width: 1024px) 33rem, 100vw"
        priority={priority}
        /* No radius or ring of its own: the card clips the top corners and
           carries the outer edge. The bottom rule separates it from the copy. */
        className="w-full border-b border-border"
      />

      <CardContent className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{project.categoryLabel}</Badge>
          {/* Driven by the flag, never hard coded, so it disappears on its
              own when the seeded content is replaced. */}
          {project.isPlaceholder ? (
            <Badge variant="outline">Example project</Badge>
          ) : null}
        </div>

        <Title className="mt-4 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          <Link
            href={`/projects/${project.slug}`}
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
          >
            {project.title}
          </Link>
        </Title>

        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {project.summary}
        </p>

        {project.metrics.length > 0 ? (
          <>
            <p
              id={metricsLabelId}
              className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground"
            >
              Measured
            </p>
            {/* Value and label only. The evidence under each number is the
                whole point of these metrics, but three of them made the card
                about 250px of small print, which is the case study's job.
                `CaseStudyHeader` renders the same metrics with their evidence
                one click away, so nothing is lost. */}
            <ul
              role="list"
              aria-labelledby={metricsLabelId}
              className="mt-4 grid gap-4 sm:grid-cols-3 sm:gap-x-8"
            >
              {project.metrics.map((metric) => (
                <li key={metric.label} className="min-w-0">
                  <p className="font-heading text-lg font-semibold tracking-tight text-brand">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-sm font-medium">{metric.label}</p>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
