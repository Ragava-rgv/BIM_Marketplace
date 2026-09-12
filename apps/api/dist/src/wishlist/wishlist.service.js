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
exports.WishlistService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const MEDIA_INCLUDE = { media: { orderBy: { orderIndex: 'asc' } } };
let WishlistService = class WishlistService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async add(buyerId, listingId) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
        });
        if (!listing || listing.status === client_1.ListingStatus.WITHDRAWN) {
            throw new common_1.NotFoundException('Listing not found');
        }
        const existing = await this.prisma.wishlist.findUnique({
            where: { buyerId_listingId: { buyerId, listingId } },
        });
        if (existing) {
            if (existing.deletedAt) {
                await this.prisma.wishlist.update({
                    where: { id: existing.id },
                    data: { deletedAt: null },
                });
            }
            return;
        }
        await this.prisma.wishlist.create({ data: { buyerId, listingId } });
    }
    async remove(buyerId, listingId) {
        await this.prisma.wishlist.updateMany({
            where: { buyerId, listingId, deletedAt: null },
            data: { deletedAt: new Date() },
        });
    }
    async list(buyerId) {
        const rows = await this.prisma.wishlist.findMany({
            where: { buyerId, deletedAt: null },
            include: { listing: { include: MEDIA_INCLUDE } },
            orderBy: { createdAt: 'desc' },
        });
        return rows.map((row) => row.listing);
    }
    async listIds(buyerId) {
        const rows = await this.prisma.wishlist.findMany({
            where: { buyerId, deletedAt: null },
            select: { listingId: true },
        });
        return rows.map((row) => row.listingId);
    }
};
exports.WishlistService = WishlistService;
exports.WishlistService = WishlistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WishlistService);
//# sourceMappingURL=wishlist.service.js.map