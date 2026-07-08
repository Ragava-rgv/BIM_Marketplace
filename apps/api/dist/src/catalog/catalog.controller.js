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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCatalogController = exports.CategoriesController = exports.CategoryGroupsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const catalog_service_1 = require("./catalog.service");
const create_category_group_dto_1 = require("./dto/create-category-group.dto");
const create_category_dto_1 = require("./dto/create-category.dto");
const create_subcategory_dto_1 = require("./dto/create-subcategory.dto");
const add_spec_field_dto_1 = require("./dto/add-spec-field.dto");
const reorder_dto_1 = require("./dto/reorder.dto");
const imageUpload = (0, platform_express_1.FileInterceptor)('image', { storage: (0, multer_1.memoryStorage)() });
let CategoryGroupsController = class CategoryGroupsController {
    catalog;
    constructor(catalog) {
        this.catalog = catalog;
    }
    listGroups() {
        return this.catalog.listGroups();
    }
};
exports.CategoryGroupsController = CategoryGroupsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CategoryGroupsController.prototype, "listGroups", null);
exports.CategoryGroupsController = CategoryGroupsController = __decorate([
    (0, common_1.Controller)('category-groups'),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CategoryGroupsController);
let CategoriesController = class CategoriesController {
    catalog;
    constructor(catalog) {
        this.catalog = catalog;
    }
    listCategories() {
        return this.catalog.listCategories();
    }
    getBySlug(slug) {
        return this.catalog.getCategoryBySlug(slug);
    }
    getSpecTemplate(id) {
        return this.catalog.getCategoryWithSpecTemplate(id);
    }
    listPublicSubcategories(id) {
        return this.catalog.listSubcategories(id);
    }
};
exports.CategoriesController = CategoriesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "listCategories", null);
__decorate([
    (0, common_1.Get)('by-slug/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "getBySlug", null);
__decorate([
    (0, common_1.Get)(':id/spec-template'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "getSpecTemplate", null);
__decorate([
    (0, common_1.Get)(':id/subcategories'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "listPublicSubcategories", null);
exports.CategoriesController = CategoriesController = __decorate([
    (0, common_1.Controller)('categories'),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CategoriesController);
let AdminCatalogController = class AdminCatalogController {
    catalog;
    constructor(catalog) {
        this.catalog = catalog;
    }
    adminListGroups() {
        return this.catalog.adminListGroups();
    }
    createGroup(dto) {
        return this.catalog.createGroup(dto);
    }
    updateGroup(id, dto) {
        return this.catalog.updateGroup(id, dto);
    }
    deleteGroup(id) {
        return this.catalog.deleteGroup(id);
    }
    reorderGroups(dto) {
        return this.catalog.reorderGroups(dto.ids);
    }
    adminListCategories() {
        return this.catalog.listAllCategories();
    }
    createCategory(dto) {
        return this.catalog.createCategory(dto);
    }
    updateCategory(id, dto) {
        return this.catalog.updateCategory(id, dto);
    }
    deactivateCategory(id) {
        return this.catalog.softDeleteCategory(id);
    }
    deleteCategory(id) {
        return this.catalog.hardDeleteCategory(id);
    }
    reorderCategories(dto) {
        return this.catalog.reorderCategories(dto.ids);
    }
    uploadCategoryImage(id, file) {
        return this.catalog.uploadCategoryImage(id, file);
    }
    adminListSubcategories(id) {
        return this.catalog.listSubcategories(id);
    }
    createSubcategory(dto) {
        return this.catalog.createSubcategory(dto);
    }
    updateSubcategory(id, dto) {
        return this.catalog.updateSubcategory(id, dto);
    }
    deactivateSubcategory(id) {
        return this.catalog.softDeleteSubcategory(id);
    }
    deleteSubcategory(id) {
        return this.catalog.hardDeleteSubcategory(id);
    }
    reorderSubcategories(categoryId, dto) {
        return this.catalog.reorderSubcategories(categoryId, dto.ids);
    }
    uploadSubcategoryImage(id, file) {
        return this.catalog.uploadSubcategoryImage(id, file);
    }
    addSpecField(categoryId, dto) {
        return this.catalog.addSpecField(categoryId, dto);
    }
    updateSpecField(id, dto) {
        return this.catalog.updateSpecField(id, dto);
    }
    deleteSpecField(id) {
        return this.catalog.deleteSpecField(id);
    }
    reorderSpecFields(categoryId, dto) {
        return this.catalog.reorderSpecFields(categoryId, dto.ids);
    }
};
exports.AdminCatalogController = AdminCatalogController;
__decorate([
    (0, common_1.Get)('groups'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "adminListGroups", null);
__decorate([
    (0, common_1.Post)('groups'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_category_group_dto_1.CreateCategoryGroupDto]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Patch)('groups/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "updateGroup", null);
__decorate([
    (0, common_1.Delete)('groups/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "deleteGroup", null);
__decorate([
    (0, common_1.Post)('groups/reorder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reorder_dto_1.ReorderDto]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "reorderGroups", null);
__decorate([
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "adminListCategories", null);
__decorate([
    (0, common_1.Post)('categories'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_category_dto_1.CreateCategoryDto]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Patch)('categories/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Patch)('categories/:id/deactivate'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "deactivateCategory", null);
__decorate([
    (0, common_1.Delete)('categories/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "deleteCategory", null);
__decorate([
    (0, common_1.Post)('categories/reorder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reorder_dto_1.ReorderDto]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "reorderCategories", null);
__decorate([
    (0, common_1.Post)('categories/:id/image'),
    (0, common_1.UseInterceptors)(imageUpload),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "uploadCategoryImage", null);
__decorate([
    (0, common_1.Get)('categories/:id/subcategories'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "adminListSubcategories", null);
__decorate([
    (0, common_1.Post)('subcategories'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_subcategory_dto_1.CreateSubcategoryDto]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "createSubcategory", null);
__decorate([
    (0, common_1.Patch)('subcategories/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "updateSubcategory", null);
__decorate([
    (0, common_1.Patch)('subcategories/:id/deactivate'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "deactivateSubcategory", null);
__decorate([
    (0, common_1.Delete)('subcategories/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "deleteSubcategory", null);
__decorate([
    (0, common_1.Post)('categories/:id/subcategories/reorder'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reorder_dto_1.ReorderDto]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "reorderSubcategories", null);
__decorate([
    (0, common_1.Post)('subcategories/:id/image'),
    (0, common_1.UseInterceptors)(imageUpload),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "uploadSubcategoryImage", null);
__decorate([
    (0, common_1.Post)('categories/:id/spec-fields'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_spec_field_dto_1.AddSpecFieldDto]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "addSpecField", null);
__decorate([
    (0, common_1.Patch)('spec-fields/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "updateSpecField", null);
__decorate([
    (0, common_1.Delete)('spec-fields/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "deleteSpecField", null);
__decorate([
    (0, common_1.Post)('categories/:id/spec-fields/reorder'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reorder_dto_1.ReorderDto]),
    __metadata("design:returntype", void 0)
], AdminCatalogController.prototype, "reorderSpecFields", null);
exports.AdminCatalogController = AdminCatalogController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, common_1.Controller)('admin/catalog'),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], AdminCatalogController);
//# sourceMappingURL=catalog.controller.js.map