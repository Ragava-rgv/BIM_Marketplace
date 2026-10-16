-- CreateEnum
CREATE TYPE "ListingCondition" AS ENUM ('OLD', 'NEW');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "condition" "ListingCondition" NOT NULL DEFAULT 'OLD';
