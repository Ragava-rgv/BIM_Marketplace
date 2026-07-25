import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { WishlistService } from './wishlist.service';

/** Buyer and seller-in-buyer-mode both browse listings, so both roles may wishlist (mirrors buyer-subscriptions/contact-view precedent). */
@Controller('wishlist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BUYER, UserRole.SELLER)
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.wishlist.list(user.id);
  }

  @Get('ids')
  async listIds(@CurrentUser() user: AuthenticatedUser) {
    return this.wishlist.listIds(user.id);
  }

  @Post(':listingId')
  @HttpCode(HttpStatus.OK)
  async add(@CurrentUser() user: AuthenticatedUser, @Param('listingId') listingId: string) {
    await this.wishlist.add(user.id, listingId);
    return { saved: true };
  }

  @Delete(':listingId')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('listingId') listingId: string) {
    await this.wishlist.remove(user.id, listingId);
    return { saved: false };
  }
}
