import { Injectable } from '@nestjs/common';
import { DepreciationSchedule, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UpsertDepreciationEntryDto } from './dto/upsert-depreciation-entry.dto';

@Injectable()
export class DepreciationService {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(): Promise<DepreciationSchedule[]> {
    return this.prisma.depreciationSchedule.findMany({
      orderBy: [{ machineCategory: 'asc' }, { yearOffset: 'asc' }],
    });
  }

  /** Admin manages the published depreciation curve that backs the buyback programme (§5, §6.8). */
  async upsert(dto: UpsertDepreciationEntryDto): Promise<DepreciationSchedule> {
    return this.prisma.depreciationSchedule.upsert({
      where: {
        machineCategory_yearOffset: { machineCategory: dto.machineCategory, yearOffset: dto.yearOffset },
      },
      update: { retainedValuePct: new Prisma.Decimal(dto.retainedValuePct) },
      create: {
        machineCategory: dto.machineCategory,
        yearOffset: dto.yearOffset,
        retainedValuePct: new Prisma.Decimal(dto.retainedValuePct),
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.depreciationSchedule.delete({ where: { id } });
  }
}
