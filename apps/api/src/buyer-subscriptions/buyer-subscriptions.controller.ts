import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@machinebazaar/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { BuyerSubscriptionsService } from './buyer-subscriptions.service';
import {
  CreateBuyerSubscriptionOrderDto,
  VerifyBuyerSubscriptionDto,
} from './dto/subscribe.dto';
import {
  AdjustQuotaDto,
  AdminQueryBuyerSubscriptionsDto,
} from './dto/admin-query.dto';

@Controller('buyer-subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BuyerSubscriptionsController {
  constructor(private readonly service: BuyerSubscriptionsService) {}

  // Allow SELLER too — a seller browsing in BUYER mode can still reveal contacts.
  @Get('me')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getStatus(user.id);
  }

  @Post('order')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBuyerSubscriptionOrderDto,
  ) {
    return this.service.createOrder(user.id, dto);
  }

  @Post('verify')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  verify(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyBuyerSubscriptionDto,
  ) {
    return this.service.verifyAndActivate(user.id, dto);
  }

  @Get('reveal-status/:listingId')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  revealStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId') listingId: string,
  ) {
    return this.service.revealStatus(user.id, listingId);
  }

  @Post('reveal/:listingId')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  reveal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId') listingId: string,
  ) {
    return this.service.reveal(user.id, listingId);
  }

  @Get('contact-views')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  listContactViews(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.listContactViews(
      user.id,
      Number(page) || 1,
      Number(pageSize) || 20,
    );
  }
}

@Controller('admin/buyer-subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminBuyerSubscriptionsController {
  constructor(private readonly service: BuyerSubscriptionsService) {}

  @Get()
  list(@Query() query: AdminQueryBuyerSubscriptionsDto) {
    return this.service.adminList(
      query.search,
      query.page ?? 1,
      query.pageSize ?? 20,
    );
  }

  @Patch(':id/adjust-quota')
  adjustQuota(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AdjustQuotaDto,
  ) {
    return this.service.adjustQuota(id, admin.id, dto.delta, dto.reason);
  }
}
