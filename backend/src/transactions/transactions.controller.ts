import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post()
  @Roles(UserRole.SELLER)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactions.create(user.id, dto);
  }

  @Get('mine')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  async mine(@CurrentUser() user: AuthenticatedUser) {
    return this.transactions.listForUser(user.id, user.role);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async listAll(@CurrentUser() user: AuthenticatedUser) {
    return this.transactions.listForUser(user.id, user.role);
  }

  @Get('contacts')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  async contacts(@CurrentUser() user: AuthenticatedUser) {
    return this.transactions.listReleasedContacts(user.id, user.role);
  }

  @Get(':id')
  @Roles(UserRole.BUYER, UserRole.SELLER, UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.transactions.findById(id);
  }

  @Get(':id/contact')
  @Roles(UserRole.BUYER, UserRole.SELLER)
  async contact(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactions.getContact(id, user.id);
  }

  @Post(':id/mark-paid')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  async markPaid(@Param('id') id: string) {
    return this.transactions.markCommissionPaid(id);
  }
}
