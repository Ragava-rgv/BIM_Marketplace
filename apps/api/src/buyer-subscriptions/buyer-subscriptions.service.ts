import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, ListingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from '../payments/razorpay.service';
import type {
  CreateBuyerSubscriptionOrderDto,
  VerifyBuyerSubscriptionDto,
} from './dto/subscribe.dto';

const SELLER_CONTACT_SELECT = {
  fullName: true,
  phone: true,
  email: true,
  address: true,
  locationCity: true,
  locationState: true,
} as const;

function resolveAddress(seller: {
  address: string | null;
  locationCity: string | null;
  locationState: string | null;
}): string {
  if (seller.address) return seller.address;
  return (
    [seller.locationCity, seller.locationState].filter(Boolean).join(', ') ||
    'Not provided'
  );
}

@Injectable()
export class BuyerSubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
  ) {}

  /** Any active, non-deleted, non-expired subscription (expiresAt: null means indefinite). */
  private activeWhere(buyerId: string): Prisma.BuyerSubscriptionWhereInput {
    return {
      buyerId,
      status: 'ACTIVE',
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };
  }

  private async getOrProvisionActiveSubscription(buyerId: string) {
    const existing = await this.prisma.buyerSubscription.findFirst({
      where: this.activeWhere(buyerId),
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
    if (existing) return existing;

    const defaultPlan = await this.prisma.buyerSubscriptionPlan.findFirst({
      where: { isDefault: true, isActive: true, deletedAt: null },
    });
    if (!defaultPlan) {
      throw new ServiceUnavailableException(
        'No default buyer plan configured — contact support',
      );
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

  async getStatus(buyerId: string) {
    const subscription = await this.getOrProvisionActiveSubscription(buyerId);
    return {
      quotaTotal: subscription.quotaTotal,
      quotaUsed: subscription.quotaUsed,
      quotaRemaining: Math.max(
        0,
        subscription.quotaTotal - subscription.quotaUsed,
      ),
      expiresAt: subscription.expiresAt,
      status: subscription.status,
      subscription,
    };
  }

  async createOrder(buyerId: string, dto: CreateBuyerSubscriptionOrderDto) {
    const plan = await this.prisma.buyerSubscriptionPlan.findFirst({
      where: { id: dto.planId, deletedAt: null },
    });
    if (!plan) throw new NotFoundException('Buyer subscription plan not found');
    if (!plan.isActive)
      throw new BadRequestException(
        'This subscription plan is no longer available',
      );
    if (plan.isFree)
      throw new BadRequestException('Free plan does not require payment');

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

  async verifyAndActivate(buyerId: string, dto: VerifyBuyerSubscriptionDto) {
    const valid = this.razorpay.verifySignature(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );
    if (!valid) throw new UnauthorizedException('Payment verification failed');

    const plan = await this.prisma.buyerSubscriptionPlan.findFirst({
      where: { id: dto.planId, deletedAt: null },
    });
    if (!plan) throw new NotFoundException('Buyer subscription plan not found');

    const existingPayment = await this.prisma.buyerSubscription.findFirst({
      where: { razorpayPaymentId: dto.razorpayPaymentId },
    });
    if (existingPayment)
      throw new BadRequestException('Payment already applied');

    // Carry over unused quota from the current active subscription, if any.
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

  /** Idempotent lookup — does not consume quota. */
  async revealStatus(buyerId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: { select: SELLER_CONTACT_SELECT } },
    });
    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throw new NotFoundException('Listing not found');
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

  async reveal(buyerId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: { select: SELLER_CONTACT_SELECT } },
    });
    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.sellerId === buyerId) {
      throw new ForbiddenException(
        'Cannot reveal contact details for your own listing',
      );
    }

    const contact = {
      fullName: listing.seller.fullName,
      phone: listing.seller.phone,
      email: listing.seller.email,
      address: resolveAddress(listing.seller),
    };

    // 1. Idempotency — already revealed, no quota charge.
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

    // 2. Fetch/auto-provision active subscription.
    const subscription = await this.getOrProvisionActiveSubscription(buyerId);

    // 3. Quota check.
    if (subscription.quotaUsed >= subscription.quotaTotal) {
      throw new ForbiddenException({
        message:
          'Contact view quota exhausted — upgrade your plan to view more contacts',
        error: 'QUOTA_EXHAUSTED',
        quotaUsed: subscription.quotaUsed,
        quotaTotal: subscription.quotaTotal,
        quotaRemaining: 0,
      });
    }

    // 4. Atomic increment + create the ledger row.
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.buyerSubscription.updateMany({
        where: {
          id: subscription.id,
          quotaUsed: { lt: subscription.quotaTotal },
        },
        data: { quotaUsed: { increment: 1 } },
      });
      if (updated.count === 0) {
        return null; // lost the race — quota exhausted concurrently
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
      } catch (err) {
        // P2002 = unique constraint violation on (buyerId, listingId): another concurrent
        // request already created this view. Treat as success (idempotent), not an error.
        if (
          !(err instanceof Prisma.PrismaClientKnownRequestError) ||
          err.code !== 'P2002'
        ) {
          throw err;
        }
      }
      return tx.buyerSubscription.findUnique({
        where: { id: subscription.id },
      });
    });

    if (!result) {
      throw new ForbiddenException({
        message:
          'Contact view quota exhausted — upgrade your plan to view more contacts',
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

  async listContactViews(buyerId: string, page: number, pageSize: number) {
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

  // -- Admin -----------------------------------------------------------------

  async adminList(search: string | undefined, page: number, pageSize: number) {
    const where: Prisma.BuyerSubscriptionWhereInput = {
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

  async adjustQuota(
    id: string,
    adminId: string,
    delta: number,
    reason: string,
  ) {
    const subscription = await this.prisma.buyerSubscription.findFirst({
      where: { id, deletedAt: null },
    });
    if (!subscription)
      throw new NotFoundException('Buyer subscription not found');

    const newQuotaTotal = subscription.quotaTotal + delta;
    if (newQuotaTotal < subscription.quotaUsed) {
      throw new BadRequestException(
        `New quota (${newQuotaTotal}) cannot be less than views already used (${subscription.quotaUsed}).`,
      );
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
}
