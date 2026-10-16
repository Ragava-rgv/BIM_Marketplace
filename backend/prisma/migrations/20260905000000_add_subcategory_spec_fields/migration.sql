-- DropIndex
DROP INDEX "category_spec_templates_category_id_field_key_key";

-- AlterTable
ALTER TABLE "category_spec_templates" ADD COLUMN     "subcategory_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "category_spec_templates_category_id_subcategory_id_field_ke_key" ON "category_spec_templates"("category_id", "subcategory_id", "field_key");

-- AddForeignKey
ALTER TABLE "category_spec_templates" ADD CONSTRAINT "category_spec_templates_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

