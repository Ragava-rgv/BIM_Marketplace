-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "subcategory_id" TEXT;

-- AlterTable
ALTER TABLE "subcategories" ADD COLUMN     "listing_count" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
