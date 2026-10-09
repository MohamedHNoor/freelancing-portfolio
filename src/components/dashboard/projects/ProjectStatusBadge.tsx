import type { ProjectStatus } from "@/generated/prisma/enums";
import { StatusBadge, type StatusTone } from "@/components/dashboard/shared/StatusBadge";
import { PROJECT_STATUS_LABELS } from "@/lib/dashboard/projects";

const TONES: Record<ProjectStatus, StatusTone> = {
  draft: "neutral",
  active: "brand",
  on_hold: "info",
  completed: "success",
  cancelled: "danger",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <StatusBadge label={PROJECT_STATUS_LABELS[status]} tone={TONES[status]} />;
}
