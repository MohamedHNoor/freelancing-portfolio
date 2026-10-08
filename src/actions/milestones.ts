"use server";

import { z } from "zod";
import { milestoneInputSchema, reorderMilestonesSchema } from "@/lib/validation/milestone";
import { planPresetSchema } from "@/lib/validation/project";
import { ownerAction } from "@/server/owner-action";
import { revalidateProject } from "@/server/revalidate";
import * as plan from "@/server/services/payment-plan";
import type { ActionResult } from "@/types/action";

const projectMessages = {
  NOT_FOUND: "That project could not be found.",
  CONFLICT: "That change is no longer possible for this project.",
};

const milestoneMessages = {
  NOT_FOUND: "That milestone could not be found.",
  CONFLICT: "That change is no longer possible for this project.",
};

type PlanResult = ActionResult<{ projectId: string }>;
type MilestoneResult = ActionResult<{ projectId: string; milestoneId: string }>;

export async function createMilestone(projectId: unknown, raw: unknown): Promise<MilestoneResult> {
  return ownerAction(
    { label: ["milestones", "createMilestone"], schema: milestoneInputSchema, id: projectId, messages: projectMessages },
    raw,
    async ({ owner, id }, values) => {
      const result = await plan.createMilestone(owner.userId, id, values);
      revalidateProject(result);
      return { projectId: result.projectId, milestoneId: result.milestoneId };
    },
  );
}

export async function applyPlanPreset(projectId: unknown, raw: unknown): Promise<PlanResult> {
  return ownerAction(
    { label: ["milestones", "applyPlanPreset"], schema: planPresetSchema, id: projectId, messages: projectMessages },
    raw,
    async ({ owner, id }, preset) => {
      revalidateProject(await plan.applyPlanPreset(owner.userId, id, preset));
      return { projectId: id };
    },
  );
}

export async function reorderMilestones(projectId: unknown, raw: unknown): Promise<PlanResult> {
  return ownerAction(
    { label: ["milestones", "reorderMilestones"], schema: reorderMilestonesSchema, id: projectId, messages: projectMessages },
    raw,
    async ({ owner, id }, { ids }) => {
      revalidateProject(await plan.reorderMilestones(owner.userId, id, ids));
      return { projectId: id };
    },
  );
}

export async function updateMilestone(milestoneId: unknown, raw: unknown): Promise<MilestoneResult> {
  return ownerAction(
    { label: ["milestones", "updateMilestone"], schema: milestoneInputSchema, id: milestoneId, messages: milestoneMessages },
    raw,
    async ({ owner, id }, values) => {
      const result = await plan.updateMilestone(owner.userId, id, values);
      revalidateProject(result);
      return { projectId: result.projectId, milestoneId: result.milestoneId };
    },
  );
}

type MilestoneOnly = (ownerId: string, milestoneId: string) => Promise<{ projectId: string; clientId: string; milestoneId: string }>;

function milestoneCommand(name: string, run: MilestoneOnly) {
  return (milestoneId: unknown): Promise<MilestoneResult> =>
    ownerAction(
      { label: ["milestones", name], schema: z.undefined(), id: milestoneId, messages: milestoneMessages },
      undefined,
      async ({ owner, id }) => {
        const result = await run(owner.userId, id);
        revalidateProject(result);
        return { projectId: result.projectId, milestoneId: result.milestoneId };
      },
    );
}

export async function deleteMilestone(milestoneId: unknown): Promise<MilestoneResult> {
  return milestoneCommand("deleteMilestone", plan.deleteMilestone)(milestoneId);
}

export async function cancelMilestone(milestoneId: unknown): Promise<MilestoneResult> {
  return milestoneCommand("cancelMilestone", plan.cancelMilestone)(milestoneId);
}

export async function restoreMilestone(milestoneId: unknown): Promise<MilestoneResult> {
  return milestoneCommand("restoreMilestone", plan.restoreMilestone)(milestoneId);
}
