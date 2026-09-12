import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { LoansService } from './loans.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto';
export declare class LoansController {
    private readonly loans;
    constructor(loans: LoansService);
    create(user: AuthenticatedUser, dto: CreateLoanApplicationDto): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.LoanApplicationStatus;
        listingId: string;
        buyerId: string;
        partnerId: string | null;
        amountRequested: import("@prisma/client/runtime/library").Decimal;
        referralCommission: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    mine(user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.LoanApplicationStatus;
        listingId: string;
        buyerId: string;
        partnerId: string | null;
        amountRequested: import("@prisma/client/runtime/library").Decimal;
        referralCommission: import("@prisma/client/runtime/library").Decimal | null;
    }[]>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.LoanApplicationStatus;
        listingId: string;
        buyerId: string;
        partnerId: string | null;
        amountRequested: import("@prisma/client/runtime/library").Decimal;
        referralCommission: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    submit(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.LoanApplicationStatus;
        listingId: string;
        buyerId: string;
        partnerId: string | null;
        amountRequested: import("@prisma/client/runtime/library").Decimal;
        referralCommission: import("@prisma/client/runtime/library").Decimal | null;
    }>;
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
            askingPrice: import("@prisma/client/runtime/library").Decimal;
            complexityTier: import("@prisma/client").$Enums.ComplexityTier;
        };
        certification: {
            id: string;
            createdAt: Date;
            status: import("@prisma/client").$Enums.CertificationStatus;
            complexityTier: import("@prisma/client").$Enums.ComplexityTier;
            listingId: string;
            inspectorNotes: string | null;
            inspectionReport: import("@prisma/client/runtime/library").JsonValue | null;
            loanApplicationId: string;
            fee: import("@prisma/client/runtime/library").Decimal;
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
            referralRate: import("@prisma/client/runtime/library").Decimal;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.LoanApplicationStatus;
        listingId: string;
        buyerId: string;
        partnerId: string | null;
        amountRequested: import("@prisma/client/runtime/library").Decimal;
        referralCommission: import("@prisma/client/runtime/library").Decimal | null;
    })[]>;
    updateStatus(id: string, dto: UpdateLoanStatusDto): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.LoanApplicationStatus;
        listingId: string;
        buyerId: string;
        partnerId: string | null;
        amountRequested: import("@prisma/client/runtime/library").Decimal;
        referralCommission: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
