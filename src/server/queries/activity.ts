import "server-only";
import { getDb } from "@/db";
import type { Activity } from "@/generated/prisma/client";
import { ownedClient } from "@/lib/permissions";

export const CLIENT_ACTIVITY_LIMIT = 50;

export type ActivityListItem = Pick<Activity, "id" | "type" | "summary" | "occurredAt">;

/** The most recent activity for one of the owner's clients, newest first. */
export async function listClientActivity(ownerId: string, clientId: string): Promise<ActivityListItem[]> {
  const db = getDb();
  const client = await ownedClient(db, ownerId, clientId);
  return db.activity.findMany({
    where: { ownerId, clientId: client.id },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    take: CLIENT_ACTIVITY_LIMIT,
    select: { id: true, type: true, summary: true, occurredAt: true },
  });
}
