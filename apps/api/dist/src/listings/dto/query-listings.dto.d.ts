import { ListingStatus } from '@prisma/client';
export declare class QueryListingsDto {
    category?: string;
    subcategory?: string;
    categorySlug?: string;
    subcategorySlug?: string;
    make?: string;
    yearMin?: number;
    yearMax?: number;
    priceMin?: number;
    priceMax?: number;
    city?: string;
    state?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}
export declare class AdminQueryListingsDto extends QueryListingsDto {
    status?: ListingStatus;
}
