import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RequirementsController } from './requirements.controller';
import { QuotesController } from './quotes.controller';
import { RequirementsService } from './requirements.service';

@Module({
  imports: [PrismaModule, StorageModule, NotificationsModule],
  controllers: [RequirementsController, QuotesController],
  providers: [RequirementsService],
  exports: [RequirementsService],
})
export class RequirementsModule {}
