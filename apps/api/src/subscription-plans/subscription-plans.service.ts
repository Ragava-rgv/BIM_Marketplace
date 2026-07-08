import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Injectable()
export class SubscriptionPlansService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.subscriptionPlanConfig.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  listActive() {
    return this.prisma.subscriptionPlanConfig.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string) {
    const plan = await this.prisma.subscriptionPlanConfig.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return plan;
  }

  async create(dto: CreatePlanDto) {
    const existing = await this.prisma.subscriptionPlanConfig.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new BadRequestException(`A plan named "${dto.name}" already exists`);

    return this.prisma.subscriptionPlanConfig.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        listingQuota: dto.listingQuota,
        priceInr: new Prisma.Decimal(dto.priceInr),
        durationDays: dto.durationDays ?? 30,
        description: dto.description ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        isFree: dto.isFree ?? false,
      },
    });
  }

  async update(id: string, dto: UpdatePlanDto) {
    await this.findById(id);

    if (dto.name) {
      const conflict = await this.prisma.subscriptionPlanConfig.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (conflict) throw new BadRequestException(`A plan named "${dto.name}" already exists`);
    }

    return this.prisma.subscriptionPlanConfig.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.listingQuota !== undefined && { listingQuota: dto.listingQuota }),
        ...(dto.priceInr !== undefined && { priceInr: new Prisma.Decimal(dto.priceInr) }),
        ...(dto.durationDays !== undefined && { durationDays: dto.durationDays }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.isFree !== undefined && { isFree: dto.isFree }),
      },
    });
  }

  async remove(id: string) {
    const plan = await this.findById(id);
    // Check if any active subscription uses this plan
    const inUse = await this.prisma.sellerSubscription.count({
      where: { planConfigId: id, status: 'ACTIVE' },
    });
    if (inUse > 0) {
      throw new BadRequestException(
        `Cannot delete a plan that has ${inUse} active subscription(s). Deactivate it instead.`,
      );
    }
    await this.prisma.subscriptionPlanConfig.delete({ where: { id } });
    return plan;
  }
}
