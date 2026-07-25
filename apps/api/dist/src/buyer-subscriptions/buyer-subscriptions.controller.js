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
exports.AdminBuyerSubscriptionsController = exports.BuyerSubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@machinebazaar/shared");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const buyer_subscriptions_service_1 = require("./buyer-subscriptions.service");
const subscribe_dto_1 = require("./dto/subscribe.dto");
const admin_query_dto_1 = require("./dto/admin-query.dto");
let BuyerSubscriptionsController = class BuyerSubscriptionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    getStatus(user) {
        return this.service.getStatus(user.id);
    }
    createOrder(user, dto) {
        return this.service.createOrder(user.id, dto);
    }
    verify(user, dto) {
        return this.service.verifyAndActivate(user.id, dto);
    }
    revealStatus(user, listingId) {
        return this.service.revealStatus(user.id, listingId);
    }
    reveal(user, listingId) {
        return this.service.reveal(user.id, listingId);
    }
    listContactViews(user, page, pageSize) {
        return this.service.listContactViews(user.id, Number(page) || 1, Number(pageSize) || 20);
    }
};
exports.BuyerSubscriptionsController = BuyerSubscriptionsController;
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.BUYER, shared_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BuyerSubscriptionsController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('order'),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.BUYER, shared_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, subscribe_dto_1.CreateBuyerSubscriptionOrderDto]),
    __metadata("design:returntype", void 0)
], BuyerSubscriptionsController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.BUYER, shared_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, subscribe_dto_1.VerifyBuyerSubscriptionDto]),
    __metadata("design:returntype", void 0)
], BuyerSubscriptionsController.prototype, "verify", null);
__decorate([
    (0, common_1.Get)('reveal-status/:listingId'),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.BUYER, shared_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('listingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BuyerSubscriptionsController.prototype, "revealStatus", null);
__decorate([
    (0, common_1.Post)('reveal/:listingId'),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.BUYER, shared_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('listingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BuyerSubscriptionsController.prototype, "reveal", null);
__decorate([
    (0, common_1.Get)('contact-views'),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.BUYER, shared_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], BuyerSubscriptionsController.prototype, "listContactViews", null);
exports.BuyerSubscriptionsController = BuyerSubscriptionsController = __decorate([
    (0, common_1.Controller)('buyer-subscriptions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [buyer_subscriptions_service_1.BuyerSubscriptionsService])
], BuyerSubscriptionsController);
let AdminBuyerSubscriptionsController = class AdminBuyerSubscriptionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(query) {
        return this.service.adminList(query.search, query.page ?? 1, query.pageSize ?? 20);
    }
    adjustQuota(admin, id, dto) {
        return this.service.adjustQuota(id, admin.id, dto.delta, dto.reason);
    }
};
exports.AdminBuyerSubscriptionsController = AdminBuyerSubscriptionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_query_dto_1.AdminQueryBuyerSubscriptionsDto]),
    __metadata("design:returntype", void 0)
], AdminBuyerSubscriptionsController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)(':id/adjust-quota'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_query_dto_1.AdjustQuotaDto]),
    __metadata("design:returntype", void 0)
], AdminBuyerSubscriptionsController.prototype, "adjustQuota", null);
exports.AdminBuyerSubscriptionsController = AdminBuyerSubscriptionsController = __decorate([
    (0, common_1.Controller)('admin/buyer-subscriptions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [buyer_subscriptions_service_1.BuyerSubscriptionsService])
], AdminBuyerSubscriptionsController);
//# sourceMappingURL=buyer-subscriptions.controller.js.map