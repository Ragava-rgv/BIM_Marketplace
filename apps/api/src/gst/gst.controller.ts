import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { GstService } from './gst.service';
import { VerifyGstDto } from './dto/verify-gst.dto';

@Controller('gst')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER, UserRole.BUYER)
export class GstController {
  constructor(private readonly gst: GstService) {}

  @Post('verify')
  async verify(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyGstDto,
  ) {
    return this.gst.verify(user.id, dto.gstNumber, dto.address, user.role);
  }
}
