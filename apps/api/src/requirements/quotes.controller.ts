import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { RequirementsService } from './requirements.service';

@Controller('quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class QuotesController {
  constructor(private readonly requirements: RequirementsService) {}

  @Get('mine')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.requirements.findMyQuotesGiven(user.id);
  }

  /** The only status transition left now that quotes aren't admin-gated — a responder
      pulling back their own quote. */
  @Post(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  async withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.requirements.withdrawQuote(user.id, id);
  }
}
