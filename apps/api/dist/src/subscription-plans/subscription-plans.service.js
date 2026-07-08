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
exports.SubscriptionPlansService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let SubscriptionPlansService = class SubscriptionPlansService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listAll() {
        return this.prisma.subscriptionPlanConfig.findMany({
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
    }
    listActive() {
        return this.prisma.subscriptionPlanConfig.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
    }
    async findById(id) {
        const plan = await this.prisma.subscriptionPlanConfig.findUnique({ where: { id } });
        if (!plan)
            throw new common_1.NotFoundException('Subscription plan not found');
        return plan;
    }
    async create(dto) {
        const existing = await this.prisma.subscriptionPlanConfig.findUnique({
            where: { name: dto.name },
        });
        if (existing)
            throw new common_1.BadRequestException(`A plan named "${dto.name}" already exists`);
        return this.prisma.subscriptionPlanConfig.create({
            data: {
                name: dto.name,
                displayName: dto.displayName,
                listingQuota: dto.listingQuota,
                priceInr: new client_1.Prisma.Decimal(dto.priceInr),
                durationDays: dto.durationDays ?? 30,
                description: dto.description ?? null,
                sortOrder: dto.sortOrder ?? 0,
                isActive: dto.isActive ?? true,
                isFree: dto.isFree ?? false,
            },
        });
    }
    async update(id, dto) {
        await this.findById(id);
        if (dto.name) {
            const conflict = await this.prisma.subscriptionPlanConfig.findFirst({
                where: { name: dto.name, NOT: { id } },
            });
            if (conflict)
                throw new common_1.BadRequestException(`A plan named "${dto.name}" already exists`);
        }
        return this.prisma.subscriptionPlanConfig.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.displayName !== undefined && { displayName: dto.displayName }),
                ...(dto.listingQuota !== undefined && { listingQuota: dto.listingQuota }),
                ...(dto.priceInr !== undefined && { priceInr: new client_1.Prisma.Decimal(dto.priceInr) }),
                ...(dto.durationDays !== undefined && { durationDays: dto.durationDays }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(dto.isFree !== undefined && { isFree: dto.isFree }),
            },
        });
    }
    async remove(id) {
        const plan = await this.findById(id);
        const inUse = await this.prisma.sellerSubscription.count({
            where: { planConfigId: id, status: 'ACTIVE' },
        });
        if (inUse > 0) {
            throw new common_1.BadRequestException(`Cannot delete a plan that has ${inUse} active subscription(s). Deactivate it instead.`);
        }
        await this.prisma.subscriptionPlanConfig.delete({ where: { id } });
        return plan;
    }
};
exports.SubscriptionPlansService = SubscriptionPlansService;
exports.SubscriptionPlansService = SubscriptionPlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionPlansService);
//# sourceMappingURL=subscription-plans.service.js.map