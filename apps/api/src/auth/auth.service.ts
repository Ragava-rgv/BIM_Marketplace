import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { GstStatus, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import type { SignupDto } from './dto/signup.dto';
import type { OtpPurpose } from './dto/send-otp.dto';
import type { JwtAccessPayload, JwtRefreshPayload } from './types/jwt-payload.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_TOKEN_HASH_ROUNDS = 10;
const PASSWORD_HASH_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly otp: OtpService,
  ) {}

  // -- Signup -------------------------------------------------------------

  async signup(dto: SignupDto): Promise<{ userId: string }> {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new ConflictException('An account with this phone number already exists');
    }

    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existingEmail) {
        throw new ConflictException('An account with this email already exists');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_HASH_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        role: dto.role as UserRole,
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email ?? null,
        passwordHash,
        phoneVerified: false,
        gstStatus: GstStatus.UNVERIFIED,
        locationCity: dto.locationCity ?? null,
        locationState: dto.locationState ?? null,
      },
    });

    await this.otp.issue(dto.phone, 'SIGNUP', user.id);

    return { userId: user.id };
  }

  // -- Login ----------------------------------------------------------------

  async loginWithPassword(phone: string, password: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user || user.role === UserRole.ADMIN || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.phoneVerified) {
      throw new UnauthorizedException('Phone number not verified — complete signup first');
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokenPair(user);
  }

  // -- OTP (signup only) ----------------------------------------------------

  async requestOtp(phone: string, purpose: OtpPurpose): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      throw new BadRequestException('No pending signup found for this phone number');
    }
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Admin accounts use email and password login');
    }

    await this.otp.issue(phone, purpose, user.id);
  }

  async verifyOtpAndAuthenticate(phone: string, code: string, purpose: OtpPurpose): Promise<AuthTokens> {
    await this.otp.verify(phone, code, purpose);

    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new BadRequestException('No account found for this phone number');
    }

    if (purpose === 'SIGNUP' && !user.phoneVerified) {
      await this.prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
    }

    return this.issueTokenPair(user);
  }

  // -- Admin login -----------------------------------------------------------

  async adminLogin(email: string, password: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.role !== UserRole.ADMIN || !user.passwordHash) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    return this.issueTokenPair(user);
  }

  // -- Token lifecycle --------------------------------------------------------

  async issueTokenPair(user: User): Promise<AuthTokens> {
    const accessPayload: JwtAccessPayload = { sub: user.id, role: user.role, type: 'access' };
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL') ?? '15m';
    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTtl as JwtSignOptions['expiresIn'],
    });

    const jti = randomUUID();
    const refreshPayload: JwtRefreshPayload = { sub: user.id, role: user.role, jti, type: 'refresh' };
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL') ?? '30d';
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshTtl as JwtSignOptions['expiresIn'],
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

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    const matches = await bcrypt.compare(refreshToken, stored.tokenHash);
    if (!matches) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }

    // Rotate: revoke the used refresh token and issue a fresh pair.
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    return this.issueTokenPair(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }
    return this.toUserDto(user);
  }

  toUserDto(user: User) {
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
      locationCity: (user as any).locationCity ?? null,
      locationState: (user as any).locationState ?? null,
      activeMode: (user as any).activeMode ?? 'BUYER',
      canSell: (user as any).canSell ?? false,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async switchToSeller(userId: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Account not found');

    if (user.gstStatus !== GstStatus.ACTIVE) {
      throw new ForbiddenException(
        'GST verification is required before enabling seller mode',
      );
    }

    const updated = await (this.prisma.user.update as any)({
      where: { id: userId },
      data: { role: UserRole.SELLER, canSell: true, activeMode: 'SELLER' },
    });

    return this.issueTokenPair(updated);
  }

  async switchMode(userId: string, mode: 'BUYER' | 'SELLER'): Promise<ReturnType<typeof this.toUserDto>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Account not found');

    if (mode === 'SELLER' && !(user as any).canSell) {
      throw new ForbiddenException(
        'GST verification is required before switching to seller mode',
      );
    }

    const updated = await (this.prisma.user.update as any)({
      where: { id: userId },
      data: { activeMode: mode },
    });

    return this.toUserDto(updated);
  }

  async logout(refreshToken: string): Promise<void> {
    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      return;
    }

    await this.prisma.refreshToken.updateMany({
      where: { id: payload.jti, userId: payload.sub },
      data: { revoked: true },
    });
  }

  private addDuration(duration: string): Date {
    const match = /^(\d+)([smhd])$/.exec(duration.trim());
    if (!match) {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    const value = Number(match[1]);
    const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return new Date(Date.now() + value * unitMs[match[2]]);
  }
}
