import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { RequirementsService } from './requirements.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { QueryRequirementsDto } from './dto/query-requirements.dto';
import { UploadRequirementMediaDto } from './dto/upload-requirement-media.dto';
import { SubmitQuoteDto } from './dto/submit-quote.dto';

const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;
const MAX_QUOTE_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_QUOTE_PHOTOS = 16;

@Controller('requirements')
export class RequirementsController {
  constructor(private readonly requirements: RequirementsService) {}

  // -- Public: the "Wanted" browse ---------------------------------------------

  @Get()
  async browse(@Query() query: QueryRequirementsDto) {
    return this.requirements.browse(query);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.requirements.findPublicById(id);
  }

  // -- Buyer: post / manage own requirements ------------------------------------

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.SELLER)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRequirementDto,
  ) {
    return this.requirements.create(user.id, dto);
  }

  @Get('mine/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.SELLER)
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.requirements.findMine(user.id);
  }

  @Get('mine/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.SELLER)
  async findOwned(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.requirements.findOwned(user.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.SELLER)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRequirementDto,
  ) {
    return this.requirements.update(user.id, id, dto);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.SELLER)
  async close(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.requirements.close(user.id, id);
  }

  @Post(':id/fulfilled')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.SELLER)
  async markFulfilled(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.requirements.markFulfilled(user.id, id);
  }

  @Post(':id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.SELLER)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async addMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UploadRequirementMediaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.requirements.addMedia(user.id, id, dto, file);
  }

  @Delete(':id/media/:mediaId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.SELLER)
  async removeMedia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
  ) {
    await this.requirements.removeMedia(user.id, id, mediaId);
    return { removed: true };
  }

  @Get(':id/quotes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER, UserRole.SELLER)
  async quotesReceived(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.requirements.findQuotesForRequirement(user.id, id);
  }

  // -- Seller: submit a quote against a live requirement -------------------------

  @Post(':id/quotes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @UseInterceptors(
    FilesInterceptor('photos', MAX_QUOTE_PHOTOS, {
      limits: { fileSize: MAX_QUOTE_PHOTO_BYTES },
    }),
  )
  async submitQuote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SubmitQuoteDto,
    @UploadedFiles() photos: Express.Multer.File[],
  ) {
    return this.requirements.submitQuote(user.id, id, dto, photos ?? []);
  }
}
