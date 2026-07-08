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
exports.ContactPaymentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const razorpay_service_1 = require("../payments/razorpay.service");
const app_settings_service_1 = require("../app-settings/app-settings.service");
let ContactPaymentsService = class ContactPaymentsService {
    prisma;
    razorpay;
    settings;
    constructor(prisma, razorpay, settings) {
        this.prisma = prisma;
        this.razorpay = razorpay;
        this.settings = settings;
    }
    async check(buyerId, listingId) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
            include: { seller: { select: { fullName: true, phone: true, email: true } } },
        });
        if (!listing || listing.status !== client_1.ListingStatus.ACTIVE) {
            throw new common_1.NotFoundException('Listing not found');
        }
        const payment = await this.prisma.contactPayment.findUnique({
            where: { buyerId_listingId: { buyerId, listingId } },
        });
        if (payment?.paidAt) {
            return {
                paid: true,
                contact: {
                    fullName: listing.seller.fullName,
                    phone: listing.seller.phone,
                    email: listing.seller.email,
                },
            };
        }
        return { paid: false, contact: null };
    }
    async createOrder(buyerId, dto) {
        const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
        if (!listing || listing.status !== client_1.ListingStatus.ACTIVE) {
            throw new common_1.NotFoundException('Listing not found or not active');
        }
        if (listing.sellerId === buyerId) {
            throw new common_1.ForbiddenException('Cannot pay for your own listing');
        }
        const existing = await this.prisma.contactPayment.findUnique({
            where: { buyerId_listingId: { buyerId, listingId: dto.listingId } },
        });
        if (existing?.paidAt) {
            throw new common_1.BadRequestException('Already paid for this contact');
        }
        const price = await this.settings.getContactRevealPrice();
        const receiptId = `ctc-${buyerId.slice(0, 12)}-${dto.listingId.slice(0, 12)}`;
        const order = await this.razorpay.createOrder(price, receiptId);
        await this.prisma.contactPayment.upsert({
            where: { buyerId_listingId: { buyerId, listingId: dto.listingId } },
            create: {
                buyerId,
                listingId: dto.listingId,
                sellerId: listing.sellerId,
                amount: price,
                razorpayOrderId: order.id,
            },
            update: { razorpayOrderId: order.id },
        });
        return {
            razorpayOrderId: order.id,
            amount: price * 100,
            currency: 'INR',
            keyId: this.razorpay.keyId,
        };
    }
    async verifyAndReveal(buyerId, dto) {
        const valid = this.razorpay.verifySignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
        if (!valid) {
            throw new common_1.UnauthorizedException('Payment verification failed');
        }
        const payment = await this.prisma.contactPayment.findUnique({
            where: { buyerId_listingId: { buyerId, listingId: dto.listingId } },
        });
        if (!payment) {
            throw new common_1.BadRequestException('No pending payment found');
        }
        if (payment.paidAt) {
            throw new common_1.BadRequestException('Already paid');
        }
        const updated = await this.prisma.contactPayment.update({
            where: { buyerId_listingId: { buyerId, listingId: dto.listingId } },
            data: { razorpayPaymentId: dto.razorpayPaymentId, paidAt: new Date() },
            include: {
                seller: { select: { fullName: true, phone: true, email: true } },
            },
        });
        return {
            paid: true,
            contact: {
                fullName: updated.seller.fullName,
                phone: updated.seller.phone,
                email: updated.seller.email,
            },
        };
    }
};
exports.ContactPaymentsService = ContactPaymentsService;
exports.ContactPaymentsService = ContactPaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        razorpay_service_1.RazorpayService,
        app_settings_service_1.AppSettingsService])
], ContactPaymentsService);
//# sourceMappingURL=contact-payments.service.js.map