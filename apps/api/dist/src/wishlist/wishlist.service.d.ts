import { PrismaService } from '../prisma/prisma.service';
export declare class WishlistService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    add(buyerId: string, listingId: string): Promise<void>;
    remove(buyerId: string, listingId: string): Promise<void>;
    list(buyerId: string): Promise<({
        media: {
            id: string;
            type: import("@prisma/client").$Enums.MediaType;
            url: string;
            capturedAt: Date | null;
            durationSeconds: number | null;
            orderIndex: number;
            listingId: string;
            storageKey: string;
            isPrimary: boolean;
        }[];
    } & {
        id: string;
        machineCategory: string;
        locationCity: string;
        locationState: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        status: import("@prisma/client").$Enums.ListingStatus;
        sellerId: string;
        title: string;
        machineSubcategory: string | null;
        machineMake: string;
        machineModel: string;
        manufactureYear: number | null;
        origin: import("@prisma/client").$Enums.ListingOrigin;
        importedCountry: string | null;
        askingPrice: import("@prisma/client/runtime/library").Decimal;
        complexityTier: import("@prisma/client").$Enums.ComplexityTier;
        catalogCategoryId: string | null;
        specs: import("@prisma/client/runtime/library").JsonValue | null;
        conditionGrade: string | null;
        runningHours: number | null;
        serialNumber: string | null;
        negotiable: boolean;
        subcategoryId: string | null;
        isBoosted: boolean;
        boostExpiresAt: Date | null;
    })[]>;
    listIds(buyerId: string): Promise<string[]>;
}
