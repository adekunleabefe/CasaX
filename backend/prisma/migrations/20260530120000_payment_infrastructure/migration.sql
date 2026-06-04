-- CasaX rent collection, renewal payment, receipt, and landlord payout foundation.

CREATE TYPE "PaymentProvider" AS ENUM ('paystack', 'flutterwave');
CREATE TYPE "PaymentPurpose" AS ENUM ('rent', 'renewal');
CREATE TYPE "LandlordRemittanceStatus" AS ENUM ('pending', 'approved', 'processing', 'paid', 'failed', 'rejected');

ALTER TYPE "PaymentStatus" ADD VALUE 'processing';

ALTER TABLE "rent_payments"
ADD COLUMN "authorization_url" TEXT,
ADD COLUMN "frequency" "PaymentFrequency" NOT NULL DEFAULT 'yearly',
ADD COLUMN "metadata" JSONB,
ADD COLUMN "payment_reference" TEXT,
ADD COLUMN "provider_reference" TEXT,
ADD COLUMN "tenant_id" UUID,
ADD COLUMN "transaction_id" UUID;

UPDATE "rent_payments"
SET "tenant_id" = "payer_id"
WHERE "tenant_id" IS NULL;

ALTER TABLE "payment_transactions"
ADD COLUMN "authorization_url" TEXT,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN',
ADD COLUMN "lease_renewal_payment_id" UUID,
ADD COLUMN "metadata" JSONB,
ADD COLUMN "paid_at" TIMESTAMP(3),
ADD COLUMN "payment_reference" TEXT,
ADD COLUMN "property_id" UUID,
ADD COLUMN "provider_reference" TEXT,
ADD COLUMN "purpose" "PaymentPurpose" NOT NULL DEFAULT 'rent',
ADD COLUMN "reference" TEXT,
ADD COLUMN "tenancy_id" UUID,
ADD COLUMN "tenant_id" UUID,
ADD COLUMN "provider_new" "PaymentProvider" NOT NULL DEFAULT 'paystack';

UPDATE "payment_transactions" AS pt
SET
  "tenant_id" = rp."payer_id",
  "property_id" = rp."property_id",
  "tenancy_id" = rp."tenancy_id",
  "reference" = COALESCE(pt."payment_reference", pt."external_ref", pt."id"::text),
  "payment_reference" = COALESCE(pt."payment_reference", pt."external_ref", pt."id"::text)
FROM "rent_payments" AS rp
WHERE pt."rent_payment_id" = rp."id";

ALTER TABLE "payment_transactions" DROP COLUMN "provider";
ALTER TABLE "payment_transactions" RENAME COLUMN "provider_new" TO "provider";

ALTER TABLE "payment_transactions" ALTER COLUMN "rent_payment_id" DROP NOT NULL;
ALTER TABLE "payment_transactions" ALTER COLUMN "property_id" SET NOT NULL;
ALTER TABLE "payment_transactions" ALTER COLUMN "reference" SET NOT NULL;
ALTER TABLE "payment_transactions" ALTER COLUMN "tenancy_id" SET NOT NULL;
ALTER TABLE "payment_transactions" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "payment_transactions" ALTER COLUMN "purpose" DROP DEFAULT;
ALTER TABLE "payment_transactions" ALTER COLUMN "provider" DROP DEFAULT;

CREATE TABLE "lease_renewal_payments" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "tenancy_id" UUID NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "renewal_start_date" TIMESTAMP(3) NOT NULL,
  "renewal_end_date" TIMESTAMP(3) NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
  "transaction_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "lease_renewal_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "receipts" (
  "id" UUID NOT NULL,
  "receipt_number" TEXT NOT NULL,
  "tenant_id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "rent_payment_id" UUID,
  "lease_renewal_payment_id" UUID,
  "transaction_id" UUID,
  "amount" DECIMAL(14,2) NOT NULL,
  "purpose" "PaymentPurpose" NOT NULL,
  "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pdf_url" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "landlord_remittances" (
  "id" UUID NOT NULL,
  "landlord_id" UUID NOT NULL,
  "property_id" UUID NOT NULL,
  "rent_payment_id" UUID,
  "lease_renewal_payment_id" UUID,
  "gross_amount" DECIMAL(14,2) NOT NULL,
  "platform_fee" DECIMAL(14,2) NOT NULL,
  "net_amount" DECIMAL(14,2) NOT NULL,
  "status" "LandlordRemittanceStatus" NOT NULL DEFAULT 'pending',
  "approved_by_id" UUID,
  "paid_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "landlord_remittances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lease_renewal_payments_transaction_id_key" ON "lease_renewal_payments"("transaction_id");
CREATE INDEX "lease_renewal_payments_tenant_id_status_idx" ON "lease_renewal_payments"("tenant_id", "status");
CREATE INDEX "lease_renewal_payments_property_id_status_idx" ON "lease_renewal_payments"("property_id", "status");
CREATE INDEX "lease_renewal_payments_tenancy_id_status_idx" ON "lease_renewal_payments"("tenancy_id", "status");
CREATE INDEX "lease_renewal_payments_status_renewal_start_date_idx" ON "lease_renewal_payments"("status", "renewal_start_date");

CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");
CREATE INDEX "receipts_tenant_id_issued_at_idx" ON "receipts"("tenant_id", "issued_at");
CREATE INDEX "receipts_rent_payment_id_idx" ON "receipts"("rent_payment_id");
CREATE INDEX "receipts_lease_renewal_payment_id_idx" ON "receipts"("lease_renewal_payment_id");
CREATE INDEX "receipts_transaction_id_idx" ON "receipts"("transaction_id");

CREATE INDEX "landlord_remittances_landlord_id_status_idx" ON "landlord_remittances"("landlord_id", "status");
CREATE INDEX "landlord_remittances_property_id_status_idx" ON "landlord_remittances"("property_id", "status");
CREATE INDEX "landlord_remittances_rent_payment_id_idx" ON "landlord_remittances"("rent_payment_id");
CREATE INDEX "landlord_remittances_lease_renewal_payment_id_idx" ON "landlord_remittances"("lease_renewal_payment_id");

CREATE UNIQUE INDEX "payment_transactions_reference_key" ON "payment_transactions"("reference");
CREATE UNIQUE INDEX "payment_transactions_payment_reference_key" ON "payment_transactions"("payment_reference");
CREATE UNIQUE INDEX "payment_transactions_provider_reference_key" ON "payment_transactions"("provider_reference");
CREATE INDEX "payment_transactions_lease_renewal_payment_id_status_idx" ON "payment_transactions"("lease_renewal_payment_id", "status");
CREATE INDEX "payment_transactions_tenant_id_status_idx" ON "payment_transactions"("tenant_id", "status");
CREATE INDEX "payment_transactions_property_id_status_idx" ON "payment_transactions"("property_id", "status");
CREATE INDEX "payment_transactions_tenancy_id_purpose_status_idx" ON "payment_transactions"("tenancy_id", "purpose", "status");
CREATE INDEX "payment_transactions_provider_status_idx" ON "payment_transactions"("provider", "status");

CREATE UNIQUE INDEX "rent_payments_transaction_id_key" ON "rent_payments"("transaction_id");
CREATE UNIQUE INDEX "rent_payments_payment_reference_key" ON "rent_payments"("payment_reference");
CREATE UNIQUE INDEX "rent_payments_provider_reference_key" ON "rent_payments"("provider_reference");
CREATE INDEX "rent_payments_tenant_id_status_idx" ON "rent_payments"("tenant_id", "status");

ALTER TABLE "rent_payments" ADD CONSTRAINT "rent_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_lease_renewal_payment_id_fkey" FOREIGN KEY ("lease_renewal_payment_id") REFERENCES "lease_renewal_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lease_renewal_payments" ADD CONSTRAINT "lease_renewal_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lease_renewal_payments" ADD CONSTRAINT "lease_renewal_payments_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lease_renewal_payments" ADD CONSTRAINT "lease_renewal_payments_tenancy_id_fkey" FOREIGN KEY ("tenancy_id") REFERENCES "tenancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_rent_payment_id_fkey" FOREIGN KEY ("rent_payment_id") REFERENCES "rent_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_lease_renewal_payment_id_fkey" FOREIGN KEY ("lease_renewal_payment_id") REFERENCES "lease_renewal_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "landlord_remittances" ADD CONSTRAINT "landlord_remittances_landlord_id_fkey" FOREIGN KEY ("landlord_id") REFERENCES "landlords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "landlord_remittances" ADD CONSTRAINT "landlord_remittances_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "landlord_remittances" ADD CONSTRAINT "landlord_remittances_rent_payment_id_fkey" FOREIGN KEY ("rent_payment_id") REFERENCES "rent_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "landlord_remittances" ADD CONSTRAINT "landlord_remittances_lease_renewal_payment_id_fkey" FOREIGN KEY ("lease_renewal_payment_id") REFERENCES "lease_renewal_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "landlord_remittances" ADD CONSTRAINT "landlord_remittances_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
