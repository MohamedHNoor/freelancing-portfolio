/* The project state machine as a table. Guards that need the plan (activate
   needs a balanced plan, complete needs every milestone done) live in the
   service, which owns the data; this table only says which moves exist. */

import type { ProjectStatus } from "@/generated/prisma/enums";
import type { ProjectStatusAction } from "@/lib/validation/project";

export const PROJECT_TRANSITIONS: Readonly<Record<ProjectStatusAction, { from: readonly ProjectStatus[]; to: ProjectStatus }>> = {
  activate: { from: ["draft"], to: "active" },
  pause: { from: ["active"], to: "on_hold" },
  resume: { from: ["on_hold"], to: "active" },
  complete: { from: ["active"], to: "completed" },
  reopen: { from: ["completed"], to: "active" },
  cancel: { from: ["draft", "active", "on_hold"], to: "cancelled" },
};

/** The status `action` moves a project to from `from`, or null when the move does not exist. */
export function nextProjectStatus(from: ProjectStatus, action: ProjectStatusAction): ProjectStatus | null {
  const transition = PROJECT_TRANSITIONS[action];
  return transition.from.includes(from) ? transition.to : null;
}

/** Statuses in which the project details and its payment plan can still change. */
export const EDITABLE_PROJECT_STATUSES: readonly ProjectStatus[] = ["draft", "active", "on_hold"];
