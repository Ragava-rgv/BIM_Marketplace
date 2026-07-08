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
exports.VerifyContactPaymentDto = exports.CreateContactOrderDto = void 0;
const class_validator_1 = require("class-validator");
class CreateContactOrderDto {
    listingId;
}
exports.CreateContactOrderDto = CreateContactOrderDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateContactOrderDto.prototype, "listingId", void 0);
class VerifyContactPaymentDto {
    listingId;
    razorpayOrderId;
    razorpayPaymentId;
    razorpaySignature;
}
exports.VerifyContactPaymentDto = VerifyContactPaymentDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], VerifyContactPaymentDto.prototype, "listingId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyContactPaymentDto.prototype, "razorpayOrderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyContactPaymentDto.prototype, "razorpayPaymentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyContactPaymentDto.prototype, "razorpaySignature", void 0);
//# sourceMappingURL=contact-payment.dto.js.map