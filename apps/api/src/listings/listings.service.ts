import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComplexityTier,
  GstStatus,
  Listing,
  ListingMedia,
  ListingStatus,
  MediaType,
  Prisma,
} from '@prisma/client';
import {
  MAX_LISTING_PHOTOS,
  MIN_LISTING_PHOTOS,
  MIN_VIDEO_DURATION_SECONDS,
  PHOTO_MAX_AGE_DAYS,
} from '@machinebazaar/shared';
import { PrismaService } from '../prisma/prisma.service';
import { LISTING_PHOTOS_DIR, LISTING_VIDEOS_DIR, StorageService } from '../storage/storage.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SpecValidationService } from '../spec-validation/spec-validation.service';
import type { CreateListingDto } from './dto/create-listing.dto';
import type { UpdateListingDto } from './dto/update-listing.dto';
import type { QueryListingsDto, AdminQueryListingsDto } from './dto/query-listings.dto';
import type { UploadMediaDto } from './dto/upload-media.dto';

const EDITABLE_STATUSES: ListingStatus[] = [ListingStatus.DRAFT, ListingStatus.REJECTED];
// Media can be refreshed on live listings without re-triggering a full review
const MEDIA_UPDATABLE_STATUSES: ListingStatus[] = [
  ListingStatus.DRAFT,
  ListingStatus.REJECTED,
  ListingStatus.ACTIVE,
];

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly subscriptions: SubscriptionsService,
    private readonly specValidation: SpecValidationService,
  ) {}

  // -- Seller: create / manage own listings ---------------------------------

  async create(sellerId: string, dto: CreateListingDto): Promise<Listing> {
    const seller = await this.prisma.user.findUnique({ where: { id: sellerId } });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    // Business rule: sellers must have an ACTIVE GST before any listing can be created (§8.1)
    if (seller.gstStatus !== GstStatus.ACTIVE) {
      throw new ForbiddenException('Your GST must be verified and ACTIVE before you can create a listing');
    }

    // Subscription quota gate
    await this.subscriptions.enforceQuota(sellerId);

    // Dynamic spec validation (only when a catalog category is supplied)
    let validatedSpecs: Record<string, unknown> | undefined;
    if (dto.catalogCategoryId) {
      const cat = await this.prisma.category.findUnique({
        where: { id: dto.catalogCategoryId },
        include: { specFields: { orderBy: { displayOrder: 'asc' } } },
      });
      if (!cat) throw new NotFoundException('Catalog category not found');
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
        manufactureYear: dto.manufactureYear,
        askingPrice: new Prisma.Decimal(dto.askingPrice),
        locationCity: dto.locationCity,
        locationState: dto.locationState,
        complexityTier: (dto.complexityTier as ComplexityTier) ?? ComplexityTier.STANDARD,
        catalogCategoryId: dto.catalogCategoryId ?? null,
        specs: validatedSpecs ? (validatedSpecs as Prisma.InputJsonValue) : Prisma.JsonNull,
        conditionGrade: dto.conditionGrade ?? null,
        runningHours: dto.runningHours ?? null,
        serialNumber: dto.serialNumber ?? null,
        negotiable: dto.negotiable ?? false,
        status: ListingStatus.DRAFT,
      },
    });
  }

  async findMine(sellerId: string): Promise<Listing[]> {
    return this.prisma.listing.findMany({
      where: { sellerId },
      include: { media: { orderBy: { orderIndex: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOwned(sellerId: string, listingId: string): Promise<Listing & { media: ListingMedia[] }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { media: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!listing || listing.sellerId !== sellerId) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  async update(sellerId: string, listingId: string, dto: UpdateListingDto): Promise<Listing> {
    const listing = await this.findOwned(sellerId, listingId);
    if (!EDITABLE_STATUSES.includes(listing.status)) {
      throw new ForbiddenException(`Listing cannot be edited while in ${listing.status} status`);
    }

    const {
      askingPrice,
      complexityTier,
      catalogCategoryId,
      specs,
      ...rest
    } = dto as typeof dto & { catalogCategoryId?: string; specs?: Record<string, unknown> };

    return this.prisma.listing.update({
      where: { id: listingId },
      data: {
        ...rest,
        askingPrice: askingPrice !== undefined ? new Prisma.Decimal(askingPrice) : undefined,
        complexityTier: complexityTier as ComplexityTier | undefined,
        catalogCategoryId: catalogCategoryId ?? undefined,
        specs: specs !== undefined ? (specs as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async withdraw(sellerId: string, listingId: string): Promise<Listing> {
    const listing = await this.findOwned(sellerId, listingId);
    if (listing.status === ListingStatus.SOLD) {
      throw new ForbiddenException('A sold listing cannot be withdrawn');
    }
    return this.prisma.listing.update({
      where: { id: listingId },
      data: { status: ListingStatus.WITHDRAWN },
    });
  }

  // -- Media upload + the media gate (§6.3 / §8.3) ---------------------------

  async addMedia(
    sellerId: string,
    listingId: string,
    dto: UploadMediaDto,
    file: Express.Multer.File,
  ): Promise<ListingMedia> {
    const listing = await this.findOwned(sellerId, listingId);
    if (!MEDIA_UPDATABLE_STATUSES.includes(listing.status)) {
      throw new ForbiddenException(`Media cannot be added while listing is in ${listing.status} status`);
    }

    if (dto.type === MediaType.PHOTO) {
      return this.addPhoto(listing, dto, file);
    }
    return this.addVideo(listing, dto, file);
  }

  private async addPhoto(listing: Listing, dto: UploadMediaDto, file: Express.Multer.File): Promise<ListingMedia> {
    if (!dto.capturedAt) {
      throw new BadRequestException('capturedAt is required for photos (parsed from the timestamp overlay/metadata)');
    }
    const capturedAt = new Date(dto.capturedAt);
    this.assertPhotoIsRecent(capturedAt);

    const existingPhotoCount = await this.prisma.listingMedia.count({
      where: { listingId: listing.id, type: MediaType.PHOTO },
    });
    if (existingPhotoCount >= MAX_LISTING_PHOTOS) {
      throw new BadRequestException(`A listing may have at most ${MAX_LISTING_PHOTOS} photos`);
    }

    const uploaded = await this.storage.upload(file, LISTING_PHOTOS_DIR);
    return this.prisma.listingMedia.create({
      data: {
        listingId: listing.id,
        type: MediaType.PHOTO,
        storageKey: uploaded.key,
        url: uploaded.url,
        capturedAt,
        orderIndex: existingPhotoCount,
      },
    });
  }

  private async addVideo(listing: Listing, dto: UploadMediaDto, file: Express.Multer.File): Promise<ListingMedia> {
    if (!dto.durationSeconds) {
      throw new BadRequestException('durationSeconds is required for the running video');
    }
    if (dto.durationSeconds < MIN_VIDEO_DURATION_SECONDS) {
      throw new BadRequestException(
        `The running video must be at least ${MIN_VIDEO_DURATION_SECONDS} seconds, showing the machine actively operating with a timestamp overlay`,
      );
    }

    const existingVideo = await this.prisma.listingMedia.findFirst({
      where: { listingId: listing.id, type: MediaType.VIDEO },
    });
    if (existingVideo) {
      throw new BadRequestException(
        'Only one running video is allowed per listing — remove the existing one before uploading a replacement',
      );
    }

    const uploaded = await this.storage.upload(file, LISTING_VIDEOS_DIR);
    return this.prisma.listingMedia.create({
      data: {
        listingId: listing.id,
        type: MediaType.VIDEO,
        storageKey: uploaded.key,
        url: uploaded.url,
        capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : null,
        durationSeconds: dto.durationSeconds,
        orderIndex: 0,
      },
    });
  }

  async removeMedia(sellerId: string, listingId: string, mediaId: string): Promise<void> {
    const listing = await this.findOwned(sellerId, listingId);
    if (!MEDIA_UPDATABLE_STATUSES.includes(listing.status)) {
      throw new ForbiddenException(`Media cannot be removed while listing is in ${listing.status} status`);
    }
    const media = listing.media.find((m) => m.id === mediaId);
    if (!media) {
      throw new NotFoundException('Media item not found on this listing');
    }
    await this.prisma.listingMedia.delete({ where: { id: mediaId } });
  }

  private assertPhotoIsRecent(capturedAt: Date): void {
    if (Number.isNaN(capturedAt.getTime())) {
      throw new BadRequestException('capturedAt must be a valid date parsed from the photo timestamp');
    }
    const ageMs = Date.now() - capturedAt.getTime();
    const maxAgeMs = PHOTO_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    if (ageMs < 0 || ageMs > maxAgeMs) {
      throw new BadRequestException(
        `Every photo must be timestamped and captured within the last ${PHOTO_MAX_AGE_DAYS} days. ` +
          'Use the Timestamp Camera app to capture compliant photos.',
      );
    }
  }

  // -- Submit for admin review (validates the full media gate) ---------------

  async submitForReview(sellerId: string, listingId: string): Promise<Listing> {
    const listing = await this.findOwned(sellerId, listingId);
    if (!EDITABLE_STATUSES.includes(listing.status)) {
      throw new ForbiddenException(`Listing is already in ${listing.status} status`);
    }

    this.assertMediaGate(listing.media);

    return this.prisma.listing.update({
      where: { id: listingId },
      data: { status: ListingStatus.PENDING_REVIEW },
    });
  }

  /**
   * Server-side enforcement of the listing media gate (project_spec.md §8.3):
   * 5–10 timestamped photos (each captured within 30 days) PLUS exactly one
   * running video ≥60s showing the machine operating with a timestamp overlay.
   * Reject (throw) the listing if any condition fails.
   */
  private assertMediaGate(media: ListingMedia[]): void {
    const photos = media.filter((m) => m.type === MediaType.PHOTO);
    const videos = media.filter((m) => m.type === MediaType.VIDEO);

    if (photos.length < MIN_LISTING_PHOTOS || photos.length > MAX_LISTING_PHOTOS) {
      throw new BadRequestException(
        `Listing requires between ${MIN_LISTING_PHOTOS} and ${MAX_LISTING_PHOTOS} photos (found ${photos.length})`,
      );
    }

    for (const photo of photos) {
      if (!photo.capturedAt) {
        throw new BadRequestException('Every photo must carry a captured-at timestamp');
      }
      this.assertPhotoIsRecent(photo.capturedAt);
    }

    if (videos.length !== 1) {
      throw new BadRequestException('Listing requires exactly one running video showing the machine operating');
    }
    const [video] = videos;
    if (!video.durationSeconds || video.durationSeconds < MIN_VIDEO_DURATION_SECONDS) {
      throw new BadRequestException(
        `The running video must be at least ${MIN_VIDEO_DURATION_SECONDS} seconds with a timestamp overlay`,
      );
    }
  }

  // -- Admin review queue (§6.3 "PENDING_REVIEW -> admin approves to ACTIVE") --

  async approve(listingId: string): Promise<Listing> {
    const listing = await this.requirePendingReview(listingId);
    return this.prisma.listing.update({ where: { id: listing.id }, data: { status: ListingStatus.ACTIVE } });
  }

  async reject(listingId: string): Promise<Listing> {
    const listing = await this.requirePendingReview(listingId);
    return this.prisma.listing.update({ where: { id: listing.id }, data: { status: ListingStatus.REJECTED } });
  }

  private async requirePendingReview(listingId: string): Promise<Listing> {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.status !== ListingStatus.PENDING_REVIEW) {
      throw new BadRequestException(`Listing is in ${listing.status} status, not awaiting review`);
    }
    return listing;
  }

  // -- Public browse ----------------------------------------------------------

  async browse(query: QueryListingsDto) {
    const where = await this.buildPublicWhere(query);
    return this.paginate({ ...where, status: ListingStatus.ACTIVE }, query);
  }

  async findPublicById(listingId: string): Promise<Listing & { media: ListingMedia[] }> {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, status: { in: [ListingStatus.ACTIVE, ListingStatus.UNDER_OFFER, ListingStatus.SOLD] } },
      include: { media: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  // -- Admin queue -------------------------------------------------------------

  async findAnyById(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        media: { orderBy: { orderIndex: 'asc' } },
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
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  async adminList(query: AdminQueryListingsDto) {
    const where = await this.buildPublicWhere(query);
    if (query.status) {
      (where as Prisma.ListingWhereInput).status = query.status;
    }
    return this.paginate(where, query);
  }

  private async buildPublicWhere(query: QueryListingsDto): Promise<Prisma.ListingWhereInput> {
    const where: Prisma.ListingWhereInput = {};
    if (query.category) where.machineCategory = { equals: query.category, mode: 'insensitive' };
    if (query.subcategory) where.machineSubcategory = { equals: query.subcategory, mode: 'insensitive' };

    if (query.categorySlug) {
      const cat = await this.prisma.category.findUnique({ where: { slug: query.categorySlug } });
      if (cat) where.machineCategory = { equals: cat.name, mode: 'insensitive' };
    }
    if (query.subcategorySlug) {
      const sub = await this.prisma.subcategory.findFirst({ where: { slug: query.subcategorySlug } });
      if (sub) where.machineSubcategory = { equals: sub.name, mode: 'insensitive' };
    }
    if (query.make) where.machineMake = { equals: query.make, mode: 'insensitive' };
    if (query.city) where.locationCity = { equals: query.city, mode: 'insensitive' };
    if (query.state) where.locationState = { equals: query.state, mode: 'insensitive' };
    if (query.yearMin || query.yearMax) {
      where.manufactureYear = {
        ...(query.yearMin ? { gte: query.yearMin } : {}),
        ...(query.yearMax ? { lte: query.yearMax } : {}),
      };
    }
    if (query.priceMin || query.priceMax) {
      where.askingPrice = {
        ...(query.priceMin ? { gte: new Prisma.Decimal(query.priceMin) } : {}),
        ...(query.priceMax ? { lte: new Prisma.Decimal(query.priceMax) } : {}),
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

  private async paginate(where: Prisma.ListingWhereInput, query: QueryListingsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        include: { media: { orderBy: { orderIndex: 'asc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
