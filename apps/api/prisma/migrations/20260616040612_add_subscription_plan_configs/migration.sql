-- AlterTable
ALTER TABLE "seller_subscriptions" ADD COLUMN     "duration_days" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "plan_config_id" TEXT;

-- CreateTable
CREATE TABLE "subscription_plan_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "listing_quota" INTEGER NOT NULL,
    "price_inr" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "duration_days" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plan_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_configs_name_key" ON "subscription_plan_configs"("name");

-- AddForeignKey
ALTER TABLE "seller_subscriptions" ADD CONSTRAINT "seller_subscriptions_plan_config_id_fkey" FOREIGN KEY ("plan_config_id") REFERENCES "subscription_plan_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
