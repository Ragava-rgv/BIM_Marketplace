-- CreateEnum
CREATE TYPE "SupportedLanguage" AS ENUM ('EN', 'TA', 'HI');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferred_language" "SupportedLanguage" NOT NULL DEFAULT 'EN';
