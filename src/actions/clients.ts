"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clientInputSchema } from "@/lib/validation/client";
import { ownerAction } from "@/server/owner-action";
import * as clients from "@/server/services/clients";
import type { ActionResult } from "@/types/action";

const CLIENTS_PATH = "/dashboard/clients";

const messages = {
  NOT_FOUND: "That client could not be found.",
  CONFLICT: "This client is archived and can no longer be changed.",
};

type ClientResult = ActionResult<{ clientId: string }>;

function revalidateClient(clientId: string): void {
  revalidatePath(CLIENTS_PATH);
  revalidatePath(`${CLIENTS_PATH}/${clientId}`);
}

export async function createClient(raw: unknown): Promise<ClientResult> {
  return ownerAction({ label: ["clients", "createClient"], schema: clientInputSchema, messages }, raw, async ({ owner }, values) => {
    const { id } = await clients.createClient(owner.userId, values);
    revalidateClient(id);
    return { clientId: id };
  });
}

export async function updateClient(clientId: unknown, raw: unknown): Promise<ClientResult> {
  return ownerAction(
    { label: ["clients", "updateClient"], schema: clientInputSchema, id: clientId, messages },
    raw,
    async ({ owner, id }, values) => {
      await clients.updateClient(owner.userId, id, values);
      revalidateClient(id);
      return { clientId: id };
    },
  );
}

export async function archiveClient(clientId: unknown): Promise<ClientResult> {
  return ownerAction(
    { label: ["clients", "archiveClient"], schema: z.undefined(), id: clientId, messages },
    undefined,
    async ({ owner, id }) => {
      await clients.archiveClient(owner.userId, id);
      revalidateClient(id);
      return { clientId: id };
    },
  );
}
