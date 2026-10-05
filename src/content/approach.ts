import type { Point } from "@/types/content";

/* How the work runs, for the sections that sell the way of working rather than
   a deliverable. Everything here is a promise about future engagements, so it
   has to stay true in the sense that matters: a client who takes it literally
   is owed exactly what it says. Change it if the way you work changes.

   None of it names a client or claims a result. Those belong in `projects.ts`,
   next to their evidence. */

/** The four points directly under the hero. */
export const valuePoints = [
  {
    title: "Full-Stack",
    detail: "Frontend, backend, database and integrations.",
  },
  {
    title: "Production-Ready",
    detail: "Built to be deployed, maintained and extended.",
  },
  {
    title: "Direct Communication",
    detail: "Work directly with the developer building your product.",
  },
  {
    title: "NZ Based",
    detail:
      "Based in Wellington, working with clients across New Zealand, Australia and internationally.",
  },
] as const satisfies readonly Point[];

/* "White-label" on the agency card carries the terms the earlier agency track
   promised: the agency's name on the work and the client relationship left
   with the agency. It is kept because it is still offered. */
export const audiences = [
  {
    title: "Businesses",
    detail:
      "You need a professional website or custom software that fits the way your business actually operates.",
  },
  {
    title: "Startups",
    detail:
      "You have a product idea and need a developer who can turn it into a working MVP and prepare it for production.",
  },
  {
    title: "Agencies",
    detail:
      "You have client projects and need a reliable developer who can turn Figma designs into production-ready websites and applications, white-label if you need it.",
  },
  {
    title: "Entrepreneurs",
    detail:
      "You have an idea but need someone who can handle the technical implementation, from frontend to backend.",
  },
] as const satisfies readonly Point[];

export const reasons = [
  {
    title: "Full-Stack Development",
    detail:
      "I work across the entire application: frontend, backend, database and integrations.",
  },
  {
    title: "Business-Focused Development",
    detail:
      "The goal isn't simply to write code. It is software that solves a real business problem.",
  },
  {
    title: "Modern Technology",
    detail:
      "Modern tools and frameworks such as Next.js, React, TypeScript, Node.js and PostgreSQL.",
  },
  {
    title: "Clear Milestones",
    detail:
      "Projects are broken into clear milestones, so you can review progress throughout development.",
  },
  {
    title: "Production-Focused",
    detail:
      "Built with deployment, maintainability, security and future development in mind.",
  },
  {
    title: "Direct Communication",
    detail: "You work directly with the developer building your product.",
  },
  {
    title: "Code Ownership",
    detail:
      "At completion you receive the codebase and the information needed to maintain and continue developing it.",
  },
] as const satisfies readonly Point[];

export const processSteps = [
  {
    title: "Discovery",
    detail:
      "We discuss your business, your users, your goals and your requirements.",
  },
  {
    title: "Planning",
    detail:
      "I break the project into features, technical requirements and development milestones.",
  },
  {
    title: "Design and Specification",
    detail:
      "We agree the interface, the user flows and the technical approach. If you already have Figma designs, I work directly from them.",
  },
  {
    title: "Development",
    detail:
      "The application is built in small, reviewable pieces, so you see progress throughout the project rather than waiting until the end.",
  },
  {
    title: "Testing and Review",
    detail:
      "Features are tested and refined before production, and important business logic gets appropriate automated tests.",
  },
  {
    title: "Deployment",
    detail:
      "The application is prepared for and deployed to its production environment.",
  },
  {
    title: "Handover",
    detail:
      "You receive the source code and the information you need to keep maintaining and developing the application.",
  },
] as const satisfies readonly Point[];

/* Deliberately no percentages or amounts: the schedule is agreed per project,
   before development begins. */
export const milestones = [
  {
    title: "Project Setup",
    detail: "Requirements, architecture and initial setup.",
  },
  {
    title: "Milestone 1",
    detail: "The first group of agreed features.",
  },
  {
    title: "Milestone 2",
    detail: "The next group of agreed features.",
  },
  {
    title: "Final Milestone",
    detail: "Testing, final refinements and production deployment.",
  },
] as const satisfies readonly Point[];
