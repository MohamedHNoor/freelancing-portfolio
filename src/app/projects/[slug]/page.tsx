import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyHeader } from "@/components/projects/CaseStudyHeader";
import { CaseStudyNav } from "@/components/projects/CaseStudyNav";
import { CaseStudySection } from "@/components/projects/CaseStudySection";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getAdjacentProjects,
  getProjectBySlug,
  getProjectSlugs,
  getServiceBySlug,
} from "@/content";
import { routeMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import {
  buildBreadcrumbJsonLd,
  buildCreativeWorkJsonLd,
} from "@/lib/structured-data";

/* Every slug is known at build time, so a slug that is not one of them is a 404
   rather than a page rendered on request. Confirmed against the Next.js 16
   docs. This is incompatible with `cacheComponents`, which `next.config.ts`
   does not enable; if that ever changes, the `notFound()` call below becomes
   the only guard and must stay. */
export const dynamicParams = false;

export function generateStaticParams() {
  return getProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<"/projects/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getProjectBySlug(slug);

  if (project === undefined) {
    return {};
  }

  /* `article` rather than `website`: a case study is a written piece about one
     project, not a page of the site itself. */
  return {
    title: project.title,
    description: project.summary,
    ...routeMetadata(`/projects/${slug}`, { type: "article" }),
  };
}

export default async function CaseStudyPage(
  props: PageProps<"/projects/[slug]">,
) {
  const { slug } = await props.params;
  const project = getProjectBySlug(slug);

  /* `notFound()` returns `never`, so this both serves the unknown-slug case and
     narrows `project` for everything below without a non-null assertion. In
     production `dynamicParams = false` means this is unreachable; in
     development an unknown slug falls through to here, which is how it can be
     observed at all. */
  if (project === undefined) {
    notFound();
  }

  const service = getServiceBySlug(project.category);
  const categoryLabel = service?.name ?? project.category;

  const breadcrumb = buildBreadcrumbJsonLd({ project, origin: SITE_URL });
  /* Absent for a seeded project. See `buildCreativeWorkJsonLd`: the page says
     in prose that the work is an example, and a machine-readable claim that it
     is real would contradict it. */
  const creativeWork = buildCreativeWorkJsonLd({
    project,
    categoryLabel,
    origin: SITE_URL,
  });

  return (
    <article className="py-12 sm:py-14 lg:py-16">
      <JsonLd data={breadcrumb} />
      {creativeWork === undefined ? null : <JsonLd data={creativeWork} />}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <CaseStudyHeader
          project={project}
          /* The content invariant guarantees a matching service, so the
             fallback is defensive rather than expected. */
          categoryLabel={categoryLabel}
        />

        {/* `assertContentInvariants` enforces the four canonical headings in
            their canonical order at module load, so array order is the render
            order and nothing needs sorting here. */}
        <div className="mt-16 space-y-12 sm:mt-20 sm:space-y-14">
          {project.caseStudy.map((section) => (
            <CaseStudySection key={section.heading} section={section} />
          ))}
        </div>

        <CaseStudyNav adjacent={getAdjacentProjects(project.slug)} />
      </div>
    </article>
  );
}
