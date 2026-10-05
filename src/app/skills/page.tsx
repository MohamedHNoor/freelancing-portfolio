import type { Metadata } from "next";
import { SkillsIndex } from "@/components/detail/SkillsIndex";
import { PageHeader } from "@/components/primitives/PageHeader";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Technology",
  description:
    "The technologies behind the websites and web applications I build, from Next.js, React and TypeScript to Node.js, PostgreSQL, authentication and payments, with where each was used.",
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
          eyebrow="Technology"
          heading="Technology I Work With"
          lead="Organised by what each one does in a product, with the real work each was used on. No self-assigned percentages: a score I award myself would not be evidence."
        />
        <div className="mt-12">
          <SkillsIndex />
        </div>
      </div>
    </section>
  );
}
