import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FinancePartnersService } from './finance-partners.service';
import { CreateFinancePartnerDto } from './dto/create-finance-partner.dto';
import { UpdateFinancePartnerDto } from './dto/update-finance-partner.dto';

@Controller('finance-partners')
export class FinancePartnersController {
  constructor(private readonly partners: FinancePartnersService) {}

  /** Public/buyer-facing: only active partners are offered when applying for a loan. */
  @Get()
  async listActive() {
    return this.partners.listActive();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async listAll() {
    return this.partners.listAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateFinancePartnerDto) {
    return this.partners.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateFinancePartnerDto) {
    return this.partners.update(id, dto);
  }
}
