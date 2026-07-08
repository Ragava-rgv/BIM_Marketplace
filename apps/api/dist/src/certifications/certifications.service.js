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
var CertificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificationsService = exports.CERTIFICATION_FEE_BANDS = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
exports.CERTIFICATION_FEE_BANDS = {
    SIMPLE: 5_000,
    STANDARD: 12_000,
    COMPLEX: 25_000,
};
const VALID_TRANSITIONS = {
    REQUESTED: [client_1.CertificationStatus.IN_PROGRESS, client_1.CertificationStatus.REJECTED],
    IN_PROGRESS: [client_1.CertificationStatus.COMPLETED, client_1.CertificationStatus.REJECTED],
    COMPLETED: [],
    REJECTED: [],
};
let CertificationsService = class CertificationsService {
    static { CertificationsService_1 = this; }
    prisma;
    storage;
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    computeFee(tier) {
        return new client_1.Prisma.Decimal(exports.CERTIFICATION_FEE_BANDS[tier]);
    }
    async createForLoanApplication(loanApplicationId, listingId, complexityTier) {
        const existing = await this.prisma.certification.findUnique({ where: { loanApplicationId } });
        if (existing) {
            return existing;
        }
        return this.prisma.certification.create({
            data: {
                listingId,
                loanApplicationId,
                complexityTier,
                fee: this.computeFee(complexityTier),
                status: client_1.CertificationStatus.REQUESTED,
            },
        });
    }
    async findById(id) {
        const cert = await this.prisma.certification.findUnique({ where: { id } });
        if (!cert) {
            throw new common_1.NotFoundException('Certification not found');
        }
        return cert;
    }
    static LISTING_SELECT = {
        title: true,
        machineCategory: true,
        machineMake: true,
        machineModel: true,
        manufactureYear: true,
        askingPrice: true,
        locationCity: true,
        locationState: true,
    };
    async listAll() {
        return this.prisma.certification.findMany({
            orderBy: { createdAt: 'desc' },
            include: { listing: { select: CertificationsService_1.LISTING_SELECT } },
        });
    }
    async listForListing(listingId) {
        return this.prisma.certification.findMany({ where: { listingId }, orderBy: { createdAt: 'desc' } });
    }
    async update(id, dto) {
        const cert = await this.findById(id);
        let status = cert.status;
        if (dto.status && dto.status !== cert.status) {
            if (!VALID_TRANSITIONS[cert.status].includes(dto.status)) {
                throw new common_1.BadRequestException(`Cannot transition certification from ${cert.status} to ${dto.status}`);
            }
            status = dto.status;
        }
        const inspectionReport = dto.inspectionReport ?? cert.inspectionReport;
        if (status === client_1.CertificationStatus.COMPLETED && !inspectionReport) {
            throw new common_1.BadRequestException('The inspection report must be filled in before completing this certification');
        }
        return this.prisma.certification.update({
            where: { id },
            data: {
                status,
                inspectorNotes: dto.inspectorNotes ?? undefined,
                inspectionReport: dto.inspectionReport ? dto.inspectionReport : undefined,
                completedAt: status === client_1.CertificationStatus.COMPLETED ? new Date() : cert.completedAt,
            },
        });
    }
    async uploadReport(id, file) {
        const cert = await this.findById(id);
        if (cert.status !== client_1.CertificationStatus.IN_PROGRESS && cert.status !== client_1.CertificationStatus.COMPLETED) {
            throw new common_1.BadRequestException('Move the certification to IN_PROGRESS before attaching the report');
        }
        const uploaded = await this.storage.upload(file, storage_service_1.CERTIFICATION_REPORTS_DIR);
        return this.prisma.certification.update({
            where: { id },
            data: {
                reportStorageKey: uploaded.key,
                status: client_1.CertificationStatus.COMPLETED,
                completedAt: new Date(),
            },
        });
    }
};
exports.CertificationsService = CertificationsService;
exports.CertificationsService = CertificationsService = CertificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], CertificationsService);
//# sourceMappingURL=certifications.service.js.map