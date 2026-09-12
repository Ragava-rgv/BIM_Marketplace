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
                createdAt: Date;
                name: string;
                updatedAt: Date;
                durationDays: number | null;
                displayName: string;
                priceInr: Prisma.Decimal;
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
            price: Prisma.Decimal;
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
    createOrder(buyerId: string, dto: CreateBuyerSubscriptionOrderDto): Promise<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    verifyAndActivate(buyerId: string, dto: VerifyBuyerSubscriptionDto): Promise<{
        plan: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            durationDays: number | null;
            displayName: string;
            priceInr: Prisma.Decimal;
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
        price: Prisma.Decimal;
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
    adminList(search: string | undefined, page: number, pageSize: number): Promise<{
        items: ({
            plan: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                durationDays: number | null;
                displayName: string;
                priceInr: Prisma.Decimal;
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
            price: Prisma.Decimal;
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
    adjustQuota(id: string, adminId: string, delta: number, reason: string): Promise<{
        plan: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            durationDays: number | null;
            displayName: string;
            priceInr: Prisma.Decimal;
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
        price: Prisma.Decimal;
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
