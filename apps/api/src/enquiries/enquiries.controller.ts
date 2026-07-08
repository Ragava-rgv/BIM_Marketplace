import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { EnquiriesService } from './enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto } from './dto/update-enquiry.dto';

@Controller('enquiries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnquiriesController {
  constructor(private readonly enquiries: EnquiriesService) {}

  @Post()
  @Roles(UserRole.BUYER, UserRole.SELLER)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEnquiryDto) {
    return this.enquiries.create(user.id, dto.listingId);
  }

  @Get('mine')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  async mine(@CurrentUser() user: AuthenticatedUser) {
    return this.enquiries.listMine(user.id);
  }

  @Get('seller')
  @Roles(UserRole.SELLER)
  async forSeller(@CurrentUser() user: AuthenticatedUser) {
    return this.enquiries.listForSeller(user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async listAll() {
    return this.enquiries.listAll();
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateEnquiryDto) {
    return this.enquiries.updateStatus(id, dto.status);
  }
}
