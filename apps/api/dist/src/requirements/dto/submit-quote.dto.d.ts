import { ListingCondition, ListingOrigin } from '@prisma/client';
export declare class SubmitQuoteDto {
    listingId?: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    contactCompany?: string;
    catalogCategoryId?: string;
    machineCategory?: string;
    machineMake?: string;
    machineModel?: string;
    manufactureYear?: number;
    origin?: ListingOrigin;
    importedCountry?: string;
    condition?: ListingCondition;
    machineLocation: string;
    price: number;
    description?: string;
    specs?: Record<string, unknown>;
    message?: string;
}
