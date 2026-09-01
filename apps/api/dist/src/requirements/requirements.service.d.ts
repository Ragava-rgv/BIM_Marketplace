import { Prisma, Quote, QuoteStatus, Requirement, RequirementMedia } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { CreateRequirementDto } from './dto/create-requirement.dto';
import type { UpdateRequirementDto } from './dto/update-requirement.dto';
import type { AdminQueryRequirementsDto, QueryRequirementsDto } from './dto/query-requirements.dto';
import type { UploadRequirementMediaDto } from './dto/upload-requirement-media.dto';
import type { SubmitQuoteDto } from './dto/submit-quote.dto';
export declare class RequirementsService {
    private readonly prisma;
    private readonly storage;
    constructor(prisma: PrismaService, storage: StorageService);
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
    submitForReview(buyerId: string, id: string): Promise<Requirement>;
    addMedia(buyerId: string, id: string, dto: UploadRequirementMediaDto, file: Express.Multer.File): Promise<RequirementMedia>;
    removeMedia(buyerId: string, id: string, mediaId: string): Promise<void>;
    browse(query: QueryRequirementsDto): Promise<{
        items: ({
            media: {
                id: string;
                type: import("@prisma/client").$Enums.MediaType;
                url: string;
                capturedAt: Date | null;
                durationSeconds: number | null;
                orderIndex: number;
                storageKey: string;
                isPrimary: boolean;
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
            machineCategory: string;
            locationCity: string | null;
            locationState: string | null;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            status: import("@prisma/client").$Enums.RequirementStatus;
            title: string;
            machineSubcategory: string | null;
            manufactureYear: number | null;
            origin: import("@prisma/client").$Enums.ListingOrigin | null;
            importedCountry: string | null;
            complexityTier: import("@prisma/client").$Enums.ComplexityTier;
            condition: import("@prisma/client").$Enums.ListingCondition | null;
            catalogCategoryId: string | null;
            specs: Prisma.JsonValue | null;
            runningHours: number | null;
            subcategoryId: string | null;
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
            type: import("@prisma/client").$Enums.MediaType;
            url: string;
            capturedAt: Date | null;
            durationSeconds: number | null;
            orderIndex: number;
            storageKey: string;
            isPrimary: boolean;
            requirementId: string;
        }[];
        catalogCategory: ({
            specFields: {
                id: string;
                isFilterable: boolean;
                unit: string | null;
                filterType: import("@prisma/client").$Enums.SpecFilterType;
                options: string[];
                displayOrder: number;
                categoryId: string;
                fieldKey: string;
                fieldLabel: string;
                fieldType: import("@prisma/client").$Enums.SpecFieldType;
                isRequired: boolean;
                helpText: string | null;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            description: string | null;
            displayOrder: number;
            slug: string;
            groupId: string | null;
            iconKey: string | null;
            imageUrl: string | null;
            thumbnailUrl: string | null;
            listingCount: number;
        }) | null;
        quotes: ({
            listing: {
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
                subcategoryId: string | null;
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
            id: string;
            machineCategory: string | null;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            message: string | null;
            status: import("@prisma/client").$Enums.QuoteStatus;
            price: Prisma.Decimal | null;
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
            id: string;
            email: string | null;
            phone: string;
            fullName: string;
            locationCity: string | null;
            locationState: string | null;
        };
    } & {
        id: string;
        machineCategory: string;
        locationCity: string | null;
        locationState: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        status: import("@prisma/client").$Enums.RequirementStatus;
        title: string;
        machineSubcategory: string | null;
        manufactureYear: number | null;
        origin: import("@prisma/client").$Enums.ListingOrigin | null;
        importedCountry: string | null;
        complexityTier: import("@prisma/client").$Enums.ComplexityTier;
        condition: import("@prisma/client").$Enums.ListingCondition | null;
        catalogCategoryId: string | null;
        specs: Prisma.JsonValue | null;
        runningHours: number | null;
        subcategoryId: string | null;
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
                type: import("@prisma/client").$Enums.MediaType;
                url: string;
                capturedAt: Date | null;
                durationSeconds: number | null;
                orderIndex: number;
                storageKey: string;
                isPrimary: boolean;
                requirementId: string;
            }[];
            buyer: {
                id: string;
                email: string | null;
                phone: string;
                fullName: string;
            };
        } & {
            id: string;
            machineCategory: string;
            locationCity: string | null;
            locationState: string | null;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            status: import("@prisma/client").$Enums.RequirementStatus;
            title: string;
            machineSubcategory: string | null;
            manufactureYear: number | null;
            origin: import("@prisma/client").$Enums.ListingOrigin | null;
            importedCountry: string | null;
            complexityTier: import("@prisma/client").$Enums.ComplexityTier;
            condition: import("@prisma/client").$Enums.ListingCondition | null;
            catalogCategoryId: string | null;
            specs: Prisma.JsonValue | null;
            runningHours: number | null;
            subcategoryId: string | null;
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
    approve(id: string): Promise<Requirement>;
    reject(id: string): Promise<Requirement>;
    private requirePendingReview;
    submitQuote(responderId: string, requirementId: string, dto: SubmitQuoteDto, photos: Express.Multer.File[]): Promise<Quote>;
    findMyQuotesGiven(responderId: string): Promise<({
        listing: {
            id: string;
            title: string;
        } | null;
        requirement: {
            id: string;
            machineCategory: string;
            status: import("@prisma/client").$Enums.RequirementStatus;
            title: string;
        };
        media: {
            id: string;
            type: import("@prisma/client").$Enums.MediaType;
            url: string;
            orderIndex: number;
            storageKey: string;
            isPrimary: boolean;
            quoteId: string;
        }[];
    } & {
        id: string;
        machineCategory: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        message: string | null;
        status: import("@prisma/client").$Enums.QuoteStatus;
        price: Prisma.Decimal | null;
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
    findApprovedQuotesForRequirement(buyerId: string, requirementId: string): Promise<({
        listing: ({
            media: {
                id: string;
                type: import("@prisma/client").$Enums.MediaType;
                url: string;
                capturedAt: Date | null;
                durationSeconds: number | null;
                orderIndex: number;
                listingId: string;
                storageKey: string;
                isPrimary: boolean;
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
            subcategoryId: string | null;
            isBoosted: boolean;
            boostExpiresAt: Date | null;
            postedAt: Date | null;
            viewCount: number;
        }) | null;
        media: {
            id: string;
            type: import("@prisma/client").$Enums.MediaType;
            url: string;
            orderIndex: number;
            storageKey: string;
            isPrimary: boolean;
            quoteId: string;
        }[];
        responder: {
            id: string;
            fullName: string;
        };
    } & {
        id: string;
        machineCategory: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        message: string | null;
        status: import("@prisma/client").$Enums.QuoteStatus;
        price: Prisma.Decimal | null;
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
    adminListQuotes(status?: QuoteStatus): Promise<({
        listing: {
            id: string;
            title: string;
            askingPrice: Prisma.Decimal;
        } | null;
        requirement: {
            id: string;
            machineCategory: string;
            title: string;
            buyer: {
                id: string;
                fullName: string;
            };
        };
        media: {
            id: string;
            type: import("@prisma/client").$Enums.MediaType;
            url: string;
            orderIndex: number;
            storageKey: string;
            isPrimary: boolean;
            quoteId: string;
        }[];
        responder: {
            id: string;
            email: string | null;
            phone: string;
            fullName: string;
            gstStatus: import("@prisma/client").$Enums.GstStatus;
        };
    } & {
        id: string;
        machineCategory: string | null;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        message: string | null;
        status: import("@prisma/client").$Enums.QuoteStatus;
        price: Prisma.Decimal | null;
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
    approveQuote(id: string): Promise<Quote>;
    rejectQuote(id: string): Promise<Quote>;
    private requirePendingQuote;
}
