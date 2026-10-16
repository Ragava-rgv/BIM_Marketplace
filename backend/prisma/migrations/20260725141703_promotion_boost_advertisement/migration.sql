-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "boost_expires_at" TIMESTAMP(3),
ADD COLUMN     "is_boosted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "promotion_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "price_inr" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "duration_days" INTEGER NOT NULL,
    "sort_weight" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "promotion_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_boosts" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "duration_days" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertisements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "link_url" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promotion_plans_name_key" ON "promotion_plans"("name");

-- AddForeignKey
ALTER TABLE "listing_boosts" ADD CONSTRAINT "listing_boosts_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_boosts" ADD CONSTRAINT "listing_boosts_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_boosts" ADD CONSTRAINT "listing_boosts_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "promotion_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
