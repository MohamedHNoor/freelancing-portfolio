import { Reveal } from "@/components/primitives/Reveal";
import { getValuePoints } from "@/content";

/* The four reasons a visitor should keep reading, directly under the hero.
   Not a `Section`: it has no heading of its own, so it is labelled for
   assistive technology instead, as the proof-point strip it replaced was. */
export function ValuePoints() {
  const points = getValuePoints();

  if (points.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Why it is worth reading on"
      className="border-y border-border bg-card/40"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <Reveal>
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            {points.map((point) => (
              <li key={point.title}>
                <p className="font-heading text-xl font-semibold tracking-tight text-brand">
                  {point.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {point.detail}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
