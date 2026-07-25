import { Injectable } from '@nestjs/common';
import { CertificationStatus, CommissionStatus, EnquiryStatus, ListingStatus, LoanApplicationStatus } from '@prisma/client';
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

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboardSummary(): Promise<AdminDashboardSummary> {
    const [
      listingsPendingReview,
      listingsActive,
      listingsSold,
      listingsInactive,
      loansAwaitingAction,
      certificationsInProgress,
      commissionsPending,
      enquiriesNew,
    ] = await this.prisma.$transaction([
      this.prisma.listing.count({ where: { status: ListingStatus.PENDING_REVIEW } }),
      this.prisma.listing.count({ where: { status: ListingStatus.ACTIVE } }),
      this.prisma.listing.count({ where: { status: ListingStatus.SOLD } }),
      this.prisma.listing.count({ where: { status: ListingStatus.WITHDRAWN } }),
      this.prisma.loanApplication.count({
        where: { status: { in: [LoanApplicationStatus.CERT_PENDING, LoanApplicationStatus.WITH_PARTNER] } },
      }),
      this.prisma.certification.count({
        where: { status: { in: [CertificationStatus.REQUESTED, CertificationStatus.IN_PROGRESS] } },
      }),
      this.prisma.transaction.count({ where: { commissionStatus: CommissionStatus.PENDING } }),
      this.prisma.enquiry.count({ where: { status: EnquiryStatus.NEW } }),
    ]);

    return {
      listingsPendingReview,
      listingsActive,
      listingsSold,
      listingsInactive,
      loansAwaitingAction,
      certificationsInProgress,
      commissionsPending,
      enquiriesNew,
    };
  }
}
