import { DepreciationService } from './depreciation.service';
import { UpsertDepreciationEntryDto } from './dto/upsert-depreciation-entry.dto';
export declare class DepreciationController {
    private readonly depreciation;
    constructor(depreciation: DepreciationService);
    listAll(): Promise<{
        id: string;
        machineCategory: string;
        yearOffset: number;
        retainedValuePct: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    upsert(dto: UpsertDepreciationEntryDto): Promise<{
        id: string;
        machineCategory: string;
        yearOffset: number;
        retainedValuePct: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string): Promise<{
        removed: boolean;
    }>;
}
