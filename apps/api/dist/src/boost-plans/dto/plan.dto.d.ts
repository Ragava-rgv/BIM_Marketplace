export declare class CreateBoostPlanDto {
    name: string;
    displayName: string;
    priceInr: number;
    durationDays: number;
    sortWeight?: number;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
}
declare const UpdateBoostPlanDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateBoostPlanDto>>;
export declare class UpdateBoostPlanDto extends UpdateBoostPlanDto_base {
}
export {};
