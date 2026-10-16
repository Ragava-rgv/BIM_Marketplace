import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Enquiry, EnquiryStatus, ListingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Buyer expresses interest in a listing ("Enquire"). Forwards the buyer's
   * full profile to admin and a minimal name+location notice to the seller.
   */
  async create(buyerId: string, listingId: string): Promise<Enquiry> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.sellerId === buyerId) {
      throw new ForbiddenException('You cannot enquire about your own listing');
    }

    return this.prisma.enquiry.upsert({
      where: { listingId_buyerId: { listingId, buyerId } },
      update: {},
      create: {
        listingId,
        buyerId,
        sellerId: listing.sellerId,
        status: EnquiryStatus.NEW,
      },
    });
  }

  async listMine(buyerId: string) {
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

  /** Seller view: only the buyer's name + location, never contact details. */
  async listForSeller(sellerId: string) {
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

  /** Admin view: full buyer profile so the team can follow up directly. */
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

  async updateStatus(id: string, status: EnquiryStatus): Promise<Enquiry> {
    const enquiry = await this.prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }
    return this.prisma.enquiry.update({ where: { id }, data: { status } });
  }
}
