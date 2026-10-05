import Image from "next/image";
import { getProfile } from "@/content";
import { cn } from "@/lib/utils";

/* The supplied image is a whole hero mock-up: a painted copy of the real
   hero's text down its left, and a service strip along its bottom. Only the
   devices and project labels in between are shown, by cropping in CSS rather
   than in the file, so the window can move without re-exporting anything.

   The crop window, in source pixels of the 1690 x 931 file:
     y 0 to 805 at every width, which drops the bottom strip and keeps the
     empty room above the first label, where the dark theme's top fade goes;
     x 608 to 1690 from `lg`, the phone through the third project;
     x 608 to 1420 below `lg`, the phone and laptop only, so they stay large.
   x 608 is the narrowest gap between the painted text, which ends at 600,
   and the phone, which starts at 617. The laundromat label starts at 576, so
   its icon is clipped either way.

   The box takes the window's aspect ratio, and the image is scaled and
   offset inside it: width is source width / window width, and left is
   -x0 / window width. */
const CROP =
  "absolute top-0 left-[-74.877%] h-auto w-[208.128%] max-w-none lg:left-[-56.192%] lg:w-[156.192%]";

type HeroShowcaseProps = {
  className?: string;
};

export function HeroShowcase({ className }: HeroShowcaseProps) {
  const { heroShowcase } = getProfile();

  return (
    /* Light theme: a card surface, because a dark render dropped onto a
       near-white page reads as a hole. Dark theme: no surface at all, with the
       edges masked so the render's own background melts into the page's.
       From `lg` the dark version runs off the viewport's right edge, as the
       render's own right edge does, so that side is not faded. The left fade
       is wide enough to hide the seam where the render's background meets
       the page, and narrow enough to leave the phone at full strength. */
    <div
      className={cn(
        "animate-showcase-in rounded-2xl border border-border bg-card p-2 shadow-xl shadow-black/10",
        "dark:rounded-none dark:border-0 dark:bg-transparent dark:p-0 dark:shadow-none",
        className,
      )}
    >
      <div className="relative aspect-[812/805] overflow-hidden rounded-xl lg:aspect-[1082/805] dark:rounded-none dark:mask-t-from-88% dark:mask-r-from-90% dark:mask-b-from-85% dark:mask-l-from-93% lg:dark:mask-r-from-100%">
        <Image
          src={heroShowcase.src}
          alt={heroShowcase.alt}
          width={heroShowcase.width}
          height={heroShowcase.height}
          /* The rendered width of the whole image, not of the box: the box
             shows about 64% of it from `lg` and 48% below, so the image is
             1.56x and 2.08x the box. From `lg` the line is fitted to the
             dark theme's edge-to-edge box, the larger of the two. */
          sizes="(min-width: 1024px) calc(78vw - 75px), (min-width: 720px) 1400px, calc(208vw - 4rem)"
          /* Eager because from `lg` it is above the fold. Not
             `fetchPriority="high"`: it is not the LCP even there, because it
             first paints at opacity 0, and on a phone, where it sits below the
             fold, a high priority fetch only competed with the fonts. Chrome
             raises it once layout puts it in the viewport. */
          loading="eager"
          className={CROP}
        />
      </div>
    </div>
  );
}
