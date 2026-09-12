import { Injectable, NotFoundException } from '@nestjs/common';
import { FinancePartner, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateFinancePartnerDto } from './dto/create-finance-partner.dto';
import type { UpdateFinancePartnerDto } from './dto/update-finance-partner.dto';

@Injectable()
export class FinancePartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(): Promise<FinancePartner[]> {
    return this.prisma.financePartner.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async listAll(): Promise<FinancePartner[]> {
    return this.prisma.financePartner.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<FinancePartner> {
    const partner = await this.prisma.financePartner.findUnique({
      where: { id },
    });
    if (!partner) {
      throw new NotFoundException('Finance partner not found');
    }
    return partner;
  }

  async create(dto: CreateFinancePartnerDto): Promise<FinancePartner> {
    return this.prisma.financePartner.create({
      data: {
        name: dto.name,
        type: dto.type,
        referralRate: new Prisma.Decimal(dto.referralRate),
        active: dto.active ?? true,
      },
    });
  }

  async update(
    id: string,
    dto: UpdateFinancePartnerDto,
  ): Promise<FinancePartner> {
    await this.findById(id);
    return this.prisma.financePartner.update({
      where: { id },
      data: {
        ...dto,
        referralRate:
          dto.referralRate !== undefined
            ? new Prisma.Decimal(dto.referralRate)
            : undefined,
      },
    });
  }
}
