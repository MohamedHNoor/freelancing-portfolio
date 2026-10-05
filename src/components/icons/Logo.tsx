import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** Eager in the header, which is above the fold on every page. */
  loading?: "eager" | "lazy";
};

/** MHN wordmark. Decorative, because every place it appears pairs it with the
 *  name in visually hidden text. */
/* Both theme variants are rendered and CSS shows one, because the theme is a
   class the pre-paint script sets, not `prefers-color-scheme`, so `<picture>`
   cannot choose. The hidden one costs under 2 KB. As `<img>` rather than
   inline SVG, the two files' identical gradient ids cannot collide.

   `width` is the 1200 x 420 viewBox scaled to `h-10`, rounded. */
export function Logo({ className, loading }: LogoProps) {
  return (
    <>
      <Image
        src="/assets/mhn-primary-light.svg"
        alt=""
        width={114}
        height={40}
        loading={loading}
        className={cn("h-10 w-auto dark:hidden", className)}
      />
      <Image
        src="/assets/mhn-primary-dark.svg"
        alt=""
        width={114}
        height={40}
        loading={loading}
        className={cn("hidden h-10 w-auto dark:block", className)}
      />
    </>
  );
}
