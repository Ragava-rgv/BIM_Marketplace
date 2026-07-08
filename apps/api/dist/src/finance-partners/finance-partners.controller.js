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
exports.FinancePartnersController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const finance_partners_service_1 = require("./finance-partners.service");
const create_finance_partner_dto_1 = require("./dto/create-finance-partner.dto");
const update_finance_partner_dto_1 = require("./dto/update-finance-partner.dto");
let FinancePartnersController = class FinancePartnersController {
    partners;
    constructor(partners) {
        this.partners = partners;
    }
    async listActive() {
        return this.partners.listActive();
    }
    async listAll() {
        return this.partners.listAll();
    }
    async create(dto) {
        return this.partners.create(dto);
    }
    async update(id, dto) {
        return this.partners.update(id, dto);
    }
};
exports.FinancePartnersController = FinancePartnersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinancePartnersController.prototype, "listActive", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinancePartnersController.prototype, "listAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_finance_partner_dto_1.CreateFinancePartnerDto]),
    __metadata("design:returntype", Promise)
], FinancePartnersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_finance_partner_dto_1.UpdateFinancePartnerDto]),
    __metadata("design:returntype", Promise)
], FinancePartnersController.prototype, "update", null);
exports.FinancePartnersController = FinancePartnersController = __decorate([
    (0, common_1.Controller)('finance-partners'),
    __metadata("design:paramtypes", [finance_partners_service_1.FinancePartnersService])
], FinancePartnersController);
//# sourceMappingURL=finance-partners.controller.js.map