import { Module } from '@nestjs/common';
import { FinancePartnersController } from './finance-partners.controller';
import { FinancePartnersService } from './finance-partners.service';

@Module({
  controllers: [FinancePartnersController],
  providers: [FinancePartnersService],
  exports: [FinancePartnersService],
})
export class FinancePartnersModule {}
