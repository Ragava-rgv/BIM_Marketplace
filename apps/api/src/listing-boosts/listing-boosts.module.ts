import { Module } from '@nestjs/common';
import { ListingBoostsService } from './listing-boosts.service';
import { ListingBoostsController } from './listing-boosts.controller';

@Module({
  controllers: [ListingBoostsController],
  providers: [ListingBoostsService],
  exports: [ListingBoostsService],
})
export class ListingBoostsModule {}
