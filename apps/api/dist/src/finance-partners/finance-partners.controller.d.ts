import { FinancePartnersService } from './finance-partners.service';
import { CreateFinancePartnerDto } from './dto/create-finance-partner.dto';
import { UpdateFinancePartnerDto } from './dto/update-finance-partner.dto';
export declare class FinancePartnersController {
    private readonly partners;
    constructor(partners: FinancePartnersService);
    listActive(): Promise<{
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.FinancePartnerType;
        referralRate: import("@prisma/client/runtime/library").Decimal;
        active: boolean;
    }[]>;
    listAll(): Promise<{
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.FinancePartnerType;
        referralRate: import("@prisma/client/runtime/library").Decimal;
        active: boolean;
    }[]>;
    create(dto: CreateFinancePartnerDto): Promise<{
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.FinancePartnerType;
        referralRate: import("@prisma/client/runtime/library").Decimal;
        active: boolean;
    }>;
    update(id: string, dto: UpdateFinancePartnerDto): Promise<{
        id: string;
        name: string;
        type: import("@prisma/client").$Enums.FinancePartnerType;
        referralRate: import("@prisma/client/runtime/library").Decimal;
        active: boolean;
    }>;
}
