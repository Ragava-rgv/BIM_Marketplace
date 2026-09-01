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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const admin_service_1 = require("./admin.service");
const listings_service_1 = require("../listings/listings.service");
const query_listings_dto_1 = require("../listings/dto/query-listings.dto");
const bulk_listing_status_dto_1 = require("./dto/bulk-listing-status.dto");
const requirements_service_1 = require("../requirements/requirements.service");
const query_requirements_dto_1 = require("../requirements/dto/query-requirements.dto");
let AdminController = class AdminController {
    admin;
    listings;
    requirements;
    constructor(admin, listings, requirements) {
        this.admin = admin;
        this.listings = listings;
        this.requirements = requirements;
    }
    async dashboard() {
        return this.admin.dashboardSummary();
    }
    async listingQueue(query) {
        return this.listings.adminList(query);
    }
    async listingDetail(id) {
        return this.listings.findAnyById(id);
    }
    async approveListing(id) {
        return this.listings.approve(id);
    }
    async rejectListing(id) {
        return this.listings.reject(id);
    }
    async markSoldListing(id) {
        return this.listings.markSold(id);
    }
    async markInactiveListing(id) {
        return this.listings.markInactive(id);
    }
    async reactivateListing(id) {
        return this.listings.reactivate(id);
    }
    async bulkListingStatus(dto) {
        const action = this.resolveBulkAction(dto.action);
        const results = await Promise.allSettled(dto.ids.map((id) => action(id)));
        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results
            .map((r, i) => ({ r, id: dto.ids[i] }))
            .filter(({ r }) => r.status === 'rejected')
            .map(({ r, id }) => ({ id, error: r.reason?.message ?? 'Failed' }));
        return { succeeded, failed };
    }
    resolveBulkAction(action) {
        switch (action) {
            case 'approve':
                return (id) => this.listings.approve(id);
            case 'reject':
                return (id) => this.listings.reject(id);
            case 'mark-sold':
                return (id) => this.listings.markSold(id);
            case 'mark-inactive':
                return (id) => this.listings.markInactive(id);
            case 'reactivate':
                return (id) => this.listings.reactivate(id);
        }
    }
    async requirementQueue(query) {
        return this.requirements.adminList(query);
    }
    async requirementDetail(id) {
        return this.requirements.findAnyById(id);
    }
    async approveRequirement(id) {
        return this.requirements.approve(id);
    }
    async rejectRequirement(id) {
        return this.requirements.reject(id);
    }
    async quoteQueue(status) {
        return this.requirements.adminListQuotes(status);
    }
    async approveQuote(id) {
        return this.requirements.approveQuote(id);
    }
    async rejectQuote(id) {
        return this.requirements.rejectQuote(id);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('listings'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_listings_dto_1.AdminQueryListingsDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listingQueue", null);
__decorate([
    (0, common_1.Get)('listings/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listingDetail", null);
__decorate([
    (0, common_1.Post)('listings/:id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveListing", null);
__decorate([
    (0, common_1.Post)('listings/:id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectListing", null);
__decorate([
    (0, common_1.Post)('listings/:id/mark-sold'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "markSoldListing", null);
__decorate([
    (0, common_1.Post)('listings/:id/mark-inactive'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "markInactiveListing", null);
__decorate([
    (0, common_1.Post)('listings/:id/reactivate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "reactivateListing", null);
__decorate([
    (0, common_1.Post)('listings/bulk-status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_listing_status_dto_1.BulkListingStatusDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "bulkListingStatus", null);
__decorate([
    (0, common_1.Get)('requirements'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_requirements_dto_1.AdminQueryRequirementsDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "requirementQueue", null);
__decorate([
    (0, common_1.Get)('requirements/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "requirementDetail", null);
__decorate([
    (0, common_1.Post)('requirements/:id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveRequirement", null);
__decorate([
    (0, common_1.Post)('requirements/:id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectRequirement", null);
__decorate([
    (0, common_1.Get)('quotes'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "quoteQueue", null);
__decorate([
    (0, common_1.Post)('quotes/:id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveQuote", null);
__decorate([
    (0, common_1.Post)('quotes/:id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectQuote", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        listings_service_1.ListingsService,
        requirements_service_1.RequirementsService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map