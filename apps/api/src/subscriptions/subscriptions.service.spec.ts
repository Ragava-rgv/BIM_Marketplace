import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from '../payments/razorpay.service';

/**
 * Regression coverage for Bug 8 ("admin subscription updates not reflecting on seller side"):
 * `getStatus` must read the seller's listing quota from the live `SubscriptionPlanConfig`, not
 * the value snapshotted onto `SellerSubscription` at purchase time — otherwise an admin raising
 * a plan's `listingQuota` has no effect on sellers already subscribed to it.
 */
describe('SubscriptionsService.getStatus — live vs snapshotted quota (Bug 8)', () => {
  let service: SubscriptionsService;
  let prisma: { sellerSubscription: { findFirst: jest.Mock }; listing: { count: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      sellerSubscription: { findFirst: jest.fn() },
      listing: { count: jest.fn().mockResolvedValue(5) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RazorpayService, useValue: {} },
      ],
    }).compile();

    service = module.get(SubscriptionsService);
  });

  it('uses the live plan config quota, not the stale snapshot, when the plan is still active', async () => {
    prisma.sellerSubscription.findFirst.mockResolvedValue({
      listingQuota: 4, // stale value snapshotted at purchase time
      status: SubscriptionStatus.ACTIVE,
      planConfig: { isActive: true, listingQuota: 10 }, // admin has since raised this to 10
    });

    const status = await service.getStatus('seller-1');

    expect(status.listingQuota).toBe(10);
    expect(status.remainingSlots).toBe(5); // 10 - 5 active listings, not 4 - 5 (clamped to 0)
    expect(status.plan).toBe(SubscriptionPlan.STANDARD);
  });

  it('falls back to the snapshotted quota if the plan config was deleted or deactivated', async () => {
    prisma.sellerSubscription.findFirst.mockResolvedValue({
      listingQuota: 4,
      status: SubscriptionStatus.ACTIVE,
      planConfig: { isActive: false, listingQuota: 10 },
    });

    const status = await service.getStatus('seller-1');

    expect(status.listingQuota).toBe(4);
  });

  it('falls back to the snapshotted quota when planConfig is null (FK set-null on plan delete)', async () => {
    prisma.sellerSubscription.findFirst.mockResolvedValue({
      listingQuota: 4,
      status: SubscriptionStatus.ACTIVE,
      planConfig: null,
    });

    const status = await service.getStatus('seller-1');

    expect(status.listingQuota).toBe(4);
  });

  it('enforceQuota does not throw once the live plan quota exceeds the active listing count', async () => {
    prisma.sellerSubscription.findFirst.mockResolvedValue({
      listingQuota: 4,
      status: SubscriptionStatus.ACTIVE,
      planConfig: { isActive: true, listingQuota: 10 },
    });
    prisma.listing.count.mockResolvedValue(6); // between the stale (4) and live (10) quota

    await expect(service.enforceQuota('seller-1')).resolves.not.toThrow();
  });
});
