import { ComplexityTier, ListingCondition, ListingOrigin } from '@prisma/client';
export declare class CreateListingDto {
    title: string;
    description: string;
    machineCategory: string;
    machineSubcategory?: string;
    machineMake: string;
    machineModel: string;
    manufactureYear?: number | null;
    origin: ListingOrigin;
    importedCountry?: string;
    askingPrice: number;
    locationCity: string;
    locationState: string;
    complexityTier?: ComplexityTier;
    condition: ListingCondition;
    catalogCategoryId?: string;
    specs?: Record<string, unknown>;
    conditionGrade?: string;
    runningHours?: number | null;
    serialNumber?: string;
    negotiable?: boolean;
}
