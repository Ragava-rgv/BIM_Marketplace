-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'FULFILLED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING_ADMIN', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "requirements" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "machine_category" TEXT NOT NULL,
    "machine_subcategory" TEXT,
    "origin" "ListingOrigin",
    "imported_country" TEXT,
    "manufacture_year" INTEGER,
    "running_hours" INTEGER,
    "condition" "ListingCondition",
    "complexity_tier" "ComplexityTier" NOT NULL DEFAULT 'STANDARD',
    "catalog_category_id" TEXT,
    "subcategory_id" TEXT,
    "specs" JSONB,
    "budget_min" DECIMAL(14,2),
    "budget_max" DECIMAL(14,2),
    "quantity" INTEGER DEFAULT 1,
    "location_city" TEXT,
    "location_state" TEXT,
    "status" "RequirementStatus" NOT NULL DEFAULT 'DRAFT',
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement_media" (
    "id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "requirement_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "responder_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "machine_make" TEXT,
    "machine_model" TEXT,
    "manufacture_year" INTEGER,
    "condition" "ListingCondition",
    "price" DECIMAL(14,2),
    "message" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING_ADMIN',
    "admin_reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "requirements_status_idx" ON "requirements"("status");

-- CreateIndex
CREATE INDEX "requirements_machine_category_idx" ON "requirements"("machine_category");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_catalog_category_id_fkey" FOREIGN KEY ("catalog_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement_media" ADD CONSTRAINT "requirement_media_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_responder_id_fkey" FOREIGN KEY ("responder_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
