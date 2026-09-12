import { Enquiry, EnquiryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class EnquiriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(buyerId: string, listingId: string): Promise<Enquiry>;
    listMine(buyerId: string): Promise<({
        listing: {
            id: string;
            status: import("@prisma/client").$Enums.ListingStatus;
            title: string;
            askingPrice: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.EnquiryStatus;
        sellerId: string;
        listingId: string;
        buyerId: string;
    })[]>;
    listForSeller(sellerId: string): Promise<{
        id: string;
        listingId: string;
        listingTitle: string;
        status: import("@prisma/client").$Enums.EnquiryStatus;
        createdAt: Date;
        buyerName: string;
        buyerLocationCity: string | null;
        buyerLocationState: string | null;
    }[]>;
    listAll(): Promise<({
        listing: {
            id: string;
            status: import("@prisma/client").$Enums.ListingStatus;
            title: string;
            askingPrice: import("@prisma/client/runtime/library").Decimal;
        };
        buyer: {
            phone: string;
            fullName: string;
            email: string | null;
            locationCity: string | null;
            locationState: string | null;
            gstNumber: string | null;
            businessName: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.EnquiryStatus;
        sellerId: string;
        listingId: string;
        buyerId: string;
    })[]>;
    updateStatus(id: string, status: EnquiryStatus): Promise<Enquiry>;
}
