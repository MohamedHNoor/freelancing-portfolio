import type { Project } from "@/types/content";

/** What must be true before this site is allowed into production.
 *
 *  `project-plan.md` states the one rule as an absolute: "No project may ship to
 *  production with it set." Nothing enforced it until this module, and the
 *  failure mode it prevents is the one this whole project was built to avoid -
 *  fictional case studies presented to a buyer as delivered work. */

export type DeployBlocker = {
  /** Stable and machine-readable. A new blocker is a new id, never a change to
   *  an existing one. */
  id: "placeholder-projects";
  /** The sentence the build error prints. */
  message: string;
};

export type DeployEnv = {
  /** Vercel's system variable: "production", "preview", or "development". */
  VERCEL_ENV?: string;
};

/** True only for a real production deploy.
 *
 *  Preview deploys are deliberately not gated. Seeded content is exactly what a
 *  preview is for while the real projects are still being written, and blocking
 *  those would remove the only convenient way to review this site before launch.
 *  Anything that is not the exact string "production", including unset, is not a
 *  production deploy. */
export function isProductionDeploy(env: DeployEnv): boolean {
  return env.VERCEL_ENV === "production";
}

/** Every reason this content must not reach production, in a stable order.
 *
 *  Takes its input as a parameter rather than importing the content, so the
 *  failure cases are testable against fixtures. `assertContentInvariants` in
 *  `src/content/index.ts` takes its input the same way and for the same reason.
 *
 *  Deliberately narrow. The overview records that nothing mechanically guards
 *  the seeded roles or the placeholder skill context, and inventing a guard for
 *  them here would block a deploy on a rule nobody agreed to. Those stay human
 *  checks on the smoke list. */
export function findDeployBlockers({
  projects,
}: {
  projects: readonly Project[];
}): readonly DeployBlocker[] {
  const seeded = projects.filter((project) => project.isPlaceholder);

  if (seeded.length === 0) {
    return [];
  }

  const slugs = seeded.map((project) => project.slug).join(", ");
  return [
    {
      id: "placeholder-projects",
      message: `${seeded.length} project${seeded.length === 1 ? "" : "s"} still marked isPlaceholder: ${slugs}. Seeded example projects must not ship to production. Replace them with real work, or set isPlaceholder to false once the case study describes something that actually happened.`,
    },
  ];
}

/** Throws when a production deploy carries content that must not ship.
 *
 *  Called at module scope from the content layer, so the build fails before any
 *  route renders rather than after a deploy succeeds. */
export function assertDeployable(input: {
  projects: readonly Project[];
  env: DeployEnv;
}): void {
  if (!isProductionDeploy(input.env)) {
    return;
  }

  const blockers = findDeployBlockers(input);
  if (blockers.length === 0) {
    return;
  }

  throw new Error(
    `Deploy blocked (VERCEL_ENV=production):\n${blockers
      .map((blocker) => `  - [${blocker.id}] ${blocker.message}`)
      .join("\n")}`,
  );
}
