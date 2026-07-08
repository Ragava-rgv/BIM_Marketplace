import { DepreciationSchedule } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UpsertDepreciationEntryDto } from './dto/upsert-depreciation-entry.dto';
export declare class DepreciationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listAll(): Promise<DepreciationSchedule[]>;
    upsert(dto: UpsertDepreciationEntryDto): Promise<DepreciationSchedule>;
    remove(id: string): Promise<void>;
}
