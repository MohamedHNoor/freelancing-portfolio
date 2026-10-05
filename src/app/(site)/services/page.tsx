import type { Metadata } from "next";
import { ServicesDetail } from "@/components/detail/ServicesDetail";
import { PageHeader } from "@/components/primitives/PageHeader";
import { routeMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Business websites, custom web applications, SaaS development and Figma to Next.js builds for businesses, startups and agencies in New Zealand, Australia and internationally.",
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
          heading="What I Can Build"
          lead="Whether you need a professional website, custom business software or a new SaaS product, I can help turn the idea into a production-ready application."
        />
        <div className="mt-12">
          <ServicesDetail />
        </div>
      </div>
    </section>
  );
}
