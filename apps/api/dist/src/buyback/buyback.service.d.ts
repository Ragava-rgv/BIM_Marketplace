import { BuybackOffer, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { QuoteBuybackDto } from './dto/quote-buyback.dto';
import type { UpdateBuybackAgreementDto } from './dto/update-buyback-agreement.dto';
export declare class BuybackService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    quote(dto: QuoteBuybackDto): Promise<BuybackOffer>;
    private fallbackRetainedPct;
    initiateFromLoanApplication(loanApplicationId: string): Promise<BuybackOffer>;
    updateAgreement(id: string, dto: UpdateBuybackAgreementDto): Promise<BuybackOffer>;
    findById(id: string): Promise<BuybackOffer>;
    accept(id: string, user: {
        id: string;
        role: UserRole;
    }): Promise<BuybackOffer>;
    listAll(): Promise<({
        listing: {
            id: string;
            machineCategory: string;
            locationCity: string;
            locationState: string;
            sellerId: string;
            title: string;
            machineMake: string;
            machineModel: string;
            manufactureYear: number | null;
        } | null;
    } & {
        id: string;
        depreciationSchedule: Prisma.JsonValue | null;
        createdAt: Date;
        status: import("@prisma/client").$Enums.BuybackStatus;
        listingId: string | null;
        loanApplicationId: string | null;
        machineReference: string | null;
        originalPrice: Prisma.Decimal;
        machineAgeYears: number;
        certifiedValue: Prisma.Decimal | null;
        depreciatedValue: Prisma.Decimal;
        offerAmount: Prisma.Decimal;
        agreementTerms: Prisma.JsonValue | null;
    })[]>;
    listForBuyer(buyerId: string): Promise<({
        listing: {
            id: string;
            machineCategory: string;
            locationCity: string;
            locationState: string;
            sellerId: string;
            title: string;
            machineMake: string;
            machineModel: string;
            manufactureYear: number | null;
        } | null;
    } & {
        id: string;
        depreciationSchedule: Prisma.JsonValue | null;
        createdAt: Date;
        status: import("@prisma/client").$Enums.BuybackStatus;
        listingId: string | null;
        loanApplicationId: string | null;
        machineReference: string | null;
        originalPrice: Prisma.Decimal;
        machineAgeYears: number;
        certifiedValue: Prisma.Decimal | null;
        depreciatedValue: Prisma.Decimal;
        offerAmount: Prisma.Decimal;
        agreementTerms: Prisma.JsonValue | null;
    })[]>;
    complete(id: string): Promise<BuybackOffer>;
}
