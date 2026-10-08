import Link from "next/link";
import { CreditCardIcon, FolderKanbanIcon, SettingsIcon, ShieldCheckIcon } from "lucide-react";
import { Logo } from "@/components/icons/Logo";
import { WorkspaceNav } from "@/components/dashboard/shell/WorkspaceNav";

interface AppSidebarProps {
  name: string;
  onNavigate?: () => void;
}

const futureDestinations = [
  { label: "Projects", Icon: FolderKanbanIcon },
  { label: "Payments", Icon: CreditCardIcon },
  { label: "Settings", Icon: SettingsIcon },
] as const;

export function AppSidebar({
  name,
  onNavigate,
}: AppSidebarProps) {
  return (
    <div className="flex h-full flex-col gap-8 px-4 py-6">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex min-h-11 w-fit items-center rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card"
      >
        <Logo loading="eager" />
        <span className="sr-only">{name} home</span>
      </Link>

      <nav aria-label="Workspace navigation">
        <p className="mb-3 px-3 text-xs font-medium text-muted-foreground">Workspace</p>
        <WorkspaceNav onNavigate={onNavigate} />
        <p className="mb-3 mt-7 px-3 text-xs font-medium text-muted-foreground">Coming soon</p>
        <ul className="space-y-1.5">
          {futureDestinations.map(({ label, Icon }) => (
            <li key={label}>
              <span
                aria-disabled="true"
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-workspace-sm text-muted-foreground"
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto flex items-center gap-2 border-t border-border px-1 pt-5 text-xs text-muted-foreground">
        <ShieldCheckIcon className="size-4 shrink-0" aria-hidden="true" />
        Owner workspace
      </div>
    </div>
  );
}
