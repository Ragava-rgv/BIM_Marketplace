import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { GstService } from './gst.service';
import { VerifyGstDto } from './dto/verify-gst.dto';
export declare class GstController {
    private readonly gst;
    constructor(gst: GstService);
    verify(user: AuthenticatedUser, dto: VerifyGstDto): Promise<{
        phone: string;
        id: string;
        createdAt: Date;
        role: import("@prisma/client").$Enums.UserRole;
        fullName: string;
        email: string | null;
        locationCity: string | null;
        locationState: string | null;
        passwordHash: string | null;
        phoneVerified: boolean;
        gstNumber: string | null;
        businessName: string | null;
        gstStatus: import("@prisma/client").$Enums.GstStatus;
        address: string | null;
        activeMode: string;
        canSell: boolean;
        preferredLanguage: import("@prisma/client").$Enums.SupportedLanguage;
        updatedAt: Date;
    }>;
}
