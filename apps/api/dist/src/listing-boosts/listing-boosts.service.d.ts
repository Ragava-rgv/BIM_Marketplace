import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from '../payments/razorpay.service';
import type { CreateBoostOrderDto, VerifyBoostDto } from './dto/boost-order.dto';
export declare class ListingBoostsService {
    private readonly prisma;
    private readonly razorpay;
    constructor(prisma: PrismaService, razorpay: RazorpayService);
    private findOwnedListing;
    getStatus(sellerId: string, listingId: string): Promise<{
        isBoosted: boolean;
        boostExpiresAt: Date | null;
    }>;
    createOrder(sellerId: string, listingId: string, dto: CreateBoostOrderDto): Promise<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    verifyAndActivate(sellerId: string, listingId: string, dto: VerifyBoostDto): Promise<{
        id: string;
        expiresAt: Date;
        createdAt: Date;
        sellerId: string;
        price: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        startsAt: Date;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
        listingId: string;
        planId: string | null;
    }>;
    listMine(sellerId: string): Promise<({
        listing: {
            id: string;
            title: string;
        };
        plan: {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            durationDays: number;
            displayName: string;
            priceInr: import("@prisma/client/runtime/library").Decimal;
            isActive: boolean;
            description: string | null;
            sortOrder: number;
            deletedAt: Date | null;
            sortWeight: number;
        } | null;
    } & {
        id: string;
        expiresAt: Date;
        createdAt: Date;
        sellerId: string;
        price: import("@prisma/client/runtime/library").Decimal;
        durationDays: number;
        startsAt: Date;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
        listingId: string;
        planId: string | null;
    })[]>;
    sweepExpired(): Promise<void>;
}
