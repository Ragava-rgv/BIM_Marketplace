-- AlterTable
ALTER TABLE "users" ADD COLUMN     "active_mode" TEXT NOT NULL DEFAULT 'BUYER',
ADD COLUMN     "can_sell" BOOLEAN NOT NULL DEFAULT false;
