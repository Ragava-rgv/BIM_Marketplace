import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAdvertisementDto, UpdateAdvertisementDto } from './dto/advertisement.dto';
export declare class AdvertisementsService {
    private readonly prisma;
    private readonly storage;
    constructor(prisma: PrismaService, storage: StorageService);
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
    findById(id: string): Promise<{
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
    create(dto: CreateAdvertisementDto, file: Express.Multer.File | undefined): Promise<{
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
    update(id: string, dto: UpdateAdvertisementDto, file: Express.Multer.File | undefined): Promise<{
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
