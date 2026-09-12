import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from '../payments/razorpay.service';
import type { CreateSubscriptionOrderDto, VerifySubscriptionDto } from './dto/verify-subscription.dto';
export declare class SubscriptionsService {
    private readonly prisma;
    private readonly razorpay;
    constructor(prisma: PrismaService, razorpay: RazorpayService);
    getStatus(sellerId: string): Promise<{
        plan: "FREE" | "STANDARD";
        listingQuota: number;
        activeListingsCount: number;
        remainingSlots: number;
        subscription: ({
            planConfig: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                listingQuota: number;
                durationDays: number;
                displayName: string;
                priceInr: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                isFree: boolean;
                description: string | null;
                sortOrder: number;
            } | null;
        } & {
            id: string;
            expiresAt: Date;
            createdAt: Date;
            status: import("@prisma/client").$Enums.SubscriptionStatus;
            sellerId: string;
            plan: import("@prisma/client").$Enums.SubscriptionPlan;
            planConfigId: string | null;
            listingQuota: number;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            startsAt: Date;
            razorpayOrderId: string | null;
            razorpayPaymentId: string | null;
        }) | null;
    }>;
    createOrder(sellerId: string, dto: CreateSubscriptionOrderDto): Promise<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    verifyAndActivate(sellerId: string, dto: VerifySubscriptionDto): Promise<{
        id: string;
        expiresAt: Date;
        createdAt: Date;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        sellerId: string;
        plan: import("@prisma/client").$Enums.SubscriptionPlan;
        planConfigId: string | null;
        listingQuota: number;
        price: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        startsAt: Date;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
    }>;
    enforceQuota(sellerId: string): Promise<void>;
}
