import "server-only";
import { getDb } from "@/db";
import type { Prisma, ProjectStatus } from "@/generated/prisma/client";
import { calendarDateFromDb, calendarDateToDb } from "@/lib/dates";
import { planSummary } from "@/lib/finance";
import { minorFromDb, minorToDb } from "@/lib/money";
import { computePlan } from "@/lib/payment-plan";
import { ConflictError, ValidationError, ownedClient, ownedProject } from "@/lib/permissions";
import { nextProjectStatus } from "@/lib/state/project";
import {
  PROJECT_FIELDS,
  type ProjectStatusAction,
  type ProjectUpdateValues,
  type ProjectValues,
} from "@/lib/validation/project";
import { recordActivity } from "@/server/services/activity";
import { assertPlanEditable, insertPreset, planRows, toEntry, writeAmounts } from "@/server/services/payment-plan";

type ProjectResult = { projectId: string; clientId: string };

function detailsData(values: ProjectUpdateValues) {
  return {
    name: values.name,
    description: values.description,
    currency: values.currency,
    totalAmountMinor: minorToDb(values.totalAmountMinor),
    startDate: calendarDateToDb(values.startDate),
    expectedEndDate: calendarDateToDb(values.expectedEndDate),
  };
}

/** Creates a draft project for one of the owner's active clients, optionally with a preset plan. */
export async function createProject(ownerId: string, values: ProjectValues): Promise<ProjectResult> {
  return getDb().$transaction(async (tx) => {
    // Locked so the client cannot be archived while its project is being created.
    const client = await ownedClient(tx, ownerId, values.clientId, { forUpdate: true });
    if (client.archivedAt !== null) throw new ConflictError();

    const project = await tx.project.create({ data: { ...detailsData(values), ownerId, clientId: client.id } });
    if (values.preset !== null) await insertPreset(tx, project, values.preset);

    await recordActivity(tx, {
      ownerId,
      clientId: client.id,
      projectId: project.id,
      actor: "owner",
      type: "project_created",
      data: {},
      summary: `Created project ${values.name}`,
    });
    return { projectId: project.id, clientId: client.id };
  });
}

/**
 * Saves changed fields only. A new total re-allocates the percentage milestones
 * and is refused when the plan would no longer fit.
 */
export async function updateProject(ownerId: string, projectId: string, values: ProjectUpdateValues): Promise<ProjectResult> {
  return getDb().$transaction(async (tx) => {
    const current = await ownedProject(tx, ownerId, projectId, { forUpdate: true });
    assertPlanEditable(current);
    // Feature 20: lock the currency once a payment request exists.

    const before: ProjectUpdateValues = {
      name: current.name,
      description: current.description,
      currency: current.currency,
      totalAmountMinor: minorFromDb(current.totalAmountMinor),
      startDate: calendarDateFromDb(current.startDate),
      expectedEndDate: calendarDateFromDb(current.expectedEndDate),
    };
    const changedFields = PROJECT_FIELDS.filter((field) => before[field] !== values[field]);
    const [first, ...rest] = changedFields;
    if (first === undefined) return { projectId: current.id, clientId: current.clientId };

    if (values.totalAmountMinor !== before.totalAmountMinor) {
      const rows = await planRows(tx, current.id);
      const plan = computePlan(values.totalAmountMinor, rows.map(toEntry));
      if (!plan.ok) {
        throw new ValidationError({
          total:
            plan.reason === "over_allocated"
              ? ["The payment plan already allocates more than this total."]
              : ["This total is too small for the plan's percentages."],
        });
      }
      await writeAmounts(tx, rows, plan.amounts);
    }

    await tx.project.update({ where: { id: current.id }, data: detailsData(values) });
    await recordActivity(tx, {
      ownerId,
      clientId: current.clientId,
      projectId: current.id,
      actor: "owner",
      type: "project_updated",
      data: { changedFields: [first, ...rest] },
      summary: `Updated project ${values.name}`,
    });
    return { projectId: current.id, clientId: current.clientId };
  });
}

const STATUS_VERBS: Record<ProjectStatusAction, string> = {
  activate: "Activated",
  pause: "Paused",
  resume: "Resumed",
  complete: "Completed",
  reopen: "Reopened",
  cancel: "Cancelled",
};

function timestampsFor(action: ProjectStatusAction, now: Date): Prisma.ProjectUpdateManyMutationInput {
  switch (action) {
    case "activate":
      return { activatedAt: now };
    case "complete":
      return { completedAt: now };
    case "reopen":
      return { completedAt: null };
    case "cancel":
      return { cancelledAt: now };
    default:
      return {};
  }
}

/**
 * Moves a project through its state machine. Activation needs a plan that
 * allocates the total exactly; completion needs every non-cancelled milestone
 * completed. The write is conditional on the status read under the lock.
 */
export async function changeProjectStatus(
  ownerId: string,
  projectId: string,
  action: ProjectStatusAction,
): Promise<ProjectResult> {
  return getDb().$transaction(async (tx) => {
    const current = await ownedProject(tx, ownerId, projectId, { forUpdate: true });
    const to: ProjectStatus | null = nextProjectStatus(current.status, action);
    if (to === null) throw new ConflictError();

    if (action === "activate" || action === "complete") {
      const rows = await planRows(tx, current.id);
      if (action === "activate") {
        const summary = planSummary(minorFromDb(current.totalAmountMinor), rows.map(toEntry));
        if (!summary.balanced) throw new ConflictError();
      } else if (rows.some((row) => row.status !== "cancelled" && row.status !== "completed")) {
        throw new ConflictError();
      }
    }
    // Feature 20: cancelling also cancels open payment requests and expires their sessions.

    const { count } = await tx.project.updateMany({
      where: { id: current.id, status: current.status },
      data: { status: to, ...timestampsFor(action, new Date()) },
    });
    if (count !== 1) throw new ConflictError();

    await recordActivity(tx, {
      ownerId,
      clientId: current.clientId,
      projectId: current.id,
      actor: "owner",
      type: "project_status_changed",
      data: { from: current.status, to },
      summary: `${STATUS_VERBS[action]} project ${current.name}`,
    });
    return { projectId: current.id, clientId: current.clientId };
  });
}

/**
 * Deletes a draft project with its milestones and activity, which cascade. No
 * activity is recorded: a project record would be deleted with the project.
 */
export async function deleteProject(ownerId: string, projectId: string): Promise<ProjectResult> {
  return getDb().$transaction(async (tx) => {
    const current = await ownedProject(tx, ownerId, projectId, { forUpdate: true });
    if (current.status !== "draft") throw new ConflictError();
    // Feature 20: also refuse when any payment request has ever existed.

    const { count } = await tx.project.deleteMany({ where: { id: current.id, ownerId, status: "draft" } });
    if (count !== 1) throw new ConflictError();
    return { projectId: current.id, clientId: current.clientId };
  });
}
