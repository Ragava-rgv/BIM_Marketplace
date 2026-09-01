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
exports.RequirementsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const EDITABLE_STATUSES = [client_1.RequirementStatus.DRAFT, client_1.RequirementStatus.REJECTED];
const MAX_REQUIREMENT_PHOTOS = 6;
const PUBLIC_VISIBLE_STATUSES = [client_1.RequirementStatus.ACTIVE, client_1.RequirementStatus.FULFILLED];
let RequirementsService = class RequirementsService {
    prisma;
    storage;
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    async create(buyerId, dto) {
        let validatedSpecs;
        if (dto.catalogCategoryId && dto.specs) {
            validatedSpecs = dto.specs;
        }
        return this.prisma.requirement.create({
            data: {
                buyerId,
                title: dto.title,
                description: dto.description,
                machineCategory: dto.machineCategory,
                machineSubcategory: dto.machineSubcategory ?? null,
                origin: dto.origin ?? null,
                importedCountry: dto.origin === 'IMPORTED' ? (dto.importedCountry ?? null) : null,
                manufactureYear: dto.manufactureYear ?? null,
                runningHours: dto.runningHours ?? null,
                condition: dto.condition ?? null,
                complexityTier: dto.complexityTier ?? client_1.ComplexityTier.STANDARD,
                catalogCategoryId: dto.catalogCategoryId ?? null,
                specs: validatedSpecs ?? client_1.Prisma.JsonNull,
                budgetMin: dto.budgetMin !== undefined ? new client_1.Prisma.Decimal(dto.budgetMin) : null,
                budgetMax: dto.budgetMax !== undefined ? new client_1.Prisma.Decimal(dto.budgetMax) : null,
                quantity: dto.quantity ?? 1,
                locationCity: dto.locationCity ?? null,
                locationState: dto.locationState ?? null,
                status: client_1.RequirementStatus.DRAFT,
            },
        });
    }
    async findMine(buyerId) {
        return this.prisma.requirement.findMany({
            where: { buyerId },
            include: {
                media: { orderBy: { orderIndex: 'asc' } },
                quotes: { select: { id: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOwned(buyerId, id) {
        const req = await this.prisma.requirement.findUnique({
            where: { id },
            include: { media: { orderBy: { orderIndex: 'asc' } } },
        });
        if (!req || req.buyerId !== buyerId) {
            throw new common_1.NotFoundException('Requirement not found');
        }
        return req;
    }
    async update(buyerId, id, dto) {
        const req = await this.findOwned(buyerId, id);
        if (!EDITABLE_STATUSES.includes(req.status)) {
            throw new common_1.ForbiddenException(`Requirement cannot be edited while in ${req.status} status`);
        }
        const { catalogCategoryId, specs, origin, importedCountry, budgetMin, budgetMax, ...rest } = dto;
        return this.prisma.requirement.update({
            where: { id },
            data: {
                ...rest,
                catalogCategoryId: catalogCategoryId ?? undefined,
                specs: specs !== undefined ? specs : undefined,
                origin,
                importedCountry: origin === 'IMPORTED' ? importedCountry : origin === 'INDIAN' ? null : undefined,
                budgetMin: budgetMin !== undefined ? new client_1.Prisma.Decimal(budgetMin) : undefined,
                budgetMax: budgetMax !== undefined ? new client_1.Prisma.Decimal(budgetMax) : undefined,
            },
        });
    }
    async close(buyerId, id) {
        const req = await this.findOwned(buyerId, id);
        if (req.status === client_1.RequirementStatus.CLOSED) {
            throw new common_1.BadRequestException('Requirement is already closed');
        }
        return this.prisma.requirement.update({ where: { id }, data: { status: client_1.RequirementStatus.CLOSED } });
    }
    async markFulfilled(buyerId, id) {
        const req = await this.findOwned(buyerId, id);
        if (req.status !== client_1.RequirementStatus.ACTIVE) {
            throw new common_1.BadRequestException(`Requirement is in ${req.status} status, not ACTIVE`);
        }
        return this.prisma.requirement.update({ where: { id }, data: { status: client_1.RequirementStatus.FULFILLED } });
    }
    async submitForReview(buyerId, id) {
        const req = await this.findOwned(buyerId, id);
        if (!EDITABLE_STATUSES.includes(req.status)) {
            throw new common_1.ForbiddenException(`Requirement is already in ${req.status} status`);
        }
        return this.prisma.requirement.update({ where: { id }, data: { status: client_1.RequirementStatus.PENDING_REVIEW } });
    }
    async addMedia(buyerId, id, dto, file) {
        const req = await this.findOwned(buyerId, id);
        if (![...EDITABLE_STATUSES, client_1.RequirementStatus.ACTIVE].includes(req.status)) {
            throw new common_1.ForbiddenException(`Media cannot be added while requirement is in ${req.status} status`);
        }
        if (dto.type === client_1.MediaType.PHOTO) {
            const existingPhotoCount = await this.prisma.requirementMedia.count({
                where: { requirementId: id, type: client_1.MediaType.PHOTO },
            });
            if (existingPhotoCount >= MAX_REQUIREMENT_PHOTOS) {
                throw new common_1.BadRequestException(`A requirement may have at most ${MAX_REQUIREMENT_PHOTOS} photos`);
            }
            const uploaded = await this.storage.upload(file, storage_service_1.REQUIREMENT_PHOTOS_DIR);
            return this.prisma.requirementMedia.create({
                data: {
                    requirementId: id,
                    type: client_1.MediaType.PHOTO,
                    storageKey: uploaded.key,
                    url: uploaded.url,
                    orderIndex: existingPhotoCount,
                    isPrimary: existingPhotoCount === 0,
                },
            });
        }
        const uploaded = await this.storage.upload(file, storage_service_1.REQUIREMENT_VIDEOS_DIR);
        return this.prisma.requirementMedia.create({
            data: {
                requirementId: id,
                type: client_1.MediaType.VIDEO,
                storageKey: uploaded.key,
                url: uploaded.url,
                durationSeconds: dto.durationSeconds ?? null,
                orderIndex: 0,
            },
        });
    }
    async removeMedia(buyerId, id, mediaId) {
        const req = await this.findOwned(buyerId, id);
        const media = req.media.find((m) => m.id === mediaId);
        if (!media) {
            throw new common_1.NotFoundException('Media not found on this requirement');
        }
        await this.prisma.requirementMedia.delete({ where: { id: mediaId } });
    }
    async browse(query) {
        const where = await this.buildPublicWhere(query);
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;
        const [items, total] = await this.prisma.$transaction([
            this.prisma.requirement.findMany({
                where: { ...where, status: client_1.RequirementStatus.ACTIVE },
                include: {
                    media: { where: { type: client_1.MediaType.PHOTO }, orderBy: [{ isPrimary: 'desc' }, { orderIndex: 'asc' }], take: 1 },
                    buyer: { select: { id: true, fullName: true, locationCity: true, locationState: true } },
                },
                orderBy: { postedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.requirement.count({ where: { ...where, status: client_1.RequirementStatus.ACTIVE } }),
        ]);
        return { items, total, page, pageSize };
    }
    async findPublicById(id) {
        const req = await this.prisma.requirement.findFirst({
            where: { id, status: { in: PUBLIC_VISIBLE_STATUSES } },
            include: {
                media: { orderBy: { orderIndex: 'asc' } },
                catalogCategory: { include: { specFields: { orderBy: { displayOrder: 'asc' } } } },
            },
        });
        if (!req) {
            throw new common_1.NotFoundException('Requirement not found');
        }
        return req;
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
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        return where;
    }
    async findAnyById(id) {
        const req = await this.prisma.requirement.findUnique({
            where: { id },
            include: {
                media: { orderBy: { orderIndex: 'asc' } },
                catalogCategory: { include: { specFields: { orderBy: { displayOrder: 'asc' } } } },
                buyer: { select: { id: true, fullName: true, phone: true, email: true, locationCity: true, locationState: true } },
                quotes: { include: { responder: { select: { id: true, fullName: true } }, listing: true }, orderBy: { createdAt: 'desc' } },
            },
        });
        if (!req) {
            throw new common_1.NotFoundException('Requirement not found');
        }
        return req;
    }
    async adminList(query) {
        const where = await this.buildPublicWhere(query);
        if (query.status)
            where.status = query.status;
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;
        const [items, total] = await this.prisma.$transaction([
            this.prisma.requirement.findMany({
                where,
                include: {
                    media: { where: { type: client_1.MediaType.PHOTO }, orderBy: [{ isPrimary: 'desc' }, { orderIndex: 'asc' }], take: 1 },
                    buyer: { select: { id: true, fullName: true, phone: true, email: true } },
                    _count: { select: { quotes: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.requirement.count({ where }),
        ]);
        return { items, total, page, pageSize };
    }
    async approve(id) {
        const req = await this.requirePendingReview(id);
        return this.prisma.requirement.update({
            where: { id: req.id },
            data: { status: client_1.RequirementStatus.ACTIVE, postedAt: req.postedAt ?? new Date() },
        });
    }
    async reject(id) {
        const req = await this.requirePendingReview(id);
        return this.prisma.requirement.update({ where: { id: req.id }, data: { status: client_1.RequirementStatus.REJECTED } });
    }
    async requirePendingReview(id) {
        const req = await this.prisma.requirement.findUnique({ where: { id } });
        if (!req) {
            throw new common_1.NotFoundException('Requirement not found');
        }
        if (req.status !== client_1.RequirementStatus.PENDING_REVIEW) {
            throw new common_1.BadRequestException(`Requirement is in ${req.status} status, not awaiting review`);
        }
        return req;
    }
    async submitQuote(responderId, requirementId, dto, photos) {
        const responder = await this.prisma.user.findUnique({ where: { id: responderId } });
        if (!responder?.canSell) {
            throw new common_1.ForbiddenException('Only GST-verified sellers can submit a quote');
        }
        const req = await this.prisma.requirement.findUnique({ where: { id: requirementId } });
        if (!req || req.status !== client_1.RequirementStatus.ACTIVE) {
            throw new common_1.NotFoundException('Requirement not found or no longer accepting quotes');
        }
        if (photos.length === 0) {
            throw new common_1.BadRequestException('At least one photo is required');
        }
        if (dto.listingId) {
            const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
            if (!listing || listing.sellerId !== responderId) {
                throw new common_1.ForbiddenException('You can only quote using your own listing');
            }
        }
        const uploaded = await Promise.all(photos.map((file) => this.storage.upload(file, storage_service_1.QUOTE_PHOTOS_DIR)));
        return this.prisma.quote.create({
            data: {
                requirementId,
                responderId,
                listingId: dto.listingId ?? null,
                contactName: dto.contactName,
                contactPhone: dto.contactPhone,
                contactEmail: dto.contactEmail ?? null,
                contactCompany: dto.contactCompany ?? null,
                catalogCategoryId: dto.catalogCategoryId ?? null,
                machineCategory: dto.machineCategory ?? null,
                machineMake: dto.machineMake ?? null,
                machineModel: dto.machineModel ?? null,
                manufactureYear: dto.manufactureYear ?? null,
                origin: dto.origin ?? null,
                importedCountry: dto.origin === 'IMPORTED' ? (dto.importedCountry ?? null) : null,
                condition: dto.condition ?? null,
                machineLocation: dto.machineLocation,
                price: new client_1.Prisma.Decimal(dto.price),
                description: dto.description ?? null,
                specs: dto.specs ?? client_1.Prisma.JsonNull,
                message: dto.message ?? null,
                status: client_1.QuoteStatus.PENDING_ADMIN,
                media: {
                    create: uploaded.map((file, i) => ({
                        type: client_1.MediaType.PHOTO,
                        storageKey: file.key,
                        url: file.url,
                        orderIndex: i,
                        isPrimary: i === 0,
                    })),
                },
            },
            include: { media: true },
        });
    }
    async findMyQuotesGiven(responderId) {
        return this.prisma.quote.findMany({
            where: { responderId },
            include: {
                requirement: { select: { id: true, title: true, machineCategory: true, status: true } },
                listing: { select: { id: true, title: true } },
                media: { orderBy: { orderIndex: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findApprovedQuotesForRequirement(buyerId, requirementId) {
        const req = await this.prisma.requirement.findUnique({ where: { id: requirementId } });
        if (!req || req.buyerId !== buyerId) {
            throw new common_1.NotFoundException('Requirement not found');
        }
        return this.prisma.quote.findMany({
            where: { requirementId, status: client_1.QuoteStatus.APPROVED },
            omit: { contactName: true, contactPhone: true, contactEmail: true, contactCompany: true },
            include: {
                responder: { select: { id: true, fullName: true } },
                listing: { include: { media: { where: { type: client_1.MediaType.PHOTO }, take: 1 } } },
                media: { orderBy: { orderIndex: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async adminListQuotes(status) {
        return this.prisma.quote.findMany({
            where: status ? { status } : undefined,
            include: {
                requirement: { select: { id: true, title: true, machineCategory: true, buyer: { select: { id: true, fullName: true } } } },
                responder: { select: { id: true, fullName: true, phone: true, email: true, gstStatus: true } },
                listing: { select: { id: true, title: true, askingPrice: true } },
                media: { orderBy: { orderIndex: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async approveQuote(id) {
        const quote = await this.requirePendingQuote(id);
        return this.prisma.quote.update({
            where: { id: quote.id },
            data: { status: client_1.QuoteStatus.APPROVED, adminReviewedAt: new Date() },
        });
    }
    async rejectQuote(id) {
        const quote = await this.requirePendingQuote(id);
        return this.prisma.quote.update({
            where: { id: quote.id },
            data: { status: client_1.QuoteStatus.REJECTED, adminReviewedAt: new Date() },
        });
    }
    async requirePendingQuote(id) {
        const quote = await this.prisma.quote.findUnique({ where: { id } });
        if (!quote) {
            throw new common_1.NotFoundException('Quote not found');
        }
        if (quote.status !== client_1.QuoteStatus.PENDING_ADMIN) {
            throw new common_1.BadRequestException(`Quote is already ${quote.status}`);
        }
        return quote;
    }
};
exports.RequirementsService = RequirementsService;
exports.RequirementsService = RequirementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], RequirementsService);
//# sourceMappingURL=requirements.service.js.map