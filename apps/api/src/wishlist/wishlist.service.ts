import { Injectable, NotFoundException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const MEDIA_INCLUDE = { media: { orderBy: { orderIndex: 'asc' as const } } };

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  /** Idempotent — adding a listing that's already wishlisted (and not soft-deleted) is a no-op. */
  async add(buyerId: string, listingId: string): Promise<void> {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status === ListingStatus.WITHDRAWN) {
      throw new NotFoundException('Listing not found');
    }

    const existing = await this.prisma.wishlist.findUnique({
      where: { buyerId_listingId: { buyerId, listingId } },
    });
    if (existing) {
      if (existing.deletedAt) {
        await this.prisma.wishlist.update({ where: { id: existing.id }, data: { deletedAt: null } });
      }
      return;
    }

    await this.prisma.wishlist.create({ data: { buyerId, listingId } });
  }

  async remove(buyerId: string, listingId: string): Promise<void> {
    await this.prisma.wishlist.updateMany({
      where: { buyerId, listingId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async list(buyerId: string) {
    const rows = await this.prisma.wishlist.findMany({
      where: { buyerId, deletedAt: null },
      include: { listing: { include: MEDIA_INCLUDE } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => row.listing);
  }

  async listIds(buyerId: string): Promise<string[]> {
    const rows = await this.prisma.wishlist.findMany({
      where: { buyerId, deletedAt: null },
      select: { listingId: true },
    });
    return rows.map((row) => row.listingId);
  }
}
