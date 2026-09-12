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
                createdAt: Date;
                name: string;
                updatedAt: Date;
                durationDays: number | null;
                displayName: string;
                priceInr: import("@prisma/client/runtime/library").Decimal;
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
            expiresAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.SubscriptionStatus;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number | null;
            startsAt: Date;
            razorpayOrderId: string | null;
            razorpayPaymentId: string | null;
            buyerId: string;
            deletedAt: Date | null;
            planId: string | null;
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
            createdAt: Date;
            name: string;
            updatedAt: Date;
            durationDays: number | null;
            displayName: string;
            priceInr: import("@prisma/client/runtime/library").Decimal;
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
        expiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        price: import("@prisma/client/runtime/library").Decimal;
        durationDays: number | null;
        startsAt: Date;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
        buyerId: string;
        deletedAt: Date | null;
        planId: string | null;
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
                title: string;
                machineCategory: string;
            };
            seller: {
                id: string;
                fullName: string;
                businessName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            sellerId: string;
            listingId: string;
            viewedAt: Date;
            buyerId: string;
            deletedAt: Date | null;
            buyerSubscriptionId: string;
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
                createdAt: Date;
                name: string;
                updatedAt: Date;
                durationDays: number | null;
                displayName: string;
                priceInr: import("@prisma/client/runtime/library").Decimal;
                isActive: boolean;
                isFree: boolean;
                description: string | null;
                sortOrder: number;
                contactViewQuota: number;
                isDefault: boolean;
                deletedAt: Date | null;
            } | null;
            buyer: {
                phone: string;
                id: string;
                fullName: string;
                email: string | null;
            };
        } & {
            id: string;
            expiresAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.SubscriptionStatus;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number | null;
            startsAt: Date;
            razorpayOrderId: string | null;
            razorpayPaymentId: string | null;
            buyerId: string;
            deletedAt: Date | null;
            planId: string | null;
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
            createdAt: Date;
            name: string;
            updatedAt: Date;
            durationDays: number | null;
            displayName: string;
            priceInr: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            isFree: boolean;
            description: string | null;
            sortOrder: number;
            contactViewQuota: number;
            isDefault: boolean;
            deletedAt: Date | null;
        } | null;
        buyer: {
            phone: string;
            id: string;
            fullName: string;
            email: string | null;
        };
    } & {
        id: string;
        expiresAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.SubscriptionStatus;
        price: import("@prisma/client/runtime/library").Decimal;
        durationDays: number | null;
        startsAt: Date;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
        buyerId: string;
        deletedAt: Date | null;
        planId: string | null;
        quotaTotal: number;
        quotaUsed: number;
        adjustedBy: string | null;
        adjustedAt: Date | null;
        adjustmentReason: string | null;
    }>;
}
