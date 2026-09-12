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
exports.EnquiriesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let EnquiriesService = class EnquiriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(buyerId, listingId) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
        });
        if (!listing || listing.status !== client_1.ListingStatus.ACTIVE) {
            throw new common_1.NotFoundException('Listing not found');
        }
        if (listing.sellerId === buyerId) {
            throw new common_1.ForbiddenException('You cannot enquire about your own listing');
        }
        return this.prisma.enquiry.upsert({
            where: { listingId_buyerId: { listingId, buyerId } },
            update: {},
            create: {
                listingId,
                buyerId,
                sellerId: listing.sellerId,
                status: client_1.EnquiryStatus.NEW,
            },
        });
    }
    async listMine(buyerId) {
        return this.prisma.enquiry.findMany({
            where: { buyerId },
            orderBy: { createdAt: 'desc' },
            include: {
                listing: {
                    select: { id: true, title: true, askingPrice: true, status: true },
                },
            },
        });
    }
    async listForSeller(sellerId) {
        const enquiries = await this.prisma.enquiry.findMany({
            where: { sellerId },
            orderBy: { createdAt: 'desc' },
            include: {
                listing: { select: { id: true, title: true } },
                buyer: {
                    select: { fullName: true, locationCity: true, locationState: true },
                },
            },
        });
        return enquiries.map((enquiry) => ({
            id: enquiry.id,
            listingId: enquiry.listingId,
            listingTitle: enquiry.listing.title,
            status: enquiry.status,
            createdAt: enquiry.createdAt,
            buyerName: enquiry.buyer.fullName,
            buyerLocationCity: enquiry.buyer.locationCity,
            buyerLocationState: enquiry.buyer.locationState,
        }));
    }
    async listAll() {
        return this.prisma.enquiry.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                listing: {
                    select: { id: true, title: true, askingPrice: true, status: true },
                },
                buyer: {
                    select: {
                        fullName: true,
                        phone: true,
                        email: true,
                        gstNumber: true,
                        businessName: true,
                        locationCity: true,
                        locationState: true,
                    },
                },
            },
        });
    }
    async updateStatus(id, status) {
        const enquiry = await this.prisma.enquiry.findUnique({ where: { id } });
        if (!enquiry) {
            throw new common_1.NotFoundException('Enquiry not found');
        }
        return this.prisma.enquiry.update({ where: { id }, data: { status } });
    }
};
exports.EnquiriesService = EnquiriesService;
exports.EnquiriesService = EnquiriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EnquiriesService);
//# sourceMappingURL=enquiries.service.js.map