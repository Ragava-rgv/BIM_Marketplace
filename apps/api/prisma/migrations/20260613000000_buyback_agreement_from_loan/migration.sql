-- AlterTable
ALTER TABLE "buyback_offers" ADD COLUMN     "agreement_terms" JSONB,
ADD COLUMN     "certified_value" DECIMAL(14,2),
ADD COLUMN     "depreciation_schedule" JSONB,
ADD COLUMN     "loan_application_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "buyback_offers_loan_application_id_key" ON "buyback_offers"("loan_application_id");

-- AddForeignKey
ALTER TABLE "buyback_offers" ADD CONSTRAINT "buyback_offers_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
