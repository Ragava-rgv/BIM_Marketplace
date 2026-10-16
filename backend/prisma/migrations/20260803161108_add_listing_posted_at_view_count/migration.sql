-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "posted_at" TIMESTAMP(3),
ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "listing_views" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "viewer_key" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listing_views_listing_id_viewer_key_key" ON "listing_views"("listing_id", "viewer_key");

-- AddForeignKey
ALTER TABLE "listing_views" ADD CONSTRAINT "listing_views_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: listings that already went live before this migration get posted_at from created_at,
-- since there was no approval timestamp to derive the true "went live" date from.
UPDATE "listings" SET "posted_at" = "created_at" WHERE "status" IN ('ACTIVE', 'UNDER_OFFER', 'SOLD') AND "posted_at" IS NULL;
