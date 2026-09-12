import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@machinebazaar/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionOrderDto,
  VerifySubscriptionDto,
} from './dto/verify-subscription.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get('me')
  @Roles(UserRole.SELLER)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getStatus(user.id);
  }

  @Post('order')
  @Roles(UserRole.SELLER)
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubscriptionOrderDto,
  ) {
    return this.service.createOrder(user.id, dto);
  }

  @Post('verify')
  @Roles(UserRole.SELLER)
  verify(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifySubscriptionDto,
  ) {
    return this.service.verifyAndActivate(user.id, dto);
  }
}
