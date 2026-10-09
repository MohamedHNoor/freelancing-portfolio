import "server-only";
import { getDb } from "@/db";
import type { Milestone, Project, ProjectStatus } from "@/generated/prisma/client";
import { calendarDateFromDb } from "@/lib/dates";
import { clientDisplayName } from "@/lib/dashboard/clients";
import type { ProjectStatusFilter } from "@/lib/dashboard/projects";
import {
  developmentProgress,
  milestoneProgress,
  planSummary,
  projectFigures,
  type PlanSummary,
  type ProjectFigures,
} from "@/lib/finance";
import { minorFromDb, type Currency } from "@/lib/money";
import { ownedClient, ownedProject } from "@/lib/permissions";

/* Read models for the project screens. Every query filters by the owner in the
   query itself, and returns plain numbers and calendar strings: pages format
   money and dates on the server, and no client component computes money. */

export type ProjectListItem = {
  id: string;
  name: string;
  status: ProjectStatus;
  currency: Currency;
  totalAmountMinor: number;
  client: { id: string; displayName: string };
  plan: PlanSummary;
};

const listSelect = {
  id: true,
  name: true,
  status: true,
  currency: true,
  totalAmountMinor: true,
  client: { select: { id: true, name: true, companyName: true } },
  milestones: { select: { status: true, amountMinor: true } },
} as const;

type ListRow = Pick<Project, "id" | "name" | "status" | "currency" | "totalAmountMinor"> & {
  client: { id: string; name: string; companyName: string | null };
  milestones: Pick<Milestone, "status" | "amountMinor">[];
};

function toListItem(row: ListRow): ProjectListItem {
  const totalAmountMinor = minorFromDb(row.totalAmountMinor);
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    currency: row.currency,
    totalAmountMinor,
    client: { id: row.client.id, displayName: clientDisplayName(row.client) },
    plan: planSummary(
      totalAmountMinor,
      row.milestones.map((m) => ({ status: m.status, amountMinor: minorFromDb(m.amountMinor) })),
    ),
  };
}

const newestFirst = [{ createdAt: "desc" }, { id: "asc" }] as const;

/** The owner's projects, newest first, optionally with one status only. */
export async function listProjects(
  ownerId: string,
  { status }: { status: ProjectStatusFilter },
): Promise<ProjectListItem[]> {
  const rows = await getDb().project.findMany({
    where: { ownerId, ...(status === "all" ? {} : { status }) },
    orderBy: [...newestFirst],
    select: listSelect,
  });
  return rows.map(toListItem);
}

/** One client's projects, newest first. Another owner's client raises `NotFoundError`. */
export async function listClientProjects(ownerId: string, clientId: string): Promise<ProjectListItem[]> {
  const db = getDb();
  const client = await ownedClient(db, ownerId, clientId);
  const rows = await db.project.findMany({
    where: { ownerId, clientId: client.id },
    orderBy: [...newestFirst],
    select: listSelect,
  });
  return rows.map(toListItem);
}

export type ProjectClientOption = { id: string; displayName: string; defaultCurrency: Currency };

/** The owner's active clients a new project can belong to, by name. */
export async function listProjectClients(ownerId: string): Promise<ProjectClientOption[]> {
  const clients = await getDb().client.findMany({
    where: { ownerId, archivedAt: null },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: { id: true, name: true, companyName: true, defaultCurrency: true },
  });
  return clients.map((client) => ({
    id: client.id,
    displayName: clientDisplayName(client),
    defaultCurrency: client.defaultCurrency,
  }));
}

export type MilestoneView = {
  id: string;
  name: string;
  description: string | null;
  position: number;
  billingTrigger: Milestone["billingTrigger"];
  pricingMode: Milestone["pricingMode"];
  percentageBps: number | null;
  amountMinor: number;
  status: Milestone["status"];
  dueDate: string | null;
  /** Work progress in whole percent. */
  progress: number;
};

export type ProjectView = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  currency: Currency;
  totalAmountMinor: number;
  startDate: string | null;
  expectedEndDate: string | null;
  client: { id: string; displayName: string; archived: boolean };
  milestones: MilestoneView[];
  plan: PlanSummary;
  figures: ProjectFigures;
  developmentProgress: number;
  /** The service's activation guard: a draft whose plan allocates the total exactly. */
  canActivate: boolean;
  /** The service's completion guard: active, with every non-cancelled milestone completed. */
  canComplete: boolean;
};

/** One of the owner's projects with its client and plan, or `NotFoundError`. */
export async function getProjectView(ownerId: string, projectId: string): Promise<ProjectView> {
  const db = getDb();
  const project = await ownedProject(db, ownerId, projectId);
  const [client, rows] = await Promise.all([
    db.client.findFirstOrThrow({
      where: { id: project.clientId, ownerId },
      select: { id: true, name: true, companyName: true, archivedAt: true },
    }),
    db.milestone.findMany({ where: { projectId: project.id }, orderBy: [{ position: "asc" }, { id: "asc" }] }),
  ]);

  const totalAmountMinor = minorFromDb(project.totalAmountMinor);
  const milestones: MilestoneView[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    position: row.position,
    billingTrigger: row.billingTrigger,
    pricingMode: row.pricingMode,
    percentageBps: row.percentageBps,
    amountMinor: minorFromDb(row.amountMinor),
    status: row.status,
    dueDate: calendarDateFromDb(row.dueDate),
    // Tasks arrive with feature 19; until then a milestone's progress comes from its status alone.
    progress: milestoneProgress({ status: row.status, doneTasks: 0, activeTasks: 0 }),
  }));
  const plan = planSummary(totalAmountMinor, milestones);

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    currency: project.currency,
    totalAmountMinor,
    startDate: calendarDateFromDb(project.startDate),
    expectedEndDate: calendarDateFromDb(project.expectedEndDate),
    client: { id: client.id, displayName: clientDisplayName(client), archived: client.archivedAt !== null },
    milestones,
    plan,
    // Payments and requests arrive with features 20 and 21.
    figures: projectFigures({ totalMinor: totalAmountMinor, paidMinor: 0, requestedMinor: 0 }),
    developmentProgress: developmentProgress(milestones),
    canActivate: project.status === "draft" && plan.balanced,
    canComplete:
      project.status === "active" &&
      milestones.every((m) => m.status === "cancelled" || m.status === "completed"),
  };
}
