import type { Metadata } from "next";
import { SkillsIndex } from "@/components/detail/SkillsIndex";
import { PageHeader } from "@/components/primitives/PageHeader";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Stack",
  description:
    "The technologies I build with, grouped by where each one sits in a build, with the context each was actually used in.",
  ...routeMetadata("/skills"),
};

export default function SkillsPage() {
  return (
    <section
      aria-labelledby="skills-heading"
      className="py-12 sm:py-14 lg:py-16"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          id="skills-heading"
          eyebrow="Stack"
          heading="What I build with, and where I have used it"
          lead="Grouped by where each one sits in a build, with the context it was used in. No self-assigned percentages: a score I award myself would not be evidence."
        />
        <div className="mt-12">
          <SkillsIndex />
        </div>
      </div>
    </section>
  );
}
