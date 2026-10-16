import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DepreciationService } from './depreciation.service';
import { UpsertDepreciationEntryDto } from './dto/upsert-depreciation-entry.dto';

@Controller('depreciation-schedule')
export class DepreciationController {
  constructor(private readonly depreciation: DepreciationService) {}

  /** Public: feeds the buyback quote preview shown to sellers. */
  @Get()
  async listAll() {
    return this.depreciation.listAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async upsert(@Body() dto: UpsertDepreciationEntryDto) {
    return this.depreciation.upsert(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    await this.depreciation.remove(id);
    return { removed: true };
  }
}
