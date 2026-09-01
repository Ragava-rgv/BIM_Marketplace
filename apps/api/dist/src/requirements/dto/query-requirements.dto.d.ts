import { RequirementStatus } from '@prisma/client';
export declare class QueryRequirementsDto {
    category?: string;
    subcategory?: string;
    categorySlug?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}
export declare class AdminQueryRequirementsDto extends QueryRequirementsDto {
    status?: RequirementStatus;
}
