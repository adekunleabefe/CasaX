-- CreateEnum
CREATE TYPE "TenantOnboardingStatus" AS ENUM ('pending', 'approved', 'rejected', 'converted_to_tenancy');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('draft', 'generated', 'sent', 'signed', 'cancelled');

-- AlterTable
ALTER TABLE "tenancies" ADD COLUMN     "tenant_onboarding_request_id" UUID;

-- CreateTable
CREATE TABLE "tenant_onboarding_requests" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "submitted_by_user_id" UUID NOT NULL,
    "submitted_by_caretaker_id" UUID,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "rent_amount" DECIMAL(14,2) NOT NULL,
    "payment_frequency" "PaymentFrequency" NOT NULL,
    "notes" TEXT,
    "status" "TenantOnboardingStatus" NOT NULL DEFAULT 'pending',
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" UUID,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenant_onboarding_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenancy_agreements" (
    "id" UUID NOT NULL,
    "tenancy_id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "tenant_user_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "agreement_number" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'draft',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signed_at" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenancy_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_onboarding_requests_landlord_id_status_created_at_idx" ON "tenant_onboarding_requests"("landlord_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "tenant_onboarding_requests_property_id_status_idx" ON "tenant_onboarding_requests"("property_id", "status");

-- CreateIndex
CREATE INDEX "tenant_onboarding_requests_unit_id_status_idx" ON "tenant_onboarding_requests"("unit_id", "status");

-- CreateIndex
CREATE INDEX "tenant_onboarding_requests_submitted_by_caretaker_id_status_idx" ON "tenant_onboarding_requests"("submitted_by_caretaker_id", "status");

-- CreateIndex
CREATE INDEX "tenant_onboarding_requests_submitted_by_user_id_created_at_idx" ON "tenant_onboarding_requests"("submitted_by_user_id", "created_at");

-- CreateIndex
CREATE INDEX "tenant_onboarding_requests_deleted_at_idx" ON "tenant_onboarding_requests"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tenancy_agreements_tenancy_id_key" ON "tenancy_agreements"("tenancy_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenancy_agreements_agreement_number_key" ON "tenancy_agreements"("agreement_number");

-- CreateIndex
CREATE INDEX "tenancy_agreements_landlord_id_status_idx" ON "tenancy_agreements"("landlord_id", "status");

-- CreateIndex
CREATE INDEX "tenancy_agreements_tenant_user_id_status_idx" ON "tenancy_agreements"("tenant_user_id", "status");

-- CreateIndex
CREATE INDEX "tenancy_agreements_property_id_unit_id_idx" ON "tenancy_agreements"("property_id", "unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenancies_tenant_onboarding_request_id_key" ON "tenancies"("tenant_onboarding_request_id");

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_tenant_onboarding_request_id_fkey" FOREIGN KEY ("tenant_onboarding_request_id") REFERENCES "tenant_onboarding_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_onboarding_requests" ADD CONSTRAINT "tenant_onboarding_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_onboarding_requests" ADD CONSTRAINT "tenant_onboarding_requests_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_onboarding_requests" ADD CONSTRAINT "tenant_onboarding_requests_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_onboarding_requests" ADD CONSTRAINT "tenant_onboarding_requests_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_onboarding_requests" ADD CONSTRAINT "tenant_onboarding_requests_submitted_by_caretaker_id_fkey" FOREIGN KEY ("submitted_by_caretaker_id") REFERENCES "caretakers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_onboarding_requests" ADD CONSTRAINT "tenant_onboarding_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancy_agreements" ADD CONSTRAINT "tenancy_agreements_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancy_agreements" ADD CONSTRAINT "tenancy_agreements_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancy_agreements" ADD CONSTRAINT "tenancy_agreements_tenant_user_id_fkey" FOREIGN KEY ("tenant_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancy_agreements" ADD CONSTRAINT "tenancy_agreements_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancy_agreements" ADD CONSTRAINT "tenancy_agreements_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancy_agreements" ADD CONSTRAINT "tenancy_agreements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
