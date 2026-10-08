import type { Metadata } from "next";
import { ClientForm } from "@/components/dashboard/clients/ClientForm";
import { requireOwner } from "@/server/auth/session";

export const metadata: Metadata = { title: "New client" };

export default async function NewClientPage() {
  await requireOwner();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-workspace-title font-semibold tracking-tight">New client</h1>
        <p className="text-workspace-body leading-relaxed text-muted-foreground">
          Contact and billing details. Only the name, email and currency are required.
        </p>
      </div>
      <ClientForm mode="create" />
    </div>
  );
}
