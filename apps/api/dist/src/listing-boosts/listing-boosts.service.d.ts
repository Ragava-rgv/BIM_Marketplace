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
        createdAt: Date;
        durationDays: number;
        expiresAt: Date;
        planId: string | null;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
        sellerId: string;
        price: import("@prisma/client/runtime/library").Decimal;
        startsAt: Date;
        listingId: string;
    }>;
    listMine(sellerId: string): Promise<({
        listing: {
            id: string;
            title: string;
        };
        plan: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            displayName: string;
            priceInr: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
            isActive: boolean;
            description: string | null;
            sortOrder: number;
            deletedAt: Date | null;
            sortWeight: number;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        durationDays: number;
        expiresAt: Date;
        planId: string | null;
        razorpayOrderId: string | null;
        razorpayPaymentId: string | null;
        sellerId: string;
        price: import("@prisma/client/runtime/library").Decimal;
        startsAt: Date;
        listingId: string;
    })[]>;
    sweepExpired(): Promise<void>;
}
