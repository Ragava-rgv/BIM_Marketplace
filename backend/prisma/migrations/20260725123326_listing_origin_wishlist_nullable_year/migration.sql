-- CreateEnum
CREATE TYPE "ListingOrigin" AS ENUM ('INDIAN', 'IMPORTED');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "imported_country" TEXT,
ADD COLUMN     "origin" "ListingOrigin" NOT NULL DEFAULT 'INDIAN',
ALTER COLUMN "manufacture_year" DROP NOT NULL;

-- CreateTable
CREATE TABLE "wishlists" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wishlists_buyer_id_idx" ON "wishlists"("buyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_buyer_id_listing_id_key" ON "wishlists"("buyer_id", "listing_id");

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
