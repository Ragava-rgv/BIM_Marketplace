import { Listing, ListingMedia, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SpecValidationService } from '../spec-validation/spec-validation.service';
import type { CreateListingDto } from './dto/create-listing.dto';
import type { UpdateListingDto } from './dto/update-listing.dto';
import type { QueryListingsDto, AdminQueryListingsDto } from './dto/query-listings.dto';
import type { UploadMediaDto } from './dto/upload-media.dto';
export declare class ListingsService {
    private readonly prisma;
    private readonly storage;
    private readonly subscriptions;
    private readonly specValidation;
    constructor(prisma: PrismaService, storage: StorageService, subscriptions: SubscriptionsService, specValidation: SpecValidationService);
    create(sellerId: string, dto: CreateListingDto): Promise<Listing>;
    findMine(sellerId: string): Promise<Listing[]>;
    findOwned(sellerId: string, listingId: string): Promise<Listing & {
        media: ListingMedia[];
    }>;
    update(sellerId: string, listingId: string, dto: UpdateListingDto): Promise<Listing>;
    withdraw(sellerId: string, listingId: string): Promise<Listing>;
    addMedia(sellerId: string, listingId: string, dto: UploadMediaDto, file: Express.Multer.File): Promise<ListingMedia>;
    private addPhoto;
    private addVideo;
    removeMedia(sellerId: string, listingId: string, mediaId: string): Promise<void>;
    private assertPhotoIsRecent;
    submitForReview(sellerId: string, listingId: string): Promise<Listing>;
    private assertMediaGate;
    approve(listingId: string): Promise<Listing>;
    reject(listingId: string): Promise<Listing>;
    private requirePendingReview;
    browse(query: QueryListingsDto): Promise<{
        items: ({
            media: {
                id: string;
                type: import("@prisma/client").$Enums.MediaType;
                url: string;
                capturedAt: Date | null;
                durationSeconds: number | null;
                orderIndex: number;
                listingId: string;
                storageKey: string;
            }[];
        } & {
            id: string;
            machineCategory: string;
            locationCity: string;
            locationState: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            status: import("@prisma/client").$Enums.ListingStatus;
            sellerId: string;
            title: string;
            machineSubcategory: string | null;
            machineMake: string;
            machineModel: string;
            manufactureYear: number;
            askingPrice: Prisma.Decimal;
            complexityTier: import("@prisma/client").$Enums.ComplexityTier;
            catalogCategoryId: string | null;
            specs: Prisma.JsonValue | null;
            conditionGrade: string | null;
            runningHours: number | null;
            serialNumber: string | null;
            negotiable: boolean;
            subcategoryId: string | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findPublicById(listingId: string): Promise<Listing & {
        media: ListingMedia[];
    }>;
    findAnyById(listingId: string): Promise<{
        media: {
            id: string;
            type: import("@prisma/client").$Enums.MediaType;
            url: string;
            capturedAt: Date | null;
            durationSeconds: number | null;
            orderIndex: number;
            listingId: string;
            storageKey: string;
        }[];
        seller: {
            id: string;
            email: string | null;
            phone: string;
            fullName: string;
            gstNumber: string | null;
            businessName: string | null;
            gstStatus: import("@prisma/client").$Enums.GstStatus;
            locationCity: string | null;
            locationState: string | null;
        };
    } & {
        id: string;
        machineCategory: string;
        locationCity: string;
        locationState: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        status: import("@prisma/client").$Enums.ListingStatus;
        sellerId: string;
        title: string;
        machineSubcategory: string | null;
        machineMake: string;
        machineModel: string;
        manufactureYear: number;
        askingPrice: Prisma.Decimal;
        complexityTier: import("@prisma/client").$Enums.ComplexityTier;
        catalogCategoryId: string | null;
        specs: Prisma.JsonValue | null;
        conditionGrade: string | null;
        runningHours: number | null;
        serialNumber: string | null;
        negotiable: boolean;
        subcategoryId: string | null;
    }>;
    adminList(query: AdminQueryListingsDto): Promise<{
        items: ({
            media: {
                id: string;
                type: import("@prisma/client").$Enums.MediaType;
                url: string;
                capturedAt: Date | null;
                durationSeconds: number | null;
                orderIndex: number;
                listingId: string;
                storageKey: string;
            }[];
        } & {
            id: string;
            machineCategory: string;
            locationCity: string;
            locationState: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            status: import("@prisma/client").$Enums.ListingStatus;
            sellerId: string;
            title: string;
            machineSubcategory: string | null;
            machineMake: string;
            machineModel: string;
            manufactureYear: number;
            askingPrice: Prisma.Decimal;
            complexityTier: import("@prisma/client").$Enums.ComplexityTier;
            catalogCategoryId: string | null;
            specs: Prisma.JsonValue | null;
            conditionGrade: string | null;
            runningHours: number | null;
            serialNumber: string | null;
            negotiable: boolean;
            subcategoryId: string | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    private buildPublicWhere;
    private paginate;
}
