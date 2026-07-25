export declare class CreateAdvertisementDto {
    title: string;
    linkUrl?: string;
    position?: number;
    sortOrder?: number;
    isActive?: boolean;
}
declare const UpdateAdvertisementDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateAdvertisementDto>>;
export declare class UpdateAdvertisementDto extends UpdateAdvertisementDto_base {
}
export {};
