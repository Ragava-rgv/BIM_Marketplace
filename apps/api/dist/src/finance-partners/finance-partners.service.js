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
exports.FinancePartnersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let FinancePartnersService = class FinancePartnersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listActive() {
        return this.prisma.financePartner.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    }
    async listAll() {
        return this.prisma.financePartner.findMany({ orderBy: { name: 'asc' } });
    }
    async findById(id) {
        const partner = await this.prisma.financePartner.findUnique({ where: { id } });
        if (!partner) {
            throw new common_1.NotFoundException('Finance partner not found');
        }
        return partner;
    }
    async create(dto) {
        return this.prisma.financePartner.create({
            data: {
                name: dto.name,
                type: dto.type,
                referralRate: new client_1.Prisma.Decimal(dto.referralRate),
                active: dto.active ?? true,
            },
        });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.financePartner.update({
            where: { id },
            data: {
                ...dto,
                referralRate: dto.referralRate !== undefined ? new client_1.Prisma.Decimal(dto.referralRate) : undefined,
            },
        });
    }
};
exports.FinancePartnersService = FinancePartnersService;
exports.FinancePartnersService = FinancePartnersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinancePartnersService);
//# sourceMappingURL=finance-partners.service.js.map