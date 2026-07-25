-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT;

-- CreateTable
CREATE TABLE "buyer_subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "contact_view_quota" INTEGER NOT NULL,
    "price_inr" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "duration_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "buyer_subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_subscriptions" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "quota_total" INTEGER NOT NULL,
    "quota_used" INTEGER NOT NULL DEFAULT 0,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "duration_days" INTEGER,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "razorpay_order_id" TEXT,
    "razorpay_payment_id" TEXT,
    "adjusted_by" TEXT,
    "adjusted_at" TIMESTAMP(3),
    "adjustment_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "buyer_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_views" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "buyer_subscription_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contact_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "buyer_subscription_plans_name_key" ON "buyer_subscription_plans"("name");

-- CreateIndex
CREATE INDEX "contact_views_buyer_id_idx" ON "contact_views"("buyer_id");

-- CreateIndex
CREATE INDEX "contact_views_seller_id_idx" ON "contact_views"("seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "contact_views_buyer_id_listing_id_key" ON "contact_views"("buyer_id", "listing_id");

-- AddForeignKey
ALTER TABLE "buyer_subscriptions" ADD CONSTRAINT "buyer_subscriptions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_subscriptions" ADD CONSTRAINT "buyer_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "buyer_subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_views" ADD CONSTRAINT "contact_views_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_views" ADD CONSTRAINT "contact_views_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_views" ADD CONSTRAINT "contact_views_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_views" ADD CONSTRAINT "contact_views_buyer_subscription_id_fkey" FOREIGN KEY ("buyer_subscription_id") REFERENCES "buyer_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
