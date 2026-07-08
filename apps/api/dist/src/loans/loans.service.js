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
exports.LoansService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const certifications_service_1 = require("../certifications/certifications.service");
const VALID_ADMIN_TRANSITIONS = {
    DRAFT: [],
    SUBMITTED: [client_1.LoanApplicationStatus.CERT_PENDING, client_1.LoanApplicationStatus.REJECTED],
    CERT_PENDING: [client_1.LoanApplicationStatus.WITH_PARTNER, client_1.LoanApplicationStatus.REJECTED],
    WITH_PARTNER: [client_1.LoanApplicationStatus.APPROVED, client_1.LoanApplicationStatus.REJECTED],
    APPROVED: [],
    REJECTED: [],
};
let LoansService = class LoansService {
    prisma;
    certifications;
    constructor(prisma, certifications) {
        this.prisma = prisma;
        this.certifications = certifications;
    }
    async create(buyerId, dto) {
        const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        return this.prisma.loanApplication.create({
            data: {
                listingId: dto.listingId,
                buyerId,
                partnerId: null,
                amountRequested: new client_1.Prisma.Decimal(dto.amountRequested),
                status: client_1.LoanApplicationStatus.DRAFT,
            },
        });
    }
    async listMine(buyerId) {
        return this.prisma.loanApplication.findMany({
            where: { buyerId },
            orderBy: { createdAt: 'desc' },
            include: { partner: true },
        });
    }
    async findById(id) {
        const application = await this.prisma.loanApplication.findUnique({ where: { id } });
        if (!application) {
            throw new common_1.NotFoundException('Loan application not found');
        }
        return application;
    }
    async findForBuyer(buyerId, id) {
        const application = await this.findById(id);
        if (application.buyerId !== buyerId) {
            throw new common_1.NotFoundException('Loan application not found');
        }
        return application;
    }
    async submit(buyerId, id) {
        const application = await this.findById(id);
        if (application.buyerId !== buyerId) {
            throw new common_1.ForbiddenException('This is not your loan application');
        }
        if (application.status !== client_1.LoanApplicationStatus.DRAFT) {
            throw new common_1.BadRequestException(`Loan application is already ${application.status}`);
        }
        const buyer = await this.prisma.user.findUnique({ where: { id: buyerId } });
        if (!buyer || buyer.gstStatus !== client_1.GstStatus.ACTIVE) {
            throw new common_1.ForbiddenException('Your GST must be verified and ACTIVE before submitting a loan application');
        }
        const listing = await this.prisma.listing.findUnique({ where: { id: application.listingId } });
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        return this.prisma.loanApplication.update({
            where: { id },
            data: { status: client_1.LoanApplicationStatus.SUBMITTED },
        });
    }
    async adminUpdateStatus(id, status, partnerId) {
        const application = await this.findById(id);
        if (!VALID_ADMIN_TRANSITIONS[application.status].includes(status)) {
            throw new common_1.BadRequestException(`Cannot transition loan application from ${application.status} to ${status}`);
        }
        if (status === client_1.LoanApplicationStatus.CERT_PENDING) {
            const listing = await this.prisma.listing.findUnique({ where: { id: application.listingId } });
            if (!listing) {
                throw new common_1.NotFoundException('Listing not found');
            }
            const updated = await this.prisma.loanApplication.update({
                where: { id },
                data: { status: client_1.LoanApplicationStatus.CERT_PENDING },
            });
            await this.certifications.createForLoanApplication(updated.id, listing.id, listing.complexityTier);
            return updated;
        }
        let resolvedPartnerId = application.partnerId;
        if (status === client_1.LoanApplicationStatus.WITH_PARTNER) {
            const certification = await this.prisma.certification.findUnique({ where: { loanApplicationId: id } });
            if (!certification || certification.status !== client_1.CertificationStatus.COMPLETED) {
                throw new common_1.BadRequestException('Certification must be COMPLETED before routing to the finance partner');
            }
            const targetPartnerId = partnerId ?? application.partnerId;
            if (!targetPartnerId) {
                throw new common_1.BadRequestException('A finance partner must be selected when routing this application');
            }
            const partner = await this.prisma.financePartner.findUnique({ where: { id: targetPartnerId } });
            if (!partner || !partner.active) {
                throw new common_1.BadRequestException('Selected finance partner is not available');
            }
            resolvedPartnerId = targetPartnerId;
        }
        let referralCommission = application.referralCommission;
        if (status === client_1.LoanApplicationStatus.APPROVED && resolvedPartnerId) {
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
};
exports.LoansService = LoansService;
exports.LoansService = LoansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        certifications_service_1.CertificationsService])
], LoansService);
//# sourceMappingURL=loans.service.js.map