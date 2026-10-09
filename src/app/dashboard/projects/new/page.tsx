import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, UsersIcon } from "lucide-react";
import { NewProjectForm } from "@/components/dashboard/projects/ProjectForm";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { requireOwner } from "@/server/auth/session";
import { listProjectClients } from "@/server/queries/projects";

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string | string[] }>;
}) {
  const { userId } = await requireOwner();
  const [clients, { clientId }] = await Promise.all([listProjectClients(userId), searchParams]);
  // Only a client from the owner's own active list can be preselected.
  const defaultClientId = clients.find((client) => client.id === clientId)?.id ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-workspace-title font-semibold tracking-tight">New project</h1>
        <p className="text-workspace-body leading-relaxed text-muted-foreground">
          Choose the client, set the total, and start the payment plan from a preset or from scratch. The project
          starts as a draft until its plan balances.
        </p>
      </div>
      {clients.length > 0 ? (
        <NewProjectForm clients={clients} defaultClientId={defaultClientId} />
      ) : (
        <EmptyState
          Icon={UsersIcon}
          title="Add a client first"
          description="Every project belongs to a client. Add one with their billing currency, then create the project."
        >
          <Button asChild className="min-h-11 px-4">
            <Link href="/dashboard/clients/new">
              <PlusIcon className="size-4" aria-hidden="true" />
              New client
            </Link>
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
