import type { Metadata } from "next";
import { PageHeader } from "@/components/primitives/PageHeader";
import { ProjectIndex } from "@/components/projects/ProjectIndex";
import { getProjects, getServices } from "@/content";
import { toProjectCardData } from "@/lib/projects";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Case studies of websites and web applications built by Mohamed Noor, from a multi-tenant travel commerce platform to a production Next.js website.",
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
          heading="Selected Work"
          lead="Websites and applications I have built, filterable by service and by technology. Every number carries the measurement it came from."
        />

        <div className="mt-12">
          <ProjectIndex projects={projects} />
        </div>
      </div>
    </section>
  );
}
