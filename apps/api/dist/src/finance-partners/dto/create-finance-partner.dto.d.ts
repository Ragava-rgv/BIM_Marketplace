import { FinancePartnerType } from '@prisma/client';
export declare class CreateFinancePartnerDto {
    name: string;
    type: FinancePartnerType;
    referralRate: number;
    active?: boolean;
}
