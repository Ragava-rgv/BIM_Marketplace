import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { ListingBoostsService } from './listing-boosts.service';
import { CreateBoostOrderDto, VerifyBoostDto } from './dto/boost-order.dto';
export declare class ListingBoostsController {
    private readonly boosts;
    constructor(boosts: ListingBoostsService);
    listMine(user: AuthenticatedUser): Promise<({
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
    getStatus(user: AuthenticatedUser, listingId: string): Promise<{
        isBoosted: boolean;
        boostExpiresAt: Date | null;
    }>;
    createOrder(user: AuthenticatedUser, listingId: string, dto: CreateBoostOrderDto): Promise<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    verify(user: AuthenticatedUser, listingId: string, dto: VerifyBoostDto): Promise<{
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
}
