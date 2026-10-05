import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { SectionLink } from "@/components/primitives/SectionLink";
import { getProcessSteps } from "@/content";

/* The step titles only, as a summary. Each step's detail and the milestone
   model live at `/process`, which is what the navigation links to. */
export function Process() {
  const steps = getProcessSteps();

  if (steps.length === 0) {
    return null;
  }

  return (
    <Section
      id="process"
      label="Process"
      heading="How I Work"
      lead="Seven steps from the first conversation to handover, with the project split into milestones you review as they land."
    >
      <Reveal>
        <ol
          role="list"
          className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-7 lg:gap-x-5"
        >
          {steps.map((step, index) => (
            <li key={step.title} className="border-t border-border pt-4">
              <span
                aria-hidden="true"
                className="font-mono text-xs tracking-[0.16em] text-brand"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 font-heading text-lg font-semibold tracking-tight">
                {step.title}
              </p>
            </li>
          ))}
        </ol>
      </Reveal>
      <SectionLink href="/process">See how a project runs</SectionLink>
    </Section>
  );
}
