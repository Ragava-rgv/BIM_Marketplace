import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { AuthenticatedUser } from './types/jwt-payload.interface';
declare class SwitchModeDto {
    mode: 'BUYER' | 'SELLER';
}
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    me(user: AuthenticatedUser): Promise<{
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
    signup(dto: SignupDto): Promise<{
        userId: string;
    }>;
    login(dto: LoginDto): Promise<import("./auth.service").AuthTokens>;
    sendOtp(dto: SendOtpDto): Promise<{
        sent: boolean;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<import("./auth.service").AuthTokens>;
    adminLogin(dto: AdminLoginDto): Promise<import("./auth.service").AuthTokens>;
    refresh(dto: RefreshTokenDto): Promise<import("./auth.service").AuthTokens>;
    switchToSeller(user: AuthenticatedUser): Promise<import("./auth.service").AuthTokens>;
    switchMode(user: AuthenticatedUser, dto: SwitchModeDto): Promise<{
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
    logout(dto: RefreshTokenDto): Promise<{
        loggedOut: boolean;
    }>;
}
export {};
