-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "description" TEXT,
ADD COLUMN     "imported_country" TEXT,
ADD COLUMN     "machine_location" TEXT,
ADD COLUMN     "origin" "ListingOrigin",
ADD COLUMN     "specs" JSONB;

-- CreateTable
CREATE TABLE "quote_media" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "quote_media_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "quote_media" ADD CONSTRAINT "quote_media_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
