import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@machinebazaar/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { ContactPaymentsService } from './contact-payments.service';
import { CreateContactOrderDto, VerifyContactPaymentDto } from './dto/contact-payment.dto';

@Controller('contact-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContactPaymentsController {
  constructor(private readonly service: ContactPaymentsService) {}

  // Allow SELLER too — a seller browsing in BUYER mode can pay to reveal contacts
  @Get('check/:listingId')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  check(@CurrentUser() user: AuthenticatedUser, @Param('listingId') listingId: string) {
    return this.service.check(user.id, listingId);
  }

  @Post('order')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  createOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateContactOrderDto) {
    return this.service.createOrder(user.id, dto);
  }

  @Post('verify')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  verify(@CurrentUser() user: AuthenticatedUser, @Body() dto: VerifyContactPaymentDto) {
    return this.service.verifyAndReveal(user.id, dto);
  }
}
