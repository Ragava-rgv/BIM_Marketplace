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
exports.AppSettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AppSettingsService = class AppSettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAll() {
        return this.prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
    }
    async get(key) {
        const setting = await this.prisma.appSetting.findUnique({ where: { key } });
        if (!setting)
            throw new common_1.NotFoundException(`Setting '${key}' not found`);
        return setting.value;
    }
    async getContactRevealPrice() {
        const setting = await this.prisma.appSetting.findUnique({
            where: { key: 'contact_reveal_price_inr' },
        });
        return setting ? Number(setting.value) : 500;
    }
    async update(key, value) {
        const existing = await this.prisma.appSetting.findUnique({ where: { key } });
        if (!existing)
            throw new common_1.NotFoundException(`Setting '${key}' not found`);
        return this.prisma.appSetting.update({ where: { key }, data: { value } });
    }
};
exports.AppSettingsService = AppSettingsService;
exports.AppSettingsService = AppSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppSettingsService);
//# sourceMappingURL=app-settings.service.js.map