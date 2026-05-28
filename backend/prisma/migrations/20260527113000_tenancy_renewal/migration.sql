-- AlterTable
ALTER TABLE "tenancies" ADD COLUMN     "previous_tenancy_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "tenancies_previous_tenancy_id_key" ON "tenancies"("previous_tenancy_id");

-- AddForeignKey
ALTER TABLE "tenancies" ADD CONSTRAINT "tenancies_previous_tenancy_id_fkey" FOREIGN KEY ("previous_tenancy_id") REFERENCES "tenancies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
