"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecValidationService = void 0;
const common_1 = require("@nestjs/common");
let SpecValidationService = class SpecValidationService {
    validate(template, submitted) {
        const errors = [];
        const allowed = new Set(template.map((f) => f.fieldKey));
        for (const key of Object.keys(submitted)) {
            if (!allowed.has(key)) {
                errors.push({ field: key, message: `Unknown spec field "${key}"` });
            }
        }
        for (const field of template) {
            const value = submitted[field.fieldKey];
            const missing = value === undefined || value === null || value === '';
            if (field.isRequired && missing) {
                errors.push({
                    field: field.fieldKey,
                    message: `${field.fieldLabel} is required`,
                });
                continue;
            }
            if (missing)
                continue;
            switch (field.fieldType) {
                case 'number': {
                    const n = Number(value);
                    if (Number.isNaN(n)) {
                        errors.push({
                            field: field.fieldKey,
                            message: `${field.fieldLabel} must be a number`,
                        });
                    }
                    break;
                }
                case 'select': {
                    if (!field.options.includes(String(value))) {
                        errors.push({
                            field: field.fieldKey,
                            message: `${field.fieldLabel} must be one of: ${field.options.join(', ')}`,
                        });
                    }
                    break;
                }
                case 'boolean': {
                    if (typeof value !== 'boolean' &&
                        value !== 'true' &&
                        value !== 'false') {
                        errors.push({
                            field: field.fieldKey,
                            message: `${field.fieldLabel} must be true or false`,
                        });
                    }
                    break;
                }
                case 'text':
                    break;
            }
        }
        if (errors.length > 0) {
            throw new common_1.BadRequestException({
                message: 'Spec validation failed',
                errors,
            });
        }
        const cleaned = {};
        for (const field of template) {
            const value = submitted[field.fieldKey];
            if (value === undefined || value === null || value === '')
                continue;
            if (field.fieldType === 'number') {
                cleaned[field.fieldKey] = Number(value);
            }
            else if (field.fieldType === 'boolean') {
                cleaned[field.fieldKey] = value === true || value === 'true';
            }
            else {
                cleaned[field.fieldKey] = String(value);
            }
        }
        return cleaned;
    }
};
exports.SpecValidationService = SpecValidationService;
exports.SpecValidationService = SpecValidationService = __decorate([
    (0, common_1.Injectable)()
], SpecValidationService);
//# sourceMappingURL=spec-validation.service.js.map