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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const prisma_service_1 = require("../prisma/prisma.service");
const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
let OtpService = OtpService_1 = class OtpService {
    prisma;
    config;
    logger = new common_1.Logger(OtpService_1.name);
    providerKey;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.providerKey = this.config.get('OTP_PROVIDER_KEY');
    }
    generateCode() {
        const max = 10 ** OTP_LENGTH;
        return Math.floor(Math.random() * max)
            .toString()
            .padStart(OTP_LENGTH, '0');
    }
    async issue(phone, purpose, userId) {
        const code = this.generateCode();
        const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
        await this.prisma.otpCode.create({
            data: { phone, purpose, code, expiresAt, userId },
        });
        await this.dispatch(phone, code);
    }
    async dispatch(phone, code) {
        if (!this.providerKey || this.providerKey.startsWith('dev_')) {
            this.logger.log(`[DEV OTP] phone=${phone} code=${code} (configure OTP_PROVIDER_KEY for real SMS delivery)`);
            return;
        }
        const url = `https://2factor.in/API/V1/${this.providerKey}/SMS/${phone}/${code}/MachineBazaar`;
        await axios_1.default.get(url);
        this.logger.log(`OTP dispatched to ${phone} via 2Factor.in`);
    }
    async verify(phone, code, purpose) {
        const record = await this.prisma.otpCode.findFirst({
            where: { phone, purpose, consumed: false },
            orderBy: { createdAt: 'desc' },
        });
        if (!record || record.code !== code || record.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        await this.prisma.otpCode.update({
            where: { id: record.id },
            data: { consumed: true },
        });
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], OtpService);
//# sourceMappingURL=otp.service.js.map