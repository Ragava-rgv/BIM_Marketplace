import { ListingOrigin, ListingStatus } from '@prisma/client';
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
    condition?: string;
    origin?: ListingOrigin;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'year_desc';
    page?: number;
    pageSize?: number;
}
export declare class AdminQueryListingsDto extends QueryListingsDto {
    status?: ListingStatus;
    sellerSearch?: string;
}
