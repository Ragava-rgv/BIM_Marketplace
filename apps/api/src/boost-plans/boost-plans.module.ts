import { Module } from '@nestjs/common';
import { BoostPlansService } from './boost-plans.service';
import { BoostPlansController } from './boost-plans.controller';

@Module({
  controllers: [BoostPlansController],
  providers: [BoostPlansService],
  exports: [BoostPlansService],
})
export class BoostPlansModule {}
