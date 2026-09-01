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
            machineCategory: string;
            status: import("@prisma/client").$Enums.RequirementStatus;
            title: string;
        };
        media: {
            id: string;
            type: import("@prisma/client").$Enums.MediaType;
            url: string;
            orderIndex: number;
            storageKey: string;
            isPrimary: boolean;
            quoteId: string;
        }[];
    } & {
        id: string;
        machineCategory: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        message: string | null;
        status: import("@prisma/client").$Enums.QuoteStatus;
        price: import("@prisma/client/runtime/library").Decimal | null;
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
}
