import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuoteStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { ListingsService } from '../listings/listings.service';
import { AdminQueryListingsDto } from '../listings/dto/query-listings.dto';
import {
  BulkListingStatusDto,
  type BulkListingStatusAction,
} from './dto/bulk-listing-status.dto';
import { RequirementsService } from '../requirements/requirements.service';
import { AdminQueryRequirementsDto } from '../requirements/dto/query-requirements.dto';

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
    private readonly requirements: RequirementsService,
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

  @Post('listings/:id/mark-sold')
  @HttpCode(HttpStatus.OK)
  async markSoldListing(@Param('id') id: string) {
    return this.listings.markSold(id);
  }

  @Post('listings/:id/mark-inactive')
  @HttpCode(HttpStatus.OK)
  async markInactiveListing(@Param('id') id: string) {
    return this.listings.markInactive(id);
  }

  @Post('listings/:id/reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivateListing(@Param('id') id: string) {
    return this.listings.reactivate(id);
  }

  @Post('listings/bulk-status')
  @HttpCode(HttpStatus.OK)
  async bulkListingStatus(@Body() dto: BulkListingStatusDto) {
    const action = this.resolveBulkAction(dto.action);
    const results = await Promise.allSettled(dto.ids.map((id) => action(id)));
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results
      .map((r, i) => ({ r, id: dto.ids[i] }))
      .filter(({ r }) => r.status === 'rejected')
      .map(({ r, id }) => ({
        id,
        error: (r as PromiseRejectedResult).reason?.message ?? 'Failed',
      }));
    return { succeeded, failed };
  }

  private resolveBulkAction(
    action: BulkListingStatusAction,
  ): (id: string) => Promise<unknown> {
    switch (action) {
      case 'approve':
        return (id) => this.listings.approve(id);
      case 'reject':
        return (id) => this.listings.reject(id);
      case 'mark-sold':
        return (id) => this.listings.markSold(id);
      case 'mark-inactive':
        return (id) => this.listings.markInactive(id);
      case 'reactivate':
        return (id) => this.listings.reactivate(id);
    }
  }

  // -- Requirement ("Wanted") traceability — read-only, no approval gate --------

  @Get('requirements')
  async requirementQueue(@Query() query: AdminQueryRequirementsDto) {
    return this.requirements.adminList(query);
  }

  @Get('requirements/:id')
  async requirementDetail(@Param('id') id: string) {
    return this.requirements.findAnyById(id);
  }

  // -- Quote traceability — read-only, no approval gate ---------------------------

  @Get('quotes')
  async quoteQueue(@Query('status') status?: QuoteStatus) {
    return this.requirements.adminListQuotes(status);
  }
}
