import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CertificationsService } from './certifications.service';
import { UpdateCertificationDto } from './dto/update-certification.dto';

const MAX_REPORT_BYTES = 25 * 1024 * 1024;

@Controller('certifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CertificationsController {
  constructor(private readonly certifications: CertificationsService) {}

  @Get()
  async list() {
    return this.certifications.listAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.certifications.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCertificationDto) {
    return this.certifications.update(id, dto);
  }

  @Post(':id/report')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_REPORT_BYTES } }),
  )
  async uploadReport(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.certifications.uploadReport(id, file);
  }
}
