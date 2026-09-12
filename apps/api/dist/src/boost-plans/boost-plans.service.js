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
exports.BoostPlansService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let BoostPlansService = class BoostPlansService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listAll() {
        return this.prisma.promotionPlan.findMany({
            where: { deletedAt: null },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
    }
    listActive() {
        return this.prisma.promotionPlan.findMany({
            where: { isActive: true, deletedAt: null },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
    }
    async findById(id) {
        const plan = await this.prisma.promotionPlan.findFirst({
            where: { id, deletedAt: null },
        });
        if (!plan)
            throw new common_1.NotFoundException('Boost plan not found');
        return plan;
    }
    async create(dto) {
        const existing = await this.prisma.promotionPlan.findUnique({
            where: { name: dto.name },
        });
        if (existing && !existing.deletedAt) {
            throw new common_1.BadRequestException(`A boost plan named "${dto.name}" already exists`);
        }
        return this.prisma.promotionPlan.create({
            data: {
                name: dto.name,
                displayName: dto.displayName,
                priceInr: new client_1.Prisma.Decimal(dto.priceInr),
                durationDays: dto.durationDays,
                sortWeight: dto.sortWeight ?? 0,
                description: dto.description ?? null,
                sortOrder: dto.sortOrder ?? 0,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async update(id, dto) {
        await this.findById(id);
        if (dto.name) {
            const conflict = await this.prisma.promotionPlan.findFirst({
                where: { name: dto.name, deletedAt: null, NOT: { id } },
            });
            if (conflict)
                throw new common_1.BadRequestException(`A boost plan named "${dto.name}" already exists`);
        }
        return this.prisma.promotionPlan.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.displayName !== undefined && { displayName: dto.displayName }),
                ...(dto.priceInr !== undefined && {
                    priceInr: new client_1.Prisma.Decimal(dto.priceInr),
                }),
                ...(dto.durationDays !== undefined && {
                    durationDays: dto.durationDays,
                }),
                ...(dto.sortWeight !== undefined && { sortWeight: dto.sortWeight }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });
    }
    async remove(id) {
        await this.findById(id);
        const inUse = await this.prisma.listingBoost.count({
            where: { planId: id },
        });
        if (inUse > 0) {
            throw new common_1.BadRequestException(`Cannot delete a plan with ${inUse} boost purchase(s) on record. Deactivate it instead.`);
        }
        return this.prisma.promotionPlan.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async purge(id) {
        const plan = await this.prisma.promotionPlan.findUnique({ where: { id } });
        if (!plan)
            throw new common_1.NotFoundException('Boost plan not found');
        if (!plan.deletedAt) {
            throw new common_1.BadRequestException('Soft-delete this plan before permanently purging it.');
        }
        const dependents = await this.prisma.listingBoost.count({
            where: { planId: id },
        });
        if (dependents > 0) {
            throw new common_1.BadRequestException(`Cannot purge a plan with ${dependents} boost record(s) still referencing it.`);
        }
        await this.prisma.promotionPlan.delete({ where: { id } });
        return plan;
    }
};
exports.BoostPlansService = BoostPlansService;
exports.BoostPlansService = BoostPlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BoostPlansService);
//# sourceMappingURL=boost-plans.service.js.map