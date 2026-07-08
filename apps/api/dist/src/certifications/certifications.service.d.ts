import { Certification, ComplexityTier, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { UpdateCertificationDto } from './dto/update-certification.dto';
export declare const CERTIFICATION_FEE_BANDS: Record<ComplexityTier, number>;
export declare class CertificationsService {
    private readonly prisma;
    private readonly storage;
    constructor(prisma: PrismaService, storage: StorageService);
    computeFee(tier: ComplexityTier): Prisma.Decimal;
    createForLoanApplication(loanApplicationId: string, listingId: string, complexityTier: ComplexityTier): Promise<Certification>;
    findById(id: string): Promise<Certification>;
    private static readonly LISTING_SELECT;
    listAll(): Promise<({
        listing: {
            machineCategory: string;
            locationCity: string;
            locationState: string;
            title: string;
            machineMake: string;
            machineModel: string;
            manufactureYear: number;
            askingPrice: Prisma.Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.CertificationStatus;
        complexityTier: import("@prisma/client").$Enums.ComplexityTier;
        listingId: string;
        inspectorNotes: string | null;
        inspectionReport: Prisma.JsonValue | null;
        loanApplicationId: string;
        fee: Prisma.Decimal;
        reportStorageKey: string | null;
        completedAt: Date | null;
    })[]>;
    listForListing(listingId: string): Promise<Certification[]>;
    update(id: string, dto: UpdateCertificationDto): Promise<Certification>;
    uploadReport(id: string, file: Express.Multer.File): Promise<Certification>;
}
