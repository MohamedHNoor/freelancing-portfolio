import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives/PageHeader";
import { ProjectIndex } from "@/components/projects/ProjectIndex";
import { getProjects, getServices } from "@/content";
import { toProjectCardData } from "@/lib/projects";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected builds across two tracks: Figma designs turned into production Next.js sites, and platform work for healthcare and fintech teams.",
  ...routeMetadata("/projects"),
};

export default function ProjectsPage() {
  const services = getServices();
  const projects = getProjects().map((project) =>
    toProjectCardData(project, services),
  );

  return (
    <section
      aria-labelledby="projects-heading"
      className="py-12 sm:py-14 lg:py-16"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          id="projects-heading"
          eyebrow="Work"
          heading="Projects"
          lead="Every build, filterable by track and by the technology it used. Each number carries the measurement it came from."
        />

        <div className="mt-12">
          <ProjectIndex projects={projects} />
        </div>
      </div>
    </section>
  );
}
