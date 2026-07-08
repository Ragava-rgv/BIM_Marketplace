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
exports.ContactPaymentsController = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@machinebazaar/shared");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const contact_payments_service_1 = require("./contact-payments.service");
const contact_payment_dto_1 = require("./dto/contact-payment.dto");
let ContactPaymentsController = class ContactPaymentsController {
    service;
    constructor(service) {
        this.service = service;
    }
    check(user, listingId) {
        return this.service.check(user.id, listingId);
    }
    createOrder(user, dto) {
        return this.service.createOrder(user.id, dto);
    }
    verify(user, dto) {
        return this.service.verifyAndReveal(user.id, dto);
    }
};
exports.ContactPaymentsController = ContactPaymentsController;
__decorate([
    (0, common_1.Get)('check/:listingId'),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.BUYER, shared_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('listingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ContactPaymentsController.prototype, "check", null);
__decorate([
    (0, common_1.Post)('order'),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.BUYER, shared_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, contact_payment_dto_1.CreateContactOrderDto]),
    __metadata("design:returntype", void 0)
], ContactPaymentsController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, roles_decorator_1.Roles)(shared_1.UserRole.BUYER, shared_1.UserRole.SELLER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, contact_payment_dto_1.VerifyContactPaymentDto]),
    __metadata("design:returntype", void 0)
], ContactPaymentsController.prototype, "verify", null);
exports.ContactPaymentsController = ContactPaymentsController = __decorate([
    (0, common_1.Controller)('contact-payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [contact_payments_service_1.ContactPaymentsService])
], ContactPaymentsController);
//# sourceMappingURL=contact-payments.controller.js.map