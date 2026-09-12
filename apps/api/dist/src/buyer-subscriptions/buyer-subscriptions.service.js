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
exports.BuyerSubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const razorpay_service_1 = require("../payments/razorpay.service");
const SELLER_CONTACT_SELECT = {
    fullName: true,
    phone: true,
    email: true,
    address: true,
    locationCity: true,
    locationState: true,
};
function resolveAddress(seller) {
    if (seller.address)
        return seller.address;
    return ([seller.locationCity, seller.locationState].filter(Boolean).join(', ') ||
        'Not provided');
}
let BuyerSubscriptionsService = class BuyerSubscriptionsService {
    prisma;
    razorpay;
    constructor(prisma, razorpay) {
        this.prisma = prisma;
        this.razorpay = razorpay;
    }
    activeWhere(buyerId) {
        return {
            buyerId,
            status: 'ACTIVE',
            deletedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        };
    }
    async getOrProvisionActiveSubscription(buyerId) {
        const existing = await this.prisma.buyerSubscription.findFirst({
            where: this.activeWhere(buyerId),
            orderBy: { createdAt: 'desc' },
            include: { plan: true },
        });
        if (existing)
            return existing;
        const defaultPlan = await this.prisma.buyerSubscriptionPlan.findFirst({
            where: { isDefault: true, isActive: true, deletedAt: null },
        });
        if (!defaultPlan) {
            throw new common_1.ServiceUnavailableException('No default buyer plan configured — contact support');
        }
        const now = new Date();
        const expiresAt = defaultPlan.durationDays
            ? new Date(now.getTime() + defaultPlan.durationDays * 24 * 60 * 60 * 1000)
            : null;
        return this.prisma.buyerSubscription.create({
            data: {
                buyerId,
                planId: defaultPlan.id,
                quotaTotal: defaultPlan.contactViewQuota,
                quotaUsed: 0,
                price: defaultPlan.priceInr,
                durationDays: defaultPlan.durationDays,
                startsAt: now,
                expiresAt,
                status: 'ACTIVE',
            },
            include: { plan: true },
        });
    }
    async getStatus(buyerId) {
        const subscription = await this.getOrProvisionActiveSubscription(buyerId);
        return {
            quotaTotal: subscription.quotaTotal,
            quotaUsed: subscription.quotaUsed,
            quotaRemaining: Math.max(0, subscription.quotaTotal - subscription.quotaUsed),
            expiresAt: subscription.expiresAt,
            status: subscription.status,
            subscription,
        };
    }
    async createOrder(buyerId, dto) {
        const plan = await this.prisma.buyerSubscriptionPlan.findFirst({
            where: { id: dto.planId, deletedAt: null },
        });
        if (!plan)
            throw new common_1.NotFoundException('Buyer subscription plan not found');
        if (!plan.isActive)
            throw new common_1.BadRequestException('This subscription plan is no longer available');
        if (plan.isFree)
            throw new common_1.BadRequestException('Free plan does not require payment');
        const amountInr = Number(plan.priceInr);
        const receiptId = `bsub-${buyerId.slice(0, 12)}-${Date.now()}`;
        const order = await this.razorpay.createOrder(amountInr, receiptId);
        return {
            razorpayOrderId: order.id,
            amount: amountInr * 100,
            currency: 'INR',
            keyId: this.razorpay.keyId,
        };
    }
    async verifyAndActivate(buyerId, dto) {
        const valid = this.razorpay.verifySignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
        if (!valid)
            throw new common_1.UnauthorizedException('Payment verification failed');
        const plan = await this.prisma.buyerSubscriptionPlan.findFirst({
            where: { id: dto.planId, deletedAt: null },
        });
        if (!plan)
            throw new common_1.NotFoundException('Buyer subscription plan not found');
        const existingPayment = await this.prisma.buyerSubscription.findFirst({
            where: { razorpayPaymentId: dto.razorpayPaymentId },
        });
        if (existingPayment)
            throw new common_1.BadRequestException('Payment already applied');
        const current = await this.prisma.buyerSubscription.findFirst({
            where: this.activeWhere(buyerId),
            orderBy: { createdAt: 'desc' },
        });
        const carryOver = current
            ? Math.max(0, current.quotaTotal - current.quotaUsed)
            : 0;
        const now = new Date();
        const expiresAt = plan.durationDays
            ? new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
            : null;
        return this.prisma.$transaction(async (tx) => {
            if (current) {
                await tx.buyerSubscription.update({
                    where: { id: current.id },
                    data: { status: 'EXPIRED' },
                });
            }
            return tx.buyerSubscription.create({
                data: {
                    buyerId,
                    planId: plan.id,
                    quotaTotal: plan.contactViewQuota + carryOver,
                    quotaUsed: 0,
                    price: plan.priceInr,
                    durationDays: plan.durationDays,
                    startsAt: now,
                    expiresAt,
                    status: 'ACTIVE',
                    razorpayOrderId: dto.razorpayOrderId,
                    razorpayPaymentId: dto.razorpayPaymentId,
                },
                include: { plan: true },
            });
        });
    }
    async revealStatus(buyerId, listingId) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
            include: { seller: { select: SELLER_CONTACT_SELECT } },
        });
        if (!listing || listing.status !== client_1.ListingStatus.ACTIVE) {
            throw new common_1.NotFoundException('Listing not found');
        }
        const status = await this.getStatus(buyerId);
        const view = await this.prisma.contactView.findUnique({
            where: { buyerId_listingId: { buyerId, listingId } },
        });
        if (view) {
            return {
                contact: {
                    fullName: listing.seller.fullName,
                    phone: listing.seller.phone,
                    email: listing.seller.email,
                    address: resolveAddress(listing.seller),
                },
                quotaUsed: status.quotaUsed,
                quotaTotal: status.quotaTotal,
                quotaRemaining: status.quotaRemaining,
                isIdempotent: true,
            };
        }
        return {
            contact: null,
            quotaUsed: status.quotaUsed,
            quotaTotal: status.quotaTotal,
            quotaRemaining: status.quotaRemaining,
            isIdempotent: false,
        };
    }
    async reveal(buyerId, listingId) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
            include: { seller: { select: SELLER_CONTACT_SELECT } },
        });
        if (!listing || listing.status !== client_1.ListingStatus.ACTIVE) {
            throw new common_1.NotFoundException('Listing not found');
        }
        if (listing.sellerId === buyerId) {
            throw new common_1.ForbiddenException('Cannot reveal contact details for your own listing');
        }
        const contact = {
            fullName: listing.seller.fullName,
            phone: listing.seller.phone,
            email: listing.seller.email,
            address: resolveAddress(listing.seller),
        };
        const existingView = await this.prisma.contactView.findUnique({
            where: { buyerId_listingId: { buyerId, listingId } },
        });
        if (existingView) {
            const status = await this.getStatus(buyerId);
            return {
                contact,
                quotaUsed: status.quotaUsed,
                quotaTotal: status.quotaTotal,
                quotaRemaining: status.quotaRemaining,
                isIdempotent: true,
            };
        }
        const subscription = await this.getOrProvisionActiveSubscription(buyerId);
        if (subscription.quotaUsed >= subscription.quotaTotal) {
            throw new common_1.ForbiddenException({
                message: 'Contact view quota exhausted — upgrade your plan to view more contacts',
                error: 'QUOTA_EXHAUSTED',
                quotaUsed: subscription.quotaUsed,
                quotaTotal: subscription.quotaTotal,
                quotaRemaining: 0,
            });
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.buyerSubscription.updateMany({
                where: {
                    id: subscription.id,
                    quotaUsed: { lt: subscription.quotaTotal },
                },
                data: { quotaUsed: { increment: 1 } },
            });
            if (updated.count === 0) {
                return null;
            }
            try {
                await tx.contactView.create({
                    data: {
                        buyerId,
                        listingId,
                        sellerId: listing.sellerId,
                        buyerSubscriptionId: subscription.id,
                    },
                });
            }
            catch (err) {
                if (!(err instanceof client_1.Prisma.PrismaClientKnownRequestError) ||
                    err.code !== 'P2002') {
                    throw err;
                }
            }
            return tx.buyerSubscription.findUnique({
                where: { id: subscription.id },
            });
        });
        if (!result) {
            throw new common_1.ForbiddenException({
                message: 'Contact view quota exhausted — upgrade your plan to view more contacts',
                error: 'QUOTA_EXHAUSTED',
                quotaUsed: subscription.quotaTotal,
                quotaTotal: subscription.quotaTotal,
                quotaRemaining: 0,
            });
        }
        return {
            contact,
            quotaUsed: result.quotaUsed,
            quotaTotal: result.quotaTotal,
            quotaRemaining: Math.max(0, result.quotaTotal - result.quotaUsed),
            isIdempotent: false,
        };
    }
    async listContactViews(buyerId, page, pageSize) {
        const [items, total] = await this.prisma.$transaction([
            this.prisma.contactView.findMany({
                where: { buyerId, deletedAt: null },
                include: {
                    listing: { select: { id: true, title: true, machineCategory: true } },
                    seller: { select: { id: true, fullName: true, businessName: true } },
                },
                orderBy: { viewedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.contactView.count({ where: { buyerId, deletedAt: null } }),
        ]);
        return { items, total, page, pageSize };
    }
    async adminList(search, page, pageSize) {
        const where = {
            deletedAt: null,
            ...(search
                ? {
                    buyer: {
                        OR: [
                            { fullName: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } },
                            { phone: { contains: search, mode: 'insensitive' } },
                        ],
                    },
                }
                : {}),
        };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.buyerSubscription.findMany({
                where,
                include: {
                    plan: true,
                    buyer: {
                        select: { id: true, fullName: true, phone: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.buyerSubscription.count({ where }),
        ]);
        return { items, total, page, pageSize };
    }
    async adjustQuota(id, adminId, delta, reason) {
        const subscription = await this.prisma.buyerSubscription.findFirst({
            where: { id, deletedAt: null },
        });
        if (!subscription)
            throw new common_1.NotFoundException('Buyer subscription not found');
        const newQuotaTotal = subscription.quotaTotal + delta;
        if (newQuotaTotal < subscription.quotaUsed) {
            throw new common_1.BadRequestException(`New quota (${newQuotaTotal}) cannot be less than views already used (${subscription.quotaUsed}).`);
        }
        return this.prisma.buyerSubscription.update({
            where: { id },
            data: {
                quotaTotal: newQuotaTotal,
                adjustedBy: adminId,
                adjustedAt: new Date(),
                adjustmentReason: reason,
            },
            include: {
                plan: true,
                buyer: {
                    select: { id: true, fullName: true, phone: true, email: true },
                },
            },
        });
    }
};
exports.BuyerSubscriptionsService = BuyerSubscriptionsService;
exports.BuyerSubscriptionsService = BuyerSubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        razorpay_service_1.RazorpayService])
], BuyerSubscriptionsService);
//# sourceMappingURL=buyer-subscriptions.service.js.map