import {
  siDocker,
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
  siShadcnui,
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
  shadcn: siShadcnui,
  supabase: siSupabase,
  tailwind: siTailwindcss,
  typescript: siTypescript,
  vercel: siVercel,
  vitest: siVitest,
  zod: siZod,
};

export function hasTechIcon(icon: string | undefined): boolean {
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
