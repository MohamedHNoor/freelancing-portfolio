import type { Role } from "@/types/content";

/* PLACEHOLDER CONTENT. "Example" company names follow the reserved-example
   convention so nothing here can be mistaken for a real employer. Replace every
   role with your actual history before launch; an invented work history is the
   one thing on this site that cannot be walked back. */
export const roles = [
  {
    id: "independent",
    company: "Independent",
    title: "Freelance web developer",
    start: "2024-06",
    end: "present",
    summary:
      "Design-to-code builds and platform work for founders and small teams, working directly with the people who own the product.",
    impact: [
      "Delivered responsive Next.js builds from finished design files",
      "Set performance and accessibility budgets as release gates rather than goals",
      "Handed over documented codebases that clients could staff internally",
    ],
    stack: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Node.js"],
  },
  {
    id: "example-health",
    company: "Example Health",
    title: "Front-end developer",
    start: "2022-09",
    end: "2024-05",
    summary:
      "Built clinician-facing views for a patient records product, working alongside a backend team on a shared Postgres domain.",
    impact: [
      "Shipped role-aware interfaces where visibility depended on the viewer",
      "Reduced first-load JavaScript on the busiest route",
      "Introduced an accessibility checklist into the review process",
    ],
    stack: ["React", "TypeScript", "Node.js", "PostgreSQL"],
  },
  {
    id: "example-studio",
    company: "Example Studio",
    title: "Web developer",
    start: "2021-03",
    end: "2022-08",
    summary:
      "Turned agency design files into production marketing sites across a range of client brands.",
    impact: [
      "Built a shared component library reused across client projects",
      "Cut template build time by standardising the token layer",
      "Owned the fidelity review against designers before every launch",
    ],
    stack: ["React", "Next.js", "Tailwind CSS", "Git"],
  },
] as const satisfies readonly Role[];
