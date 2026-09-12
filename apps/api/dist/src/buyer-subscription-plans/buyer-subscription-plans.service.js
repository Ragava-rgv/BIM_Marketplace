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
exports.BuyerSubscriptionPlansService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let BuyerSubscriptionPlansService = class BuyerSubscriptionPlansService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listAll() {
        return this.prisma.buyerSubscriptionPlan.findMany({
            where: { deletedAt: null },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
    }
    listActive() {
        return this.prisma.buyerSubscriptionPlan.findMany({
            where: { isActive: true, deletedAt: null },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
    }
    async findById(id) {
        const plan = await this.prisma.buyerSubscriptionPlan.findFirst({
            where: { id, deletedAt: null },
        });
        if (!plan)
            throw new common_1.NotFoundException('Buyer subscription plan not found');
        return plan;
    }
    async create(dto) {
        const existing = await this.prisma.buyerSubscriptionPlan.findUnique({
            where: { name: dto.name },
        });
        if (existing && !existing.deletedAt) {
            throw new common_1.BadRequestException(`A plan named "${dto.name}" already exists`);
        }
        return this.prisma.$transaction(async (tx) => {
            if (dto.isDefault) {
                await tx.buyerSubscriptionPlan.updateMany({
                    where: { isDefault: true },
                    data: { isDefault: false },
                });
            }
            return tx.buyerSubscriptionPlan.create({
                data: {
                    name: dto.name,
                    displayName: dto.displayName,
                    contactViewQuota: dto.contactViewQuota,
                    priceInr: new client_1.Prisma.Decimal(dto.priceInr),
                    durationDays: dto.durationDays ?? null,
                    description: dto.description ?? null,
                    sortOrder: dto.sortOrder ?? 0,
                    isActive: dto.isActive ?? true,
                    isFree: dto.isFree ?? false,
                    isDefault: dto.isDefault ?? false,
                },
            });
        });
    }
    async update(id, dto) {
        const plan = await this.findById(id);
        if (dto.name) {
            const conflict = await this.prisma.buyerSubscriptionPlan.findFirst({
                where: { name: dto.name, deletedAt: null, NOT: { id } },
            });
            if (conflict)
                throw new common_1.BadRequestException(`A plan named "${dto.name}" already exists`);
        }
        if (plan.isDefault && (dto.isDefault === false || dto.isActive === false)) {
            throw new common_1.ConflictException('Cannot remove default status or deactivate the default plan. Promote another plan to default first.');
        }
        return this.prisma.$transaction(async (tx) => {
            if (dto.isDefault === true) {
                await tx.buyerSubscriptionPlan.updateMany({
                    where: { isDefault: true, NOT: { id } },
                    data: { isDefault: false },
                });
            }
            return tx.buyerSubscriptionPlan.update({
                where: { id },
                data: {
                    ...(dto.name !== undefined && { name: dto.name }),
                    ...(dto.displayName !== undefined && {
                        displayName: dto.displayName,
                    }),
                    ...(dto.contactViewQuota !== undefined && {
                        contactViewQuota: dto.contactViewQuota,
                    }),
                    ...(dto.priceInr !== undefined && {
                        priceInr: new client_1.Prisma.Decimal(dto.priceInr),
                    }),
                    ...(dto.durationDays !== undefined && {
                        durationDays: dto.durationDays ?? null,
                    }),
                    ...(dto.description !== undefined && {
                        description: dto.description,
                    }),
                    ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
                    ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                    ...(dto.isFree !== undefined && { isFree: dto.isFree }),
                    ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
                },
            });
        });
    }
    async remove(id) {
        const plan = await this.findById(id);
        if (plan.isDefault) {
            throw new common_1.ConflictException('Cannot delete the default plan. Promote another plan to default first.');
        }
        const inUse = await this.prisma.buyerSubscription.count({
            where: { planId: id, status: 'ACTIVE', deletedAt: null },
        });
        if (inUse > 0) {
            throw new common_1.BadRequestException(`Cannot delete a plan that has ${inUse} active subscription(s). Deactivate it instead.`);
        }
        return this.prisma.buyerSubscriptionPlan.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async purge(id) {
        const plan = await this.prisma.buyerSubscriptionPlan.findUnique({
            where: { id },
        });
        if (!plan)
            throw new common_1.NotFoundException('Buyer subscription plan not found');
        if (!plan.deletedAt) {
            throw new common_1.BadRequestException('Soft-delete this plan before permanently purging it.');
        }
        const dependents = await this.prisma.buyerSubscription.count({
            where: { planId: id },
        });
        if (dependents > 0) {
            throw new common_1.BadRequestException(`Cannot purge a plan with ${dependents} subscription record(s) still referencing it.`);
        }
        await this.prisma.buyerSubscriptionPlan.delete({ where: { id } });
        return plan;
    }
};
exports.BuyerSubscriptionPlansService = BuyerSubscriptionPlansService;
exports.BuyerSubscriptionPlansService = BuyerSubscriptionPlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BuyerSubscriptionPlansService);
//# sourceMappingURL=buyer-subscription-plans.service.js.map