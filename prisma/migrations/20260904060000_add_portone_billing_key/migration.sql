-- AlterTable
ALTER TABLE "organizations" ADD COLUMN "portoneBillingKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_portoneBillingKey_key" ON "organizations"("portoneBillingKey");
