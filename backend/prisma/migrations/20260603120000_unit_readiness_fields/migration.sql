DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UnitReadinessStatus') THEN
    CREATE TYPE "UnitReadinessStatus" AS ENUM ('incomplete', 'ready');
  END IF;
END
$$;

ALTER TABLE "units"
  ADD COLUMN IF NOT EXISTS "bathroom_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "listing_title" TEXT,
  ADD COLUMN IF NOT EXISTS "public_description" TEXT,
  ADD COLUMN IF NOT EXISTS "photos" JSONB,
  ADD COLUMN IF NOT EXISTS "amenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "service_charge" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "availability_date" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "inspection_notes" TEXT,
  ADD COLUMN IF NOT EXISTS "readiness_status" "UnitReadinessStatus" NOT NULL DEFAULT 'incomplete';

CREATE INDEX IF NOT EXISTS "units_property_id_readiness_status_idx" ON "units"("property_id", "readiness_status");
