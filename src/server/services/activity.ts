import "server-only";
import type { ActivityActor, Prisma } from "@/generated/prisma/client";
import type { Db } from "@/lib/permissions";
import { activityDataSchema, type ActivityPayload } from "@/lib/validation/activity";

export type ActivityEntry = ActivityPayload & {
  ownerId: string;
  actor: ActivityActor;
  /** Rendered now, so the record still reads correctly after later renames. */
  summary: string;
  clientId?: string | null;
  projectId?: string | null;
  milestoneId?: string | null;
};

/**
 * The only write path for the append-only activity log. Call it inside the
 * transaction that makes the change it describes. Nothing updates or deletes
 * activity rows.
 */
export async function recordActivity(tx: Db, entry: ActivityEntry): Promise<void> {
  const { type, data } = activityDataSchema.parse({ type: entry.type, data: entry.data });
  await tx.activity.create({
    data: {
      ownerId: entry.ownerId,
      clientId: entry.clientId ?? null,
      projectId: entry.projectId ?? null,
      milestoneId: entry.milestoneId ?? null,
      type,
      actor: entry.actor,
      summary: entry.summary,
      data: data as Prisma.InputJsonObject,
    },
  });
}
