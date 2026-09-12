import { LoanApplication, LoanApplicationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CertificationsService } from '../certifications/certifications.service';
import type { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
export declare class LoansService {
    private readonly prisma;
    private readonly certifications;
    constructor(prisma: PrismaService, certifications: CertificationsService);
    create(buyerId: string, dto: CreateLoanApplicationDto): Promise<LoanApplication>;
    listMine(buyerId: string): Promise<LoanApplication[]>;
    findById(id: string): Promise<LoanApplication>;
    findForBuyer(buyerId: string, id: string): Promise<LoanApplication>;
    submit(buyerId: string, id: string): Promise<LoanApplication>;
    adminUpdateStatus(id: string, status: LoanApplicationStatus, partnerId?: string): Promise<LoanApplication>;
    listAll(): Promise<({
        listing: {
            id: string;
            locationCity: string;
            locationState: string;
            status: import("@prisma/client").$Enums.ListingStatus;
            title: string;
            machineCategory: string;
            machineMake: string;
            machineModel: string;
            manufactureYear: number | null;
            askingPrice: Prisma.Decimal;
            complexityTier: import("@prisma/client").$Enums.ComplexityTier;
        };
        certification: {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.CertificationStatus;
            complexityTier: import("@prisma/client").$Enums.ComplexityTier;
            listingId: string;
            inspectorNotes: string | null;
            inspectionReport: Prisma.JsonValue | null;
            loanApplicationId: string;
            fee: Prisma.Decimal;
            reportStorageKey: string | null;
            completedAt: Date | null;
        } | null;
        buybackOffer: {
            id: string;
        } | null;
        buyer: {
            phone: string;
            fullName: string;
            email: string | null;
            gstStatus: import("@prisma/client").$Enums.GstStatus;
        };
        partner: {
            id: string;
            name: string;
            active: boolean;
            type: import("@prisma/client").$Enums.FinancePartnerType;
            referralRate: Prisma.Decimal;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.LoanApplicationStatus;
        listingId: string;
        buyerId: string;
        partnerId: string | null;
        amountRequested: Prisma.Decimal;
        referralCommission: Prisma.Decimal | null;
    })[]>;
}
