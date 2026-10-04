import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { PageHeader } from "@/components/primitives/PageHeader";
import { PointGrid } from "@/components/primitives/PointGrid";
import { Button } from "@/components/ui/button";
import { getMilestones, getProcessSteps } from "@/content";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Process",
  description:
    "How a website or web application project runs, from discovery and planning to development, testing, deployment and handover, split into milestones you review as they land.",
  ...routeMetadata("/process"),
};

/* No `Reveal` on the steps' wrapper beyond what `PointGrid` does per card: the
   content is the reason this page exists. The payment schedule is agreed per
   project, so the milestone model names stages, never percentages. */
export default function ProcessPage() {
  return (
    <section
      aria-labelledby="process-heading"
      className="py-12 sm:py-14 lg:py-16"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          id="process-heading"
          eyebrow="Process"
          heading="How I Work"
          lead="Seven steps from the first conversation to handover. Work is built in small, reviewable pieces, so you see progress throughout rather than waiting until the end."
        />

        <div className="mt-12">
          <PointGrid points={getProcessSteps()} columns={3} numbered />
        </div>

        <section aria-labelledby="milestones-heading" className="mt-20">
          <h2
            id="milestones-heading"
            className="max-w-3xl text-balance font-heading text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            A Clear, Milestone-Based Approach
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            For larger projects, development can be divided into clear
            milestones.
          </p>
          <div className="mt-10">
            <PointGrid points={getMilestones()} columns={4} />
          </div>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The exact milestones and payment schedule are agreed before
            development begins.
          </p>
        </section>

        <div className="mt-16 flex flex-wrap items-center gap-4 border-t border-border pt-10">
          <p className="text-lg font-medium">Have a project in mind?</p>
          <Button asChild className="h-11 gap-2 px-5 text-[0.95rem]">
            <Link href="/contact">
              Start a Project
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
