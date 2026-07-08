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
                name: string;
                createdAt: Date;
                updatedAt: Date;
                displayName: string;
                listingQuota: number;
                priceInr: import("@prisma/client/runtime/library").Decimal;
                durationDays: number;
                isActive: boolean;
                isFree: boolean;
                description: string | null;
                sortOrder: number;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            listingQuota: number;
            durationDays: number;
            expiresAt: Date;
            status: import("@prisma/client").$Enums.SubscriptionStatus;
            razorpayOrderId: string | null;
            razorpayPaymentId: string | null;
            sellerId: string;
            plan: import("@prisma/client").$Enums.SubscriptionPlan;
            planConfigId: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            startsAt: Date;
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
        createdAt: Date;
        listingQuota: number;
        durationDays: number;
        expiresAt: Date;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
        sellerId: string;
        plan: import("@prisma/client").$Enums.SubscriptionPlan;
        planConfigId: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        startsAt: Date;
    }>;
    enforceQuota(sellerId: string): Promise<void>;
}
