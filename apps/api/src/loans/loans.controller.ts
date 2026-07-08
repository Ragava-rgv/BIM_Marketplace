import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { LoanApplicationStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { LoansService } from './loans.service';
import { CreateLoanApplicationDto } from './dto/create-loan-application.dto';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto';

@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
  constructor(private readonly loans: LoansService) {}

  @Post()
  @Roles(UserRole.BUYER)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLoanApplicationDto) {
    return this.loans.create(user.id, dto);
  }

  @Get('mine')
  @Roles(UserRole.BUYER)
  async mine(@CurrentUser() user: AuthenticatedUser) {
    return this.loans.listMine(user.id);
  }

  @Get(':id')
  @Roles(UserRole.BUYER, UserRole.ADMIN)
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return user.role === UserRole.ADMIN ? this.loans.findById(id) : this.loans.findForBuyer(user.id, id);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.BUYER)
  async submit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.loans.submit(user.id, id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async listAll() {
    return this.loans.listAll();
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateLoanStatusDto) {
    return this.loans.adminUpdateStatus(id, dto.status as LoanApplicationStatus, dto.partnerId);
  }
}
