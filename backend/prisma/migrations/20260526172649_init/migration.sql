-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'landlord', 'caretaker', 'applicant', 'tenant');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('vacant', 'occupied', 'pending_approval', 'maintenance', 'inactive');

-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('private', 'published', 'unpublished', 'filled');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'inspection_booked', 'under_review', 'approved', 'rejected', 'converted_to_tenant');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('requested', 'confirmed', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "TenancyStatus" AS ENUM ('pending', 'active', 'expired', 'terminated');

-- CreateEnum
CREATE TYPE "PaymentFrequency" AS ENUM ('monthly', 'quarterly', 'biannual', 'yearly');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'overdue', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('bank_transfer', 'cash', 'pos', 'card', 'online_gateway');

-- CreateEnum
CREATE TYPE "RemittanceStatus" AS ENUM ('pending', 'partially_remitted', 'remitted', 'disputed', 'cancelled');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('pending', 'in_progress', 'resolved', 'cancelled');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('starter', 'growth', 'business');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'expired');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "refresh_token_hash" TEXT,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landlords" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "landlords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caretakers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "caretakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applicants" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rent_amount" DECIMAL(14,2) NOT NULL,
    "bedroom_count" INTEGER NOT NULL,
    "unit_type" TEXT NOT NULL,
    "status" "UnitStatus" NOT NULL DEFAULT 'vacant',
    "is_publicly_visible" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacancy_listings" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "VacancyStatus" NOT NULL DEFAULT 'private',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vacancy_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacancy_applications" (
    "id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "vacancy_listing_id" UUID,
    "property_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "assigned_caretaker_id" UUID,
    "created_by_id" UUID NOT NULL,
    "notes" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vacancy_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_approval_history" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "reviewed_by_id" UUID NOT NULL,
    "from_status" "ApplicationStatus" NOT NULL,
    "to_status" "ApplicationStatus" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_approval_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_bookings" (
    "id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "vacancy_listing_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "vacancy_application_id" UUID,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'requested',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenancies" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "vacancy_application_id" UUID,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "rent_amount" DECIMAL(14,2) NOT NULL,
    "payment_frequency" "PaymentFrequency" NOT NULL DEFAULT 'yearly',
    "status" "TenancyStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "terminated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenancies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupancy_records" (
    "id" UUID NOT NULL,
    "tenancy_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "move_in_date" TIMESTAMP(3) NOT NULL,
    "move_out_date" TIMESTAMP(3),
    "status" "TenancyStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupancy_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupancy_assignments" (
    "id" UUID NOT NULL,
    "tenancy_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "occupant_id" UUID NOT NULL,
    "vacancy_application_id" UUID,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupancy_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caretaker_assignments" (
    "id" UUID NOT NULL,
    "caretaker_id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caretaker_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rent_payments" (
    "id" UUID NOT NULL,
    "tenancy_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "payer_id" UUID NOT NULL,
    "collected_by_caretaker_id" UUID,
    "amount" DECIMAL(14,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "method" "PaymentMethod" NOT NULL DEFAULT 'bank_transfer',
    "reference" TEXT,
    "notes" TEXT,
    "proof_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rent_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remittance_records" (
    "id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "caretaker_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "RemittanceStatus" NOT NULL DEFAULT 'pending',
    "method" "PaymentMethod" NOT NULL DEFAULT 'bank_transfer',
    "reference" TEXT,
    "remitted_at" TIMESTAMP(3),
    "notes" TEXT,
    "proof_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "remittance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remittance_payments" (
    "id" UUID NOT NULL,
    "remittance_id" UUID NOT NULL,
    "rent_payment_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "remittance_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "rent_payment_id" UUID NOT NULL,
    "provider" "PaymentMethod" NOT NULL,
    "external_ref" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "payload" JSONB,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "assigned_caretaker_id" UUID,
    "property_id" UUID NOT NULL,
    "unit_id" UUID,
    "tenancy_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'pending',
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_updates" (
    "id" UUID NOT NULL,
    "maintenance_request_id" UUID NOT NULL,
    "updated_by_id" UUID NOT NULL,
    "status" "MaintenanceStatus" NOT NULL,
    "note" TEXT,
    "media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "landlord_id" UUID NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'trial',
    "trial_ends_at" TIMESTAMP(3),
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "landlords_user_id_key" ON "landlords"("user_id");

-- CreateIndex
CREATE INDEX "landlords_deleted_at_idx" ON "landlords"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "caretakers_user_id_key" ON "caretakers"("user_id");

-- CreateIndex
CREATE INDEX "caretakers_deleted_at_idx" ON "caretakers"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "applicants_user_id_key" ON "applicants"("user_id");

-- CreateIndex
CREATE INDEX "applicants_deleted_at_idx" ON "applicants"("deleted_at");

-- CreateIndex
CREATE INDEX "properties_landlord_id_status_idx" ON "properties"("landlord_id", "status");

-- CreateIndex
CREATE INDEX "properties_city_state_idx" ON "properties"("city", "state");

-- CreateIndex
CREATE INDEX "properties_deleted_at_idx" ON "properties"("deleted_at");

-- CreateIndex
CREATE INDEX "units_property_id_status_idx" ON "units"("property_id", "status");

-- CreateIndex
CREATE INDEX "units_status_is_publicly_visible_idx" ON "units"("status", "is_publicly_visible");

-- CreateIndex
CREATE INDEX "units_deleted_at_idx" ON "units"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "units_property_id_name_key" ON "units"("property_id", "name");

-- CreateIndex
CREATE INDEX "vacancy_listings_unit_id_status_idx" ON "vacancy_listings"("unit_id", "status");

-- CreateIndex
CREATE INDEX "vacancy_listings_status_published_at_idx" ON "vacancy_listings"("status", "published_at");

-- CreateIndex
CREATE INDEX "vacancy_listings_landlord_id_idx" ON "vacancy_listings"("landlord_id");

-- CreateIndex
CREATE INDEX "vacancy_applications_unit_id_status_idx" ON "vacancy_applications"("unit_id", "status");

-- CreateIndex
CREATE INDEX "vacancy_applications_status_created_at_idx" ON "vacancy_applications"("status", "created_at");

-- CreateIndex
CREATE INDEX "vacancy_applications_landlord_id_status_created_at_idx" ON "vacancy_applications"("landlord_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "vacancy_applications_property_id_status_idx" ON "vacancy_applications"("property_id", "status");

-- CreateIndex
CREATE INDEX "vacancy_applications_assigned_caretaker_id_created_at_idx" ON "vacancy_applications"("assigned_caretaker_id", "created_at");

-- CreateIndex
CREATE INDEX "vacancy_applications_applicant_id_created_at_idx" ON "vacancy_applications"("applicant_id", "created_at");

-- CreateIndex
CREATE INDEX "vacancy_applications_deleted_at_idx" ON "vacancy_applications"("deleted_at");

-- CreateIndex
CREATE INDEX "application_approval_history_application_id_created_at_idx" ON "application_approval_history"("application_id", "created_at");

-- CreateIndex
CREATE INDEX "application_approval_history_reviewed_by_id_created_at_idx" ON "application_approval_history"("reviewed_by_id", "created_at");

-- CreateIndex
CREATE INDEX "inspection_bookings_applicant_id_scheduled_at_idx" ON "inspection_bookings"("applicant_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "inspection_bookings_unit_id_status_idx" ON "inspection_bookings"("unit_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tenancies_vacancy_application_id_key" ON "tenancies"("vacancy_application_id");

-- CreateIndex
CREATE INDEX "tenancies_unit_id_status_idx" ON "tenancies"("unit_id", "status");

-- CreateIndex
CREATE INDEX "tenancies_user_id_status_idx" ON "tenancies"("user_id", "status");

-- CreateIndex
CREATE INDEX "tenancies_landlord_id_status_idx" ON "tenancies"("landlord_id", "status");

-- CreateIndex
CREATE INDEX "tenancies_landlord_id_end_date_status_idx" ON "tenancies"("landlord_id", "end_date", "status");

-- CreateIndex
CREATE INDEX "tenancies_applicant_id_status_idx" ON "tenancies"("applicant_id", "status");

-- CreateIndex
CREATE INDEX "occupancy_records_unit_id_move_out_date_idx" ON "occupancy_records"("unit_id", "move_out_date");

-- CreateIndex
CREATE INDEX "occupancy_records_property_id_status_idx" ON "occupancy_records"("property_id", "status");

-- CreateIndex
CREATE INDEX "occupancy_records_user_id_status_idx" ON "occupancy_records"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "occupancy_assignments_vacancy_application_id_key" ON "occupancy_assignments"("vacancy_application_id");

-- CreateIndex
CREATE INDEX "occupancy_assignments_unit_id_ended_at_idx" ON "occupancy_assignments"("unit_id", "ended_at");

-- CreateIndex
CREATE INDEX "occupancy_assignments_occupant_id_idx" ON "occupancy_assignments"("occupant_id");

-- CreateIndex
CREATE INDEX "caretaker_assignments_caretaker_id_ended_at_idx" ON "caretaker_assignments"("caretaker_id", "ended_at");

-- CreateIndex
CREATE INDEX "caretaker_assignments_landlord_id_ended_at_idx" ON "caretaker_assignments"("landlord_id", "ended_at");

-- CreateIndex
CREATE INDEX "caretaker_assignments_property_id_ended_at_idx" ON "caretaker_assignments"("property_id", "ended_at");

-- CreateIndex
CREATE INDEX "caretaker_assignments_property_id_caretaker_id_ended_at_idx" ON "caretaker_assignments"("property_id", "caretaker_id", "ended_at");

-- CreateIndex
CREATE UNIQUE INDEX "rent_payments_reference_key" ON "rent_payments"("reference");

-- CreateIndex
CREATE INDEX "rent_payments_landlord_id_status_idx" ON "rent_payments"("landlord_id", "status");

-- CreateIndex
CREATE INDEX "rent_payments_property_id_status_idx" ON "rent_payments"("property_id", "status");

-- CreateIndex
CREATE INDEX "rent_payments_tenancy_id_due_date_idx" ON "rent_payments"("tenancy_id", "due_date");

-- CreateIndex
CREATE INDEX "rent_payments_collected_by_caretaker_id_status_idx" ON "rent_payments"("collected_by_caretaker_id", "status");

-- CreateIndex
CREATE INDEX "rent_payments_payer_id_status_idx" ON "rent_payments"("payer_id", "status");

-- CreateIndex
CREATE INDEX "rent_payments_status_due_date_idx" ON "rent_payments"("status", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "remittance_records_reference_key" ON "remittance_records"("reference");

-- CreateIndex
CREATE INDEX "remittance_records_landlord_id_status_idx" ON "remittance_records"("landlord_id", "status");

-- CreateIndex
CREATE INDEX "remittance_records_property_id_status_idx" ON "remittance_records"("property_id", "status");

-- CreateIndex
CREATE INDEX "remittance_records_caretaker_id_status_idx" ON "remittance_records"("caretaker_id", "status");

-- CreateIndex
CREATE INDEX "remittance_records_remitted_at_idx" ON "remittance_records"("remitted_at");

-- CreateIndex
CREATE INDEX "remittance_records_deleted_at_idx" ON "remittance_records"("deleted_at");

-- CreateIndex
CREATE INDEX "remittance_payments_rent_payment_id_idx" ON "remittance_payments"("rent_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "remittance_payments_remittance_id_rent_payment_id_key" ON "remittance_payments"("remittance_id", "rent_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_external_ref_key" ON "payment_transactions"("external_ref");

-- CreateIndex
CREATE INDEX "payment_transactions_rent_payment_id_status_idx" ON "payment_transactions"("rent_payment_id", "status");

-- CreateIndex
CREATE INDEX "maintenance_requests_property_id_status_idx" ON "maintenance_requests"("property_id", "status");

-- CreateIndex
CREATE INDEX "maintenance_requests_assigned_caretaker_id_status_idx" ON "maintenance_requests"("assigned_caretaker_id", "status");

-- CreateIndex
CREATE INDEX "maintenance_updates_maintenance_request_id_created_at_idx" ON "maintenance_updates"("maintenance_request_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "subscriptions_landlord_id_status_idx" ON "subscriptions"("landlord_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_status_current_period_end_idx" ON "subscriptions"("status", "current_period_end");

-- CreateIndex
CREATE INDEX "activity_logs_actor_id_created_at_idx" ON "activity_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landlords" ADD CONSTRAINT "landlords_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caretakers" ADD CONSTRAINT "caretakers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_listings" ADD CONSTRAINT "vacancy_listings_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_listings" ADD CONSTRAINT "vacancy_listings_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_applications" ADD CONSTRAINT "vacancy_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_applications" ADD CONSTRAINT "vacancy_applications_vacancy_listing_id_fkey" FOREIGN KEY ("vacancy_listing_id") REFERENCES "vacancy_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_applications" ADD CONSTRAINT "vacancy_applications_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_applications" ADD CONSTRAINT "vacancy_applications_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_applications" ADD CONSTRAINT "vacancy_applications_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_applications" ADD CONSTRAINT "vacancy_applications_assigned_caretaker_id_fkey" FOREIGN KEY ("assigned_caretaker_id") REFERENCES "caretakers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacancy_applications" ADD CONSTRAINT "vacancy_applications_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_approval_history" ADD CONSTRAINT "application_approval_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "vacancy_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_approval_history" ADD CONSTRAINT "application_approval_history_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_bookings" ADD CONSTRAINT "inspection_bookings_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_bookings" ADD CONSTRAINT "inspection_bookings_vacancy_listing_id_fkey" FOREIGN KEY ("vacancy_listing_id") REFERENCES "vacancy_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_bookings" ADD CONSTRAINT "inspection_bookings_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_bookings" ADD CONSTRAINT "inspection_bookings_vacancy_application_id_fkey" FOREIGN KEY ("vacancy_application_id") REFERENCES "vacancy_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_vacancy_application_id_fkey" FOREIGN KEY ("vacancy_application_id") REFERENCES "vacancy_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancy_records" ADD CONSTRAINT "occupancy_records_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancy_records" ADD CONSTRAINT "occupancy_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancy_records" ADD CONSTRAINT "occupancy_records_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancy_records" ADD CONSTRAINT "occupancy_records_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancy_assignments" ADD CONSTRAINT "occupancy_assignments_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancy_assignments" ADD CONSTRAINT "occupancy_assignments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancy_assignments" ADD CONSTRAINT "occupancy_assignments_occupant_id_fkey" FOREIGN KEY ("occupant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupancy_assignments" ADD CONSTRAINT "occupancy_assignments_vacancy_application_id_fkey" FOREIGN KEY ("vacancy_application_id") REFERENCES "vacancy_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caretaker_assignments" ADD CONSTRAINT "caretaker_assignments_caretaker_id_fkey" FOREIGN KEY ("caretaker_id") REFERENCES "caretakers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caretaker_assignments" ADD CONSTRAINT "caretaker_assignments_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caretaker_assignments" ADD CONSTRAINT "caretaker_assignments_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_collected_by_caretaker_id_fkey" FOREIGN KEY ("collected_by_caretaker_id") REFERENCES "caretakers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittance_records" ADD CONSTRAINT "remittance_records_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittance_records" ADD CONSTRAINT "remittance_records_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittance_records" ADD CONSTRAINT "remittance_records_caretaker_id_fkey" FOREIGN KEY ("caretaker_id") REFERENCES "caretakers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittance_payments" ADD CONSTRAINT "remittance_payments_remittance_id_fkey" FOREIGN KEY ("remittance_id") REFERENCES "remittance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remittance_payments" ADD CONSTRAINT "remittance_payments_rent_payment_id_fkey" FOREIGN KEY ("rent_payment_id") REFERENCES "rent_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_rent_payment_id_fkey" FOREIGN KEY ("rent_payment_id") REFERENCES "rent_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_assigned_caretaker_id_fkey" FOREIGN KEY ("assigned_caretaker_id") REFERENCES "caretakers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_updates" ADD CONSTRAINT "maintenance_updates_maintenance_request_id_fkey" FOREIGN KEY ("maintenance_request_id") REFERENCES "maintenance_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_updates" ADD CONSTRAINT "maintenance_updates_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
