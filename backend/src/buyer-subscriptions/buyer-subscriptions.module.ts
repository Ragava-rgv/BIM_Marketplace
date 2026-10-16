import { Module } from '@nestjs/common';
import {
  BuyerSubscriptionsController,
  AdminBuyerSubscriptionsController,
} from './buyer-subscriptions.controller';
import { BuyerSubscriptionsService } from './buyer-subscriptions.service';

@Module({
  controllers: [
    BuyerSubscriptionsController,
    AdminBuyerSubscriptionsController,
  ],
  providers: [BuyerSubscriptionsService],
  exports: [BuyerSubscriptionsService],
})
export class BuyerSubscriptionsModule {}
