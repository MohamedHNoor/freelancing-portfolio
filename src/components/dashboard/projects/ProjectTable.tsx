import Link from "next/link";
import { MoneyAmount } from "@/components/dashboard/shared/MoneyAmount";
import { ProjectStatusBadge } from "@/components/dashboard/projects/ProjectStatusBadge";
import { formatMoney } from "@/lib/money";
import type { ProjectListItem } from "@/server/queries/projects";

/** A server component: amounts are formatted here, in each project's own currency. */
export function ProjectTable({
  rows,
  caption,
  showClient = true,
}: {
  rows: ProjectListItem[];
  caption: string;
  showClient?: boolean;
}) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="workspace-surface overflow-x-auto rounded-xl border border-border bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <table className="w-full min-w-[40rem] text-left text-workspace-body">
        <caption className="sr-only">{caption}, newest first</caption>
        <thead className="border-b border-border text-workspace-sm text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Project</th>
            {showClient && <th scope="col" className="px-4 py-3 font-medium">Client</th>}
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
            <th scope="col" className="px-4 py-3 font-medium">Payment plan</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="px-4 py-3 align-top font-normal">
                <Link
                  href={`/dashboard/projects/${row.id}`}
                  className="inline-flex min-h-11 items-center break-words font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {row.name}
                </Link>
              </th>
              {showClient && (
                <td className="px-4 py-3 align-top">
                  <Link
                    href={`/dashboard/clients/${row.client.id}`}
                    className="inline-flex min-h-11 items-center text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {row.client.displayName}
                  </Link>
                </td>
              )}
              <td className="px-4 py-3 align-middle">
                <ProjectStatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3 text-right align-middle">
                <MoneyAmount value={formatMoney(row.totalAmountMinor, row.currency)} />
              </td>
              <td className="px-4 py-3 align-middle text-workspace-sm">
                {row.plan.balanced ? (
                  <span>Balanced</span>
                ) : (
                  <span className="text-muted-foreground">
                    <MoneyAmount value={formatMoney(row.plan.unallocated, row.currency)} /> unallocated
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
