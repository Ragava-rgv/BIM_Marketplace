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
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const shared_1 = require("@machinebazaar/shared");
const prisma_service_1 = require("../prisma/prisma.service");
let TransactionsService = class TransactionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(sellerId, dto) {
        const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
        if (!listing || listing.sellerId !== sellerId) {
            throw new common_1.NotFoundException('Listing not found');
        }
        if (listing.status === client_1.ListingStatus.SOLD) {
            throw new common_1.ForbiddenException('This listing has already been sold');
        }
        const enquiry = await this.prisma.enquiry.findUnique({
            where: { listingId_buyerId: { listingId: dto.listingId, buyerId: dto.buyerId } },
        });
        if (!enquiry) {
            throw new common_1.ForbiddenException('This buyer must enquire about the listing before a transaction can be created');
        }
        const salePrice = new client_1.Prisma.Decimal(dto.salePrice);
        const buyerCommission = salePrice.mul(shared_1.BUYER_COMMISSION_RATE);
        const sellerCommission = salePrice.mul(shared_1.SELLER_COMMISSION_RATE);
        const [transaction] = await this.prisma.$transaction([
            this.prisma.transaction.create({
                data: {
                    listingId: dto.listingId,
                    buyerId: dto.buyerId,
                    sellerId,
                    salePrice,
                    buyerCommission,
                    sellerCommission,
                    commissionStatus: client_1.CommissionStatus.PENDING,
                },
            }),
            this.prisma.listing.update({
                where: { id: dto.listingId },
                data: { status: client_1.ListingStatus.UNDER_OFFER },
            }),
        ]);
        return transaction;
    }
    async listForUser(userId, role) {
        if (role === client_1.UserRole.ADMIN) {
            return this.prisma.transaction.findMany({ orderBy: { createdAt: 'desc' } });
        }
        const where = role === client_1.UserRole.SELLER ? { sellerId: userId } : { buyerId: userId };
        return this.prisma.transaction.findMany({ where, orderBy: { createdAt: 'desc' } });
    }
    async findById(id) {
        const transaction = await this.prisma.transaction.findUnique({ where: { id } });
        if (!transaction) {
            throw new common_1.NotFoundException('Transaction not found');
        }
        return transaction;
    }
    async markCommissionPaid(transactionId) {
        const transaction = await this.findById(transactionId);
        if (transaction.commissionStatus === client_1.CommissionStatus.PAID) {
            return transaction;
        }
        const contactReleasedAt = new Date();
        const [updated] = await this.prisma.$transaction([
            this.prisma.transaction.update({
                where: { id: transactionId },
                data: { commissionStatus: client_1.CommissionStatus.PAID, contactReleasedAt },
            }),
            this.prisma.listing.update({
                where: { id: transaction.listingId },
                data: { status: client_1.ListingStatus.SOLD },
            }),
        ]);
        return updated;
    }
    async getContact(transactionId, userId) {
        const transaction = await this.findById(transactionId);
        if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
            throw new common_1.ForbiddenException('You are not a party to this transaction');
        }
        if (!transaction.contactReleasedAt) {
            return { released: false };
        }
        const counterpartId = transaction.buyerId === userId ? transaction.sellerId : transaction.buyerId;
        const counterpart = await this.prisma.user.findUnique({
            where: { id: counterpartId },
            select: { fullName: true, phone: true, email: true },
        });
        if (!counterpart) {
            throw new common_1.NotFoundException('Counterpart not found');
        }
        return { released: true, contact: counterpart };
    }
    async listReleasedContacts(userId, role) {
        const where = role === client_1.UserRole.SELLER
            ? { sellerId: userId, contactReleasedAt: { not: null } }
            : { buyerId: userId, contactReleasedAt: { not: null } };
        const transactions = await this.prisma.transaction.findMany({
            where,
            orderBy: { contactReleasedAt: 'desc' },
            include: {
                listing: { select: { id: true, title: true } },
                buyer: { select: { fullName: true, phone: true, email: true } },
                seller: { select: { fullName: true, phone: true, email: true } },
            },
        });
        return transactions.map((transaction) => ({
            transactionId: transaction.id,
            listingId: transaction.listingId,
            listingTitle: transaction.listing.title,
            contactReleasedAt: transaction.contactReleasedAt,
            contact: role === client_1.UserRole.SELLER ? transaction.buyer : transaction.seller,
        }));
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map