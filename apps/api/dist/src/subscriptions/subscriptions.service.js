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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const shared_1 = require("@machinebazaar/shared");
const prisma_service_1 = require("../prisma/prisma.service");
const razorpay_service_1 = require("../payments/razorpay.service");
let SubscriptionsService = class SubscriptionsService {
    prisma;
    razorpay;
    constructor(prisma, razorpay) {
        this.prisma = prisma;
        this.razorpay = razorpay;
    }
    async getStatus(sellerId) {
        const now = new Date();
        const active = await this.prisma.sellerSubscription.findFirst({
            where: {
                sellerId,
                status: client_1.SubscriptionStatus.ACTIVE,
                expiresAt: { gt: now },
            },
            orderBy: { expiresAt: 'desc' },
            include: { planConfig: true },
        });
        let quota;
        if (active) {
            quota = active.planConfig && active.planConfig.isActive ? active.planConfig.listingQuota : active.listingQuota;
        }
        else {
            const freePlan = await this.prisma.subscriptionPlanConfig.findFirst({
                where: { isFree: true, isActive: true },
            });
            quota = freePlan?.listingQuota ?? shared_1.FREE_LISTING_QUOTA;
        }
        const activeListingsCount = await this.prisma.listing.count({
            where: {
                sellerId,
                status: { in: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'UNDER_OFFER'] },
            },
        });
        return {
            plan: active ? client_1.SubscriptionPlan.STANDARD : client_1.SubscriptionPlan.FREE,
            listingQuota: quota,
            activeListingsCount,
            remainingSlots: Math.max(0, quota - activeListingsCount),
            subscription: active ?? null,
        };
    }
    async createOrder(sellerId, dto) {
        const plan = await this.prisma.subscriptionPlanConfig.findUnique({
            where: { id: dto.planId },
        });
        if (!plan)
            throw new common_1.NotFoundException('Subscription plan not found');
        if (!plan.isActive)
            throw new common_1.BadRequestException('This subscription plan is no longer available');
        if (plan.isFree)
            throw new common_1.BadRequestException('Free plan does not require payment');
        const amountInr = Number(plan.priceInr);
        const receiptId = `sub-${sellerId.slice(0, 12)}-${Date.now()}`;
        const order = await this.razorpay.createOrder(amountInr, receiptId);
        return {
            razorpayOrderId: order.id,
            amount: amountInr * 100,
            currency: 'INR',
            keyId: this.razorpay.keyId,
        };
    }
    async verifyAndActivate(sellerId, dto) {
        const valid = this.razorpay.verifySignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
        if (!valid)
            throw new common_1.UnauthorizedException('Payment verification failed');
        const plan = await this.prisma.subscriptionPlanConfig.findUnique({
            where: { id: dto.planId },
        });
        if (!plan)
            throw new common_1.NotFoundException('Subscription plan not found');
        const existing = await this.prisma.sellerSubscription.findFirst({
            where: { razorpayPaymentId: dto.razorpayPaymentId },
        });
        if (existing)
            throw new common_1.BadRequestException('Payment already applied');
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + plan.durationDays);
        return this.prisma.sellerSubscription.create({
            data: {
                sellerId,
                plan: client_1.SubscriptionPlan.STANDARD,
                planConfigId: plan.id,
                listingQuota: plan.listingQuota,
                price: plan.priceInr,
                durationDays: plan.durationDays,
                startsAt: now,
                expiresAt,
                status: client_1.SubscriptionStatus.ACTIVE,
                razorpayOrderId: dto.razorpayOrderId,
                razorpayPaymentId: dto.razorpayPaymentId,
            },
        });
    }
    async enforceQuota(sellerId) {
        const status = await this.getStatus(sellerId);
        if (status.remainingSlots <= 0) {
            if (status.plan === client_1.SubscriptionPlan.FREE) {
                throw new common_1.ForbiddenException(`Free plan allows ${status.listingQuota} active listings. Upgrade your subscription to list more machines.`);
            }
            throw new common_1.ForbiddenException(`You have reached your listing quota of ${status.listingQuota} for your current subscription.`);
        }
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        razorpay_service_1.RazorpayService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map