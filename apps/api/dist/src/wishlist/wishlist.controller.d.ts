import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { WishlistService } from './wishlist.service';
export declare class WishlistController {
    private readonly wishlist;
    constructor(wishlist: WishlistService);
    list(user: AuthenticatedUser): Promise<({
        media: {
            id: string;
            url: string;
            type: import("@prisma/client").$Enums.MediaType;
            orderIndex: number;
            isPrimary: boolean;
            listingId: string;
            storageKey: string;
            capturedAt: Date | null;
            durationSeconds: number | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        locationCity: string;
        locationState: string;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.ListingStatus;
        sellerId: string;
        description: string;
        subcategoryId: string | null;
        title: string;
        machineCategory: string;
        machineSubcategory: string | null;
        machineMake: string;
        machineModel: string;
        manufactureYear: number | null;
        origin: import("@prisma/client").$Enums.ListingOrigin;
        importedCountry: string | null;
        askingPrice: import("@prisma/client/runtime/library").Decimal;
        complexityTier: import("@prisma/client").$Enums.ComplexityTier;
        condition: import("@prisma/client").$Enums.ListingCondition;
        catalogCategoryId: string | null;
        specs: import("@prisma/client/runtime/library").JsonValue | null;
        conditionGrade: string | null;
        runningHours: number | null;
        serialNumber: string | null;
        negotiable: boolean;
        isBoosted: boolean;
        boostExpiresAt: Date | null;
        postedAt: Date | null;
        viewCount: number;
    })[]>;
    listIds(user: AuthenticatedUser): Promise<string[]>;
    add(user: AuthenticatedUser, listingId: string): Promise<{
        saved: boolean;
    }>;
    remove(user: AuthenticatedUser, listingId: string): Promise<{
        saved: boolean;
    }>;
}
