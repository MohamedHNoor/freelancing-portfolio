import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveIcon, PlusIcon, UsersIcon } from "lucide-react";
import { ClientTable, type ClientRow } from "@/components/dashboard/clients/ClientTable";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { clientDisplayName, parseClientView } from "@/lib/dashboard/clients";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { requireOwner } from "@/server/auth/session";
import { listClients } from "@/server/queries/clients";

export const metadata: Metadata = { title: "Clients" };

const VIEWS = [
  { view: "active", label: "Active", href: "/dashboard/clients" },
  { view: "archived", label: "Archived", href: "/dashboard/clients?view=archived" },
] as const;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const { userId } = await requireOwner();
  const view = parseClientView((await searchParams).view);
  const archived = view === "archived";
  const clients = await listClients(userId, { archived });

  const rows: ClientRow[] = clients.map((client) => ({
    id: client.id,
    displayName: clientDisplayName(client),
    contactName: client.companyName ? client.name : null,
    email: client.email,
    countryCode: client.countryCode,
    currency: client.defaultCurrency,
    archivedOn: client.archivedAt
      ? { label: formatDate(client.archivedAt), iso: client.archivedAt.toISOString() }
      : null,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-heading text-workspace-title font-semibold tracking-tight">Clients</h1>
          <p className="max-w-xl text-workspace-body leading-relaxed text-muted-foreground">
            The people and businesses you work for, with their billing details.
          </p>
        </div>
        <Button asChild className="min-h-11 px-4">
          <Link href="/dashboard/clients/new">
            <PlusIcon className="size-4" aria-hidden="true" />
            New client
          </Link>
        </Button>
      </div>

      <nav aria-label="Client views">
        <ul className="flex gap-2 text-workspace-sm">
          {VIEWS.map((item) => (
            <li key={item.view}>
              <Link
                href={item.href}
                aria-current={item.view === view ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-lg px-4 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  item.view === view
                    ? "bg-primary/10 font-medium text-brand ring-1 ring-inset ring-primary/15"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {rows.length > 0 ? (
        <ClientTable rows={rows} archived={archived} />
      ) : archived ? (
        <EmptyState
          Icon={ArchiveIcon}
          title="No archived clients"
          description="Clients you archive appear here, with the date they were archived."
        >
          <Button asChild variant="outline" className="min-h-11 px-4">
            <Link href="/dashboard/clients">View active clients</Link>
          </Button>
        </EmptyState>
      ) : (
        <EmptyState
          Icon={UsersIcon}
          title="No clients yet"
          description="Add a client with their contact and billing details before you set up their first project."
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
