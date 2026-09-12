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
exports.AddSpecFieldDto = exports.SpecFilterTypeDto = exports.SpecFieldTypeDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var SpecFieldTypeDto;
(function (SpecFieldTypeDto) {
    SpecFieldTypeDto["number"] = "number";
    SpecFieldTypeDto["text"] = "text";
    SpecFieldTypeDto["select"] = "select";
    SpecFieldTypeDto["boolean"] = "boolean";
})(SpecFieldTypeDto || (exports.SpecFieldTypeDto = SpecFieldTypeDto = {}));
var SpecFilterTypeDto;
(function (SpecFilterTypeDto) {
    SpecFilterTypeDto["range"] = "range";
    SpecFilterTypeDto["exact"] = "exact";
    SpecFilterTypeDto["none"] = "none";
})(SpecFilterTypeDto || (exports.SpecFilterTypeDto = SpecFilterTypeDto = {}));
class AddSpecFieldDto {
    subcategoryId;
    fieldKey;
    fieldLabel;
    unit;
    fieldType;
    options;
    isRequired;
    isFilterable;
    filterType;
    displayOrder;
    helpText;
}
exports.AddSpecFieldDto = AddSpecFieldDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddSpecFieldDto.prototype, "subcategoryId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 80),
    __metadata("design:type", String)
], AddSpecFieldDto.prototype, "fieldKey", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 120),
    __metadata("design:type", String)
], AddSpecFieldDto.prototype, "fieldLabel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 30),
    __metadata("design:type", String)
], AddSpecFieldDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SpecFieldTypeDto),
    __metadata("design:type", String)
], AddSpecFieldDto.prototype, "fieldType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AddSpecFieldDto.prototype, "options", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AddSpecFieldDto.prototype, "isRequired", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AddSpecFieldDto.prototype, "isFilterable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SpecFilterTypeDto),
    __metadata("design:type", String)
], AddSpecFieldDto.prototype, "filterType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AddSpecFieldDto.prototype, "displayOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 300),
    __metadata("design:type", String)
], AddSpecFieldDto.prototype, "helpText", void 0);
//# sourceMappingURL=add-spec-field.dto.js.map