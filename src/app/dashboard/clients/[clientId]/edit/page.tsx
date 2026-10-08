import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ClientForm } from "@/components/dashboard/clients/ClientForm";
import { clientFormValues } from "@/lib/dashboard/clients";
import { NotFoundError } from "@/lib/permissions";
import { requireOwner } from "@/server/auth/session";
import { getClient } from "@/server/queries/clients";

export const metadata: Metadata = { title: "Edit client" };

export default async function EditClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { userId } = await requireOwner();
  const { clientId } = await params;

  let client;
  try {
    client = await getClient(userId, clientId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  // Archived clients are read-only; their page explains why.
  if (client.archivedAt !== null) redirect(`/dashboard/clients/${client.id}`);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-workspace-title font-semibold tracking-tight">Edit client</h1>
        <p className="text-workspace-body leading-relaxed text-muted-foreground">
          Changes are saved to this client and recorded in its activity.
        </p>
      </div>
      <ClientForm mode="edit" clientId={client.id} defaultValues={clientFormValues(client)} />
    </div>
  );
}
