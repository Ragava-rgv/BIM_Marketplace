import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { ListingsService } from '../listings/listings.service';
import { AdminQueryListingsDto } from '../listings/dto/query-listings.dto';

/**
 * Admin Module (project_spec.md §6.8): a thin, admin-gated aggregation layer over
 * the listing review queue. Commission release, the enquiry queue, certification
 * workflow, finance-partner management, and the depreciation schedule live in
 * their own feature modules — already gated to ADMIN there — to avoid duplicating
 * that domain logic behind a second route surface.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly listings: ListingsService,
  ) {}

  @Get('dashboard')
  async dashboard() {
    return this.admin.dashboardSummary();
  }

  // -- Listing review queue ---------------------------------------------------

  @Get('listings')
  async listingQueue(@Query() query: AdminQueryListingsDto) {
    return this.listings.adminList(query);
  }

  @Get('listings/:id')
  async listingDetail(@Param('id') id: string) {
    return this.listings.findAnyById(id);
  }

  @Post('listings/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveListing(@Param('id') id: string) {
    return this.listings.approve(id);
  }

  @Post('listings/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectListing(@Param('id') id: string) {
    return this.listings.reject(id);
  }
}
