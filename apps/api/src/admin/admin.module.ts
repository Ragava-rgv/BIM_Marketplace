import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ListingsModule } from '../listings/listings.module';
import { RequirementsModule } from '../requirements/requirements.module';

@Module({
  imports: [ListingsModule, RequirementsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
