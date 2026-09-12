import { Prisma, Quote, QuoteStatus, Requirement, RequirementMedia } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';
import type { CreateRequirementDto } from './dto/create-requirement.dto';
import type { UpdateRequirementDto } from './dto/update-requirement.dto';
import type { AdminQueryRequirementsDto, QueryRequirementsDto } from './dto/query-requirements.dto';
import type { UploadRequirementMediaDto } from './dto/upload-requirement-media.dto';
import type { SubmitQuoteDto } from './dto/submit-quote.dto';
export declare class RequirementsService {
    private readonly prisma;
    private readonly storage;
    private readonly notifications;
    constructor(prisma: PrismaService, storage: StorageService, notifications: NotificationsService);
    create(buyerId: string, dto: CreateRequirementDto): Promise<Requirement>;
    findMine(buyerId: string): Promise<(Requirement & {
        media: RequirementMedia[];
        quotes: {
            id: string;
        }[];
    })[]>;
    findOwned(buyerId: string, id: string): Promise<Requirement & {
        media: RequirementMedia[];
    }>;
    update(buyerId: string, id: string, dto: UpdateRequirementDto): Promise<Requirement>;
    close(buyerId: string, id: string): Promise<Requirement>;
    markFulfilled(buyerId: string, id: string): Promise<Requirement>;
    addMedia(buyerId: string, id: string, dto: UploadRequirementMediaDto, file: Express.Multer.File): Promise<RequirementMedia>;
    removeMedia(buyerId: string, id: string, mediaId: string): Promise<void>;
    browse(query: QueryRequirementsDto): Promise<{
        items: ({
            media: {
                id: string;
                url: string;
                type: import("@prisma/client").$Enums.MediaType;
                orderIndex: number;
                isPrimary: boolean;
                storageKey: string;
                capturedAt: Date | null;
                durationSeconds: number | null;
                requirementId: string;
            }[];
            buyer: {
                id: string;
                fullName: string;
                locationCity: string | null;
                locationState: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            locationCity: string | null;
            locationState: string | null;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.RequirementStatus;
            description: string;
            subcategoryId: string | null;
            title: string;
            machineCategory: string;
            machineSubcategory: string | null;
            manufactureYear: number | null;
            origin: import("@prisma/client").$Enums.ListingOrigin | null;
            importedCountry: string | null;
            complexityTier: import("@prisma/client").$Enums.ComplexityTier;
            condition: import("@prisma/client").$Enums.ListingCondition | null;
            catalogCategoryId: string | null;
            specs: Prisma.JsonValue | null;
            runningHours: number | null;
            postedAt: Date | null;
            buyerId: string;
            budgetMin: Prisma.Decimal | null;
            budgetMax: Prisma.Decimal | null;
            quantity: number | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findPublicById(id: string): Promise<Requirement & {
        media: RequirementMedia[];
    }>;
    private buildPublicWhere;
    findAnyById(id: string): Promise<{
        media: {
            id: string;
            url: string;
            type: import("@prisma/client").$Enums.MediaType;
            orderIndex: number;
            isPrimary: boolean;
            storageKey: string;
            capturedAt: Date | null;
            durationSeconds: number | null;
            requirementId: string;
        }[];
        catalogCategory: ({
            specFields: {
                id: string;
                options: string[];
                categoryId: string;
                subcategoryId: string | null;
                fieldKey: string;
                fieldLabel: string;
                unit: string | null;
                fieldType: import("@prisma/client").$Enums.SpecFieldType;
                isRequired: boolean;
                isFilterable: boolean;
                filterType: import("@prisma/client").$Enums.SpecFilterType;
                displayOrder: number;
                helpText: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            displayOrder: number;
            groupId: string | null;
            slug: string;
            iconKey: string | null;
            imageUrl: string | null;
            thumbnailUrl: string | null;
            listingCount: number;
        }) | null;
        quotes: ({
            listing: {
                id: string;
                createdAt: Date;
                locationCity: string;
                locationState: string;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.ListingStatus;
                sellerId: string;
                description: string;
                subcategoryId: string | null;
                title: string;
                machineCategory: string;
                machineSubcategory: string | null;
                machineMake: string;
                machineModel: string;
                manufactureYear: number | null;
                origin: import("@prisma/client").$Enums.ListingOrigin;
                importedCountry: string | null;
                askingPrice: Prisma.Decimal;
                complexityTier: import("@prisma/client").$Enums.ComplexityTier;
                condition: import("@prisma/client").$Enums.ListingCondition;
                catalogCategoryId: string | null;
                specs: Prisma.JsonValue | null;
                conditionGrade: string | null;
                runningHours: number | null;
                serialNumber: string | null;
                negotiable: boolean;
                isBoosted: boolean;
                boostExpiresAt: Date | null;
                postedAt: Date | null;
                viewCount: number;
            } | null;
            responder: {
                id: string;
                fullName: string;
            };
        } & {
            message: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.QuoteStatus;
            price: Prisma.Decimal | null;
            description: string | null;
            machineCategory: string | null;
            machineMake: string | null;
            machineModel: string | null;
            manufactureYear: number | null;
            origin: import("@prisma/client").$Enums.ListingOrigin | null;
            importedCountry: string | null;
            condition: import("@prisma/client").$Enums.ListingCondition | null;
            catalogCategoryId: string | null;
            specs: Prisma.JsonValue | null;
            listingId: string | null;
            contactName: string | null;
            contactPhone: string | null;
            contactEmail: string | null;
            contactCompany: string | null;
            machineLocation: string | null;
            requirementId: string;
            responderId: string;
            adminReviewedAt: Date | null;
        })[];
        buyer: {
            phone: string;
            id: string;
            fullName: string;
            email: string | null;
            locationCity: string | null;
            locationState: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        locationCity: string | null;
        locationState: string | null;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.RequirementStatus;
        description: string;
        subcategoryId: string | null;
        title: string;
        machineCategory: string;
        machineSubcategory: string | null;
        manufactureYear: number | null;
        origin: import("@prisma/client").$Enums.ListingOrigin | null;
        importedCountry: string | null;
        complexityTier: import("@prisma/client").$Enums.ComplexityTier;
        condition: import("@prisma/client").$Enums.ListingCondition | null;
        catalogCategoryId: string | null;
        specs: Prisma.JsonValue | null;
        runningHours: number | null;
        postedAt: Date | null;
        buyerId: string;
        budgetMin: Prisma.Decimal | null;
        budgetMax: Prisma.Decimal | null;
        quantity: number | null;
    }>;
    adminList(query: AdminQueryRequirementsDto): Promise<{
        items: ({
            _count: {
                quotes: number;
            };
            media: {
                id: string;
                url: string;
                type: import("@prisma/client").$Enums.MediaType;
                orderIndex: number;
                isPrimary: boolean;
                storageKey: string;
                capturedAt: Date | null;
                durationSeconds: number | null;
                requirementId: string;
            }[];
            buyer: {
                phone: string;
                id: string;
                fullName: string;
                email: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            locationCity: string | null;
            locationState: string | null;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.RequirementStatus;
            description: string;
            subcategoryId: string | null;
            title: string;
            machineCategory: string;
            machineSubcategory: string | null;
            manufactureYear: number | null;
            origin: import("@prisma/client").$Enums.ListingOrigin | null;
            importedCountry: string | null;
            complexityTier: import("@prisma/client").$Enums.ComplexityTier;
            condition: import("@prisma/client").$Enums.ListingCondition | null;
            catalogCategoryId: string | null;
            specs: Prisma.JsonValue | null;
            runningHours: number | null;
            postedAt: Date | null;
            buyerId: string;
            budgetMin: Prisma.Decimal | null;
            budgetMax: Prisma.Decimal | null;
            quantity: number | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    submitQuote(responderId: string, requirementId: string, dto: SubmitQuoteDto, photos: Express.Multer.File[]): Promise<Quote>;
    findMyQuotesGiven(responderId: string): Promise<({
        listing: {
            id: string;
            title: string;
        } | null;
        requirement: {
            id: string;
            status: import("@prisma/client").$Enums.RequirementStatus;
            title: string;
            machineCategory: string;
        };
        media: {
            id: string;
            url: string;
            type: import("@prisma/client").$Enums.MediaType;
            orderIndex: number;
            isPrimary: boolean;
            storageKey: string;
            quoteId: string;
        }[];
    } & {
        message: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        price: Prisma.Decimal | null;
        description: string | null;
        machineCategory: string | null;
        machineMake: string | null;
        machineModel: string | null;
        manufactureYear: number | null;
        origin: import("@prisma/client").$Enums.ListingOrigin | null;
        importedCountry: string | null;
        condition: import("@prisma/client").$Enums.ListingCondition | null;
        catalogCategoryId: string | null;
        specs: Prisma.JsonValue | null;
        listingId: string | null;
        contactName: string | null;
        contactPhone: string | null;
        contactEmail: string | null;
        contactCompany: string | null;
        machineLocation: string | null;
        requirementId: string;
        responderId: string;
        adminReviewedAt: Date | null;
    })[]>;
    findQuotesForRequirement(buyerId: string, requirementId: string): Promise<({
        listing: ({
            media: {
                id: string;
                url: string;
                type: import("@prisma/client").$Enums.MediaType;
                orderIndex: number;
                isPrimary: boolean;
                listingId: string;
                storageKey: string;
                capturedAt: Date | null;
                durationSeconds: number | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            locationCity: string;
            locationState: string;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.ListingStatus;
            sellerId: string;
            description: string;
            subcategoryId: string | null;
            title: string;
            machineCategory: string;
            machineSubcategory: string | null;
            machineMake: string;
            machineModel: string;
            manufactureYear: number | null;
            origin: import("@prisma/client").$Enums.ListingOrigin;
            importedCountry: string | null;
            askingPrice: Prisma.Decimal;
            complexityTier: import("@prisma/client").$Enums.ComplexityTier;
            condition: import("@prisma/client").$Enums.ListingCondition;
            catalogCategoryId: string | null;
            specs: Prisma.JsonValue | null;
            conditionGrade: string | null;
            runningHours: number | null;
            serialNumber: string | null;
            negotiable: boolean;
            isBoosted: boolean;
            boostExpiresAt: Date | null;
            postedAt: Date | null;
            viewCount: number;
        }) | null;
        media: {
            id: string;
            url: string;
            type: import("@prisma/client").$Enums.MediaType;
            orderIndex: number;
            isPrimary: boolean;
            storageKey: string;
            quoteId: string;
        }[];
        responder: {
            id: string;
            fullName: string;
        };
    } & {
        message: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        price: Prisma.Decimal | null;
        description: string | null;
        machineCategory: string | null;
        machineMake: string | null;
        machineModel: string | null;
        manufactureYear: number | null;
        origin: import("@prisma/client").$Enums.ListingOrigin | null;
        importedCountry: string | null;
        condition: import("@prisma/client").$Enums.ListingCondition | null;
        catalogCategoryId: string | null;
        specs: Prisma.JsonValue | null;
        listingId: string | null;
        machineLocation: string | null;
        requirementId: string;
        responderId: string;
        adminReviewedAt: Date | null;
    })[]>;
    withdrawQuote(responderId: string, id: string): Promise<Quote>;
    adminListQuotes(status?: QuoteStatus): Promise<({
        listing: {
            id: string;
            title: string;
            askingPrice: Prisma.Decimal;
        } | null;
        requirement: {
            id: string;
            title: string;
            machineCategory: string;
            buyer: {
                id: string;
                fullName: string;
            };
        };
        media: {
            id: string;
            url: string;
            type: import("@prisma/client").$Enums.MediaType;
            orderIndex: number;
            isPrimary: boolean;
            storageKey: string;
            quoteId: string;
        }[];
        responder: {
            phone: string;
            id: string;
            fullName: string;
            email: string | null;
            gstStatus: import("@prisma/client").$Enums.GstStatus;
        };
    } & {
        message: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.QuoteStatus;
        price: Prisma.Decimal | null;
        description: string | null;
        machineCategory: string | null;
        machineMake: string | null;
        machineModel: string | null;
        manufactureYear: number | null;
        origin: import("@prisma/client").$Enums.ListingOrigin | null;
        importedCountry: string | null;
        condition: import("@prisma/client").$Enums.ListingCondition | null;
        catalogCategoryId: string | null;
        specs: Prisma.JsonValue | null;
        listingId: string | null;
        contactName: string | null;
        contactPhone: string | null;
        contactEmail: string | null;
        contactCompany: string | null;
        machineLocation: string | null;
        requirementId: string;
        responderId: string;
        adminReviewedAt: Date | null;
    })[]>;
}
