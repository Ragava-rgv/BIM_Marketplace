import { FinancePartner } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateFinancePartnerDto } from './dto/create-finance-partner.dto';
import type { UpdateFinancePartnerDto } from './dto/update-finance-partner.dto';
export declare class FinancePartnersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listActive(): Promise<FinancePartner[]>;
    listAll(): Promise<FinancePartner[]>;
    findById(id: string): Promise<FinancePartner>;
    create(dto: CreateFinancePartnerDto): Promise<FinancePartner>;
    update(id: string, dto: UpdateFinancePartnerDto): Promise<FinancePartner>;
}
