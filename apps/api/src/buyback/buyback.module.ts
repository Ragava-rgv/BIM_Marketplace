import { Module } from '@nestjs/common';
import { BuybackController } from './buyback.controller';
import { BuybackService } from './buyback.service';

@Module({
  controllers: [BuybackController],
  providers: [BuybackService],
  exports: [BuybackService],
})
export class BuybackModule {}
