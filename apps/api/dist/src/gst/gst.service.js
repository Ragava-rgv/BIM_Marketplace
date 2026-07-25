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
exports.GstService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const masters_india_client_1 = require("./masters-india.client");
const ACTIVE_STATUSES = new Set(['active']);
let GstService = class GstService {
    prisma;
    mastersIndia;
    constructor(prisma, mastersIndia) {
        this.prisma = prisma;
        this.mastersIndia = mastersIndia;
    }
    async verify(userId, gstNumber, address, role) {
        if (role === client_1.UserRole.SELLER && !address) {
            throw new common_1.BadRequestException('Address is required for seller GST verification');
        }
        const result = await this.mastersIndia.lookupGstin(gstNumber);
        if (!result) {
            await this.markStatus(userId, gstNumber, client_1.GstStatus.UNVERIFIED);
            throw new common_1.NotFoundException('GSTIN could not be found by Masters India');
        }
        if (!ACTIVE_STATUSES.has(result.status.trim().toLowerCase())) {
            await this.markStatus(userId, gstNumber, client_1.GstStatus.INACTIVE);
            throw new common_1.BadRequestException(`GSTIN status is "${result.status}" — only ACTIVE registrations are accepted`);
        }
        const businessName = result.legalName ?? result.tradeName ?? gstNumber;
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                gstNumber,
                businessName,
                gstStatus: client_1.GstStatus.ACTIVE,
                ...(address ? { address } : {}),
            },
        });
    }
    async markStatus(userId, gstNumber, status) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { gstNumber, gstStatus: status },
        });
    }
};
exports.GstService = GstService;
exports.GstService = GstService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        masters_india_client_1.GstVerifyClient])
], GstService);
//# sourceMappingURL=gst.service.js.map