import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { EnquiriesService } from './enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto } from './dto/update-enquiry.dto';
export declare class EnquiriesController {
    private readonly enquiries;
    constructor(enquiries: EnquiriesService);
    create(user: AuthenticatedUser, dto: CreateEnquiryDto): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.EnquiryStatus;
        sellerId: string;
        listingId: string;
        buyerId: string;
    }>;
    mine(user: AuthenticatedUser): Promise<({
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
    forSeller(user: AuthenticatedUser): Promise<{
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
            email: string | null;
            phone: string;
            fullName: string;
            gstNumber: string | null;
            businessName: string | null;
            locationCity: string | null;
            locationState: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.EnquiryStatus;
        sellerId: string;
        listingId: string;
        buyerId: string;
    })[]>;
    updateStatus(id: string, dto: UpdateEnquiryDto): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.EnquiryStatus;
        sellerId: string;
        listingId: string;
        buyerId: string;
    }>;
}
