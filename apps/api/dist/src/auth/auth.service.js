"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const otp_service_1 = require("./otp.service");
const REFRESH_TOKEN_HASH_ROUNDS = 10;
const PASSWORD_HASH_ROUNDS = 10;
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    otp;
    constructor(prisma, jwt, config, otp) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.otp = otp;
    }
    async signup(dto) {
        const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
        if (existing) {
            throw new common_1.ConflictException('An account with this phone number already exists');
        }
        if (dto.email) {
            const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
            if (existingEmail) {
                throw new common_1.ConflictException('An account with this email already exists');
            }
        }
        const passwordHash = await bcrypt.hash(dto.password, PASSWORD_HASH_ROUNDS);
        const user = await this.prisma.user.create({
            data: {
                role: dto.role,
                fullName: dto.fullName,
                phone: dto.phone,
                email: dto.email ?? null,
                passwordHash,
                phoneVerified: false,
                gstStatus: client_1.GstStatus.UNVERIFIED,
                locationCity: dto.locationCity ?? null,
                locationState: dto.locationState ?? null,
            },
        });
        await this.otp.issue(dto.phone, 'SIGNUP', user.id);
        return { userId: user.id };
    }
    async loginWithPassword(phone, password) {
        const user = await this.prisma.user.findUnique({ where: { phone } });
        if (!user || user.role === client_1.UserRole.ADMIN || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.phoneVerified) {
            throw new common_1.UnauthorizedException('Phone number not verified — complete signup first');
        }
        const matches = await bcrypt.compare(password, user.passwordHash);
        if (!matches) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.issueTokenPair(user);
    }
    async requestOtp(phone, purpose) {
        const user = await this.prisma.user.findUnique({ where: { phone } });
        if (!user) {
            throw new common_1.BadRequestException('No pending signup found for this phone number');
        }
        if (user.role === client_1.UserRole.ADMIN) {
            throw new common_1.BadRequestException('Admin accounts use email and password login');
        }
        await this.otp.issue(phone, purpose, user.id);
    }
    async verifyOtpAndAuthenticate(phone, code, purpose) {
        await this.otp.verify(phone, code, purpose);
        const user = await this.prisma.user.findUnique({ where: { phone } });
        if (!user) {
            throw new common_1.BadRequestException('No account found for this phone number');
        }
        if (purpose === 'SIGNUP' && !user.phoneVerified) {
            await this.prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
        }
        return this.issueTokenPair(user);
    }
    async adminLogin(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== client_1.UserRole.ADMIN || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid admin credentials');
        }
        const matches = await bcrypt.compare(password, user.passwordHash);
        if (!matches) {
            throw new common_1.UnauthorizedException('Invalid admin credentials');
        }
        return this.issueTokenPair(user);
    }
    async issueTokenPair(user) {
        const accessPayload = { sub: user.id, role: user.role, type: 'access' };
        const accessTtl = this.config.get('JWT_ACCESS_TTL') ?? '15m';
        const accessToken = await this.jwt.signAsync(accessPayload, {
            secret: this.config.get('JWT_ACCESS_SECRET'),
            expiresIn: accessTtl,
        });
        const jti = (0, crypto_1.randomUUID)();
        const refreshPayload = { sub: user.id, role: user.role, jti, type: 'refresh' };
        const refreshTtl = this.config.get('JWT_REFRESH_TTL') ?? '30d';
        const refreshToken = await this.jwt.signAsync(refreshPayload, {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: refreshTtl,
        });
        const tokenHash = await bcrypt.hash(refreshToken, REFRESH_TOKEN_HASH_ROUNDS);
        await this.prisma.refreshToken.create({
            data: {
                id: jti,
                userId: user.id,
                tokenHash,
                expiresAt: this.addDuration(refreshTtl),
            },
        });
        return { accessToken, refreshToken };
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        if (payload.type !== 'refresh') {
            throw new common_1.UnauthorizedException('Invalid token type');
        }
        const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
        if (!stored || stored.revoked || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token is no longer valid');
        }
        const matches = await bcrypt.compare(refreshToken, stored.tokenHash);
        if (!matches) {
            throw new common_1.UnauthorizedException('Refresh token is no longer valid');
        }
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) {
            throw new common_1.UnauthorizedException('Account no longer exists');
        }
        await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
        return this.issueTokenPair(user);
    }
    async me(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('Account no longer exists');
        }
        return this.toUserDto(user);
    }
    toUserDto(user) {
        return {
            id: user.id,
            role: user.role,
            email: user.email,
            phone: user.phone,
            fullName: user.fullName,
            phoneVerified: user.phoneVerified,
            gstNumber: user.gstNumber,
            businessName: user.businessName,
            gstStatus: user.gstStatus,
            locationCity: user.locationCity ?? null,
            locationState: user.locationState ?? null,
            activeMode: user.activeMode ?? 'BUYER',
            canSell: user.canSell ?? false,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        };
    }
    async switchToSeller(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('Account not found');
        if (user.gstStatus !== client_1.GstStatus.ACTIVE) {
            throw new common_1.ForbiddenException('GST verification is required before enabling seller mode');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { role: client_1.UserRole.SELLER, canSell: true, activeMode: 'SELLER' },
        });
        return this.issueTokenPair(updated);
    }
    async switchMode(userId, mode) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('Account not found');
        if (mode === 'SELLER' && !user.canSell) {
            throw new common_1.ForbiddenException('GST verification is required before switching to seller mode');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { activeMode: mode },
        });
        return this.toUserDto(updated);
    }
    async logout(refreshToken) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            return;
        }
        await this.prisma.refreshToken.updateMany({
            where: { id: payload.jti, userId: payload.sub },
            data: { revoked: true },
        });
    }
    addDuration(duration) {
        const match = /^(\d+)([smhd])$/.exec(duration.trim());
        if (!match) {
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        const value = Number(match[1]);
        const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
        return new Date(Date.now() + value * unitMs[match[2]]);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        otp_service_1.OtpService])
], AuthService);
//# sourceMappingURL=auth.service.js.map