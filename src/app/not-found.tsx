import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjects } from "@/content";

/* No canonical: a 404 is not a page that should be indexed under any URL, and
   `noindex` keeps a mistyped or stale link out of search results rather than
   letting it compete with the real routes. */
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/* The root `not-found.tsx`, so it catches both `notFound()` from
   `/projects/[slug]` and any unmatched URL. It renders inside the root layout,
   which is why the header, footer and skip link are not repeated here.
   `global-not-found.tsx` would have bypassed the layout and forced this file to
   restate `<html>`, `<body>`, the font variables and the theme script.

   It takes no props: Next does not pass the attempted path, so the copy cannot
   name what was missing and has to work for a mistyped URL as well as a stale
   case study link. */
export default function NotFound() {
  const projects = getProjects();

  return (
    <section className="py-12 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand">
          404
        </p>
        <h1 className="mt-4 max-w-3xl text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          This page does not exist, or it has moved. If you followed a link to a
          case study, that project may have been replaced since.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild className="h-11 gap-2 px-5 text-[0.95rem]">
            <Link href="/">Back to home</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 px-5 text-[0.95rem]"
          >
            <Link href="/projects">View all projects</Link>
          </Button>
        </div>

        {/* Driven by the content layer, so replacing the seeded projects
            updates this list without touching the page. A 404 that only
            apologises is a dead end; this one carries the recovery. */}
        {projects.length > 0 ? (
          <div className="mt-14 border-t border-border pt-8">
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Case studies
            </h2>
            <ul role="list" className="mt-5 space-y-1">
              {projects.map((project) => (
                <li key={project.slug}>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="group -mx-2 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-base transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {project.title}
                    <ArrowRightIcon
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
