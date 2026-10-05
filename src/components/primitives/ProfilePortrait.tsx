import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ImageAsset } from "@/types/content";

type ProfilePortraitProps = {
  portrait: ImageAsset;
  /** Only where the portrait can be above the fold. Lazy is right on the home
   *  page, where the About section sits far below it. */
  loading?: "eager" | "lazy";
  className?: string;
};

export function ProfilePortrait({
  portrait,
  loading,
  className,
}: ProfilePortraitProps) {
  return (
    <Image
      src={portrait.src}
      alt={portrait.alt}
      width={portrait.width}
      height={portrait.height}
      /* `max-w-60` keeps it at or under 15rem everywhere. */
      sizes="240px"
      loading={loading}
      className={cn(
        "aspect-square w-full max-w-60 rounded-xl object-cover ring-1 ring-foreground/10",
        className,
      )}
    />
  );
}
