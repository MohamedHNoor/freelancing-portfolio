import Link from "next/link";

export type ClientRow = {
  id: string;
  displayName: string;
  /** The contact person, shown under the company name when there is one. */
  contactName: string | null;
  email: string;
  countryCode: string | null;
  currency: string;
  archivedOn: { label: string; iso: string } | null;
};

export function ClientTable({ rows, archived }: { rows: ClientRow[]; archived: boolean }) {
  const caption = archived ? "Archived clients" : "Active clients";
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="workspace-surface overflow-x-auto rounded-xl border border-border bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <table className="w-full min-w-[40rem] text-left text-workspace-body">
        <caption className="sr-only">{caption}, by name</caption>
        <thead className="border-b border-border text-workspace-sm text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Client</th>
            <th scope="col" className="px-4 py-3 font-medium">Email</th>
            <th scope="col" className="px-4 py-3 font-medium">Country</th>
            <th scope="col" className="px-4 py-3 font-medium">Currency</th>
            {archived && <th scope="col" className="px-4 py-3 font-medium">Archived</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="px-4 py-3 align-top font-normal">
                <Link
                  href={`/dashboard/clients/${row.id}`}
                  className="inline-flex min-h-11 items-center font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {row.displayName}
                </Link>
                {row.contactName && (
                  <span className="block text-workspace-sm text-muted-foreground">{row.contactName}</span>
                )}
              </th>
              <td className="px-4 py-3 align-top break-all text-muted-foreground">{row.email}</td>
              <td className="px-4 py-3 align-top">{row.countryCode ?? <span className="text-muted-foreground">Not provided</span>}</td>
              <td className="px-4 py-3 align-top font-mono tabular-nums">{row.currency}</td>
              {archived && (
                <td className="px-4 py-3 align-top whitespace-nowrap">
                  {row.archivedOn && <time dateTime={row.archivedOn.iso}>{row.archivedOn.label}</time>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
