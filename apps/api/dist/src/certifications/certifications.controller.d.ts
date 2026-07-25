import { CertificationsService } from './certifications.service';
import { UpdateCertificationDto } from './dto/update-certification.dto';
export declare class CertificationsController {
    private readonly certifications;
    constructor(certifications: CertificationsService);
    list(): Promise<({
        listing: {
            machineCategory: string;
            locationCity: string;
            locationState: string;
            title: string;
            machineMake: string;
            machineModel: string;
            manufactureYear: number | null;
            askingPrice: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.CertificationStatus;
        complexityTier: import("@prisma/client").$Enums.ComplexityTier;
        listingId: string;
        inspectorNotes: string | null;
        inspectionReport: import("@prisma/client/runtime/library").JsonValue | null;
        loanApplicationId: string;
        fee: import("@prisma/client/runtime/library").Decimal;
        reportStorageKey: string | null;
        completedAt: Date | null;
    })[]>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.CertificationStatus;
        complexityTier: import("@prisma/client").$Enums.ComplexityTier;
        listingId: string;
        inspectorNotes: string | null;
        inspectionReport: import("@prisma/client/runtime/library").JsonValue | null;
        loanApplicationId: string;
        fee: import("@prisma/client/runtime/library").Decimal;
        reportStorageKey: string | null;
        completedAt: Date | null;
    }>;
    update(id: string, dto: UpdateCertificationDto): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.CertificationStatus;
        complexityTier: import("@prisma/client").$Enums.ComplexityTier;
        listingId: string;
        inspectorNotes: string | null;
        inspectionReport: import("@prisma/client/runtime/library").JsonValue | null;
        loanApplicationId: string;
        fee: import("@prisma/client/runtime/library").Decimal;
        reportStorageKey: string | null;
        completedAt: Date | null;
    }>;
    uploadReport(id: string, file: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.CertificationStatus;
        complexityTier: import("@prisma/client").$Enums.ComplexityTier;
        listingId: string;
        inspectorNotes: string | null;
        inspectionReport: import("@prisma/client/runtime/library").JsonValue | null;
        loanApplicationId: string;
        fee: import("@prisma/client/runtime/library").Decimal;
        reportStorageKey: string | null;
        completedAt: Date | null;
    }>;
}
