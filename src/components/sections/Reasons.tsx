import { PointGrid } from "@/components/primitives/PointGrid";
import { Reveal } from "@/components/primitives/Reveal";
import { Section } from "@/components/primitives/Section";
import { StartProjectCard } from "@/components/primitives/StartProjectCard";
import { getReasons } from "@/content";

/* Seven reasons in four columns leave the last row one short, so the eighth
   cell is the call to action rather than an empty slot. */
export function Reasons() {
  return (
    <Section id="why" label="Why me" heading="Why Work With Me?">
      <PointGrid
        points={getReasons()}
        columns={4}
        trailing={
          <Reveal className="h-full">
            <StartProjectCard />
          </Reveal>
        }
      />
    </Section>
  );
}
