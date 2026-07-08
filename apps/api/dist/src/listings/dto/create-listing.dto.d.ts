import { ComplexityTier } from '@prisma/client';
export declare class CreateListingDto {
    title: string;
    description: string;
    machineCategory: string;
    machineSubcategory?: string;
    machineMake: string;
    machineModel: string;
    manufactureYear: number;
    askingPrice: number;
    locationCity: string;
    locationState: string;
    complexityTier?: ComplexityTier;
    catalogCategoryId?: string;
    specs?: Record<string, unknown>;
    conditionGrade?: string;
    runningHours?: number;
    serialNumber?: string;
    negotiable?: boolean;
}
