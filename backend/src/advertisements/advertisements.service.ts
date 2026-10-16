import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdPlacement } from '@prisma/client';
import {
  StorageService,
  ADVERTISEMENT_IMAGES_DIR,
} from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateAdvertisementDto,
  UpdateAdvertisementDto,
} from './dto/advertisement.dto';

@Injectable()
export class AdvertisementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  listAll() {
    return this.prisma.advertisement.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** Public — active ads for a given placement (in-grid listing interleave or the home banner). */
  listActive(placement: AdPlacement = AdPlacement.IN_GRID) {
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

  async findById(id: string) {
    const ad = await this.prisma.advertisement.findFirst({
      where: { id, deletedAt: null },
    });
    if (!ad) throw new NotFoundException('Advertisement not found');
    return ad;
  }

  async create(
    dto: CreateAdvertisementDto,
    file: Express.Multer.File | undefined,
  ) {
    if (!file)
      throw new BadRequestException(
        'An image is required to create an advertisement',
      );
    const uploaded = await this.storage.upload(file, ADVERTISEMENT_IMAGES_DIR);
    return this.prisma.advertisement.create({
      data: {
        title: dto.title,
        imageUrl: uploaded.url,
        linkUrl: dto.linkUrl ?? null,
        position: dto.position ?? 0,
        placement: dto.placement ?? AdPlacement.IN_GRID,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateAdvertisementDto,
    file: Express.Multer.File | undefined,
  ) {
    await this.findById(id);
    const imageUrl = file
      ? (await this.storage.upload(file, ADVERTISEMENT_IMAGES_DIR)).url
      : undefined;
    return this.prisma.advertisement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl }),
        ...(dto.position !== undefined && { position: dto.position }),
        ...(dto.placement !== undefined && { placement: dto.placement }),
        ...(dto.startsAt !== undefined && {
          startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        }),
        ...(dto.endsAt !== undefined && {
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.advertisement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async purge(id: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement not found');
    if (!ad.deletedAt) {
      throw new BadRequestException(
        'Soft-delete this advertisement before permanently purging it.',
      );
    }
    await this.prisma.advertisement.delete({ where: { id } });
    return ad;
  }
}
