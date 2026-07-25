import { Module } from '@nestjs/common';
import { BuyerSubscriptionPlansController } from './buyer-subscription-plans.controller';
import { BuyerSubscriptionPlansService } from './buyer-subscription-plans.service';

@Module({
  controllers: [BuyerSubscriptionPlansController],
  providers: [BuyerSubscriptionPlansService],
  exports: [BuyerSubscriptionPlansService],
})
export class BuyerSubscriptionPlansModule {}
