import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SpecValidationModule } from '../spec-validation/spec-validation.module';

@Module({
  imports: [SubscriptionsModule, SpecValidationModule],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
