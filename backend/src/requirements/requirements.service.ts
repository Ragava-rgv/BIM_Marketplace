import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ComplexityTier,
  MediaType,
  Prisma,
  Quote,
  QuoteStatus,
  Requirement,
  RequirementMedia,
  RequirementStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  QUOTE_PHOTOS_DIR,
  REQUIREMENT_PHOTOS_DIR,
  REQUIREMENT_VIDEOS_DIR,
  StorageService,
} from '../storage/storage.service';
import type { CreateRequirementDto } from './dto/create-requirement.dto';
import type { UpdateRequirementDto } from './dto/update-requirement.dto';
import type {
  AdminQueryRequirementsDto,
  QueryRequirementsDto,
} from './dto/query-requirements.dto';
import type { UploadRequirementMediaDto } from './dto/upload-requirement-media.dto';
import type { SubmitQuoteDto } from './dto/submit-quote.dto';

/** No approval gate: ACTIVE is the only "live" state a requirement can be edited/added-to from. */
const EDITABLE_STATUSES: RequirementStatus[] = [RequirementStatus.ACTIVE];
const MAX_REQUIREMENT_PHOTOS = 6;
/** Statuses a buyer's requirement stays visible under once it's gone live — mirrors
    Listing's ACTIVE/UNDER_OFFER/SOLD-style "still viewable after the fact" pattern. */
const PUBLIC_VISIBLE_STATUSES: RequirementStatus[] = [
  RequirementStatus.ACTIVE,
  RequirementStatus.FULFILLED,
];

@Injectable()
export class RequirementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  // -- Any logged-in user: create / manage own requirements ---------------------
  // No approval gate — a requirement is live (ACTIVE, publicly visible) the instant
  // it's posted. Admin keeps read/moderation access but doesn't act as a publish gate.

  async create(
    buyerId: string,
    dto: CreateRequirementDto,
  ): Promise<Requirement> {
    let validatedSpecs: Prisma.InputJsonValue | undefined;
    if (dto.catalogCategoryId && dto.specs) {
      // Spec values aren't validated against the template here (unlike listings) since a
      // requirement's specs describe a *preference*, not a claim about a physical machine —
      // partial/approximate values are expected and fine.
      validatedSpecs = dto.specs as Prisma.InputJsonValue;
    }

    return this.prisma.requirement.create({
      data: {
        buyerId,
        title: dto.title,
        description: dto.description,
        machineCategory: dto.machineCategory,
        machineSubcategory: dto.machineSubcategory ?? null,
        origin: dto.origin ?? null,
        importedCountry:
          dto.origin === 'IMPORTED' ? (dto.importedCountry ?? null) : null,
        manufactureYear: dto.manufactureYear ?? null,
        runningHours: dto.runningHours ?? null,
        condition: dto.condition ?? null,
        complexityTier:
          (dto.complexityTier as ComplexityTier) ?? ComplexityTier.STANDARD,
        catalogCategoryId: dto.catalogCategoryId ?? null,
        specs: validatedSpecs ?? Prisma.JsonNull,
        budgetMin:
          dto.budgetMin !== undefined
            ? new Prisma.Decimal(dto.budgetMin)
            : null,
        budgetMax:
          dto.budgetMax !== undefined
            ? new Prisma.Decimal(dto.budgetMax)
            : null,
        quantity: dto.quantity ?? 1,
        locationCity: dto.locationCity ?? null,
        locationState: dto.locationState ?? null,
        status: RequirementStatus.ACTIVE,
        postedAt: new Date(),
      },
    });
  }

  async findMine(
    buyerId: string,
  ): Promise<
    (Requirement & { media: RequirementMedia[]; quotes: { id: string }[] })[]
  > {
    return this.prisma.requirement.findMany({
      where: { buyerId },
      include: {
        media: { orderBy: { orderIndex: 'asc' } },
        // Buyer's own list only needs a count, so keep this to id — quote/responder
        // detail stays behind the findQuotesForRequirement path (contact still gated).
        quotes: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOwned(
    buyerId: string,
    id: string,
  ): Promise<Requirement & { media: RequirementMedia[] }> {
    const req = await this.prisma.requirement.findUnique({
      where: { id },
      include: { media: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!req || req.buyerId !== buyerId) {
      throw new NotFoundException('Requirement not found');
    }
    return req;
  }

  async update(
    buyerId: string,
    id: string,
    dto: UpdateRequirementDto,
  ): Promise<Requirement> {
    const req = await this.findOwned(buyerId, id);
    if (!EDITABLE_STATUSES.includes(req.status)) {
      throw new ForbiddenException(
        `Requirement cannot be edited while in ${req.status} status`,
      );
    }

    const {
      catalogCategoryId,
      specs,
      origin,
      importedCountry,
      budgetMin,
      budgetMax,
      ...rest
    } = dto;

    return this.prisma.requirement.update({
      where: { id },
      data: {
        ...rest,
        catalogCategoryId: catalogCategoryId ?? undefined,
        specs:
          specs !== undefined ? (specs as Prisma.InputJsonValue) : undefined,
        origin,
        importedCountry:
          origin === 'IMPORTED'
            ? importedCountry
            : origin === 'INDIAN'
              ? null
              : undefined,
        budgetMin:
          budgetMin !== undefined ? new Prisma.Decimal(budgetMin) : undefined,
        budgetMax:
          budgetMax !== undefined ? new Prisma.Decimal(budgetMax) : undefined,
      },
    });
  }

  async close(buyerId: string, id: string): Promise<Requirement> {
    const req = await this.findOwned(buyerId, id);
    if (req.status === RequirementStatus.CLOSED) {
      throw new BadRequestException('Requirement is already closed');
    }
    return this.prisma.requirement.update({
      where: { id },
      data: { status: RequirementStatus.CLOSED },
    });
  }

  async markFulfilled(buyerId: string, id: string): Promise<Requirement> {
    const req = await this.findOwned(buyerId, id);
    if (req.status !== RequirementStatus.ACTIVE) {
      throw new BadRequestException(
        `Requirement is in ${req.status} status, not ACTIVE`,
      );
    }
    return this.prisma.requirement.update({
      where: { id },
      data: { status: RequirementStatus.FULFILLED },
    });
  }

  // -- Buyer: media (illustrative, no strict gate) -----------------------------

  async addMedia(
    buyerId: string,
    id: string,
    dto: UploadRequirementMediaDto,
    file: Express.Multer.File,
  ): Promise<RequirementMedia> {
    const req = await this.findOwned(buyerId, id);
    if (!EDITABLE_STATUSES.includes(req.status)) {
      throw new ForbiddenException(
        `Media cannot be added while requirement is in ${req.status} status`,
      );
    }

    if (dto.type === MediaType.PHOTO) {
      const existingPhotoCount = await this.prisma.requirementMedia.count({
        where: { requirementId: id, type: MediaType.PHOTO },
      });
      if (existingPhotoCount >= MAX_REQUIREMENT_PHOTOS) {
        throw new BadRequestException(
          `A requirement may have at most ${MAX_REQUIREMENT_PHOTOS} photos`,
        );
      }
      const uploaded = await this.storage.upload(file, REQUIREMENT_PHOTOS_DIR);
      return this.prisma.requirementMedia.create({
        data: {
          requirementId: id,
          type: MediaType.PHOTO,
          storageKey: uploaded.key,
          url: uploaded.url,
          orderIndex: existingPhotoCount,
          isPrimary: existingPhotoCount === 0,
        },
      });
    }

    const uploaded = await this.storage.upload(file, REQUIREMENT_VIDEOS_DIR);
    return this.prisma.requirementMedia.create({
      data: {
        requirementId: id,
        type: MediaType.VIDEO,
        storageKey: uploaded.key,
        url: uploaded.url,
        durationSeconds: dto.durationSeconds ?? null,
        orderIndex: 0,
      },
    });
  }

  async removeMedia(
    buyerId: string,
    id: string,
    mediaId: string,
  ): Promise<void> {
    const req = await this.findOwned(buyerId, id);
    const media = req.media.find((m) => m.id === mediaId);
    if (!media) {
      throw new NotFoundException('Media not found on this requirement');
    }
    await this.prisma.requirementMedia.delete({ where: { id: mediaId } });
  }

  // -- Public browse ------------------------------------------------------------

  async browse(query: QueryRequirementsDto) {
    const where = await this.buildPublicWhere(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.requirement.findMany({
        where: { ...where, status: RequirementStatus.ACTIVE },
        include: {
          media: {
            where: { type: MediaType.PHOTO },
            orderBy: [{ isPrimary: 'desc' }, { orderIndex: 'asc' }],
            take: 1,
          },
          buyer: {
            select: {
              id: true,
              fullName: true,
              locationCity: true,
              locationState: true,
            },
          },
        },
        orderBy: { postedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.requirement.count({
        where: { ...where, status: RequirementStatus.ACTIVE },
      }),
    ]);

    return { items, total, page, pageSize };
  }

  async findPublicById(
    id: string,
  ): Promise<Requirement & { media: RequirementMedia[] }> {
    const req = await this.prisma.requirement.findFirst({
      where: { id, status: { in: PUBLIC_VISIBLE_STATUSES } },
      include: {
        media: { orderBy: { orderIndex: 'asc' } },
        catalogCategory: {
          include: { specFields: { orderBy: { displayOrder: 'asc' } } },
        },
      },
    });
    if (!req) {
      throw new NotFoundException('Requirement not found');
    }
    return req;
  }

  private async buildPublicWhere(
    query: QueryRequirementsDto,
  ): Promise<Prisma.RequirementWhereInput> {
    const where: Prisma.RequirementWhereInput = {};
    if (query.category)
      where.machineCategory = { equals: query.category, mode: 'insensitive' };
    if (query.subcategory)
      where.machineSubcategory = {
        equals: query.subcategory,
        mode: 'insensitive',
      };
    if (query.categorySlug) {
      const cat = await this.prisma.category.findUnique({
        where: { slug: query.categorySlug },
      });
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

  // -- Admin: requirement moderation --------------------------------------------

  async findAnyById(id: string) {
    const req = await this.prisma.requirement.findUnique({
      where: { id },
      include: {
        media: { orderBy: { orderIndex: 'asc' } },
        catalogCategory: {
          include: { specFields: { orderBy: { displayOrder: 'asc' } } },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            locationCity: true,
            locationState: true,
          },
        },
        quotes: {
          include: {
            responder: { select: { id: true, fullName: true } },
            listing: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!req) {
      throw new NotFoundException('Requirement not found');
    }
    return req;
  }

  async adminList(query: AdminQueryRequirementsDto) {
    const where = await this.buildPublicWhere(query);
    if (query.status) where.status = query.status;

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.requirement.findMany({
        where,
        include: {
          media: {
            where: { type: MediaType.PHOTO },
            orderBy: [{ isPrimary: 'desc' }, { orderIndex: 'asc' }],
            take: 1,
          },
          buyer: {
            select: { id: true, fullName: true, phone: true, email: true },
          },
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

  // -- Quotes --------------------------------------------------------------------

  /** Any GST-verified seller (canSell) may respond to a live requirement with a full quote —
      the same depth as a listing (category/spec-template, photos, origin), always entered
      fresh so admins and buyers have enough evidence to judge it. `listingId` remains
      accepted for a future "link an existing listing" shortcut but isn't required. No
      approval gate: the quote reaches the requirement owner immediately, with an in-app
      notification; admin keeps a read-only traceability record but never gates it. */
  async submitQuote(
    responderId: string,
    requirementId: string,
    dto: SubmitQuoteDto,
    photos: Express.Multer.File[],
  ): Promise<Quote> {
    const responder = await this.prisma.user.findUnique({
      where: { id: responderId },
    });
    if (!responder?.canSell) {
      throw new ForbiddenException(
        'Only GST-verified sellers can submit a quote',
      );
    }

    const req = await this.prisma.requirement.findUnique({
      where: { id: requirementId },
    });
    if (!req || req.status !== RequirementStatus.ACTIVE) {
      throw new NotFoundException(
        'Requirement not found or no longer accepting quotes',
      );
    }

    if (photos.length === 0) {
      throw new BadRequestException('At least one photo is required');
    }

    if (dto.listingId) {
      const listing = await this.prisma.listing.findUnique({
        where: { id: dto.listingId },
      });
      if (!listing || listing.sellerId !== responderId) {
        throw new ForbiddenException(
          'You can only quote using your own listing',
        );
      }
    }

    const uploaded = await Promise.all(
      photos.map((file) => this.storage.upload(file, QUOTE_PHOTOS_DIR)),
    );

    const quote = await this.prisma.quote.create({
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
        importedCountry:
          dto.origin === 'IMPORTED' ? (dto.importedCountry ?? null) : null,
        condition: dto.condition ?? null,
        machineLocation: dto.machineLocation,
        price: new Prisma.Decimal(dto.price),
        description: dto.description ?? null,
        specs: (dto.specs as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        message: dto.message ?? null,
        status: QuoteStatus.SUBMITTED,
        media: {
          create: uploaded.map((file, i) => ({
            type: MediaType.PHOTO,
            storageKey: file.key,
            url: file.url,
            orderIndex: i,
            isPrimary: i === 0,
          })),
        },
      },
      include: { media: true },
    });

    await this.notifications.notify(req.buyerId, {
      type: 'QUOTE_RECEIVED',
      title: 'You received a quote on your requirement',
      body: `${quote.machineCategory ?? req.machineCategory}${quote.machineMake ? ` — ${quote.machineMake} ${quote.machineModel ?? ''}`.trim() : ''}`,
      relatedId: quote.id,
    });

    return quote;
  }

  /** Quotes a seller has personally submitted, across all requirements. */
  async findMyQuotesGiven(responderId: string) {
    return this.prisma.quote.findMany({
      where: { responderId },
      include: {
        requirement: {
          select: {
            id: true,
            title: true,
            machineCategory: true,
            status: true,
          },
        },
        listing: { select: { id: true, title: true } },
        media: { orderBy: { orderIndex: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Every SUBMITTED quote on the buyer's own requirement — no approval gate, so this
      reaches the buyer the instant a responder submits (withdrawn quotes are excluded).
      Responder contact stays gated by the normal contact/commission flow, so only the
      responder's name is exposed here. `omit` on the Quote row itself is load-bearing:
      `include` alone still returns every other scalar column, which would otherwise leak
      the responder's self-submitted contactName/contactPhone/contactEmail/contactCompany
      straight to the buyer. */
  async findQuotesForRequirement(buyerId: string, requirementId: string) {
    const req = await this.prisma.requirement.findUnique({
      where: { id: requirementId },
    });
    if (!req || req.buyerId !== buyerId) {
      throw new NotFoundException('Requirement not found');
    }
    return this.prisma.quote.findMany({
      where: { requirementId, status: QuoteStatus.SUBMITTED },
      omit: {
        contactName: true,
        contactPhone: true,
        contactEmail: true,
        contactCompany: true,
      },
      include: {
        responder: { select: { id: true, fullName: true } },
        listing: {
          include: { media: { where: { type: MediaType.PHOTO }, take: 1 } },
        },
        media: { orderBy: { orderIndex: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** A responder may withdraw their own quote — the only status transition left now that
      there's no admin approval step. Withdrawn quotes drop out of the owner's view. */
  async withdrawQuote(responderId: string, id: string): Promise<Quote> {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote || quote.responderId !== responderId) {
      throw new NotFoundException('Quote not found');
    }
    if (quote.status === QuoteStatus.WITHDRAWN) {
      throw new BadRequestException('Quote is already withdrawn');
    }
    return this.prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.WITHDRAWN },
    });
  }

  // -- Admin: read-only traceability (no approval gate) ---------------------------

  /** Full record of every quote ever submitted, for audit / commission tracking —
      admin has read access here but nothing to approve or reject. */
  async adminListQuotes(status?: QuoteStatus) {
    return this.prisma.quote.findMany({
      where: status ? { status } : undefined,
      include: {
        requirement: {
          select: {
            id: true,
            title: true,
            machineCategory: true,
            buyer: { select: { id: true, fullName: true } },
          },
        },
        responder: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            gstStatus: true,
          },
        },
        listing: { select: { id: true, title: true, askingPrice: true } },
        media: { orderBy: { orderIndex: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
