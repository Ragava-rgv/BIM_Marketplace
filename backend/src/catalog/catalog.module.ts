import { Module } from '@nestjs/common';
import {
  AdminCatalogController,
  CategoriesController,
  CategoryGroupsController,
} from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [
    CategoryGroupsController,
    CategoriesController,
    AdminCatalogController,
  ],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
