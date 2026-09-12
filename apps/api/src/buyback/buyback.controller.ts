import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { BuybackService } from './buyback.service';
import { QuoteBuybackDto } from './dto/quote-buyback.dto';
import { UpdateBuybackAgreementDto } from './dto/update-buyback-agreement.dto';

@Controller('buyback')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuybackController {
  constructor(private readonly buyback: BuybackService) {}

  @Post('quote')
  @Roles(UserRole.SELLER, UserRole.ADMIN)
  async quote(@Body() dto: QuoteBuybackDto) {
    return this.buyback.quote(dto);
  }

  @Get('mine')
  @Roles(UserRole.BUYER)
  async mine(@CurrentUser() user: AuthenticatedUser) {
    return this.buyback.listForBuyer(user.id);
  }

  @Get(':id')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.buyback.findById(id);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  async accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.buyback.accept(id, user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async listAll() {
    return this.buyback.listAll();
  }

  @Post('from-loan/:loanApplicationId')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ADMIN)
  async initiateFromLoan(
    @Param('loanApplicationId') loanApplicationId: string,
  ) {
    return this.buyback.initiateFromLoanApplication(loanApplicationId);
  }

  @Patch(':id/agreement')
  @Roles(UserRole.ADMIN)
  async updateAgreement(
    @Param('id') id: string,
    @Body() dto: UpdateBuybackAgreementDto,
  ) {
    return this.buyback.updateAgreement(id, dto);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async complete(@Param('id') id: string) {
    return this.buyback.complete(id);
  }
}
