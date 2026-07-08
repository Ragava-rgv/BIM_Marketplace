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
    createOrder(user: AuthenticatedUser, dto: CreateSubscriptionOrderDto): Promise<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    verify(user: AuthenticatedUser, dto: VerifySubscriptionDto): Promise<{
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
}
