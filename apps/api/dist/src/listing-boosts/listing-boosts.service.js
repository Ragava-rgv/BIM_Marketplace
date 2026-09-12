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
exports.ListingBoostsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const razorpay_service_1 = require("../payments/razorpay.service");
const BOOSTABLE_STATUSES = [
    client_1.ListingStatus.ACTIVE,
    client_1.ListingStatus.UNDER_OFFER,
];
let ListingBoostsService = class ListingBoostsService {
    prisma;
    razorpay;
    constructor(prisma, razorpay) {
        this.prisma = prisma;
        this.razorpay = razorpay;
    }
    async findOwnedListing(sellerId, listingId) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
        });
        if (!listing || listing.sellerId !== sellerId) {
            throw new common_1.NotFoundException('Listing not found');
        }
        return listing;
    }
    async getStatus(sellerId, listingId) {
        const listing = await this.findOwnedListing(sellerId, listingId);
        if (listing.isBoosted &&
            listing.boostExpiresAt &&
            listing.boostExpiresAt <= new Date()) {
            await this.prisma.listing.update({
                where: { id: listingId },
                data: { isBoosted: false, boostExpiresAt: null },
            });
            return { isBoosted: false, boostExpiresAt: null };
        }
        return {
            isBoosted: listing.isBoosted,
            boostExpiresAt: listing.boostExpiresAt,
        };
    }
    async createOrder(sellerId, listingId, dto) {
        const listing = await this.findOwnedListing(sellerId, listingId);
        if (!BOOSTABLE_STATUSES.includes(listing.status)) {
            throw new common_1.ForbiddenException(`A listing in ${listing.status} status cannot be boosted`);
        }
        const plan = await this.prisma.promotionPlan.findUnique({
            where: { id: dto.planId },
        });
        if (!plan || plan.deletedAt)
            throw new common_1.NotFoundException('Boost plan not found');
        if (!plan.isActive)
            throw new common_1.BadRequestException('This boost plan is no longer available');
        const amountInr = Number(plan.priceInr);
        const receiptId = `boost-${listingId.slice(0, 8)}-${Date.now()}`;
        const order = await this.razorpay.createOrder(amountInr, receiptId);
        return {
            razorpayOrderId: order.id,
            amount: amountInr * 100,
            currency: 'INR',
            keyId: this.razorpay.keyId,
        };
    }
    async verifyAndActivate(sellerId, listingId, dto) {
        const listing = await this.findOwnedListing(sellerId, listingId);
        const valid = this.razorpay.verifySignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
        if (!valid)
            throw new common_1.UnauthorizedException('Payment verification failed');
        const plan = await this.prisma.promotionPlan.findUnique({
            where: { id: dto.planId },
        });
        if (!plan || plan.deletedAt)
            throw new common_1.NotFoundException('Boost plan not found');
        const existing = await this.prisma.listingBoost.findFirst({
            where: { razorpayPaymentId: dto.razorpayPaymentId },
        });
        if (existing)
            throw new common_1.BadRequestException('Payment already applied');
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + plan.durationDays);
        const [boost] = await this.prisma.$transaction([
            this.prisma.listingBoost.create({
                data: {
                    listingId,
                    sellerId,
                    planId: plan.id,
                    price: plan.priceInr,
                    durationDays: plan.durationDays,
                    startsAt: now,
                    expiresAt,
                    razorpayOrderId: dto.razorpayOrderId,
                    razorpayPaymentId: dto.razorpayPaymentId,
                },
            }),
            this.prisma.listing.update({
                where: { id: listing.id },
                data: { isBoosted: true, boostExpiresAt: expiresAt },
            }),
        ]);
        return boost;
    }
    async listMine(sellerId) {
        return this.prisma.listingBoost.findMany({
            where: { sellerId },
            include: { listing: { select: { id: true, title: true } }, plan: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async sweepExpired() {
        await this.prisma.listing.updateMany({
            where: { isBoosted: true, boostExpiresAt: { lte: new Date() } },
            data: { isBoosted: false },
        });
    }
};
exports.ListingBoostsService = ListingBoostsService;
exports.ListingBoostsService = ListingBoostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        razorpay_service_1.RazorpayService])
], ListingBoostsService);
//# sourceMappingURL=listing-boosts.service.js.map