import type { Metadata } from "next";
import { AboutDetail } from "@/components/detail/AboutDetail";
import { PageHeader } from "@/components/primitives/PageHeader";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  description:
    "Mohamed Noor is a full-stack web developer in Wellington, New Zealand, building websites and custom web applications on Next.js, React, TypeScript, Node.js and PostgreSQL.",
  ...routeMetadata("/about"),
};

export default function AboutPage() {
  return (
    <section aria-labelledby="about-heading" className="py-12 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          id="about-heading"
          eyebrow="About"
          heading="About Mohamed"
          lead="A full-stack web developer in Wellington, New Zealand, working with businesses, startups and agencies across New Zealand, Australia and internationally."
        />
        {/* The header always renders, because a route that exists must not
            return a blank document. The body carries the same conditional the
            home section does. */}
        <div className="mt-12">
          <AboutDetail />
        </div>
      </div>
    </section>
  );
}
