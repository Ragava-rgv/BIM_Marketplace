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
exports.DepreciationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let DepreciationService = class DepreciationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listAll() {
        return this.prisma.depreciationSchedule.findMany({
            orderBy: [{ machineCategory: 'asc' }, { yearOffset: 'asc' }],
        });
    }
    async upsert(dto) {
        return this.prisma.depreciationSchedule.upsert({
            where: {
                machineCategory_yearOffset: {
                    machineCategory: dto.machineCategory,
                    yearOffset: dto.yearOffset,
                },
            },
            update: { retainedValuePct: new client_1.Prisma.Decimal(dto.retainedValuePct) },
            create: {
                machineCategory: dto.machineCategory,
                yearOffset: dto.yearOffset,
                retainedValuePct: new client_1.Prisma.Decimal(dto.retainedValuePct),
            },
        });
    }
    async remove(id) {
        await this.prisma.depreciationSchedule.delete({ where: { id } });
    }
};
exports.DepreciationService = DepreciationService;
exports.DepreciationService = DepreciationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepreciationService);
//# sourceMappingURL=depreciation.service.js.map