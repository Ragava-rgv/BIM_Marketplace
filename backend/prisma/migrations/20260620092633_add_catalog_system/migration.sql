-- CreateEnum
CREATE TYPE "SpecFieldType" AS ENUM ('number', 'text', 'select', 'boolean');

-- CreateEnum
CREATE TYPE "SpecFilterType" AS ENUM ('range', 'exact', 'none');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "catalog_category_id" TEXT,
ADD COLUMN     "condition_grade" TEXT,
ADD COLUMN     "negotiable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "running_hours" INTEGER,
ADD COLUMN     "serial_number" TEXT,
ADD COLUMN     "specs" JSONB;

-- CreateTable
CREATE TABLE "category_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "category_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "group_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon_key" TEXT,
    "description" TEXT,
    "listing_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_spec_templates" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "field_label" TEXT NOT NULL,
    "unit" TEXT,
    "field_type" "SpecFieldType" NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_filterable" BOOLEAN NOT NULL DEFAULT false,
    "filter_type" "SpecFilterType" NOT NULL DEFAULT 'none',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "help_text" TEXT,

    CONSTRAINT "category_spec_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_groups_name_key" ON "category_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "category_spec_templates_category_id_field_key_key" ON "category_spec_templates"("category_id", "field_key");

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_catalog_category_id_fkey" FOREIGN KEY ("catalog_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "category_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_spec_templates" ADD CONSTRAINT "category_spec_templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
