import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService, CATEGORY_IMAGES_DIR } from '../storage/storage.service';
import type { CreateCategoryGroupDto } from './dto/create-category-group.dto';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import type { AddSpecFieldDto } from './dto/add-spec-field.dto';

const SUBCATEGORY_INCLUDE = {
  subcategories: {
    orderBy: { displayOrder: 'asc' as const },
  },
};

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // ── Public ────────────────────────────────────────────────────────────────

  async listGroups() {
    return this.prisma.categoryGroup.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            subcategories: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  async listCategories() {
    const [catCounts, subCounts] = await Promise.all([
      this.prisma.listing.groupBy({
        by: ['machineCategory'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
      }),
      this.prisma.listing.groupBy({
        by: ['machineSubcategory'],
        where: { status: 'ACTIVE', machineSubcategory: { not: null } },
        _count: { id: true },
      }),
    ]);
    const catCountMap = new Map(catCounts.map((c) => [c.machineCategory.toLowerCase(), c._count.id]));
    const subCountMap = new Map(
      subCounts
        .filter((s) => s.machineSubcategory)
        .map((s) => [s.machineSubcategory!.toLowerCase(), s._count.id]),
    );

    const cats = await this.prisma.category.findMany({
      where: {
        isActive: true,
        subcategories: { some: { isActive: true } }, // top-level only: categories that have subcategories
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return cats.map((cat) => ({
      ...cat,
      listingCount: catCountMap.get(cat.name.toLowerCase()) ?? 0,
      subcategories: cat.subcategories.map((sub) => ({
        ...sub,
        listingCount: subCountMap.get(sub.name.toLowerCase()) ?? 0,
      })),
    }));
  }

  async getCategoryWithSpecTemplate(categoryId: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        specFields: { orderBy: { displayOrder: 'asc' } },
        subcategories: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async getCategoryBySlug(slug: string) {
    const cat = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        specFields: { orderBy: { displayOrder: 'asc' } },
        subcategories: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  // ── Admin: category groups ────────────────────────────────────────────────

  async adminListGroups() {
    return this.prisma.categoryGroup.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        categories: {
          orderBy: { displayOrder: 'asc' },
          include: SUBCATEGORY_INCLUDE,
        },
      },
    });
  }

  async createGroup(dto: CreateCategoryGroupDto) {
    return this.prisma.categoryGroup.create({
      data: {
        name: dto.name,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateGroup(id: string, dto: Partial<CreateCategoryGroupDto>) {
    await this.requireGroup(id);
    return this.prisma.categoryGroup.update({ where: { id }, data: dto });
  }

  async deleteGroup(id: string) {
    await this.requireGroup(id);
    const count = await this.prisma.category.count({ where: { groupId: id } });
    if (count > 0) {
      throw new BadRequestException('Cannot delete a group that still has categories — reassign or delete them first');
    }
    await this.prisma.categoryGroup.delete({ where: { id } });
  }

  async reorderGroups(ids: string[]) {
    await Promise.all(
      ids.map((id, index) =>
        this.prisma.categoryGroup.update({ where: { id }, data: { displayOrder: index } }),
      ),
    );
  }

  // ── Admin: categories ─────────────────────────────────────────────────────

  async listAllCategories() {
    return this.prisma.category.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        group: true,
        specFields: { orderBy: { displayOrder: 'asc' } },
        subcategories: { orderBy: { displayOrder: 'asc' } },
        _count: { select: { listings: true } },
      },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException(`Slug "${dto.slug}" is already taken`);
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        groupId: dto.groupId ?? null,
        iconKey: dto.iconKey ?? null,
        description: dto.description ?? null,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: SUBCATEGORY_INCLUDE,
    });
  }

  async updateCategory(id: string, dto: Partial<CreateCategoryDto>) {
    await this.requireCategory(id);
    if (dto.slug) {
      const clash = await this.prisma.category.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (clash) throw new BadRequestException(`Slug "${dto.slug}" is already taken`);
    }
    return this.prisma.category.update({
      where: { id },
      data: dto,
      include: SUBCATEGORY_INCLUDE,
    });
  }

  async softDeleteCategory(id: string) {
    await this.requireCategory(id);
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDeleteCategory(id: string) {
    await this.requireCategory(id);
    const listingCount = await this.prisma.listing.count({ where: { catalogCategoryId: id } });
    if (listingCount > 0) {
      throw new BadRequestException(
        `Cannot permanently delete: ${listingCount} listing(s) reference this category. Deactivate it instead.`,
      );
    }
    const subCount = await this.prisma.subcategory.count({ where: { categoryId: id } });
    if (subCount > 0) {
      throw new BadRequestException(
        `Cannot permanently delete: ${subCount} subcategory/ies exist. Delete them first.`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }

  /** @deprecated kept for backward compat with old controller method — routes to softDelete */
  async deleteCategory(id: string) {
    return this.softDeleteCategory(id);
  }

  async reorderCategories(ids: string[]) {
    await Promise.all(
      ids.map((id, index) =>
        this.prisma.category.update({ where: { id }, data: { displayOrder: index } }),
      ),
    );
  }

  async uploadCategoryImage(categoryId: string, file: Express.Multer.File) {
    await this.requireCategory(categoryId);
    const uploaded = await this.storage.upload(file, CATEGORY_IMAGES_DIR);
    return this.prisma.category.update({
      where: { id: categoryId },
      data: { imageUrl: uploaded.url },
      include: SUBCATEGORY_INCLUDE,
    });
  }

  // ── Admin: subcategories ──────────────────────────────────────────────────

  async listSubcategories(categoryId: string) {
    await this.requireCategory(categoryId);
    return this.prisma.subcategory.findMany({
      where: { categoryId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createSubcategory(dto: CreateSubcategoryDto) {
    await this.requireCategory(dto.categoryId);
    const clash = await this.prisma.subcategory.findFirst({
      where: { categoryId: dto.categoryId, slug: dto.slug },
    });
    if (clash) throw new BadRequestException(`Slug "${dto.slug}" already exists in this category`);
    return this.prisma.subcategory.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        slug: dto.slug,
        iconKey: dto.iconKey ?? null,
        description: dto.description ?? null,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateSubcategory(id: string, dto: Partial<Omit<CreateSubcategoryDto, 'categoryId'>>) {
    const sub = await this.requireSubcategory(id);
    if (dto.slug && dto.slug !== sub.slug) {
      const clash = await this.prisma.subcategory.findFirst({
        where: { categoryId: sub.categoryId, slug: dto.slug, id: { not: id } },
      });
      if (clash) throw new BadRequestException(`Slug "${dto.slug}" already exists in this category`);
    }
    return this.prisma.subcategory.update({ where: { id }, data: dto });
  }

  async softDeleteSubcategory(id: string) {
    await this.requireSubcategory(id);
    return this.prisma.subcategory.update({ where: { id }, data: { isActive: false } });
  }

  async hardDeleteSubcategory(id: string) {
    await this.requireSubcategory(id);
    await this.prisma.subcategory.delete({ where: { id } });
    return { deleted: true };
  }

  async reorderSubcategories(categoryId: string, ids: string[]) {
    await this.requireCategory(categoryId);
    await Promise.all(
      ids.map((id, index) =>
        this.prisma.subcategory.update({ where: { id }, data: { displayOrder: index } }),
      ),
    );
  }

  async uploadSubcategoryImage(subcategoryId: string, file: Express.Multer.File) {
    await this.requireSubcategory(subcategoryId);
    const uploaded = await this.storage.upload(file, CATEGORY_IMAGES_DIR);
    return this.prisma.subcategory.update({
      where: { id: subcategoryId },
      data: { imageUrl: uploaded.url },
    });
  }

  // ── Admin: spec fields ────────────────────────────────────────────────────

  async addSpecField(categoryId: string, dto: AddSpecFieldDto) {
    await this.requireCategory(categoryId);
    const existing = await this.prisma.categorySpecTemplate.findFirst({
      where: { categoryId, fieldKey: dto.fieldKey },
    });
    if (existing) {
      throw new BadRequestException(`Field key "${dto.fieldKey}" already exists on this category`);
    }
    return this.prisma.categorySpecTemplate.create({
      data: {
        categoryId,
        fieldKey: dto.fieldKey,
        fieldLabel: dto.fieldLabel,
        unit: dto.unit ?? null,
        fieldType: dto.fieldType,
        options: dto.options ?? [],
        isRequired: dto.isRequired ?? false,
        isFilterable: dto.isFilterable ?? false,
        filterType: dto.filterType ?? 'none',
        displayOrder: dto.displayOrder ?? 0,
        helpText: dto.helpText ?? null,
      },
    });
  }

  async updateSpecField(fieldId: string, dto: Partial<AddSpecFieldDto>) {
    const field = await this.prisma.categorySpecTemplate.findUnique({ where: { id: fieldId } });
    if (!field) throw new NotFoundException('Spec field not found');
    return this.prisma.categorySpecTemplate.update({ where: { id: fieldId }, data: dto });
  }

  async deleteSpecField(fieldId: string) {
    const field = await this.prisma.categorySpecTemplate.findUnique({ where: { id: fieldId } });
    if (!field) throw new NotFoundException('Spec field not found');
    await this.prisma.categorySpecTemplate.delete({ where: { id: fieldId } });
  }

  async reorderSpecFields(categoryId: string, ids: string[]) {
    await Promise.all(
      ids.map((id, index) =>
        this.prisma.categorySpecTemplate.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async requireGroup(id: string) {
    const g = await this.prisma.categoryGroup.findUnique({ where: { id } });
    if (!g) throw new NotFoundException('Category group not found');
    return g;
  }

  private async requireCategory(id: string) {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  private async requireSubcategory(id: string) {
    const s = await this.prisma.subcategory.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Subcategory not found');
    return s;
  }
}
