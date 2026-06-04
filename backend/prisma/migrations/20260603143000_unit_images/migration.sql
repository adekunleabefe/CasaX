CREATE TABLE IF NOT EXISTS "unit_images" (
  "id" UUID NOT NULL,
  "unit_id" UUID NOT NULL,
  "image_url" TEXT NOT NULL,
  "storage_key" TEXT,
  "caption" TEXT,
  "category" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_cover" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "unit_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "unit_images_unit_id_sort_order_idx" ON "unit_images"("unit_id", "sort_order");
CREATE INDEX IF NOT EXISTS "unit_images_unit_id_is_cover_idx" ON "unit_images"("unit_id", "is_cover");

ALTER TABLE "unit_images"
  ADD CONSTRAINT "unit_images_unit_id_fkey"
  FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
