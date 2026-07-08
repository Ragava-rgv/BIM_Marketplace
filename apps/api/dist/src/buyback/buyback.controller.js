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
exports.BuybackController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const buyback_service_1 = require("./buyback.service");
const quote_buyback_dto_1 = require("./dto/quote-buyback.dto");
const update_buyback_agreement_dto_1 = require("./dto/update-buyback-agreement.dto");
let BuybackController = class BuybackController {
    buyback;
    constructor(buyback) {
        this.buyback = buyback;
    }
    async quote(dto) {
        return this.buyback.quote(dto);
    }
    async mine(user) {
        return this.buyback.listForBuyer(user.id);
    }
    async findOne(id) {
        return this.buyback.findById(id);
    }
    async accept(user, id) {
        return this.buyback.accept(id, user);
    }
    async listAll() {
        return this.buyback.listAll();
    }
    async initiateFromLoan(loanApplicationId) {
        return this.buyback.initiateFromLoanApplication(loanApplicationId);
    }
    async updateAgreement(id, dto) {
        return this.buyback.updateAgreement(id, dto);
    }
    async complete(id) {
        return this.buyback.complete(id);
    }
};
exports.BuybackController = BuybackController;
__decorate([
    (0, common_1.Post)('quote'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SELLER, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quote_buyback_dto_1.QuoteBuybackDto]),
    __metadata("design:returntype", Promise)
], BuybackController.prototype, "quote", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BuybackController.prototype, "mine", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BuybackController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)(client_1.UserRole.BUYER, client_1.UserRole.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BuybackController.prototype, "accept", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BuybackController.prototype, "listAll", null);
__decorate([
    (0, common_1.Post)('from-loan/:loanApplicationId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('loanApplicationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BuybackController.prototype, "initiateFromLoan", null);
__decorate([
    (0, common_1.Patch)(':id/agreement'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_buyback_agreement_dto_1.UpdateBuybackAgreementDto]),
    __metadata("design:returntype", Promise)
], BuybackController.prototype, "updateAgreement", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BuybackController.prototype, "complete", null);
exports.BuybackController = BuybackController = __decorate([
    (0, common_1.Controller)('buyback'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [buyback_service_1.BuybackService])
], BuybackController);
//# sourceMappingURL=buyback.controller.js.map