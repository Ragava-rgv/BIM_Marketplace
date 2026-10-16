import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Certification,
  CertificationStatus,
  ComplexityTier,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CERTIFICATION_REPORTS_DIR,
  StorageService,
} from '../storage/storage.service';
import type { UpdateCertificationDto } from './dto/update-certification.dto';

/**
 * Certification fee bands by machine complexity tier (project_spec.md §6.5).
 * Kept as a single, easily-tunable map — admin can be wired to edit these
 * the same way it edits the depreciation schedule if/when the founder wants
 * a UI for it; no schema change required to adjust the numbers themselves.
 */
export const CERTIFICATION_FEE_BANDS: Record<ComplexityTier, number> = {
  SIMPLE: 5_000,
  STANDARD: 12_000,
  COMPLEX: 25_000,
};

const VALID_TRANSITIONS: Record<CertificationStatus, CertificationStatus[]> = {
  REQUESTED: [CertificationStatus.IN_PROGRESS, CertificationStatus.REJECTED],
  IN_PROGRESS: [CertificationStatus.COMPLETED, CertificationStatus.REJECTED],
  COMPLETED: [],
  REJECTED: [],
};

@Injectable()
export class CertificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  computeFee(tier: ComplexityTier): Prisma.Decimal {
    return new Prisma.Decimal(CERTIFICATION_FEE_BANDS[tier]);
  }

  /**
   * Certification is created ONLY as a side effect of a submitted loan application —
   * never standalone, never for every listing (§6.5 / §8.7 / §8.9, the platform's moat).
   */
  async createForLoanApplication(
    loanApplicationId: string,
    listingId: string,
    complexityTier: ComplexityTier,
  ): Promise<Certification> {
    const existing = await this.prisma.certification.findUnique({
      where: { loanApplicationId },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.certification.create({
      data: {
        listingId,
        loanApplicationId,
        complexityTier,
        fee: this.computeFee(complexityTier),
        status: CertificationStatus.REQUESTED,
      },
    });
  }

  async findById(id: string): Promise<Certification> {
    const cert = await this.prisma.certification.findUnique({ where: { id } });
    if (!cert) {
      throw new NotFoundException('Certification not found');
    }
    return cert;
  }

  /** Inspector reference details — so whoever picks up a certification knows which machine they're inspecting. */
  private static readonly LISTING_SELECT = {
    title: true,
    machineCategory: true,
    machineMake: true,
    machineModel: true,
    manufactureYear: true,
    askingPrice: true,
    locationCity: true,
    locationState: true,
  } satisfies Prisma.ListingSelect;

  async listAll() {
    return this.prisma.certification.findMany({
      orderBy: { createdAt: 'desc' },
      include: { listing: { select: CertificationsService.LISTING_SELECT } },
    });
  }

  async listForListing(listingId: string): Promise<Certification[]> {
    return this.prisma.certification.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Admin/inspector workflow: REQUESTED -> IN_PROGRESS -> COMPLETED (or REJECTED). */
  async update(
    id: string,
    dto: UpdateCertificationDto,
  ): Promise<Certification> {
    const cert = await this.findById(id);

    let status = cert.status;
    if (dto.status && dto.status !== cert.status) {
      if (!VALID_TRANSITIONS[cert.status].includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition certification from ${cert.status} to ${dto.status}`,
        );
      }
      status = dto.status;
    }

    const inspectionReport = dto.inspectionReport ?? cert.inspectionReport;
    if (status === CertificationStatus.COMPLETED && !inspectionReport) {
      throw new BadRequestException(
        'The inspection report must be filled in before completing this certification',
      );
    }

    return this.prisma.certification.update({
      where: { id },
      data: {
        status,
        inspectorNotes: dto.inspectorNotes ?? undefined,
        inspectionReport: dto.inspectionReport
          ? (dto.inspectionReport as unknown as Prisma.InputJsonValue)
          : undefined,
        completedAt:
          status === CertificationStatus.COMPLETED
            ? new Date()
            : cert.completedAt,
      },
    });
  }

  /** Admin/inspector uploads the final certification report PDF, completing the workflow. */
  async uploadReport(
    id: string,
    file: Express.Multer.File,
  ): Promise<Certification> {
    const cert = await this.findById(id);
    if (
      cert.status !== CertificationStatus.IN_PROGRESS &&
      cert.status !== CertificationStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Move the certification to IN_PROGRESS before attaching the report',
      );
    }

    const uploaded = await this.storage.upload(file, CERTIFICATION_REPORTS_DIR);

    return this.prisma.certification.update({
      where: { id },
      data: {
        reportStorageKey: uploaded.key,
        status: CertificationStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }
}
