-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CLOSED');

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_buyer_id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_listing_id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_seller_id_fkey";

-- DropForeignKey
ALTER TABLE "loan_applications" DROP CONSTRAINT "loan_applications_partner_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- AlterTable
ALTER TABLE "certifications" ADD COLUMN     "inspection_report" JSONB;

-- AlterTable
ALTER TABLE "loan_applications" ALTER COLUMN "partner_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "location_city" TEXT,
ADD COLUMN     "location_state" TEXT;

-- DropTable
DROP TABLE "conversations";

-- DropTable
DROP TABLE "messages";

-- DropEnum
DROP TYPE "ConversationStatus";

-- CreateTable
CREATE TABLE "enquiries" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "enquiries_listing_id_buyer_id_key" ON "enquiries"("listing_id", "buyer_id");

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "finance_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
