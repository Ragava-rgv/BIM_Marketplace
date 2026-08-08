import { AdPlacement } from '@prisma/client';
export declare class CreateAdvertisementDto {
    title: string;
    linkUrl?: string;
    position?: number;
    sortOrder?: number;
    isActive?: boolean;
    placement?: AdPlacement;
    startsAt?: string;
    endsAt?: string;
}
declare const UpdateAdvertisementDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateAdvertisementDto>>;
export declare class UpdateAdvertisementDto extends UpdateAdvertisementDto_base {
}
export {};
