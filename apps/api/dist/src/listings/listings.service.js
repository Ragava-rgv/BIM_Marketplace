"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const shared_1 = require("@machinebazaar/shared");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
const spec_validation_service_1 = require("../spec-validation/spec-validation.service");
const EDITABLE_STATUSES = [client_1.ListingStatus.DRAFT, client_1.ListingStatus.REJECTED];
const DETAILS_EDITABLE_STATUSES = [client_1.ListingStatus.DRAFT, client_1.ListingStatus.REJECTED, client_1.ListingStatus.ACTIVE];
const MEDIA_UPDATABLE_STATUSES = [
    client_1.ListingStatus.DRAFT,
    client_1.ListingStatus.REJECTED,
    client_1.ListingStatus.ACTIVE,
];
let ListingsService = class ListingsService {
    prisma;
    storage;
    subscriptions;
    specValidation;
    constructor(prisma, storage, subscriptions, specValidation) {
        this.prisma = prisma;
        this.storage = storage;
        this.subscriptions = subscriptions;
        this.specValidation = specValidation;
    }
    async create(sellerId, dto) {
        const seller = await this.prisma.user.findUnique({ where: { id: sellerId } });
        if (!seller) {
            throw new common_1.NotFoundException('Seller not found');
        }
        if (seller.gstStatus !== client_1.GstStatus.ACTIVE) {
            throw new common_1.ForbiddenException('Your GST must be verified and ACTIVE before you can create a listing');
        }
        await this.subscriptions.enforceQuota(sellerId);
        let validatedSpecs;
        if (dto.catalogCategoryId) {
            const cat = await this.prisma.category.findUnique({
                where: { id: dto.catalogCategoryId },
                include: { specFields: { orderBy: { displayOrder: 'asc' } } },
            });
            if (!cat)
                throw new common_1.NotFoundException('Catalog category not found');
            if (dto.specs) {
                validatedSpecs = this.specValidation.validate(cat.specFields, dto.specs);
            }
        }
        return this.prisma.listing.create({
            data: {
                sellerId,
                title: dto.title,
                description: dto.description,
                machineCategory: dto.machineCategory,
                machineSubcategory: dto.machineSubcategory ?? null,
                machineMake: dto.machineMake,
                machineModel: dto.machineModel,
                manufactureYear: dto.manufactureYear ?? null,
                origin: dto.origin,
                importedCountry: dto.origin === 'IMPORTED' ? (dto.importedCountry ?? null) : null,
                askingPrice: new client_1.Prisma.Decimal(dto.askingPrice),
                locationCity: dto.locationCity,
                locationState: dto.locationState,
                complexityTier: dto.complexityTier ?? client_1.ComplexityTier.STANDARD,
                condition: dto.condition,
                catalogCategoryId: dto.catalogCategoryId ?? null,
                specs: validatedSpecs ? validatedSpecs : client_1.Prisma.JsonNull,
                conditionGrade: dto.conditionGrade ?? null,
                runningHours: dto.runningHours ?? null,
                serialNumber: dto.serialNumber ?? null,
                negotiable: dto.negotiable ?? false,
                status: client_1.ListingStatus.DRAFT,
            },
        });
    }
    async findMine(sellerId) {
        return this.prisma.listing.findMany({
            where: { sellerId },
            include: { media: { orderBy: { orderIndex: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOwned(sellerId, listingId) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
            include: { media: { orderBy: { orderIndex: 'asc' } } },
        });
        if (!listing || listing.sellerId !== sellerId) {
            throw new common_1.NotFoundException('Listing not found');
        }
        return listing;
    }
    async update(sellerId, listingId, dto) {
        const listing = await this.findOwned(sellerId, listingId);
        if (!DETAILS_EDITABLE_STATUSES.includes(listing.status)) {
            throw new common_1.ForbiddenException(`Listing cannot be edited while in ${listing.status} status`);
        }
        const { askingPrice, complexityTier, catalogCategoryId, specs, origin, importedCountry, ...rest } = dto;
        return this.prisma.listing.update({
            where: { id: listingId },
            data: {
                ...rest,
                askingPrice: askingPrice !== undefined ? new client_1.Prisma.Decimal(askingPrice) : undefined,
                complexityTier: complexityTier,
                catalogCategoryId: catalogCategoryId ?? undefined,
                specs: specs !== undefined ? specs : undefined,
                origin,
                importedCountry: origin === 'IMPORTED' ? importedCountry : origin === 'INDIAN' ? null : undefined,
            },
        });
    }
    async withdraw(sellerId, listingId) {
        const listing = await this.findOwned(sellerId, listingId);
        if (listing.status === client_1.ListingStatus.SOLD) {
            throw new common_1.ForbiddenException('A sold listing cannot be withdrawn');
        }
        return this.prisma.listing.update({
            where: { id: listingId },
            data: { status: client_1.ListingStatus.WITHDRAWN },
        });
    }
    async addMedia(sellerId, listingId, dto, file) {
        const listing = await this.findOwned(sellerId, listingId);
        if (!MEDIA_UPDATABLE_STATUSES.includes(listing.status)) {
            throw new common_1.ForbiddenException(`Media cannot be added while listing is in ${listing.status} status`);
        }
        if (dto.type === client_1.MediaType.PHOTO) {
            return this.addPhoto(listing, dto, file);
        }
        return this.addVideo(listing, dto, file);
    }
    async addPhoto(listing, dto, file) {
        if (!dto.capturedAt) {
            throw new common_1.BadRequestException('capturedAt is required for photos (parsed from the timestamp overlay/metadata)');
        }
        const capturedAt = new Date(dto.capturedAt);
        this.assertPhotoIsRecent(capturedAt);
        const existingPhotoCount = await this.prisma.listingMedia.count({
            where: { listingId: listing.id, type: client_1.MediaType.PHOTO },
        });
        if (existingPhotoCount >= shared_1.MAX_LISTING_PHOTOS) {
            throw new common_1.BadRequestException(`A listing may have at most ${shared_1.MAX_LISTING_PHOTOS} photos`);
        }
        const uploaded = await this.storage.upload(file, storage_service_1.LISTING_PHOTOS_DIR);
        return this.prisma.listingMedia.create({
            data: {
                listingId: listing.id,
                type: client_1.MediaType.PHOTO,
                storageKey: uploaded.key,
                url: uploaded.url,
                capturedAt,
                orderIndex: existingPhotoCount,
                isPrimary: existingPhotoCount === 0,
            },
        });
    }
    async addVideo(listing, dto, file) {
        if (!dto.durationSeconds) {
            throw new common_1.BadRequestException('durationSeconds is required for the running video');
        }
        if (dto.durationSeconds < shared_1.MIN_VIDEO_DURATION_SECONDS) {
            throw new common_1.BadRequestException(`The running video must be at least ${shared_1.MIN_VIDEO_DURATION_SECONDS} seconds, showing the machine actively operating with a timestamp overlay`);
        }
        const existingVideo = await this.prisma.listingMedia.findFirst({
            where: { listingId: listing.id, type: client_1.MediaType.VIDEO },
        });
        if (existingVideo) {
            throw new common_1.BadRequestException('Only one running video is allowed per listing — remove the existing one before uploading a replacement');
        }
        const uploaded = await this.storage.upload(file, storage_service_1.LISTING_VIDEOS_DIR);
        return this.prisma.listingMedia.create({
            data: {
                listingId: listing.id,
                type: client_1.MediaType.VIDEO,
                storageKey: uploaded.key,
                url: uploaded.url,
                capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : null,
                durationSeconds: dto.durationSeconds,
                orderIndex: 0,
            },
        });
    }
    async removeMedia(sellerId, listingId, mediaId) {
        const listing = await this.findOwned(sellerId, listingId);
        if (!MEDIA_UPDATABLE_STATUSES.includes(listing.status)) {
            throw new common_1.ForbiddenException(`Media cannot be removed while listing is in ${listing.status} status`);
        }
        const media = listing.media.find((m) => m.id === mediaId);
        if (!media) {
            throw new common_1.NotFoundException('Media item not found on this listing');
        }
        await this.prisma.listingMedia.delete({ where: { id: mediaId } });
        if (media.isPrimary && media.type === client_1.MediaType.PHOTO) {
            const next = await this.prisma.listingMedia.findFirst({
                where: { listingId, type: client_1.MediaType.PHOTO },
                orderBy: { orderIndex: 'asc' },
            });
            if (next) {
                await this.prisma.listingMedia.update({ where: { id: next.id }, data: { isPrimary: true } });
            }
        }
    }
    async reorderMedia(sellerId, listingId, mediaIds) {
        const listing = await this.findOwned(sellerId, listingId);
        if (!MEDIA_UPDATABLE_STATUSES.includes(listing.status)) {
            throw new common_1.ForbiddenException(`Media cannot be reordered while listing is in ${listing.status} status`);
        }
        const ownedIds = new Set(listing.media.map((m) => m.id));
        if (mediaIds.length !== ownedIds.size || !mediaIds.every((id) => ownedIds.has(id))) {
            throw new common_1.BadRequestException('mediaIds must include exactly the media items belonging to this listing');
        }
        await this.prisma.$transaction(mediaIds.map((id, index) => this.prisma.listingMedia.update({ where: { id }, data: { orderIndex: index } })));
        return this.prisma.listingMedia.findMany({ where: { listingId }, orderBy: { orderIndex: 'asc' } });
    }
    async setPrimaryMedia(sellerId, listingId, mediaId) {
        const listing = await this.findOwned(sellerId, listingId);
        if (!MEDIA_UPDATABLE_STATUSES.includes(listing.status)) {
            throw new common_1.ForbiddenException(`Media cannot be changed while listing is in ${listing.status} status`);
        }
        const media = listing.media.find((m) => m.id === mediaId);
        if (!media) {
            throw new common_1.NotFoundException('Media item not found on this listing');
        }
        if (media.type !== client_1.MediaType.PHOTO) {
            throw new common_1.BadRequestException('Only a photo can be set as the primary image');
        }
        await this.prisma.$transaction([
            this.prisma.listingMedia.updateMany({
                where: { listingId, type: client_1.MediaType.PHOTO },
                data: { isPrimary: false },
            }),
            this.prisma.listingMedia.update({ where: { id: mediaId }, data: { isPrimary: true } }),
        ]);
        return this.prisma.listingMedia.findMany({ where: { listingId }, orderBy: { orderIndex: 'asc' } });
    }
    assertPhotoIsRecent(capturedAt) {
        if (Number.isNaN(capturedAt.getTime())) {
            throw new common_1.BadRequestException('capturedAt must be a valid date parsed from the photo timestamp');
        }
        const ageMs = Date.now() - capturedAt.getTime();
        const maxAgeMs = shared_1.PHOTO_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
        if (ageMs < 0 || ageMs > maxAgeMs) {
            throw new common_1.BadRequestException(`Every photo must be timestamped and captured within the last ${shared_1.PHOTO_MAX_AGE_DAYS} days. ` +
                'Use the Timestamp Camera app to capture compliant photos.');
        }
    }
    async submitForReview(sellerId, listingId) {
        const listing = await this.findOwned(sellerId, listingId);
        if (!EDITABLE_STATUSES.includes(listing.status)) {
            throw new common_1.ForbiddenException(`Listing is already in ${listing.status} status`);
        }
        this.assertMediaGate(listing.media);
        return this.prisma.listing.update({
            where: { id: listingId },
            data: { status: client_1.ListingStatus.PENDING_REVIEW },
        });
    }
    assertMediaGate(media) {
        const photos = media.filter((m) => m.type === client_1.MediaType.PHOTO);
        const videos = media.filter((m) => m.type === client_1.MediaType.VIDEO);
        if (photos.length < shared_1.MIN_LISTING_PHOTOS || photos.length > shared_1.MAX_LISTING_PHOTOS) {
            throw new common_1.BadRequestException(`Listing requires between ${shared_1.MIN_LISTING_PHOTOS} and ${shared_1.MAX_LISTING_PHOTOS} photos (found ${photos.length})`);
        }
        for (const photo of photos) {
            if (!photo.capturedAt) {
                throw new common_1.BadRequestException('Every photo must carry a captured-at timestamp');
            }
            this.assertPhotoIsRecent(photo.capturedAt);
        }
        if (videos.length !== 1) {
            throw new common_1.BadRequestException('Listing requires exactly one running video showing the machine operating');
        }
        const [video] = videos;
        if (!video.durationSeconds || video.durationSeconds < shared_1.MIN_VIDEO_DURATION_SECONDS) {
            throw new common_1.BadRequestException(`The running video must be at least ${shared_1.MIN_VIDEO_DURATION_SECONDS} seconds with a timestamp overlay`);
        }
    }
    async approve(listingId) {
        const listing = await this.requirePendingReview(listingId);
        return this.prisma.listing.update({
            where: { id: listing.id },
            data: { status: client_1.ListingStatus.ACTIVE, postedAt: listing.postedAt ?? new Date() },
        });
    }
    async reject(listingId) {
        const listing = await this.requirePendingReview(listingId);
        return this.prisma.listing.update({ where: { id: listing.id }, data: { status: client_1.ListingStatus.REJECTED } });
    }
    async markSold(listingId) {
        const listing = await this.requireStatus(listingId, [client_1.ListingStatus.ACTIVE, client_1.ListingStatus.UNDER_OFFER]);
        return this.prisma.listing.update({ where: { id: listing.id }, data: { status: client_1.ListingStatus.SOLD } });
    }
    async markInactive(listingId) {
        const listing = await this.requireStatus(listingId, [client_1.ListingStatus.ACTIVE, client_1.ListingStatus.UNDER_OFFER]);
        return this.prisma.listing.update({ where: { id: listing.id }, data: { status: client_1.ListingStatus.WITHDRAWN } });
    }
    async reactivate(listingId) {
        const listing = await this.requireStatus(listingId, [client_1.ListingStatus.SOLD, client_1.ListingStatus.WITHDRAWN]);
        return this.prisma.listing.update({
            where: { id: listing.id },
            data: { status: client_1.ListingStatus.ACTIVE, postedAt: listing.postedAt ?? new Date() },
        });
    }
    async requireStatus(listingId, allowed) {
        const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        if (!allowed.includes(listing.status)) {
            throw new common_1.BadRequestException(`Listing is in ${listing.status} status; expected one of ${allowed.join(', ')}`);
        }
        return listing;
    }
    async requirePendingReview(listingId) {
        const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        if (listing.status !== client_1.ListingStatus.PENDING_REVIEW) {
            throw new common_1.BadRequestException(`Listing is in ${listing.status} status, not awaiting review`);
        }
        return listing;
    }
    async browse(query) {
        const where = await this.buildPublicWhere(query);
        return this.paginate({ ...where, status: client_1.ListingStatus.ACTIVE }, query);
    }
    async findPublicById(listingId, viewer, ip) {
        const listing = await this.prisma.listing.findFirst({
            where: { id: listingId, status: { in: [client_1.ListingStatus.ACTIVE, client_1.ListingStatus.UNDER_OFFER, client_1.ListingStatus.SOLD] } },
            include: {
                media: { orderBy: { orderIndex: 'asc' } },
                catalogCategory: { include: { specFields: { orderBy: { displayOrder: 'asc' } } } },
            },
        });
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        const isOwnListing = viewer?.id === listing.sellerId;
        const isAdmin = viewer?.role === client_1.UserRole.ADMIN;
        if (!isOwnListing && !isAdmin) {
            const viewerKey = viewer ? `user:${viewer.id}` : `ip:${ip ?? 'unknown'}`;
            try {
                const counted = await this.recordView(listing.id, viewerKey);
                if (counted)
                    listing.viewCount += 1;
            }
            catch {
            }
        }
        return listing;
    }
    async recordView(listingId, viewerKey) {
        const existing = await this.prisma.listingView.findUnique({
            where: { listingId_viewerKey: { listingId, viewerKey } },
        });
        if (existing && Date.now() - existing.viewedAt.getTime() < 24 * 60 * 60 * 1000) {
            return false;
        }
        await this.prisma.$transaction([
            this.prisma.listingView.upsert({
                where: { listingId_viewerKey: { listingId, viewerKey } },
                create: { listingId, viewerKey },
                update: { viewedAt: new Date() },
            }),
            this.prisma.listing.update({ where: { id: listingId }, data: { viewCount: { increment: 1 } } }),
        ]);
        return true;
    }
    async findAnyById(listingId) {
        const listing = await this.prisma.listing.findUnique({
            where: { id: listingId },
            include: {
                media: { orderBy: { orderIndex: 'asc' } },
                catalogCategory: { include: { specFields: { orderBy: { displayOrder: 'asc' } } } },
                seller: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        email: true,
                        gstNumber: true,
                        businessName: true,
                        gstStatus: true,
                        locationCity: true,
                        locationState: true,
                    },
                },
            },
        });
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        return listing;
    }
    async adminList(query) {
        const where = await this.buildPublicWhere(query);
        if (query.status) {
            where.status = query.status;
        }
        if (query.sellerSearch) {
            where.seller = {
                OR: [
                    { fullName: { contains: query.sellerSearch, mode: 'insensitive' } },
                    { email: { contains: query.sellerSearch, mode: 'insensitive' } },
                    { phone: { contains: query.sellerSearch, mode: 'insensitive' } },
                ],
            };
        }
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;
        const orderBy = query.sort === 'price_asc'
            ? { askingPrice: 'asc' }
            : query.sort === 'price_desc'
                ? { askingPrice: 'desc' }
                : { createdAt: 'desc' };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.listing.findMany({
                where,
                include: {
                    media: {
                        where: { type: client_1.MediaType.PHOTO },
                        orderBy: [{ isPrimary: 'desc' }, { orderIndex: 'asc' }],
                        take: 1,
                    },
                    seller: { select: { id: true, fullName: true, email: true, phone: true } },
                },
                orderBy,
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.listing.count({ where }),
        ]);
        return { items, total, page, pageSize };
    }
    async buildPublicWhere(query) {
        const where = {};
        if (query.category)
            where.machineCategory = { equals: query.category, mode: 'insensitive' };
        if (query.subcategory)
            where.machineSubcategory = { equals: query.subcategory, mode: 'insensitive' };
        if (query.categorySlug) {
            const cat = await this.prisma.category.findUnique({ where: { slug: query.categorySlug } });
            if (cat)
                where.machineCategory = { equals: cat.name, mode: 'insensitive' };
        }
        if (query.subcategorySlug) {
            const sub = await this.prisma.subcategory.findFirst({ where: { slug: query.subcategorySlug } });
            if (sub)
                where.machineSubcategory = { equals: sub.name, mode: 'insensitive' };
        }
        if (query.make)
            where.machineMake = { equals: query.make, mode: 'insensitive' };
        if (query.condition)
            where.conditionGrade = { equals: query.condition, mode: 'insensitive' };
        if (query.origin)
            where.origin = query.origin;
        if (query.conditionType)
            where.condition = query.conditionType;
        if (query.city)
            where.locationCity = { equals: query.city, mode: 'insensitive' };
        if (query.state)
            where.locationState = { equals: query.state, mode: 'insensitive' };
        if (query.yearMin || query.yearMax) {
            where.manufactureYear = {
                ...(query.yearMin ? { gte: query.yearMin } : {}),
                ...(query.yearMax ? { lte: query.yearMax } : {}),
            };
        }
        if (query.priceMin || query.priceMax) {
            where.askingPrice = {
                ...(query.priceMin ? { gte: new client_1.Prisma.Decimal(query.priceMin) } : {}),
                ...(query.priceMax ? { lte: new client_1.Prisma.Decimal(query.priceMax) } : {}),
            };
        }
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
                { machineMake: { contains: query.search, mode: 'insensitive' } },
                { machineModel: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        return where;
    }
    async sweepExpiredBoosts() {
        await this.prisma.listing.updateMany({
            where: { isBoosted: true, boostExpiresAt: { lte: new Date() } },
            data: { isBoosted: false },
        });
    }
    async paginate(where, query) {
        await this.sweepExpiredBoosts();
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;
        const secondarySort = query.sort === 'price_asc'
            ? { askingPrice: 'asc' }
            : query.sort === 'price_desc'
                ? { askingPrice: 'desc' }
                : query.sort === 'year_desc'
                    ? { manufactureYear: 'desc' }
                    : { createdAt: 'desc' };
        const orderBy = [{ isBoosted: 'desc' }, secondarySort];
        const [items, total] = await this.prisma.$transaction([
            this.prisma.listing.findMany({
                where,
                include: {
                    media: {
                        where: { type: client_1.MediaType.PHOTO },
                        orderBy: [{ isPrimary: 'desc' }, { orderIndex: 'asc' }],
                        take: 1,
                    },
                },
                orderBy,
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.listing.count({ where }),
        ]);
        return { items, total, page, pageSize };
    }
};
exports.ListingsService = ListingsService;
exports.ListingsService = ListingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        subscriptions_service_1.SubscriptionsService,
        spec_validation_service_1.SpecValidationService])
], ListingsService);
//# sourceMappingURL=listings.service.js.map