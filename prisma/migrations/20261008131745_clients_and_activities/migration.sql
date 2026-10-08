-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "currency" AS ENUM ('ZAR', 'NZD', 'AUD', 'USD', 'GBP');

-- CreateEnum
CREATE TYPE "activity_actor" AS ENUM ('owner', 'client', 'stripe', 'system');

-- CreateEnum
CREATE TYPE "activity_type" AS ENUM ('client_created', 'client_updated', 'client_archived');

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "client_id" UUID,
    "type" "activity_type" NOT NULL,
    "actor" "activity_actor" NOT NULL,
    "summary" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company_name" TEXT,
    "country_code" CHAR(2),
    "default_currency" "currency" NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postal_code" TEXT,
    "notes" TEXT,
    "stripe_customer_id" TEXT,
    "archived_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_owner_id_occurred_at_idx" ON "activities"("owner_id", "occurred_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "clients_stripe_customer_id_key" ON "clients"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "clients_owner_id_archived_at_idx" ON "clients"("owner_id", "archived_at");

-- CreateIndex
CREATE INDEX "clients_owner_id_name_idx" ON "clients"("owner_id", "name");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "neon_auth"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "neon_auth"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
