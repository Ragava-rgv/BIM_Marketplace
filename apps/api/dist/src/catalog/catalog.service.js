"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const SUBCATEGORY_INCLUDE = {
    subcategories: {
        orderBy: { displayOrder: 'asc' },
    },
};
let CatalogService = class CatalogService {
    prisma;
    storage;
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
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
        const subCountMap = new Map(subCounts
            .filter((s) => s.machineSubcategory)
            .map((s) => [s.machineSubcategory.toLowerCase(), s._count.id]));
        const cats = await this.prisma.category.findMany({
            where: {
                isActive: true,
                subcategories: { some: { isActive: true } },
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
    async getCategoryWithSpecTemplate(categoryId, subcategoryId) {
        const cat = await this.prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                specFields: {
                    where: subcategoryId
                        ? { OR: [{ subcategoryId: null }, { subcategoryId }] }
                        : { subcategoryId: null },
                    orderBy: { displayOrder: 'asc' },
                },
                subcategories: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        cat.specFields.sort((a, b) => Number(a.subcategoryId !== null) - Number(b.subcategoryId !== null));
        return cat;
    }
    async getCategoryBySlug(slug) {
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
        if (!cat)
            throw new common_1.NotFoundException('Category not found');
        return cat;
    }
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
    async createGroup(dto) {
        return this.prisma.categoryGroup.create({
            data: {
                name: dto.name,
                displayOrder: dto.displayOrder ?? 0,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async updateGroup(id, dto) {
        await this.requireGroup(id);
        return this.prisma.categoryGroup.update({ where: { id }, data: dto });
    }
    async deleteGroup(id) {
        await this.requireGroup(id);
        const count = await this.prisma.category.count({ where: { groupId: id } });
        if (count > 0) {
            throw new common_1.BadRequestException('Cannot delete a group that still has categories — reassign or delete them first');
        }
        await this.prisma.categoryGroup.delete({ where: { id } });
    }
    async reorderGroups(ids) {
        await Promise.all(ids.map((id, index) => this.prisma.categoryGroup.update({
            where: { id },
            data: { displayOrder: index },
        })));
    }
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
    async createCategory(dto) {
        const existing = await this.prisma.category.findUnique({
            where: { slug: dto.slug },
        });
        if (existing)
            throw new common_1.BadRequestException(`Slug "${dto.slug}" is already taken`);
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
    async updateCategory(id, dto) {
        await this.requireCategory(id);
        if (dto.slug) {
            const clash = await this.prisma.category.findFirst({
                where: { slug: dto.slug, id: { not: id } },
            });
            if (clash)
                throw new common_1.BadRequestException(`Slug "${dto.slug}" is already taken`);
        }
        return this.prisma.category.update({
            where: { id },
            data: dto,
            include: SUBCATEGORY_INCLUDE,
        });
    }
    async softDeleteCategory(id) {
        await this.requireCategory(id);
        return this.prisma.category.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async hardDeleteCategory(id) {
        await this.requireCategory(id);
        const listingCount = await this.prisma.listing.count({
            where: { catalogCategoryId: id },
        });
        if (listingCount > 0) {
            throw new common_1.BadRequestException(`Cannot permanently delete: ${listingCount} listing(s) reference this category. Deactivate it instead.`);
        }
        const subCount = await this.prisma.subcategory.count({
            where: { categoryId: id },
        });
        if (subCount > 0) {
            throw new common_1.BadRequestException(`Cannot permanently delete: ${subCount} subcategory/ies exist. Delete them first.`);
        }
        await this.prisma.category.delete({ where: { id } });
        return { deleted: true };
    }
    async deleteCategory(id) {
        return this.softDeleteCategory(id);
    }
    async reorderCategories(ids) {
        await Promise.all(ids.map((id, index) => this.prisma.category.update({
            where: { id },
            data: { displayOrder: index },
        })));
    }
    async uploadCategoryImage(categoryId, file) {
        await this.requireCategory(categoryId);
        const uploaded = await this.storage.upload(file, storage_service_1.CATEGORY_IMAGES_DIR);
        return this.prisma.category.update({
            where: { id: categoryId },
            data: { imageUrl: uploaded.url },
            include: SUBCATEGORY_INCLUDE,
        });
    }
    async listSubcategories(categoryId) {
        await this.requireCategory(categoryId);
        return this.prisma.subcategory.findMany({
            where: { categoryId },
            orderBy: { displayOrder: 'asc' },
        });
    }
    async createSubcategory(dto) {
        await this.requireCategory(dto.categoryId);
        const clash = await this.prisma.subcategory.findFirst({
            where: { categoryId: dto.categoryId, slug: dto.slug },
        });
        if (clash)
            throw new common_1.BadRequestException(`Slug "${dto.slug}" already exists in this category`);
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
    async updateSubcategory(id, dto) {
        const sub = await this.requireSubcategory(id);
        if (dto.slug && dto.slug !== sub.slug) {
            const clash = await this.prisma.subcategory.findFirst({
                where: { categoryId: sub.categoryId, slug: dto.slug, id: { not: id } },
            });
            if (clash)
                throw new common_1.BadRequestException(`Slug "${dto.slug}" already exists in this category`);
        }
        return this.prisma.subcategory.update({ where: { id }, data: dto });
    }
    async softDeleteSubcategory(id) {
        await this.requireSubcategory(id);
        return this.prisma.subcategory.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async hardDeleteSubcategory(id) {
        await this.requireSubcategory(id);
        await this.prisma.subcategory.delete({ where: { id } });
        return { deleted: true };
    }
    async reorderSubcategories(categoryId, ids) {
        await this.requireCategory(categoryId);
        await Promise.all(ids.map((id, index) => this.prisma.subcategory.update({
            where: { id },
            data: { displayOrder: index },
        })));
    }
    async uploadSubcategoryImage(subcategoryId, file) {
        await this.requireSubcategory(subcategoryId);
        const uploaded = await this.storage.upload(file, storage_service_1.CATEGORY_IMAGES_DIR);
        return this.prisma.subcategory.update({
            where: { id: subcategoryId },
            data: { imageUrl: uploaded.url },
        });
    }
    async addSpecField(categoryId, dto) {
        await this.requireCategory(categoryId);
        if (dto.subcategoryId) {
            const sub = await this.prisma.subcategory.findUnique({
                where: { id: dto.subcategoryId },
            });
            if (!sub || sub.categoryId !== categoryId) {
                throw new common_1.BadRequestException('subcategoryId must belong to this category');
            }
        }
        const existing = await this.prisma.categorySpecTemplate.findFirst({
            where: {
                categoryId,
                subcategoryId: dto.subcategoryId ?? null,
                fieldKey: dto.fieldKey,
            },
        });
        if (existing) {
            const scope = dto.subcategoryId
                ? 'this subcategory'
                : "this category's common fields";
            throw new common_1.BadRequestException(`Field key "${dto.fieldKey}" already exists on ${scope}`);
        }
        return this.prisma.categorySpecTemplate.create({
            data: {
                categoryId,
                subcategoryId: dto.subcategoryId ?? null,
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
    async updateSpecField(fieldId, dto) {
        const field = await this.prisma.categorySpecTemplate.findUnique({
            where: { id: fieldId },
        });
        if (!field)
            throw new common_1.NotFoundException('Spec field not found');
        return this.prisma.categorySpecTemplate.update({
            where: { id: fieldId },
            data: dto,
        });
    }
    async deleteSpecField(fieldId) {
        const field = await this.prisma.categorySpecTemplate.findUnique({
            where: { id: fieldId },
        });
        if (!field)
            throw new common_1.NotFoundException('Spec field not found');
        await this.prisma.categorySpecTemplate.delete({ where: { id: fieldId } });
    }
    async reorderSpecFields(categoryId, ids) {
        await Promise.all(ids.map((id, index) => this.prisma.categorySpecTemplate.update({
            where: { id },
            data: { displayOrder: index },
        })));
    }
    async requireGroup(id) {
        const g = await this.prisma.categoryGroup.findUnique({ where: { id } });
        if (!g)
            throw new common_1.NotFoundException('Category group not found');
        return g;
    }
    async requireCategory(id) {
        const c = await this.prisma.category.findUnique({ where: { id } });
        if (!c)
            throw new common_1.NotFoundException('Category not found');
        return c;
    }
    async requireSubcategory(id) {
        const s = await this.prisma.subcategory.findUnique({ where: { id } });
        if (!s)
            throw new common_1.NotFoundException('Subcategory not found');
        return s;
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map