import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GstStatus, User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GstVerifyClient } from './masters-india.client';

const ACTIVE_STATUSES = new Set(['active']);

@Injectable()
export class GstService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mastersIndia: GstVerifyClient,
  ) {}

  /**
   * Implements the exact 7-step GST verification flow from project_spec.md §6.2:
   *   1. Receive GST number from client          (gstNumber argument)
   *   2. Call Masters India API with the GST number
   *   3. Validate the response — check the GSTIN exists
   *   4. Validate active status (reject if cancelled/suspended)
   *   5. Extract the legal/trade business name
   *   6. Auto-fill business_name on the user record
   *   7. Set gst_status = ACTIVE and persist
   */
  async verify(
    userId: string,
    gstNumber: string,
    address: string | undefined,
    role: UserRole,
  ): Promise<User> {
    // Sellers must supply an address alongside GST verification — it's what gets
    // revealed to buyers after they view the contact. Buyers never send this field.
    if (role === UserRole.SELLER && !address) {
      throw new BadRequestException(
        'Address is required for seller GST verification',
      );
    }

    // Step 2: call Masters India API with the GST number
    const result = await this.mastersIndia.lookupGstin(gstNumber);

    // Step 3: validate the response — check the GSTIN exists
    if (!result) {
      await this.markStatus(userId, gstNumber, GstStatus.UNVERIFIED);
      throw new NotFoundException('GSTIN could not be found by Masters India');
    }

    // Step 4: validate active status (reject if cancelled/suspended)
    if (!ACTIVE_STATUSES.has(result.status.trim().toLowerCase())) {
      await this.markStatus(userId, gstNumber, GstStatus.INACTIVE);
      throw new BadRequestException(
        `GSTIN status is "${result.status}" — only ACTIVE registrations are accepted`,
      );
    }

    // Step 5: extract the legal/trade business name
    const businessName = result.legalName ?? result.tradeName ?? gstNumber;

    // Steps 6 & 7: auto-fill business_name, set gst_status = ACTIVE, persist
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        gstNumber,
        businessName,
        gstStatus: GstStatus.ACTIVE,
        ...(address ? { address } : {}),
      },
    });
  }

  private async markStatus(
    userId: string,
    gstNumber: string,
    status: GstStatus,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { gstNumber, gstStatus: status },
    });
  }
}
