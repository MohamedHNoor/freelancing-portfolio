import { Reveal } from "@/components/primitives/Reveal";
import { getProfile } from "@/content";

/* Evidence is body text, never a tooltip or a title attribute: both are
   unreachable on touch and by keyboard, and the evidence is the only reason
   the number is worth anything. */
export function CredibilityStrip() {
  const { proofPoints } = getProfile();

  if (proofPoints.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Evidence for the claims on this site"
      className="border-y border-border bg-card/40"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <Reveal>
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {proofPoints.map((point) => (
              <li key={point.label}>
                <p className="font-heading text-3xl font-semibold tracking-tight text-brand">
                  {point.value}
                </p>
                <p className="mt-1.5 text-sm font-medium">{point.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {point.evidence}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
