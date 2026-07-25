export declare class CreateBuyerPlanDto {
    name: string;
    displayName: string;
    contactViewQuota: number;
    priceInr: number;
    durationDays?: number;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
    isFree?: boolean;
    isDefault?: boolean;
}
declare const UpdateBuyerPlanDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateBuyerPlanDto>>;
export declare class UpdateBuyerPlanDto extends UpdateBuyerPlanDto_base {
}
export {};
