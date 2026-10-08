import { z } from "zod";
import { clientFieldSchema } from "@/lib/validation/client";
import { milestoneFieldSchema } from "@/lib/validation/milestone";
import { projectFieldSchema, projectStatusSchema } from "@/lib/validation/project";

const empty = z.object({}).strict();

/** The typed `data` payload of each activity type. Field names only, never values. */
export const activityDataSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("client_created"), data: empty }),
  z.object({
    type: z.literal("client_updated"),
    data: z.object({ changedFields: z.array(clientFieldSchema).nonempty() }).strict(),
  }),
  z.object({ type: z.literal("client_archived"), data: empty }),
  z.object({ type: z.literal("project_created"), data: empty }),
  z.object({
    type: z.literal("project_updated"),
    data: z.object({ changedFields: z.array(projectFieldSchema).nonempty() }).strict(),
  }),
  z.object({
    type: z.literal("project_status_changed"),
    data: z.object({ from: projectStatusSchema, to: projectStatusSchema }).strict(),
  }),
  z.object({
    type: z.literal("payment_plan_changed"),
    data: z
      .object({ change: z.enum(["preset_applied", "reordered", "milestone_deleted", "milestone_restored"]) })
      .strict(),
  }),
  z.object({ type: z.literal("milestone_created"), data: empty }),
  z.object({
    type: z.literal("milestone_updated"),
    data: z.object({ changedFields: z.array(milestoneFieldSchema).nonempty() }).strict(),
  }),
  z.object({ type: z.literal("milestone_cancelled"), data: empty }),
]);

export type ActivityPayload = z.infer<typeof activityDataSchema>;
export type ActivityTypeName = ActivityPayload["type"];
