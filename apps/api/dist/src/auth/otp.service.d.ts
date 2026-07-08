import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { OtpPurpose } from './dto/send-otp.dto';
export declare class OtpService {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    private readonly providerKey;
    constructor(prisma: PrismaService, config: ConfigService);
    private generateCode;
    issue(phone: string, purpose: OtpPurpose, userId?: string): Promise<void>;
    private dispatch;
    verify(phone: string, code: string, purpose: OtpPurpose): Promise<void>;
}
