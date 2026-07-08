export declare class CreatePlanDto {
    name: string;
    displayName: string;
    listingQuota: number;
    priceInr: number;
    durationDays: number;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
    isFree?: boolean;
}
declare const UpdatePlanDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePlanDto>>;
export declare class UpdatePlanDto extends UpdatePlanDto_base {
}
export {};
