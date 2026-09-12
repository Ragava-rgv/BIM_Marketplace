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
exports.SubmitQuoteDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const CURRENT_YEAR = new Date().getFullYear();
class SubmitQuoteDto {
    listingId;
    contactName;
    contactPhone;
    contactEmail;
    contactCompany;
    catalogCategoryId;
    machineCategory;
    machineMake;
    machineModel;
    manufactureYear;
    origin;
    importedCountry;
    condition;
    machineLocation;
    price;
    description;
    specs;
    message;
}
exports.SubmitQuoteDto = SubmitQuoteDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "listingId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 120),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "contactName", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^[6-9]\d{9}$/, {
        message: 'contactPhone must be a valid 10-digit Indian mobile number',
    }),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "contactPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "contactEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 160),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "contactCompany", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "catalogCategoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 160),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "machineCategory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 120),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "machineMake", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 120),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "machineModel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1950),
    (0, class_validator_1.Max)(CURRENT_YEAR),
    __metadata("design:type", Number)
], SubmitQuoteDto.prototype, "manufactureYear", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['INDIAN', 'IMPORTED']),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "origin", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.origin === 'IMPORTED'),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 80),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "importedCountry", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['OLD', 'NEW']),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "condition", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 120),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "machineLocation", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SubmitQuoteDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? JSON.parse(value) : value),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitQuoteDto.prototype, "specs", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 2000),
    __metadata("design:type", String)
], SubmitQuoteDto.prototype, "message", void 0);
//# sourceMappingURL=submit-quote.dto.js.map