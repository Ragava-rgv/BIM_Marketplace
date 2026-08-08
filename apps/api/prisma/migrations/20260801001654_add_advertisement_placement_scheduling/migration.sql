-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('IN_GRID', 'HOME_BANNER');

-- AlterTable
ALTER TABLE "advertisements" ADD COLUMN     "ends_at" TIMESTAMP(3),
ADD COLUMN     "placement" "AdPlacement" NOT NULL DEFAULT 'IN_GRID',
ADD COLUMN     "starts_at" TIMESTAMP(3);
