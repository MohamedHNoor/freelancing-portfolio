import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import { ArchiveClientButton, CLIENT_STATUS_ID } from "@/components/dashboard/clients/ArchiveClientButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addressLines, clientDisplayName } from "@/lib/dashboard/clients";
import { formatDate, formatDateTime } from "@/lib/dates";
import { CURRENCY_NAMES } from "@/lib/money";
import { NotFoundError } from "@/lib/permissions";
import { requireOwner } from "@/server/auth/session";
import { CLIENT_ACTIVITY_LIMIT, listClientActivity } from "@/server/queries/activity";
import { getClient } from "@/server/queries/clients";

export const metadata: Metadata = { title: "Client" };

/** Missing, malformed and other owners' ids all become the scoped 404. */
async function loadOrNotFound<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export default async function ClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { userId } = await requireOwner();
  const { clientId } = await params;
  const client = await loadOrNotFound(() => getClient(userId, clientId));
  const activity = await loadOrNotFound(() => listClientActivity(userId, client.id));

  const displayName = clientDisplayName(client);
  const archived = client.archivedAt !== null;
  const address = addressLines(client);

  const details: { term: string; value: ReactNode }[] = [
    { term: "Contact name", value: client.name },
    {
      term: "Email",
      value: (
        <a href={`mailto:${client.email}`} className="break-all text-brand underline underline-offset-4">
          {client.email}
        </a>
      ),
    },
    { term: "Phone", value: client.phone },
    { term: "Company", value: client.companyName },
    { term: "Country", value: client.countryCode },
    { term: "Default currency", value: `${client.defaultCurrency} · ${CURRENCY_NAMES[client.defaultCurrency]}` },
    {
      term: "Address",
      value: address.length > 0 ? address.map((line, index) => <span key={index} className="block">{line}</span>) : null,
    },
    { term: "Notes", value: client.notes ? <span className="whitespace-pre-line">{client.notes}</span> : null },
  ];

  return (
    <div className="space-y-8">
      <Link
        href={archived ? "/dashboard/clients?view=archived" : "/dashboard/clients"}
        className="inline-flex min-h-11 items-center gap-2 rounded text-workspace-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        {archived ? "Archived clients" : "Clients"}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="break-words font-heading text-workspace-title font-semibold tracking-tight">{displayName}</h1>
            {archived && <Badge variant="secondary">Archived</Badge>}
          </div>
          {client.companyName && <p className="text-workspace-body text-muted-foreground">{client.name}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          {!archived && (
            <Button asChild variant="outline" className="min-h-11 px-4">
              <Link href={`/dashboard/clients/${client.id}/edit`}>
                <PencilIcon className="size-4" aria-hidden="true" />
                Edit client
              </Link>
            </Button>
          )}
          <ArchiveClientButton clientId={client.id} displayName={displayName} archived={archived} />
        </div>
      </div>

      {client.archivedAt && (
        <p
          id={CLIENT_STATUS_ID}
          role="status"
          tabIndex={-1}
          className="rounded-lg bg-info-soft p-3 text-workspace-body leading-relaxed text-info outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Archived on <time dateTime={client.archivedAt.toISOString()}>{formatDate(client.archivedAt)}</time>.
          Archived clients can&apos;t be edited.
        </p>
      )}

      <section aria-labelledby="client-details-heading" className="workspace-surface rounded-2xl border border-border bg-card px-5 py-6 sm:px-8">
        <h2 id="client-details-heading" className="mb-5 font-heading text-lg font-semibold">Details</h2>
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {details.map(({ term, value }) => (
            <div key={term} className="min-w-0 space-y-1">
              <dt className="text-workspace-sm text-muted-foreground">{term}</dt>
              <dd className="text-workspace-body">
                {value ?? <span className="text-muted-foreground">Not provided</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="client-activity-heading" className="workspace-surface rounded-2xl border border-border bg-card px-5 py-6 sm:px-8">
        <h2 id="client-activity-heading" className="mb-5 font-heading text-lg font-semibold">Activity</h2>
        {activity.length === 0 ? (
          <p className="text-workspace-body text-muted-foreground">No activity yet.</p>
        ) : (
          <>
            <ol className="space-y-4">
              {activity.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <span className="text-workspace-body">{entry.summary}</span>
                  <time dateTime={entry.occurredAt.toISOString()} className="shrink-0 text-workspace-sm text-muted-foreground">
                    {formatDateTime(entry.occurredAt)}
                  </time>
                </li>
              ))}
            </ol>
            {activity.length >= CLIENT_ACTIVITY_LIMIT && (
              <p className="mt-5 text-workspace-sm text-muted-foreground">
                Showing the {CLIENT_ACTIVITY_LIMIT} most recent changes.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
