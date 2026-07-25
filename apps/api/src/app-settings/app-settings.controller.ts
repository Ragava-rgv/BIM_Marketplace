import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AppSettingsService } from './app-settings.service';

class UpdateSettingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  value: string;
}

/** Admin-only CRUD for all platform settings. */
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminSettingsController {
  constructor(private readonly service: AppSettingsService) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.service.update(key, dto.value);
  }
}
