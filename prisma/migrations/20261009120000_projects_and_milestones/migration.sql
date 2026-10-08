-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('draft', 'active', 'on_hold', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "milestone_status" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "milestone_billing_trigger" AS ENUM ('upfront', 'on_completion');

-- CreateEnum
CREATE TYPE "milestone_pricing_mode" AS ENUM ('percentage', 'fixed');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "activity_type" ADD VALUE 'project_created';
ALTER TYPE "activity_type" ADD VALUE 'project_updated';
ALTER TYPE "activity_type" ADD VALUE 'project_status_changed';
ALTER TYPE "activity_type" ADD VALUE 'payment_plan_changed';
ALTER TYPE "activity_type" ADD VALUE 'milestone_created';
ALTER TYPE "activity_type" ADD VALUE 'milestone_updated';
ALTER TYPE "activity_type" ADD VALUE 'milestone_cancelled';

-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "milestone_id" UUID,
ADD COLUMN     "project_id" UUID;

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "project_status" NOT NULL DEFAULT 'draft',
    "currency" "currency" NOT NULL,
    "total_amount_minor" BIGINT NOT NULL,
    "start_date" DATE,
    "expected_end_date" DATE,
    "activated_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,
    "billing_trigger" "milestone_billing_trigger" NOT NULL DEFAULT 'on_completion',
    "pricing_mode" "milestone_pricing_mode" NOT NULL,
    "percentage_bps" INTEGER,
    "amount_minor" BIGINT NOT NULL,
    "status" "milestone_status" NOT NULL DEFAULT 'pending',
    "due_date" DATE,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_owner_id_status_idx" ON "projects"("owner_id", "status");

-- CreateIndex
CREATE INDEX "projects_client_id_idx" ON "projects"("client_id");

-- CreateIndex
CREATE INDEX "milestones_project_id_position_idx" ON "milestones"("project_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "milestones_id_project_id_key" ON "milestones"("id", "project_id");

-- CreateIndex
CREATE INDEX "activities_project_id_occurred_at_idx" ON "activities"("project_id", "occurred_at" DESC);

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "neon_auth"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written: Prisma cannot express check constraints (blueprint/database-setup.md).
ALTER TABLE "projects" ADD CONSTRAINT "projects_total_amount_minor_check" CHECK ("total_amount_minor" > 0);
ALTER TABLE "projects" ADD CONSTRAINT "projects_dates_check" CHECK ("expected_end_date" >= "start_date");
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_position_check" CHECK ("position" >= 0);
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_percentage_bps_check" CHECK ("percentage_bps" BETWEEN 1 AND 10000);
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_amount_minor_check" CHECK ("amount_minor" > 0);
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_pricing_mode_check" CHECK (("pricing_mode" = 'percentage') = ("percentage_bps" IS NOT NULL));
