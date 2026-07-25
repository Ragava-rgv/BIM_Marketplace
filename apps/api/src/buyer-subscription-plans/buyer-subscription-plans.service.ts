import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBuyerPlanDto, UpdateBuyerPlanDto } from './dto/plan.dto';

@Injectable()
export class BuyerSubscriptionPlansService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.buyerSubscriptionPlan.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  listActive() {
    return this.prisma.buyerSubscriptionPlan.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string) {
    const plan = await this.prisma.buyerSubscriptionPlan.findFirst({
      where: { id, deletedAt: null },
    });
    if (!plan) throw new NotFoundException('Buyer subscription plan not found');
    return plan;
  }

  async create(dto: CreateBuyerPlanDto) {
    const existing = await this.prisma.buyerSubscriptionPlan.findUnique({
      where: { name: dto.name },
    });
    if (existing && !existing.deletedAt) {
      throw new BadRequestException(`A plan named "${dto.name}" already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.buyerSubscriptionPlan.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.buyerSubscriptionPlan.create({
        data: {
          name: dto.name,
          displayName: dto.displayName,
          contactViewQuota: dto.contactViewQuota,
          priceInr: new Prisma.Decimal(dto.priceInr),
          durationDays: dto.durationDays ?? null,
          description: dto.description ?? null,
          sortOrder: dto.sortOrder ?? 0,
          isActive: dto.isActive ?? true,
          isFree: dto.isFree ?? false,
          isDefault: dto.isDefault ?? false,
        },
      });
    });
  }

  async update(id: string, dto: UpdateBuyerPlanDto) {
    const plan = await this.findById(id);

    if (dto.name) {
      const conflict = await this.prisma.buyerSubscriptionPlan.findFirst({
        where: { name: dto.name, deletedAt: null, NOT: { id } },
      });
      if (conflict) throw new BadRequestException(`A plan named "${dto.name}" already exists`);
    }

    // Guard against leaving zero default plans.
    if (plan.isDefault && (dto.isDefault === false || dto.isActive === false)) {
      throw new ConflictException(
        'Cannot remove default status or deactivate the default plan. Promote another plan to default first.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await tx.buyerSubscriptionPlan.updateMany({
          where: { isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }
      return tx.buyerSubscriptionPlan.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.displayName !== undefined && { displayName: dto.displayName }),
          ...(dto.contactViewQuota !== undefined && { contactViewQuota: dto.contactViewQuota }),
          ...(dto.priceInr !== undefined && { priceInr: new Prisma.Decimal(dto.priceInr) }),
          ...(dto.durationDays !== undefined && { durationDays: dto.durationDays ?? null }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(dto.isFree !== undefined && { isFree: dto.isFree }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
      });
    });
  }

  /** Soft delete — the default remove action, mirrors the project's usual dependent-row guard. */
  async remove(id: string) {
    const plan = await this.findById(id);
    if (plan.isDefault) {
      throw new ConflictException(
        'Cannot delete the default plan. Promote another plan to default first.',
      );
    }
    const inUse = await this.prisma.buyerSubscription.count({
      where: { planId: id, status: 'ACTIVE', deletedAt: null },
    });
    if (inUse > 0) {
      throw new BadRequestException(
        `Cannot delete a plan that has ${inUse} active subscription(s). Deactivate it instead.`,
      );
    }
    return this.prisma.buyerSubscriptionPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Hard delete — only permitted once the plan is already soft-deleted and has no dependents. */
  async purge(id: string) {
    const plan = await this.prisma.buyerSubscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Buyer subscription plan not found');
    if (!plan.deletedAt) {
      throw new BadRequestException('Soft-delete this plan before permanently purging it.');
    }
    const dependents = await this.prisma.buyerSubscription.count({ where: { planId: id } });
    if (dependents > 0) {
      throw new BadRequestException(
        `Cannot purge a plan with ${dependents} subscription record(s) still referencing it.`,
      );
    }
    await this.prisma.buyerSubscriptionPlan.delete({ where: { id } });
    return plan;
  }
}
