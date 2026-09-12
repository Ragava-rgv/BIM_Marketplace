import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import type { OtpPurpose } from './dto/send-otp.dto';

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;

/**
 * Wraps the SMS OTP gateway. In development (no real OTP_PROVIDER_KEY configured)
 * it logs the code instead of sending an SMS so the flow can be exercised end to end.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly providerKey: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.providerKey = this.config.get<string>('OTP_PROVIDER_KEY');
  }

  private generateCode(): string {
    const max = 10 ** OTP_LENGTH;
    return Math.floor(Math.random() * max)
      .toString()
      .padStart(OTP_LENGTH, '0');
  }

  async issue(
    phone: string,
    purpose: OtpPurpose,
    userId?: string,
  ): Promise<void> {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.prisma.otpCode.create({
      data: { phone, purpose, code, expiresAt, userId },
    });

    await this.dispatch(phone, code);
  }

  private async dispatch(phone: string, code: string): Promise<void> {
    if (!this.providerKey || this.providerKey.startsWith('dev_')) {
      this.logger.log(
        `[DEV OTP] phone=${phone} code=${code} (configure OTP_PROVIDER_KEY for real SMS delivery)`,
      );
      return;
    }

    // 2Factor.in transactional SMS OTP
    const url = `https://2factor.in/API/V1/${this.providerKey}/SMS/${phone}/${code}/MachineBazaar`;
    await axios.get(url);
    this.logger.log(`OTP dispatched to ${phone} via 2Factor.in`);
  }

  async verify(
    phone: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    const record = await this.prisma.otpCode.findFirst({
      where: { phone, purpose, consumed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.code !== code || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { consumed: true },
    });
  }
}
