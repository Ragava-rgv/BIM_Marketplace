import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBoostPlanDto, UpdateBoostPlanDto } from './dto/plan.dto';

@Injectable()
export class BoostPlansService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.promotionPlan.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  listActive() {
    return this.prisma.promotionPlan.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string) {
    const plan = await this.prisma.promotionPlan.findFirst({
      where: { id, deletedAt: null },
    });
    if (!plan) throw new NotFoundException('Boost plan not found');
    return plan;
  }

  async create(dto: CreateBoostPlanDto) {
    const existing = await this.prisma.promotionPlan.findUnique({
      where: { name: dto.name },
    });
    if (existing && !existing.deletedAt) {
      throw new BadRequestException(
        `A boost plan named "${dto.name}" already exists`,
      );
    }
    return this.prisma.promotionPlan.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        priceInr: new Prisma.Decimal(dto.priceInr),
        durationDays: dto.durationDays,
        sortWeight: dto.sortWeight ?? 0,
        description: dto.description ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateBoostPlanDto) {
    await this.findById(id);
    if (dto.name) {
      const conflict = await this.prisma.promotionPlan.findFirst({
        where: { name: dto.name, deletedAt: null, NOT: { id } },
      });
      if (conflict)
        throw new BadRequestException(
          `A boost plan named "${dto.name}" already exists`,
        );
    }
    return this.prisma.promotionPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.priceInr !== undefined && {
          priceInr: new Prisma.Decimal(dto.priceInr),
        }),
        ...(dto.durationDays !== undefined && {
          durationDays: dto.durationDays,
        }),
        ...(dto.sortWeight !== undefined && { sortWeight: dto.sortWeight }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  /** Soft delete — blocked while any purchase record still references this plan (audit trail). */
  async remove(id: string) {
    await this.findById(id);
    const inUse = await this.prisma.listingBoost.count({
      where: { planId: id },
    });
    if (inUse > 0) {
      throw new BadRequestException(
        `Cannot delete a plan with ${inUse} boost purchase(s) on record. Deactivate it instead.`,
      );
    }
    return this.prisma.promotionPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Hard delete — only permitted once the plan is already soft-deleted and has no dependents. */
  async purge(id: string) {
    const plan = await this.prisma.promotionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Boost plan not found');
    if (!plan.deletedAt) {
      throw new BadRequestException(
        'Soft-delete this plan before permanently purging it.',
      );
    }
    const dependents = await this.prisma.listingBoost.count({
      where: { planId: id },
    });
    if (dependents > 0) {
      throw new BadRequestException(
        `Cannot purge a plan with ${dependents} boost record(s) still referencing it.`,
      );
    }
    await this.prisma.promotionPlan.delete({ where: { id } });
    return plan;
  }
}
