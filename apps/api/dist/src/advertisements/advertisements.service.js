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
exports.AdvertisementsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const storage_service_1 = require("../storage/storage.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AdvertisementsService = class AdvertisementsService {
    prisma;
    storage;
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    listAll() {
        return this.prisma.advertisement.findMany({
            where: { deletedAt: null },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
    }
    listActive(placement = client_1.AdPlacement.IN_GRID) {
        const now = new Date();
        return this.prisma.advertisement.findMany({
            where: {
                isActive: true,
                deletedAt: null,
                placement,
                AND: [
                    { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
                    { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
                ],
            },
            orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
        });
    }
    async findById(id) {
        const ad = await this.prisma.advertisement.findFirst({ where: { id, deletedAt: null } });
        if (!ad)
            throw new common_1.NotFoundException('Advertisement not found');
        return ad;
    }
    async create(dto, file) {
        if (!file)
            throw new common_1.BadRequestException('An image is required to create an advertisement');
        const uploaded = await this.storage.upload(file, storage_service_1.ADVERTISEMENT_IMAGES_DIR);
        return this.prisma.advertisement.create({
            data: {
                title: dto.title,
                imageUrl: uploaded.url,
                linkUrl: dto.linkUrl ?? null,
                position: dto.position ?? 0,
                placement: dto.placement ?? client_1.AdPlacement.IN_GRID,
                startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
                endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
                sortOrder: dto.sortOrder ?? 0,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async update(id, dto, file) {
        await this.findById(id);
        const imageUrl = file ? (await this.storage.upload(file, storage_service_1.ADVERTISEMENT_IMAGES_DIR)).url : undefined;
        return this.prisma.advertisement.update({
            where: { id },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl }),
                ...(dto.position !== undefined && { position: dto.position }),
                ...(dto.placement !== undefined && { placement: dto.placement }),
                ...(dto.startsAt !== undefined && { startsAt: dto.startsAt ? new Date(dto.startsAt) : null }),
                ...(dto.endsAt !== undefined && { endsAt: dto.endsAt ? new Date(dto.endsAt) : null }),
                ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(imageUrl !== undefined && { imageUrl }),
            },
        });
    }
    async remove(id) {
        await this.findById(id);
        return this.prisma.advertisement.update({ where: { id }, data: { deletedAt: new Date() } });
    }
    async purge(id) {
        const ad = await this.prisma.advertisement.findUnique({ where: { id } });
        if (!ad)
            throw new common_1.NotFoundException('Advertisement not found');
        if (!ad.deletedAt) {
            throw new common_1.BadRequestException('Soft-delete this advertisement before permanently purging it.');
        }
        await this.prisma.advertisement.delete({ where: { id } });
        return ad;
    }
};
exports.AdvertisementsService = AdvertisementsService;
exports.AdvertisementsService = AdvertisementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], AdvertisementsService);
//# sourceMappingURL=advertisements.service.js.map