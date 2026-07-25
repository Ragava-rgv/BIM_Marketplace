import { AdvertisementsService } from './advertisements.service';
import { CreateAdvertisementDto, UpdateAdvertisementDto } from './dto/advertisement.dto';
export declare class AdvertisementsController {
    private readonly service;
    constructor(service: AdvertisementsService);
    listActive(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        sortOrder: number;
        deletedAt: Date | null;
        imageUrl: string;
        title: string;
        linkUrl: string | null;
        position: number;
    }[]>;
    listAll(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        sortOrder: number;
        deletedAt: Date | null;
        imageUrl: string;
        title: string;
        linkUrl: string | null;
        position: number;
    }[]>;
    create(dto: CreateAdvertisementDto, file?: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        sortOrder: number;
        deletedAt: Date | null;
        imageUrl: string;
        title: string;
        linkUrl: string | null;
        position: number;
    }>;
    update(id: string, dto: UpdateAdvertisementDto, file?: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        sortOrder: number;
        deletedAt: Date | null;
        imageUrl: string;
        title: string;
        linkUrl: string | null;
        position: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        sortOrder: number;
        deletedAt: Date | null;
        imageUrl: string;
        title: string;
        linkUrl: string | null;
        position: number;
    }>;
    purge(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        sortOrder: number;
        deletedAt: Date | null;
        imageUrl: string;
        title: string;
        linkUrl: string | null;
        position: number;
    }>;
}
