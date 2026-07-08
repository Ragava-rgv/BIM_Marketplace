import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CatalogService } from './catalog.service';
import { CreateCategoryGroupDto } from './dto/create-category-group.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { AddSpecFieldDto } from './dto/add-spec-field.dto';
import { ReorderDto } from './dto/reorder.dto';

const imageUpload = FileInterceptor('image', { storage: memoryStorage() });

// ── Public endpoints ──────────────────────────────────────────────────────────

@Controller('category-groups')
export class CategoryGroupsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  listGroups() {
    return this.catalog.listGroups();
  }
}

@Controller('categories')
export class CategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  listCategories() {
    return this.catalog.listCategories();
  }

  @Get('by-slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.catalog.getCategoryBySlug(slug);
  }

  @Get(':id/spec-template')
  getSpecTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.getCategoryWithSpecTemplate(id);
  }

  @Get(':id/subcategories')
  listPublicSubcategories(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.listSubcategories(id);
  }
}

// ── Admin endpoints ───────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/catalog')
export class AdminCatalogController {
  constructor(private readonly catalog: CatalogService) {}

  // Category groups

  @Get('groups')
  adminListGroups() {
    return this.catalog.adminListGroups();
  }

  @Post('groups')
  createGroup(@Body() dto: CreateCategoryGroupDto) {
    return this.catalog.createGroup(dto);
  }

  @Patch('groups/:id')
  updateGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateCategoryGroupDto>,
  ) {
    return this.catalog.updateGroup(id, dto);
  }

  @Delete('groups/:id')
  deleteGroup(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deleteGroup(id);
  }

  @Post('groups/reorder')
  reorderGroups(@Body() dto: ReorderDto) {
    return this.catalog.reorderGroups(dto.ids);
  }

  // Categories

  @Get('categories')
  adminListCategories() {
    return this.catalog.listAllCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    return this.catalog.updateCategory(id, dto);
  }

  @Patch('categories/:id/deactivate')
  deactivateCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.softDeleteCategory(id);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.hardDeleteCategory(id);
  }

  @Post('categories/reorder')
  reorderCategories(@Body() dto: ReorderDto) {
    return this.catalog.reorderCategories(dto.ids);
  }

  @Post('categories/:id/image')
  @UseInterceptors(imageUpload)
  uploadCategoryImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.catalog.uploadCategoryImage(id, file);
  }

  // Subcategories

  @Get('categories/:id/subcategories')
  adminListSubcategories(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.listSubcategories(id);
  }

  @Post('subcategories')
  createSubcategory(@Body() dto: CreateSubcategoryDto) {
    return this.catalog.createSubcategory(dto);
  }

  @Patch('subcategories/:id')
  updateSubcategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<Omit<CreateSubcategoryDto, 'categoryId'>>,
  ) {
    return this.catalog.updateSubcategory(id, dto);
  }

  @Patch('subcategories/:id/deactivate')
  deactivateSubcategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.softDeleteSubcategory(id);
  }

  @Delete('subcategories/:id')
  deleteSubcategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.hardDeleteSubcategory(id);
  }

  @Post('categories/:id/subcategories/reorder')
  reorderSubcategories(
    @Param('id', ParseUUIDPipe) categoryId: string,
    @Body() dto: ReorderDto,
  ) {
    return this.catalog.reorderSubcategories(categoryId, dto.ids);
  }

  @Post('subcategories/:id/image')
  @UseInterceptors(imageUpload)
  uploadSubcategoryImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.catalog.uploadSubcategoryImage(id, file);
  }

  // Spec fields

  @Post('categories/:id/spec-fields')
  addSpecField(
    @Param('id', ParseUUIDPipe) categoryId: string,
    @Body() dto: AddSpecFieldDto,
  ) {
    return this.catalog.addSpecField(categoryId, dto);
  }

  @Patch('spec-fields/:id')
  updateSpecField(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<AddSpecFieldDto>,
  ) {
    return this.catalog.updateSpecField(id, dto);
  }

  @Delete('spec-fields/:id')
  deleteSpecField(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deleteSpecField(id);
  }

  @Post('categories/:id/spec-fields/reorder')
  reorderSpecFields(
    @Param('id', ParseUUIDPipe) categoryId: string,
    @Body() dto: ReorderDto,
  ) {
    return this.catalog.reorderSpecFields(categoryId, dto.ids);
  }
}
