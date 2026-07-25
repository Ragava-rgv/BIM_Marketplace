import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from '../payments/razorpay.service';
import type { CreateBuyerSubscriptionOrderDto, VerifyBuyerSubscriptionDto } from './dto/subscribe.dto';
export declare class BuyerSubscriptionsService {
    private readonly prisma;
    private readonly razorpay;
    constructor(prisma: PrismaService, razorpay: RazorpayService);
    private activeWhere;
    private getOrProvisionActiveSubscription;
    getStatus(buyerId: string): Promise<{
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
                priceInr: Prisma.Decimal;
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
            price: Prisma.Decimal;
            startsAt: Date;
            buyerId: string;
            quotaTotal: number;
            quotaUsed: number;
            adjustedBy: string | null;
            adjustedAt: Date | null;
            adjustmentReason: string | null;
        };
    }>;
    createOrder(buyerId: string, dto: CreateBuyerSubscriptionOrderDto): Promise<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    verifyAndActivate(buyerId: string, dto: VerifyBuyerSubscriptionDto): Promise<{
        plan: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            displayName: string;
            priceInr: Prisma.Decimal;
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
        price: Prisma.Decimal;
        startsAt: Date;
        buyerId: string;
        quotaTotal: number;
        quotaUsed: number;
        adjustedBy: string | null;
        adjustedAt: Date | null;
        adjustmentReason: string | null;
    }>;
    revealStatus(buyerId: string, listingId: string): Promise<{
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
    reveal(buyerId: string, listingId: string): Promise<{
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
    listContactViews(buyerId: string, page: number, pageSize: number): Promise<{
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
    adminList(search: string | undefined, page: number, pageSize: number): Promise<{
        items: ({
            plan: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                displayName: string;
                priceInr: Prisma.Decimal;
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
            price: Prisma.Decimal;
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
    adjustQuota(id: string, adminId: string, delta: number, reason: string): Promise<{
        plan: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            displayName: string;
            priceInr: Prisma.Decimal;
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
        price: Prisma.Decimal;
        startsAt: Date;
        buyerId: string;
        quotaTotal: number;
        quotaUsed: number;
        adjustedBy: string | null;
        adjustedAt: Date | null;
        adjustmentReason: string | null;
    }>;
}
