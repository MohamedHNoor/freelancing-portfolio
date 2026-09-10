import type { Metadata } from "next";
import { AboutDetail } from "@/components/detail/AboutDetail";
import { PageHeader } from "@/components/primitives/PageHeader";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About",
  description:
    "How I work: what I build, the two kinds of project I take on, and how a build runs week to week.",
  ...routeMetadata("/about"),
};

export default function AboutPage() {
  return (
    <section aria-labelledby="about-heading" className="py-12 sm:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          id="about-heading"
          eyebrow="About"
          heading="How I work"
          lead="The long version: what I build, and the way a project runs when you hire me."
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
