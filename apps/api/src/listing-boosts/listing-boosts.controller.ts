import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { ListingBoostsService } from './listing-boosts.service';
import { CreateBoostOrderDto, VerifyBoostDto } from './dto/boost-order.dto';

@Controller('listing-boosts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SELLER)
export class ListingBoostsController {
  constructor(private readonly boosts: ListingBoostsService) {}

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.boosts.listMine(user.id);
  }

  @Get(':listingId/status')
  getStatus(@CurrentUser() user: AuthenticatedUser, @Param('listingId') listingId: string) {
    return this.boosts.getStatus(user.id, listingId);
  }

  @Post(':listingId/order')
  createOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId') listingId: string,
    @Body() dto: CreateBoostOrderDto,
  ) {
    return this.boosts.createOrder(user.id, listingId, dto);
  }

  @Post(':listingId/verify')
  @HttpCode(HttpStatus.OK)
  verify(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId') listingId: string,
    @Body() dto: VerifyBoostDto,
  ) {
    return this.boosts.verifyAndActivate(user.id, listingId, dto);
  }
}
