import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import type { SignupDto } from './dto/signup.dto';
import type { OtpPurpose } from './dto/send-otp.dto';
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly otp;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, otp: OtpService);
    signup(dto: SignupDto): Promise<{
        userId: string;
    }>;
    loginWithPassword(phone: string, password: string): Promise<AuthTokens>;
    requestOtp(phone: string, purpose: OtpPurpose): Promise<void>;
    verifyOtpAndAuthenticate(phone: string, code: string, purpose: OtpPurpose): Promise<AuthTokens>;
    requestPasswordReset(phone: string): Promise<void>;
    resetPassword(phone: string, code: string, newPassword: string): Promise<AuthTokens>;
    adminLogin(email: string, password: string): Promise<AuthTokens>;
    issueTokenPair(user: User): Promise<AuthTokens>;
    refresh(refreshToken: string): Promise<AuthTokens>;
    me(userId: string): Promise<{
        id: string;
        role: import("@prisma/client").$Enums.UserRole;
        email: string | null;
        phone: string;
        fullName: string;
        phoneVerified: boolean;
        gstNumber: string | null;
        businessName: string | null;
        gstStatus: import("@prisma/client").$Enums.GstStatus;
        locationCity: any;
        locationState: any;
        activeMode: any;
        canSell: any;
        createdAt: string;
        updatedAt: string;
    }>;
    toUserDto(user: User): {
        id: string;
        role: import("@prisma/client").$Enums.UserRole;
        email: string | null;
        phone: string;
        fullName: string;
        phoneVerified: boolean;
        gstNumber: string | null;
        businessName: string | null;
        gstStatus: import("@prisma/client").$Enums.GstStatus;
        locationCity: any;
        locationState: any;
        activeMode: any;
        canSell: any;
        createdAt: string;
        updatedAt: string;
    };
    switchToSeller(userId: string): Promise<AuthTokens>;
    switchMode(userId: string, mode: 'BUYER' | 'SELLER'): Promise<ReturnType<typeof this.toUserDto>>;
    logout(refreshToken: string): Promise<void>;
    private addDuration;
}
