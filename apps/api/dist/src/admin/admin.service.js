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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async dashboardSummary() {
        const [listingsPendingReview, listingsActive, listingsSold, listingsInactive, loansAwaitingAction, certificationsInProgress, commissionsPending, enquiriesNew,] = await this.prisma.$transaction([
            this.prisma.listing.count({
                where: { status: client_1.ListingStatus.PENDING_REVIEW },
            }),
            this.prisma.listing.count({ where: { status: client_1.ListingStatus.ACTIVE } }),
            this.prisma.listing.count({ where: { status: client_1.ListingStatus.SOLD } }),
            this.prisma.listing.count({ where: { status: client_1.ListingStatus.WITHDRAWN } }),
            this.prisma.loanApplication.count({
                where: {
                    status: {
                        in: [
                            client_1.LoanApplicationStatus.CERT_PENDING,
                            client_1.LoanApplicationStatus.WITH_PARTNER,
                        ],
                    },
                },
            }),
            this.prisma.certification.count({
                where: {
                    status: {
                        in: [
                            client_1.CertificationStatus.REQUESTED,
                            client_1.CertificationStatus.IN_PROGRESS,
                        ],
                    },
                },
            }),
            this.prisma.transaction.count({
                where: { commissionStatus: client_1.CommissionStatus.PENDING },
            }),
            this.prisma.enquiry.count({ where: { status: client_1.EnquiryStatus.NEW } }),
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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map