import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CertificationStatus,
  GstStatus,
  LoanApplication,
  LoanApplicationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CertificationsService } from '../certifications/certifications.service';
import type { CreateLoanApplicationDto } from './dto/create-loan-application.dto';

const VALID_ADMIN_TRANSITIONS: Record<LoanApplicationStatus, LoanApplicationStatus[]> = {
  DRAFT: [],
  SUBMITTED: [LoanApplicationStatus.CERT_PENDING, LoanApplicationStatus.REJECTED],
  CERT_PENDING: [LoanApplicationStatus.WITH_PARTNER, LoanApplicationStatus.REJECTED],
  WITH_PARTNER: [LoanApplicationStatus.APPROVED, LoanApplicationStatus.REJECTED],
  APPROVED: [],
  REJECTED: [],
};

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly certifications: CertificationsService,
  ) {}

  async create(buyerId: string, dto: CreateLoanApplicationDto): Promise<LoanApplication> {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.prisma.loanApplication.create({
      data: {
        listingId: dto.listingId,
        buyerId,
        partnerId: null,
        amountRequested: new Prisma.Decimal(dto.amountRequested),
        status: LoanApplicationStatus.DRAFT,
      },
    });
  }

  async listMine(buyerId: string): Promise<LoanApplication[]> {
    return this.prisma.loanApplication.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: { partner: true },
    });
  }

  async findById(id: string): Promise<LoanApplication> {
    const application = await this.prisma.loanApplication.findUnique({ where: { id } });
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }
    return application;
  }

  async findForBuyer(buyerId: string, id: string): Promise<LoanApplication> {
    const application = await this.findById(id);
    if (application.buyerId !== buyerId) {
      throw new NotFoundException('Loan application not found');
    }
    return application;
  }

  /**
   * Submitting a loan application moves it into the admin's review queue.
   * It also requires the buyer to hold an ACTIVE GST (§8.2) — buyers never need
   * GST just to browse or message. Certification is NOT triggered here — admin
   * first coordinates with the buyer to confirm eligibility, then moves the
   * application to CERT_PENDING, which is what triggers the independent
   * certification (§5 note, §6.5, §6.6, §8.7).
   */
  async submit(buyerId: string, id: string): Promise<LoanApplication> {
    const application = await this.findById(id);
    if (application.buyerId !== buyerId) {
      throw new ForbiddenException('This is not your loan application');
    }
    if (application.status !== LoanApplicationStatus.DRAFT) {
      throw new BadRequestException(`Loan application is already ${application.status}`);
    }

    const buyer = await this.prisma.user.findUnique({ where: { id: buyerId } });
    if (!buyer || buyer.gstStatus !== GstStatus.ACTIVE) {
      throw new ForbiddenException('Your GST must be verified and ACTIVE before submitting a loan application');
    }

    const listing = await this.prisma.listing.findUnique({ where: { id: application.listingId } });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.prisma.loanApplication.update({
      where: { id },
      data: { status: LoanApplicationStatus.SUBMITTED },
    });
  }

  /**
   * Admin routes the application onward. SUBMITTED -> CERT_PENDING is the
   * "eligible for finance" decision and is what TRIGGERS the independent
   * certification. Once certification completes, admin can route to a finance
   * partner. Buyers no longer pick a finance partner — admin assigns/confirms
   * one when moving the application to WITH_PARTNER.
   */
  async adminUpdateStatus(id: string, status: LoanApplicationStatus, partnerId?: string): Promise<LoanApplication> {
    const application = await this.findById(id);

    if (!VALID_ADMIN_TRANSITIONS[application.status].includes(status)) {
      throw new BadRequestException(`Cannot transition loan application from ${application.status} to ${status}`);
    }

    if (status === LoanApplicationStatus.CERT_PENDING) {
      const listing = await this.prisma.listing.findUnique({ where: { id: application.listingId } });
      if (!listing) {
        throw new NotFoundException('Listing not found');
      }
      const updated = await this.prisma.loanApplication.update({
        where: { id },
        data: { status: LoanApplicationStatus.CERT_PENDING },
      });
      await this.certifications.createForLoanApplication(updated.id, listing.id, listing.complexityTier);
      return updated;
    }

    let resolvedPartnerId = application.partnerId;
    if (status === LoanApplicationStatus.WITH_PARTNER) {
      const certification = await this.prisma.certification.findUnique({ where: { loanApplicationId: id } });
      if (!certification || certification.status !== CertificationStatus.COMPLETED) {
        throw new BadRequestException('Certification must be COMPLETED before routing to the finance partner');
      }
      const targetPartnerId = partnerId ?? application.partnerId;
      if (!targetPartnerId) {
        throw new BadRequestException('A finance partner must be selected when routing this application');
      }
      const partner = await this.prisma.financePartner.findUnique({ where: { id: targetPartnerId } });
      if (!partner || !partner.active) {
        throw new BadRequestException('Selected finance partner is not available');
      }
      resolvedPartnerId = targetPartnerId;
    }

    let referralCommission = application.referralCommission;
    if (status === LoanApplicationStatus.APPROVED && resolvedPartnerId) {
      const partner = await this.prisma.financePartner.findUnique({ where: { id: resolvedPartnerId } });
      if (partner) {
        referralCommission = application.amountRequested.mul(partner.referralRate).div(100);
      }
    }

    return this.prisma.loanApplication.update({
      where: { id },
      data: { status, partnerId: resolvedPartnerId, referralCommission },
    });
  }

  async listAll() {
    return this.prisma.loanApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        partner: true,
        listing: {
          select: {
            id: true,
            title: true,
            askingPrice: true,
            machineCategory: true,
            machineMake: true,
            machineModel: true,
            manufactureYear: true,
            locationCity: true,
            locationState: true,
            complexityTier: true,
            status: true,
          },
        },
        buyer: { select: { fullName: true, phone: true, email: true, gstStatus: true } },
        certification: true,
        buybackOffer: { select: { id: true } },
      },
    });
  }
}
