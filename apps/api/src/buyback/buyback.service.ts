import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BuybackOffer, BuybackStatus, CertificationStatus, Prisma, UserRole } from '@prisma/client';
import type { BuybackAgreementTermsDto, BuybackScheduleEntryDto, InspectionReportDto } from '@machinebazaar/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { QuoteBuybackDto } from './dto/quote-buyback.dto';
import type { UpdateBuybackAgreementDto } from './dto/update-buyback-agreement.dto';

/**
 * Placeholder margin the platform retains between the depreciated value and what
 * it offers the seller — founder will calibrate this once real figures land
 * alongside the depreciation_schedule values (project_spec.md §5).
 */
const BUYBACK_OFFER_RATIO = 0.9;

const QUOTE_VALIDITY_DAYS = 14;

/** Number of future years (beyond the machine's current age) covered by a buyback agreement's value table. */
const BUYBACK_WINDOW_YEARS = 5;

const DEFAULT_AGREEMENT_TERMS: BuybackAgreementTermsDto = {
  buybackWindowYears: BUYBACK_WINDOW_YEARS,
  noticePeriodDays: 30,
  conditions:
    'This buyback value table is anchored to the certified value recorded at the time of financing, ' +
    'derived from the published depreciation schedule for this machine’s category. The seller may ' +
    'exercise the buyback option for the corresponding year’s value by giving MachineBazaar written ' +
    'notice at least the stated notice period in advance, within the buyback window from the date of this ' +
    'agreement. The buyback value is contingent on the machine being in the condition recorded in the ' +
    'certification report at issuance, subject to a re-inspection at the time of buyback.',
};

@Injectable()
export class BuybackService {
  constructor(private readonly prisma: PrismaService) {}

  /** Quote engine: reads depreciation_schedule to compute depreciated_value and offer_amount (§6.6). */
  async quote(dto: QuoteBuybackDto): Promise<BuybackOffer> {
    const schedule = await this.prisma.depreciationSchedule.findUnique({
      where: { machineCategory_yearOffset: { machineCategory: dto.machineCategory, yearOffset: dto.machineAgeYears } },
    });

    const retainedPct = schedule?.retainedValuePct ?? this.fallbackRetainedPct(dto.machineAgeYears);

    const originalPrice = new Prisma.Decimal(dto.originalPrice);
    const depreciatedValue = originalPrice.mul(retainedPct).div(100);
    const offerAmount = depreciatedValue.mul(BUYBACK_OFFER_RATIO);

    if (dto.listingId) {
      const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
      if (!listing) {
        throw new NotFoundException('Listing not found');
      }
    }

    return this.prisma.buybackOffer.create({
      data: {
        listingId: dto.listingId ?? null,
        machineReference: dto.listingId ? null : dto.machineReference,
        originalPrice,
        machineAgeYears: dto.machineAgeYears,
        depreciatedValue,
        offerAmount,
        status: BuybackStatus.QUOTED,
      },
    });
  }

  /** Floor curve used only when a category has no seeded schedule for the requested age. */
  private fallbackRetainedPct(yearOffset: number): number {
    return Math.max(20, 100 - yearOffset * 10);
  }

  /**
   * Step 4 of the financed-deal flow: once certification is COMPLETED (step 2) and admin
   * confirms the certified value by initiating this agreement (step 3), a buyback agreement
   * is created with a year-on-year depreciation/buyback table anchored on that certified
   * value (step 5). Buyback only exists for financed deals — cash deals never reach here.
   */
  async initiateFromLoanApplication(loanApplicationId: string): Promise<BuybackOffer> {
    const application = await this.prisma.loanApplication.findUnique({
      where: { id: loanApplicationId },
      include: { listing: true, certification: true, buybackOffer: true },
    });
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }
    if (application.buybackOffer) {
      throw new BadRequestException('A buyback agreement already exists for this application');
    }

    const certification = application.certification;
    if (!certification || certification.status !== CertificationStatus.COMPLETED) {
      throw new BadRequestException('Certification must be completed before a buyback agreement can be created');
    }
    const inspectionReport = certification.inspectionReport as unknown as InspectionReportDto | null;
    if (!inspectionReport) {
      throw new BadRequestException('The certification report is missing its inspection details');
    }

    const listing = application.listing;
    const certifiedValue = new Prisma.Decimal(inspectionReport.recommendedMarketValue);
    const machineAgeYears = Math.max(0, new Date().getFullYear() - listing.manufactureYear);

    const depreciationSchedule: BuybackScheduleEntryDto[] = [];
    for (let yearOffset = 0; yearOffset <= BUYBACK_WINDOW_YEARS; yearOffset++) {
      const scheduleEntry = await this.prisma.depreciationSchedule.findUnique({
        where: {
          machineCategory_yearOffset: { machineCategory: listing.machineCategory, yearOffset: machineAgeYears + yearOffset },
        },
      });
      const retainedPct = scheduleEntry?.retainedValuePct ?? this.fallbackRetainedPct(machineAgeYears + yearOffset);
      const buybackValue = certifiedValue.mul(retainedPct).div(100).mul(BUYBACK_OFFER_RATIO);
      depreciationSchedule.push({
        yearOffset,
        retainedValuePct: new Prisma.Decimal(retainedPct).toFixed(2),
        buybackValue: buybackValue.toFixed(2),
      });
    }

    const firstYearRetainedPct = depreciationSchedule[0].retainedValuePct;
    const depreciatedValue = certifiedValue.mul(firstYearRetainedPct).div(100);
    const offerAmount = new Prisma.Decimal(depreciationSchedule[0].buybackValue);

    return this.prisma.buybackOffer.create({
      data: {
        listingId: listing.id,
        loanApplicationId: application.id,
        originalPrice: listing.askingPrice,
        machineAgeYears,
        certifiedValue,
        depreciatedValue,
        offerAmount,
        depreciationSchedule: depreciationSchedule as unknown as Prisma.InputJsonValue,
        agreementTerms: DEFAULT_AGREEMENT_TERMS as unknown as Prisma.InputJsonValue,
        status: BuybackStatus.QUOTED,
      },
    });
  }

  /** Admin edits the agreement terms and/or value table before the seller accepts it. */
  async updateAgreement(id: string, dto: UpdateBuybackAgreementDto): Promise<BuybackOffer> {
    const offer = await this.findById(id);
    if (offer.status !== BuybackStatus.QUOTED) {
      throw new BadRequestException('The agreement can only be edited while the offer is QUOTED');
    }

    const currentTerms = (offer.agreementTerms as unknown as BuybackAgreementTermsDto | null) ?? DEFAULT_AGREEMENT_TERMS;
    const agreementTerms: BuybackAgreementTermsDto = {
      buybackWindowYears: dto.buybackWindowYears ?? currentTerms.buybackWindowYears,
      noticePeriodDays: dto.noticePeriodDays ?? currentTerms.noticePeriodDays,
      conditions: dto.conditions ?? currentTerms.conditions,
    };

    const data: Prisma.BuybackOfferUpdateInput = {
      agreementTerms: agreementTerms as unknown as Prisma.InputJsonValue,
    };

    if (dto.depreciationSchedule) {
      if (dto.depreciationSchedule.length === 0) {
        throw new BadRequestException('The depreciation schedule cannot be empty');
      }
      const sorted = [...dto.depreciationSchedule].sort((a, b) => a.yearOffset - b.yearOffset);
      const depreciationSchedule: BuybackScheduleEntryDto[] = sorted.map((entry) => ({
        yearOffset: entry.yearOffset,
        retainedValuePct: new Prisma.Decimal(entry.retainedValuePct).toFixed(2),
        buybackValue: new Prisma.Decimal(entry.buybackValue).toFixed(2),
      }));
      data.depreciationSchedule = depreciationSchedule as unknown as Prisma.InputJsonValue;

      const first = depreciationSchedule[0];
      const certifiedValue = offer.certifiedValue;
      if (certifiedValue) {
        data.depreciatedValue = certifiedValue.mul(first.retainedValuePct).div(100);
      }
      data.offerAmount = new Prisma.Decimal(first.buybackValue);
    }

    return this.prisma.buybackOffer.update({ where: { id }, data });
  }

  async findById(id: string): Promise<BuybackOffer> {
    const offer = await this.prisma.buybackOffer.findUnique({ where: { id } });
    if (!offer) {
      throw new NotFoundException('Buyback offer not found');
    }
    return offer;
  }

  async accept(id: string, user: { id: string; role: UserRole }): Promise<BuybackOffer> {
    const offer = await this.findById(id);

    if (user.role === UserRole.BUYER) {
      const loanApplication = offer.loanApplicationId
        ? await this.prisma.loanApplication.findUnique({ where: { id: offer.loanApplicationId } })
        : null;
      if (!loanApplication || loanApplication.buyerId !== user.id) {
        throw new ForbiddenException('This is not your buyback agreement');
      }
    }

    if (offer.status !== BuybackStatus.QUOTED) {
      throw new BadRequestException(`Offer cannot be accepted from ${offer.status} status`);
    }

    const ageMs = Date.now() - offer.createdAt.getTime();
    if (ageMs > QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000) {
      await this.prisma.buybackOffer.update({ where: { id }, data: { status: BuybackStatus.EXPIRED } });
      throw new BadRequestException('This quote has expired — request a fresh one');
    }

    return this.prisma.buybackOffer.update({ where: { id }, data: { status: BuybackStatus.ACCEPTED } });
  }

  async listAll() {
    return this.prisma.buybackOffer.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            machineCategory: true,
            machineMake: true,
            machineModel: true,
            manufactureYear: true,
            locationCity: true,
            locationState: true,
            sellerId: true,
          },
        },
      },
    });
  }

  /** Buyback agreements for loan applications financed by this buyer, so they can review and accept agreements. */
  async listForBuyer(buyerId: string) {
    return this.prisma.buybackOffer.findMany({
      where: { loanApplication: { buyerId } },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            machineCategory: true,
            machineMake: true,
            machineModel: true,
            manufactureYear: true,
            locationCity: true,
            locationState: true,
            sellerId: true,
          },
        },
      },
    });
  }

  /** Admin marks a buyback as physically completed (machine collected, payout made). */
  async complete(id: string): Promise<BuybackOffer> {
    const offer = await this.findById(id);
    if (offer.status !== BuybackStatus.ACCEPTED) {
      throw new BadRequestException('Only an accepted offer can be completed');
    }
    return this.prisma.buybackOffer.update({ where: { id }, data: { status: BuybackStatus.COMPLETED } });
  }
}
