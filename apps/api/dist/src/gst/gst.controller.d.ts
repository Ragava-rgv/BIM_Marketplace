import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { GstService } from './gst.service';
import { VerifyGstDto } from './dto/verify-gst.dto';
export declare class GstController {
    private readonly gst;
    constructor(gst: GstService);
    verify(user: AuthenticatedUser, dto: VerifyGstDto): Promise<{
        id: string;
        email: string | null;
        phone: string;
        role: import("@prisma/client").$Enums.UserRole;
        passwordHash: string | null;
        fullName: string;
        phoneVerified: boolean;
        gstNumber: string | null;
        businessName: string | null;
        gstStatus: import("@prisma/client").$Enums.GstStatus;
        locationCity: string | null;
        locationState: string | null;
        address: string | null;
        activeMode: string;
        canSell: boolean;
        preferredLanguage: import("@prisma/client").$Enums.SupportedLanguage;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
