import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StorageService, ADVERTISEMENT_IMAGES_DIR } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateAdvertisementDto, UpdateAdvertisementDto } from './dto/advertisement.dto';

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

  /** Public — active ads for the buyer listing grid interleave. */
  listActive() {
    return this.prisma.advertisement.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ position: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findById(id: string) {
    const ad = await this.prisma.advertisement.findFirst({ where: { id, deletedAt: null } });
    if (!ad) throw new NotFoundException('Advertisement not found');
    return ad;
  }

  async create(dto: CreateAdvertisementDto, file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('An image is required to create an advertisement');
    const uploaded = await this.storage.upload(file, ADVERTISEMENT_IMAGES_DIR);
    return this.prisma.advertisement.create({
      data: {
        title: dto.title,
        imageUrl: uploaded.url,
        linkUrl: dto.linkUrl ?? null,
        position: dto.position ?? 0,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateAdvertisementDto, file: Express.Multer.File | undefined) {
    await this.findById(id);
    const imageUrl = file ? (await this.storage.upload(file, ADVERTISEMENT_IMAGES_DIR)).url : undefined;
    return this.prisma.advertisement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.linkUrl !== undefined && { linkUrl: dto.linkUrl }),
        ...(dto.position !== undefined && { position: dto.position }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.advertisement.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async purge(id: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Advertisement not found');
    if (!ad.deletedAt) {
      throw new BadRequestException('Soft-delete this advertisement before permanently purging it.');
    }
    await this.prisma.advertisement.delete({ where: { id } });
    return ad;
  }
}
