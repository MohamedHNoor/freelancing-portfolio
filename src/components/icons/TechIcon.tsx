import {
  siDocker,
  siFigma,
  siDrizzle,
  siExpress,
  siGit,
  siGithubactions,
  siJavascript,
  siMongodb,
  siNeon,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siPrisma,
  siReact,
  siReacthookform,
  siRedux,
  siShadcnui,
  siStripe,
  siSupabase,
  siTailwindcss,
  siTypescript,
  siVercel,
  siVitest,
  siZod,
} from "simple-icons";

/* Keyed by `Skill.icon` in the content layer. Marks are drawn in currentColor
   rather than each brand's own hex: several of these are near-black or
   near-white, so brand colour would make them disappear in one theme or the
   other, and a single tone reads as one set rather than a sticker sheet. */
const MARKS: Record<string, { title: string; path: string }> = {
  docker: siDocker,
  drizzle: siDrizzle,
  express: siExpress,
  figma: siFigma,
  git: siGit,
  "github-actions": siGithubactions,
  javascript: siJavascript,
  mongodb: siMongodb,
  neon: siNeon,
  nextjs: siNextdotjs,
  nodejs: siNodedotjs,
  postgresql: siPostgresql,
  prisma: siPrisma,
  react: siReact,
  "react-hook-form": siReacthookform,
  redux: siRedux,
  shadcn: siShadcnui,
  stripe: siStripe,
  supabase: siSupabase,
  tailwind: siTailwindcss,
  typescript: siTypescript,
  vercel: siVercel,
  vitest: siVitest,
  zod: siZod,
};

/** A type predicate, not a plain boolean: the whole point of the check is to
 *  establish that `icon` is a key this registry can draw, so callers should not
 *  have to assert it again. */
export function hasTechIcon(icon: string | undefined): icon is string {
  return icon !== undefined && icon in MARKS;
}

type TechIconProps = {
  icon: string;
  className?: string;
};

/** Decorative: the technology name always sits beside it as real text. */
export function TechIcon({ icon, className }: TechIconProps) {
  const mark = MARKS[icon];

  if (!mark) {
    return null;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={mark.path} />
    </svg>
  );
}
