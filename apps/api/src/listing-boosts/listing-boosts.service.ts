import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from '../payments/razorpay.service';
import type { CreateBoostOrderDto, VerifyBoostDto } from './dto/boost-order.dto';

const BOOSTABLE_STATUSES: ListingStatus[] = [ListingStatus.ACTIVE, ListingStatus.UNDER_OFFER];

@Injectable()
export class ListingBoostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
  ) {}

  private async findOwnedListing(sellerId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.sellerId !== sellerId) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  async getStatus(sellerId: string, listingId: string) {
    const listing = await this.findOwnedListing(sellerId, listingId);

    // Lazy expiry sweep — mirrors the buyer-subscription auto-provisioning pattern (no cron job needed).
    if (listing.isBoosted && listing.boostExpiresAt && listing.boostExpiresAt <= new Date()) {
      await this.prisma.listing.update({
        where: { id: listingId },
        data: { isBoosted: false, boostExpiresAt: null },
      });
      return { isBoosted: false, boostExpiresAt: null };
    }

    return { isBoosted: listing.isBoosted, boostExpiresAt: listing.boostExpiresAt };
  }

  async createOrder(sellerId: string, listingId: string, dto: CreateBoostOrderDto) {
    const listing = await this.findOwnedListing(sellerId, listingId);
    if (!BOOSTABLE_STATUSES.includes(listing.status)) {
      throw new ForbiddenException(`A listing in ${listing.status} status cannot be boosted`);
    }

    const plan = await this.prisma.promotionPlan.findUnique({ where: { id: dto.planId } });
    if (!plan || plan.deletedAt) throw new NotFoundException('Boost plan not found');
    if (!plan.isActive) throw new BadRequestException('This boost plan is no longer available');

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

  async verifyAndActivate(sellerId: string, listingId: string, dto: VerifyBoostDto) {
    const listing = await this.findOwnedListing(sellerId, listingId);

    const valid = this.razorpay.verifySignature(dto.razorpayOrderId, dto.razorpayPaymentId, dto.razorpaySignature);
    if (!valid) throw new UnauthorizedException('Payment verification failed');

    const plan = await this.prisma.promotionPlan.findUnique({ where: { id: dto.planId } });
    if (!plan || plan.deletedAt) throw new NotFoundException('Boost plan not found');

    const existing = await this.prisma.listingBoost.findFirst({
      where: { razorpayPaymentId: dto.razorpayPaymentId },
    });
    if (existing) throw new BadRequestException('Payment already applied');

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

  async listMine(sellerId: string) {
    return this.prisma.listingBoost.findMany({
      where: { sellerId },
      include: { listing: { select: { id: true, title: true } }, plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Clears expired boosts before a listing query relies on `isBoosted` for sort ordering. */
  async sweepExpired(): Promise<void> {
    await this.prisma.listing.updateMany({
      where: { isBoosted: true, boostExpiresAt: { lte: new Date() } },
      data: { isBoosted: false },
    });
  }
}
