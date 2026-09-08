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
export function ProjectCard({ project, titleAs }: ProjectCardProps) {
  const Title = titleAs;
  const metricsLabelId = `${project.slug}-metrics`;

  return (
    <Card
      /* `relative` anchors the stretched link below. The focus ring is on the
         card rather than the title, so keyboard focus outlines the thing that
         is actually clickable. */
      className="relative transition-shadow [--card-spacing:--spacing(6)] hover:ring-foreground/25 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring sm:[--card-spacing:--spacing(8)]"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-2">
        <CardContent className="min-w-0 lg:h-full">
          {/* Natural aspect ratio while stacked, and filling the column beside
              the body copy at `lg`, where the text is roughly twice the height
              of a 16:10 cover and would otherwise leave the image floating
              above an equal amount of dead space. Cropping from the top keeps
              the header and hero of a page screenshot, which is the part worth
              seeing. */}
          <Image
            src={project.cover.src}
            alt={project.cover.alt}
            width={project.cover.width}
            height={project.cover.height}
            /* 42rem, not the 26rem the box is wide. `object-cover` scales the
               source to match the taller dimension, so a 352 by 414 box on a
               16:10 cover consumes about 662px of source width. Measured, not
               guessed: at this value the browser picks 750w on a 1x display and
               1920w on a 2x one, against a 662 and 1324 requirement. Dropping
               it back to the box width fetches 640w and looks soft on any
               retina screen. */
            sizes="(min-width: 1024px) 42rem, 100vw"
            className="w-full rounded-lg border border-border lg:h-full lg:object-cover lg:object-top"
          />
        </CardContent>

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

          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Period</dt>
              <dd>{project.period}</dd>
            </div>
          </dl>

          {project.metrics.length > 0 ? (
            <>
              <p
                id={metricsLabelId}
                className="mt-8 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground"
              >
                Measured
              </p>
              {/* Evidence is body text under every number, matching the
                  credibility strip. A number without its measurement is the
                  kind of claim this site exists to avoid. */}
              <ul
                role="list"
                aria-labelledby={metricsLabelId}
                className="mt-4 grid gap-6 sm:grid-cols-3 sm:gap-x-8"
              >
                {project.metrics.map((metric) => (
                  <li key={metric.label} className="min-w-0">
                    <p className="font-heading text-lg font-semibold tracking-tight text-brand">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-sm font-medium">{metric.label}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {metric.evidence}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {project.stack.length > 0 ? (
            <ul
              role="list"
              aria-label={`Stack used on ${project.title}`}
              className="mt-8 flex flex-wrap gap-2"
            >
              {project.stack.map((entry) => (
                <li key={entry}>
                  <Badge variant="secondary">{entry}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </div>
    </Card>
  );
}
