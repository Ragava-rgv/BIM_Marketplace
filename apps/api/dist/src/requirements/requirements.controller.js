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
exports.RequirementsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const requirements_service_1 = require("./requirements.service");
const create_requirement_dto_1 = require("./dto/create-requirement.dto");
const update_requirement_dto_1 = require("./dto/update-requirement.dto");
const query_requirements_dto_1 = require("./dto/query-requirements.dto");
const upload_requirement_media_dto_1 = require("./dto/upload-requirement-media.dto");
const submit_quote_dto_1 = require("./dto/submit-quote.dto");
const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;
const MAX_QUOTE_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_QUOTE_PHOTOS = 16;
let RequirementsController = class RequirementsController {
    requirements;
    constructor(requirements) {
        this.requirements = requirements;
    }
    async browse(query) {
        return this.requirements.browse(query);
    }
    async getOne(id) {
        return this.requirements.findPublicById(id);
    }
    async create(user, dto) {
        return this.requirements.create(user.id, dto);
    }
    async findMine(user) {
        return this.requirements.findMine(user.id);
    }
    async findOwned(user, id) {
        return this.requirements.findOwned(user.id, id);
    }
    async update(user, id, dto) {
        return this.requirements.update(user.id, id, dto);
    }
    async close(user, id) {
        return this.requirements.close(user.id, id);
    }
    async markFulfilled(user, id) {
        return this.requirements.markFulfilled(user.id, id);
    }
    async addMedia(user, id, dto, file) {
        return this.requirements.addMedia(user.id, id, dto, file);
    }
    async removeMedia(user, id, mediaId) {
        await this.requirements.removeMedia(user.id, id, mediaId);
        return { removed: true };
    }
    async quotesReceived(user, id) {
        return this.requirements.findQuotesForRequirement(user.id, id);
    }
    async submitQuote(user, id, dto, photos) {
        return this.requirements.submitQuote(user.id, id, dto, photos ?? []);
    }
};
exports.RequirementsController = RequirementsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_requirements_dto_1.QueryRequirementsDto]),
    __metadata("design:returntype", Promise)
], RequirementsController.prototype, "browse", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RequirementsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_requirement_dto_1.CreateRequirementDto]),
    __metadata("design:returntype", Promise)
], RequirementsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('mine/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RequirementsController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)('mine/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RequirementsController.prototype, "findOwned", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_requirement_dto_1.UpdateRequirementDto]),
    __metadata("design:returntype", Promise)
], RequirementsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/close'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RequirementsController.prototype, "close", null);
__decorate([
    (0, common_1.Post)(':id/fulfilled'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RequirementsController.prototype, "markFulfilled", null);
__decorate([
    (0, common_1.Post)(':id/media'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.SELLER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: MAX_UPLOAD_BYTES } })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, upload_requirement_media_dto_1.UploadRequirementMediaDto, Object]),
    __metadata("design:returntype", Promise)
], RequirementsController.prototype, "addMedia", null);
__decorate([
    (0, common_1.Delete)(':id/media/:mediaId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('mediaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], RequirementsController.prototype, "removeMedia", null);
__decorate([
    (0, common_1.Get)(':id/quotes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RequirementsController.prototype, "quotesReceived", null);
__decorate([
    (0, common_1.Post)(':id/quotes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SELLER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('photos', MAX_QUOTE_PHOTOS, {
        limits: { fileSize: MAX_QUOTE_PHOTO_BYTES },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, submit_quote_dto_1.SubmitQuoteDto, Array]),
    __metadata("design:returntype", Promise)
], RequirementsController.prototype, "submitQuote", null);
exports.RequirementsController = RequirementsController = __decorate([
    (0, common_1.Controller)('requirements'),
    __metadata("design:paramtypes", [requirements_service_1.RequirementsService])
], RequirementsController);
//# sourceMappingURL=requirements.controller.js.map