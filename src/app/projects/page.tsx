import type { Metadata } from "next";
import { ProjectIndex } from "@/components/projects/ProjectIndex";
import { getProfile, getProjects, getServices } from "@/content";
import { toProjectCardData } from "@/lib/projects";

/* Title and description only. Feature 10 owns metadata properly, including
   canonicals, social images and the sitemap entry. Without this much the route
   would inherit the home page title, which names the site rather than the page. */
export const metadata: Metadata = {
  title: `Projects - ${getProfile().name}`,
  description:
    "Selected builds across two tracks: Figma designs turned into production Next.js sites, and platform work for healthcare and fintech teams.",
};

export default function ProjectsPage() {
  const services = getServices();
  const projects = getProjects().map((project) =>
    toProjectCardData(project, services),
  );

  return (
    <section
      aria-labelledby="projects-heading"
      className="py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">
          Work
        </p>
        {/* This page owns its own `h1`. The hero owns the only one on `/`. */}
        <h1
          id="projects-heading"
          className="mt-4 max-w-3xl text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Projects
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Every build, filterable by track and by the technology it used. Each
          number carries the measurement it came from.
        </p>

        <div className="mt-12">
          <ProjectIndex projects={projects} />
        </div>
      </div>
    </section>
  );
}
