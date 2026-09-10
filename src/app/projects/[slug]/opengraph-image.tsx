import { ImageResponse } from "next/og";
import { OgCard } from "@/components/og/OgCard";
import { getProjectBySlug, getProjectSlugs, getServiceBySlug } from "@/content";
import { OG_COLORS, OG_CONTENT_TYPE, OG_SIZE, ogFonts } from "@/lib/og";

/* Overrides the site card for case studies, which are the pages most likely to
   be linked directly from a proposal. */

export function generateStaticParams() {
  return getProjectSlugs().map((slug) => ({ slug }));
}

type ImageProps = { params: Promise<{ slug: string }> };

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/* Describes the shape of the card rather than naming the project. `alt` is a
   static export, and `generateImageMetadata` is the only way to vary it per
   slug: that hook is probed with an undefined slug while Next collects page
   data, so using it here means either failing the build or writing code that
   pretends a nonexistent project is fine. The project is named in `og:title`
   beside this anyway. */
export const alt =
  "A dark case study card showing the project title, the service track it belongs to, and its headline result.";

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const project = requireProject(slug);
  const service = getServiceBySlug(project.category);
  const headline = project.metrics[0];

  return new ImageResponse(
    (
      <OgCard
        eyebrow={service?.name ?? project.category}
        /* The same marker the page itself carries in `CaseStudyHeader`. A card
           without it would present seeded work as delivered work in the one
           place a reader sees before opening the page that says otherwise. */
        badge={project.isPlaceholder ? "Example project" : undefined}
      >
        <div
          style={{
            display: "flex",
            fontSize: 60,
            lineHeight: 1.14,
            letterSpacing: "-0.02em",
            maxWidth: 940,
          }}
        >
          {project.title}
        </div>

        {/* Omitted rather than left as an empty row when a project carries no
            metrics. The content layer allows that; the card must not show a gap
            where a number would be. */}
        {headline === undefined ? null : (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              marginTop: 40,
            }}
          >
            <div style={{ display: "flex", fontSize: 46, color: OG_COLORS.brand }}>
              {headline.value}
            </div>
            <div style={{ display: "flex", fontSize: 26, color: OG_COLORS.muted }}>
              {headline.label}
            </div>
          </div>
        )}
      </OgCard>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}

/** `generateStaticParams` only ever yields known slugs, so this is unreachable
 *  in a build. It throws rather than rendering a blank card, matching how
 *  `toProjectCardData` treats its own impossible case. */
function requireProject(slug: string) {
  const project = getProjectBySlug(slug);
  if (project === undefined) {
    throw new RangeError(`No project matches the slug "${slug}"`);
  }
  return project;
}
