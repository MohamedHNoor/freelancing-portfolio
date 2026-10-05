import type { Service } from "@/types/content";

/* No prices anywhere, by design.

   What a service can include is an offer about future work, so it may list
   things a project could need. Claims about past work belong in `projects.ts`,
   where each one is backed by a case study: authentication, tenant isolation,
   payments, webhooks and testing by the travel platform; design fidelity,
   accessibility and performance by this site.

   `typicalTimeline` is a promise, so it appears only where one was made before
   this content was rewritten: four to twelve weeks for a SaaS launch, and one
   to three weeks for a marketing site built from a finished design. Business
   websites and custom applications vary too much to promise a duration, so
   they carry none rather than an invented one. */
export const services = [
  {
    slug: "business-websites",
    name: "Business Websites",
    summary:
      "Professional, responsive websites designed to establish credibility and turn visitors into customers.",
    lists: [
      {
        label: "Ideal for",
        items: [
          "Small and medium businesses",
          "Professional services",
          "Startups",
          "Agencies",
          "Organisations",
          "Personal brands",
        ],
      },
      {
        label: "Can include",
        items: [
          "Marketing pages",
          "Landing pages",
          "Service pages",
          "Contact forms",
          "CMS and content management",
          "Blog systems",
          "SEO",
          "Analytics",
          "Third-party integrations",
          "Responsive mobile design",
        ],
      },
    ],
    cta: "Build My Website",
    enquiryType: "business-website",
    order: 1,
  },
  {
    slug: "web-applications",
    name: "Custom Web Applications",
    summary:
      "Software built around your business processes, instead of forcing your business to adapt to an off-the-shelf product.",
    lists: [
      {
        label: "Examples",
        items: [
          "Customer portals",
          "Admin dashboards",
          "Booking systems",
          "Management platforms",
          "CRM-style systems",
          "Internal business tools",
          "Order management",
          "Reporting dashboards",
          "Customer management",
          "Workflow automation",
        ],
      },
    ],
    cta: "Discuss My Application",
    enquiryType: "web-application",
    order: 2,
  },
  {
    slug: "saas-development",
    name: "SaaS Development",
    summary:
      "From product idea to production-ready SaaS, with the parts that are expensive to retrofit, such as authentication, tenant isolation, payments and tests, built in from the start.",
    lists: [
      {
        label: "Can include",
        items: [
          "User authentication",
          "User accounts",
          "Role-based access",
          "PostgreSQL database",
          "Subscription billing",
          "Payment processing",
          "Webhooks",
          "Admin dashboards",
          "API integrations",
          "Multi-tenant architecture",
          "Automated testing",
          "Production deployment",
        ],
      },
    ],
    cta: "Build My SaaS",
    enquiryType: "saas-product",
    typicalTimeline: "Four to twelve weeks to a first launch, depending on scope",
    order: 3,
  },
  {
    slug: "figma-to-production",
    name: "Figma to Production",
    summary:
      "Already have your design? I turn Figma designs into responsive, accessible and production-ready Next.js websites.",
    lists: [
      {
        label: "Includes",
        items: [
          "Pixel-accurate implementation",
          "Responsive layouts",
          "Component architecture",
          "Accessibility",
          "SEO",
          "Performance optimisation",
          "API integration",
          "Production deployment",
        ],
      },
    ],
    cta: "Turn My Design Into Code",
    enquiryType: "figma-to-nextjs",
    typicalTimeline: "One to three weeks for a typical marketing site",
    order: 4,
  },
] as const satisfies readonly Service[];
