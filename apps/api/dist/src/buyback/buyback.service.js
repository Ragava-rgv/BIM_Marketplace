"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuybackService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const BUYBACK_OFFER_RATIO = 0.9;
const QUOTE_VALIDITY_DAYS = 14;
const BUYBACK_WINDOW_YEARS = 5;
const DEFAULT_AGREEMENT_TERMS = {
    buybackWindowYears: BUYBACK_WINDOW_YEARS,
    noticePeriodDays: 30,
    conditions: 'This buyback value table is anchored to the certified value recorded at the time of financing, ' +
        'derived from the published depreciation schedule for this machine’s category. The seller may ' +
        'exercise the buyback option for the corresponding year’s value by giving MachineBazaar written ' +
        'notice at least the stated notice period in advance, within the buyback window from the date of this ' +
        'agreement. The buyback value is contingent on the machine being in the condition recorded in the ' +
        'certification report at issuance, subject to a re-inspection at the time of buyback.',
};
let BuybackService = class BuybackService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async quote(dto) {
        const schedule = await this.prisma.depreciationSchedule.findUnique({
            where: {
                machineCategory_yearOffset: {
                    machineCategory: dto.machineCategory,
                    yearOffset: dto.machineAgeYears,
                },
            },
        });
        const retainedPct = schedule?.retainedValuePct ??
            this.fallbackRetainedPct(dto.machineAgeYears);
        const originalPrice = new client_1.Prisma.Decimal(dto.originalPrice);
        const depreciatedValue = originalPrice.mul(retainedPct).div(100);
        const offerAmount = depreciatedValue.mul(BUYBACK_OFFER_RATIO);
        if (dto.listingId) {
            const listing = await this.prisma.listing.findUnique({
                where: { id: dto.listingId },
            });
            if (!listing) {
                throw new common_1.NotFoundException('Listing not found');
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
                status: client_1.BuybackStatus.QUOTED,
            },
        });
    }
    fallbackRetainedPct(yearOffset) {
        return Math.max(20, 100 - yearOffset * 10);
    }
    async initiateFromLoanApplication(loanApplicationId) {
        const application = await this.prisma.loanApplication.findUnique({
            where: { id: loanApplicationId },
            include: { listing: true, certification: true, buybackOffer: true },
        });
        if (!application) {
            throw new common_1.NotFoundException('Loan application not found');
        }
        if (application.buybackOffer) {
            throw new common_1.BadRequestException('A buyback agreement already exists for this application');
        }
        const certification = application.certification;
        if (!certification ||
            certification.status !== client_1.CertificationStatus.COMPLETED) {
            throw new common_1.BadRequestException('Certification must be completed before a buyback agreement can be created');
        }
        const inspectionReport = certification.inspectionReport;
        if (!inspectionReport) {
            throw new common_1.BadRequestException('The certification report is missing its inspection details');
        }
        const listing = application.listing;
        if (listing.manufactureYear == null) {
            throw new common_1.BadRequestException({
                message: 'This listing needs a manufacturing year before a buyback quote can be generated',
                error: 'MANUFACTURE_YEAR_REQUIRED',
            });
        }
        const certifiedValue = new client_1.Prisma.Decimal(inspectionReport.recommendedMarketValue);
        const machineAgeYears = Math.max(0, new Date().getFullYear() - listing.manufactureYear);
        const depreciationSchedule = [];
        for (let yearOffset = 0; yearOffset <= BUYBACK_WINDOW_YEARS; yearOffset++) {
            const scheduleEntry = await this.prisma.depreciationSchedule.findUnique({
                where: {
                    machineCategory_yearOffset: {
                        machineCategory: listing.machineCategory,
                        yearOffset: machineAgeYears + yearOffset,
                    },
                },
            });
            const retainedPct = scheduleEntry?.retainedValuePct ??
                this.fallbackRetainedPct(machineAgeYears + yearOffset);
            const buybackValue = certifiedValue
                .mul(retainedPct)
                .div(100)
                .mul(BUYBACK_OFFER_RATIO);
            depreciationSchedule.push({
                yearOffset,
                retainedValuePct: new client_1.Prisma.Decimal(retainedPct).toFixed(2),
                buybackValue: buybackValue.toFixed(2),
            });
        }
        const firstYearRetainedPct = depreciationSchedule[0].retainedValuePct;
        const depreciatedValue = certifiedValue.mul(firstYearRetainedPct).div(100);
        const offerAmount = new client_1.Prisma.Decimal(depreciationSchedule[0].buybackValue);
        return this.prisma.buybackOffer.create({
            data: {
                listingId: listing.id,
                loanApplicationId: application.id,
                originalPrice: listing.askingPrice,
                machineAgeYears,
                certifiedValue,
                depreciatedValue,
                offerAmount,
                depreciationSchedule: depreciationSchedule,
                agreementTerms: DEFAULT_AGREEMENT_TERMS,
                status: client_1.BuybackStatus.QUOTED,
            },
        });
    }
    async updateAgreement(id, dto) {
        const offer = await this.findById(id);
        if (offer.status !== client_1.BuybackStatus.QUOTED) {
            throw new common_1.BadRequestException('The agreement can only be edited while the offer is QUOTED');
        }
        const currentTerms = offer.agreementTerms ??
            DEFAULT_AGREEMENT_TERMS;
        const agreementTerms = {
            buybackWindowYears: dto.buybackWindowYears ?? currentTerms.buybackWindowYears,
            noticePeriodDays: dto.noticePeriodDays ?? currentTerms.noticePeriodDays,
            conditions: dto.conditions ?? currentTerms.conditions,
        };
        const data = {
            agreementTerms: agreementTerms,
        };
        if (dto.depreciationSchedule) {
            if (dto.depreciationSchedule.length === 0) {
                throw new common_1.BadRequestException('The depreciation schedule cannot be empty');
            }
            const sorted = [...dto.depreciationSchedule].sort((a, b) => a.yearOffset - b.yearOffset);
            const depreciationSchedule = sorted.map((entry) => ({
                yearOffset: entry.yearOffset,
                retainedValuePct: new client_1.Prisma.Decimal(entry.retainedValuePct).toFixed(2),
                buybackValue: new client_1.Prisma.Decimal(entry.buybackValue).toFixed(2),
            }));
            data.depreciationSchedule =
                depreciationSchedule;
            const first = depreciationSchedule[0];
            const certifiedValue = offer.certifiedValue;
            if (certifiedValue) {
                data.depreciatedValue = certifiedValue
                    .mul(first.retainedValuePct)
                    .div(100);
            }
            data.offerAmount = new client_1.Prisma.Decimal(first.buybackValue);
        }
        return this.prisma.buybackOffer.update({ where: { id }, data });
    }
    async findById(id) {
        const offer = await this.prisma.buybackOffer.findUnique({ where: { id } });
        if (!offer) {
            throw new common_1.NotFoundException('Buyback offer not found');
        }
        return offer;
    }
    async accept(id, user) {
        const offer = await this.findById(id);
        if (user.role === client_1.UserRole.BUYER) {
            const loanApplication = offer.loanApplicationId
                ? await this.prisma.loanApplication.findUnique({
                    where: { id: offer.loanApplicationId },
                })
                : null;
            if (!loanApplication || loanApplication.buyerId !== user.id) {
                throw new common_1.ForbiddenException('This is not your buyback agreement');
            }
        }
        if (offer.status !== client_1.BuybackStatus.QUOTED) {
            throw new common_1.BadRequestException(`Offer cannot be accepted from ${offer.status} status`);
        }
        const ageMs = Date.now() - offer.createdAt.getTime();
        if (ageMs > QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000) {
            await this.prisma.buybackOffer.update({
                where: { id },
                data: { status: client_1.BuybackStatus.EXPIRED },
            });
            throw new common_1.BadRequestException('This quote has expired — request a fresh one');
        }
        return this.prisma.buybackOffer.update({
            where: { id },
            data: { status: client_1.BuybackStatus.ACCEPTED },
        });
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
    async listForBuyer(buyerId) {
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
    async complete(id) {
        const offer = await this.findById(id);
        if (offer.status !== client_1.BuybackStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Only an accepted offer can be completed');
        }
        return this.prisma.buybackOffer.update({
            where: { id },
            data: { status: client_1.BuybackStatus.COMPLETED },
        });
    }
};
exports.BuybackService = BuybackService;
exports.BuybackService = BuybackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BuybackService);
//# sourceMappingURL=buyback.service.js.map