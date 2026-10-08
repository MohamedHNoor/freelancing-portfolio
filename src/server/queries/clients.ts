import "server-only";
import { getDb } from "@/db";
import type { Client } from "@/generated/prisma/client";
import { ownedClient } from "@/lib/permissions";

export type ClientListItem = Pick<
  Client,
  "id" | "name" | "companyName" | "email" | "countryCode" | "defaultCurrency" | "archivedAt"
>;

/** The owner's active or archived clients, by name. */
export async function listClients(ownerId: string, { archived }: { archived: boolean }): Promise<ClientListItem[]> {
  return getDb().client.findMany({
    where: { ownerId, archivedAt: archived ? { not: null } : null },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      companyName: true,
      email: true,
      countryCode: true,
      defaultCurrency: true,
      archivedAt: true,
    },
  });
}

/** One client of the owner's, or `NotFoundError`. */
export async function getClient(ownerId: string, clientId: string): Promise<Client> {
  return ownedClient(getDb(), ownerId, clientId);
}
