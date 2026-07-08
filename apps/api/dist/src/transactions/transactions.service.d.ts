import { Transaction, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class TransactionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(sellerId: string, dto: {
        listingId: string;
        buyerId: string;
        salePrice: number;
    }): Promise<Transaction>;
    listForUser(userId: string, role: UserRole): Promise<Transaction[]>;
    findById(id: string): Promise<Transaction>;
    markCommissionPaid(transactionId: string): Promise<Transaction>;
    getContact(transactionId: string, userId: string): Promise<{
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
    listReleasedContacts(userId: string, role: UserRole): Promise<{
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
}
