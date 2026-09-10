import type { Metadata } from "next";
import { ExperienceTimeline } from "@/components/detail/ExperienceTimeline";
import { PageHeader } from "@/components/primitives/PageHeader";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Experience",
  description:
    "A dated work history with what changed at each role and the stack behind it, rather than a list of duties.",
  ...routeMetadata("/experience"),
};

export default function ExperiencePage() {
  return (
    <section
      aria-labelledby="experience-heading"
      className="py-12 sm:py-14 lg:py-16"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          id="experience-heading"
          eyebrow="Experience"
          heading="Where I have worked"
          lead="Reverse chronological, with what changed because I was there rather than a list of duties."
        />
        <div className="mt-12">
          <ExperienceTimeline />
        </div>
      </div>
    </section>
  );
}
