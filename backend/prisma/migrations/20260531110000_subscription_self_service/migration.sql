-- CasaX self-service landlord subscription infrastructure.

CREATE TYPE "PropertyVerificationStatus" AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE "PropertyListingStatus" AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'suspended');
CREATE TYPE "SubscriptionPlanType" AS ENUM ('starter', 'growth', 'enterprise');
CREATE TYPE "BillingCycle" AS ENUM ('monthly', 'annually', 'custom');
CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('pending', 'processing', 'paid', 'failed', 'cancelled');

BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'expired');
ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "subscriptions"
  ALTER COLUMN "status" TYPE "SubscriptionStatus_new"
  USING (
    CASE
      WHEN "status"::text = 'trial' THEN 'trialing'
      ELSE "status"::text
    END
  )::"SubscriptionStatus_new";
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "SubscriptionStatus_old";
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'trialing';
COMMIT;

ALTER TABLE "properties"
  ADD COLUMN "listing_status" "PropertyListingStatus" NOT NULL DEFAULT 'pending_review',
  ADD COLUMN "verification_status" "PropertyVerificationStatus" NOT NULL DEFAULT 'pending';

CREATE TABLE "subscription_plans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "type" "SubscriptionPlanType" NOT NULL,
  "description" TEXT NOT NULL,
  "monthly_price" DECIMAL(14,2),
  "annual_price" DECIMAL(14,2),
  "max_properties" INTEGER,
  "max_units" INTEGER,
  "max_caretakers" INTEGER,
  "includes_vacancy_listing" BOOLEAN NOT NULL DEFAULT true,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "is_custom" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "landlord_subscriptions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "landlord_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
  "billing_cycle" "BillingCycle" NOT NULL DEFAULT 'monthly',
  "trial_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "trial_ends_at" TIMESTAMP(3) NOT NULL,
  "current_period_start" TIMESTAMP(3),
  "current_period_end" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "landlord_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "landlord_id" UUID NOT NULL,
  "subscription_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "provider" "PaymentProvider" NOT NULL DEFAULT 'paystack',
  "status" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'pending',
  "billing_cycle" "BillingCycle" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "reference" TEXT NOT NULL,
  "provider_reference" TEXT,
  "authorization_url" TEXT,
  "paid_at" TIMESTAMP(3),
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_plans_type_key" ON "subscription_plans"("type");
CREATE INDEX "subscription_plans_is_active_type_idx" ON "subscription_plans"("is_active", "type");
CREATE INDEX "landlord_subscriptions_landlord_id_status_idx" ON "landlord_subscriptions"("landlord_id", "status");
CREATE INDEX "landlord_subscriptions_status_trial_ends_at_idx" ON "landlord_subscriptions"("status", "trial_ends_at");
CREATE INDEX "landlord_subscriptions_plan_id_idx" ON "landlord_subscriptions"("plan_id");
CREATE UNIQUE INDEX "subscription_payments_reference_key" ON "subscription_payments"("reference");
CREATE INDEX "subscription_payments_landlord_id_status_created_at_idx" ON "subscription_payments"("landlord_id", "status", "created_at");
CREATE INDEX "subscription_payments_subscription_id_status_idx" ON "subscription_payments"("subscription_id", "status");
CREATE INDEX "subscription_payments_plan_id_idx" ON "subscription_payments"("plan_id");

ALTER TABLE "landlord_subscriptions"
  ADD CONSTRAINT "landlord_subscriptions_landlord_id_fkey"
  FOREIGN KEY ("landlord_id") REFERENCES "landlords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "landlord_subscriptions"
  ADD CONSTRAINT "landlord_subscriptions_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscription_payments"
  ADD CONSTRAINT "subscription_payments_landlord_id_fkey"
  FOREIGN KEY ("landlord_id") REFERENCES "landlords"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscription_payments"
  ADD CONSTRAINT "subscription_payments_subscription_id_fkey"
  FOREIGN KEY ("subscription_id") REFERENCES "landlord_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscription_payments"
  ADD CONSTRAINT "subscription_payments_plan_id_fkey"
  FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "subscription_plans" (
  "name",
  "type",
  "description",
  "monthly_price",
  "annual_price",
  "max_properties",
  "max_units",
  "max_caretakers",
  "includes_vacancy_listing",
  "is_active",
  "is_custom"
) VALUES
  ('Starter', 'starter', 'For landlords starting a focused portfolio.', 15000, 150000, 3, 20, 1, true, true, false),
  ('Growth', 'growth', 'For growing landlords with more operational needs.', 35000, 350000, 5, 100, 5, true, true, false),
  ('Enterprise', 'enterprise', 'Custom limits, onboarding, integrations, and support.', NULL, NULL, NULL, NULL, NULL, true, true, true)
ON CONFLICT ("type") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "monthly_price" = EXCLUDED."monthly_price",
  "annual_price" = EXCLUDED."annual_price",
  "max_properties" = EXCLUDED."max_properties",
  "max_units" = EXCLUDED."max_units",
  "max_caretakers" = EXCLUDED."max_caretakers",
  "includes_vacancy_listing" = EXCLUDED."includes_vacancy_listing",
  "is_active" = EXCLUDED."is_active",
  "is_custom" = EXCLUDED."is_custom",
  "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO "landlord_subscriptions" (
  "landlord_id",
  "plan_id",
  "status",
  "billing_cycle",
  "trial_started_at",
  "trial_ends_at",
  "current_period_start",
  "current_period_end",
  "metadata"
)
SELECT
  l."id",
  sp."id",
  'trialing',
  'monthly',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '30 days',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '30 days',
  '{"source":"migration_default_trial"}'::jsonb
FROM "landlords" l
CROSS JOIN "subscription_plans" sp
WHERE sp."type" = 'starter'
  AND l."deleted_at" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "landlord_subscriptions" ls
    WHERE ls."landlord_id" = l."id"
  );
