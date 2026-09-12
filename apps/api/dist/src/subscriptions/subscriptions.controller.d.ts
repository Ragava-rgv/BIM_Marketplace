import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionOrderDto, VerifySubscriptionDto } from './dto/verify-subscription.dto';
export declare class SubscriptionsController {
    private readonly service;
    constructor(service: SubscriptionsService);
    getStatus(user: AuthenticatedUser): Promise<{
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
    createOrder(user: AuthenticatedUser, dto: CreateSubscriptionOrderDto): Promise<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    verify(user: AuthenticatedUser, dto: VerifySubscriptionDto): Promise<{
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
}
