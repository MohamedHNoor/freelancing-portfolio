import type { Metadata } from "next";
import { ServicesDetail } from "@/components/detail/ServicesDetail";
import { PageHeader } from "@/components/primitives/PageHeader";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Two engagement tracks: Figma designs turned into production Next.js sites, and React and Node platform work for healthcare and fintech teams.",
  ...routeMetadata("/services"),
};

export default function ServicesPage() {
  return (
    <section
      aria-labelledby="services-heading"
      className="py-12 sm:py-14 lg:py-16"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          id="services-heading"
          eyebrow="Services"
          heading="Two ways to work with me"
          lead="What each track delivers, and how a project runs from the first call to handover."
        />
        <div className="mt-12">
          <ServicesDetail />
        </div>
      </div>
    </section>
  );
}
