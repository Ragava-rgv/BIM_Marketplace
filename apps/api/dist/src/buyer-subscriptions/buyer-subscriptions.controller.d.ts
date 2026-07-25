import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { BuyerSubscriptionsService } from './buyer-subscriptions.service';
import { CreateBuyerSubscriptionOrderDto, VerifyBuyerSubscriptionDto } from './dto/subscribe.dto';
import { AdjustQuotaDto, AdminQueryBuyerSubscriptionsDto } from './dto/admin-query.dto';
export declare class BuyerSubscriptionsController {
    private readonly service;
    constructor(service: BuyerSubscriptionsService);
    getStatus(user: AuthenticatedUser): Promise<{
        quotaTotal: number;
        quotaUsed: number;
        quotaRemaining: number;
        expiresAt: Date | null;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        subscription: {
            plan: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                displayName: string;
                priceInr: import("@prisma/client/runtime/library").Decimal;
                durationDays: number | null;
                isActive: boolean;
                isFree: boolean;
                description: string | null;
                sortOrder: number;
                contactViewQuota: number;
                isDefault: boolean;
                deletedAt: Date | null;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            durationDays: number | null;
            deletedAt: Date | null;
            expiresAt: Date | null;
            status: import("@prisma/client").$Enums.SubscriptionStatus;
            planId: string | null;
            razorpayOrderId: string | null;
            razorpayPaymentId: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            startsAt: Date;
            buyerId: string;
            quotaTotal: number;
            quotaUsed: number;
            adjustedBy: string | null;
            adjustedAt: Date | null;
            adjustmentReason: string | null;
        };
    }>;
    createOrder(user: AuthenticatedUser, dto: CreateBuyerSubscriptionOrderDto): Promise<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    verify(user: AuthenticatedUser, dto: VerifyBuyerSubscriptionDto): Promise<{
        plan: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            displayName: string;
            priceInr: import("@prisma/client/runtime/library").Decimal;
            durationDays: number | null;
            isActive: boolean;
            isFree: boolean;
            description: string | null;
            sortOrder: number;
            contactViewQuota: number;
            isDefault: boolean;
            deletedAt: Date | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        durationDays: number | null;
        deletedAt: Date | null;
        expiresAt: Date | null;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        planId: string | null;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        startsAt: Date;
        buyerId: string;
        quotaTotal: number;
        quotaUsed: number;
        adjustedBy: string | null;
        adjustedAt: Date | null;
        adjustmentReason: string | null;
    }>;
    revealStatus(user: AuthenticatedUser, listingId: string): Promise<{
        contact: {
            fullName: string;
            phone: string;
            email: string | null;
            address: string;
        };
        quotaUsed: number;
        quotaTotal: number;
        quotaRemaining: number;
        isIdempotent: boolean;
    } | {
        contact: null;
        quotaUsed: number;
        quotaTotal: number;
        quotaRemaining: number;
        isIdempotent: boolean;
    }>;
    reveal(user: AuthenticatedUser, listingId: string): Promise<{
        contact: {
            fullName: string;
            phone: string;
            email: string | null;
            address: string;
        };
        quotaUsed: number;
        quotaTotal: number;
        quotaRemaining: number;
        isIdempotent: boolean;
    }>;
    listContactViews(user: AuthenticatedUser, page?: string, pageSize?: string): Promise<{
        items: ({
            listing: {
                id: string;
                machineCategory: string;
                title: string;
            };
            seller: {
                id: string;
                fullName: string;
                businessName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            deletedAt: Date | null;
            sellerId: string;
            listingId: string;
            buyerId: string;
            buyerSubscriptionId: string;
            viewedAt: Date;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
export declare class AdminBuyerSubscriptionsController {
    private readonly service;
    constructor(service: BuyerSubscriptionsService);
    list(query: AdminQueryBuyerSubscriptionsDto): Promise<{
        items: ({
            plan: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                displayName: string;
                priceInr: import("@prisma/client/runtime/library").Decimal;
                durationDays: number | null;
                isActive: boolean;
                isFree: boolean;
                description: string | null;
                sortOrder: number;
                contactViewQuota: number;
                isDefault: boolean;
                deletedAt: Date | null;
            } | null;
            buyer: {
                id: string;
                email: string | null;
                phone: string;
                fullName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            durationDays: number | null;
            deletedAt: Date | null;
            expiresAt: Date | null;
            status: import("@prisma/client").$Enums.SubscriptionStatus;
            planId: string | null;
            razorpayOrderId: string | null;
            razorpayPaymentId: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            startsAt: Date;
            buyerId: string;
            quotaTotal: number;
            quotaUsed: number;
            adjustedBy: string | null;
            adjustedAt: Date | null;
            adjustmentReason: string | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    adjustQuota(admin: AuthenticatedUser, id: string, dto: AdjustQuotaDto): Promise<{
        plan: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            displayName: string;
            priceInr: import("@prisma/client/runtime/library").Decimal;
            durationDays: number | null;
            isActive: boolean;
            isFree: boolean;
            description: string | null;
            sortOrder: number;
            contactViewQuota: number;
            isDefault: boolean;
            deletedAt: Date | null;
        } | null;
        buyer: {
            id: string;
            email: string | null;
            phone: string;
            fullName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        durationDays: number | null;
        deletedAt: Date | null;
        expiresAt: Date | null;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        planId: string | null;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        startsAt: Date;
        buyerId: string;
        quotaTotal: number;
        quotaUsed: number;
        adjustedBy: string | null;
        adjustedAt: Date | null;
        adjustmentReason: string | null;
    }>;
}
