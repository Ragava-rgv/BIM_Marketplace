import { PrismaService } from '../prisma/prisma.service';
export interface AdminDashboardSummary {
    listingsPendingReview: number;
    listingsActive: number;
    listingsSold: number;
    listingsInactive: number;
    loansAwaitingAction: number;
    certificationsInProgress: number;
    commissionsPending: number;
    enquiriesNew: number;
}
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    dashboardSummary(): Promise<AdminDashboardSummary>;
}
