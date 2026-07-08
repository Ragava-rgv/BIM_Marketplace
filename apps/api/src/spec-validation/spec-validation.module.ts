import { Module } from '@nestjs/common';
import { SpecValidationService } from './spec-validation.service';

@Module({
  providers: [SpecValidationService],
  exports: [SpecValidationService],
})
export class SpecValidationModule {}
