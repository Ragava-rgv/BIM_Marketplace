import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { FREE_LISTING_QUOTA } from '@machinebazaar/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from '../payments/razorpay.service';
import type {
  CreateSubscriptionOrderDto,
  VerifySubscriptionDto,
} from './dto/verify-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
  ) {}

  async getStatus(sellerId: string) {
    const now = new Date();
    const active = await this.prisma.sellerSubscription.findFirst({
      where: {
        sellerId,
        status: SubscriptionStatus.ACTIVE,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: 'desc' },
      include: { planConfig: true },
    });

    // Quota enforcement reads the live plan config so admin edits take effect immediately;
    // `active.listingQuota` (snapshot at purchase time) is only a fallback if the plan was
    // since deleted/deactivated, so an existing subscriber isn't cut off by that.
    let quota: number;
    if (active) {
      quota =
        active.planConfig && active.planConfig.isActive
          ? active.planConfig.listingQuota
          : active.listingQuota;
    } else {
      // Sellers with no paid subscription sit on the admin-configured "Free" plan config —
      // read its live listingQuota so admin edits apply immediately, same as paid plans.
      // FREE_LISTING_QUOTA is only a defensive fallback if that config row is ever missing.
      const freePlan = await this.prisma.subscriptionPlanConfig.findFirst({
        where: { isFree: true, isActive: true },
      });
      quota = freePlan?.listingQuota ?? FREE_LISTING_QUOTA;
    }

    const activeListingsCount = await this.prisma.listing.count({
      where: {
        sellerId,
        status: { in: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'UNDER_OFFER'] },
      },
    });

    return {
      plan: active ? SubscriptionPlan.STANDARD : SubscriptionPlan.FREE,
      listingQuota: quota,
      activeListingsCount,
      remainingSlots: Math.max(0, quota - activeListingsCount),
      subscription: active ?? null,
    };
  }

  async createOrder(sellerId: string, dto: CreateSubscriptionOrderDto) {
    const plan = await this.prisma.subscriptionPlanConfig.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    if (!plan.isActive)
      throw new BadRequestException(
        'This subscription plan is no longer available',
      );
    if (plan.isFree)
      throw new BadRequestException('Free plan does not require payment');

    const amountInr = Number(plan.priceInr);
    const receiptId = `sub-${sellerId.slice(0, 12)}-${Date.now()}`;
    const order = await this.razorpay.createOrder(amountInr, receiptId);

    return {
      razorpayOrderId: order.id,
      amount: amountInr * 100,
      currency: 'INR',
      keyId: this.razorpay.keyId,
    };
  }

  async verifyAndActivate(sellerId: string, dto: VerifySubscriptionDto) {
    const valid = this.razorpay.verifySignature(
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );
    if (!valid) throw new UnauthorizedException('Payment verification failed');

    const plan = await this.prisma.subscriptionPlanConfig.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const existing = await this.prisma.sellerSubscription.findFirst({
      where: { razorpayPaymentId: dto.razorpayPaymentId },
    });
    if (existing) throw new BadRequestException('Payment already applied');

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

    return this.prisma.sellerSubscription.create({
      data: {
        sellerId,
        plan: SubscriptionPlan.STANDARD,
        planConfigId: plan.id,
        listingQuota: plan.listingQuota,
        price: plan.priceInr,
        durationDays: plan.durationDays,
        startsAt: now,
        expiresAt,
        status: SubscriptionStatus.ACTIVE,
        razorpayOrderId: dto.razorpayOrderId,
        razorpayPaymentId: dto.razorpayPaymentId,
      },
    });
  }

  /** Called by ListingsService to gate listing creation */
  async enforceQuota(sellerId: string): Promise<void> {
    const status = await this.getStatus(sellerId);
    if (status.remainingSlots <= 0) {
      if (status.plan === SubscriptionPlan.FREE) {
        throw new ForbiddenException(
          `Free plan allows ${status.listingQuota} active listings. Upgrade your subscription to list more machines.`,
        );
      }
      throw new ForbiddenException(
        `You have reached your listing quota of ${status.listingQuota} for your current subscription.`,
      );
    }
  }
}
