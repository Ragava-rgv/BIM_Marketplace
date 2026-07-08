import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
export declare class TransactionsController {
    private readonly transactions;
    constructor(transactions: TransactionsService);
    create(user: AuthenticatedUser, dto: CreateTransactionDto): Promise<{
        id: string;
        createdAt: Date;
        sellerId: string;
        listingId: string;
        buyerId: string;
        salePrice: import("@prisma/client/runtime/library").Decimal;
        buyerCommission: import("@prisma/client/runtime/library").Decimal;
        sellerCommission: import("@prisma/client/runtime/library").Decimal;
        commissionStatus: import("@prisma/client").$Enums.CommissionStatus;
        contactReleasedAt: Date | null;
    }>;
    mine(user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        sellerId: string;
        listingId: string;
        buyerId: string;
        salePrice: import("@prisma/client/runtime/library").Decimal;
        buyerCommission: import("@prisma/client/runtime/library").Decimal;
        sellerCommission: import("@prisma/client/runtime/library").Decimal;
        commissionStatus: import("@prisma/client").$Enums.CommissionStatus;
        contactReleasedAt: Date | null;
    }[]>;
    listAll(user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        sellerId: string;
        listingId: string;
        buyerId: string;
        salePrice: import("@prisma/client/runtime/library").Decimal;
        buyerCommission: import("@prisma/client/runtime/library").Decimal;
        sellerCommission: import("@prisma/client/runtime/library").Decimal;
        commissionStatus: import("@prisma/client").$Enums.CommissionStatus;
        contactReleasedAt: Date | null;
    }[]>;
    contacts(user: AuthenticatedUser): Promise<{
        transactionId: string;
        listingId: string;
        listingTitle: string;
        contactReleasedAt: Date | null;
        contact: {
            email: string | null;
            phone: string;
            fullName: string;
        };
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        sellerId: string;
        listingId: string;
        buyerId: string;
        salePrice: import("@prisma/client/runtime/library").Decimal;
        buyerCommission: import("@prisma/client/runtime/library").Decimal;
        sellerCommission: import("@prisma/client/runtime/library").Decimal;
        commissionStatus: import("@prisma/client").$Enums.CommissionStatus;
        contactReleasedAt: Date | null;
    }>;
    contact(id: string, user: AuthenticatedUser): Promise<{
        released: false;
        contact?: undefined;
    } | {
        released: true;
        contact: {
            email: string | null;
            phone: string;
            fullName: string;
        };
    }>;
    markPaid(id: string): Promise<{
        id: string;
        createdAt: Date;
        sellerId: string;
        listingId: string;
        buyerId: string;
        salePrice: import("@prisma/client/runtime/library").Decimal;
        buyerCommission: import("@prisma/client/runtime/library").Decimal;
        sellerCommission: import("@prisma/client/runtime/library").Decimal;
        commissionStatus: import("@prisma/client").$Enums.CommissionStatus;
        contactReleasedAt: Date | null;
    }>;
}
