import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { RequirementsService } from './requirements.service';
export declare class QuotesController {
    private readonly requirements;
    constructor(requirements: RequirementsService);
    findMine(user: AuthenticatedUser): Promise<({
        listing: {
            id: string;
            title: string;
        } | null;
        requirement: {
            id: string;
            status: import("@prisma/client").$Enums.RequirementStatus;
            title: string;
            machineCategory: string;
        };
        media: {
            id: string;
            url: string;
            type: import("@prisma/client").$Enums.MediaType;
            orderIndex: number;
            isPrimary: boolean;
            storageKey: string;
            quoteId: string;
        }[];
    } & {
        message: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        price: import("@prisma/client/runtime/library").Decimal | null;
        description: string | null;
        machineCategory: string | null;
        machineMake: string | null;
        machineModel: string | null;
        manufactureYear: number | null;
        origin: import("@prisma/client").$Enums.ListingOrigin | null;
        importedCountry: string | null;
        condition: import("@prisma/client").$Enums.ListingCondition | null;
        catalogCategoryId: string | null;
        specs: import("@prisma/client/runtime/library").JsonValue | null;
        listingId: string | null;
        contactName: string | null;
        contactPhone: string | null;
        contactEmail: string | null;
        contactCompany: string | null;
        machineLocation: string | null;
        requirementId: string;
        responderId: string;
        adminReviewedAt: Date | null;
    })[]>;
    withdraw(user: AuthenticatedUser, id: string): Promise<{
        message: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        price: import("@prisma/client/runtime/library").Decimal | null;
        description: string | null;
        machineCategory: string | null;
        machineMake: string | null;
        machineModel: string | null;
        manufactureYear: number | null;
        origin: import("@prisma/client").$Enums.ListingOrigin | null;
        importedCountry: string | null;
        condition: import("@prisma/client").$Enums.ListingCondition | null;
        catalogCategoryId: string | null;
        specs: import("@prisma/client/runtime/library").JsonValue | null;
        listingId: string | null;
        contactName: string | null;
        contactPhone: string | null;
        contactEmail: string | null;
        contactCompany: string | null;
        machineLocation: string | null;
        requirementId: string;
        responderId: string;
        adminReviewedAt: Date | null;
    }>;
}
