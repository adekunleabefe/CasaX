ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'inspection_required';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'inspection_scheduled';

CREATE TABLE "saved_rentals" (
    "id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "vacancy_listing_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "saved_rentals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "saved_rentals_applicant_id_vacancy_listing_id_key" ON "saved_rentals"("applicant_id", "vacancy_listing_id");
CREATE INDEX "saved_rentals_applicant_id_created_at_idx" ON "saved_rentals"("applicant_id", "created_at");
CREATE INDEX "saved_rentals_vacancy_listing_id_idx" ON "saved_rentals"("vacancy_listing_id");
CREATE INDEX "saved_rentals_deleted_at_idx" ON "saved_rentals"("deleted_at");

ALTER TABLE "saved_rentals" ADD CONSTRAINT "saved_rentals_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_rentals" ADD CONSTRAINT "saved_rentals_vacancy_listing_id_fkey" FOREIGN KEY ("vacancy_listing_id") REFERENCES "vacancy_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
