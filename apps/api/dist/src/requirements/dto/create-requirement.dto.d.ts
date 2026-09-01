import { ComplexityTier, ListingCondition, ListingOrigin } from '@prisma/client';
export declare class CreateRequirementDto {
    title: string;
    description: string;
    machineCategory: string;
    machineSubcategory?: string;
    origin?: ListingOrigin;
    importedCountry?: string;
    manufactureYear?: number | null;
    runningHours?: number | null;
    condition?: ListingCondition;
    complexityTier?: ComplexityTier;
    catalogCategoryId?: string;
    specs?: Record<string, unknown>;
    budgetMin?: number;
    budgetMax?: number;
    quantity?: number;
    locationCity?: string;
    locationState?: string;
}
